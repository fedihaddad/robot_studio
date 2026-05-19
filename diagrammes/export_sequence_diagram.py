from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path
from typing import List
import math
import xml.etree.ElementTree as ET

from PIL import Image, ImageDraw, ImageFont


@dataclass
class Actor:
    id: str
    name: str
    x: int


@dataclass
class Activation:
    x: int
    y: int
    h: int


@dataclass
class Message:
    from_id: str
    to_id: str
    y: int
    label: str
    dashed: bool = False
    self_call: bool = False


WIDTH = 1600
HEIGHT = 860
BG = "#f8fafc"
ACTOR_FILL = "#dbeafe"
ACTOR_STROKE = "#60a5fa"
ACTOR_TEXT = "#1e3a8a"
LIFELINE = "#94a3b8"
ACTIVATION_FILL = "#bfdbfe"
ACTIVATION_STROKE = "#60a5fa"
MSG_SOLID = "#111827"
MSG_DASHED = "#64748b"
LABEL_FILL = "#334155"

ACTORS: List[Actor] = [
    Actor("op", "Opérateur", 80),
    Actor("ev", "EnhancedVisualization", 330),
    Actor("vp", "Visualization3DPage", 610),
    Actor("hook", "useServoControl", 890),
    Actor("ros", "ROSService / ROS2", 1170),
    Actor("urdf", "URDFBuilder", 1450),
]

ACTIVATIONS: List[Activation] = [
    Activation(330, 120, 510),
    Activation(610, 250, 260),
    Activation(890, 360, 100),
    Activation(1170, 420, 150),
    Activation(1450, 570, 100),
]

MESSAGES: List[Message] = [
    Message("op", "ev", 140, "Interaction sur une articulation 3D"),
    Message("ev", "ev", 200, "Détection de l'objet sélectionné", self_call=True),
    Message("ev", "vp", 280, "Transmission du mouvement détecté"),
    Message("vp", "vp", 330, "handleJointDrag()", self_call=True),
    Message("vp", "vp", 380, "handleServoChange()", self_call=True),
    Message("vp", "hook", 430, "Envoi d'une commande de mouvement"),
    Message("hook", "ros", 480, "publishServoCommand()"),
    Message("ros", "ros", 530, "Publication vers ROS 2", self_call=True),
    Message("ros", "vp", 590, "Retour des états articulaires", dashed=True),
    Message("vp", "urdf", 640, "updateJoint()", dashed=True),
    Message("urdf", "urdf", 690, "Quaternion", dashed=True, self_call=True),
    Message("urdf", "op", 760, "Mise à jour du rendu 3D", dashed=True),
]


def get_actor(actor_id: str) -> Actor:
    return next(a for a in ACTORS if a.id == actor_id)


def escape_xml(text: str) -> str:
    return (
        text.replace("&", "&amp;")
        .replace("<", "&lt;")
        .replace(">", "&gt;")
        .replace('"', "&quot;")
    )


