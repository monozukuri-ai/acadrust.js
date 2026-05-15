import { existsSync, readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

interface NativeBinding {
  nativeSmoke(): string;
  readDxf(path: string): Promise<NativeDocument>;
  readDxfSync(path: string): NativeDocument;
  readDwg(path: string): Promise<NativeDocument>;
  readDwgSync(path: string): NativeDocument;
}

export interface NativeDocument {
  readonly version: string;
  entityCount(): number;
  layerNames(): string[];
  blockNames(): string[];
  unsupportedEntityCount(): number;
  entitiesJson(typeFilter?: string, layerFilter?: string): string;
  writeDxf(path: string): Promise<void>;
  writeDxfSync(path: string): void;
  writeDwg(path: string): Promise<void>;
  writeDwgSync(path: string): void;
}

let cachedBinding: NativeBinding | undefined;

const require = createRequire(import.meta.url);
const binaryName = "acadrust-js";
const packageName = "acadrust.js";

function packageRoot(): string {
  return join(dirname(fileURLToPath(import.meta.url)), "..");
}

function isMusl(): boolean {
  if (process.platform !== "linux") {
    return false;
  }

  const report =
    typeof process.report?.getReport === "function"
      ? (process.report.getReport() as { readonly header?: { readonly glibcVersionRuntime?: string } })
      : undefined;

  if (report?.header?.glibcVersionRuntime) {
    return false;
  }

  try {
    return readFileSync("/usr/bin/ldd", "utf8").includes("musl");
  } catch {
    return false;
  }
}

function platformArchABI(): string | undefined {
  const arch = process.arch === "x64" || process.arch === "arm64" ? process.arch : undefined;

  if (!arch) {
    return undefined;
  }

  if (process.platform === "linux") {
    return `linux-${arch}-${isMusl() ? "musl" : "gnu"}`;
  }

  if (process.platform === "darwin") {
    return `darwin-${arch}`;
  }

  if (process.platform === "win32") {
    return `win32-${arch}-msvc`;
  }

  return undefined;
}

function loadCandidate(candidate: string, loadErrors: string[]): NativeBinding | undefined {
  try {
    return require(candidate) as NativeBinding;
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error);
    loadErrors.push(`${candidate}: ${detail}`);
    return undefined;
  }
}

function findNativeBinding(): NativeBinding {
  const loadErrors: string[] = [];
  const configuredPath = process.env.NAPI_RS_NATIVE_LIBRARY_PATH;

  if (configuredPath) {
    const binding = loadCandidate(configuredPath, loadErrors);

    if (binding) {
      return binding;
    }
  }

  const root = packageRoot();
  const directPath = join(root, `${binaryName}.node`);

  if (existsSync(directPath)) {
    const binding = loadCandidate(directPath, loadErrors);

    if (binding) {
      return binding;
    }
  }

  const platform = platformArchABI();

  if (platform) {
    const localPath = join(root, `${binaryName}.${platform}.node`);

    if (existsSync(localPath)) {
      const binding = loadCandidate(localPath, loadErrors);

      if (binding) {
        return binding;
      }
    }

    const optionalPackage = `${packageName}-${platform}`;
    const binding = loadCandidate(optionalPackage, loadErrors);

    if (binding) {
      return binding;
    }
  }

  const suffix = platform ? ` for ${platform}` : ` for ${process.platform}-${process.arch}`;
  const details = loadErrors.length > 0 ? ` Tried:\n${loadErrors.map((error) => `- ${error}`).join("\n")}` : "";

  throw new Error(`Unable to find the acadRust.js native binding${suffix}.${details}`);
}

export function loadNativeBinding(): NativeBinding {
  cachedBinding ??= findNativeBinding();
  return cachedBinding;
}
