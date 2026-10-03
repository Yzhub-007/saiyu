import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import ts from "typescript";

// Load the pure adapter without Next/Vinext or an actual provider credential.
const source = await readFile(new URL("../lib/data-sources/pandascore.ts", import.meta.url), "utf8");
const { outputText } = ts.transpileModule(source, { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ES2022 } });
const { PandaScoreAdapter } = await import(`data:text/javascript;base64,${Buffer.from(outputText).toString("base64")}`);
const base = {
  id: 42, status: "running", begin_at: "2026-09-28T01:00:00Z", number_of_games: 3,
  videogame: { slug: "cs-go" },
  opponents: [{ opponent: { id: 12, name: "Alpha", image_url: "https://cdn-api.pandascore.co/alpha.png" } }, { opponent: { id: 34, name: "Beta" } }],
  results: [{ team_id: 34, score: 2 }, { team_id: 12, score: 0 }],
  games: [{ id: 102, position: 2, status: "running" }, { id: 101, position: 1, status: "finished", winner: { id: 34 } }],
  live: { supported: false },
};

async function mapped(row) {
  const original = globalThis.fetch;
  globalThis.fetch = async () => Response.json(row);
  try { return (await new PandaScoreAdapter("test-only").getMatch("panda-42")).data; }
  finally { globalThis.fetch = original; }
}

test("real logos survive normalization; missing logo stays null", async () => {
  const match = await mapped(base);
  assert.equal(match.teamALogo, "https://cdn-api.pandascore.co/alpha.png");
  assert.equal(match.teamBLogo, null);
});
test("unsafe logo URLs are rejected", async () => {
  for (const image_url of ["javascript:alert(1)", "http://cdn.test/a.png", "https://user:secret@cdn.test/a.png", "broken"]) {
    const match = await mapped({ ...base, opponents: [{ opponent: { id: 12, image_url } }] });
    assert.equal(match.teamALogo, null);
  }
});
test("scores map by team ID, preserving zero and not opponent order", async () => {
  const match = await mapped(base);
  assert.equal(match.scoreA, 0); assert.equal(match.scoreB, 2);
});
test("missing or invalid scores are unknown, never invented as 0", async () => {
  for (const results of [undefined, [], [{ team_id: 12, score: -1 }], [{ team_id: 12, score: "1" }]]) {
    const match = await mapped({ ...base, results });
    assert.equal(match.scoreA, null); assert.equal(match.scoreB, null);
  }
});
test("upcoming matches do not show a stale series score", async () => {
  const match = await mapped({ ...base, status: "not_started" });
  assert.equal(match.scoreA, null); assert.equal(match.scoreB, null);
});
test("single games retain order, status and winner, not fictitious round scores", async () => {
  const match = await mapped(base);
  assert.deepEqual(match.games, [
    { id: "101", position: 1, status: "complete", winnerId: "panda-team-34", mapName: null },
    { id: "102", position: 2, status: "live", winnerId: null, mapName: null },
  ]);
  assert.equal(match.scoreCoverage, "not-covered");
});
test("provider live coverage is not represented as working realtime permission", async () => {
  assert.equal((await mapped({ ...base, live: { supported: true } })).scoreCoverage, "unavailable");
  assert.equal((await mapped({ ...base, live: { supported: true }, videogame: { slug: "valorant" } })).scoreCoverage, "not-covered");
});
test("partial collection outage preserves independently successful collections", async () => {
  const original = globalThis.fetch;
  globalThis.fetch = async (url) => String(url).includes("/running") ? new Response(null, { status: 503 }) : Response.json([base]);
  try {
    const collections = await new PandaScoreAdapter("test-only").listCollections();
    assert.equal(collections[0].ok, false);
    assert.equal(collections[1].ok, true);
    assert.equal(collections[2].ok, true);
  }
  finally { globalThis.fetch = original; }
});
test("invalid IDs cause no provider call; not found remains null", async () => {
  const original = globalThis.fetch;
  let calls = 0;
  globalThis.fetch = async () => { calls++; return new Response(null, { status: 404 }); };
  try {
    const adapter = new PandaScoreAdapter("test-only");
    assert.equal(await adapter.getMatch("../../secret"), null); assert.equal(calls, 0);
    assert.equal(await adapter.getMatch("panda-42"), null); assert.equal(calls, 1);
  } finally { globalThis.fetch = original; }
});
