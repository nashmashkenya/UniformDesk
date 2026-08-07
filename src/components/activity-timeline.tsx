import Link from "next/link";
import { format } from "date-fns";
import type { ActivityEvent } from "@/modules/reports/activity";

export function ActivityTimeline({
  events,
  empty,
  kindLabel,
  kindTone,
}: {
  events: ActivityEvent[];
  empty: string;
  kindLabel: Record<string, string>;
  kindTone: Record<string, string>;
}) {
  if (events.length === 0) {
    return (
      <p className="px-3.5 py-8 text-sm text-[var(--muted)]">{empty}</p>
    );
  }

  return (
    <>
      {events.map((event) => {
        const body = (
          <div className="list-row !items-start">
            <span className="min-w-0 flex-1">
              <span className="flex flex-wrap items-center gap-2">
                <span className={kindTone[event.kind] ?? "chip"}>
                  {kindLabel[event.kind] ?? event.kind}
                </span>
                <span className="font-semibold">{event.title}</span>
              </span>
              <span className="mt-1 block text-sm text-[var(--muted)]">
                {event.detail}
              </span>
              <span className="mt-1 block font-mono text-[0.7rem] text-[var(--muted)]">
                corr · {event.correlationId}
                {event.actorName ? ` · ${event.actorName}` : ""}
              </span>
            </span>
            <span className="shrink-0 text-xs text-[var(--muted)]">
              {format(event.at, "dd MMM HH:mm")}
            </span>
          </div>
        );

        return event.href ? (
          <Link key={event.id} href={event.href} className="block">
            {body}
          </Link>
        ) : (
          <div key={event.id}>{body}</div>
        );
      })}
    </>
  );
}
