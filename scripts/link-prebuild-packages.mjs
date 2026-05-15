import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { prebuildTargets } from "./prebuild-targets.mjs";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const packageJsonPath = join(root, "package.json");
const packageJson = JSON.parse(readFileSync(packageJsonPath, "utf8"));

const optionalDependencies = {};

for (const target of prebuildTargets(packageJson)) {
  optionalDependencies[`${packageJson.name}-${target.suffix}`] = packageJson.version;
}

packageJson.optionalDependencies = optionalDependencies;

writeFileSync(packageJsonPath, `${JSON.stringify(packageJson, null, 2)}\n`);
