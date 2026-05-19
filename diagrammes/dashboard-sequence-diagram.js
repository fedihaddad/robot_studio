function createSvgEl(tag, attrs = {}) {
  const el = document.createElementNS("http://www.w3.org/2000/svg", tag);
  Object.entries(attrs).forEach(([key, value]) => {
    el.setAttribute(key, String(value));
  });
  return el;
}

function getCurrentSvg() {
  return document.querySelector("#diagram svg");
}

function getSerializedSvg() {
  const svg = getCurrentSvg();
  if (!svg) {
    throw new Error("Aucun diagramme SVG trouve.");
  }

  const clone = svg.cloneNode(true);
  clone.setAttribute("xmlns", "http://www.w3.org/2000/svg");
  return new XMLSerializer().serializeToString(clone);
}

function triggerDownload(blob, filename) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function downloadSvg() {
  const svgText = getSerializedSvg();
  const blob = new Blob([svgText], { type: "image/svg+xml;charset=utf-8" });
  triggerDownload(blob, "dashboard-sequence-diagram.svg");
}

function downloadPng() {
  const svg = getCurrentSvg();
  if (!svg) {
    throw new Error("Aucun diagramme SVG trouve.");
  }

  const svgText = getSerializedSvg();
  const svgBlob = new Blob([svgText], { type: "image/svg+xml;charset=utf-8" });
  const url = URL.createObjectURL(svgBlob);
  const image = new Image();

  const viewBox = svg.getAttribute("viewBox")?.split(/\s+/).map(Number) || [0, 0, 1600, 860];
  const width = viewBox[2] || 1600;
  const height = viewBox[3] || 860;

  image.onload = () => {
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      URL.revokeObjectURL(url);
      throw new Error("Impossible de creer le canvas PNG.");
    }

    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, width, height);
    ctx.drawImage(image, 0, 0, width, height);

    canvas.toBlob((blob) => {
      URL.revokeObjectURL(url);
      if (!blob) {
        throw new Error("Echec de generation du PNG.");
      }
      triggerDownload(blob, "dashboard-sequence-diagram.png");
    }, "image/png");
  };

  image.onerror = () => {
    URL.revokeObjectURL(url);
    throw new Error("Impossible de charger le SVG pour l'export PNG.");
  };

  image.src = url;
}

const actors = [
  { id: "op", name: "Operateur", x: 110, width: 210 },
  { id: "ev", name: "EnhancedVisualization", x: 330, width: 210 },
  { id: "vp", name: "Visualization3DPage", x: 610, width: 210 },
  { id: "hook", name: "useServoControl", x: 890, width: 210 },
  { id: "ros", name: "ROSService / ROS2", x: 1170, width: 210 },
  { id: "urdf", name: "URDFBuilder", x: 1450, width: 210 },
];

const activations = [
  { x: 330, y: 120, h: 510 },
  { x: 610, y: 250, h: 260 },
  { x: 890, y: 360, h: 100 },
  { x: 1170, y: 420, h: 150 },
  { x: 1450, y: 570, h: 100 },
];

const messages = [
  {
    from: "op",
    to: "ev",
    y: 140,
    label: "Interaction sur une articulation 3D",
    dashed: false,
  },
  {
    from: "ev",
    to: "ev",
    y: 200,
    label: "Detection de l'objet selectionne",
    dashed: false,
    self: true,
  },
  {
    from: "ev",
    to: "vp",
    y: 280,
    label: "Transmission du mouvement detecte",
    dashed: false,
  },
  {
    from: "vp",
    to: "vp",
    y: 330,
    label: "handleJointDrag()",
    dashed: false,
    self: true,
  },
  {
    from: "vp",
    to: "vp",
    y: 380,
    label: "handleServoChange()",
    dashed: false,
    self: true,
  },
  {
    from: "vp",
    to: "hook",
    y: 430,
    label: "Envoi d'une commande de mouvement",
    dashed: false,
  },
  {
    from: "hook",
    to: "ros",
    y: 480,
    label: "publishServoCommand()",
    dashed: false,
  },
  {
    from: "ros",
    to: "ros",
    y: 530,
    label: "Publication vers ROS 2",
    dashed: false,
    self: true,
  },
  {
    from: "ros",
    to: "vp",
    y: 590,
    label: "Retour des etats articulaires",
    dashed: true,
  },
  {
    from: "vp",
    to: "urdf",
    y: 640,
    label: "updateJoint()",
    dashed: true,
  },
  {
    from: "urdf",
    to: "urdf",
    y: 690,
    label: "Quaternion",
    dashed: true,
    self: true,
  },
  {
    from: "urdf",
    to: "op",
    y: 760,
    label: "Rendu 3D mis a jour",
    dashed: true,
  },
];

function actorById(id) {
  return actors.find((actor) => actor.id === id);
}

function drawTextMultiline(svg, x, y, text, opts = {}) {
  const lines = String(text).split("\\n");
  const textEl = createSvgEl("text", {
    x,
    y,
    "text-anchor": opts.anchor || "middle",
    "font-size": opts.size || 15,
    "font-family": "Segoe UI, Arial, sans-serif",
    fill: opts.fill || "#0f172a",
    "font-weight": opts.weight || "400",
    "dominant-baseline": opts.baseline || "auto",
  });

  lines.forEach((line, index) => {
    const tspan = createSvgEl("tspan", {
      x,
      dy: index === 0 ? 0 : 18,
    });
    tspan.textContent = line;
    textEl.appendChild(tspan);
  });

  svg.appendChild(textEl);
}

