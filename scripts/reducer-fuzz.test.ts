/**
 * Reducer fuzz invariants as a bun test, so CI runs them without remembering
 * the script. Smaller seed count than the CLI default to keep tests fast;
 * the full 300-seed run stays available via `bun scripts/reducer-fuzz.ts`.
 */

import { describe, expect, test } from "bun:test";

import { runFuzzer } from "./reducer-fuzz";

describe("workspace reducer fuzzer", () => {
 test("random action sequences preserve state invariants", () => {
  const failures = runFuzzer(60, 40, { quiet: true });
  expect(failures).toBe(0);
 });
});
