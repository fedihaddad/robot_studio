function createSvgNode(tag, attrs = {}) {
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
  triggerDownload(blob, "dashboard-class-diagram.svg");
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
  const viewBox = svg.getAttribute("viewBox")?.split(/\s+/).map(Number) || [0, 0, 1500, 1120];
  const width = viewBox[2] || 1500;
  const height = viewBox[3] || 1120;

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
      triggerDownload(blob, "dashboard-class-diagram.png");
    }, "image/png");
  };

  image.onerror = () => {
    URL.revokeObjectURL(url);
    throw new Error("Impossible de charger le SVG pour l'export PNG.");
  };

  image.src = url;
}

const classes = [
  {
    id: "ros",
    title: "ROSService",
    kind: "service",
    attributes: [
      "- ros : ROSLIB.Ros",
      "- subscribers : Map",
      "- publishers : Map",
    ],
    methods: [
      "+ connect()",
      "+ subscribe()",
      "+ publish()",
      "+ publishServoCommand()",
    ],
    x: 60,
    y: 90,
  },
  {
    id: "app",
    title: "App",
    kind: "core",
    attributes: [
      "- rosServiceRef : ROSService",
      "- modeServiceRef : ModeService",
      "- currentPage : number",
    ],
    methods: [
      "+ connectROS()",
      "+ handleServoCommand()",
      "+ handleModeChange()",
      "+ handleEmergencyStop()",
    ],
    x: 520,
    y: 90,
  },
  {
    id: "mode",
    title: "ModeService",
    kind: "service",
    attributes: [
      "- rosBridge : any",
      "- modePublisher : Topic",
      "- currentMode : RobotMode",
    ],
    methods: [
      "+ publishModeCommand()",
      "+ getCurrentMode()",
      "+ disconnect()",
    ],
    x: 980,
    y: 90,
  },
  {
    id: "model",
    title: "ModelService",
    kind: "model",
    attributes: [
      "- urdf : URDFRobot",
      "- robotScene : THREE.Group",
      "- builder : URDFBuilder",
    ],
    methods: [
      "+ getInstance()",
      "+ preloadModel()",
      "+ getRobotScene()",
      "+ getBuilder()",
    ],
    x: 60,
    y: 470,
  },
  {
    id: "viz",
    title: "Visualization3DPage",
    kind: "ui",
    attributes: [
      "- rosService : ROSService",
      "- activeTab : string",
      "- currentSliderValues : Record",
    ],
    methods: [
      "+ handleServoChange()",
      "+ handleJointDrag()",
      "+ runGesture()",
    ],
    x: 520,
    y: 470,
  },
  {
    id: "enhanced",
    title: "EnhancedVisualization",
    kind: "ui",
    attributes: [
      "- urdfBuilderRef : URDFBuilder",
      "- rosServiceRef : ROSService",
      "- trajectoryPlayerRef : TrajectoryPlayer",
    ],
    methods: [
      "+ onJointDrag()",
      "+ render()",
      "+ setupScene()",
    ],
    x: 980,
    y: 470,
  },
  {
    id: "builder",
    title: "URDFBuilder",
    kind: "model",
    attributes: [
      "- urdf : URDFRobot",
      "- jointObjects : Map",
      "- rootGroup : THREE.Group",
    ],
    methods: [
      "+ build()",
      "+ updateJoint()",
      "+ resolveMeshPath()",
    ],
    x: 520,
    y: 850,
  },
];

const relations = [
  { from: "app", to: "ros", label: "utilise", dashed: false },
  { from: "app", to: "mode", label: "cree / utilise", dashed: false },
  { from: "app", to: "model", label: "precharge", dashed: false },
  { from: "app", to: "viz", label: "affiche", dashed: true },
  { from: "viz", to: "ros", label: "envoie commandes", dashed: false },
  { from: "viz", to: "model", label: "utilise", dashed: false },
  { from: "viz", to: "enhanced", label: "integre", dashed: false },
  { from: "model", to: "builder", label: "construit", dashed: false },
  { from: "enhanced", to: "builder", label: "met a jour joints", dashed: true },
  { from: "enhanced", to: "ros", label: "lit etats ROS", dashed: true },
];

