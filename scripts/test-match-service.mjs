import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import vm from "node:vm";
import ts from "typescript";
import * as collections from "../lib/match-collections.ts";
import * as refresh from "../lib/match-refresh.ts";

// Exercise the actual service and routes with an isolated clock, adapter and DB.
// No real credentials, network calls, persistent DB or framework runtime are used.
async function compile(relativePath) {
  const source = await readFile(new URL(relativePath, import.meta.url), "utf8");
  return ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
}

const [serviceCode, detailRouteCode, listRouteCode] = await Promise.all([
  compile("../lib/matches-service.ts"),
  compile("../app/api/v1/matches/[id]/route.ts"),
  compile("../app/api/v1/matches/route.ts"),
]);
const initialTime = "2026-09-28T00:00:00Z";
const logoUrl = "https://example.com/team.png";

function match(id = "panda-1", logo = logoUrl) {
  return {
    id, game: "lol", gameName: "LoL", status: "live", startsAt: initialTime,
    teamAId: "team-a", teamBId: "team-b", teamA: "A", teamB: "B",
    teamAShort: "A", teamBShort: "B", teamAColor: "#fff", teamBColor: "#000",
    teamALogo: logo, teamBLogo: null, tournamentId: "tournament", league: "League",
    freshness: initialTime,
    stage: "Final", bestOf: "BO3", timeLabel: "进行中", scoreA: 0, scoreB: 0,
    detail: "", streamUrl: "", streamPlatform: "", language: "",
  };
}

function harness(seed = null) {
  let now = Date.parse(initialTime);
  let snapshot = seed;
  const state = {
    lists: 0,
    details: 0,
    writes: 0,
    list: async () => [{ data: match() }],
    collections: null,
    detail: async (id) => ({ data: match(id), fetchedAt: new Date(now).toISOString() }),
  };
  class FakeDate extends Date {
    constructor(...args) { super(...(args.length ? args : [now])); }
    static now() { return now; }
  }
  class Adapter {
    async listCollections() {
      state.lists++;
      if (state.collections) return state.collections();
      const rows = await state.list();
      return ["running", "upcoming", "past"].map((kind) => ({
        kind, ok: true, fetchedAt: new Date(now).toISOString(),
        matches: rows.map((row) => ({ ...row.data, freshness: new Date(now).toISOString() }))
          .filter((row) => collections.collectionForMatch(row) === kind),
      }));
    }
    async getMatch(id) { state.details++; return state.detail(id); }
  }
  const db = {
    insert() {
      return {
        values(value) {
          return {
            async onConflictDoUpdate() { state.writes++; snapshot = value; },
          };
        },
      };
    },
    select() {
      return {
        from() {
          return {
            where() {
              return { async limit() { return snapshot ? [snapshot] : []; } };
            },
          };
        },
      };
    },
  };
  const modules = {
    "drizzle-orm": { eq: () => null, sql: () => null },
    "@/db": { getDb: () => db },
    "@/db/schema": { matchSnapshots: { key: "key" } },
    "./esports-data": { matches: [], getMatch: () => null },
    "./data-sources/pandascore": { PandaScoreAdapter: Adapter },
    "./match-collections": collections,
    "./match-refresh": refresh,
    "./external-data-sources": { getExternalDataSourcesForGame: () => [] },
  };
  const api = {};
  vm.runInNewContext(serviceCode, {
    exports: api,
    require(id) {
      assert.ok(Object.hasOwn(modules, id), `Unexpected service dependency: ${id}`);
      return modules[id];
    },
    process: { env: { PANDASCORE_TOKEN: "mock-only-placeholder" } },
    Date: FakeDate,
    Error,
    console: { error() {}, warn() {} },
  });
  return { api, state, snapshot: () => snapshot, advance: (ms) => { now += ms; } };
}

