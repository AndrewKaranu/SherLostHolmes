'use client';
import { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';

const API_URL = (process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000').replace(/\/$/, '');

export default function CompleteProfilePage() {
  const { isLoaded, isSignedIn, user } = useUser();
  const router = useRouter();
  const [studentId, setStudentId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      router.push('/sign-in');
    }
    
    // Check if user already has a student ID
    if (isLoaded && isSignedIn && user?.unsafeMetadata?.studentId) {
      router.push('/');
    }
  }, [isLoaded, isSignedIn, user, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!studentId.trim()) {
      setError('Please enter your student ID');
      return;
    }

    // Validate student ID format (adjust pattern as needed)
    if (!/^\d{8}$/.test(studentId.trim())) {
      setError('Student ID must be 8 digits (e.g., 40012345)');
      return;
    }

    setIsSubmitting(true);

    try {
      // Update Clerk user metadata
      await user?.update({
        unsafeMetadata: {
          studentId: studentId.trim()
        }
      });

      // Sync to MongoDB
      const email = user?.primaryEmailAddress?.emailAddress;
      
      if (email && user?.id) {
        await fetch(
          `${API_URL}/api/users/sync?clerk_id=${user.id}&email=${encodeURIComponent(email)}&student_id=${studentId.trim()}`,
          { method: 'POST' }
        );
      }
      
      router.push('/');
    } catch (err) {
      console.error('Error updating profile:', err);
      setError('Failed to update profile. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isLoaded) {
    return <div className="bg-concordia-burgundy min-h-screen flex items-center justify-center text-parchment font-display animate-pulse">Loading Identity Protocol...</div>;
  }

  return (
    <div className="bg-concordia-burgundy min-h-screen flex flex-col items-center justify-center p-4 relative overflow-hidden font-display">
        {/* Background Patterns */}
        <div className="absolute inset-0 wood-texture z-0"></div>
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10 pointer-events-none z-0 mix-blend-overlay"></div>

        <div className="w-full max-w-md relative z-10">
          <div className="w-full bg-parchment text-desk-wood p-1 rounded-sm shadow-pixel border-4 border-wood-dark relative">
             <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-32 h-6 bg-wood-face rounded-sm border-2 border-wood-dark shadow-sm z-20 flex items-center justify-center">
                 <div className="w-24 h-1 bg-black/10 rounded-full"></div>
             </div>

             <div className="bg-white/50 border-2 border-dashed border-wood-dark/20 p-8 pt-10 text-center">
                <h1 className="text-3xl font-black uppercase text-wood-dark mb-2 tracking-wide font-display">Identity Check</h1>
                <p className="text-concordia-burgundy font-bold text-xs uppercase tracking-widest mb-6">Action Required</p>

                <p className="mb-8 text-wood-dark/80 font-mono text-sm leading-relaxed">
                  To access the Lost & Found database, we declare that all officers must verify their Concordia Student ID.
                </p>

                <form onSubmit={handleSubmit} className="flex flex-col gap-4 text-left">
                  <div>
                    <label htmlFor="studentId" className="block text-xs font-bold uppercase tracking-wider text-wood-dark mb-1">
                      Concordia Student ID
                    </label>
                    <div className="relative">
                      <input
                        id="studentId"
                        type="text"
                        value={studentId}
                        onChange={(e) => setStudentId(e.target.value)}
                        placeholder="Ex: 40012345"
                        className="w-full bg-white border-2 border-wood-dark/30 rounded-sm p-3 pl-10 font-mono text-lg text-wood-dark placeholder-wood-dark/30 focus:outline-none focus:border-concordia-burgundy focus:ring-1 focus:ring-concordia-burgundy transition-all"
                        disabled={isSubmitting}
                      />
                      <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-wood-dark/40">badge</span>
                    </div>
                  </div>

                  {error && (
                    <div className="bg-primary/10 border border-primary/20 p-3 rounded-sm flex items-center gap-2 text-primary text-xs font-bold uppercase">
                      <span className="material-symbols-outlined text-sm">error</span> {error}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="mt-4 w-full py-3 bg-concordia-burgundy text-parchment text-lg font-bold uppercase tracking-widest rounded-sm border-2 border-black/20 shadow-[4px_4px_0_rgba(0,0,0,0.2)] hover:brightness-110 active:translate-y-1 active:shadow-none transition-all flex items-center justify-center gap-2 group"
                  >
                    {isSubmitting ? (
                        <>Processing...</>
                    ) : (
                        <>Verify Identity <span className="material-symbols-outlined group-hover:translate-x-1 transition-transform">arrow_forward</span></>
                    )}
                  </button>
                </form>
             </div>
          </div>
          
          {/* Footer logout option */}
          <div className="mt-8 text-center">
             <button onClick={() => router.push('/sign-in')} className="text-parchment/60 hover:text-parchment text-xs font-mono uppercase underline underline-offset-4 decoration-concordia-gold">
                Log in with different account
             </button>
          </div>
        </div>
    </div>
  );
}
