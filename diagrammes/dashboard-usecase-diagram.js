/**
 * Diagramme de Cas d'Utilisation Global — Robot AXEL
 * Généré en SVG pur, fidèle au diagramme UML de référence.
 */

function createSvgEl(tag, attrs = {}) {
  const el = document.createElementNS("http://www.w3.org/2000/svg", tag);
  Object.entries(attrs).forEach(([k, v]) => el.setAttribute(k, String(v)));
  return el;
}

function buildUsecaseDiagram(container) {
  const W = 920, H = 730;

  const svg = createSvgEl("svg", {
    width: W, height: H,
    viewBox: `0 0 ${W} ${H}`,
    style: "background:#fff;font-family:'Segoe UI',Arial,sans-serif;"
  });

  // ── DEFS (marqueurs flèches) ──────────────────────────────────────
  const defs = createSvgEl("defs");

  // Flèche ouverte pour associations (trait plein)
  const markerAssoc = createSvgEl("marker", {
    id: "arr-assoc", markerWidth: 10, markerHeight: 7,
    refX: 9, refY: 3.5, orient: "auto"
  });
  const polyAssoc = createSvgEl("polyline", {
    points: "0,0 9,3.5 0,7",
    fill: "none", stroke: "#333", "stroke-width": 1.2
  });
  markerAssoc.appendChild(polyAssoc);
  defs.appendChild(markerAssoc);

  // Flèche ouverte pour relations stéréotypées (pointillés)
  const markerDep = createSvgEl("marker", {
    id: "arr-dep", markerWidth: 10, markerHeight: 7,
    refX: 9, refY: 3.5, orient: "auto"
  });
  const polyDep = createSvgEl("polyline", {
    points: "0,0 9,3.5 0,7",
    fill: "none", stroke: "#444", "stroke-width": 1.2
  });
  markerDep.appendChild(polyDep);
  defs.appendChild(markerDep);

  svg.appendChild(defs);

  // ── HELPERS ──────────────────────────────────────────────────────

  /** Frontière système (rectangle pointillé) */
  function drawBoundary(x, y, w, h, label) {
    const rect = createSvgEl("rect", {
      x, y, width: w, height: h,
      fill: "none", stroke: "#555",
      "stroke-width": 1.5, "stroke-dasharray": "8,4",
      rx: 4
    });
    svg.appendChild(rect);
  }

  /** Acteur (bonhomme UML) */
  function drawActor(cx, cy, label) {
    const g = createSvgEl("g");
    // Tête
    g.appendChild(createSvgEl("circle", { cx, cy: cy - 28, r: 10, fill: "none", stroke: "#222", "stroke-width": 1.5 }));
    // Corps
    g.appendChild(createSvgEl("line", { x1: cx, y1: cy - 18, x2: cx, y2: cy + 5, stroke: "#222", "stroke-width": 1.5 }));
    // Bras
    g.appendChild(createSvgEl("line", { x1: cx - 14, y1: cy - 8, x2: cx + 14, y2: cy - 8, stroke: "#222", "stroke-width": 1.5 }));
    // Jambe gauche
    g.appendChild(createSvgEl("line", { x1: cx, y1: cy + 5, x2: cx - 12, y2: cy + 24, stroke: "#222", "stroke-width": 1.5 }));
    // Jambe droite
    g.appendChild(createSvgEl("line", { x1: cx, y1: cy + 5, x2: cx + 12, y2: cy + 24, stroke: "#222", "stroke-width": 1.5 }));
    // Label
    const txt = createSvgEl("text", {
      x: cx, y: cy + 38,
      "text-anchor": "middle", "font-size": 12, "font-weight": "600", fill: "#222"
    });
    txt.textContent = label;
    g.appendChild(txt);
    svg.appendChild(g);
  }

  /** Acteur système (icône base de données) */
  function drawSystemActor(cx, cy, line1, line2) {
    const g = createSvgEl("g");
    // Rectangle principal
    g.appendChild(createSvgEl("rect", { x: cx - 18, y: cy - 20, width: 36, height: 28, fill: "none", stroke: "#222", "stroke-width": 1.5 }));
    // Lignes internes (3 lignes horizontales)
    [cy - 12, cy - 5, cy + 2].forEach(ly => {
      g.appendChild(createSvgEl("line", { x1: cx - 18, y1: ly, x2: cx + 18, y2: ly, stroke: "#222", "stroke-width": 1 }));
    });
    // Labels
    [line1, line2].forEach((t, i) => {
      const lbl = createSvgEl("text", {
        x: cx, y: cy + 22 + i * 14,
        "text-anchor": "middle", "font-size": 11, "font-weight": "600", fill: "#222"
      });
      lbl.textContent = t;
      g.appendChild(lbl);
    });
    svg.appendChild(g);
  }

  /** Cas d'utilisation (ellipse) */
  function drawUseCase(cx, cy, label, opts = {}) {
    const rx = opts.rx || 72, ry = opts.ry || 24;
    const g = createSvgEl("g");
    g.appendChild(createSvgEl("ellipse", {
      cx, cy, rx, ry,
      fill: "#fff", stroke: "#333", "stroke-width": 1.5
    }));
    // Découpe le label en lignes si "/" présent
    const lines = label.split("/");
    lines.forEach((line, i) => {
      const offset = lines.length > 1 ? (i - (lines.length - 1) / 2) * 14 : 0;
      const txt = createSvgEl("text", {
        x: cx, y: cy + offset + 4,
        "text-anchor": "middle", "font-size": 11.5, fill: "#111"
      });
      txt.textContent = line.trim();
      g.appendChild(txt);
    });
    svg.appendChild(g);
  }

  /** Ligne d'association (trait plein avec flèche) */
  function assocLine(x1, y1, x2, y2) {
    svg.appendChild(createSvgEl("line", {
      x1, y1, x2, y2,
      stroke: "#333", "stroke-width": 1.3,
      "marker-end": "url(#arr-assoc)"
    }));
  }

  /** Relation stéréotypée (pointillés + flèche + label) */
  function depLine(x1, y1, x2, y2, stereotype, lx, ly) {
    svg.appendChild(createSvgEl("line", {
      x1, y1, x2, y2,
      stroke: "#444", "stroke-width": 1.2,
      "stroke-dasharray": "5,3",
      "marker-end": "url(#arr-dep)"
    }));
    if (stereotype) {
      const tx = lx !== undefined ? lx : (x1 + x2) / 2;
      const ty = ly !== undefined ? ly : (y1 + y2) / 2 - 4;
      const label = `«${stereotype}»`;
      // Fond blanc pour lisibilité
      const bg = createSvgEl("rect", {
        x: tx - 28, y: ty - 11,
        width: 56, height: 14,
        fill: "#fff", rx: 2
      });
      svg.appendChild(bg);
      const t = createSvgEl("text", {
        x: tx, y: ty,
        "text-anchor": "middle", "font-size": 9.5,
        "font-style": "italic", fill: "#333", "font-weight": "600"
      });
      t.textContent = label;
      svg.appendChild(t);
    }
  }

  // ── DESSIN ──────────────────────────────────────────────────────

  // Frontière système
  drawBoundary(155, 30, 660, 670, "");

  // ── ACTEURS ──
  drawActor(68, 148, "Utilisateur");         // Utilisateur
  drawActor(68, 520, "Admin");               // Admin
  drawSystemActor(862, 88, "Gemini API", "(Google AI)");  // Gemini API

  // ── CAS D'UTILISATION ──
  // Colonne centrale-gauche (interactions vocales)
  drawUseCase(310, 88,  "Interagir vocalement",       { rx: 85 });
  drawUseCase(358, 195, "Analyser contexte/& planifier", { rx: 85 });

  // Colonne droite (vision)
  drawUseCase(592, 138, "Reconnaître/objet",      { rx: 66 });
  drawUseCase(592, 195, "Identifier personne",    { rx: 72 });
  drawUseCase(592, 256, "Suivre personne",         { rx: 66 });

  // Trajectoire
  drawUseCase(310, 340, "Suivre/trajectoire",     { rx: 72 });
  drawUseCase(592, 325, "Tourner/à gauche / droite", { rx: 72 });
  drawUseCase(592, 378, "Saisir un objet",         { rx: 66 });
  drawUseCase(592, 433, "Éviter obstacles",        { rx: 66 });

  // Admin
  drawUseCase(310, 508, "Configurer paramètres/système", { rx: 85 });
  drawUseCase(310, 578, "Mettre à jour firmware",        { rx: 85 });
  drawUseCase(530, 508, "Gérer Matériel",                { rx: 66 });
  drawUseCase(530, 578, "Configurer/Réseau",             { rx: 66 });

  // ── ASSOCIATIONS (traits pleins) ──
  // Utilisateur → Interagir vocalement
  assocLine(100, 138, 224, 100);
  // Utilisateur → Suivre trajectoire
  assocLine(100, 160, 236, 328);
  // Admin → Configurer paramètres système
  assocLine(100, 508, 224, 508);
  // Admin → Mettre à jour firmware
  assocLine(100, 518, 224, 574);
  // Gemini API → Interagir vocalement
  assocLine(844, 88, 396, 88);

  // ── RELATIONS STÉRÉOTYPÉES ──
  // Analyser contexte --extends--> Interagir vocalement (inversé)
  depLine(358, 170, 320, 112, "extend", 298, 133);
  // Analyser contexte --includes--> Reconnaître objet
  depLine(438, 182, 526, 150, "include", 492, 158);
  // Analyser contexte --includes--> Identifier personne
  depLine(442, 195, 520, 195, "include", 488, 184);
  // Suivre personne --extends--> Analyser contexte
  depLine(526, 248, 438, 212, "extend", 490, 222);

  // Tourner gauche/droite --extends--> Suivre trajectoire
  depLine(520, 325, 382, 335, "extend", 462, 318);
  // Saisir objet --extends--> Suivre trajectoire
  depLine(526, 378, 382, 350, "extend", 465, 358);
  // Suivre trajectoire --includes--> Éviter obstacles
  depLine(382, 356, 526, 433, "include", 438, 382);

  // Suivre trajectoire --extends--> Interagir vocalement (passe à gauche d'Analyser contexte)
  depLine(255, 322, 232, 112, "extend", 218, 215);

  // Configurer paramètres --includes--> Gérer Matériel
  depLine(394, 504, 463, 506, "include", 442, 493);
  // Configurer Réseau --extends--> Configurer paramètres système
  depLine(463, 578, 394, 520, "extend", 445, 544);

  container.innerHTML = "";
  container.appendChild(svg);
}