function route(code, service) {
  const exports = {};
  vm.runInNewContext(code, {
    exports,
    require(id) {
      assert.equal(id, "@/lib/matches-service");
      return service;
    },
    Response,
    URL,
  });
  return exports;
}

test("concurrent list requests share one refresh and snapshot write", async () => {
  const h = harness();
  const batch = await Promise.all(Array.from({ length: 8 }, () => h.api.listMatches()));
  assert.equal(h.state.lists, 1);
  assert.equal(h.state.writes, 1);
  h.advance(20_000);
  const cached = await h.api.listMatches();
  assert.equal(cached.meta.generatedAt, batch[0].meta.generatedAt);
  assert.equal(h.state.lists, 1);
  assert.equal(h.state.writes, 1);
});

test("failed list refresh preserves data and timestamp until a successful retry", async () => {
  const h = harness();
  const first = await h.api.listMatches();
  h.advance(31_000);
  h.state.list = async () => { throw new Error("temporary failure token=mock-sensitive-value"); };
  const stale = await h.api.listMatches();
  assert.equal(stale.meta.stale, true);
  assert.equal(stale.data.length, 1);
  assert.equal(stale.meta.generatedAt, first.meta.generatedAt);
  assert.match(stale.meta.warning, /token=\[redacted\]/);
  assert.ok(!stale.meta.warning.includes("mock-sensitive-value"));
  assert.equal((await h.api.listMatches()).meta.stale, true);
  assert.equal(h.state.lists, 2);
  assert.equal(h.state.writes, 1);
  h.advance(31_000);
  h.state.list = async () => [{ data: match("panda-1", null) }];
  const recovered = await h.api.listMatches();
  assert.equal(recovered.meta.stale, false);
  assert.notEqual(recovered.meta.generatedAt, first.meta.generatedAt);
  assert.equal(recovered.data[0].teamALogo, logoUrl);
  assert.equal(h.state.writes, 2);
});

test("disk snapshot fallback remains stale on repeated cache hits", async () => {
  const fetchedAt = "2026-09-27T00:00:00Z";
  const h = harness({ payload: JSON.stringify([match()]), fetchedAt });
  h.state.list = async () => { throw new Error("offline"); };
  for (let i = 0; i < 2; i++) {
    const result = await h.api.listMatches();
    assert.equal(result.meta.stale, true);
    assert.equal(result.meta.generatedAt, fetchedAt);
    assert.equal(result.data[0].id, "panda-1");
  }
  assert.equal(h.state.lists, 1);
  assert.equal(h.state.writes, 0);
});

test("concurrent detail requests share a refresh and failures preserve old detail", async () => {
  const h = harness();
  h.state.list = async () => [];
  const batch = await Promise.all(Array.from({ length: 6 }, () => h.api.findMatch("panda-1")));
  assert.equal(h.state.details, 1);
  h.advance(31_000);
  h.state.detail = async () => { throw new Error("offline"); };
  const stale = await h.api.findMatch("panda-1");
  assert.equal(stale.data.id, "panda-1");
  assert.equal(stale.meta.stale, true);
  assert.equal(stale.meta.generatedAt, batch[0].meta.generatedAt);
  assert.equal((await h.api.findMatch("panda-1")).meta.stale, true);
  assert.equal(h.state.details, 2);
});

test("fresh list records avoid paid detail calls, missing records cannot be invented", async () => {
  const h = harness();
  const listed = await h.api.listMatches();
  h.advance(10_000);
  h.state.detail = async () => { throw new Error("offline"); };
  const fallback = await h.api.findMatch("panda-1");
  assert.equal(fallback.data.id, "panda-1");
  assert.equal(fallback.meta.stale, false);
  assert.equal(fallback.meta.generatedAt, listed.meta.generatedAt);
  assert.equal(h.state.details, 0);
  const unavailable = await h.api.findMatch("panda-2");
  assert.equal(unavailable.data, null);
  assert.equal(unavailable.meta.stale, true);
});

