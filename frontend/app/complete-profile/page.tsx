'use client';
import { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';

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
          `http://127.0.0.1:8000/api/users/sync?clerk_id=${user.id}&email=${encodeURIComponent(email)}&student_id=${studentId.trim()}`,
          { method: 'POST' }
        );
      }

      router.push('/');
    } catch (err) {
      console.error('Failed to update profile:', err);
      setError('Failed to save. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isLoaded) {
    return <div style={{ padding: '2rem', textAlign: 'center' }}>Loading...</div>;
  }

  return (
    <div style={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      minHeight: 'calc(100vh - 80px)',
      padding: '2rem'
    }}>
      <div style={{
        width: '100%',
        maxWidth: '400px',
        padding: '2rem',
        background: 'white',
        borderRadius: '12px',
        boxShadow: '0 4px 20px rgba(0,0,0,0.1)'
      }}>
        <h2 style={{ margin: '0 0 0.5rem 0', textAlign: 'center' }}>Complete Your Profile</h2>
        <p style={{ margin: '0 0 1.5rem 0', textAlign: 'center', color: '#666' }}>
          Please enter your university student ID to continue
        </p>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '1rem' }}>
            <label 
              htmlFor="studentId" 
              style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}
            >
              Student ID
            </label>
            <input
              id="studentId"
              type="text"
              value={studentId}
              onChange={(e) => setStudentId(e.target.value)}
              placeholder="e.g., 40012345"
              style={{
                width: '100%',
                padding: '0.75rem',
                fontSize: '1rem',
                border: '1px solid #ddd',
                borderRadius: '6px',
                boxSizing: 'border-box'
              }}
              disabled={isSubmitting}
            />
          </div>

          {error && (
            <p style={{ color: '#e53e3e', fontSize: '0.875rem', margin: '0 0 1rem 0' }}>
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            style={{
              width: '100%',
              padding: '0.75rem',
              fontSize: '1rem',
              fontWeight: 600,
              color: 'white',
              background: isSubmitting ? '#999' : '#333',
              border: 'none',
              borderRadius: '6px',
              cursor: isSubmitting ? 'not-allowed' : 'pointer'
            }}
          >
            {isSubmitting ? 'Saving...' : 'Continue'}
          </button>
        </form>
      </div>
    </div>
  );
}
