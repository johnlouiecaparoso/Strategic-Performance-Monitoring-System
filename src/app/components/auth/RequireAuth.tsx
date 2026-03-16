import { Navigate } from 'react-router';
import { useAuth } from '../../context/AuthContext';

export function RequireAuth({ children }: { children: React.ReactNode }) {
  const { user, loading, isConfigured } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-3 text-gray-500">
          <div className="size-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <span className="text-sm">Loading…</span>
        </div>
      </div>
    );
  }

  // When Supabase is not configured, allow access (demo mode)
  if (!isConfigured) return <>{children}</>;

  if (!user) return <Navigate to="/login" replace />;

  return <>{children}</>;
}