const paletteByKind = {
  core: { header: "#dbeafe", border: "#3b82f6", title: "#1e3a8a" },
  service: { header: "#dcfce7", border: "#22c55e", title: "#166534" },
  ui: { header: "#ede9fe", border: "#8b5cf6", title: "#5b21b6" },
  model: { header: "#fef3c7", border: "#f59e0b", title: "#92400e" },
};

function drawLane(svg, x, y, width, height, title, tone) {
  const colors = {
    ui: { fill: "#faf5ff", stroke: "#d8b4fe", text: "#6b21a8" },
    service: { fill: "#f0fdf4", stroke: "#86efac", text: "#166534" },
    model: { fill: "#fffbeb", stroke: "#fcd34d", text: "#92400e" },
  }[tone];

  svg.appendChild(
    createSvgNode("rect", {
      x,
      y,
      width,
      height,
      rx: 18,
      fill: colors.fill,
      stroke: colors.stroke,
      "stroke-width": 1.2,
    })
  );

  const titleNode = createSvgNode("text", {
    x: x + 18,
    y: y + 28,
    "font-size": 16,
    "font-weight": "700",
    "font-family": "Segoe UI, Arial, sans-serif",
    fill: colors.text,
  });
  titleNode.textContent = title;
  svg.appendChild(titleNode);
}

function drawArrow(svg, x1, y1, x2, y2, label, dashed = false) {
  const group = createSvgNode("g");
  const line = createSvgNode("line", {
    x1,
    y1,
    x2,
    y2,
    stroke: "#64748b",
    "stroke-width": 2.4,
    "marker-end": "url(#arrowhead)",
  });

  if (dashed) {
    line.setAttribute("stroke-dasharray", "8 6");
  }

  const midX = (x1 + x2) / 2;
  const midY = (y1 + y2) / 2;

  group.appendChild(line);

  const bg = createSvgNode("rect", {
    x: midX - 72,
    y: midY - 19,
    width: 144,
    height: 24,
    rx: 6,
    fill: "#ffffff",
    opacity: 0.96,
  });
  group.appendChild(bg);

  const text = createSvgNode("text", {
    x: midX,
    y: midY - 2,
    "text-anchor": "middle",
    "font-size": 13,
    "font-family": "Segoe UI, Arial, sans-serif",
    fill: "#334155",
  });
  text.textContent = label;
  group.appendChild(text);

  svg.appendChild(group);
}

function drawClass(svg, box) {
  const width = 330;
  const headerHeight = 44;
  const attrHeight = Math.max(88, box.attributes.length * 22 + 18);
  const methodHeight = Math.max(84, box.methods.length * 22 + 18);
  const totalHeight = headerHeight + attrHeight + methodHeight;
  const palette = paletteByKind[box.kind] || paletteByKind.core;

  box.width = width;
  box.height = totalHeight;

  const group = createSvgNode("g");

  group.appendChild(
    createSvgNode("rect", {
      x: box.x + 6,
      y: box.y + 8,
      width,
      height: totalHeight,
      rx: 12,
      fill: "#94a3b8",
      opacity: 0.12,
    })
  );

  group.appendChild(
    createSvgNode("rect", {
      x: box.x,
      y: box.y,
      width,
      height: totalHeight,
      rx: 12,
      fill: "#ffffff",
      stroke: palette.border,
      "stroke-width": 2,
    })
  );

  group.appendChild(
    createSvgNode("rect", {
      x: box.x,
      y: box.y,
      width,
      height: headerHeight,
      rx: 12,
      fill: palette.header,
      stroke: palette.border,
      "stroke-width": 2,
    })
  );

  group.appendChild(
    createSvgNode("rect", {
      x: box.x,
      y: box.y + 22,
      width,
      height: 22,
      fill: palette.header,
      stroke: "none",
    })
  );

  group.appendChild(
    createSvgNode("line", {
      x1: box.x,
      y1: box.y + headerHeight,
      x2: box.x + width,
      y2: box.y + headerHeight,
      stroke: "#cbd5e1",
      "stroke-width": 1.4,
    })
  );

  group.appendChild(
    createSvgNode("line", {
      x1: box.x,
      y1: box.y + headerHeight + attrHeight,
      x2: box.x + width,
      y2: box.y + headerHeight + attrHeight,
      stroke: "#cbd5e1",
      "stroke-width": 1.4,
    })
  );

  const title = createSvgNode("text", {
    x: box.x + width / 2,
    y: box.y + 28,
    "text-anchor": "middle",
    "font-size": 19,
    "font-weight": "700",
    "font-family": "Segoe UI, Arial, sans-serif",
    fill: palette.title,
  });
  title.textContent = box.title;
  group.appendChild(title);

  box.attributes.forEach((attr, index) => {
    const text = createSvgNode("text", {
      x: box.x + 16,
      y: box.y + headerHeight + 24 + index * 22,
      "font-size": 14,
      "font-family": "Consolas, monospace",
      fill: "#1f2937",
    });
    text.textContent = attr;
    group.appendChild(text);
  });

  box.methods.forEach((method, index) => {
    const text = createSvgNode("text", {
      x: box.x + 16,
      y: box.y + headerHeight + attrHeight + 24 + index * 22,
      "font-size": 14,
      "font-family": "Consolas, monospace",
      fill: "#0f172a",
    });
    text.textContent = method;
    group.appendChild(text);
  });

  svg.appendChild(group);
}

