import { describe, expect, it } from "vitest";

import { loadNativeBinding } from "../dist/native.js";

describe("native binding", () => {
  it("loads the napi-rs addon", () => {
    expect(loadNativeBinding().nativeSmoke()).toBe("acadrust-js native binding");
  });
});
