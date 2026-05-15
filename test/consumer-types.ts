import {
  ACADRUST_READ_ERROR,
  AcadrustJsError,
  Document,
  readDwg,
  readDwgSync,
  readDxf,
  readDxfSync,
  type DrawingSummary,
  type Entity,
  type LineEntity,
} from "acadrust.js";
import type { AcadrustJsErrorCode } from "acadrust.js/errors";
import type { CircleEntity, EntityTypeName, MTextEntity, RawEntity } from "acadrust.js/types";

// @ts-expect-error Documents are created by read functions, not direct construction.
new Document();

async function checkAsyncApi(): Promise<void> {
  const doc = await readDxf("fixtures/simple-line.dxf");
  const summary: DrawingSummary = doc.summary();
  const entities: Entity[] = doc.entities({ layer: "0" });

  await doc.writeDxf("tmp/out.dxf", { overwrite: true });
  await doc.writeDwg("tmp/out.dwg");

  summary.entityCount.toFixed();
  entities.map((entity) => entity.type);
}

async function checkDwgApi(): Promise<void> {
  const doc = await readDwg("tmp/out.dwg");
  await doc.writeDxf("tmp/out.dxf");
}

function checkSyncApi(): void {
  const dxfDoc = readDxfSync("fixtures/simple-line.dxf");
  const dwgDoc = readDwgSync("tmp/out.dwg");
  const lines = dxfDoc.entities({ type: "LINE" });
  const line: LineEntity | undefined = lines[0]?.type === "LINE" ? lines[0] : undefined;
  const code: AcadrustJsErrorCode = ACADRUST_READ_ERROR;
  const entityType: EntityTypeName = "POLYFACE_MESH";
  const circle: CircleEntity = {
    type: "CIRCLE",
    center: { x: 0, y: 0, z: 0 },
    radius: 1,
  };
  const mtext: MTextEntity = {
    type: "MTEXT",
    value: "hello",
    insertionPoint: { x: 0, y: 0, z: 0 },
  };
  const hatch: RawEntity<"HATCH"> = {
    type: "HATCH",
    data: {},
  };

  dxfDoc.toJSON({ includeUnknownEntities: false });
  dwgDoc.summary();
  line?.start.x.toFixed();
  code.toLowerCase();
  entityType.toLowerCase();
  circle.radius.toFixed();
  mtext.value.toUpperCase();
  hatch.type.toLowerCase();
}

function checkErrors(error: unknown): string {
  if (error instanceof AcadrustJsError) {
    return error.code;
  }

  return "unknown";
}

void checkAsyncApi;
void checkDwgApi;
void checkSyncApi;
void checkErrors;
