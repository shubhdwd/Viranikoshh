
import { Link } from 'react-router-dom';
import { BadgeCheckIcon, HeartIcon, MessageCircleIcon, PencilLineIcon, UserPlusIcon } from 'lucide-react';
import type { CulturalNotification, NotificationKind } from '../types/notification';
import { getUser } from '../data/users';
import { getRecord } from '../data/records';
import { Avatar } from './ui/Avatar';
import { CulturalImage } from './ui/CulturalImage';
import { timeAgo } from '../utils/format';
import { cn } from '../utils/cn';
const KIND: Record<NotificationKind, {
  Icon: typeof HeartIcon;
  className: string;
}> = {
  follow: {
    Icon: UserPlusIcon,
    className: 'bg-sand-lighter text-charcoal-muted'
  },
  like: {
    Icon: HeartIcon,
    className: 'bg-terracotta-50 text-terracotta'
  },
  comment: {
    Icon: MessageCircleIcon,
    className: 'bg-sand-lighter text-charcoal-muted'
  },
  verification: {
    Icon: BadgeCheckIcon,
    className: 'bg-verified-soft text-verified'
  },
  correction: {
    Icon: PencilLineIcon,
    className: 'bg-[#fbeee6] text-clay'
  }
};
export function NotificationItem({
  notification
}: {notification: CulturalNotification;}) {
  const actor = notification.actor ?? (notification.actorId ? getUser(notification.actorId) : undefined) ?? {
    id: notification.actorId ?? '',
    name: 'Someone',
    avatarUrl: '',
  };
  const record = notification.recordId ? getRecord(notification.recordId) : undefined;
  const kindConfig = KIND[notification.kind] ?? KIND['like'];
  const Icon = kindConfig.Icon;
  const className = kindConfig.className;
  const href = notification.kind === 'follow'
    ? (actor.id ? `/profile/${actor.id}` : '#')
    : (notification.recordId ? `/post/${notification.recordId}` : (actor.id ? `/profile/${actor.id}` : '#'));

  const message = notification.body && actor.name && notification.body.startsWith(actor.name)
    ? notification.body.slice(actor.name.length).trim()
    : notification.body;

  return <li>
      <Link to={href} className={cn('flex items-start gap-3 p-4 transition-colors duration-150 ease-firm hover:bg-cream', !notification.read && 'bg-terracotta-50/60')}>
        <span className="relative shrink-0">
          <Avatar src={actor.avatarUrl ?? ''} name={actor.name} size="sm" />
          <span className={cn('absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full ring-2 ring-paper', className)}>
            <Icon className="h-3 w-3" aria-hidden="true" />
          </span>
        </span>

        <div className="min-w-0 flex-1">
          <p className="text-[13px] leading-relaxed text-charcoal">
            <strong className="font-medium">{actor.name}</strong> {message}
          </p>
          <p className="mt-1 text-[11px] text-charcoal-soft">{timeAgo(notification.createdAt)}</p>
        </div>

        {record && <CulturalImage src={record.source.media.posterUrl} alt="" aria-hidden="true" seed={record.id} category={record.category} className="h-11 w-11 shrink-0 rounded-md object-cover" />}
        {!notification.read && <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-terracotta" aria-label="Unread" />}
      </Link>
    </li>;
}
