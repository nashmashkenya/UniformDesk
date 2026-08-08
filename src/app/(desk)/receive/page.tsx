import { redirect } from "next/navigation";
import { ReceiveForm } from "@/components/receive-form";
import { canWrite, requireSchoolUser } from "@/lib/auth";
import { prisma } from "@/lib/db";

export default async function ReceivePage() {
  const user = await requireSchoolUser();
  if (!canWrite(user.role)) redirect("/");

  const items = await prisma.item.findMany({
    where: { schoolId: user.schoolId, active: true },
    include: { sizes: true },
    orderBy: { name: "asc" },
  });

  return (
    <div className="page-stack mx-auto max-w-2xl">
      <header className="page-header animate-rise">
        <div className="page-header-main">
          <h1 className="page-title">Receive stock</h1>
          <p className="page-sub">
            Record inbound deliveries. Every receipt posts to the ledger and
            updates on-hand balances.
          </p>
        </div>
      </header>
      <section className="card animate-rise animate-rise-delay-1">
        <div className="card-header">
          <div>
            <h2 className="card-title">Inbound delivery</h2>
            <p className="card-subtitle">
              Supplier, reference note, and stock lines
            </p>
          </div>
        </div>
        <div className="card-body">
          <ReceiveForm items={items} />
        </div>
      </section>
    </div>
  );
}
