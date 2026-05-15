import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { afterEach, describe, expect, it } from "vitest";

import {
  ACADRUST_READ_ERROR,
  ACADRUST_WRITE_ERROR,
  readDwg,
  readDwgSync,
  readDxfSync,
} from "../dist/index.js";

let tempDirs: string[] = [];

function makeTempDir(): string {
  const dir = mkdtempSync(join(tmpdir(), "acadrust-js-dwg-"));
  tempDirs.push(dir);
  return dir;
}

afterEach(() => {
  for (const dir of tempDirs) {
    rmSync(dir, { recursive: true, force: true });
  }
  tempDirs = [];
});

describe("DWG read/write", () => {
  it("writes a DWG that can be read again", () => {
    const input = readDxfSync("fixtures/simple-line.dxf");
    const outputPath = join(makeTempDir(), "roundtrip.dwg");

    input.writeDwgSync(outputPath);

    expect(existsSync(outputPath)).toBe(true);
    expect(readFileSync(outputPath).subarray(0, 6).toString("ascii")).toBe("AC1015");

    const output = readDwgSync(outputPath);
    expect(output.summary()).toMatchObject({
      version: input.version,
    });
    expect(output.entities({ type: "LINE" })).toHaveLength(1);
  });

  it("provides async DWG read and write wrappers", async () => {
    const input = readDxfSync("fixtures/simple-line.dxf");
    const outputPath = join(makeTempDir(), "async.dwg");

    await expect(input.writeDwg(outputPath)).resolves.toBeUndefined();
    await expect(readDwg(outputPath)).resolves.toMatchObject({
      version: "AC1015",
    });
    await expect(readDwgSync(outputPath).writeDxf(join(makeTempDir(), "from-dwg.dxf"))).resolves.toBeUndefined();
  });

  it("maps DWG read failures to a stable read error", () => {
    expect(() => readDwgSync("fixtures/invalid.dxf")).toThrowError(
      expect.objectContaining({
        code: ACADRUST_READ_ERROR,
      }),
    );
  });

  it("maps async DWG read failures to a stable read error", async () => {
    await expect(readDwg("fixtures/invalid.dxf")).rejects.toMatchObject({
      code: ACADRUST_READ_ERROR,
    });
  });

  it("maps DWG write failures to a stable write error", () => {
    const doc = readDxfSync("fixtures/simple-line.dxf");

    expect(() => doc.writeDwgSync(join(makeTempDir(), "missing", "output.dwg"))).toThrowError(
      expect.objectContaining({
        code: ACADRUST_WRITE_ERROR,
      }),
    );
  });

  it("can refuse to overwrite existing DWG files", () => {
    const doc = readDxfSync("fixtures/simple-line.dxf");
    const outputPath = join(makeTempDir(), "existing.dwg");
    writeFileSync(outputPath, "existing");

    expect(() => doc.writeDwgSync(outputPath, { overwrite: false })).toThrowError(
      expect.objectContaining({
        code: ACADRUST_WRITE_ERROR,
      }),
    );
  });
});