test("authoritative not found remains fresh null and is cached", async () => {
  const h = harness();
  h.state.detail = async () => null;
  const missing = await h.api.findMatch("panda-404");
  assert.equal(missing.data, null);
  assert.equal(missing.meta.stale, false);
  await h.api.findMatch("panda-404");
  assert.equal(h.state.details, 1);
});

test("detail cache evicts the least recently used match beyond 200 entries", async () => {
  const h = harness();
  h.state.list = async () => [];
  for (let i = 0; i <= 200; i++) await h.api.findMatch(`panda-${i}`);
  assert.equal(h.state.details, 201);
  await h.api.findMatch("panda-200");
  assert.equal(h.state.details, 201);
  await h.api.findMatch("panda-0");
  assert.equal(h.state.details, 202);
});

test("team and tournament summaries preserve a logo when another match has none", async () => {
  const h = harness();
  h.state.list = async () => [{ data: match("panda-1") }, { data: match("panda-2", null) }];
  assert.equal((await h.api.listTeams())[0].logo, logoUrl);
  assert.equal((await h.api.listTournaments())[0].teams[0].logo, logoUrl);
});

test("service saves partial health and restores failed collections after a cold start", async () => {
  const h = harness();
  await h.api.listMatches();
  h.advance(31_000);
  const fetchedAt = "2026-09-28T00:00:31.000Z";
  h.state.collections = async () => [
    { kind: "running", ok: true, fetchedAt, matches: [{ ...match(), freshness: fetchedAt, scoreA: 1 }] },
    { kind: "upcoming", ok: false, error: "timeout" },
    { kind: "past", ok: true, fetchedAt, matches: [] },
  ];
  const partial = await h.api.listMatches();
  assert.equal(partial.meta.sync.status, "partial");
  assert.equal(partial.meta.stale, true);
  assert.equal(partial.data[0].scoreA, 1);
  assert.equal((await h.api.findMatch("panda-1")).meta.stale, false, "healthy match detail remains usable");
  assert.equal(h.state.details, 0);
  assert.equal(JSON.parse(h.snapshot().payload).version, 2);
  const cold = harness(h.snapshot());
  cold.state.list = async () => { throw new Error("offline"); };
  const restored = await cold.api.listMatches();
  assert.equal(restored.data[0].scoreA, 1);
  assert.equal(restored.meta.generatedAt, partial.meta.generatedAt);
  assert.equal(restored.meta.sync.collections.running.fetchedAt, fetchedAt);
  assert.equal(restored.meta.sync.collections.upcoming.fetchedAt, "2026-09-28T00:00:00.000Z");
  assert.equal(restored.meta.sync.status, "stale");
});

test("detail API uses no-store and distinguishes 200, 404 and 503", async () => {
  for (const [data, stale, status] of [[match(), true, 200], [null, false, 404], [null, true, 503]]) {
    const handler = route(detailRouteCode, {
      findMatch: async () => ({ data, meta: { stale, source: "pandascore" } }),
    });
    const response = await handler.GET(new Request("https://example.com/api"), {
      params: Promise.resolve({ id: "panda-1" }),
    });
    assert.equal(response.status, status);
    assert.equal(response.headers.get("cache-control"), "no-store");
    const body = await response.json();
    if (status === 404) assert.equal(body.error, "match_not_found");
    if (status === 503) assert.equal(body.error, "match_unavailable");
  }
});

test("list API uses no-store while retaining count and source metadata", async () => {
  const handler = route(listRouteCode, {
    listMatches: async () => ({ data: [match()], meta: { stale: false, source: "pandascore" } }),
  });
  const response = await handler.GET(new Request("https://example.com/api?game=lol"));
  assert.equal(response.headers.get("cache-control"), "no-store");
  const body = await response.json();
  assert.equal(body.meta.count, 1);
  assert.equal(body.meta.demo, false);
});
