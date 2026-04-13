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
  const [showSyncHealth, setShowSyncHealth] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, signOut, isConfigured } = useAuth();
  // Supabase sync runs first; Google Sheets sync acts as a supplementary fallback
  const { isSyncing: isSupaSyncing, syncError: supaError } = useSupabaseSync();
  const {
    isGoogleSheetsConfigured: isGoogleSyncActive,
    googleIsPrimary,
    isSyncing: isGsSyncing,
    syncError: gsError,
    syncHealth,
    lastDelta,
    lastSyncedAt: gsLastSyncedAt,
    lastAttemptAt: gsLastAttemptAt,
    intervalMs,
  } = useGoogleSheetsSync();
  const isSyncing = isSupaSyncing || isGsSyncing;
  const syncError = supaError || gsError;
  const totalDroppedRows = syncHealth
    ? Object.values(syncHealth.entities).reduce((sum, entity) => sum + entity.droppedRows, 0)
    : 0;
  const nextSyncAt = gsLastAttemptAt ? new Date(gsLastAttemptAt.getTime() + intervalMs) : null;

  const displayName = user?.user_metadata?.name || user?.email?.split('@')[0] || 'Admin User';
  const displayRole = user?.user_metadata?.role || 'admin';
  const initials = displayName.split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase();

  function formatDateTime(date: Date | null) {
    if (!date) return 'Not yet';
    return date.toLocaleString();
  }

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
        {isGoogleSyncActive && (
          <button
            type="button"
            onClick={() => setShowSyncHealth((prev) => !prev)}
            className="ml-2 rounded-md border border-white/30 px-2 py-1 text-xs text-white hover:bg-white/10"
          >
            {showSyncHealth ? 'Hide Sync Health' : 'Sync Health'}
          </button>
        )}
      </header>

      <main className={`min-h-screen overflow-x-hidden bg-[#519A66] px-4 pt-20 pb-4 sm:px-6 sm:pb-6 lg:px-8 lg:pb-8 ${desktopSidebarOpen ? 'lg:ml-72' : 'lg:ml-0'}`}>
        {isGoogleSyncActive && showSyncHealth && (
          <section className="mb-4 rounded-xl border border-emerald-100 bg-white/95 p-4 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-sm font-semibold text-emerald-900">Google Sheets Sync Health</h2>
                <p className="text-xs text-emerald-800/80">
                  Source of truth: {googleIsPrimary ? 'Google Sheets (Primary)' : 'Google Sheets (Supplementary)'}
                </p>
              </div>
              <div className="text-xs text-emerald-900">
                <p>Last successful sync: {formatDateTime(gsLastSyncedAt)}</p>
                <p>Last attempt: {formatDateTime(gsLastAttemptAt)}</p>
                <p>Next scheduled sync: {formatDateTime(nextSyncAt)}</p>
              </div>
            </div>

            <div className="mt-3 grid gap-3 md:grid-cols-3">
              <div className="rounded-lg border border-emerald-100 bg-emerald-50 p-3">
                <p className="text-xs font-medium text-emerald-900">Unsynced / Dropped Rows</p>
                <p className="mt-1 text-2xl font-semibold text-emerald-900">{totalDroppedRows}</p>
                <p className="text-xs text-emerald-900/70">Rows filtered due to missing/invalid required fields.</p>
              </div>
              <div className="rounded-lg border border-emerald-100 bg-emerald-50 p-3">
                <p className="text-xs font-medium text-emerald-900">Recent KPI Sync Changes</p>
                <p className="mt-1 text-sm text-emerald-900">
                  +{lastDelta?.kpis.added || 0} added, ~{lastDelta?.kpis.updated || 0} updated, -{lastDelta?.kpis.removed || 0} removed
                </p>
                <p className="text-xs text-emerald-900/70">Detected from latest polling cycle.</p>
              </div>
              <div className="rounded-lg border border-emerald-100 bg-emerald-50 p-3">
                <p className="text-xs font-medium text-emerald-900">Polling Interval</p>
                <p className="mt-1 text-2xl font-semibold text-emerald-900">{Math.round(intervalMs / 1000)}s</p>
                <p className="text-xs text-emerald-900/70">Set by VITE_GOOGLE_SHEETS_SYNC_INTERVAL_MS.</p>
              </div>
            </div>

            {syncHealth && (
              <div className="mt-3 overflow-x-auto">
                <table className="min-w-full text-xs">
                  <thead>
                    <tr className="text-left text-emerald-900/80">
                      <th className="px-2 py-1">Sheet</th>
                      <th className="px-2 py-1">Total Rows</th>
                      <th className="px-2 py-1">Parsed</th>
                      <th className="px-2 py-1">Dropped</th>
                      <th className="px-2 py-1">Top Drop Reason</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(syncHealth.entities).map(([entityKey, entity]) => {
                      const topReason = Object.entries(entity.droppedByReason).sort((a, b) => b[1] - a[1])[0];
                      return (
                        <tr key={`${entityKey}-${entity.sheetName}`} className="border-t border-emerald-100 text-emerald-900">
                          <td className="px-2 py-1">{entity.sheetName}</td>
                          <td className="px-2 py-1">{entity.totalRows}</td>
                          <td className="px-2 py-1">{entity.parsedRows}</td>
                          <td className="px-2 py-1">{entity.droppedRows}</td>
                          <td className="px-2 py-1">{topReason ? `${topReason[0]} (${topReason[1]})` : '-'}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {(syncHealth?.entities.kpis.droppedSample.length || 0) > 0 && (
              <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50 p-3">
                <p className="text-xs font-medium text-amber-900">Sample KPI Rows Not Synced</p>
                <div className="mt-2 space-y-1 text-xs text-amber-900">
                  {syncHealth?.entities.kpis.droppedSample.map((sample) => (
                    <p key={`${sample.rowNumber}-${sample.reason}`}>
                      Row {sample.rowNumber}: {sample.reason}{sample.identifier ? ` (${sample.identifier})` : ''}
                    </p>
                  ))}
                </div>
              </div>
            )}

            {(lastDelta?.recentKpis.length || 0) > 0 && (
              <div className="mt-3 rounded-lg border border-emerald-200 bg-emerald-50 p-3">
                <p className="text-xs font-medium text-emerald-900">Recently Synced KPIs</p>
                <div className="mt-2 space-y-1 text-xs text-emerald-900">
                  {lastDelta?.recentKpis.map((line) => (
                    <p key={line}>{line}</p>
                  ))}
                </div>
              </div>
            )}
          </section>
        )}
        <Outlet />
      </main>
    </div>
  );
}
