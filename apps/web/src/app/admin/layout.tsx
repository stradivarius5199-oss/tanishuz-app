import React from 'react';
import Link from 'next/link';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#0F172A] text-white flex">
      {/* Sidebar */}
      <aside className="w-64 bg-[#1E293B] border-r border-slate-800 flex flex-col shadow-xl">
        <div className="p-6">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-pink-500 to-orange-400 bg-clip-text text-transparent">
            Sparks Admin
          </h1>
          <p className="text-xs text-slate-400 mt-1">Superuser Dashboard</p>
        </div>
        <nav className="flex-1 px-4 space-y-2 mt-4">
          <Link href="/admin" className="block px-4 py-3 rounded-xl bg-slate-800/50 hover:bg-slate-700/50 text-sm font-medium transition-colors border border-slate-700/50">
            📊 Dashboard
          </Link>
          <Link href="/" className="block px-4 py-3 rounded-xl hover:bg-slate-800/50 text-slate-400 text-sm font-medium transition-colors mt-auto">
            &larr; Back to App
          </Link>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-8 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}
