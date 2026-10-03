import assert from "node:assert/strict";
import test from "node:test";
import { mergeMatchCollections } from "../lib/match-collections.ts";
import { readMatchSnapshot, readMatchSync, reconcileMatchSnapshot } from "../lib/match-refresh.ts";
import { PandaScoreAdapter } from "../lib/data-sources/pandascore.ts";

const oldTime = "2026-10-04T01:00:00.000Z";
const newTime = "2026-10-04T01:01:00.000Z";
const laterTime = "2026-10-04T01:02:00.000Z";
const kinds = ["running", "upcoming", "past"];
const match = (id, status = "live", freshness = oldTime, scoreA = 0) => ({
  id, status, freshness, scoreA, scoreB: 0, startsAt: oldTime,
  game: "cs2", gameName: "CS2", league: "Test", tournamentId: "t1", stage: "Final", timeLabel: "进行中", bestOf: "BO3",
  teamA: "Alpha", teamAShort: "ALP", teamAId: "a", teamAColor: "#fff",
  teamB: "Beta", teamBShort: "BET", teamBId: "b", teamBColor: "#fff",
  detail: "", streamUrl: "", streamPlatform: "", language: "", games: [],
});
const success = (kind, matches = [], fetchedAt = newTime) => ({ kind, matches, fetchedAt, ok: true });
const failure = (kind) => ({ kind, ok: false, error: "timeout" });
const initial = (matches) => mergeMatchCollections(null, kinds.map((kind) => success(kind, matches.filter((row) => ({ live: "running", upcoming: "upcoming", complete: "past" })[row.status] === kind), oldTime)), oldTime);
const payload = (stored) => ({ data: stored.matches, meta: { source: "pandascore", stale: stored.sync.status !== "fresh", generatedAt: stored.fetchedAt, sync: stored.sync } });

test("partial refresh advances healthy scores without changing failed collection clocks", () => {
  const before = initial([match("live"), match("next", "upcoming")]);
  const result = mergeMatchCollections(before, [success("running", [match("live", "live", newTime, 1)]), failure("upcoming"), success("past")], newTime);
  assert.equal(result.matches.find((row) => row.id === "live").scoreA, 1);
  assert.equal(result.matches.find((row) => row.id === "next").freshness, oldTime);
  assert.deepEqual(result.sync.collections.upcoming, { state: "cached", fetchedAt: oldTime });
  assert.equal(result.sync.lastFullSuccessAt, oldTime);
  assert.equal(result.sync.status, "partial");
});

test("a successful past list moves failed running records to complete, without duplicates", () => {
  const result = mergeMatchCollections(initial([match("same")]), [failure("running"), success("upcoming"), success("past", [match("same", "complete", newTime, 2)])], newTime);
  assert.equal(result.matches.length, 1);
  assert.equal(result.matches[0].status, "complete");
  assert.equal(result.sync.collections.running.state, "cached");
});

test("cross-list conflicts always choose the advanced state independent of order", () => {
  const results = [success("running", [match("same", "live", newTime)]), success("upcoming", [match("same", "upcoming", newTime)]), success("past", [match("same", "complete", newTime)])];
  for (const order of [results, [...results].reverse()]) {
    const merged = mergeMatchCollections(null, order, newTime);
    assert.equal(merged.matches.length, 1);
    assert.equal(merged.matches[0].status, "complete");
  }
});

test("a later lower-state response cannot resurrect a completed match", () => {
  const previous = initial([match("done", "complete", oldTime, 2)]);
  const result = mergeMatchCollections(previous, [success("running", [match("done", "live", newTime, 0)]), success("upcoming"), success("past")], newTime);
  assert.equal(result.matches[0].status, "complete");
  assert.equal(result.matches[0].scoreA, 2);
  assert.equal(result.matches[0].freshness, oldTime);
});

test("empty successful collections clear old active rows but not the result archive", () => {
  const result = mergeMatchCollections(initial([match("live"), match("next", "upcoming"), match("done", "complete")]), kinds.map((kind) => success(kind)), newTime);
  assert.deepEqual(result.matches.map((row) => row.id), ["done"]);
  assert.equal(result.sync.status, "fresh");
  const empty = mergeMatchCollections(null, kinds.map((kind) => success(kind)), newTime);
  assert.deepEqual(empty.matches, []);
  assert.ok(readMatchSnapshot(payload(empty), "pandascore"));
});

