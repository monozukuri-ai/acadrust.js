#![doc = "Rust binding crate for acadRust.js."]

use acadrust::{
    entities::EntityCommon,
    CadDocument, DwgReader, DwgWriter, DxfReader, DxfWriter, EntityType, Handle, Vector3,
};
use napi::bindgen_prelude::{AsyncTask, Task};
use napi::{Env, Result};
use napi_derive::napi;
use serde::Serialize;
use serde_json::{json, Map, Value};

/// Returns the package name used by the Rust binding crate.
pub fn package_name() -> &'static str {
    "acadrust-js"
}

/// Smoke-test function exported through N-API.
#[napi(js_name = "nativeSmoke")]
pub fn native_smoke() -> String {
    "acadrust-js native binding".to_owned()
}

#[napi(js_name = "NativeDocument")]
pub struct NativeDocument {
    inner: CadDocument,
}

#[napi]
impl NativeDocument {
    #[napi(getter)]
    pub fn version(&self) -> String {
        self.inner.version.to_string()
    }

    #[napi(js_name = "entityCount")]
    pub fn entity_count(&self) -> u32 {
        self.inner.entity_count() as u32
    }

    #[napi(js_name = "layerNames")]
    pub fn layer_names(&self) -> Vec<String> {
        self.inner.layers.names().map(str::to_owned).collect()
    }

    #[napi(js_name = "blockNames")]
    pub fn block_names(&self) -> Vec<String> {
        self.inner.block_records.names().map(str::to_owned).collect()
    }

    #[napi(js_name = "unsupportedEntityCount")]
    pub fn unsupported_entity_count(&self) -> u32 {
        self.inner
            .entities()
            .filter(|entity| matches!(entity, EntityType::Unknown(_)))
            .count() as u32
    }

    #[napi(js_name = "entitiesJson")]
    pub fn entities_json(&self, type_filter: Option<String>, layer_filter: Option<String>) -> Result<String> {
        let entities: Vec<ProjectedEntity> = self
            .inner
            .entities()
            .filter_map(project_entity)
            .filter(|entity| {
                type_filter
                    .as_deref()
                    .map_or(true, |expected_type| entity.entity_type() == expected_type)
            })
            .filter(|entity| {
                layer_filter
                    .as_deref()
                    .map_or(true, |expected_layer| entity.layer() == expected_layer)
            })
            .collect();

        serde_json::to_string(&entities).map_err(|error| napi::Error::from_reason(error.to_string()))
    }

    #[napi(js_name = "writeDxfSync")]
    pub fn write_dxf_sync(&self, path: String) -> Result<()> {
        write_dxf_document(&self.inner, path)
    }

    #[napi(js_name = "writeDwgSync")]
    pub fn write_dwg_sync(&self, path: String) -> Result<()> {
        write_dwg_document(&self.inner, path)
    }

    #[napi(js_name = "writeDxf")]
    pub fn write_dxf(&self, path: String) -> AsyncTask<WriteDocumentTask> {
        AsyncTask::new(WriteDocumentTask {
            document: self.inner.clone(),
            path,
            format: CadFormat::Dxf,
        })
    }

    #[napi(js_name = "writeDwg")]
    pub fn write_dwg(&self, path: String) -> AsyncTask<WriteDocumentTask> {
        AsyncTask::new(WriteDocumentTask {
            document: self.inner.clone(),
            path,
            format: CadFormat::Dwg,
        })
    }
}

#[napi(js_name = "readDxfSync")]
pub fn read_dxf_sync(path: String) -> Result<NativeDocument> {
    read_dxf_document(path).map(|inner| NativeDocument { inner })
}

#[napi(js_name = "readDwgSync")]
pub fn read_dwg_sync(path: String) -> Result<NativeDocument> {
    read_dwg_document(path).map(|inner| NativeDocument { inner })
}

#[napi(js_name = "readDxf")]
pub fn read_dxf(path: String) -> AsyncTask<ReadDocumentTask> {
    AsyncTask::new(ReadDocumentTask {
        path,
        format: CadFormat::Dxf,
    })
}

#[napi(js_name = "readDwg")]
pub fn read_dwg(path: String) -> AsyncTask<ReadDocumentTask> {
    AsyncTask::new(ReadDocumentTask {
        path,
        format: CadFormat::Dwg,
    })
}

#[derive(Clone, Copy, Debug)]
enum CadFormat {
    Dxf,
    Dwg,
}

pub struct ReadDocumentTask {
    path: String,
    format: CadFormat,
}

