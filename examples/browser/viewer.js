(function () {
  "use strict";

  const drawing = window.ACADRUST_SAMPLE;
  const canvas = document.querySelector("#viewport");
  const context = canvas.getContext("2d");
  const typeFilter = document.querySelector("#typeFilter");
  const layerFilter = document.querySelector("#layerFilter");
  const showUnsupported = document.querySelector("#showUnsupported");
  const entityList = document.querySelector("#entityList");

  const colors = {
    LINE: "#0f6b99",
    CIRCLE: "#bd3f32",
    ARC: "#7a4bb3",
    POLYLINE: "#1d7a46",
    TEXT: "#9a5a00",
    UNKNOWN: "#68707a",
  };

  document.querySelector("#versionValue").textContent = drawing.version;
  document.querySelector("#entityCountValue").textContent = String(drawing.summary.entityCount);
  document.querySelector("#unsupportedValue").textContent = String(drawing.summary.unsupportedEntityCount);

  populateSelect(typeFilter, ["ALL", ...unique(drawing.entities.map((entity) => entity.type))]);
  populateSelect(layerFilter, ["ALL", ...unique(drawing.entities.map((entity) => entity.layer || "0"))]);

  typeFilter.addEventListener("change", render);
  layerFilter.addEventListener("change", render);
  showUnsupported.addEventListener("change", render);
  window.addEventListener("resize", render);

  render();

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

    const transform = createTransform(boundsFor(entities), rect.width, rect.height);
    drawGrid(rect.width, rect.height);

    context.lineCap = "round";
    context.lineJoin = "round";

    for (const entity of entities) {
      context.strokeStyle = colors[entity.type] || colors.UNKNOWN;
      context.fillStyle = colors[entity.type] || colors.UNKNOWN;
      context.lineWidth = entity.type === "UNKNOWN" ? 1 : 2;

      if (entity.type === "LINE") {
        drawLine(entity, transform);
      } else if (entity.type === "CIRCLE") {
        drawCircle(entity, transform);
      } else if (entity.type === "ARC") {
        drawArc(entity, transform);
      } else if (entity.type === "POLYLINE") {
        drawPolyline(entity, transform);
      } else if (entity.type === "TEXT") {
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

    if (entity.type === "CIRCLE") {
      return `${layer} / center (${format(entity.center.x)}, ${format(entity.center.y)}), r ${format(entity.radius)}`;
    }

    if (entity.type === "ARC") {
      return `${layer} / center (${format(entity.center.x)}, ${format(entity.center.y)}), r ${format(entity.radius)}`;
    }

    if (entity.type === "POLYLINE") {
      return `${layer} / ${entity.vertices.length} vertices${entity.closed ? ", closed" : ""}`;
    }

    if (entity.type === "TEXT") {
      return `${layer} / ${entity.value}`;
    }

    return `${layer} / ${entity.rawType || "unsupported"}`;
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
      } else if (entity.type === "POLYLINE") {
        points.push(...entity.vertices);
      } else if (entity.type === "TEXT") {
        points.push(entity.insertionPoint);
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
})();
