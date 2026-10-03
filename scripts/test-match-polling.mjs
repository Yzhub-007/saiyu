import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";
import ts from "typescript";
import * as refresh from "../lib/match-refresh.ts";

// Run the real hook with controlled React state, visibility, requests, and timers.
// No browser, server, credentials, network, or additional dependencies are needed.
const source = readFileSync(new URL("../app/_components/use-match-updates.ts", import.meta.url), "utf8");
const compiled = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText;

const flush = async () => {
  for (let index = 0; index < 6; index++) await Promise.resolve();
};

function createHarness({ hidden = false, respectAbort = true } = {}) {
  let state;
  let cleanup;
  let now = 0;
  let nextTimer = 0;
  const listeners = new Map();
  const timers = new Map();
  const requests = [];
  const combinedInputs = [];
  const document = {
    hidden,
    addEventListener: (key, listener) => listeners.set(key, listener),
    removeEventListener: (key, listener) => {
      if (listeners.get(key) === listener) listeners.delete(key);
    },
  };
  const react = {
    useRef: (current) => ({ current }),
    useCallback: (callback) => callback,
    useState: (initial) => {
      state = initial();
      return [state, (next) => { state = typeof next === "function" ? next(state) : next; }];
    },
    useEffect: (effect) => { cleanup = effect(); },
  };
  function addTimer(callback, delay, poll = false) {
    const id = ++nextTimer;
    timers.set(id, { callback, at: now + delay, delay, poll });
    return id;
  }
  const exports = {};
  vm.runInNewContext(compiled, {
    exports,
    require: (name) => {
      if (name === "react") return react;
      assert.equal(name, "@/lib/match-refresh"); return refresh;
    },
    AbortController,
    AbortSignal: {
      any: (signals) => {
        combinedInputs.push(signals);
        return AbortSignal.any(signals);
      },
      timeout: (delay) => {
        assert.equal(delay, 25_000);
        const controller = new AbortController();
        addTimer(() => controller.abort(new DOMException("Request timed out", "TimeoutError")), delay);
        return controller.signal;
      },
    },
    document,
    navigator: { onLine: true },
    window: {
      setTimeout: (callback, delay) => {
        assert.equal(delay, 30_000);
        return addTimer(callback, delay, true);
      },
      clearTimeout: (id) => timers.delete(id),
      addEventListener: document.addEventListener,
      removeEventListener: document.removeEventListener,
    },
    fetch: (url, options) => new Promise((resolve, reject) => {
      requests.push({ url, options, resolve, reject, requestSignal: combinedInputs.at(-1)[0] });
      if (respectAbort) {
        if (options.signal.aborted) reject(options.signal.reason);
        else options.signal.addEventListener("abort", () => reject(options.signal.reason), { once: true });
      }
    }),
  });
  return {
    api: exports,
    requests,
    get state() { return state; },
    get intervals() { return [...timers.values()].filter((timer) => timer.poll).length; },
    async advance(milliseconds) {
      const target = now + milliseconds;
      while (true) {
        const next = [...timers].filter(([, timer]) => timer.at <= target).sort((a, b) => a[1].at - b[1].at)[0];
        if (!next) break;
        const [id, timer] = next;
        now = timer.at;
        timers.delete(id);
        timer.callback();
        await flush();
      }
      now = target;
      await flush();
    },
    tickIntervals() {
      for (const [id, timer] of [...timers]) if (timer.poll) { timers.delete(id); timer.callback(); }
    },
    show(visible) {
      document.hidden = !visible;
      listeners.get("visibilitychange")?.();
    },
    close() {
      cleanup?.();
      assert.equal(this.intervals, 0);
      assert.equal(listeners.size, 0);
    },
  };
}

const seed = {
  id: "panda-1", freshness: "2026-09-27T01:00:00Z", scoreA: 0, scoreB: 0,
  startsAt: "2026-09-27T01:00:00Z", status: "live", game: "cs2", gameName: "CS2", league: "Test", tournamentId: "t1", stage: "Final", timeLabel: "进行中", bestOf: "BO3",
  teamA: "Alpha", teamAShort: "ALP", teamAId: "a", teamAColor: "#fff",
  teamB: "Beta", teamBShort: "BET", teamBId: "b", teamBColor: "#fff",
  detail: "", streamUrl: "", streamPlatform: "", language: "", games: [],
};
const newer = { ...seed, freshness: "2026-09-27T01:01:00Z", scoreA: 1 };
const latest = { ...seed, freshness: "2026-09-27T01:02:00Z", scoreA: 2 };
const options = { source: "pandascore", stale: false };
const response = (data, stale = false, source = "pandascore") => ({
  ok: true,
  json: async () => ({ data, meta: { stale, source, generatedAt: (Array.isArray(data) ? data.at(-1)?.freshness : data?.freshness) ?? seed.freshness } }),
});

