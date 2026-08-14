import React from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import type { Metadata } from 'next';
import { RefreshCw, Clock, AlertTriangle, ShieldCheck } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Refund & Cancellation Policy | WinDeclare',
  description: 'Refund and cancellation policy for WinDeclare venue bookings operated by ArivuZ.'
};

export default function CancellationPolicyPage() {
  return (
    <div className="min-h-screen flex flex-col bg-[#0d1117] text-gray-100">
      <Navbar />

      <main className="flex-1 max-w-4xl w-full mx-auto px-4 py-12">
        <div className="border-b border-gray-800 pb-6 mb-8">
          <span className="text-xs font-bold text-[#EC4899] uppercase tracking-widest bg-pink-500/10 px-3 py-1 rounded-full border border-pink-500/20 inline-block mb-3">
            Cashfree Compliance Policy
          </span>
          <h1 className="text-3xl md:text-4xl font-extrabold text-white">Refund & Cancellation Policy</h1>
          <p className="text-gray-400 text-xs mt-2">Last Updated: August 2026</p>
        </div>

        <div className="space-y-8 text-sm text-gray-300 leading-relaxed">
          {/* Overview */}
          <section className="bg-[#161b22] border border-gray-800 rounded-2xl p-6">
            <h2 className="text-lg font-bold text-white mb-3">
              1. Business Ownership & Policy Scope
            </h2>
            <p>
              This Refund & Cancellation Policy applies to all slot bookings, venue rentals, and payment transactions conducted on <strong className="text-white">WinDeclare</strong>, operated by <strong className="text-[#EC4899] font-semibold">ArivuZ</strong> (Sole Proprietorship).
            </p>
          </section>

          {/* Core Cancellation Rules */}
          <section className="bg-[#161b22] border border-gray-800 rounded-2xl p-6">
            <div className="flex items-center gap-2 text-[#EC4899] font-bold mb-3">
              <AlertTriangle className="w-5 h-5 shrink-0" />
              <h2 className="text-lg text-white">2. Venue Owner Cancellation Rules</h2>
            </div>
            <p>
              Cancellation and refund eligibility are determined strictly by individual turf and venue owners. 
            </p>
            <ul className="list-disc list-inside space-y-2 mt-3 text-gray-300">
              <li>
                <strong className="text-white">Standard Policy:</strong> Bookings for sports venues are strictly <span className="text-[#EC4899] font-semibold">NON-REFUNDABLE</span> once confirmed, unless specified otherwise by the respective venue owner prior to booking.
              </li>
              <li>
                <strong className="text-white">Pre-Payment Disclosure:</strong> Refund terms and venue rules are explicitly disclosed to users before completing payment checkout.
              </li>
              <li>
                <strong className="text-white">Weather / Force Majeure:</strong> In cases of severe weather, rainouts, or venue maintenance issues, slot rescheduling or refund decisions rest with the venue manager.
              </li>
            </ul>
          </section>

          {/* Refund Timeline (Cashfree Standard) */}
          <section className="bg-[#161b22] border border-pink-500/30 rounded-2xl p-6 bg-gradient-to-b from-[#161b22] to-[#12161f]">
            <div className="flex items-center gap-2 text-emerald-400 font-bold mb-3">
              <RefreshCw className="w-5 h-5 shrink-0" />
              <h2 className="text-lg text-white">3. Refund Processing & Gateway Timelines</h2>
            </div>
            <p className="text-white font-medium text-base mb-3">
              Mandatory Payment Gateway Terms (Cashfree Payments):
            </p>
            <div className="bg-[#080c14] border border-gray-800 rounded-xl p-4 text-emerald-300 font-semibold text-sm">
              &quot;Approved refunds, if granted by venue owners, will be processed back to the original payment source within 5 to 7 business days via Cashfree.&quot;
            </div>
            <div className="mt-4 flex items-center gap-3 text-xs text-gray-400">
              <Clock className="w-4 h-4 text-[#EC4899] shrink-0" />
              <span>Standard bank settlement cycles apply. Once initiated, refund status can be tracked via your payment receipt or bank statement.</span>
            </div>
          </section>

          {/* Refund Requests & Assistance */}
          <section className="bg-[#161b22] border border-gray-800 rounded-2xl p-6">
            <h2 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-[#EC4899]" />
              4. Support & Refund Claims Assistance
            </h2>
            <p>
              If you experienced a double deduction or technical payment failure where a slot was not allocated, please reach out directly to our support team with your booking ID:
            </p>
            <div className="mt-4 p-4 rounded-xl bg-gray-900 border border-gray-800 space-y-1 text-xs text-gray-300 font-mono">
              <p><strong className="text-white">Legal Entity:</strong> ArivuZ (Sole Proprietorship)</p>
              <p><strong className="text-white">Official Support Email:</strong> arivuzai@gmail.com</p>
              <p><strong className="text-white">Helpline Phone:</strong> +91 9505737751</p>
              <p><strong className="text-white">Operating Location:</strong> Secunderabad, Telangana, India</p>
            </div>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
}
