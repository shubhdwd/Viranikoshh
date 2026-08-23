
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { AlertCircleIcon, CompassIcon } from 'lucide-react';
import { postsApi } from '../api/postsApi';
import { useAsync } from '../hooks/useAsync';
import { useAuth } from '../contexts/AuthContext';
import { useInteractions } from '../contexts/InteractionsContext';
import { CulturalPostCard } from '../components/CulturalPostCard';
import { DiscoveryRail } from '../components/DiscoveryRail';
import { PostCardSkeleton } from '../components/ui/Skeleton';
import { EmptyState } from '../components/ui/EmptyState';
import { Button } from '../components/ui/Button';
import { CATEGORY_LABELS } from '../types/culture';

export function Home() {
  const { user } = useAuth();
  const { followedCreators, followedInterests, saved, liked } = useInteractions();

  const feed = useAsync(
    () => postsApi.getFeed({ followedCreators, followedInterests, savedIds: saved, likedIds: liked }),
    [followedCreators.join(), followedInterests.join(), saved.join(), liked.join()]
  );
  const featured = useAsync(() => postsApi.getFeatured(), []);

  return (
    <div className="mx-auto flex w-full max-w-[1100px] gap-8 px-4 py-5 sm:px-6 lg:px-8 lg:py-8">
      <div className="min-w-0 flex-1 lg:max-w-feed">
        <header className="mb-6">
          <h1 className="font-display text-xl font-semibold text-charcoal sm:text-2xl lg:text-[26px]">
            {user ? `Namaskar, ${user.name.split(' ')[0]}` : 'Cultural feed'}
          </h1>
          <p className="mt-1.5 text-[13px] text-charcoal-muted sm:text-sm">
            From the voices and traditions you follow.
          </p>
        </header>

        {/* Featured strip — content, not navigation */}
        <section aria-labelledby="featured-heading" className="mb-8">
          <h2
            id="featured-heading"
            className="mb-3 text-[12px] font-semibold uppercase tracking-[0.14em] text-charcoal-soft sm:text-[13px]">
            
            Featured this week
          </h2>
          <div className="vk-scroll-x -mx-4 flex gap-3 overflow-x-auto px-4 pb-1 sm:mx-0 sm:px-0">
            {featured.loading &&
            Array.from({ length: 3 }).map((_, i) =>
            <div key={i} className="h-32 w-48 shrink-0 animate-pulse rounded-card bg-sand-lighter sm:h-36 sm:w-56" />
            )}
            {featured.data?.map((record) =>
            <Link
              key={record.id}
              to={`/post/${record.id}`}
              className="group relative h-32 w-48 shrink-0 overflow-hidden rounded-card border border-sand-light sm:h-36 sm:w-56">
              
                <img
                src={record.source.media.posterUrl}
                alt=""
                className="h-full w-full object-cover transition-transform duration-200 ease-firm group-hover:scale-[1.03]" />
              
                <span className="absolute inset-0 bg-charcoal/45" />
                <span className="absolute inset-x-0 bottom-0 p-3">
                  <span className="block text-[10px] uppercase tracking-[0.14em] text-cream/70">
                    {CATEGORY_LABELS[record.category]}
                  </span>
                  <span className="mt-1 block font-display text-[13px] font-semibold leading-snug text-cream line-clamp-2 sm:text-[14px]">
                    {record.title}
                  </span>
                </span>
              </Link>
            )}
          </div>
        </section>

        {/* Feed */}
        <section aria-label="Cultural feed" className="space-y-5">
          {feed.loading &&
          <>
              <PostCardSkeleton />
              <PostCardSkeleton />
            </>
          }

          {feed.error &&
          <div className="rounded-card border border-flagged/20 bg-flagged-soft p-6 text-center">
              <AlertCircleIcon className="mx-auto h-5 w-5 text-flagged" aria-hidden="true" />
              <p className="mt-2 text-sm text-charcoal">{feed.error}</p>
              <Button variant="secondary" size="sm" className="mt-4" onClick={feed.reload}>
                Try again
              </Button>
            </div>
          }

          {!feed.loading && !feed.error && feed.data?.length === 0 &&
          <EmptyState
            icon={CompassIcon}
            title="Your feed is quiet"
            description="Follow a few creators or cultural interests to fill it."
            actionLabel="Explore cultural records"
            actionTo="/explore" />

          }

          {feed.data?.map((record, index) =>
          <motion.div
            key={record.id}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.26, ease: [0.23, 1, 0.32, 1], delay: Math.min(index, 6) * 0.04 }}>
            
              <CulturalPostCard record={record} />
            </motion.div>
          )}
        </section>
      </div>

      <DiscoveryRail />
    </div>);

}
