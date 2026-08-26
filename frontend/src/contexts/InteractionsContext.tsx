import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { interactionsApi } from '../api/interactionsApi';
import { useAuth } from './AuthContext';
import { CATEGORY_NAME_TO_ID } from '../types/culture';

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
        setFollowedInterests(interests.map((i) => i.name));
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
      interactionsApi.like(id, next.includes(id)).catch(() => { /* ignored */ });
      return next;
    });
  }, []);

  const toggleSave = useCallback((id: string) => {
    setSaved((prev) => {
      const next = toggle(prev, id);
      interactionsApi.save(id, next.includes(id)).catch(() => { /* ignored */ });
      return next;
    });
  }, []);

  const toggleFollowCreator = useCallback((id: string) => {
    setFollowedCreators((prev) => {
      const next = toggle(prev, id);
      interactionsApi.followUser(id, next.includes(id)).catch(() => { /* ignored */ });
      return next;
    });
  }, []);

  const toggleFollowInterest = useCallback((interest: string) => {
    const categoryId = CATEGORY_NAME_TO_ID[interest];
    if (!categoryId) return;
    setFollowedInterests((prev) => {
      const next = toggle(prev, interest);
      interactionsApi.followInterest(categoryId, next.includes(interest)).catch(() => { /* ignored */ });
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
