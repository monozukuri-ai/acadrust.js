import { describe, expect, it } from "vitest";

import { readDxfSync } from "../dist/index.js";

describe("Document.entities", () => {
  it("projects common DXF entities into TypeScript shapes", () => {
    const doc = readDxfSync("fixtures/entities.dxf");
    const entities = doc.entities();

    expect(entities).toHaveLength(6);
    expect(entities.map((entity) => entity.type)).toEqual([
      "LINE",
      "CIRCLE",
      "ARC",
      "LWPOLYLINE",
      "TEXT",
      "MTEXT",
    ]);

    expect(entities[0]).toMatchObject({
      type: "LINE",
      handle: "10",
      layer: "GEOMETRY",
      start: { x: 0, y: 0, z: 0 },
      end: { x: 10, y: 20, z: 0 },
    });

    expect(entities[1]).toMatchObject({
      type: "CIRCLE",
      center: { x: 5, y: 5, z: 0 },
      radius: 2.5,
    });

    expect(entities[2]).toMatchObject({
      type: "ARC",
      center: { x: 10, y: 10, z: 0 },
      radius: 3,
    });

    expect(entities[3]).toMatchObject({
      type: "LWPOLYLINE",
      variant: "LwPolyline",
      closed: true,
      vertices: [
        { x: 0, y: 0, z: 0 },
        { x: 1, y: 0, z: 0 },
        { x: 1, y: 1, z: 0 },
      ],
    });

    expect(entities[4]).toMatchObject({
      type: "TEXT",
      value: "Hello CAD",
      insertionPoint: { x: 2, y: 3, z: 0 },
      height: 0.5,
    });
    expect(entities[4].type).toBe("TEXT");
    expect(entities[4].rotation).toBeCloseTo((0.25 * Math.PI) / 180);

    expect(entities[5]).toMatchObject({
      type: "MTEXT",
      variant: "MText",
      value: "Unsupported projection",
      data: expect.any(Object),
    });
  });

  it("filters by entity type and layer", () => {
    const doc = readDxfSync("fixtures/entities.dxf");

    expect(doc.entities({ type: "LINE" })).toHaveLength(1);
    expect(doc.entities({ type: "LWPOLYLINE" })).toHaveLength(1);
    expect(doc.entities({ layer: "ANNOTATION" }).map((entity) => entity.type)).toEqual([
      "TEXT",
      "MTEXT",
    ]);
    expect(doc.entities({ type: "TEXT", layer: "ANNOTATION" })).toHaveLength(1);
  });

  it("reports only raw unknown entities as unsupported", () => {
    const doc = readDxfSync("fixtures/entities.dxf");

    expect(doc.summary().unsupportedEntityCount).toBe(0);
    expect(doc.toJSON().entities).toHaveLength(6);
    expect(doc.toJSON({ includeUnknownEntities: false }).entities).toHaveLength(6);
  });
});
