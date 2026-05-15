import { describe, expect, it } from "vitest";

import { ACADRUST_READ_ERROR, readDxf, readDxfSync } from "../dist/index.js";

describe("readDxf", () => {
  it("reads a DXF fixture and exposes a summary", async () => {
    const doc = await readDxf("fixtures/simple-line.dxf");

    expect(doc.version).toBe("AC1015");
    expect(doc.summary()).toEqual({
      version: "AC1015",
      entityCount: 1,
      layers: ["0"],
      blocks: ["*Model_Space", "*Paper_Space"],
      unsupportedEntityCount: 0,
    });
  });

  it("supports the sync DXF reader", () => {
    const doc = readDxfSync("fixtures/simple-line.dxf");

    expect(doc.summary().entityCount).toBe(1);
  });

  it("maps async read failures to a stable read error", async () => {
    await expect(readDxf("fixtures/missing.dxf")).rejects.toMatchObject({
      code: ACADRUST_READ_ERROR,
    });
  });

  it("maps missing files to a stable read error", () => {
    expect(() => readDxfSync("fixtures/missing.dxf")).toThrowError(
      expect.objectContaining({
        code: ACADRUST_READ_ERROR,
      }),
    );
  });

  it("maps invalid files to a stable read error", () => {
    expect(() => readDxfSync("fixtures/invalid.dxf")).toThrowError(
      expect.objectContaining({
        code: ACADRUST_READ_ERROR,
      }),
    );
  });
});
