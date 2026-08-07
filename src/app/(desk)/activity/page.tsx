import { ActivityTimeline } from "@/components/activity-timeline";
import { requireSchoolUser } from "@/lib/auth";
import {
  schoolActivityFeed,
  type ActivityKind,
} from "@/modules/reports/activity";

const kindLabel: Record<ActivityKind, string> = {
  issue: "Issue",
  void: "Void",
  receive: "Receive",
  delivery_receive: "Delivery",
  adjust: "Adjust",
  shortage: "Shortage",
};

const kindTone: Record<ActivityKind, string> = {
  issue: "chip chip-ok",
  void: "chip chip-warn",
  receive: "chip chip-accent",
  delivery_receive: "chip chip-accent",
  adjust: "chip",
  shortage: "chip chip-warn",
};

export default async function ActivityPage() {
  const user = await requireSchoolUser();
  const events = await schoolActivityFeed(user.schoolId, 50);

  return (
    <div className="page-stack">
      <header className="page-header animate-rise">
        <div className="page-header-main">
          <h1 className="page-title">Activity</h1>
          <p className="page-sub">
            School audit timeline — issues, voids, receives, adjustments, and
            shortages with correlation IDs.
          </p>
        </div>
        <span className="chip">{events.length}</span>
      </header>

      <section className="card">
        <div className="card-body-flush">
          <ActivityTimeline
            events={events}
            empty="No activity yet. Issue or receive stock to start the trail."
            kindLabel={kindLabel}
            kindTone={kindTone}
          />
        </div>
      </section>
    </div>
  );
}
