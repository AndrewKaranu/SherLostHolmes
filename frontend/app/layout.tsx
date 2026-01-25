import type { Metadata } from "next";
import { VT323, Press_Start_2P } from 'next/font/google';
import {
  ClerkProvider,
  SignedIn,
  SignedOut,
  UserButton,
} from "@clerk/nextjs";
import Link from "next/link";
import "./globals.css";

// Font configurations from NominShredding
const vt323 = VT323({ 
  weight: '400',
  subsets: ['latin'],
  variable: '--font-vt323',
});

const pressStart2P = Press_Start_2P({
  weight: '400',
  subsets: ['latin'],
  variable: '--font-press-start-2p',
});

export const metadata: Metadata = {
  title: 'SherLostHolmes - Concordia Pixel Detective',
  description: 'Concordia Lost & Found Pixel Art Game with AI-powered matching',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider>
      <html lang="en" suppressHydrationWarning>
        <head>
          {/* External Icon Fonts */}
          <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet"/>
          <link href="https://fonts.icon?family=Material+Icons" rel="stylesheet"/>
        </head>
        <body 
          className={`${vt323.variable} ${pressStart2P.variable} font-handwriting`}
          suppressHydrationWarning
        >
          <header style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            padding: '1rem 2rem',
            borderBottom: '1px solid #eee'
          }}>
            <Link href="/" style={{ textDecoration: 'none', color: 'inherit' }}>
              <h1 style={{ margin: 0, fontSize: '1.5rem' }}>SherLostHolmes</h1>
            </Link>
            <nav style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
              <SignedOut>
                <Link href="/sign-in">
                  <button style={{ 
                    padding: '0.5rem 1rem', 
                    cursor: 'pointer',
                    border: '1px solid #333',
                    borderRadius: '4px',
                    background: 'white'
                  }}>
                    Sign In
                  </button>
                </Link>
                <Link href="/sign-up">
                  <button style={{ 
                    padding: '0.5rem 1rem', 
                    cursor: 'pointer',
                    border: 'none',
                    borderRadius: '4px',
                    background: '#333',
                    color: 'white'
                  }}>
                    Sign Up
                  </button>
                </Link>
              </SignedOut>
              <SignedIn>
                <UserButton afterSignOutUrl="/" />
              </SignedIn>
            </nav>
          </header>
          <main>{children}</main>
        </body>
      </html>
    </ClerkProvider>
  );
}