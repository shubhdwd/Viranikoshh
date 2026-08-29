import { useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { BookmarkIcon, LogOutIcon, MapPinIcon, MicIcon, SettingsIcon, SproutIcon, XIcon } from 'lucide-react';
import { postsApi } from '../api/postsApi';
import { usersApi } from '../api/usersApi';
import { useAsync } from '../hooks/useAsync';
import { useAuth } from '../contexts/AuthContext';
import { useInteractions } from '../contexts/InteractionsContext';
import { CulturalPostCard } from '../components/CulturalPostCard';
import { Avatar } from '../components/ui/Avatar';
import { Button, LinkButton } from '../components/ui/Button';
import { Tabs } from '../components/ui/Tabs';
import { Chip } from '../components/ui/Chip';
import { Skeleton, GridSkeleton } from '../components/ui/Skeleton';
import { EmptyState } from '../components/ui/EmptyState';
import { compactCount } from '../utils/format';
import { request } from '../api/client';

type TabId = 'posts' | 'interviews' | 'interests';
type FollowModal = { type: 'followers' | 'following'; userId: string; title: string } | null;

interface MiniUser {
  id: string;
  name: string;
  avatarUrl: string | null;
  bio: string | null;
  postCount: number;
}

function FollowListModal({ modal, onClose }: { modal: FollowModal; onClose: () => void }) {
  const { data, loading } = useAsync<MiniUser[]>(
    () =>
      modal
        ? request({ url: `/users/${modal.userId}/${modal.type}`, method: 'GET' }).then(
            (d: any) => d[modal.type] as MiniUser[]
          )
        : Promise.resolve([]),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [modal?.userId, modal?.type]
  );

  if (!modal) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
      role="dialog"
      aria-modal="true"
      aria-label={modal.title}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-charcoal/40 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Sheet */}
      <div className="relative z-10 w-full max-w-md rounded-t-2xl sm:rounded-2xl bg-paper shadow-2xl ring-1 ring-sand-light max-h-[80vh] flex flex-col animate-in slide-in-from-bottom sm:zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-sand-light shrink-0">
          <h2 className="font-display text-base font-semibold text-charcoal">{modal.title}</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="rounded-full p-1.5 text-charcoal-muted transition-colors hover:bg-cream hover:text-charcoal"
          >
            <XIcon className="h-4 w-4" />
          </button>
        </div>

        {/* List */}
        <div className="overflow-y-auto flex-1 px-4 py-3 space-y-0.5">
          {loading &&
            Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3 py-3 px-2">
                <Skeleton className="h-10 w-10 rounded-full shrink-0" />
                <div className="flex-1 space-y-1.5">
                  <Skeleton className="h-3 w-32" />
                  <Skeleton className="h-3 w-48" />
                </div>
              </div>
            ))}

          {!loading && (!data || data.length === 0) && (
            <p className="py-8 text-center text-[13px] text-charcoal-soft">
              {modal.type === 'followers' ? 'No followers yet.' : 'Not following anyone yet.'}
            </p>
          )}

          {!loading &&
            data &&
            data.map((u) => (
              <Link
                key={u.id}
                to={`/profile/${u.id}`}
                onClick={onClose}
                className="flex items-center gap-3 rounded-xl px-2 py-2.5 transition-colors hover:bg-cream"
              >
                <Avatar src={u.avatarUrl ?? ''} name={u.name} size="sm" className="h-10 w-10 shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-charcoal truncate">{u.name}</p>
                  {u.bio && (
                    <p className="text-[12px] text-charcoal-soft truncate mt-0.5">{u.bio}</p>
                  )}
                </div>
                {u.postCount > 0 && (
                  <span className="text-[11px] text-charcoal-soft shrink-0">
                    {compactCount(u.postCount)} posts
                  </span>
                )}
              </Link>
            ))}
        </div>
      </div>
    </div>
  );
}

