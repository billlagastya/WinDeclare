'use client';

import React from 'react';
import Link from 'next/link';
import { Trophy, ArrowLeft } from 'lucide-react';

export default function Navbar() {
  return (
    <header className="border-b border-gray-800/80 bg-[#0d1117]/90 backdrop-blur sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 group">
          <img src="/logo.png" alt="WinDeclare" className="w-9 h-9 object-contain group-hover:scale-105 transition duration-300" />
          <span className="font-extrabold text-xl tracking-tight text-white group-hover:text-[#EC4899] transition">
            WinDeclare
          </span>
        </Link>

        <Link
          href="/"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-900 border border-gray-800 text-xs font-semibold text-gray-300 hover:text-white hover:bg-gray-800 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Home
        </Link>
      </div>
    </header>
  );
}
