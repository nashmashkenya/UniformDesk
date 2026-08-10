"""Build UniformDesk Supplier Guide PDF (meeting walkthrough + ops reference)."""

from __future__ import annotations

from pathlib import Path

from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_LEFT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import mm
from reportlab.platypus import (
    KeepTogether,
    ListFlowable,
    ListItem,
    PageBreak,
    Paragraph,
    SimpleDocTemplate,
    Spacer,
    Table,
    TableStyle,
)

ROOT = Path(__file__).resolve().parent
OUT = ROOT / "UniformDesk_Supplier_Guide.pdf"

TEAL = colors.HexColor("#0B5C3B")
NAVY = colors.HexColor("#1A1A1A")
MUTED = colors.HexColor("#5A635C")
LINE = colors.HexColor("#D5DDD4")
SOFT = colors.HexColor("#E6F2EB")
WHITE = colors.white


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
            fontSize=28,
            textColor=WHITE,
            spaceAfter=10,
            leading=34,
        ),
        "cover_sub": ParagraphStyle(
            "cover_sub",
            parent=base["Normal"],
            fontName="Helvetica",
            fontSize=12,
            textColor=SOFT,
            leading=16,
            spaceAfter=6,
        ),
        "h1": ParagraphStyle(
            "h1",
            parent=base["Heading1"],
            fontName="Helvetica-Bold",
            fontSize=16,
            textColor=TEAL,
            spaceBefore=4,
            spaceAfter=10,
            borderPadding=3,
        ),
        "h2": ParagraphStyle(
            "h2",
            parent=base["Heading2"],
            fontName="Helvetica-Bold",
            fontSize=12,
            textColor=NAVY,
            spaceBefore=12,
            spaceAfter=6,
        ),
        "h3": ParagraphStyle(
            "h3",
            parent=base["Heading3"],
            fontName="Helvetica-Bold",
            fontSize=10.5,
            textColor=TEAL,
            spaceBefore=8,
            spaceAfter=4,
        ),
        "body": ParagraphStyle(
            "body",
            parent=base["Normal"],
            fontName="Helvetica",
            fontSize=9.5,
            textColor=NAVY,
            leading=13,
            spaceAfter=5,
        ),
        "say": ParagraphStyle(
            "say",
            parent=base["Normal"],
            fontName="Helvetica-Oblique",
            fontSize=9,
            textColor=MUTED,
            leading=12,
            leftIndent=8,
            spaceBefore=2,
            spaceAfter=6,
            borderColor=TEAL,
            borderPadding=4,
        ),
        "bullet": ParagraphStyle(
            "bullet",
            parent=base["Normal"],
            fontName="Helvetica",
            fontSize=9.5,
            textColor=NAVY,
            leading=12.5,
        ),
        "mono": ParagraphStyle(
            "mono",
            parent=base["Normal"],
            fontName="Courier",
            fontSize=8.5,
            textColor=NAVY,
            leading=11,
            backColor=SOFT,
            borderPadding=6,
            spaceBefore=4,
            spaceAfter=8,
        ),
        "footer": ParagraphStyle(
            "footer",
            parent=base["Normal"],
            fontName="Helvetica",
            fontSize=8,
            textColor=MUTED,
            alignment=TA_CENTER,
        ),
        "cell": ParagraphStyle(
            "cell",
            parent=base["Normal"],
            fontName="Helvetica",
            fontSize=8.5,
            textColor=NAVY,
            leading=11,
        ),
        "cell_h": ParagraphStyle(
            "cell_h",
            parent=base["Normal"],
            fontName="Helvetica-Bold",
            fontSize=8.5,
            textColor=WHITE,
            leading=11,
        ),
    }


