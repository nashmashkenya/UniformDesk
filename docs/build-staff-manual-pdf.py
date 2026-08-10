"""Build UniformDesk Supplier Staff User Manual PDF from STAFF_USER_MANUAL.md."""

from pathlib import Path
import sys

ROOT = Path(__file__).resolve().parent
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from _manual_pdf_lib import ManualSpec, build_manual  # noqa: E402

SPEC = ManualSpec(
    src=ROOT / "STAFF_USER_MANUAL.md",
    out=ROOT / "UniformDesk_Staff_User_Manual.pdf",
    doc_title="UniformDesk Staff User Manual",
    footer_label="UniformDesk — Supplier Staff User Manual",
    cover_kicker="SUPPLIER STAFF DOCUMENTATION",
    cover_subtitle="Supplier Staff User Manual — issue desk, still owed, reports & slips",
    cover_tagline="Step-by-step guide for co-issue on admission day",
    how_to_use=(
        "Read **What you need before you can issue**, then **Co-issue**. "
        "If stock is empty, ask admin to **Post to campus stock** on the delivery note. "
        "Orders and invoices are not part of the staff desk."
    ),
)


if __name__ == "__main__":
    build_manual(SPEC)
