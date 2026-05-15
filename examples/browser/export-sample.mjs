import { writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { readDxfSync } from "../../dist/index.js";

const exampleDir = dirname(fileURLToPath(import.meta.url));
const root = dirname(dirname(exampleDir));
const sourcePath = join(root, "fixtures", "entities.dxf");
const outputPath = join(exampleDir, "sample-data.js");
const drawing = readDxfSync(sourcePath).toJSON();

writeFileSync(
  outputPath,
  `window.ACADRUST_SAMPLE = ${JSON.stringify(drawing, null, 2)};\n`,
);
