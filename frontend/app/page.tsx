'use client';

import { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';

// NominShredding Components
import GameLayout from '@/components/GameLayout';
import HangingSign from '@/components/HangingSign';
import ChainLink from '@/components/ChainLink';

const API_URL = (process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000').replace(/\/$/, '');

export default function Home() {
  const { isLoaded, isSignedIn, user } = useUser();
  const router = useRouter();

  // State for backend connectivity tracking
  const [backendMessage, setBackendMessage] = useState('Loading...');
  const [dbStatus, setDbStatus] = useState('Checking...');
  const [syncStatus, setSyncStatus] = useState<string | null>(null);

  // 1. Test backend and database connection
  useEffect(() => {
    fetch(`${API_URL}/api/data`)
      .then((res) => res.json())
      .then((data) => setBackendMessage(data.data))
      .catch((err) => {
        console.error(err);
        setBackendMessage('Error connecting to backend');
      });

    fetch(`${API_URL}/api/db-test`)
      .then((res) => res.json())
      .then((data) => setDbStatus(data.message))
      .catch((err) => {
        console.error(err);
        setDbStatus('Error connecting to database');
      });
  }, []);

  // 2. Redirect to profile completion if student ID is missing
  useEffect(() => {
    if (isLoaded && isSignedIn && user) {
      if (!user.unsafeMetadata?.studentId) {
        router.push('/complete-profile');
      }
    }
  }, [isLoaded, isSignedIn, user, router]);

  // 3. Sync user to MongoDB when signed in
  useEffect(() => {
    if (isLoaded && isSignedIn && user) {
      const email = user.primaryEmailAddress?.emailAddress;
      const studentId = user.unsafeMetadata?.studentId as string | undefined;
      
      if (email && studentId) {
        fetch(`${API_URL}/api/users/sync?clerk_id=${user.id}&email=${encodeURIComponent(email)}&student_id=${studentId}`, {
          method: 'POST',
        })
          .then((res) => res.json())
          .then((data) => {
            setSyncStatus(`User synced: ${data.status}`);
            console.log('User synced to MongoDB:', data);
          })
          .catch((err) => {
            console.error('Failed to sync user:', err);
            setSyncStatus('Sync failed');
          });
      }
    }
  }, [isLoaded, isSignedIn, user]);

  return (
    <GameLayout>
      {/* Show different menu based on auth state */}
      {isLoaded && isSignedIn ? (
        <>
          {/* Signed in - redirect to dashboard or show dashboard content */}
          <HangingSign icon="assignment_late" title="File a Report" href="/report" />
          <ChainLink />
          <HangingSign icon="dashboard" title="Evidence Board" href="/evidence" delay="0.5s" />
          <ChainLink />
          <HangingSign icon="🎰" title="Try Your Luck" href="/lucky-find" delay="1s" />
        </>
      ) : (
        <>
          {/* Not signed in - show login/signup options */}
          <HangingSign icon="login" title="Sign In" href="/sign-in" />
          <ChainLink />
          <HangingSign icon="person_add" title="Register" href="/sign-up" delay="0.5s" />
        </>
      )}
      
      {/* Dev status overlay */}
      <div className="hidden md:block" style={{ 
        position: 'fixed', 
        bottom: '10px', 
        right: '10px', 
        fontSize: '10px', 
        opacity: 0.5,
        color: 'white',
        pointerEvents: 'none'
      }}>
        Backend: {backendMessage} | DB: {dbStatus}
      </div>
    </GameLayout>
  );
}