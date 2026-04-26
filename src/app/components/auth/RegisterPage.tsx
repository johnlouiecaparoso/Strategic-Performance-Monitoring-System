import { useState, FormEvent } from 'react';
import { Link, useNavigate } from 'react-router';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Alert } from '../ui/alert';
import { AlertCircle, CheckCircle2, Lock, Mail } from 'lucide-react';

export function RegisterPage() {
  const { signUp, isConfigured } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!email || !password || !confirmPassword) {
      setError('Please complete all fields.');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    const { error: authError } = await signUp(email, password);
    setLoading(false);

    if (authError) {
      setError(authError);
      return;
    }

    if (!isConfigured) {
      navigate('/login', { replace: true });
      return;
    }

    setSuccess('Account created. Check your email to confirm your account, then sign in.');
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4 bg-cover bg-center bg-no-repeat"
      style={{ backgroundImage: 'url("/bg.jpg")' }}
    >
      <div className="w-full max-w-xl">
        <Card className="shadow-lg">
          <div className="flex flex-col items-center gap-3 px-6 pt-6">
            <img
              src="/csu-logo.jpg"
              alt="Balance Scorecard Logo"
              className="size-16 rounded-full object-cover bg-white"
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).style.display = 'none';
              }}
            />
            <div className="text-center">
              <h1 className="text-3xl font-extrabold text-gray-900 tracking-wide">BSC</h1>
              <p className="text-base text-gray-600 mt-1 font-medium">Balance Scorecard</p>
            </div>
          </div>
          <CardHeader className="pb-4">
            <CardTitle className="text-xl">Create Account</CardTitle>
            <CardDescription>
              {isConfigured
                ? 'Register using your work email and secure password.'
                : 'Demo mode — registration will redirect you to sign in.'}
            </CardDescription>
          </CardHeader>
          <CardContent>
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
                    disabled={loading || !!success}
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
                    autoComplete="new-password"
                    disabled={loading || !!success}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
                  <Input
                    id="confirmPassword"
                    type="password"
                    placeholder="••••••••"
                    className="pl-9"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    autoComplete="new-password"
                    disabled={loading || !!success}
                  />
                </div>
              </div>

              {error && (
                <Alert className="bg-red-50 border-red-200">
                  <AlertCircle className="size-4 text-red-600" />
                  <span className="ml-2 text-sm text-red-700">{error}</span>
                </Alert>
              )}

              {success && (
                <Alert className="bg-green-50 border-green-200">
                  <CheckCircle2 className="size-4 text-green-600" />
                  <span className="ml-2 text-sm text-green-700">{success}</span>
                </Alert>
              )}

              <Button type="submit" className="w-full" disabled={loading || !!success}>
                {loading ? 'Creating account…' : 'Create Account'}
              </Button>
            </form>
            <p className="text-center text-sm text-gray-600 mt-5">
              Already have an account?{' '}
              <Link to="/login" className="text-blue-600 hover:text-blue-700 font-medium">
                Sign In
              </Link>
            </p>
            <p className="text-center text-xs text-gray-400 mt-4">
              © {new Date().getFullYear()} Balance Scorecard · All rights reserved
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
