import { useState } from 'react';
import { isToday } from 'date-fns';
import { BellIcon } from 'lucide-react';
import { notificationApi } from '../api/notificationApi';
import { useAsync } from '../hooks/useAsync';
import { useAuth } from '../contexts/AuthContext';
import { NotificationItem } from '../components/NotificationItem';
import { SectionHeading } from '../components/ui/SectionHeading';
import { Skeleton } from '../components/ui/Skeleton';
import { EmptyState } from '../components/ui/EmptyState';
import { Button } from '../components/ui/Button';
import type { CulturalNotification } from '../types/notification';
export function Notifications() {
  const { isAuthenticated } = useAuth();
  const {
    data,
    loading
  } = useAsync(() => isAuthenticated ? notificationApi.list() : Promise.resolve(null), [isAuthenticated]);
  const [readAll, setReadAll] = useState(false);
  const items: CulturalNotification[] = (data ?? []).map((n) => readAll ? {
    ...n,
    read: true
  } : n);
  const today = items.filter((n) => isToday(new Date(n.createdAt)));
  const earlier = items.filter((n) => !isToday(new Date(n.createdAt)));
  const unread = items.filter((n) => !n.read).length;
  return <div className="mx-auto w-full max-w-2xl px-4 py-6 sm:px-6 lg:py-8">
      <SectionHeading level={1} title="Notifications" description="Activity on your contributions." action={unread > 0 ? <Button variant="ghost" size="sm" onClick={async () => {
      await notificationApi.markAllRead().catch(() => {});
      setReadAll(true);
    }}>
              Mark all read
            </Button> : undefined} />

      {loading ? <div className="mt-6 space-y-3">
          {Array.from({
        length: 5
      }).map((_, i) => <Skeleton key={i} className="h-16 w-full rounded-card" />)}
        </div> : items.length === 0 ? <div className="mt-6">
          <EmptyState icon={BellIcon} title="Nothing new" description="Follows, responses and verifications will appear here." actionLabel="Explore records" actionTo="/explore" />
        </div> : <div className="mt-6 space-y-6">
          {today.length > 0 && <section>
              <h2 className="mb-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-charcoal-soft">Today</h2>
              <ul className="divide-y divide-sand-lighter overflow-hidden rounded-card border border-sand-light bg-paper">
                {today.map((n) => <NotificationItem key={n.id} notification={n} />)}
              </ul>
            </section>}

          {earlier.length > 0 && <section>
              <h2 className="mb-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-charcoal-soft">Earlier</h2>
              <ul className="divide-y divide-sand-lighter overflow-hidden rounded-card border border-sand-light bg-paper">
                {earlier.map((n) => <NotificationItem key={n.id} notification={n} />)}
              </ul>
            </section>}
        </div>}
    </div>;
}