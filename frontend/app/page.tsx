'use client';
import { useState, useEffect } from 'react';

export default function Home() {
  const [message, setMessage] = useState('Loading...');

  useEffect(() => {
    fetch('http://127.0.0.1:8000/api/data')
      .then((res) => res.json())
      .then((data) => setMessage(data.data))
      .catch((err) => {
        console.error(err);
        setMessage('Error connecting to backend');
      });
  }, []);

  return (
    <main style={{ padding: '2rem', fontFamily: 'sans-serif' }}>
      <h1>SherLostHolmes</h1>
      <h2>Frontend + Backend Connection Test</h2>
      <p>Backend response: <strong>{message}</strong></p>
    </main>
  );
}
