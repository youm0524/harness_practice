import { describe, expect, it } from "vitest";
import { formatLocalStorageNotice } from "./appInfo";

describe("formatLocalStorageNotice", () => {
  it("states that profile data stays in the local browser", () => {
    expect(formatLocalStorageNotice("ApplyMate")).toBe(
      "ApplyMate 프로필은 이 브라우저에만 저장됩니다."
    );
  });
});
