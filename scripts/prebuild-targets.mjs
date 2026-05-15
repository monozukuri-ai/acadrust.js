export const licenseFiles = [
  "LICENSE.md",
  "LICENSE-MPL-2.0",
  "THIRD_PARTY_NOTICES.md",
];

const targetMetadata = new Map([
  [
    "x86_64-unknown-linux-gnu",
    {
      suffix: "linux-x64-gnu",
      os: ["linux"],
      cpu: ["x64"],
      libc: ["glibc"],
    },
  ],
  [
    "aarch64-unknown-linux-gnu",
    {
      suffix: "linux-arm64-gnu",
      os: ["linux"],
      cpu: ["arm64"],
      libc: ["glibc"],
    },
  ],
  [
    "x86_64-apple-darwin",
    {
      suffix: "darwin-x64",
      os: ["darwin"],
      cpu: ["x64"],
    },
  ],
  [
    "aarch64-apple-darwin",
    {
      suffix: "darwin-arm64",
      os: ["darwin"],
      cpu: ["arm64"],
    },
  ],
  [
    "x86_64-pc-windows-msvc",
    {
      suffix: "win32-x64-msvc",
      os: ["win32"],
      cpu: ["x64"],
    },
  ],
  [
    "aarch64-pc-windows-msvc",
    {
      suffix: "win32-arm64-msvc",
      os: ["win32"],
      cpu: ["arm64"],
    },
  ],
]);

export function metadataForTarget(target) {
  const metadata = targetMetadata.get(target);

  if (!metadata) {
    throw new Error(`Unsupported prebuild target in package.json: ${target}`);
  }

  return metadata;
}

export function prebuildTargets(packageJson) {
  const targets = packageJson.napi?.targets;

  if (!Array.isArray(targets) || targets.length === 0) {
    throw new Error("package.json must define napi.targets for prebuilt packages.");
  }

  return targets.map((target) => ({
    triple: target,
    ...metadataForTarget(target),
  }));
}
