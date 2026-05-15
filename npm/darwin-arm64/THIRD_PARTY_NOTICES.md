# Third-Party Notices

This repository does not vendor or copy `acadrust` source code.

This project depends on `acadrust` through Cargo. When release artifacts include
prebuilt native binaries, this file must be updated for every release with:

- the exact `acadrust` version,
- the upstream source URL,
- whether the source was modified,
- and any source availability instructions required for prebuilt binaries.

## Planned Runtime Dependency

### acadrust

- License: MPL-2.0
- Version: 0.3.4
- Source: https://github.com/hakanaktt/acadrust
- Crates.io: https://crates.io/crates/acadrust
- Status in this repository: used as a Cargo dependency
- Source modification status: unmodified

`acadrust` is not relicensed by this project.

## Current Native Binding Dependencies

### napi-rs

- Crates: `napi`, `napi-derive`, `napi-build`
- License: MIT
- Source: https://github.com/napi-rs/napi-rs
- Status in this repository: used for the Phase 1 native addon skeleton