impl Task for ReadDocumentTask {
    type Output = CadDocument;
    type JsValue = NativeDocument;

    fn compute(&mut self) -> Result<Self::Output> {
        match self.format {
            CadFormat::Dxf => read_dxf_document(self.path.clone()),
            CadFormat::Dwg => read_dwg_document(self.path.clone()),
        }
    }

    fn resolve(&mut self, _env: Env, output: Self::Output) -> Result<Self::JsValue> {
        Ok(NativeDocument { inner: output })
    }
}

pub struct WriteDocumentTask {
    document: CadDocument,
    path: String,
    format: CadFormat,
}

impl Task for WriteDocumentTask {
    type Output = ();
    type JsValue = ();

    fn compute(&mut self) -> Result<Self::Output> {
        match self.format {
            CadFormat::Dxf => write_dxf_document(&self.document, self.path.clone()),
            CadFormat::Dwg => write_dwg_document(&self.document, self.path.clone()),
        }
    }

    fn resolve(&mut self, _env: Env, _output: Self::Output) -> Result<Self::JsValue> {
        Ok(())
    }
}

fn read_dxf_document(path: String) -> Result<CadDocument> {
    DxfReader::from_file(path)
        .and_then(|reader| reader.read())
        .map_err(|error| napi::Error::from_reason(error.to_string()))
}

fn read_dwg_document(path: String) -> Result<CadDocument> {
    let mut reader = DwgReader::from_file(path)
        .map_err(|error| napi::Error::from_reason(error.to_string()))?;
    reader
        .read()
        .map_err(|error| napi::Error::from_reason(error.to_string()))
}

fn write_dxf_document(document: &CadDocument, path: String) -> Result<()> {
    DxfWriter::new(document)
        .write_to_file(path)
        .map_err(|error| napi::Error::from_reason(error.to_string()))
}

fn write_dwg_document(document: &CadDocument, path: String) -> Result<()> {
    DwgWriter::write_to_file(path, document)
        .map_err(|error| napi::Error::from_reason(error.to_string()))
}

#[derive(Debug, Serialize)]
struct Point3d {
    x: f64,
    y: f64,
    z: f64,
}

#[derive(Debug, Serialize)]
struct ProjectedEntity {
    #[serde(rename = "type")]
    entity_type: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    handle: Option<String>,
    layer: String,
    variant: &'static str,
    #[serde(rename = "rawType", skip_serializing_if = "Option::is_none")]
    raw_type: Option<String>,
    data: Value,
    #[serde(flatten)]
    properties: Map<String, Value>,
}

impl ProjectedEntity {
    fn entity_type(&self) -> &str {
        &self.entity_type
    }

    fn layer(&self) -> &str {
        &self.layer
    }
}

fn projected_entity<T: Serialize>(
    entity_type: impl Into<String>,
    variant: &'static str,
    raw_type: Option<String>,
    common: &EntityCommon,
    entity: &T,
    properties: Map<String, Value>,
) -> ProjectedEntity {
    ProjectedEntity {
        entity_type: entity_type.into(),
        handle: handle_string(common.handle),
        layer: common.layer.clone(),
        variant,
        raw_type,
        data: serde_json::to_value(entity).unwrap_or(Value::Null),
        properties,
    }
}