def build_svg(output_path: Path) -> None:
    ET.register_namespace("", "http://www.w3.org/2000/svg")
    svg = ET.Element(
        "{http://www.w3.org/2000/svg}svg",
        {
            "viewBox": f"0 0 {WIDTH} {HEIGHT}",
            "width": str(WIDTH),
            "height": str(HEIGHT),
            "xmlns": "http://www.w3.org/2000/svg",
        },
    )

    defs = ET.SubElement(svg, "defs")
    marker_solid = ET.SubElement(
        defs,
        "marker",
        {
            "id": "arrow-solid",
            "markerWidth": "10",
            "markerHeight": "7",
            "refX": "9",
            "refY": "3.5",
            "orient": "auto",
        },
    )
    ET.SubElement(marker_solid, "path", {"d": "M0,0 L10,3.5 L0,7 Z", "fill": MSG_SOLID})

    marker_dashed = ET.SubElement(
        defs,
        "marker",
        {
            "id": "arrow-dashed",
            "markerWidth": "10",
            "markerHeight": "7",
            "refX": "9",
            "refY": "3.5",
            "orient": "auto",
        },
    )
    ET.SubElement(marker_dashed, "path", {"d": "M0,0 L10,3.5 L0,7 Z", "fill": MSG_DASHED})

    ET.SubElement(
        svg,
        "rect",
        {"x": "0", "y": "0", "width": str(WIDTH), "height": str(HEIGHT), "fill": BG},
    )

    for actor in ACTORS:
        ET.SubElement(
            svg,
            "rect",
            {
                "x": str(actor.x - 105),
                "y": "24",
                "width": "210",
                "height": "42",
                "rx": "8",
                "fill": ACTOR_FILL,
                "stroke": ACTOR_STROKE,
                "stroke-width": "2",
            },
        )
        text = ET.SubElement(
            svg,
            "text",
            {
                "x": str(actor.x),
                "y": "50",
                "text-anchor": "middle",
                "font-size": "17",
                "font-weight": "700",
                "font-family": "Segoe UI, Arial, sans-serif",
                "fill": ACTOR_TEXT,
            },
        )
        text.text = actor.name
        ET.SubElement(
            svg,
            "line",
            {
                "x1": str(actor.x),
                "y1": "70",
                "x2": str(actor.x),
                "y2": "820",
                "stroke": LIFELINE,
                "stroke-width": "1.4",
                "stroke-dasharray": "8 8",
            },
        )

    for activation in ACTIVATIONS:
        ET.SubElement(
            svg,
            "rect",
            {
                "x": str(activation.x - 8),
                "y": str(activation.y),
                "width": "16",
                "height": str(activation.h),
                "rx": "3",
                "fill": ACTIVATION_FILL,
                "stroke": ACTIVATION_STROKE,
                "stroke-width": "1",
            },
        )

    for msg in MESSAGES:
        stroke = MSG_DASHED if msg.dashed else MSG_SOLID
        marker = "url(#arrow-dashed)" if msg.dashed else "url(#arrow-solid)"
        if msg.self_call:
            actor = get_actor(msg.from_id)
            x = actor.x + 8
            path = ET.SubElement(
                svg,
                "path",
                {
                    "d": f"M {x} {msg.y} h 70 v 28 h -70",
                    "fill": "none",
                    "stroke": stroke,
                    "stroke-width": "2.1",
                    "marker-end": marker,
                },
            )
            if msg.dashed:
                path.set("stroke-dasharray", "7 6")

            text = ET.SubElement(
                svg,
                "text",
                {
                    "x": str(actor.x + 86),
                    "y": str(msg.y + 10),
                    "text-anchor": "start",
                    "font-size": "13",
                    "font-family": "Segoe UI, Arial, sans-serif",
                    "fill": LABEL_FILL,
                },
            )
            text.text = msg.label
            continue

        start = get_actor(msg.from_id)
        end = get_actor(msg.to_id)
        line = ET.SubElement(
            svg,
            "line",
            {
                "x1": str(start.x),
                "y1": str(msg.y),
                "x2": str(end.x),
                "y2": str(msg.y),
                "stroke": stroke,
                "stroke-width": "2.1",
                "marker-end": marker,
            },
        )
        if msg.dashed:
            line.set("stroke-dasharray", "7 6")

        mid_x = (start.x + end.x) / 2
        ET.SubElement(
            svg,
            "rect",
            {
                "x": str(mid_x - 110),
                "y": str(msg.y - 22),
                "width": "220",
                "height": "34",
                "rx": "6",
                "fill": "white",
                "opacity": "0.93",
            },
        )
        text = ET.SubElement(
            svg,
            "text",
            {
                "x": str(mid_x),
                "y": str(msg.y - 2),
                "text-anchor": "middle",
                "font-size": "13",
                "font-family": "Segoe UI, Arial, sans-serif",
                "fill": LABEL_FILL,
            },
        )
        text.text = msg.label

    tree = ET.ElementTree(svg)
    tree.write(output_path, encoding="utf-8", xml_declaration=True)


def load_font(size: int, bold: bool = False) -> ImageFont.FreeTypeFont | ImageFont.ImageFont:
    candidates = [
        "C:/Windows/Fonts/arialbd.ttf" if bold else "C:/Windows/Fonts/arial.ttf",
        "C:/Windows/Fonts/segoeuib.ttf" if bold else "C:/Windows/Fonts/segoeui.ttf",
    ]
    for candidate in candidates:
        path = Path(candidate)
        if path.exists():
            return ImageFont.truetype(str(path), size=size)
    return ImageFont.load_default()


def draw_arrow_head(draw: ImageDraw.ImageDraw, x1: float, y1: float, x2: float, y2: float, color: str) -> None:
    angle = math.atan2(y2 - y1, x2 - x1)
    length = 10
    width = 5
    p1 = (x2, y2)
    p2 = (
        x2 - length * math.cos(angle) + width * math.sin(angle),
        y2 - length * math.sin(angle) - width * math.cos(angle),
    )
    p3 = (
        x2 - length * math.cos(angle) - width * math.sin(angle),
        y2 - length * math.sin(angle) + width * math.cos(angle),
    )
    draw.polygon([p1, p2, p3], fill=color)


