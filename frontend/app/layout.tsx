import type { Metadata } from "next";
import { VT323, Press_Start_2P } from 'next/font/google';
import { ClerkProvider } from "@clerk/nextjs";
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
          {children}
        </body>
      </html>
    </ClerkProvider>
  );
}