fn project_entity(entity: &EntityType) -> Option<ProjectedEntity> {
    let common = entity.common();

    match entity {
        EntityType::Point(point) => Some(projected_entity(
            "POINT",
            "Point",
            None,
            common,
            point,
            properties([("location", json!(point3d(point.location)))]),
        )),
        EntityType::Line(line) => Some(projected_entity(
            "LINE",
            "Line",
            None,
            common,
            line,
            properties([
                ("start", json!(point3d(line.start))),
                ("end", json!(point3d(line.end))),
            ]),
        )),
        EntityType::Circle(circle) => Some(projected_entity(
            "CIRCLE",
            "Circle",
            None,
            common,
            circle,
            properties([
                ("center", json!(point3d(circle.center))),
                ("radius", json!(circle.radius)),
            ]),
        )),
        EntityType::Arc(arc) => Some(projected_entity(
            "ARC",
            "Arc",
            None,
            common,
            arc,
            properties([
                ("center", json!(point3d(arc.center))),
                ("radius", json!(arc.radius)),
                ("startAngle", json!(arc.start_angle)),
                ("endAngle", json!(arc.end_angle)),
            ]),
        )),
        EntityType::Ellipse(ellipse) => Some(projected_entity(
            "ELLIPSE",
            "Ellipse",
            None,
            common,
            ellipse,
            properties([
                ("center", json!(point3d(ellipse.center))),
                ("majorAxis", json!(point3d(ellipse.major_axis))),
                ("minorAxisRatio", json!(ellipse.minor_axis_ratio)),
                ("startParameter", json!(ellipse.start_parameter)),
                ("endParameter", json!(ellipse.end_parameter)),
            ]),
        )),
        EntityType::Polyline(polyline) => Some(projected_entity(
            "POLYLINE",
            "Polyline",
            None,
            common,
            polyline,
            polyline_properties(
                polyline
                    .vertices
                    .iter()
                    .map(|vertex| point3d(vertex.location))
                    .collect(),
                polyline.is_closed(),
            ),
        )),
        EntityType::Polyline2D(polyline) => Some(projected_entity(
            "POLYLINE_2D",
            "Polyline2D",
            Some("POLYLINE".to_owned()),
            common,
            polyline,
            polyline_properties(
                polyline
                    .vertices
                    .iter()
                    .map(|vertex| point3d(vertex.location))
                    .collect(),
                polyline.is_closed(),
            ),
        )),
        EntityType::Polyline3D(polyline) => Some(projected_entity(
            "POLYLINE_3D",
            "Polyline3D",
            Some("POLYLINE".to_owned()),
            common,
            polyline,
            polyline_properties(
                polyline
                    .vertices
                    .iter()
                    .map(|vertex| point3d(vertex.position))
                    .collect(),
                polyline.is_closed(),
            ),
        )),
        EntityType::LwPolyline(polyline) => Some(projected_entity(
            "LWPOLYLINE",
            "LwPolyline",
            None,
            common,
            polyline,
            polyline_properties(
                polyline
                    .vertices
                    .iter()
                    .map(|vertex| Point3d {
                        x: vertex.location.x,
                        y: vertex.location.y,
                        z: polyline.elevation,
                    })
                    .collect(),
                polyline.is_closed,
            ),
        )),
        EntityType::Text(text) => Some(projected_entity(
            "TEXT",
            "Text",
            None,
            common,
            text,
            text_properties(
                &text.value,
                text.insertion_point,
                text.height,
                text.rotation,
            ),
        )),
        EntityType::MText(mtext) => Some(projected_entity(
            "MTEXT",
            "MText",
            None,
            common,
            mtext,
            text_properties(
                &mtext.value,
                mtext.insertion_point,
                mtext.height,
                mtext.rotation,
            ),
        )),
        EntityType::Spline(spline) => Some(projected_entity(
            "SPLINE",
            "Spline",
            None,
            common,
            spline,
            properties([
                ("degree", json!(spline.degree)),
                ("controlPoints", json!(points3d(&spline.control_points))),
                ("fitPoints", json!(points3d(&spline.fit_points))),
                ("knots", json!(spline.knots)),
            ]),
        )),
        EntityType::Dimension(dimension) => Some(projected_entity(
            entity.as_entity().entity_type(),
            "Dimension",
            None,
            common,
            dimension,
            Map::new(),
        )),
        EntityType::Hatch(hatch) => Some(raw_projected_entity("HATCH", "Hatch", common, hatch)),
        EntityType::Solid(solid) => Some(raw_projected_entity("SOLID", "Solid", common, solid)),
        EntityType::Face3D(face) => Some(raw_projected_entity("3DFACE", "Face3D", common, face)),
        EntityType::Insert(insert) => Some(projected_entity(
            entity.as_entity().entity_type(),
            "Insert",
            None,
            common,
            insert,
            Map::new(),
        )),
        EntityType::Block(block) => Some(raw_projected_entity("BLOCK", "Block", common, block)),
        EntityType::BlockEnd(block_end) => Some(raw_projected_entity("ENDBLK", "BlockEnd", common, block_end)),
        EntityType::Ray(ray) => Some(raw_projected_entity("RAY", "Ray", common, ray)),
        EntityType::XLine(xline) => Some(raw_projected_entity("XLINE", "XLine", common, xline)),
        EntityType::Viewport(viewport) => Some(raw_projected_entity("VIEWPORT", "Viewport", common, viewport)),
        EntityType::AttributeDefinition(attribute_definition) => Some(raw_projected_entity(
            "ATTDEF",
            "AttributeDefinition",
            common,
            attribute_definition,
        )),
        EntityType::AttributeEntity(attribute_entity) => Some(raw_projected_entity(
            "ATTRIB",
            "AttributeEntity",
            common,
            attribute_entity,
        )),
        EntityType::Leader(leader) => Some(raw_projected_entity("LEADER", "Leader", common, leader)),
        EntityType::MultiLeader(multi_leader) => Some(raw_projected_entity(
            "MULTILEADER",
            "MultiLeader",
            common,
            multi_leader,
        )),
        EntityType::MLine(mline) => Some(raw_projected_entity("MLINE", "MLine", common, mline)),
        EntityType::Mesh(mesh) => Some(raw_projected_entity("MESH", "Mesh", common, mesh)),
        EntityType::RasterImage(raster_image) => Some(raw_projected_entity(
            "IMAGE",
            "RasterImage",
            common,
            raster_image,
        )),
        EntityType::Solid3D(solid3d) => Some(raw_projected_entity("3DSOLID", "Solid3D", common, solid3d)),
        EntityType::Region(region) => Some(raw_projected_entity("REGION", "Region", common, region)),
        EntityType::Body(body) => Some(raw_projected_entity("BODY", "Body", common, body)),
        EntityType::Table(table) => Some(raw_projected_entity("ACAD_TABLE", "Table", common, table)),
        EntityType::Tolerance(tolerance) => Some(raw_projected_entity("TOLERANCE", "Tolerance", common, tolerance)),
        EntityType::PolyfaceMesh(polyface_mesh) => Some(projected_entity(
            "POLYFACE_MESH",
            "PolyfaceMesh",
            Some("POLYLINE".to_owned()),
            common,
            polyface_mesh,
            Map::new(),
        )),
        EntityType::Wipeout(wipeout) => Some(raw_projected_entity("WIPEOUT", "Wipeout", common, wipeout)),
        EntityType::Shape(shape) => Some(raw_projected_entity("SHAPE", "Shape", common, shape)),
        EntityType::Underlay(underlay) => Some(projected_entity(
            entity.as_entity().entity_type(),
            "Underlay",
            None,
            common,
            underlay,
            Map::new(),
        )),
        EntityType::Seqend(seqend) => Some(raw_projected_entity("SEQEND", "Seqend", common, seqend)),
        EntityType::Ole2Frame(ole2_frame) => Some(raw_projected_entity(
            "OLE2FRAME",
            "Ole2Frame",
            common,
            ole2_frame,
        )),
        EntityType::PolygonMesh(polygon_mesh) => Some(projected_entity(
            "POLYGON_MESH",
            "PolygonMesh",
            Some("POLYLINE".to_owned()),
            common,
            polygon_mesh,
            Map::new(),
        )),
        EntityType::Unknown(unknown) => Some(projected_entity(
            "UNKNOWN",
            "Unknown",
            Some(unknown.dxf_name.clone()),
            common,
            unknown,
            Map::new(),
        )),
    }
}

