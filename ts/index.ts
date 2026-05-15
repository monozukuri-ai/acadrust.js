import { existsSync } from "node:fs";

import { asReadError, asWriteError } from "./error-utils.js";
import { loadNativeBinding, type NativeDocument } from "./native.js";
import type {
  DrawingJson,
  DrawingSummary,
  Entity,
  EntityFilter,
  JsonOptions,
  ReadOptions,
  WriteOptions,
} from "./types.js";

export * from "./errors.js";
export type * from "./types.js";

const nativeDocuments = new WeakMap<Document, NativeDocument>();

function createDocument(nativeDocument: NativeDocument): Document {
  const document = Object.create(Document.prototype) as Document;
  nativeDocuments.set(document, nativeDocument);
  return document;
}

function nativeFor(document: Document): NativeDocument {
  const nativeDocument = nativeDocuments.get(document);

  if (!nativeDocument) {
    throw new Error("Document instances must be created by readDxf, readDwg, readDxfSync, or readDwgSync.");
  }

  return nativeDocument;
}

/**
 * A loaded CAD document backed by the native acadRust document model.
 *
 * Document instances are returned by read functions. Constructing this class
 * directly is not supported because the native document state must be created
 * by the Rust parser.
 */
export class Document {
  private constructor() {
    throw new Error("Document instances must be created by readDxf, readDwg, readDxfSync, or readDwgSync.");
  }

  /** DXF/DWG version code, for example `AC1015` or `AC1032`. */
  get version(): string {
    return nativeFor(this).version;
  }

  /** Return high-level counts and table names for quick inspection. */
  summary(): DrawingSummary {
    const nativeDocument = nativeFor(this);

    return {
      version: this.version,
      entityCount: nativeDocument.entityCount(),
      layers: nativeDocument.layerNames(),
      blocks: nativeDocument.blockNames(),
      unsupportedEntityCount: nativeDocument.unsupportedEntityCount(),
    };
  }

  /** Return projected entities, optionally filtered by entity type and layer. */
  entities(filter?: EntityFilter): Entity[] {
    return JSON.parse(nativeFor(this).entitiesJson(filter?.type, filter?.layer)) as Entity[];
  }

  /** Return a JSON-safe snapshot of the supported document surface. */
  toJSON(options?: JsonOptions): DrawingJson {
    const entities = this.entities();

    return {
      version: this.version,
      summary: this.summary(),
      entities:
        options?.includeUnknownEntities === false
          ? entities.filter((entity) => entity.type !== "UNKNOWN")
          : entities,
    };
  }

  /** Write this document to an ASCII DXF file without blocking the Node.js thread. */
  writeDxf(path: string, options?: WriteOptions): Promise<void> {
    try {
      if (options?.overwrite === false && existsSync(path)) {
        throw new Error(`Refusing to overwrite existing file: ${path}`);
      }

      return nativeFor(this).writeDxf(path).catch((error: unknown) => {
        throw asWriteError(error, "Document.writeDxf");
      });
    } catch (error) {
      return Promise.reject(asWriteError(error, "Document.writeDxf"));
    }
  }

  /** Write this document to an ASCII DXF file on the current thread. */
  writeDxfSync(path: string, options?: WriteOptions): void {
    try {
      if (options?.overwrite === false && existsSync(path)) {
        throw new Error(`Refusing to overwrite existing file: ${path}`);
      }

      nativeFor(this).writeDxfSync(path);
    } catch (error) {
      throw asWriteError(error, "Document.writeDxfSync");
    }
  }

  /** Write this document to a DWG file without blocking the Node.js thread. */
  writeDwg(path: string, options?: WriteOptions): Promise<void> {
    try {
      if (options?.overwrite === false && existsSync(path)) {
        throw new Error(`Refusing to overwrite existing file: ${path}`);
      }

      return nativeFor(this).writeDwg(path).catch((error: unknown) => {
        throw asWriteError(error, "Document.writeDwg");
      });
    } catch (error) {
      return Promise.reject(asWriteError(error, "Document.writeDwg"));
    }
  }

  /** Write this document to a DWG file on the current thread. */
  writeDwgSync(path: string, options?: WriteOptions): void {
    try {
      if (options?.overwrite === false && existsSync(path)) {
        throw new Error(`Refusing to overwrite existing file: ${path}`);
      }

      nativeFor(this).writeDwgSync(path);
    } catch (error) {
      throw asWriteError(error, "Document.writeDwgSync");
    }
  }
}

/** Read a DXF file without blocking the Node.js thread. */
export function readDxf(path: string, options?: ReadOptions): Promise<Document> {
  void options;

  return loadNativeBinding()
    .readDxf(path)
    .then(createDocument)
    .catch((error: unknown) => {
      throw asReadError(error, "readDxf");
    });
}

/** Read a DWG file without blocking the Node.js thread. */
export function readDwg(path: string, options?: ReadOptions): Promise<Document> {
  void options;

  return loadNativeBinding()
    .readDwg(path)
    .then(createDocument)
    .catch((error: unknown) => {
      throw asReadError(error, "readDwg");
    });
}

/** Read a DXF file on the current thread. */
export function readDxfSync(path: string, options?: ReadOptions): Document {
  void options;

  try {
    return createDocument(loadNativeBinding().readDxfSync(path));
  } catch (error) {
    throw asReadError(error, "readDxfSync");
  }
}

/** Read a DWG file on the current thread. */
export function readDwgSync(path: string, options?: ReadOptions): Document {
  void options;

  try {
    return createDocument(loadNativeBinding().readDwgSync(path));
  } catch (error) {
    throw asReadError(error, "readDwgSync");
  }
}
