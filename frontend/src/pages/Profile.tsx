import { useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { BookmarkIcon, LogOutIcon, MapPinIcon, MicIcon, SettingsIcon, SproutIcon } from 'lucide-react';
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
import { GridSkeleton, Skeleton } from '../components/ui/Skeleton';
import { EmptyState } from '../components/ui/EmptyState';
import { compactCount } from '../utils/format';
type TabId = 'posts' | 'interviews' | 'interests';
export function Profile() {
  const {
    id = 'me'
  } = useParams();
  const {
    user: me,
    logout
  } = useAuth();
  const navigate = useNavigate();
  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };
  const {
    isFollowingCreator,
    toggleFollowCreator,
    followedInterests,
    toggleFollowInterest
  } = useInteractions();
  const [tab, setTab] = useState<TabId>('posts');
  const profile = useAsync(() => usersApi.getById(id), [id]);
  const all = useAsync(() => postsApi.getFeed({ followedCreators: [], followedInterests: [] }), []);
  const isMe = me?.id === id;
  const posts = useMemo(() => (all.data ?? []).filter((r) => r.creatorId === id), [all.data, id]);
  const interviews = useMemo(() => posts.filter((r) => r.fromInterview), [posts]);

  if (profile.loading || !profile.data) {
    return <div className="mx-auto w-full max-w-[1100px] space-y-6 px-4 py-6 sm:px-6 lg:px-8">
        <Skeleton className="h-32 w-full rounded-card" />
        <GridSkeleton count={4} />
      </div>;
  }
  const user = profile.data;
  const following = isFollowingCreator(user.id);
  // Saved is private: it is never a profile tab, only the owner's own collection.
  const tabs = [{
    id: 'posts',
    label: 'Posts',
    count: posts.length
  }, {
    id: 'interviews',
    label: 'Interviews',
    count: interviews.length
  }, {
    id: 'interests',
    label: 'Interests',
    count: user.interests?.length ?? 0
  }];
  return <div className="mx-auto w-full max-w-[1100px] px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
      <header className="rounded-card border border-sand-light bg-paper p-5 sm:p-6">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
          <Avatar src={user.avatarUrl} name={user.name} size="xl" className="h-20 w-20 sm:h-24 sm:w-24" />

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="font-display text-2xl font-semibold text-charcoal">{user.name}</h1>
              {user.isKnowledgeHolder && <span className="rounded-full bg-terracotta-50 px-2.5 py-1 text-[11px] font-medium text-terracotta">
                  Knowledge holder
                </span>}
              {user.role === 'moderator' && <span className="rounded-full bg-verified-soft px-2.5 py-1 text-[11px] font-medium text-verified">
                  Moderator
                </span>}
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
              {/* Contributions opens this member's contributed records */}
              <div>
                <dt className="text-[11px] uppercase tracking-[0.12em] text-charcoal-soft">Contributions</dt>
                <dd>
                  <button type="button" onClick={() => {
                  setTab('posts');
                  document.getElementById('profile-tabs')?.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                  });
                }} className="font-display text-lg font-semibold text-charcoal underline decoration-sand-light decoration-2 underline-offset-4 transition-colors duration-150 ease-firm hover:text-terracotta hover:decoration-terracotta">
                    {compactCount(posts.length || user.contributions)}
                  </button>
                </dd>
              </div>
              {[['Followers', user.followers], ['Following', user.following]].map(([label, value]) => <div key={label as string}>
                  <dt className="text-[11px] uppercase tracking-[0.12em] text-charcoal-soft">{label}</dt>
                  <dd className="font-display text-lg font-semibold text-charcoal">{compactCount(value as number)}</dd>
                </div>)}
            </dl>
          </div>

          <div className="flex shrink-0 gap-2">
            {!isMe && <Button variant={following ? 'secondary' : 'primary'} onClick={() => toggleFollowCreator(user.id)}>
                {following ? 'Following' : 'Follow'}
              </Button>}
            {isMe && <>
                {/* Saved and Settings are reachable from Profile when the sidebar is hidden */}
                <LinkButton variant="secondary" to="/saved" size="sm" className="sm:h-10 sm:px-4 sm:text-sm lg:hidden">
                  <BookmarkIcon className="h-4 w-4" aria-hidden="true" />
                  Saved
                </LinkButton>
                <LinkButton variant="secondary" to="/settings" size="sm" className="sm:h-10 sm:px-4 sm:text-sm">
                  <SettingsIcon className="h-4 w-4" aria-hidden="true" />
                  <span className="hidden sm:inline">Settings</span>
                </LinkButton>
                <Button variant="danger" size="sm" onClick={handleLogout} className="sm:h-10 sm:px-4 sm:text-sm">
                  <LogOutIcon className="h-4 w-4" aria-hidden="true" />
                  <span className="hidden sm:inline">Sign out</span>
                </Button>
              </>}
          </div>
        </div>
      </header>

      <div id="profile-tabs" className="scroll-mt-20">
        <Tabs items={tabs} active={tab} onChange={(id) => setTab(id as TabId)} className="mt-6" />
      </div>

      <div className="mt-6">
        {tab === 'posts' && (all.loading ? <GridSkeleton count={4} /> : posts.length === 0 ? <EmptyState icon={SproutIcon} title="No contributions yet" description={isMe ? 'Record a song, a story or a craft and it will live here.' : 'This member has not published a cultural record yet.'} actionLabel={isMe ? 'Contribute a record' : undefined} actionTo={isMe ? '/create' : undefined} /> : <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4">
              {posts.map((record) => <CulturalPostCard key={record.id} record={record} variant="grid" />)}
            </div>)}

        {tab === 'interviews' && (interviews.length === 0 ? <EmptyState icon={MicIcon} title="No interviews recorded" description={isMe ? 'Sit with a parent, grandparent or artisan and record what they remember.' : 'This member has not published a Virasat Interview yet.'} actionLabel={isMe ? 'Start a Virasat Interview' : undefined} actionTo={isMe ? '/virasat-interview' : undefined} /> : <div className="grid gap-4 sm:grid-cols-2">
              {interviews.map((record) => <CulturalPostCard key={record.id} record={record} variant="grid" />)}
            </div>)}

        {tab === 'interests' && <div className="rounded-card border border-sand-light bg-paper p-5">
            <h2 className="font-display text-[15px] font-semibold text-charcoal">Cultural interests</h2>
            <p className="mt-1 text-[13px] text-charcoal-muted">
              {isMe ? 'These shape your feed. Tap to follow or unfollow.' : `Traditions ${user.name.split(' ')[0]} follows.`}
            </p>
            <div className="mt-4 flex flex-wrap gap-1.5">
              {user.interests?.map((interest) => <Chip key={interest} label={interest} selected={isMe ? followedInterests.includes(interest) : true} onClick={isMe ? () => toggleFollowInterest(interest) : undefined} />)}
            </div>
          </div>}
      </div>
    </div>;
}