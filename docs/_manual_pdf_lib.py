"""Shared markdown → PDF builder for UniformDesk user manuals."""

from __future__ import annotations

import re
from dataclasses import dataclass
from pathlib import Path

from reportlab.lib import colors
from reportlab.lib.enums import TA_LEFT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import mm
from reportlab.platypus import (
    ListFlowable,
    ListItem,
    PageBreak,
    Paragraph,
    SimpleDocTemplate,
    Spacer,
    Table,
    TableStyle,
)

TEAL = colors.HexColor("#0B5C3B")
NAVY = colors.HexColor("#1A1A1A")
MUTED = colors.HexColor("#5A635C")
LINE = colors.HexColor("#D5DDD4")
SOFT = colors.HexColor("#E6F2EB")
GOLD = colors.HexColor("#C4A35A")
WHITE = colors.white
WASH = colors.HexColor("#F4F6F2")


@dataclass(frozen=True)
class ManualSpec:
    src: Path
    out: Path
    doc_title: str
    footer_label: str
    cover_kicker: str
    cover_subtitle: str
    cover_tagline: str
    how_to_use: str


def styles():
    base = getSampleStyleSheet()
    return {
        "cover_kicker": ParagraphStyle(
            "cover_kicker",
            parent=base["Normal"],
            fontName="Helvetica-Bold",
            fontSize=11,
            textColor=SOFT,
            spaceAfter=8,
        ),
        "cover_title": ParagraphStyle(
            "cover_title",
            parent=base["Normal"],
            fontName="Helvetica-Bold",
            fontSize=26,
            textColor=WHITE,
            spaceAfter=10,
            leading=32,
        ),
        "cover_sub": ParagraphStyle(
            "cover_sub",
            parent=base["Normal"],
            fontName="Helvetica",
            fontSize=11.5,
            textColor=SOFT,
            leading=15,
            spaceAfter=5,
        ),
        "h1": ParagraphStyle(
            "h1",
            parent=base["Heading1"],
            fontName="Helvetica-Bold",
            fontSize=15,
            textColor=TEAL,
            spaceBefore=6,
            spaceAfter=8,
        ),
        "h2": ParagraphStyle(
            "h2",
            parent=base["Heading2"],
            fontName="Helvetica-Bold",
            fontSize=11.5,
            textColor=NAVY,
            spaceBefore=11,
            spaceAfter=5,
        ),
        "h3": ParagraphStyle(
            "h3",
            parent=base["Heading3"],
            fontName="Helvetica-Bold",
            fontSize=10,
            textColor=TEAL,
            spaceBefore=8,
            spaceAfter=3,
        ),
        "body": ParagraphStyle(
            "body",
            parent=base["Normal"],
            fontName="Helvetica",
            fontSize=9.5,
            textColor=NAVY,
            leading=13,
            spaceAfter=5,
            alignment=TA_LEFT,
        ),
        "bullet": ParagraphStyle(
            "bullet",
            parent=base["Normal"],
            fontName="Helvetica",
            fontSize=9.5,
            textColor=NAVY,
            leading=12.5,
            spaceAfter=2,
        ),
        "cell": ParagraphStyle(
            "cell",
            parent=base["Normal"],
            fontName="Helvetica",
            fontSize=8.5,
            textColor=NAVY,
            leading=11,
        ),
        "cell_head": ParagraphStyle(
            "cell_head",
            parent=base["Normal"],
            fontName="Helvetica-Bold",
            fontSize=8.5,
            textColor=TEAL,
            leading=11,
        ),
        "toc": ParagraphStyle(
            "toc",
            parent=base["Normal"],
            fontName="Helvetica",
            fontSize=10,
            textColor=NAVY,
            leading=14,
            spaceAfter=2,
            leftIndent=4,
        ),
    }


def esc(text: str) -> str:
    return (
        text.replace("&", "&amp;")
        .replace("<", "&lt;")
        .replace(">", "&gt;")
    )


