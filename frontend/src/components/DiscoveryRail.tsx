
import { Link } from 'react-router-dom';
import { INTERESTS } from '../data/taxonomy';
import { useInteractions } from '../contexts/InteractionsContext';
import { Card } from './ui/Card';
import { Chip } from './ui/Chip';
import { Avatar } from './ui/Avatar';
import { getUser } from '../data/users';

export function DiscoveryRail() {
  const { followedInterests, toggleFollowInterest, isFollowingCreator, toggleFollowCreator } = useInteractions();
  const voices = ['u2', 'u4', 'u6', 'u7'].map(getUser);

  return (
    <aside className="hidden w-[300px] shrink-0 space-y-4 xl:block" aria-label="Feed preferences">
      <Card className="p-4">
        <h2 className="font-display text-[15px] font-semibold text-charcoal">Cultural interests</h2>
        <div className="mt-3 flex flex-wrap gap-1.5">
          {INTERESTS.slice(0, 8).map((interest) =>
          <Chip
            key={interest}
            label={interest}
            selected={followedInterests.includes(interest)}
            onClick={() => toggleFollowInterest(interest)} />

          )}
        </div>
      </Card>

      <Card className="p-4">
        <h2 className="font-display text-[15px] font-semibold text-charcoal">Voices to follow</h2>
        <ul className="mt-3 space-y-3">
          {voices.map((user) =>
          <li key={user.id} className="flex items-center gap-3">
              <Link to={`/profile/${user.id}`} className="flex min-w-0 flex-1 items-center gap-3">
                <Avatar src={user.avatarUrl} name={user.name} size="sm" />
                <span className="min-w-0">
                  <span className="block truncate text-[13px] font-medium text-charcoal">{user.name}</span>
                  <span className="block truncate text-[11px] text-charcoal-soft">{user.region}</span>
                </span>
              </Link>
              <button
              type="button"
              onClick={() => toggleFollowCreator(user.id)}
              className="shrink-0 text-[12px] font-medium text-terracotta transition-colors duration-150 ease-firm hover:text-terracotta-600">
              
                {isFollowingCreator(user.id) ? 'Following' : 'Follow'}
              </button>
            </li>
          )}
        </ul>
      </Card>
    </aside>);

}