export function Profile() {
  const { id = 'me' } = useParams();
  const { user: me, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const { isFollowingCreator, toggleFollowCreator, followedInterests, toggleFollowInterest } =
    useInteractions();

  const [tab, setTab] = useState<TabId>('posts');
  const [followModal, setFollowModal] = useState<FollowModal>(null);

  const profile = useAsync(() => usersApi.getById(id), [id]);
  const all = useAsync(() => postsApi.getFeed({}), []);
  const isMe = me?.id === id;
  const posts = useMemo(
    () => (all.data ?? []).filter((r) => r.creatorId === id),
    [all.data, id]
  );
  const interviews = useMemo(() => posts.filter((r) => r.fromInterview), [posts]);

  if (profile.loading || !profile.data) {
    return (
      <div className="mx-auto w-full max-w-[1100px] space-y-6 px-4 py-6 sm:px-6 lg:px-8">
        <Skeleton className="h-32 w-full rounded-card" />
        <GridSkeleton count={4} />
      </div>
    );
  }

  const user = profile.data;
  const following = isFollowingCreator(user.id);

  const tabs = [
    { id: 'posts', label: 'Posts', count: posts.length },
    { id: 'interviews', label: 'Interviews', count: interviews.length },
    { id: 'interests', label: 'Interests', count: user.interests?.length ?? 0 },
  ];

  const statButtonClass =
    'font-display text-lg font-semibold text-charcoal underline decoration-sand-light decoration-2 underline-offset-4 transition-colors duration-150 ease-firm hover:text-terracotta hover:decoration-terracotta';

  return (
    <div className="mx-auto w-full max-w-[1100px] px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
      <FollowListModal modal={followModal} onClose={() => setFollowModal(null)} />

      <header className="rounded-card border border-sand-light bg-paper p-5 sm:p-6">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
          <Avatar src={user.avatarUrl} name={user.name} size="xl" className="h-20 w-20 sm:h-24 sm:w-24" />

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="font-display text-2xl font-semibold text-charcoal">{user.name}</h1>
              {user.isKnowledgeHolder && (
                <span className="rounded-full bg-terracotta-50 px-2.5 py-1 text-[11px] font-medium text-terracotta">
                  Knowledge holder
                </span>
              )}
              {user.role === 'ADMIN' && (
                <span className="rounded-full bg-verified-soft px-2.5 py-1 text-[11px] font-medium text-verified">
                  Moderator
                </span>
              )}
            </div>
            <p className="mt-1 text-[13px] text-charcoal-soft">@{user.handle}</p>
            <p className="mt-3 max-w-prose text-sm leading-relaxed text-charcoal-muted">{user.bio}</p>

            <p className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-[13px] text-charcoal-muted">
              <span className="flex items-center gap-1.5">
                <MapPinIcon className="h-3.5 w-3.5" aria-hidden="true" />
                {user.region}
              </span>
              <span>{user.languages.join(' · ')}</span>
            </p>

            <dl className="mt-4 flex flex-wrap gap-x-6 gap-y-3">
              {/* Contributions — scrolls to posts tab */}
              <div>
                <dt className="text-[11px] uppercase tracking-[0.12em] text-charcoal-soft">
                  Contributions
                </dt>
                <dd>
                  <button
                    id="profile-contributions-btn"
                    type="button"
                    onClick={() => {
                      setTab('posts');
                      document
                        .getElementById('profile-tabs')
                        ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    }}
                    className={statButtonClass}
                  >
                    {compactCount(posts.length || user.contributions)}
                  </button>
                </dd>
              </div>

              {/* Followers — opens modal */}
              <div>
                <dt className="text-[11px] uppercase tracking-[0.12em] text-charcoal-soft">
                  Followers
                </dt>
                <dd>
                  <button
                    id="profile-followers-btn"
                    type="button"
                    onClick={() =>
                      setFollowModal({
                        type: 'followers',
                        userId: user.id,
                        title: `Followers of ${user.name.split(' ')[0]}`,
                      })
                    }
                    className={statButtonClass}
                  >
                    {compactCount(user.followers)}
                  </button>
                </dd>
              </div>

              {/* Following — opens modal */}
              <div>
                <dt className="text-[11px] uppercase tracking-[0.12em] text-charcoal-soft">
                  Following
                </dt>
                <dd>
                  <button
                    id="profile-following-btn"
                    type="button"
                    onClick={() =>
                      setFollowModal({
                        type: 'following',
                        userId: user.id,
                        title: `${user.name.split(' ')[0]} follows`,
                      })
                    }
                    className={statButtonClass}
                  >
                    {compactCount(user.following)}
                  </button>
                </dd>
              </div>
            </dl>
          </div>

          <div className="flex shrink-0 gap-2">
            {!isMe && (
              <Button
                variant={following ? 'secondary' : 'primary'}
                onClick={() => toggleFollowCreator(user.id)}
              >
                {following ? 'Following' : 'Follow'}
              </Button>
            )}
            {isMe && (
              <>
                <LinkButton
                  variant="secondary"
                  to="/saved"
                  size="sm"
                  className="sm:h-10 sm:px-4 sm:text-sm lg:hidden"
                >
                  <BookmarkIcon className="h-4 w-4" aria-hidden="true" />
                  Saved
                </LinkButton>
                <LinkButton
                  variant="secondary"
                  to="/settings"
                  size="sm"
                  className="sm:h-10 sm:px-4 sm:text-sm"
                >
                  <SettingsIcon className="h-4 w-4" aria-hidden="true" />
                  <span className="hidden sm:inline">Settings</span>
                </LinkButton>
                <Button
                  variant="danger"
                  size="sm"
                  onClick={handleLogout}
                  className="sm:h-10 sm:px-4 sm:text-sm"
                >
                  <LogOutIcon className="h-4 w-4" aria-hidden="true" />
                  <span className="hidden sm:inline">Sign out</span>
                </Button>
              </>
            )}
          </div>
        </div>
      </header>

      <div id="profile-tabs" className="scroll-mt-20">
        <Tabs items={tabs} active={tab} onChange={(id) => setTab(id as TabId)} className="mt-6" />
      </div>

      <div className="mt-6">
        {tab === 'posts' &&
          (all.loading ? (
            <GridSkeleton count={4} />
          ) : posts.length === 0 ? (
            <EmptyState
              icon={SproutIcon}
              title="No contributions yet"
              description={
                isMe
                  ? 'Record a song, a story or a craft and it will live here.'
                  : 'This member has not published a cultural record yet.'
              }
              actionLabel={isMe ? 'Contribute a record' : undefined}
              actionTo={isMe ? '/create' : undefined}
            />
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4">
              {posts.map((record) => (
                <CulturalPostCard key={record.id} record={record} variant="grid" />
              ))}
            </div>
          ))}

        {tab === 'interviews' &&
          (interviews.length === 0 ? (
            <EmptyState
              icon={MicIcon}
              title="No interviews recorded"
              description={
                isMe
                  ? 'Sit with a parent, grandparent or artisan and record what they remember.'
                  : 'This member has not published a Virasat Interview yet.'
              }
              actionLabel={isMe ? 'Start a Virasat Interview' : undefined}
              actionTo={isMe ? '/virasat-interview' : undefined}
            />
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {interviews.map((record) => (
                <CulturalPostCard key={record.id} record={record} variant="grid" />
              ))}
            </div>
          ))}

        {tab === 'interests' && (
          <div className="rounded-card border border-sand-light bg-paper p-5">
            <h2 className="font-display text-[15px] font-semibold text-charcoal">
              Cultural interests
            </h2>
            <p className="mt-1 text-[13px] text-charcoal-muted">
              {isMe
                ? 'These shape your feed. Tap to follow or unfollow.'
                : `Traditions ${user.name.split(' ')[0]} follows.`}
            </p>
            <div className="mt-4 flex flex-wrap gap-1.5">
              {user.interests?.map((interest) => (
                <Chip
                  key={interest}
                  label={interest}
                  selected={
                    isMe ? followedInterests.includes(interest.toLowerCase().replace(/\s+/g, '-')) : true
                  }
                  onClick={isMe ? () => toggleFollowInterest(interest) : undefined}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}