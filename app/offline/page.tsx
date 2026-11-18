import Link from "next/link";

export default function Offline() {
  return (
    <main className="offlinePage">
      <div className="offlineCard">
        <span className="offlineEmoji">📴</span>
        <h1>You&apos;re offline</h1>
        <p>
          The playground still works from your home screen — bubbles, breathing, music, and drawings are all cached.
          This page only shows up when you open a link that was never loaded before.
        </p>
        <Link href="/" className="primaryBtn">
          Back to the playground
        </Link>
      </div>
    </main>
  );
}