fn raw_projected_entity<T: Serialize>(
    entity_type: impl Into<String>,
    variant: &'static str,
    common: &EntityCommon,
    entity: &T,
) -> ProjectedEntity {
    projected_entity(entity_type, variant, None, common, entity, Map::new())
}

fn properties<const N: usize>(entries: [(&'static str, Value); N]) -> Map<String, Value> {
    entries
        .into_iter()
        .map(|(key, value)| (key.to_owned(), value))
        .collect()
}

fn polyline_properties(vertices: Vec<Point3d>, closed: bool) -> Map<String, Value> {
    properties([
        ("vertices", json!(vertices)),
        ("closed", json!(closed)),
    ])
}

fn text_properties(value: &str, insertion_point: Vector3, height: f64, rotation: f64) -> Map<String, Value> {
    properties([
        ("value", json!(value)),
        ("insertionPoint", json!(point3d(insertion_point))),
        ("height", json!(height)),
        ("rotation", json!(rotation)),
    ])
}

fn points3d(points: &[Vector3]) -> Vec<Point3d> {
    points.iter().copied().map(point3d).collect()
}

fn point3d(point: Vector3) -> Point3d {
    Point3d {
        x: point.x,
        y: point.y,
        z: point.z,
    }
}

fn handle_string(handle: Handle) -> Option<String> {
    handle.is_valid().then(|| format!("{:X}", handle.value()))
}

#[cfg(test)]
mod tests {
    use super::{native_smoke, package_name};

    #[test]
    fn exposes_package_name() {
        assert_eq!(package_name(), "acadrust-js");
    }

    #[test]
    fn exposes_native_smoke_message() {
        assert_eq!(native_smoke(), "acadrust-js native binding");
    }
}
