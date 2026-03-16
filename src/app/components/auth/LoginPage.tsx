import { useState, FormEvent } from 'react';
import { Link, useNavigate } from 'react-router';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Alert } from '../ui/alert';
import { AlertCircle, Lock, Mail } from 'lucide-react';

export function LoginPage() {
  const { signIn, isConfigured } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    if (!email || !password) {
      setError('Please enter your email and password.');
      return;
    }
    setLoading(true);
    const { error: authError } = await signIn(email, password);
    setLoading(false);
    if (authError) {
      setError(authError);
    } else {
      navigate('/', { replace: true });
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo / Brand */}
        <div className="flex flex-col items-center gap-3 mb-8">
          <img
            src="/csu-logo.jpg"
            alt="SPMS Logo"
            className="size-16 rounded-full object-cover bg-white"
            onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
          />
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900">SPMS</h1>
            <p className="text-sm text-gray-500 mt-1">
              Strategic Performance Monitoring System
            </p>
          </div>
        </div>

        <Card className="shadow-lg">
          <CardHeader className="pb-4">
            <CardTitle className="text-xl">Sign In</CardTitle>
            <CardDescription>
              {isConfigured
                ? 'Enter your credentials to access the dashboard.'
                : 'Demo mode — enter any credentials to continue.'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!isConfigured && (
              <Alert className="mb-4 bg-blue-50 border-blue-200">
                <AlertCircle className="size-4 text-blue-600" />
                <div className="ml-2 text-sm text-blue-800">
                  <strong>Demo Mode:</strong> Supabase is not configured. You can log in with any
                  credentials. Update your <code className="font-mono">.env</code> file with your
                  Supabase URL and Anon Key to enable real authentication.
                </div>
              </Alert>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    className="pl-9"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    autoComplete="email"
                    disabled={loading}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    className="pl-9"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="current-password"
                    disabled={loading}
                  />
                </div>
              </div>

              {error && (
                <Alert className="bg-red-50 border-red-200">
                  <AlertCircle className="size-4 text-red-600" />
                  <span className="ml-2 text-sm text-red-700">{error}</span>
                </Alert>
              )}

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? 'Signing in…' : 'Sign In'}
              </Button>
            </form>
          </CardContent>
        </Card>

        <p className="text-center text-xs text-gray-400 mt-6">
          © {new Date().getFullYear()} SPMS · All rights reserved
        </p>
        <p className="text-center text-sm text-gray-600 mt-2">
          Need an account?{' '}
          <Link to="/register" className="text-blue-600 hover:text-blue-700 font-medium">
            Register
          </Link>
        </p>
      </div>
    </div>
  );
}
