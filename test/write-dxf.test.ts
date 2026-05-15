import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { afterEach, describe, expect, it } from "vitest";

import { ACADRUST_WRITE_ERROR, readDxfSync } from "../dist/index.js";

let tempDirs: string[] = [];

function makeTempDir(): string {
  const dir = mkdtempSync(join(tmpdir(), "acadrust-js-"));
  tempDirs.push(dir);
  return dir;
}

afterEach(() => {
  for (const dir of tempDirs) {
    rmSync(dir, { recursive: true, force: true });
  }
  tempDirs = [];
});

describe("Document.writeDxf", () => {
  it("writes a DXF that can be read again", () => {
    const input = readDxfSync("fixtures/entities.dxf");
    const outputPath = join(makeTempDir(), "roundtrip.dxf");

    input.writeDxfSync(outputPath);

    expect(existsSync(outputPath)).toBe(true);
    expect(readFileSync(outputPath, "utf8")).toContain("SECTION");

    const output = readDxfSync(outputPath);
    expect(output.summary()).toMatchObject({
      version: input.version,
      entityCount: input.summary().entityCount,
      unsupportedEntityCount: input.summary().unsupportedEntityCount,
    });
    expect(output.entities().map((entity) => entity.type)).toEqual(
      input.entities().map((entity) => entity.type),
    );
  });

  it("provides an async write wrapper", async () => {
    const doc = readDxfSync("fixtures/simple-line.dxf");
    const outputPath = join(makeTempDir(), "async.dxf");

    await expect(doc.writeDxf(outputPath)).resolves.toBeUndefined();

    expect(readDxfSync(outputPath).summary().entityCount).toBe(1);
  });

  it("maps write failures to a stable write error", () => {
    const doc = readDxfSync("fixtures/simple-line.dxf");

    expect(() => doc.writeDxfSync(join(makeTempDir(), "missing", "output.dxf"))).toThrowError(
      expect.objectContaining({
        code: ACADRUST_WRITE_ERROR,
      }),
    );
  });

  it("maps async write failures to a stable write error", async () => {
    const doc = readDxfSync("fixtures/simple-line.dxf");

    await expect(doc.writeDxf(join(makeTempDir(), "missing", "output.dxf"))).rejects.toMatchObject({
      code: ACADRUST_WRITE_ERROR,
    });
  });

  it("can refuse to overwrite existing files", () => {
    const doc = readDxfSync("fixtures/simple-line.dxf");
    const outputPath = join(makeTempDir(), "existing.dxf");
    writeFileSync(outputPath, "existing");

    expect(() => doc.writeDxfSync(outputPath, { overwrite: false })).toThrowError(
      expect.objectContaining({
        code: ACADRUST_WRITE_ERROR,
      }),
    );
  });
});