// ── EXPORT SVG / PNG ─────────────────────────────────────────────

function getSerializedSvgUsecase() {
  const svg = document.querySelector("#diagram svg");
  if (!svg) throw new Error("SVG non trouvé.");
  const clone = svg.cloneNode(true);
  clone.setAttribute("xmlns", "http://www.w3.org/2000/svg");
  return new XMLSerializer().serializeToString(clone);
}

function downloadSvgUsecase() {
  const data = getSerializedSvgUsecase();
  const blob = new Blob([data], { type: "image/svg+xml;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = "usecase-diagram.svg";
  document.body.appendChild(a); a.click();
  document.body.removeChild(a); URL.revokeObjectURL(url);
}

function downloadPngUsecase() {
  const data = getSerializedSvgUsecase();
  const blob = new Blob([data], { type: "image/svg+xml;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const img = new Image();
  img.onload = () => {
    const SCALE = 4; // ×4 = 3680×2920px — qualité rapport imprimé 300 DPI
    const canvas = document.createElement("canvas");
    canvas.width = 920 * SCALE;
    canvas.height = 730 * SCALE;
    const ctx = canvas.getContext("2d");
    ctx.scale(SCALE, SCALE);
    ctx.fillStyle = "#fff";
    ctx.fillRect(0, 0, 920, 730);
    ctx.drawImage(img, 0, 0, 920, 730);
    URL.revokeObjectURL(url);
    canvas.toBlob(pngBlob => {
      const pUrl = URL.createObjectURL(pngBlob);
      const a = document.createElement("a");
      a.href = pUrl; a.download = "usecase-diagram.png";
      document.body.appendChild(a); a.click();
      document.body.removeChild(a); URL.revokeObjectURL(pUrl);
    }, "image/png");
  };
  img.src = url;
}
