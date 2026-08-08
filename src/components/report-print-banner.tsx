import { format } from "date-fns";

/** Screen-hidden title block that appears at the top of printed reports. */
export function ReportPrintBanner({
  title,
  subtitle,
  generatedAt = new Date(),
}: {
  title: string;
  subtitle?: string;
  generatedAt?: Date;
}) {
  return (
    <div className="print-only print-banner mb-3 border-b border-black pb-2.5">
      <div className="text-[16pt] font-bold leading-tight tracking-tight">
        {title}
      </div>
      {subtitle ? (
        <div className="mt-1 text-[10.5pt] leading-snug">{subtitle}</div>
      ) : null}
      <div className="mt-1 text-[9pt] text-neutral-700">
        Printed {format(generatedAt, "dd MMM yyyy HH:mm")}
      </div>
    </div>
  );
}