def inline(text: str) -> str:
    text = esc(text)
    text = re.sub(r"\*\*(.+?)\*\*", r"<b>\1</b>", text)
    text = re.sub(r"`([^`]+)`", r'<font face="Courier" size="8.5">\1</font>', text)
    text = re.sub(r"\[([^\]]+)\]\([^)]+\)", r"\1", text)
    return text


def parse_table(block_lines: list[str]) -> list[list[str]]:
    rows = []
    for line in block_lines:
        if re.match(r"^\|?\s*:?-+:?\s*(\|\s*:?-+:?\s*)+\|?\s*$", line):
            continue
        cells = [c.strip() for c in line.strip().strip("|").split("|")]
        rows.append(cells)
    return rows


def make_table(rows: list[list[str]], col_widths: list[float], s: dict):
    data = []
    for i, row in enumerate(rows):
        style = s["cell_head"] if i == 0 else s["cell"]
        data.append([Paragraph(inline(c), style) for c in row])
    t = Table(data, colWidths=col_widths, repeatRows=1)
    t.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, 0), SOFT),
                ("TEXTCOLOR", (0, 0), (-1, 0), TEAL),
                ("GRID", (0, 0), (-1, -1), 0.4, LINE),
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
                ("LEFTPADDING", (0, 0), (-1, -1), 5),
                ("RIGHTPADDING", (0, 0), (-1, -1), 5),
                ("TOPPADDING", (0, 0), (-1, -1), 4),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
                ("ROWBACKGROUNDS", (0, 1), (-1, -1), [WHITE, WASH]),
            ]
        )
    )
    return t


