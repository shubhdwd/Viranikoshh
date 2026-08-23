
import { Link, NavLink, useNavigate } from 'react-router-dom';
import {
  BadgeCheckIcon,
  BellIcon,
  BookmarkIcon,
  CompassIcon,
  HomeIcon,
  LogOutIcon,
  MapIcon,
  MicIcon,
  PlusIcon,
  SettingsIcon } from
'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { Avatar } from './ui/Avatar';
import { cn } from '../utils/cn';

const PRIMARY = [
{ to: '/home', label: 'Home', Icon: HomeIcon },
{ to: '/explore', label: 'Explore', Icon: CompassIcon },
{ to: '/map', label: 'Cultural Map', Icon: MapIcon },
{ to: '/virasat-interview', label: 'Virasat Interview', Icon: MicIcon },
{ to: '/verification', label: 'Verification', Icon: BadgeCheckIcon }];


const SECONDARY = [
{ to: '/saved', label: 'Saved', Icon: BookmarkIcon },
{ to: '/notifications', label: 'Notifications', Icon: BellIcon },
{ to: '/settings', label: 'Settings', Icon: SettingsIcon }];


function Brand({ compact }: {compact?: boolean;}) {
  return (
    <Link to="/home" className="block">
      <span className="block font-display text-xl font-semibold leading-none tracking-tight text-terracotta">
        Viranikosh
      </span>
      {!compact &&
      <span className="mt-1 block text-[10px] uppercase tracking-[0.22em] text-charcoal-soft">
          Treasury of heritage voices
        </span>
      }
    </Link>);

}

function itemClass(isActive: boolean): string {
  return cn(
    'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors duration-150 ease-firm',
    isActive ? 'bg-terracotta-50 font-medium text-terracotta' : 'text-charcoal-muted hover:bg-sand-lighter hover:text-charcoal'
  );
}

export function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-60 flex-col border-r border-sand-light bg-paper px-4 py-6 lg:flex xl:w-64">
        <Brand />

        <nav aria-label="Primary" className="mt-6 flex flex-1 flex-col gap-1 overflow-y-auto border-t border-sand-lighter pt-5">
          {PRIMARY.map(({ to, label, Icon }) =>
          <NavLink key={to} to={to} className={({ isActive }) => itemClass(isActive)}>
              <Icon className="h-[18px] w-[18px] shrink-0" aria-hidden="true" />
              {label}
            </NavLink>
          )}

          <div className="my-3 h-px bg-sand-lighter" />

          {SECONDARY.map(({ to, label, Icon }) =>
          <NavLink key={to} to={to} className={({ isActive }) => itemClass(isActive)}>
              <Icon className="h-[18px] w-[18px] shrink-0" aria-hidden="true" />
              {label}
            </NavLink>
          )}
        </nav>

        <Link
          to="/create"
          className="mt-4 flex items-center justify-center gap-2 rounded-lg bg-terracotta px-4 py-3 text-sm font-medium text-paper transition-[background-color,transform] duration-150 ease-firm hover:bg-terracotta-600 active:scale-[0.98]">
          
          <PlusIcon className="h-4 w-4" aria-hidden="true" />
          Contribute
        </Link>

        {user &&
        <div className="mt-4 flex items-center gap-3 border-t border-sand-lighter pt-4">
            <Link to={`/profile/${user.id}`} className="flex min-w-0 flex-1 items-center gap-3">
              <Avatar src={user.avatarUrl} name={user.name} size="sm" />
              <span className="min-w-0">
                <span className="block truncate text-sm font-medium text-charcoal">{user.name}</span>
                <span className="block truncate text-[11px] text-charcoal-soft">@{user.handle}</span>
              </span>
            </Link>
            <button
            type="button"
            aria-label="Sign out"
            onClick={async () => {
              await logout();
              navigate('/login');
            }}
            className="text-charcoal-soft transition-colors duration-150 ease-firm hover:text-terracotta">
            
              <LogOutIcon className="h-4 w-4" />
            </button>
          </div>
        }
      </aside>

      {/* Mobile / tablet top bar */}
      <header className="sticky top-0 z-40 flex items-center gap-3 border-b border-sand-light bg-paper/95 px-4 py-3 backdrop-blur-sm lg:hidden">
        <Brand compact />
        <Link
          to="/notifications"
          aria-label="Notifications"
          className="relative ml-auto flex h-10 w-10 items-center justify-center rounded-full text-charcoal-muted transition-colors duration-150 ease-firm hover:bg-sand-lighter hover:text-charcoal">
          
          <BellIcon className="h-5 w-5" />
          <span className="absolute right-2.5 top-2.5 h-2 w-2 rounded-full bg-terracotta" />
        </Link>
      </header>
    </>);

}