test("all failures keep last success times and cannot replace client data", () => {
  const before = initial([match("live")]);
  const failed = mergeMatchCollections(before, kinds.map(failure), newTime);
  assert.deepEqual(failed.matches, before.matches);
  assert.equal(failed.fetchedAt, oldTime);
  assert.equal(failed.sync.lastFullSuccessAt, oldTime);
  assert.equal(failed.sync.status, "stale");
  assert.equal(readMatchSnapshot(payload(failed), "pandascore"), null);
});

test("cold partial data distinguishes unavailable collections from successful empty results", () => {
  const partial = mergeMatchCollections(null, [success("running"), failure("upcoming"), failure("past")], newTime);
  assert.equal(partial.sync.collections.running.state, "fresh");
  assert.deepEqual(partial.sync.collections.upcoming, { state: "unavailable", fetchedAt: null });
  assert.equal(partial.sync.lastFullSuccessAt, null);
  assert.equal(readMatchSnapshot(payload(partial), "pandascore").stale, true);
});

test("partial snapshots preserve their metadata through persistence and recovery", () => {
  const partial = mergeMatchCollections(initial([match("next", "upcoming")]), [success("running"), failure("upcoming"), failure("past")], newTime);
  const restored = JSON.parse(JSON.stringify(partial));
  assert.deepEqual(readMatchSync(restored.sync), partial.sync);
  const failed = mergeMatchCollections(restored, kinds.map(failure), laterTime);
  assert.equal(failed.fetchedAt, newTime);
  assert.equal(failed.sync.collections.upcoming.fetchedAt, oldTime);
  assert.equal(failed.matches[0].freshness, oldTime);
});

test("client rejects inconsistent partial health and missing collection metadata", () => {
  const partial = mergeMatchCollections(null, [success("running"), failure("upcoming"), failure("past")], newTime);
  for (const change of [
    (body) => { body.meta.sync.status = "fresh"; },
    (body) => { delete body.meta.sync.collections.past; },
    (body) => { body.meta.sync.collections.running.fetchedAt = null; },
    (body) => { body.meta.stale = false; },
  ]) {
    const body = structuredClone(payload(partial)); change(body);
    assert.equal(readMatchSnapshot(body, "pandascore"), null);
  }
});

test("newer aggregate time cannot roll back individual cached rows from another worker", () => {
  const partial = mergeMatchCollections(initial([match("live")]), [failure("running"), success("upcoming"), failure("past")], laterTime);
  const snapshot = readMatchSnapshot(payload(partial), "pandascore");
  const previous = [match("live", "live", newTime, 1), match("extra", "live", newTime)];
  const reconciled = reconcileMatchSnapshot(snapshot, previous);
  assert.equal(reconciled.matches.find((row) => row.id === "live").scoreA, 1);
  assert.ok(reconciled.matches.some((row) => row.id === "extra"));
});

test("completed archive is bounded", () => {
  const rows = Array.from({ length: 1_020 }, (_, index) => match(`done-${index}`, "complete"));
  assert.equal(initial(rows).matches.length, 1_000);
});

test("adapter returns successes alongside failed or malformed collections", async (context) => {
  context.mock.method(globalThis, "fetch", async (url) => {
    const kind = new URL(url).pathname.split("/").at(-1);
    if (kind === "running") return Response.json([{ id: 1, status: "running", videogame: { slug: "cs2" } }]);
    if (kind === "upcoming") return Response.json({ invalid: true });
    return new Response("unavailable", { status: 503 });
  });
  const results = await new PandaScoreAdapter("test-only").listCollections();
  assert.equal(results[0].ok, true);
  assert.equal(results[0].matches.length, 1);
  assert.equal(results[1].ok, false);
  assert.equal(results[2].ok, false);
});

test("rate limits are not immediately retried and valid empty lists succeed", async (context) => {
  let calls = 0;
  const mocked = context.mock.method(globalThis, "fetch", async (_url, options) => {
    calls++;
    assert.ok(options.signal instanceof AbortSignal);
    return new Response("rate limited", { status: 429, headers: { "Retry-After": "60" } });
  });
  const limited = await new PandaScoreAdapter("test-only").listCollections();
  assert.equal(calls, 3);
  assert.ok(limited.every((result) => !result.ok));
  mocked.mock.mockImplementation(async () => Response.json([]));
  const empty = await new PandaScoreAdapter("test-only").listCollections();
  assert.ok(empty.every((result) => result.ok && !result.matches.length));
});
