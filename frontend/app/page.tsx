'use client';
import { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';

export default function Home() {
  const { isLoaded, isSignedIn, user } = useUser();
  const router = useRouter();
  const [backendMessage, setBackendMessage] = useState('Loading...');
  const [dbStatus, setDbStatus] = useState('Checking...');
  const [syncStatus, setSyncStatus] = useState<string | null>(null);

  useEffect(() => {
    // Test backend connection
    fetch('http://127.0.0.1:8000/api/data')
      .then((res) => res.json())
      .then((data) => setBackendMessage(data.data))
      .catch((err) => {
        console.error(err);
        setBackendMessage('Error connecting to backend');
      });

    // Test database connection
    fetch('http://127.0.0.1:8000/api/db-test')
      .then((res) => res.json())
      .then((data) => setDbStatus(data.message))
      .catch((err) => {
        console.error(err);
        setDbStatus('Error connecting to database');
      });
  }, []);

  // Redirect to complete profile if no student ID
  useEffect(() => {
    if (isLoaded && isSignedIn && user) {
      // Check if user has completed their profile (has studentId)
      if (!user.unsafeMetadata?.studentId) {
        router.push('/complete-profile');
        return;
      }
    }
  }, [isLoaded, isSignedIn, user, router]);

  // Sync user to MongoDB when signed in
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
    <div style={{ padding: '2rem' }}>
      <h2>Welcome to SherLostHolmes</h2>
      <p>AI-powered Lost and Found System</p>
      
      <div style={{ marginTop: '2rem', padding: '1rem', background: '#f5f5f5', borderRadius: '8px' }}>
        <h3>System Status</h3>
        <p><strong>Backend:</strong> {backendMessage}</p>
        <p><strong>Database:</strong> {dbStatus}</p>
      </div>

      <div style={{ marginTop: '2rem', padding: '1rem', background: '#e8f4e8', borderRadius: '8px' }}>
        <h3>Authentication Status</h3>
        {!isLoaded ? (
          <p>Loading authentication...</p>
        ) : isSignedIn ? (
          <div>
            <p>✅ Signed in as: <strong>{user.primaryEmailAddress?.emailAddress}</strong></p>
            <p>Student ID: <strong>{user.unsafeMetadata?.studentId as string || 'Not set'}</strong></p>
            <p>User ID: {user.id}</p>
            {syncStatus && <p>Database sync: {syncStatus}</p>}
          </div>
        ) : (
          <p>❌ Not signed in. Click Sign In or Sign Up above.</p>
        )}
      </div>
    </div>
  );
}