def draw_dashed_line(draw: ImageDraw.ImageDraw, start: tuple[float, float], end: tuple[float, float], color: str, width: int = 2, dash: int = 10, gap: int = 8) -> None:
    x1, y1 = start
    x2, y2 = end
    total_len = math.dist(start, end)
    if total_len == 0:
      return
    dx = (x2 - x1) / total_len
    dy = (y2 - y1) / total_len
    drawn = 0.0
    while drawn < total_len:
        seg = min(dash, total_len - drawn)
        sx = x1 + dx * drawn
        sy = y1 + dy * drawn
        ex = x1 + dx * (drawn + seg)
        ey = y1 + dy * (drawn + seg)
        draw.line((sx, sy, ex, ey), fill=color, width=width)
        drawn += dash + gap


def build_png(output_path: Path) -> None:
    image = Image.new("RGB", (WIDTH, HEIGHT), BG)
    draw = ImageDraw.Draw(image)
    font_actor = load_font(17, bold=True)
    font_label = load_font(13, bold=False)

    for actor in ACTORS:
        draw.rounded_rectangle((actor.x - 105, 24, actor.x + 105, 66), radius=8, fill=ACTOR_FILL, outline=ACTOR_STROKE, width=2)
        bbox = draw.textbbox((0, 0), actor.name, font=font_actor)
        tw = bbox[2] - bbox[0]
        th = bbox[3] - bbox[1]
        draw.text((actor.x - tw / 2, 45 - th / 2), actor.name, fill=ACTOR_TEXT, font=font_actor)

        for y in range(70, 820, 16):
            draw.line((actor.x, y, actor.x, min(y + 8, 820)), fill=LIFELINE, width=1)

    for activation in ACTIVATIONS:
        draw.rounded_rectangle((activation.x - 8, activation.y, activation.x + 8, activation.y + activation.h), radius=3, fill=ACTIVATION_FILL, outline=ACTIVATION_STROKE, width=1)

    for msg in MESSAGES:
        color = MSG_DASHED if msg.dashed else MSG_SOLID
        if msg.self_call:
            actor = get_actor(msg.from_id)
            x = actor.x + 8
            top = msg.y
            pts = [(x, top), (x + 70, top), (x + 70, top + 28), (x, top + 28)]
            if msg.dashed:
                draw_dashed_line(draw, pts[0], pts[1], color)
                draw_dashed_line(draw, pts[1], pts[2], color)
                draw_dashed_line(draw, pts[2], pts[3], color)
            else:
                draw.line(pts[:2], fill=color, width=2)
                draw.line(pts[1:3], fill=color, width=2)
                draw.line(pts[2:4], fill=color, width=2)
            draw_arrow_head(draw, x + 70, top + 28, x, top + 28, color)
            draw.text((actor.x + 86, msg.y + 2), msg.label, fill=LABEL_FILL, font=font_label)
            continue

        start = get_actor(msg.from_id)
        end = get_actor(msg.to_id)
        if msg.dashed:
            draw_dashed_line(draw, (start.x, msg.y), (end.x, msg.y), color)
        else:
            draw.line((start.x, msg.y, end.x, msg.y), fill=color, width=2)
        draw_arrow_head(draw, start.x, msg.y, end.x, msg.y, color)

        mid_x = (start.x + end.x) / 2
        draw.rounded_rectangle((mid_x - 110, msg.y - 22, mid_x + 110, msg.y + 12), radius=6, fill="white", outline=None)
        bbox = draw.textbbox((0, 0), msg.label, font=font_label)
        tw = bbox[2] - bbox[0]
        th = bbox[3] - bbox[1]
        draw.text((mid_x - tw / 2, msg.y - 18), msg.label, fill=LABEL_FILL, font=font_label)

    image.save(output_path)


def main() -> None:
    base = Path(__file__).resolve().parent
    svg_path = base / "dashboard-sequence-diagram.svg"
    png_path = base / "dashboard-sequence-diagram.png"
    build_svg(svg_path)
    build_png(png_path)
    print(f"Created: {svg_path}")
    print(f"Created: {png_path}")


if __name__ == "__main__":
    main()
