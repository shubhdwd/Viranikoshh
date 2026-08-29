import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { interactionsApi } from '../api/interactionsApi';
import { useAuth } from './AuthContext';

interface InteractionsValue {
  liked: string[];
  saved: string[];
  followedCreators: string[];
  followedInterests: string[];
  isLiked: (id: string) => boolean;
  isSaved: (id: string) => boolean;
  isFollowingCreator: (id: string) => boolean;
  isFollowingInterest: (interest: string) => boolean;
  toggleLike: (id: string) => void;
  toggleSave: (id: string) => void;
  toggleFollowCreator: (id: string) => void;
  toggleFollowInterest: (interest: string) => void;
}

const InteractionsContext = createContext<InteractionsValue | null>(null);

function toggle(list: string[], value: string): string[] {
  return list.includes(value) ? list.filter((v) => v !== value) : [...list, value];
}

export function InteractionsProvider({
  children
}: {children: React.ReactNode;}) {
  const { isAuthenticated } = useAuth();
  const [liked, setLiked] = useState<string[]>([]);
  const [saved, setSaved] = useState<string[]>([]);
  const [followedCreators, setFollowedCreators] = useState<string[]>([]);
  const [followedInterests, setFollowedInterests] = useState<string[]>([]);

  useEffect(() => {
    if (!isAuthenticated) return;
    interactionsApi.getFollowedInterests()
      .then((interests) => {
        // Backend returns DB display names (e.g. "Folk Song") — normalize to slugs
        // so they match cat.slug (e.g. "folk-song") used in DiscoveryRail/Profile
        setFollowedInterests(interests.map((i) => i.name.toLowerCase().replace(/\s+/g, '-')));
      })
      .catch(() => { /* ignored */ });

    interactionsApi.getFollowedUsers()
      .then((following) => {
        setFollowedCreators(following);
      })
      .catch(() => { /* ignored */ });

    interactionsApi.getSavedPosts()
      .then((saves) => {
        setSaved(saves);
      })
      .catch(() => { /* ignored */ });
  }, [isAuthenticated]);

  const toggleLike = useCallback((id: string) => {
    setLiked((prev) => {
      const next = toggle(prev, id);
      const shouldLike = next.includes(id);
      interactionsApi.like(id, shouldLike).catch(() => {
        setLiked((revert) => shouldLike
          ? revert.filter((v) => v !== id)
          : [...revert, id]);
      });
      return next;
    });
  }, []);

  const toggleSave = useCallback((id: string) => {
    setSaved((prev) => {
      const next = toggle(prev, id);
      const shouldSave = next.includes(id);
      interactionsApi.save(id, shouldSave).catch(() => {
        // Revert optimistic update on failure
        setSaved((revert) => shouldSave
          ? revert.filter((v) => v !== id)
          : [...revert, id]);
      });
      return next;
    });
  }, []);

  const toggleFollowCreator = useCallback((id: string) => {
    setFollowedCreators((prev) => {
      const next = toggle(prev, id);
      const shouldFollow = next.includes(id);
      interactionsApi.followUser(id, shouldFollow).catch(() => {
        setFollowedCreators((revert) => shouldFollow
          ? revert.filter((v) => v !== id)
          : [...revert, id]);
      });
      return next;
    });
  }, []);

  const toggleFollowInterest = useCallback((categorySlug: string) => {
    if (!categorySlug) return;
    setFollowedInterests((prev) => {
      const next = toggle(prev, categorySlug);
      const shouldFollow = next.includes(categorySlug);
      interactionsApi.followInterest(categorySlug, shouldFollow).catch(() => {
        setFollowedInterests((revert) => shouldFollow
          ? revert.filter((v) => v !== categorySlug)
          : [...revert, categorySlug]);
      });
      return next;
    });
  }, []);

  const value = useMemo<InteractionsValue>(() => ({
    liked,
    saved,
    followedCreators,
    followedInterests,
    isLiked: (id) => liked.includes(id),
    isSaved: (id) => saved.includes(id),
    isFollowingCreator: (id) => followedCreators.includes(id),
    isFollowingInterest: (i) => followedInterests.includes(i),
    toggleLike,
    toggleSave,
    toggleFollowCreator,
    toggleFollowInterest
  }), [liked, saved, followedCreators, followedInterests, toggleLike, toggleSave, toggleFollowCreator, toggleFollowInterest]);

  return <InteractionsContext.Provider value={value}>{children}</InteractionsContext.Provider>;
}

export function useInteractions(): InteractionsValue {
  const ctx = useContext(InteractionsContext);
  if (!ctx) throw new Error('useInteractions must be used inside InteractionsProvider');
  return ctx;
}
