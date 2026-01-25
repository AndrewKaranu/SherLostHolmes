'use client';
import GameLayout from '@/components/GameLayout';
import HangingSign from '@/components/HangingSign';
import ChainLink from '@/components/ChainLink';

export default function Dashboard() {
  return (
    <GameLayout>
      <HangingSign icon="assignment_late" title="File a Report" href="/report" />
      <ChainLink />
      <HangingSign icon="dashboard" title="Evidence Board" href="/evidence" delay="0.5s" />
      <ChainLink />
      <HangingSign icon="🎰" title="Try Your Luck" href="/lucky-find" delay="1s" />
    </GameLayout>
  );
}
