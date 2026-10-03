import assert from "node:assert/strict";
import test from "node:test";
import { readMatchSnapshot, isOlderSnapshot } from "../lib/match-refresh.ts";
import { readSearchQuery, searchPageWindow } from "../lib/search-query.ts";

const generatedAt = "2026-10-03T08:00:00Z";
const match = {
  id: "panda-test", game: "cs2", gameName: "CS2", league: "Test", tournamentId: "t1", stage: "Final", status: "live",
  startsAt: generatedAt, freshness: generatedAt, timeLabel: "进行中", bestOf: "BO3",
  teamA: "Team Alpha", teamAShort: "ALP", teamAId: "a", teamAColor: "#fff", scoreA: 1,
  teamB: "Team Beta", teamBShort: "BET", teamBId: "b", teamBColor: "#fff", scoreB: 0,
  detail: "", streamUrl: "", streamPlatform: "", language: "", games: [],
};
const response = (data = [match]) => ({ data, meta: { source: "pandascore", stale: false, generatedAt } });

test("fresh snapshots use server acquisition time, including an empty result", () => {
  assert.deepEqual(readMatchSnapshot(response(), "pandascore"), { matches: [match], updatedAt: generatedAt });
  assert.deepEqual(readMatchSnapshot(response([]), "pandascore"), { matches: [], updatedAt: generatedAt });
});
test("stale, wrong-source and invalid timestamp responses cannot replace data", () => {
  for (const change of [{ stale: true }, { source: "demo" }, { generatedAt: "bad-date" }]) {
    const payload = response(); Object.assign(payload.meta, change);
    assert.equal(readMatchSnapshot(payload, "pandascore"), null);
  }
});
test("malformed scores, fields and game arrays are rejected", () => {
  for (const change of [{ scoreA: -1 }, { status: "invalid" }, { teamA: null }, { games: {} }, { games: [{ id: "g1", position: 0, status: "live", winnerId: null }] }]) {
    assert.equal(readMatchSnapshot(response([{ ...match, ...change }]), "pandascore"), null);
  }
});
test("detail responses must match the requested match", () => {
  assert.ok(readMatchSnapshot(response(match), "pandascore", match.id));
  assert.equal(readMatchSnapshot(response(match), "pandascore", "another-match"), null);
  assert.equal(readMatchSnapshot(response(null), "pandascore", match.id), null);
});
test("older worker snapshots cannot roll scores backwards", () => {
  const next = readMatchSnapshot(response(), "pandascore");
  assert.equal(isOlderSnapshot(next, "2026-10-03T08:01:00Z"), true);
  assert.equal(isOlderSnapshot(next, generatedAt), false);
  assert.equal(isOlderSnapshot(next, null), false);
});
test("repeated query parameters and invalid page values are safe", () => {
  assert.deepEqual(readSearchQuery({ q: ["  T1  ", "ignored"], page: ["2", "3"] }), { query: "T1", normalized: "t1", requestedPage: 2 });
  for (const page of ["NaN", "-1", "0", "1.5", "Infinity"]) assert.equal(readSearchQuery({ page }).requestedPage, 1);
  assert.equal(readSearchQuery({ q: "x".repeat(500) }).query.length, 120);
});
test("search pagination includes every category and clamps out-of-range pages", () => {
  assert.deepEqual(searchPageWindow([25, 3, 85], [12, 12, 20], 2), { page: 2, pages: 5, offsets: [12, 12, 20] });
  assert.equal(searchPageWindow([25, 3, 85], [12, 12, 20], 999).page, 5);
  assert.equal(searchPageWindow([0, 0, 0], [12, 12, 20], 5).page, 1);
});
