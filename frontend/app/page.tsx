'use client';

import { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';

// NominShredding Components
import GameLayout from '@/components/GameLayout';
import HangingSign from '@/components/HangingSign';
import ChainLink from '@/components/ChainLink';

export default function Home() {
  const { isLoaded, isSignedIn, user } = useUser();
  const router = useRouter();
  
  // State for backend connectivity tracking
  const [backendMessage, setBackendMessage] = useState('Loading...');
  const [dbStatus, setDbStatus] = useState('Checking...');
  const [syncStatus, setSyncStatus] = useState<string | null>(null);

  // 1. Test backend and database connection
  useEffect(() => {
    fetch('http://127.0.0.1:8000/api/data')
      .then((res) => res.json())
      .then((data) => setBackendMessage(data.data))
      .catch((err) => {
        console.error(err);
        setBackendMessage('Error connecting to backend');
      });

    fetch('http://127.0.0.1:8000/api/db-test')
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
        fetch(`http://127.0.0.1:8000/api/users/sync?clerk_id=${user.id}&email=${encodeURIComponent(email)}&student_id=${studentId}`, {
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
      {/* Visual Components from NominShredding */}
      <HangingSign icon="login" title="Dashboard" href="/dashboard" />
      <ChainLink />
      
      {/* If you want to see system status during dev, you can keep this overlay or remove it for production */}
      <div style={{ 
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

      {!isSignedIn && (
        <>
          <HangingSign icon="person_add" title="Register" href="/sign-up" delay="0.5s" />
        </>
      )}
    </GameLayout>
  );
}