function getAnchor(from, to) {
  const fromCenterX = from.x + from.width / 2;
  const fromCenterY = from.y + from.height / 2;
  const toCenterX = to.x + to.width / 2;
  const toCenterY = to.y + to.height / 2;
  const dx = toCenterX - fromCenterX;
  const dy = toCenterY - fromCenterY;

  if (Math.abs(dx) > Math.abs(dy)) {
    return dx > 0
      ? { x: from.x + from.width, y: fromCenterY }
      : { x: from.x, y: fromCenterY };
  }

  return dy > 0
    ? { x: fromCenterX, y: from.y + from.height }
    : { x: fromCenterX, y: from.y };
}

function renderDashboardClassDiagram(containerId = "diagram") {
  const container = document.getElementById(containerId);
  if (!container) {
    throw new Error(`Container "${containerId}" not found`);
  }

  container.innerHTML = "";

  const svg = createSvgNode("svg", {
    viewBox: "0 0 1500 1220",
    width: "100%",
    height: "auto",
    role: "img",
    "aria-label": "Diagramme de classes du Dashboard AXEL",
  });

  const defs = createSvgNode("defs");
  const marker = createSvgNode("marker", {
    id: "arrowhead",
    markerWidth: 10,
    markerHeight: 7,
    refX: 9,
    refY: 3.5,
    orient: "auto",
  });
  marker.appendChild(
    createSvgNode("path", {
      d: "M0,0 L10,3.5 L0,7 Z",
      fill: "#64748b",
    })
  );
  defs.appendChild(marker);
  svg.appendChild(defs);

  svg.appendChild(
    createSvgNode("rect", {
      x: 0,
      y: 0,
      width: 1500,
      height: 1220,
      fill: "#ffffff",
    })
  );

  drawLane(svg, 32, 48, 1436, 286, "Orchestration et communication", "service");
  drawLane(svg, 32, 420, 1436, 320, "Interface de visualisation", "ui");
  drawLane(svg, 300, 812, 900, 348, "Construction du jumeau numerique", "model");

  classes.forEach((box) => drawClass(svg, box));

  relations.forEach((rel) => {
    const from = classes.find((item) => item.id === rel.from);
    const to = classes.find((item) => item.id === rel.to);
    if (!from || !to) return;
    const start = getAnchor(from, to);
    const end = getAnchor(to, from);
    drawArrow(svg, start.x, start.y, end.x, end.y, rel.label, rel.dashed);
  });

  container.appendChild(svg);
}

window.renderDashboardClassDiagram = renderDashboardClassDiagram;
window.downloadDashboardClassSvg = downloadSvg;
window.downloadDashboardClassPng = downloadPng;

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
    renderDashboardClassDiagram();
    wireToolbar();
  });
} else {
  renderDashboardClassDiagram();
  wireToolbar();
}
