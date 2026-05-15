import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import assert from "node:assert/strict";

import { licenseFiles, prebuildTargets } from "./prebuild-targets.mjs";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const packageJson = JSON.parse(readFileSync(join(root, "package.json"), "utf8"));
const binaryName = packageJson.napi?.binaryName;

assert.equal(typeof binaryName, "string", "package.json must define napi.binaryName.");
assert.ok(!packageJson.files?.includes("*.node"), "root package files must not include native binaries.");

for (const target of prebuildTargets(packageJson)) {
  const packageDir = join(root, "npm", target.suffix);
  const packageJsonPath = join(packageDir, "package.json");
  const readmePath = join(packageDir, "README.md");
  const binaryFile = `${binaryName}.${target.suffix}.node`;

  assert.ok(existsSync(packageJsonPath), `missing package.json for ${target.suffix}`);
  assert.ok(existsSync(readmePath), `missing README.md for ${target.suffix}`);

  const targetPackageJson = JSON.parse(readFileSync(packageJsonPath, "utf8"));

  assert.equal(targetPackageJson.name, `${packageJson.name}-${target.suffix}`);
  assert.equal(targetPackageJson.version, packageJson.version);
  assert.equal(targetPackageJson.main, binaryFile);
  assert.deepEqual(targetPackageJson.os, target.os);
  assert.deepEqual(targetPackageJson.cpu, target.cpu);

  if (target.libc) {
    assert.deepEqual(targetPackageJson.libc, target.libc);
  } else {
    assert.equal(targetPackageJson.libc, undefined);
  }

  for (const file of [binaryFile, ...licenseFiles]) {
    assert.ok(targetPackageJson.files?.includes(file), `${target.suffix} package must include ${file}`);
  }

  for (const file of licenseFiles) {
    assert.ok(existsSync(join(packageDir, file)), `${target.suffix} package is missing ${file}`);
  }

  const readme = readFileSync(readmePath, "utf8");
  assert.ok(readme.includes(target.triple), `${target.suffix} README must mention ${target.triple}`);
}
