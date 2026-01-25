'use client';
import GameLayout from '@/components/GameLayout';
import HangingSign from '@/components/HangingSign';
import ChainLink from '@/components/ChainLink';

export default function Home() {
  return (
    <GameLayout>
      <HangingSign icon="login" title="Log In" href="/dashboard" />
      <ChainLink />
      <HangingSign icon="person_add" title="Register" href="/dashboard" delay="0.5s" />
    </GameLayout>
  );
}
