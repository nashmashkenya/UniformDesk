"""Build UniformDesk Supplier Admin User Manual PDF from ADMIN_USER_MANUAL.md."""

from pathlib import Path
import sys

ROOT = Path(__file__).resolve().parent
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from _manual_pdf_lib import ManualSpec, build_manual  # noqa: E402

SPEC = ManualSpec(
    src=ROOT / "ADMIN_USER_MANUAL.md",
    out=ROOT / "UniformDesk_Admin_User_Manual.pdf",
    doc_title="UniformDesk Admin User Manual",
    footer_label="UniformDesk — Supplier Admin User Manual",
    cover_kicker="SUPPLIER ADMIN DOCUMENTATION",
    cover_subtitle="Supplier Admin User Manual — setup, team, schools, supply & co-issue",
    cover_tagline="Simple step-by-step guide for the supplier super user",
    how_to_use=(
        "Start with **The short path**, then **First-time setup**. "
        "Critical step: Delivery note → **Post to campus stock**. "
        "Orders and invoices are optional for admission day."
    ),
)


if __name__ == "__main__":
    build_manual(SPEC)
