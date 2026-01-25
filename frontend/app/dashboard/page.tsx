'use client';

import { useUser } from '@clerk/nextjs';
import GameLayout from '@/components/GameLayout';
import HangingSign from '@/components/HangingSign';
import ChainLink from '@/components/ChainLink';

export default function Dashboard() {
  const { isLoaded, isSignedIn } = useUser();

  return (
    <GameLayout>
      {/* Show different menu based on auth state */}
      {isLoaded && isSignedIn ? (
        <>
          {/* Signed in - show dashboard menu */}
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
    </GameLayout>
  );
}
