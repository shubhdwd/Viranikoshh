import * as React from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { InteractionsProvider } from './contexts/InteractionsContext';
import { AppShell } from './components/AppShell';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { Home } from './pages/Home';
import { Explore } from './pages/Explore';
import { Search } from './pages/Search';
import { PostDetail } from './pages/PostDetail';
import { CulturalMapPage } from './pages/CulturalMapPage';
import { Create } from './pages/Create';
import { VirasatInterview } from './pages/VirasatInterview';
import { Profile } from './pages/Profile';
import { Saved } from './pages/Saved';
import { Notifications } from './pages/Notifications';
import { Verification } from './pages/Verification';
import { Settings } from './pages/Settings';
function RequireAuth({
  children


}: {children: React.ReactNode;}) {
  const {
    isAuthenticated,
    pending
  } = useAuth();
  if (pending) return <div className="flex h-screen items-center justify-center"><span className="text-sm text-stone-500 animate-pulse">Restoring session…</span></div>;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <>{children}</>;
}
function AppRoutes() {
  return <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route element={<RequireAuth>
            <AppShell />
          </RequireAuth>}>
        <Route path="/home" element={<Home />} />
        <Route path="/explore" element={<Explore />} />
        <Route path="/search" element={<Search />} />
        <Route path="/post/:id" element={<PostDetail />} />
        <Route path="/map" element={<CulturalMapPage />} />
        <Route path="/create" element={<Create />} />
        <Route path="/virasat-interview" element={<VirasatInterview />} />
        <Route path="/profile/:id" element={<Profile />} />
        <Route path="/saved" element={<Saved />} />
        <Route path="/notifications" element={<Notifications />} />
        <Route path="/verification" element={<Verification />} />
        <Route path="/settings" element={<Settings />} />
      </Route>
      <Route path="*" element={<Navigate to="/home" replace />} />
    </Routes>;
}
export function App() {
  return <BrowserRouter>
      <AuthProvider>
        <InteractionsProvider>
          <AppRoutes />
        </InteractionsProvider>
      </AuthProvider>
    </BrowserRouter>;
}
