import React from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Privacy Policy | WinDeclare',
  description: 'Privacy Policy for WinDeclare sports turf platform operated by ArivuZ.'
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen flex flex-col bg-[#0d1117] text-gray-100">
      <Navbar />

      <main className="flex-1 max-w-4xl w-full mx-auto px-4 py-12">
        <div className="border-b border-gray-800 pb-6 mb-8">
          <span className="text-xs font-bold text-[#EC4899] uppercase tracking-widest bg-pink-500/10 px-3 py-1 rounded-full border border-pink-500/20 inline-block mb-3">
            Data Protection & Privacy
          </span>
          <h1 className="text-3xl md:text-4xl font-extrabold text-white">Privacy Policy</h1>
          <p className="text-gray-400 text-xs mt-2">Last Updated: August 2026</p>
        </div>

        <div className="space-y-8 text-sm text-gray-300 leading-relaxed">
          {/* Introduction */}
          <section className="bg-[#161b22] border border-gray-800 rounded-2xl p-6">
            <h2 className="text-lg font-bold text-white mb-3">
              1. Platform & Entity Disclosure
            </h2>
            <p>
              This Privacy Policy explains how <strong className="text-white">WinDeclare</strong> (&quot;We&quot;, &quot;Us&quot;, &quot;Our&quot;), operated by <strong className="text-[#EC4899] font-semibold">ArivuZ</strong> (Sole Proprietorship), collects, uses, and safeguards user information when you use our web application to book sports venues.
            </p>
          </section>

          {/* Section 2: Collection */}
          <section className="bg-[#161b22] border border-gray-800 rounded-2xl p-6">
            <h2 className="text-lg font-bold text-white mb-3">
              2. Information We Collect
            </h2>
            <p>
              To process venue bookings and issue confirmation receipts, we collect essential user contact details:
            </p>
            <ul className="list-disc list-inside space-y-2 mt-3 text-gray-300">
              <li><strong className="text-white">Full Name:</strong> To identify booking ownership at the turf location.</li>
              <li><strong className="text-white">Phone Number:</strong> To send SMS/WhatsApp booking confirmation and verification codes.</li>
              <li><strong className="text-white">Email Address:</strong> To deliver payment receipts and invoice records.</li>
            </ul>
          </section>

          {/* Section 3: Payment Security */}
          <section className="bg-[#161b22] border border-gray-800 rounded-2xl p-6">
            <h2 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
              3. Payment Security & Payment Gateway Disclosure
            </h2>
            <p className="text-emerald-400 font-semibold mb-2">
              🔒 We Do NOT Store Sensitive Payment Information.
            </p>
            <p>
              All online digital payments on WinDeclare are processed securely through authorized, RBI-compliant payment gateway partners.
            </p>
            <p className="mt-3">
              WinDeclare does not store credit/debit card numbers, UPI PINs, CVVs, or Net Banking credentials on its servers. Payment transactions are executed directly through encrypted, PCI-DSS compliant checkout systems.
            </p>
          </section>

          {/* Section 4: Data Usage */}
          <section className="bg-[#161b22] border border-gray-800 rounded-2xl p-6">
            <h2 className="text-lg font-bold text-white mb-3">
              4. Data Sharing & Usage Policy
            </h2>
            <p>
              Your personal information is used exclusively to facilitate turf slot reservations, prevent double-bookings, and communicate transaction details.
            </p>
            <p className="mt-3">
              We do <strong className="text-white">NOT</strong> sell, rent, or trade your personal data to third-party advertisers. Necessary booking information (Name and Phone) is shared with the specific venue owner of your booked turf solely for entry verification.
            </p>
          </section>

          {/* Section 5: Contact */}
          <section className="bg-[#161b22] border border-gray-800 rounded-2xl p-6">
            <h2 className="text-lg font-bold text-white mb-3">
              5. Privacy Questions & Contact
            </h2>
            <p className="text-xs text-gray-400">
              For privacy requests or data inquiries, please reach out to our privacy officer:
            </p>
            <div className="mt-3 space-y-1 text-xs text-gray-300 font-mono">
              <p>Operated by: ArivuZ (Sole Proprietorship)</p>
              <p>Email: arivuzai@gmail.com</p>
              <p>Phone: +91 9505737751</p>
              <p>Location: Secunderabad, Telangana, India</p>
            </div>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
}
