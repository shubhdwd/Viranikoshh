
import { Link, NavLink } from 'react-router-dom';
import { CompassIcon, HomeIcon, MapIcon, PlusIcon, UserIcon } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { cn } from '../utils/cn';
export function BottomNav() {
  const {
    user
  } = useAuth();
  const items = [{
    to: '/home',
    label: 'Home',
    Icon: HomeIcon
  }, {
    to: '/explore',
    label: 'Explore',
    Icon: CompassIcon
  }, {
    to: '/map',
    label: 'Map',
    Icon: MapIcon
  }, {
    to: `/profile/${user?.id ?? 'me'}`,
    label: 'Profile',
    Icon: UserIcon
  }];
  return <nav aria-label="Primary mobile" className="fixed inset-x-0 bottom-0 z-40 w-full max-w-full border-t border-sand-light bg-paper/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-sm lg:hidden/95">
      <div className="grid grid-cols-5 items-center">
        {items.slice(0, 2).map(({
        to,
        label,
        Icon
      }) => <NavItem key={to} to={to} label={label} Icon={Icon} />)}

        {/* Centered contribute action — sits inside the bar, clear of the top border */}
        <div className="flex items-center justify-center py-2">
          <Link to="/create" aria-label="Contribute" className="flex h-11 w-11 items-center justify-center rounded-full bg-terracotta text-paper shadow-[0_2px_10px_rgba(156,59,27,0.28)] transition-transform duration-150 ease-firm active:scale-95">
            <PlusIcon className="h-5 w-5" />
          </Link>
        </div>

        {items.slice(2).map(({
        to,
        label,
        Icon
      }) => <NavItem key={to} to={to} label={label} Icon={Icon} />)}
      </div>
    </nav>;
}
function NavItem({
  to,
  label,
  Icon




}: {to: string;label: string;Icon: typeof HomeIcon;}) {
  return <NavLink to={to} className={({
    isActive
  }) => cn('flex min-w-0 flex-col items-center gap-1 px-1 py-2.5 text-[10px] font-medium transition-colors duration-150 ease-firm', isActive ? 'text-terracotta' : 'text-charcoal-soft')}>
      <Icon className="h-[22px] w-[22px] shrink-0" aria-hidden="true" />
      <span className="w-full truncate text-center">{label}</span>
    </NavLink>;
}
