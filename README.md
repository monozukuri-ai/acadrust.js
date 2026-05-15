# acadrust.js

TypeScript bindings for [acadrust](https://github.com/hakanaktt/acadrust), a Rust library for reading and writing CAD
files.

The package exposes a compact TypeScript API for DXF/DWG reading, common entity
inspection, JSON-safe document snapshots, and DXF/DWG writing. Native bindings
are implemented with `napi-rs`, while `acadrust` is consumed as an unmodified
Cargo dependency.

Broader entity coverage, release automation hardening, and editing APIs are
planned future work.

## Goals

- Provide a practical Node.js package for reading and writing DXF and DWG files.
- Keep the TypeScript API stable and smaller than the internal Rust API.
- Use `acadrust` through Cargo without copying or modifying its source.
- Preserve a clear license boundary between this package and `acadrust`.

## License

Original code in this repository is licensed under `MIT`.

`acadrust` is licensed under MPL-2.0 and is not relicensed by this project. See
`LICENSE.md` and `THIRD_PARTY_NOTICES.md` for details.

## Development

```sh
npm install
npm test
npm run check
npm run prebuild:packages
npm run prebuild:verify
cargo test
```

## Current API

```ts
import { AcadrustJsError, readDxf } from "acadrust.js";

try {
  const doc = await readDxf("drawing.dxf");
  console.log(doc.version);
  console.log(doc.summary());
  console.log(doc.entities({ type: "LINE" }));
  await doc.writeDxf("copy.dxf");
  await doc.writeDwg("copy.dwg");
} catch (error) {
  if (error instanceof AcadrustJsError) {
    console.error(error.code, error.message);
  }
}
```

The async read/write APIs run through `napi-rs` async tasks. Sync APIs remain
available for convenience, but they block the Node.js thread while parsing or
writing.

The current package entrypoint is ESM. Type-only subpath imports are available
from `acadrust.js/types`, and stable error constants/classes are available from
`acadrust.js/errors`.

## Browser Sample

`examples/browser/index.html` is a static CAD preview that renders a generated
`DrawingJson` snapshot on a canvas. Open it directly in a browser, or regenerate
the sample data after changing the fixture/projection code:

```sh
npm run build
npm run example:browser:data
```

## Prebuilt Binaries

The root package is kept JavaScript-only for release packaging. Native binaries
are loaded either from a local development build or from an optional platform
package named `acadrust.js-<platform-arch-abi>`.

Configured prebuild targets:

- `linux-x64-gnu`
- `linux-arm64-gnu`
- `darwin-x64`
- `darwin-arm64`
- `win32-x64-msvc`
- `win32-arm64-msvc`

The `.github/workflows/prebuild.yml` workflow builds these targets on matching
GitHub-hosted runners, uploads each `.node` file, copies artifacts into the
`npm/` package layout, links platform packages as optional dependencies for the
release workspace, and runs `npm pack --dry-run` for the root package and each
platform package.