const list = createHarness();
list.api.useMatchUpdates([seed], options);
assert.equal(list.requests.length, 1);
assert.equal(list.requests[0].url, "/api/v1/matches");
assert.equal(list.requests[0].options.cache, "no-store");
list.tickIntervals();
assert.equal(list.requests.length, 1, "pending requests must not overlap");
list.requests[0].resolve(response([seed, newer]));
await flush();
assert.equal(list.state.updatedAt, newer.freshness, "the displayed time comes from server acquisition metadata");
assert.equal(list.state.matches[1].scoreA, 1);
await list.advance(29_999);
assert.equal(list.requests.length, 1);
await list.advance(1);
assert.equal(list.requests.length, 2, "the next poll begins after 30 seconds");
list.requests[1].resolve(response([latest], true));
await flush();
assert.equal(list.state.stale, true);
assert.equal(list.state.updatedAt, newer.freshness);
assert.equal(list.state.matches.length, 2, "a stale snapshot cannot replace successful data");
await list.advance(30_000);
list.requests[2].reject(new Error("offline"));
await flush();
assert.equal(list.state.stale, true);
assert.equal(list.state.updatedAt, newer.freshness);
await list.advance(30_000);
list.requests[3].resolve({ ok: false });
await flush();
assert.equal(list.state.updatedAt, newer.freshness, "HTTP errors retain the successful timestamp");
await list.advance(30_000);
list.requests[4].resolve(response([latest], false, "demo"));
await flush();
assert.equal(list.state.stale, true);
assert.equal(list.state.updatedAt, newer.freshness, "a changed source cannot silently replace live data");
list.close();

const visibility = createHarness({ respectAbort: false });
visibility.api.useMatchUpdates([seed], options);
const oldRequest = visibility.requests[0];
visibility.show(false);
assert.equal(oldRequest.options.signal.aborted, true);
assert.equal(visibility.intervals, 0);
visibility.tickIntervals();
assert.equal(visibility.requests.length, 1);
visibility.show(true);
assert.equal(visibility.requests.length, 2, "becoming visible triggers an immediate refresh");
oldRequest.resolve(response([latest]));
await flush();
assert.equal(visibility.state.updatedAt, seed.freshness, "aborted responses cannot commit");
visibility.tickIntervals();
assert.equal(visibility.requests.length, 2, "an old finally block cannot clear the new request");
visibility.requests[1].resolve(response([newer]));
await flush();
assert.equal(visibility.state.stale, false);
assert.equal(visibility.state.updatedAt, newer.freshness);
visibility.tickIntervals();
const pending = visibility.requests[2];
visibility.close();
assert.equal(pending.options.signal.aborted, true);
pending.resolve(response([latest]));
await flush();
assert.equal(visibility.state.updatedAt, newer.freshness, "unmounted requests cannot commit");

const hidden = createHarness({ hidden: true });
hidden.api.useMatchUpdates([seed], { ...options, stale: true });
await hidden.advance(60_000);
assert.equal(hidden.requests.length, 0);
hidden.show(true);
assert.equal(hidden.requests.length, 1);
hidden.close();

const timeout = createHarness();
timeout.api.useMatchUpdates([seed], options);
await timeout.advance(24_999);
assert.equal(timeout.requests[0].options.signal.aborted, false);
assert.equal(timeout.state.stale, false);
await timeout.advance(1);
assert.equal(timeout.requests[0].options.signal.aborted, true);
assert.equal(timeout.requests[0].requestSignal.aborted, false, "timeout must not look like an intentional cancellation");
assert.equal(timeout.state.stale, true, "a timeout marks retained data stale");
assert.equal(timeout.state.updatedAt, seed.freshness);
assert.equal(timeout.state.matches[0], seed);
await timeout.advance(29_999);
assert.equal(timeout.requests.length, 1);
await timeout.advance(1);
assert.equal(timeout.requests.length, 2, "the next poll starts 30 seconds after the failed request finishes");
timeout.requests[1].resolve(response([newer]));
await flush();
assert.equal(timeout.state.stale, false);
assert.equal(timeout.state.updatedAt, newer.freshness);
timeout.close();

const detail = createHarness();
detail.api.useMatchUpdate({ ...seed, id: "panda/a b" }, options);
assert.equal(detail.requests[0].url, "/api/v1/matches/panda%2Fa%20b");
detail.requests[0].resolve(response({ ...newer, id: "panda/a b" }));
await flush();
assert.equal(detail.state.matches[0].scoreA, 1);
await detail.advance(30_000);
detail.requests[1].resolve(response(null));
await flush();
assert.equal(detail.state.stale, true);
assert.equal(detail.state.matches[0].scoreA, 1);
detail.close();

for (const hook of ["useMatchUpdates", "useMatchUpdate"]) {
  const demo = createHarness();
  demo.api[hook](hook === "useMatchUpdates" ? [seed] : seed, { source: "demo", stale: false });
  await demo.advance(90_000);
  demo.show(false);
  demo.show(true);
  assert.equal(demo.requests.length, 0, `${hook} must never poll demo data`);
  assert.equal(demo.intervals, 0);
  demo.close();
}

assert.equal(list.api.formatMatchUpdateTime(null), "—");
assert.equal(list.api.formatMatchUpdateTime("38 秒前"), "—");
assert.match(list.api.formatMatchUpdateTime(newer.freshness), /\d+\/\d+.*\d{2}:\d{2}:\d{2}/);
console.log("PASS: polling cadence, no overlap, stale/error retention, source freshness, visibility, races, cleanup, detail polling, demo opt-out, and 25s timeout recovery.");