def table(data, col_widths):
    s = styles()
    rows = []
    for i, row in enumerate(data):
        style = s["cell_h"] if i == 0 else s["cell"]
        rows.append([Paragraph(str(c), style) for c in row])
    t = Table(rows, colWidths=col_widths, repeatRows=1)
    t.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, 0), TEAL),
                ("TEXTCOLOR", (0, 0), (-1, 0), WHITE),
                ("BACKGROUND", (0, 1), (-1, -1), WHITE),
                ("ROWBACKGROUNDS", (0, 1), (-1, -1), [WHITE, SOFT]),
                ("GRID", (0, 0), (-1, -1), 0.4, LINE),
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
                ("LEFTPADDING", (0, 0), (-1, -1), 6),
                ("RIGHTPADDING", (0, 0), (-1, -1), 6),
                ("TOPPADDING", (0, 0), (-1, -1), 5),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
            ]
        )
    )
    return t


def bullets(items):
    s = styles()
    return ListFlowable(
        [ListItem(Paragraph(i, s["bullet"]), leftIndent=12, value="•") for i in items],
        bulletType="bullet",
        start="•",
        leftIndent=10,
        bulletFontName="Helvetica",
        bulletFontSize=9,
    )


def numbered(items):
    s = styles()
    return ListFlowable(
        [
            ListItem(Paragraph(i, s["bullet"]), leftIndent=14, value=str(n))
            for n, i in enumerate(items, 1)
        ],
        bulletType="1",
        leftIndent=12,
        bulletFontName="Helvetica",
        bulletFontSize=9,
    )


def footer(canvas, doc):
    canvas.saveState()
    canvas.setStrokeColor(LINE)
    canvas.setLineWidth(0.5)
    canvas.line(18 * mm, 12 * mm, A4[0] - 18 * mm, 12 * mm)
    canvas.setFont("Helvetica", 8)
    canvas.setFillColor(MUTED)
    canvas.drawString(18 * mm, 7 * mm, "UniformDesk — Supplier Guide")
    canvas.drawRightString(A4[0] - 18 * mm, 7 * mm, f"Page {doc.page}")
    canvas.restoreState()


