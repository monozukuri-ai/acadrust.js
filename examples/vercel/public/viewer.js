(function () {
  "use strict";

  const emptyDrawing = {
    version: "-",
    summary: {
      version: "-",
      entityCount: 0,
      layers: [],
      blocks: [],
      unsupportedEntityCount: 0,
    },
    entities: [],
  };

  let drawing = emptyDrawing;
  let sourceName = "No drawing loaded";
  let loading = false;

  const canvas = document.querySelector("#viewport");
  const context = canvas.getContext("2d");
  const typeFilter = document.querySelector("#typeFilter");
  const layerFilter = document.querySelector("#layerFilter");
  const showUnsupported = document.querySelector("#showUnsupported");
  const entityList = document.querySelector("#entityList");
  const fileInput = document.querySelector("#fileInput");
  const chooseButton = document.querySelector("#chooseButton");
  const sampleButton = document.querySelector("#sampleButton");
  const dropZone = document.querySelector("#dropZone");
  const statusValue = document.querySelector("#statusValue");
  const sourceLabel = document.querySelector("#sourceLabel");
  const versionValue = document.querySelector("#versionValue");
  const entityCountValue = document.querySelector("#entityCountValue");
  const unsupportedValue = document.querySelector("#unsupportedValue");

  const colors = {
    POINT: "#394b59",
    LINE: "#0f6b99",
    CIRCLE: "#bd3f32",
    ARC: "#7a4bb3",
    ELLIPSE: "#7a4bb3",
    POLYLINE: "#1d7a46",
    POLYLINE_2D: "#1d7a46",
    POLYLINE_3D: "#1d7a46",
    LWPOLYLINE: "#1d7a46",
    TEXT: "#9a5a00",
    MTEXT: "#9a5a00",
    UNKNOWN: "#68707a",
  };

  chooseButton.addEventListener("click", () => fileInput.click());
  sampleButton.addEventListener("click", loadSample);
  fileInput.addEventListener("change", () => {
    const file = fileInput.files && fileInput.files[0];
    if (file) {
      void uploadDxf(file.name, file);
    }
  });
  typeFilter.addEventListener("change", render);
  layerFilter.addEventListener("change", render);
  showUnsupported.addEventListener("change", render);
  window.addEventListener("resize", render);

  dropZone.addEventListener("dragenter", markDragOver);
  dropZone.addEventListener("dragover", (event) => {
    event.preventDefault();
    markDragOver();
  });
  dropZone.addEventListener("dragleave", () => dropZone.classList.remove("drag-over"));
  dropZone.addEventListener("drop", (event) => {
    event.preventDefault();
    dropZone.classList.remove("drag-over");

    const file = event.dataTransfer && event.dataTransfer.files[0];
    if (file) {
      void uploadDxf(file.name, file);
    }
  });

  updateDrawing(emptyDrawing, sourceName, "Drop file here");

  function markDragOver() {
    dropZone.classList.add("drag-over");
  }

  async function loadSample() {
    setLoading(true, "Loading sample.dxf");

    try {
      const response = await fetch("/sample.dxf");

      if (!response.ok) {
        throw new Error(`Sample request failed with ${response.status}`);
      }

      await uploadDxf("sample.dxf", await response.blob());
    } catch (error) {
      setError(error);
    } finally {
      setLoading(false);
    }
  }

  async function uploadDxf(fileName, body) {
    setLoading(true, `Parsing ${fileName}`);

    try {
      const response = await fetch("/api/parse-dxf", {
        method: "POST",
        headers: {
          "Content-Type": "application/dxf",
          "X-File-Name": encodeURIComponent(fileName),
        },
        body,
      });

      const payload = await readJson(response);

      if (!response.ok) {
        throw new Error(payload.error && payload.error.message ? payload.error.message : `Request failed with ${response.status}`);
      }

      updateDrawing(payload.drawing, payload.fileName || fileName, "Ready");
    } catch (error) {
      setError(error);
    } finally {
      fileInput.value = "";
      setLoading(false);
    }
  }

  async function readJson(response) {
    try {
      return await response.json();
    } catch {
      return {};
    }
  }

  function setLoading(value, status) {
    loading = value;
    chooseButton.disabled = value;
    sampleButton.disabled = value;

    if (status) {
      setStatus(status, false);
    }
  }

  function setError(error) {
    const message = error instanceof Error ? error.message : String(error);
    setStatus(message, true);
  }

  function setStatus(message, isError) {
    statusValue.textContent = message;
    dropZone.classList.toggle("error", Boolean(isError));
  }

  function updateDrawing(nextDrawing, nextSourceName, status) {
    drawing = nextDrawing || emptyDrawing;
    sourceName = nextSourceName || "No drawing loaded";

    sourceLabel.textContent = sourceName;
    versionValue.textContent = drawing.version || "-";
    entityCountValue.textContent = String(drawing.summary.entityCount);
    unsupportedValue.textContent = String(drawing.summary.unsupportedEntityCount);

    populateSelect(typeFilter, ["ALL", ...unique(drawing.entities.map((entity) => entity.type))]);
    populateSelect(layerFilter, ["ALL", ...unique(drawing.entities.map((entity) => entity.layer || "0"))]);
    setStatus(status || sourceName, false);
    render();
  }

  function populateSelect(select, values) {
    select.replaceChildren(
      ...values.map((value) => {
        const option = document.createElement("option");
        option.value = value;
        option.textContent = value;
        return option;
      }),
    );
  }

  function unique(values) {
    return [...new Set(values)].sort((a, b) => a.localeCompare(b));
  }

  function selectedEntities() {
    return drawing.entities.filter((entity) => {
      if (!showUnsupported.checked && entity.type === "UNKNOWN") {
        return false;
      }

      if (typeFilter.value !== "ALL" && entity.type !== typeFilter.value) {
        return false;
      }

      if (layerFilter.value !== "ALL" && (entity.layer || "0") !== layerFilter.value) {
        return false;
      }

      return true;
    });
  }

  function render() {
    const entities = selectedEntities();
    draw(entities);
    renderList(entities);
  }

  function draw(entities) {
    const rect = canvas.getBoundingClientRect();
    const pixelRatio = window.devicePixelRatio || 1;
    canvas.width = Math.max(1, Math.round(rect.width * pixelRatio));
    canvas.height = Math.max(1, Math.round(rect.height * pixelRatio));
    context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
    context.clearRect(0, 0, rect.width, rect.height);

    drawGrid(rect.width, rect.height);

    if (drawing.entities.length === 0) {
      drawEmptyState(rect.width, rect.height);
      return;
    }

    const transform = createTransform(boundsFor(entities), rect.width, rect.height);

    context.lineCap = "round";
    context.lineJoin = "round";

    for (const entity of entities) {
      context.strokeStyle = colors[entity.type] || colors.UNKNOWN;
      context.fillStyle = colors[entity.type] || colors.UNKNOWN;
      context.lineWidth = entity.type === "UNKNOWN" ? 1 : 2;

      if (entity.type === "POINT") {
        drawPoint(entity, transform);
      } else if (entity.type === "LINE") {
        drawLine(entity, transform);
      } else if (entity.type === "CIRCLE") {
        drawCircle(entity, transform);
      } else if (entity.type === "ARC") {
        drawArc(entity, transform);
      } else if (entity.type === "ELLIPSE") {
        drawEllipse(entity, transform);
      } else if (isPolyline(entity)) {
        drawPolyline(entity, transform);
      } else if (isText(entity)) {
        drawText(entity, transform);
      } else {
        drawUnknown(entity, transform, rect.width, rect.height);
      }
    }
  }

  function drawGrid(width, height) {
    context.save();
    context.strokeStyle = "#e8ecef";
    context.lineWidth = 1;

    for (let x = 0; x <= width; x += 40) {
      context.beginPath();
      context.moveTo(x, 0);
      context.lineTo(x, height);
      context.stroke();
    }

    for (let y = 0; y <= height; y += 40) {
      context.beginPath();
      context.moveTo(0, y);
      context.lineTo(width, y);
      context.stroke();
    }

    context.restore();
  }

  function drawEmptyState(width, height) {
    context.save();
    context.strokeStyle = "#b9c5cb";
    context.lineWidth = 1.5;
    context.setLineDash([8, 8]);
    context.beginPath();
    context.rect(width / 2 - 70, height / 2 - 45, 140, 90);
    context.moveTo(width / 2 - 70, height / 2 - 45);
    context.lineTo(width / 2 + 70, height / 2 + 45);
    context.moveTo(width / 2 + 70, height / 2 - 45);
    context.lineTo(width / 2 - 70, height / 2 + 45);
    context.stroke();
    context.restore();
  }

  function drawPoint(entity, transform) {
    const point = transform.point(entity.location);
    context.beginPath();
    context.arc(point.x, point.y, 4, 0, Math.PI * 2);
    context.fill();
  }

  function drawLine(entity, transform) {
    const start = transform.point(entity.start);
    const end = transform.point(entity.end);
    context.beginPath();
    context.moveTo(start.x, start.y);
    context.lineTo(end.x, end.y);
    context.stroke();
  }

  function drawCircle(entity, transform) {
    const center = transform.point(entity.center);
    context.beginPath();
    context.arc(center.x, center.y, entity.radius * transform.scale, 0, Math.PI * 2);
    context.stroke();
  }

  function drawArc(entity, transform) {
    const center = transform.point(entity.center);
    context.beginPath();
    context.arc(
      center.x,
      center.y,
      entity.radius * transform.scale,
      -entity.endAngle,
      -entity.startAngle,
      false,
    );
    context.stroke();
  }

  function drawEllipse(entity, transform) {
    const center = transform.point(entity.center);
    const radiusX = vectorLength(entity.majorAxis) * transform.scale;
    const radiusY = radiusX * entity.minorAxisRatio;
    const rotation = -Math.atan2(entity.majorAxis.y, entity.majorAxis.x);

    context.beginPath();
    context.ellipse(
      center.x,
      center.y,
      radiusX,
      radiusY,
      rotation,
      -entity.endParameter,
      -entity.startParameter,
      false,
    );
    context.stroke();
  }

  function drawPolyline(entity, transform) {
    if (entity.vertices.length === 0) {
      return;
    }

    const first = transform.point(entity.vertices[0]);
    context.beginPath();
    context.moveTo(first.x, first.y);

    for (const vertex of entity.vertices.slice(1)) {
      const point = transform.point(vertex);
      context.lineTo(point.x, point.y);
    }

    if (entity.closed) {
      context.closePath();
    }

    context.stroke();
  }

  function drawText(entity, transform) {
    const point = transform.point(entity.insertionPoint);
    context.save();
    context.translate(point.x, point.y);
    context.rotate(-(entity.rotation || 0));
    context.font = `${Math.max(12, (entity.height || 0.4) * transform.scale)}px ui-sans-serif, system-ui`;
    context.fillText(entity.value, 0, 0);
    context.restore();
  }

  function drawUnknown(entity, transform, width, height) {
    const index = drawing.entities.indexOf(entity);
    const x = width - 28;
    const y = 28 + index * 16;
    context.save();
    context.setLineDash([4, 4]);
    context.beginPath();
    context.arc(x, Math.min(height - 20, y), 5, 0, Math.PI * 2);
    context.stroke();
    context.restore();
  }

  function renderList(entities) {
    if (entities.length === 0) {
      const item = document.createElement("li");
      item.className = "empty-row";
      item.textContent = drawing.entities.length === 0 ? "No entities" : "No matching entities";
      entityList.replaceChildren(item);
      return;
    }

    entityList.replaceChildren(
      ...entities.map((entity) => {
        const item = document.createElement("li");
        item.style.borderLeftColor = colors[entity.type] || colors.UNKNOWN;

        const title = document.createElement("div");
        title.className = "entity-title";

        const type = document.createElement("span");
        type.textContent = entity.type;

        const handle = document.createElement("span");
        handle.textContent = entity.handle ? `#${entity.handle}` : "";

        const detail = document.createElement("div");
        detail.className = "entity-detail";
        detail.textContent = entityDetail(entity);

        title.append(type, handle);
        item.append(title, detail);
        return item;
      }),
    );
  }

  function entityDetail(entity) {
    const layer = entity.layer || "0";

    if (entity.type === "LINE") {
      return `${layer} / (${format(entity.start.x)}, ${format(entity.start.y)}) to (${format(entity.end.x)}, ${format(entity.end.y)})`;
    }

    if (entity.type === "POINT") {
      return `${layer} / (${format(entity.location.x)}, ${format(entity.location.y)})`;
    }

    if (entity.type === "CIRCLE") {
      return `${layer} / center (${format(entity.center.x)}, ${format(entity.center.y)}), r ${format(entity.radius)}`;
    }

    if (entity.type === "ARC") {
      return `${layer} / center (${format(entity.center.x)}, ${format(entity.center.y)}), r ${format(entity.radius)}`;
    }

    if (entity.type === "ELLIPSE") {
      return `${layer} / center (${format(entity.center.x)}, ${format(entity.center.y)}), major ${format(vectorLength(entity.majorAxis))}`;
    }

    if (isPolyline(entity)) {
      return `${layer} / ${entity.vertices.length} vertices${entity.closed ? ", closed" : ""}`;
    }

    if (isText(entity)) {
      return `${layer} / ${entity.value}`;
    }

    return `${layer} / ${entity.rawType || entity.variant || "entity"}`;
  }

  function boundsFor(entities) {
    const points = [];

    for (const entity of entities) {
      if (entity.type === "LINE") {
        points.push(entity.start, entity.end);
      } else if (entity.type === "CIRCLE" || entity.type === "ARC") {
        points.push(
          { x: entity.center.x - entity.radius, y: entity.center.y - entity.radius },
          { x: entity.center.x + entity.radius, y: entity.center.y + entity.radius },
        );
      } else if (entity.type === "ELLIPSE") {
        const major = vectorLength(entity.majorAxis);
        const radius = major * Math.max(1, entity.minorAxisRatio);
        points.push(
          { x: entity.center.x - radius, y: entity.center.y - radius },
          { x: entity.center.x + radius, y: entity.center.y + radius },
        );
      } else if (isPolyline(entity)) {
        points.push(...entity.vertices);
      } else if (isText(entity)) {
        points.push(entity.insertionPoint);
      } else if (entity.type === "POINT") {
        points.push(entity.location);
      }
    }

    if (points.length === 0) {
      return { minX: 0, minY: 0, maxX: 1, maxY: 1 };
    }

    return {
      minX: Math.min(...points.map((point) => point.x)),
      minY: Math.min(...points.map((point) => point.y)),
      maxX: Math.max(...points.map((point) => point.x)),
      maxY: Math.max(...points.map((point) => point.y)),
    };
  }

  function createTransform(bounds, width, height) {
    const padding = 44;
    const cadWidth = Math.max(1, bounds.maxX - bounds.minX);
    const cadHeight = Math.max(1, bounds.maxY - bounds.minY);
    const scale = Math.min(
      Math.max(1, width - padding * 2) / cadWidth,
      Math.max(1, height - padding * 2) / cadHeight,
    );
    const offsetX = (width - cadWidth * scale) / 2;
    const offsetY = (height - cadHeight * scale) / 2;

    return {
      scale,
      point(point) {
        return {
          x: offsetX + (point.x - bounds.minX) * scale,
          y: height - offsetY - (point.y - bounds.minY) * scale,
        };
      },
    };
  }

  function format(value) {
    return Number(value).toFixed(2).replace(/\.00$/, "");
  }

  function isPolyline(entity) {
    return entity.type === "POLYLINE" ||
      entity.type === "POLYLINE_2D" ||
      entity.type === "POLYLINE_3D" ||
      entity.type === "LWPOLYLINE";
  }

  function isText(entity) {
    return entity.type === "TEXT" || entity.type === "MTEXT";
  }

  function vectorLength(vector) {
    return Math.hypot(vector.x, vector.y, vector.z || 0);
  }
})();
