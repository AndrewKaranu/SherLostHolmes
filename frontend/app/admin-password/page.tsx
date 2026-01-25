'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@clerk/nextjs';
import AuthLayout from '@/components/AuthLayout';

export default function AdminPasswordPage() {
  const router = useRouter();
  const { isSignedIn, isLoaded } = useUser();
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Redirect if not signed in
  if (isLoaded && !isSignedIn) {
    router.push('/sign-in');
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    // Check against environment variable
    const adminPassword = process.env.NEXT_PUBLIC_ADMIN_PASSWORD;

    if (password === adminPassword) {
      // Store admin access in session storage for this session
      sessionStorage.setItem('adminAccess', 'true');
      router.push('/admin');
    } else {
      setError('Invalid credentials. Access denied.');
      setIsLoading(false);
    }
  };

  return (
    <AuthLayout title="Evidence Room" subtitle="Restricted Access">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="text-center mb-6">
          <span className="material-symbols-outlined text-concordia-burgundy text-4xl">lock</span>
          <p className="text-wood-dark/70 text-sm mt-2 font-mono">
            Enter custodian credentials to proceed
          </p>
        </div>

        <div>
          <label htmlFor="password" className="block text-sm font-bold uppercase tracking-wider text-wood-dark mb-2">
            Access Code
          </label>
          <div className="relative">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-wood-dark/40">
              password
            </span>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-white border-2 border-wood-dark/30 rounded-sm font-mono text-wood-dark placeholder:text-wood-dark/40 focus:border-concordia-burgundy focus:outline-none focus:ring-2 focus:ring-concordia-burgundy/20 transition-colors"
              placeholder="Enter access code..."
              autoFocus
              required
            />
          </div>
        </div>

        {error && (
          <div className="flex items-center gap-2 text-red-700 bg-red-100 border-2 border-red-300 px-4 py-3 rounded-sm">
            <span className="material-symbols-outlined text-lg">error</span>
            <span className="text-sm font-bold">{error}</span>
          </div>
        )}

        <button
          type="submit"
          disabled={isLoading}
          className="w-full py-4 bg-concordia-burgundy text-parchment font-black uppercase tracking-widest border-2 border-black/20 shadow-[4px_4px_0_black] active:translate-x-1 active:translate-y-1 active:shadow-none hover:brightness-110 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {isLoading ? (
            <>
              <span className="material-symbols-outlined animate-spin">sync</span>
              Verifying...
            </>
          ) : (
            <>
              <span className="material-symbols-outlined">login</span>
              Access Evidence Room
            </>
          )}
        </button>

        <div className="text-center">
          <button
            type="button"
            onClick={() => router.push('/')}
            className="text-concordia-burgundy hover:underline text-sm font-bold uppercase tracking-wider"
          >
            Return to Main Hall
          </button>
        </div>
      </form>
    </AuthLayout>
  );
}
