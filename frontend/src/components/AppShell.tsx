
import { Outlet } from 'react-router-dom';
import { Navbar } from './Navbar';
import { BottomNav } from './BottomNav';
export function AppShell() {
  return <div className="min-h-full w-full max-w-full overflow-x-hidden bg-cream">
      <Navbar />
      <main className="w-full min-w-0 max-w-full overflow-x-hidden pb-28 lg:pb-10 lg:pl-60 xl:pl-64">
        <Outlet />
      </main>
      <BottomNav />
    </div>;
}
