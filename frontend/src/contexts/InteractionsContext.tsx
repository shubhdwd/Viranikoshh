import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { interactionsApi } from '../api/interactionsApi';
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
  const [liked, setLiked] = useState<string[]>([]);
  const [saved, setSaved] = useState<string[]>([]);
  const [followedCreators, setFollowedCreators] = useState<string[]>([]);
  const [followedInterests, setFollowedInterests] = useState<string[]>([]);

  useEffect(() => {
    interactionsApi.getFollowedInterests().then((interests) => {
      setFollowedInterests(interests.map((i) => i.name));
    });
  }, []);

  const toggleLike = useCallback((id: string) => {
    setLiked((prev) => {
      const next = toggle(prev, id);
      void interactionsApi.like(id, next.includes(id));
      return next;
    });
  }, []);

  const toggleSave = useCallback((id: string) => {
    setSaved((prev) => {
      const next = toggle(prev, id);
      void interactionsApi.save(id, next.includes(id));
      return next;
    });
  }, []);

  const toggleFollowCreator = useCallback((id: string) => {
    setFollowedCreators((prev) => {
      const next = toggle(prev, id);
      void interactionsApi.followUser(id, next.includes(id));
      return next;
    });
  }, []);

  const toggleFollowInterest = useCallback((interest: string) => {
    const categoryId = CATEGORY_NAME_TO_ID[interest];
    if (!categoryId) return;
    setFollowedInterests((prev) => {
      const next = toggle(prev, interest);
      void interactionsApi.followInterest(categoryId, next.includes(interest));
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