def build():
    s = styles()
    doc = SimpleDocTemplate(
        str(OUT),
        pagesize=A4,
        leftMargin=18 * mm,
        rightMargin=18 * mm,
        topMargin=16 * mm,
        bottomMargin=18 * mm,
        title="UniformDesk Supplier Guide",
        author="UniformDesk",
    )
    story = []
    w = A4[0] - 36 * mm

    # Cover band
    cover = Table(
        [
            [
                Paragraph("SUPPLIER DOCUMENTATION", s["cover_kicker"]),
            ],
            [Paragraph("UniformDesk", s["cover_title"])],
            [
                Paragraph(
                    "Supplier meeting walkthrough · Demo logins · Day-to-day ops",
                    s["cover_sub"],
                )
            ],
            [
                Paragraph(
                    "Supplier-owned national portal — schools, catalogues, "
                    "deliveries, co-issue, team & print",
                    s["cover_sub"],
                )
            ],
            [
                Paragraph(
                    "Demo password: <b>desk1234</b> · Default theme: <b>National</b>",
                    s["cover_sub"],
                )
            ],
        ],
        colWidths=[w],
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
            ]
        )
    )
    story.append(cover)
    story.append(Spacer(1, 14))

    story.append(Paragraph("Contents", s["h1"]))
    story.append(
        bullets(
            [
                "Part A — Supplier meeting walkthrough (~20–25 minutes)",
                "Part B — Desk & supplier operations reference",
                "Part C — Quick route map & print notes",
            ]
        )
    )
    story.append(Spacer(1, 8))
    story.append(
        Paragraph(
            "App URL for live demo: <b>http://localhost:3000</b> (or your hosted demo URL).",
            s["body"],
        )
    )

    # Part A
    story.append(PageBreak())
    story.append(Paragraph("Part A — Supplier meeting walkthrough", s["h1"]))
    story.append(
        Paragraph(
            "Use this script to take a supplier through the live product. "
            "Time: ~20–25 minutes live · ~10 minutes if you skip print demos.",
            s["body"],
        )
    )

    story.append(Paragraph("Demo accounts", s["h2"]))
    story.append(
        table(
            [
                ["Who", "Email", "Use for"],
                [
                    "Supplier admin",
                    "supply@uniformdesk.co",
                    "Super user — schools, team, supply docs, branding, monitor",
                ],
                [
                    "Supplier staff",
                    "staff@uniformdesk.co",
                    "Issue desk — co-issue, still owed, basic reports",
                ],
            ],
            [32 * mm, 55 * mm, w - 87 * mm],
        )
    )
    story.append(Spacer(1, 6))
    story.append(
        Paragraph(
            "Seed school codes (data sites): <b>GFS</b>, <b>RVA</b>. "
            "Password: <b>desk1234</b>. School operational login is closed in Phase 1.",
            s["body"],
        )
    )

    story.append(Paragraph("One-sentence pitch", s["h2"]))
    story.append(
        Paragraph(
            "UniformDesk is <b>supplier-owned</b>: admins run schools, catalogues, "
            "deliveries, invoices, and team access; staff co-issue on admission day. "
            "Schools are campus data sites — operational school login is closed in Phase 1.",
            s["body"],
        )
    )

    # Agenda sections
    agenda = [
        (
            "1. Sign in as supplier admin (2 min)",
            [
                "Open /login → supply@uniformdesk.co / desk1234",
                "Land on National supply monitor (/supplier)",
                "Point out: co-issue, schools, team, reports, deliveries, invoices",
                "Default theme: National (institutional green & gold)",
            ],
            "This portal is yours. Admin monitors everything; staff only get the issue desk.",
        ),
        (
            "2. Team (2 min) — /supplier/team",
            [
                "Show directory (admin + staff)",
                "Create users, reset passwords, deactivate (keep ≥1 admin)",
            ],
            "You manage access here — no school logins for day-to-day ops.",
        ),
        (
            "3. Schools portfolio (3 min) — /supplier/schools",
            [
                "Show linked schools (GFS / RVA cards)",
                "Create school (admin): name + code only — or link by code",
                "Open Catalogue & kits, then Co-issue from a school card",
            ],
            "Each school is a separate campus. Your team operates the desk.",
        ),
        (
            "4. Catalogues (3 min)",
            [
                "School catalogue — items + kits per campus",
                "Supplier products — master SKUs/prices for DNs & invoices",
                "SKU must match for DN receive",
            ],
            "Your product list drives supply documents.",
        ),
        (
            "5. Orders → Delivery note → Invoice (5 min) — admin",
            [
                "Orders (/supplier/orders) — create / open a PO for a linked school",
                "Deliveries (/supplier/deliveries) — pack / dispatch DN",
                "DN detail — lines → Print DN",
                "Invoices — invoice from delivery → Print invoice",
            ],
            "Paper packs print from the browser — compact A4 portrait.",
        ),
        (
            "6. Co-issue on campus (5 min) — /supplier/issue",
            [
                "Pick linked school (if more than one)",
                "New student or find roster student",
                "Payment method + reference (no amount)",
                "Confirm issue → Still owed for incomplete kits",
                "Also show staff login: issue paths only",
            ],
            "Admin and staff both co-issue against campus stock.",
        ),
        (
            "7. Reports & branding (2 min)",
            [
                "/supplier/reports — issued today + stock view",
                "/supplier/branding — admin only",
            ],
            None,
        ),
        (
            "8. Close (1 min)",
            [
                "Recap the supplier loop below",
                "Offer next steps: real school codes, branding assets, go-live checklist",
            ],
            None,
        ),
    ]

    story.append(Paragraph("Suggested agenda (click path)", s["h2"]))
    for title, steps, say in agenda:
        block = [Paragraph(title, s["h3"]), numbered(steps)]
        if say:
            block.append(Paragraph(f"<b>Say:</b> “{say}”", s["say"]))
        story.append(KeepTogether(block))

    story.append(Paragraph("Supplier loop", s["h2"]))
    story.append(
        Paragraph(
            "Create/link school → Catalog → Order/DN → School receives<br/>"
            "→ Co-issue at admission → Still owed → Reports + Print<br/>"
            "→ Invoice &amp; collect",
            s["mono"],
        )
    )

    story.append(Paragraph("Talking points (objections)", s["h2"]))
    story.append(
        table(
            [
                ["Question", "Answer"],
                [
                    "Do schools log in every day?",
                    "Not in Phase 1 — your admin/staff run the desk. School follow-up reports come later.",
                ],
                [
                    "Who is the super user?",
                    "supplier_admin — create users, reset passwords, deactivate, full monitor.",
                ],
                [
                    "What can staff do?",
                    "Co-issue, still owed, basic reports — not schools, products, or billing.",
                ],
                [
                    "Can we see other suppliers’ schools?",
                    "No. Only schools you create or link.",
                ],
                [
                    "Printing?",
                    "Browser print on reports, still owed, DN, invoice — A4 portrait, compact standard.",
                ],
            ],
            [55 * mm, w - 55 * mm],
        )
    )

    # Part B
    story.append(PageBreak())
    story.append(Paragraph("Part B — Supplier operations", s["h1"]))
    story.append(
        Paragraph(
            "Day-to-day operations for supplier admin and supplier staff. "
            "School operational login is closed in Phase 1.",
            s["body"],
        )
    )

    story.append(Paragraph("Roles at a glance", s["h2"]))
    story.append(
        table(
            [
                ["Role", "Owns", "Typical work"],
                [
                    "supplier_admin",
                    "Full system (super user)",
                    "Schools, products, kits, deliveries, invoices, team, branding, monitor, co-issue",
                ],
                [
                    "supplier_staff",
                    "Issue desk",
                    "Co-issue, still owed, basic reports / activity / search",
                ],
            ],
            [35 * mm, 55 * mm, w - 90 * mm],
        )
    )
    story.append(Spacer(1, 6))
    story.append(
        Paragraph(
            "Default visual theme: <b>National</b> (institutional green &amp; gold). "
            "Switch anytime from the theme menu.",
            s["body"],
        )
    )

    story.append(Paragraph("Co-issue desk", s["h2"]))
    story.append(Paragraph("Issue (/supplier/issue)", s["h3"]))
    story.append(
        numbered(
            [
                "Pick a linked school, then find or key in a student.",
                "Choose kit / lines and quantities.",
                "Record payment method + reference (no amount).",
                "Confirm — no parent signature / slip required.",
                "Stock decreases; shortages open Still owed.",
            ]
        )
    )
    story.append(Paragraph("Still to receive (/incomplete)", s["h3"]))
    story.append(
        bullets(
            [
                "Queue of incomplete kits.",
                "Issue what’s left returns to the issue desk for that student.",
                "Print list for a paper follow-up queue.",
            ]
        )
    )
    story.append(Paragraph("Stock (/stock)", s["h3"]))
    story.append(
        bullets(
            [
                "On-hand balances + recent ledger.",
                "Stock take / adjust with a reason (e.g. Stock take, Damage).",
                "Print stock for counting sheets.",
                "Supplier can view these balances (read-only) under supplier reports.",
            ]
        )
    )
    story.append(Paragraph("Reports (/reports)", s["h3"]))
    story.append(
        bullets(
            [
                "Issued today (with payment method/ref when recorded).",
                "Shortage lines and audit CSV export (when role allows).",
                "Print report — browser print; nav and export form are hidden.",
            ]
        )
    )
    story.append(Paragraph("Deliveries (/deliveries)", s["h3"]))
    story.append(
        bullets(
            [
                "Receive against a supplier DN (posts ledger).",
                "Print DN on the detail page.",
            ]
        )
    )

    story.append(Paragraph("Supplier portal", s["h2"]))
    story.append(Paragraph("Co-issue (/supplier/issue)", s["h3"]))
    story.append(
        bullets(
            [
                "Same admission flow as the school desk, against a linked school’s stock and roster.",
                "Slip stays on the school; issuer is the supplier user.",
                "Use when supplier staff are on campus at admission.",
            ]
        )
    )
    story.append(Paragraph("Reports (/supplier/reports)", s["h3"]))
    story.append(
        table(
            [
                ["View", "Contents"],
                [
                    "Issued today",
                    "Who received what, payment method/ref, issuer",
                ],
                [
                    "Stock on hand",
                    "Read-only campus balances (school does stock take)",
                ],
            ],
            [40 * mm, w - 40 * mm],
        )
    )
    story.append(Spacer(1, 6))
    story.append(
        bullets(
            [
                "Summary: issued today, still owed, stock lines, low stock.",
                "Still owed (/supplier/incomplete) — incomplete kits + Print list.",
                "Print report prints the active view plus summary.",
            ]
        )
    )
    story.append(Paragraph("Supply documents", s["h3"]))
    story.append(
        table(
            [
                ["Document", "Where", "Button"],
                ["Delivery note", "/supplier/deliveries/[id]", "Print DN"],
                ["Invoice", "/supplier/invoices/[id]", "Print invoice"],
            ],
            [35 * mm, 70 * mm, w - 105 * mm],
        )
    )

    # Part C
    story.append(PageBreak())
    story.append(Paragraph("Part C — Routes, printing & audit", s["h1"]))

    story.append(Paragraph("Quick route map", s["h2"]))
    story.append(
        table(
            [
                ["Need", "School", "Supplier"],
                ["Issue uniforms", "/issue", "/supplier/issue"],
                ["Incomplete kits", "/incomplete", "/supplier/incomplete"],
                [
                    "Stock / stock take",
                    "/stock",
                    "View via /supplier/reports → Stock",
                ],
                ["Daily reports", "/reports", "/supplier/reports"],
                ["Receive / pack DN", "/deliveries", "/supplier/deliveries"],
                ["Invoices", "—", "/supplier/invoices"],
                ["Schools / create", "—", "/supplier/schools"],
                ["Catalog", "—", "/supplier/catalog"],
                ["Branding", "—", "/supplier/branding (admin)"],
            ],
            [40 * mm, (w - 40 * mm) / 2, (w - 40 * mm) / 2],
        )
    )

    story.append(Paragraph("Printing", s["h2"]))
    story.append(
        numbered(
            [
                "Open the report or document.",
                "Choose school / view if needed (supplier).",
                "Click Print report, Print list, Print stock, Print DN, or Print invoice.",
                "Use the browser print dialog (PDF or paper) — A4 portrait, compact standard layout.",
            ]
        )
    )
    story.append(
        Paragraph(
            "Printed pages include a title banner (tenant, school, timestamp). "
            "Screen-only chrome (nav, school picker, view toggles, CTAs) is hidden.",
            s["body"],
        )
    )

    story.append(Paragraph("Payment & audit notes", s["h2"]))
    story.append(
        bullets(
            [
                "Desk payment stores method + reference only — no live payment rails or amount field.",
                "Internal issue records remain for stock, still-to-receive, and staff audit.",
                "School /reports can export a CSV of issue lines (date range) for auditors.",
            ]
        )
    )

    story.append(Paragraph("Multi-tenancy (one line)", s["h2"]))
    story.append(
        Paragraph(
            "Shared database with row-level isolation by school and supplier. "
            "Users belong to one side. Suppliers only access schools they create or link "
            "(SupplierSchool). Isolation is enforced in application layouts and queries.",
            s["body"],
        )
    )

    story.append(Spacer(1, 16))
    story.append(
        Paragraph(
            "© UniformDesk · Supplier Guide · For training and demo use with seed accounts.",
            s["footer"],
        )
    )

    doc.build(story, onFirstPage=footer, onLaterPages=footer)
    print(f"Wrote {OUT} ({OUT.stat().st_size} bytes)")


if __name__ == "__main__":
    build()
