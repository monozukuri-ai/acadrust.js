import { copyFileSync, existsSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { licenseFiles, prebuildTargets } from "./prebuild-targets.mjs";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const packageJson = JSON.parse(readFileSync(join(root, "package.json"), "utf8"));
const binaryName = packageJson.napi?.binaryName;

if (typeof binaryName !== "string" || binaryName.length === 0) {
  throw new Error("package.json must define napi.binaryName.");
}

for (const target of prebuildTargets(packageJson)) {
  const packageDir = join(root, "npm", target.suffix);

  if (!existsSync(packageDir)) {
    throw new Error(`Missing prebuild package directory: ${packageDir}`);
  }

  for (const file of licenseFiles) {
    copyFileSync(join(root, file), join(packageDir, file));
  }

  const packageJsonPath = join(packageDir, "package.json");
  const targetPackageJson = JSON.parse(readFileSync(packageJsonPath, "utf8"));
  const binaryFile = `${binaryName}.${target.suffix}.node`;

  targetPackageJson.description = packageJson.description;
  targetPackageJson.keywords = packageJson.keywords;
  targetPackageJson.license = packageJson.license;
  targetPackageJson.engines = packageJson.engines;
  targetPackageJson.repository = packageJson.repository;
  targetPackageJson.files = [binaryFile, ...licenseFiles];

  writeFileSync(packageJsonPath, `${JSON.stringify(targetPackageJson, null, 2)}\n`);
}
