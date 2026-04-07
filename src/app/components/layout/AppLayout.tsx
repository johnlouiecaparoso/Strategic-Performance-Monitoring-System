import { useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router';
import { 
  LayoutDashboard, 
  Target, 
  Building2, 
  TrendingUp, 
  AlertCircle, 
  CheckSquare, 
  FileCheck, 
  Calendar,
  Layers,
  LogOut
} from 'lucide-react';
import { Button } from '../ui/button';
import { Avatar, AvatarFallback } from '../ui/avatar';
import { useAuth } from '../../context/AuthContext';
import { useGoogleSheetsSync } from '../../hooks/useGoogleSheetsSync';
import { useSupabaseSync } from '../../hooks/useSupabaseSync';

const navigation = [
  { name: 'Executive Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Goal Performance', href: '/goals', icon: Target },
  { name: 'Office Dashboard', href: '/offices', icon: Building2 },
  { name: 'KPI Tracking', href: '/kpi-tracking', icon: TrendingUp },
  { name: 'Issues & Assistance', href: '/issues', icon: AlertCircle },
  { name: 'Submission Compliance', href: '/compliance', icon: CheckSquare },
  { name: 'MOV Dashboard', href: '/mov', icon: FileCheck },
  { name: 'Monthly Progress', href: '/monthly', icon: Calendar },
  { name: 'Pillar Performance', href: '/pillars', icon: Layers },
];

export function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [desktopSidebarOpen, setDesktopSidebarOpen] = useState(true);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, signOut, isConfigured } = useAuth();
  // Supabase sync runs first; Google Sheets sync acts as a supplementary fallback
  const { isSyncing: isSupaSyncing, syncError: supaError } = useSupabaseSync();
  const { isSyncing: isGsSyncing, syncError: gsError } = useGoogleSheetsSync();
  const isSyncing = isSupaSyncing || isGsSyncing;
  const syncError = supaError || gsError;

  const displayName = user?.user_metadata?.name || user?.email?.split('@')[0] || 'Admin User';
  const displayRole = user?.user_metadata?.role || 'admin';
  const initials = displayName.split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase();

  async function handleSignOut() {
    await signOut();
    if (isConfigured) navigate('/login', { replace: true });
  }

  function handleLogoToggle() {
    if (window.innerWidth >= 1024) {
      setDesktopSidebarOpen((prev) => !prev);
      return;
    }
    setSidebarOpen((prev) => !prev);
  }

  return (
    <div className="min-h-screen bg-gray-50 overflow-x-hidden">
      {/* Mobile sidebar */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="fixed inset-0 bg-gray-900/80" onClick={() => setSidebarOpen(false)} />
          <div className="fixed left-0 top-16 bottom-0 w-[85vw] max-w-72 bg-[#25671E] text-white">
            <nav className="flex h-full flex-col gap-1 p-4 overflow-y-auto">
              {navigation.map((item) => {
                const isActive = location.pathname === item.href;
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    onClick={() => setSidebarOpen(false)}
                    className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                      isActive
                        ? 'bg-[#FFAA00] text-[#237227] font-medium'
                        : 'text-white/90 hover:bg-white/10 hover:text-white'
                    }`}
                  >
                    <item.icon className="size-5" />
                    {item.name}
                  </Link>
                );
              })}

              <div className="mt-3 rounded-lg bg-white/10 p-3">
                <div className="flex items-center gap-2">
                  <Avatar className="size-8">
                    <AvatarFallback>{initials}</AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate text-white">{displayName}</p>
                    <p className="text-xs capitalize text-white/80">{displayRole}</p>
                  </div>
                </div>
              </div>

              <Button
                variant="outline"
                className="mt-3 justify-start text-red-600 border-red-200 hover:text-red-700"
                onClick={handleSignOut}
              >
                <LogOut className="size-4 mr-2" />
                Log out
              </Button>
            </nav>
          </div>
        </div>
      )}

      {/* Desktop sidebar */}
      <div className={`${desktopSidebarOpen ? 'hidden lg:flex' : 'hidden'} fixed left-0 top-16 bottom-0 z-30 w-72 flex-col border-r border-white/20 bg-[#25671E] text-white`}>
        <nav className="flex-1 flex flex-col gap-1 p-4 overflow-y-auto">
          {navigation.map((item) => {
            const isActive = location.pathname === item.href;
            return (
              <Link
                key={item.name}
                to={item.href}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                  isActive
                    ? 'bg-[#FFAA00] text-[#237227] font-medium'
                    : 'text-white/90 hover:bg-white/10 hover:text-white'
                }`}
              >
                <item.icon className="size-5" />
                {item.name}
              </Link>
            );
          })}

          <div className="mt-3 rounded-lg bg-white/10 p-3">
            <div className="flex items-center gap-2">
              <Avatar className="size-8">
                <AvatarFallback>{initials}</AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <p className="text-sm font-medium truncate text-white">{displayName}</p>
                <p className="text-xs capitalize text-white/80">{displayRole}</p>
              </div>
            </div>
          </div>

          <Button
            variant="outline"
            className="mt-3 justify-start text-red-600 border-red-200 hover:text-red-700"
            onClick={handleSignOut}
          >
            <LogOut className="size-4 mr-2" />
            Log out
          </Button>
        </nav>
      </div>

      <header className="fixed top-0 left-0 right-0 z-40 flex h-16 items-center gap-4 border-b border-white/20 bg-[#25671E] text-white px-4 sm:px-6">
        <button
          type="button"
          className="flex min-w-0 items-center gap-3 text-left"
          onClick={handleLogoToggle}
          aria-label="Toggle sidebar"
        >
          <img
            src="/csu-logo.jpg"
            alt="CSU Logo"
            className="size-8 rounded-full object-cover bg-white"
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).style.display = 'none';
            }}
          />
          <span className="hidden sm:block max-w-[40rem] truncate text-base md:text-lg font-bold text-white tracking-wide">
            Balance Scorecard
          </span>

          <span className="sm:hidden text-base font-bold text-white tracking-wide">BSC</span>
        </button>

        <div className="flex-1" />

        {/* Sync status indicator */}
        {isSyncing && (
          <span className="hidden sm:inline text-xs text-white/80 animate-pulse">Syncing…</span>
        )}
        {!isSyncing && syncError && (
          <span className="hidden sm:inline text-xs text-red-200" title={syncError}>Sync error</span>
        )}
      </header>

      <main className={`min-h-screen overflow-x-hidden bg-[#519A66] px-4 pt-20 pb-4 sm:px-6 sm:pb-6 lg:px-8 lg:pb-8 ${desktopSidebarOpen ? 'lg:ml-72' : 'lg:ml-0'}`}>
        <Outlet />
      </main>
    </div>
  );
}