function drawActor(svg, actor) {
  const width = actor.width || 210;
  const height = 50;
  const top = 24;

  const rect = createSvgEl("rect", {
    x: actor.x - width / 2,
    y: top,
    width,
    height,
    rx: 8,
    fill: "#dbeafe",
    stroke: "#60a5fa",
    "stroke-width": 2,
  });
  svg.appendChild(rect);

  drawTextMultiline(svg, actor.x, top + height / 2 + 1, actor.name, {
    size: 17,
    weight: "700",
    fill: "#1e3a8a",
    baseline: "middle",
  });

  const lifeline = createSvgEl("line", {
    x1: actor.x,
    y1: top + height + 4,
    x2: actor.x,
    y2: 820,
    stroke: "#94a3b8",
    "stroke-width": 1.4,
    "stroke-dasharray": "8 8",
  });
  svg.appendChild(lifeline);
}

function drawActivation(svg, activation) {
  const rect = createSvgEl("rect", {
    x: activation.x - 8,
    y: activation.y,
    width: 16,
    height: activation.h,
    fill: "#bfdbfe",
    stroke: "#60a5fa",
    "stroke-width": 1,
    rx: 3,
  });
  svg.appendChild(rect);
}

function drawArrowMarker(svg) {
  const defs = createSvgEl("defs");

  const marker = createSvgEl("marker", {
    id: "seq-arrow",
    markerWidth: 10,
    markerHeight: 7,
    refX: 9,
    refY: 3.5,
    orient: "auto",
  });
  marker.appendChild(
    createSvgEl("path", {
      d: "M0,0 L10,3.5 L0,7 Z",
      fill: "#111827",
    })
  );

  const markerDashed = createSvgEl("marker", {
    id: "seq-arrow-dashed",
    markerWidth: 10,
    markerHeight: 7,
    refX: 9,
    refY: 3.5,
    orient: "auto",
  });
  markerDashed.appendChild(
    createSvgEl("path", {
      d: "M0,0 L10,3.5 L0,7 Z",
      fill: "#64748b",
    })
  );

  defs.appendChild(marker);
  defs.appendChild(markerDashed);
  svg.appendChild(defs);
}

function drawMessage(svg, msg) {
  const from = actorById(msg.from);
  const to = actorById(msg.to);
  if (!from || !to) return;

  if (msg.self) {
    const startX = from.x + 8;
    const loopWidth = 70;
    const path = createSvgEl("path", {
      d: `M ${startX} ${msg.y} h ${loopWidth} v 28 h -${loopWidth}`,
      fill: "none",
      stroke: msg.dashed ? "#64748b" : "#111827",
      "stroke-width": 2.1,
      "marker-end": `url(#${msg.dashed ? "seq-arrow-dashed" : "seq-arrow"})`,
    });

    if (msg.dashed) {
      path.setAttribute("stroke-dasharray", "7 6");
    }

    svg.appendChild(path);

    drawTextMultiline(svg, startX + loopWidth + 8, msg.y + 10, msg.label, {
      anchor: "start",
      size: 13,
      fill: "#334155",
    });
    return;
  }

  const line = createSvgEl("line", {
    x1: from.x,
    y1: msg.y,
    x2: to.x,
    y2: msg.y,
    stroke: msg.dashed ? "#64748b" : "#111827",
    "stroke-width": 2.1,
    "stroke-dasharray": msg.dashed ? "7 6" : "",
    "marker-end": `url(#${msg.dashed ? "seq-arrow-dashed" : "seq-arrow"})`,
  });
  svg.appendChild(line);

  const midX = (from.x + to.x) / 2;
  drawTextMultiline(svg, midX, msg.y - 2, msg.label, {
    size: 13,
    fill: "#334155",
  });
}

function renderDashboardSequenceDiagram(containerId = "diagram") {
  const container = document.getElementById(containerId);
  if (!container) {
    throw new Error(`Container "${containerId}" not found`);
  }

  container.innerHTML = "";

  const svg = createSvgEl("svg", {
    viewBox: "0 0 1600 860",
    width: "100%",
    height: "auto",
    role: "img",
    "aria-label": "Diagramme de sequence du raycasting du Dashboard AXEL",
  });

  svg.appendChild(
    createSvgEl("rect", {
      x: 0,
      y: 0,
      width: 1600,
      height: 860,
      fill: "#ffffff",
    })
  );

  drawArrowMarker(svg);
  actors.forEach((actor) => drawActor(svg, actor));
  activations.forEach((activation) => drawActivation(svg, activation));
  messages.forEach((message) => drawMessage(svg, message));

  container.appendChild(svg);
}

window.renderDashboardSequenceDiagram = renderDashboardSequenceDiagram;
window.downloadDashboardSequenceSvg = downloadSvg;
window.downloadDashboardSequencePng = downloadPng;

function wireToolbar() {
  const svgBtn = document.getElementById("download-svg-btn");
  const pngBtn = document.getElementById("download-png-btn");

  if (svgBtn) {
    svgBtn.addEventListener("click", () => {
      try {
        downloadSvg();
      } catch (error) {
        alert(error instanceof Error ? error.message : String(error));
      }
    });
  }

  if (pngBtn) {
    pngBtn.addEventListener("click", () => {
      try {
        downloadPng();
      } catch (error) {
        alert(error instanceof Error ? error.message : String(error));
      }
    });
  }
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => {
    renderDashboardSequenceDiagram();
    wireToolbar();
  });
} else {
  renderDashboardSequenceDiagram();
  wireToolbar();
}