def build_manual(spec: ManualSpec) -> Path:
    s = styles()
    md = spec.src.read_text(encoding="utf-8")
    lines = md.splitlines()
    page_w = A4[0] - 36 * mm

    def footer(canvas, doc):
        canvas.saveState()
        canvas.setStrokeColor(LINE)
        canvas.setLineWidth(0.5)
        canvas.line(18 * mm, 12 * mm, A4[0] - 18 * mm, 12 * mm)
        canvas.setFont("Helvetica", 8)
        canvas.setFillColor(MUTED)
        canvas.drawString(18 * mm, 7 * mm, spec.footer_label)
        canvas.drawRightString(A4[0] - 18 * mm, 7 * mm, f"Page {doc.page}")
        canvas.restoreState()

    doc = SimpleDocTemplate(
        str(spec.out),
        pagesize=A4,
        leftMargin=18 * mm,
        rightMargin=18 * mm,
        topMargin=16 * mm,
        bottomMargin=18 * mm,
        title=spec.doc_title,
        author="UniformDesk",
    )
    story: list = []

    cover = Table(
        [
            [Paragraph(esc(spec.cover_kicker), s["cover_kicker"])],
            [Paragraph("UniformDesk", s["cover_title"])],
            [Paragraph(inline(spec.cover_subtitle), s["cover_sub"])],
            [Paragraph(inline(spec.cover_tagline), s["cover_sub"])],
        ],
        colWidths=[page_w],
    )
    cover.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, -1), TEAL),
                ("LEFTPADDING", (0, 0), (-1, -1), 16),
                ("RIGHTPADDING", (0, 0), (-1, -1), 16),
                ("TOPPADDING", (0, 0), (-1, 0), 18),
                ("BOTTOMPADDING", (0, -1), (-1, -1), 18),
                ("TOPPADDING", (0, 1), (-1, -2), 4),
                ("BOTTOMPADDING", (0, 1), (-1, -2), 4),
                ("LINEBELOW", (0, 0), (-1, 0), 2, GOLD),
            ]
        )
    )
    story.append(cover)
    story.append(Spacer(1, 12))
    story.append(Paragraph("How to use this manual", s["h2"]))
    story.append(Paragraph(inline(spec.how_to_use), s["body"]))
    story.append(PageBreak())

    i = 0
    while i < len(lines):
        if lines[i].startswith("## Contents"):
            break
        if re.match(r"^## \d+\.", lines[i]):
            break
        i += 1

    if i < len(lines) and lines[i].startswith("## Contents"):
        story.append(Paragraph("Contents", s["h1"]))
        i += 1
        while i < len(lines) and lines[i].strip() != "---":
            line = lines[i].strip()
            if re.match(r"^\d+\.\s+", line):
                item = re.sub(r"\[([^\]]+)\]\([^)]+\)", r"\1", line)
                story.append(Paragraph(inline(item), s["toc"]))
            i += 1
        if i < len(lines) and lines[i].strip() == "---":
            i += 1
        story.append(Spacer(1, 6))

    bullet_buf: list[str] = []
    numbered_buf: list[str] = []
    table_buf: list[str] = []

    def flush_bullets():
        nonlocal bullet_buf
        if not bullet_buf:
            return
        items = [
            ListItem(Paragraph(inline(b), s["bullet"]), leftIndent=12)
            for b in bullet_buf
        ]
        story.append(
            ListFlowable(
                items,
                bulletType="bullet",
                start="•",
                leftIndent=10,
                bulletFontName="Helvetica",
                bulletFontSize=9,
            )
        )
        story.append(Spacer(1, 4))
        bullet_buf = []

    def flush_numbered():
        nonlocal numbered_buf
        if not numbered_buf:
            return
        items = [
            ListItem(Paragraph(inline(b), s["bullet"]), leftIndent=14, value=str(n))
            for n, b in enumerate(numbered_buf, 1)
        ]
        story.append(
            ListFlowable(
                items,
                bulletType="1",
                leftIndent=12,
                bulletFontName="Helvetica",
                bulletFontSize=9,
            )
        )
        story.append(Spacer(1, 4))
        numbered_buf = []

    def flush_table():
        nonlocal table_buf
        if not table_buf:
            return
        rows = parse_table(table_buf)
        if rows:
            cols = len(rows[0])
            width = page_w / cols
            story.append(make_table(rows, [width] * cols, s))
            story.append(Spacer(1, 6))
        table_buf = []

    def flush_all():
        flush_bullets()
        flush_numbered()
        flush_table()

    section_count = 0
    while i < len(lines):
        stripped = lines[i].rstrip().strip()

        if stripped.startswith("*UniformDesk") or stripped.startswith("Related docs"):
            flush_all()
            break

        if stripped == "---":
            flush_all()
            i += 1
            continue

        if stripped.startswith("|"):
            flush_bullets()
            flush_numbered()
            table_buf.append(stripped)
            i += 1
            continue
        flush_table()

        if re.match(r"^### ", stripped):
            flush_all()
            story.append(Paragraph(inline(stripped[4:]), s["h3"]))
            i += 1
            continue

        if re.match(r"^## ", stripped):
            flush_all()
            title = stripped[3:]
            if re.match(r"^\d+\.", title):
                section_count += 1
                if section_count > 1 and section_count % 3 == 1:
                    story.append(PageBreak())
            story.append(Paragraph(inline(title), s["h1"]))
            i += 1
            continue

        if re.match(r"^# ", stripped):
            flush_all()
            i += 1
            continue

        m_num = re.match(r"^(\d+)\.\s+(.+)$", stripped)
        if m_num:
            flush_bullets()
            numbered_buf.append(m_num.group(2))
            i += 1
            continue

        if stripped.startswith("- "):
            flush_numbered()
            bullet_buf.append(stripped[2:])
            i += 1
            continue

        if not stripped:
            flush_all()
            i += 1
            continue

        if stripped.startswith("- ["):
            flush_numbered()
            bullet_buf.append(stripped[2:])
            i += 1
            continue

        flush_all()
        story.append(Paragraph(inline(stripped), s["body"]))
        i += 1

    flush_all()
    doc.build(story, onFirstPage=footer, onLaterPages=footer)
    print(f"Wrote {spec.out} ({spec.out.stat().st_size} bytes)")
    return spec.out
