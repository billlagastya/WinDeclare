'use client';

import React from 'react';
import Link from 'next/link';
import { Trophy } from 'lucide-react';

interface FooterProps {
  onOpenAdmin?: () => void;
}

export default function Footer({ onOpenAdmin }: FooterProps) {
  return (
    <footer className="w-full border-t border-gray-800 bg-black text-gray-400 py-8 px-4">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6 text-sm text-center md:text-left">
        <div>
          <Link href="/" className="font-semibold text-white text-base flex items-center justify-center md:justify-start gap-2 hover:text-[#EC4899] transition">
            <img src="/favicon.png?v=3" alt="WinDeclare" className="w-7 h-7 object-contain" />
            WinDeclare
          </Link>
          <p className="text-xs text-gray-400 mt-2">
            Operated by: <span className="text-gray-200 font-medium">ArivuZ</span> (Sole Proprietorship)
          </p>
        </div>

        <div className="text-xs text-gray-400 flex flex-col items-center md:items-end gap-3">
          <div className="flex flex-wrap justify-center md:justify-end gap-4 sm:gap-6 font-semibold text-gray-300">
            <Link href="/contact" className="hover:text-[#EC4899] transition">Contact Us</Link>
            <Link href="/terms" className="hover:text-[#EC4899] transition">Terms & Conditions</Link>
            <Link href="/privacy" className="hover:text-[#EC4899] transition">Privacy Policy</Link>
            <Link href="/cancellation-policy" className="hover:text-[#EC4899] transition">Refund & Cancellation</Link>
            {onOpenAdmin && (
              <button 
                type="button"
                onClick={(e) => { e.preventDefault(); onOpenAdmin(); }} 
                className="hover:text-purple-400 text-gray-600 font-semibold transition"
              >
                Admin Entrance
              </button>
            )}
          </div>
          <p>© {new Date().getFullYear()} WinDeclare. All rights reserved.</p>
          <p className="text-gray-500">
            Legal Entity Name: <span className="text-gray-400">ArivuZ</span>
          </p>
        </div>
      </div>
    </footer>
  );
}
