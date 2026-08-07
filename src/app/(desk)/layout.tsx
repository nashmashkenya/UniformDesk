import { DeskNav } from "@/components/desk-nav";
import { OfflineSyncBanner } from "@/components/offline-sync-banner";
import { requireSchoolUser } from "@/lib/auth";
import { countSchoolNotifications } from "@/modules/reports/notifications";

export default async function DeskLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireSchoolUser();
  const noticeCount = await countSchoolNotifications(user.schoolId);

  return (
    <div className="flex min-h-full flex-col">
      <DeskNav user={user} noticeCount={noticeCount} />
      <OfflineSyncBanner />
      <main className="desk-main flex-1">{children}</main>
    </div>
  );
}
