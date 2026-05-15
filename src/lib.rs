#![doc = "Rust binding crate for acadRust.js."]

use acadrust::{
    CadDocument, DwgReader, DwgWriter, DxfReader, DxfWriter, EntityType, Handle, Vector3,
};
use napi::bindgen_prelude::{AsyncTask, Task};
use napi::{Env, Result};
use napi_derive::napi;
use serde::Serialize;

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
            .filter(|entity| matches!(project_entity(entity), Some(ProjectedEntity::Unknown { .. })))
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
#[serde(tag = "type")]
enum ProjectedEntity {
    #[serde(rename = "LINE")]
    Line {
        #[serde(skip_serializing_if = "Option::is_none")]
        handle: Option<String>,
        layer: String,
        start: Point3d,
        end: Point3d,
    },
    #[serde(rename = "CIRCLE")]
    Circle {
        #[serde(skip_serializing_if = "Option::is_none")]
        handle: Option<String>,
        layer: String,
        center: Point3d,
        radius: f64,
    },
    #[serde(rename = "ARC")]
    Arc {
        #[serde(skip_serializing_if = "Option::is_none")]
        handle: Option<String>,
        layer: String,
        center: Point3d,
        radius: f64,
        #[serde(rename = "startAngle")]
        start_angle: f64,
        #[serde(rename = "endAngle")]
        end_angle: f64,
    },
    #[serde(rename = "POLYLINE")]
    Polyline {
        #[serde(skip_serializing_if = "Option::is_none")]
        handle: Option<String>,
        layer: String,
        vertices: Vec<Point3d>,
        closed: bool,
    },
    #[serde(rename = "TEXT")]
    Text {
        #[serde(skip_serializing_if = "Option::is_none")]
        handle: Option<String>,
        layer: String,
        value: String,
        #[serde(rename = "insertionPoint")]
        insertion_point: Point3d,
        height: f64,
        rotation: f64,
    },
    #[serde(rename = "UNKNOWN")]
    Unknown {
        #[serde(skip_serializing_if = "Option::is_none")]
        handle: Option<String>,
        layer: String,
        #[serde(rename = "rawType", skip_serializing_if = "Option::is_none")]
        raw_type: Option<String>,
    },
}

impl ProjectedEntity {
    fn entity_type(&self) -> &'static str {
        match self {
            ProjectedEntity::Line { .. } => "LINE",
            ProjectedEntity::Circle { .. } => "CIRCLE",
            ProjectedEntity::Arc { .. } => "ARC",
            ProjectedEntity::Polyline { .. } => "POLYLINE",
            ProjectedEntity::Text { .. } => "TEXT",
            ProjectedEntity::Unknown { .. } => "UNKNOWN",
        }
    }

    fn layer(&self) -> &str {
        match self {
            ProjectedEntity::Line { layer, .. }
            | ProjectedEntity::Circle { layer, .. }
            | ProjectedEntity::Arc { layer, .. }
            | ProjectedEntity::Polyline { layer, .. }
            | ProjectedEntity::Text { layer, .. }
            | ProjectedEntity::Unknown { layer, .. } => layer,
        }
    }
}

fn project_entity(entity: &EntityType) -> Option<ProjectedEntity> {
    let common = entity.common();

    match entity {
        EntityType::Line(line) => Some(ProjectedEntity::Line {
            handle: handle_string(common.handle),
            layer: common.layer.clone(),
            start: point3d(line.start),
            end: point3d(line.end),
        }),
        EntityType::Circle(circle) => Some(ProjectedEntity::Circle {
            handle: handle_string(common.handle),
            layer: common.layer.clone(),
            center: point3d(circle.center),
            radius: circle.radius,
        }),
        EntityType::Arc(arc) => Some(ProjectedEntity::Arc {
            handle: handle_string(common.handle),
            layer: common.layer.clone(),
            center: point3d(arc.center),
            radius: arc.radius,
            start_angle: arc.start_angle,
            end_angle: arc.end_angle,
        }),
        EntityType::Polyline(polyline) => Some(ProjectedEntity::Polyline {
            handle: handle_string(common.handle),
            layer: common.layer.clone(),
            vertices: polyline
                .vertices
                .iter()
                .map(|vertex| point3d(vertex.location))
                .collect(),
            closed: polyline.is_closed(),
        }),
        EntityType::Polyline2D(polyline) => Some(ProjectedEntity::Polyline {
            handle: handle_string(common.handle),
            layer: common.layer.clone(),
            vertices: polyline
                .vertices
                .iter()
                .map(|vertex| point3d(vertex.location))
                .collect(),
            closed: polyline.is_closed(),
        }),
        EntityType::Polyline3D(polyline) => Some(ProjectedEntity::Polyline {
            handle: handle_string(common.handle),
            layer: common.layer.clone(),
            vertices: polyline
                .vertices
                .iter()
                .map(|vertex| point3d(vertex.position))
                .collect(),
            closed: polyline.is_closed(),
        }),
        EntityType::LwPolyline(polyline) => Some(ProjectedEntity::Polyline {
            handle: handle_string(common.handle),
            layer: common.layer.clone(),
            vertices: polyline
                .vertices
                .iter()
                .map(|vertex| Point3d {
                    x: vertex.location.x,
                    y: vertex.location.y,
                    z: polyline.elevation,
                })
                .collect(),
            closed: polyline.is_closed,
        }),
        EntityType::Text(text) => Some(ProjectedEntity::Text {
            handle: handle_string(common.handle),
            layer: common.layer.clone(),
            value: text.value.clone(),
            insertion_point: point3d(text.insertion_point),
            height: text.height,
            rotation: text.rotation,
        }),
        EntityType::Unknown(unknown) => Some(ProjectedEntity::Unknown {
            handle: handle_string(common.handle),
            layer: common.layer.clone(),
            raw_type: Some(unknown.dxf_name.clone()),
        }),
        _ => Some(ProjectedEntity::Unknown {
            handle: handle_string(common.handle),
            layer: common.layer.clone(),
            raw_type: Some(entity.as_entity().entity_type().to_owned()),
        }),
    }
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
