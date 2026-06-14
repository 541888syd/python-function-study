import { type ReactNode, useEffect } from 'react';
import Navbar from './Navbar';

export default function Layout({ children }: { children: ReactNode }) {
  // Send heartbeat to server — when browser closes, server auto-shuts down
  useEffect(() => {
    const timer = setInterval(() => {
      fetch('/api/heartbeat').catch(() => {});
    }, 3000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 max-w-5xl w-full mx-auto px-4 py-6">
        {children}
      </main>
    </div>
  );
}
