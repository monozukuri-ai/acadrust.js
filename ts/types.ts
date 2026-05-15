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
  readonly type?: EntityTypeName;
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
  /** Projected DXF/acadRust entity type name. */
  readonly type: EntityTypeName;
  /** CAD handle as an uppercase hexadecimal string when present. */
  readonly handle?: string;
  /** CAD layer name. */
  readonly layer?: string;
  /** Rust `EntityType` variant that produced this projection. */
  readonly variant?: EntityVariantName;
  /** Original DXF entity name when it differs from `type`, or when unknown. */
  readonly rawType?: string;
  /** Serialized acadRust entity payload for fields not lifted to top-level properties. */
  readonly data?: unknown;
}

/** Projected entity type names exposed by `Document.entities()`. */
export type EntityTypeName =
  | "POINT"
  | "LINE"
  | "CIRCLE"
  | "ARC"
  | "ELLIPSE"
  | "POLYLINE"
  | "POLYLINE_2D"
  | "POLYLINE_3D"
  | "LWPOLYLINE"
  | "TEXT"
  | "MTEXT"
  | "SPLINE"
  | "DIMENSION_ALIGNED"
  | "DIMENSION_LINEAR"
  | "DIMENSION_RADIUS"
  | "DIMENSION_DIAMETER"
  | "DIMENSION_ANGULAR_2LINE"
  | "DIMENSION_ANGULAR_3POINT"
  | "DIMENSION_ORDINATE"
  | "HATCH"
  | "SOLID"
  | "3DFACE"
  | "INSERT"
  | "MINSERT"
  | "BLOCK"
  | "ENDBLK"
  | "RAY"
  | "XLINE"
  | "VIEWPORT"
  | "ATTDEF"
  | "ATTRIB"
  | "LEADER"
  | "MULTILEADER"
  | "MLINE"
  | "MESH"
  | "IMAGE"
  | "3DSOLID"
  | "REGION"
  | "BODY"
  | "ACAD_TABLE"
  | "TOLERANCE"
  | "POLYFACE_MESH"
  | "WIPEOUT"
  | "SHAPE"
  | "PDFUNDERLAY"
  | "DWFUNDERLAY"
  | "DGNUNDERLAY"
  | "SEQEND"
  | "OLE2FRAME"
  | "POLYGON_MESH"
  | "UNKNOWN";

/** Rust `EntityType` variants represented by the projection. */
export type EntityVariantName =
  | "Point"
  | "Line"
  | "Circle"
  | "Arc"
  | "Ellipse"
  | "Polyline"
  | "Polyline2D"
  | "Polyline3D"
  | "LwPolyline"
  | "Text"
  | "MText"
  | "Spline"
  | "Dimension"
  | "Hatch"
  | "Solid"
  | "Face3D"
  | "Insert"
  | "Block"
  | "BlockEnd"
  | "Ray"
  | "XLine"
  | "Viewport"
  | "AttributeDefinition"
  | "AttributeEntity"
  | "Leader"
  | "MultiLeader"
  | "MLine"
  | "Mesh"
  | "RasterImage"
  | "Solid3D"
  | "Region"
  | "Body"
  | "Table"
  | "Tolerance"
  | "PolyfaceMesh"
  | "Wipeout"
  | "Shape"
  | "Underlay"
  | "Seqend"
  | "Ole2Frame"
  | "PolygonMesh"
  | "Unknown";

/** Projected POINT entity. */
export interface PointEntity extends EntityBase {
  readonly type: "POINT";
  readonly location: Point3d;
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

/** Projected ELLIPSE entity. */
export interface EllipseEntity extends EntityBase {
  readonly type: "ELLIPSE";
  readonly center: Point3d;
  readonly majorAxis: Point3d;
  readonly minorAxisRatio: number;
  readonly startParameter: number;
  readonly endParameter: number;
}

/** Projected lightweight or heavy polyline entity. */
export interface PolylineEntity extends EntityBase {
  readonly type: "POLYLINE" | "POLYLINE_2D" | "POLYLINE_3D" | "LWPOLYLINE";
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

/** Projected multi-line MTEXT entity. */
export interface MTextEntity extends EntityBase {
  readonly type: "MTEXT";
  readonly value: string;
  readonly insertionPoint: Point3d;
  readonly height?: number;
  readonly rotation?: number;
}

/** Projected SPLINE entity. */
export interface SplineEntity extends EntityBase {
  readonly type: "SPLINE";
  readonly degree: number;
  readonly controlPoints: readonly Point3d[];
  readonly fitPoints: readonly Point3d[];
  readonly knots: readonly number[];
}

/** Entity whose full acadRust payload is available through `data`. */
export interface RawEntity<TType extends RawEntityTypeName = RawEntityTypeName> extends EntityBase {
  readonly type: TType;
}

/** Fallback projection for entities acadRust itself reports as unknown. */
export interface UnknownEntity extends EntityBase {
  readonly type: "UNKNOWN";
  /** Original CAD entity type when available. */
  readonly rawType?: string;
}

/** Entity names represented through the generic `RawEntity` shape. */
export type RawEntityTypeName = Exclude<
  EntityTypeName,
  | "POINT"
  | "LINE"
  | "CIRCLE"
  | "ARC"
  | "ELLIPSE"
  | "POLYLINE"
  | "POLYLINE_2D"
  | "POLYLINE_3D"
  | "LWPOLYLINE"
  | "TEXT"
  | "MTEXT"
  | "SPLINE"
  | "UNKNOWN"
>;

/** Supported TypeScript projection for a CAD entity. */
export type Entity =
  | PointEntity
  | LineEntity
  | CircleEntity
  | ArcEntity
  | EllipseEntity
  | PolylineEntity
  | TextEntity
  | MTextEntity
  | SplineEntity
  | RawEntity
  | UnknownEntity;
