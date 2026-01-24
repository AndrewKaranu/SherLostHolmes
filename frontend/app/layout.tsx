import type { Metadata } from "next";
import {
  ClerkProvider,
  SignedIn,
  SignedOut,
  UserButton,
} from "@clerk/nextjs";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "SherLostHolmes",
  description: "Lost and Found with AI-powered matching",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider>
      <html lang="en" suppressHydrationWarning>
        <body suppressHydrationWarning>
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
