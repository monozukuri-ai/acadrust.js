/** Options accepted by CAD file readers. Reserved for format-specific settings. */
export interface ReadOptions {
  /** Text encoding hint for text DXF input. Currently only UTF-8 is exposed. */
  readonly encoding?: "utf8";
}

/** Options accepted by CAD file writers. */
export interface WriteOptions {
  /** Whether an existing destination file may be replaced. Defaults to `true`. */
  readonly overwrite?: boolean;
}

/** Options for JSON-safe document snapshots. */
export interface JsonOptions {
  /** Include unsupported projected entities in `toJSON()`. Defaults to `true`. */
  readonly includeUnknownEntities?: boolean;
}

/** Filter used by `Document.entities()`. */
export interface EntityFilter {
  /** Return only entities with this projected type. */
  readonly type?: Entity["type"];
  /** Return only entities on this layer. */
  readonly layer?: string;
}

/** High-level document information intended for quick inspection. */
export interface DrawingSummary {
  /** DXF/DWG version code, for example `AC1015`. */
  readonly version: string;
  /** Number of entities in the native document model. */
  readonly entityCount: number;
  /** Layer table names. */
  readonly layers: readonly string[];
  /** Block record names. */
  readonly blocks: readonly string[];
  /** Number of entities projected as `UnknownEntity`. */
  readonly unsupportedEntityCount: number;
}

/** JSON-safe snapshot returned by `Document.toJSON()`. */
export interface DrawingJson {
  readonly version: string;
  readonly summary: DrawingSummary;
  readonly entities: readonly Entity[];
}

/** Two-dimensional point. */
export interface Point2d {
  readonly x: number;
  readonly y: number;
}

/** Three-dimensional point. */
export interface Point3d extends Point2d {
  readonly z: number;
}

/** Fields shared by every projected entity. */
export interface EntityBase {
  /** CAD handle as an uppercase hexadecimal string when present. */
  readonly handle?: string;
  /** CAD layer name. */
  readonly layer?: string;
}

/** Projected LINE entity. */
export interface LineEntity extends EntityBase {
  readonly type: "LINE";
  readonly start: Point3d;
  readonly end: Point3d;
}

/** Projected CIRCLE entity. */
export interface CircleEntity extends EntityBase {
  readonly type: "CIRCLE";
  readonly center: Point3d;
  readonly radius: number;
}

/** Projected ARC entity. Angles are represented in radians. */
export interface ArcEntity extends EntityBase {
  readonly type: "ARC";
  readonly center: Point3d;
  readonly radius: number;
  readonly startAngle: number;
  readonly endAngle: number;
}

/** Projected lightweight or heavy polyline entity. */
export interface PolylineEntity extends EntityBase {
  readonly type: "POLYLINE";
  readonly vertices: readonly Point3d[];
  readonly closed: boolean;
}

/** Projected single-line TEXT entity. Rotation is represented in radians. */
export interface TextEntity extends EntityBase {
  readonly type: "TEXT";
  readonly value: string;
  readonly insertionPoint: Point3d;
  readonly height?: number;
  readonly rotation?: number;
}

/** Fallback projection for unsupported or intentionally unprojected entity types. */
export interface UnknownEntity extends EntityBase {
  readonly type: "UNKNOWN";
  /** Original CAD entity type when available. */
  readonly rawType?: string;
}

/** Supported TypeScript projection for a CAD entity. */
export type Entity =
  | LineEntity
  | CircleEntity
  | ArcEntity
  | PolylineEntity
  | TextEntity
  | UnknownEntity;
