import React from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Terms & Conditions | WinDeclare',
  description: 'Terms and Conditions for WinDeclare sports venue booking platform operated by KONDRA SHRAVAN KUMAR.'
};

export default function TermsPage() {
  return (
    <div className="min-h-screen flex flex-col bg-[#0d1117] text-gray-100">
      <Navbar />

      <main className="flex-1 max-w-4xl w-full mx-auto px-4 py-12">
        <div className="border-b border-gray-800 pb-6 mb-8">
          <span className="text-xs font-bold text-amber-400 uppercase tracking-widest bg-amber-500/10 px-3 py-1 rounded-full border border-amber-500/20 inline-block mb-3">
            Legal Agreement
          </span>
          <h1 className="text-3xl md:text-4xl font-extrabold text-white">Terms & Conditions</h1>
          <p className="text-gray-400 text-xs mt-2">Last Updated: August 2026</p>
        </div>

        <div className="space-y-8 text-sm text-gray-300 leading-relaxed">
          {/* Section 1 */}
          <section className="bg-[#161b22] border border-gray-800 rounded-2xl p-6">
            <h2 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
              1. Ownership & Business Structure
            </h2>
            <p>
              The sports turf and arena booking platform <strong className="text-white">WinDeclare</strong> (&quot;Website&quot;, &quot;Platform&quot;, &quot;We&quot;, &quot;Us&quot;, &quot;Our&quot;) is entirely owned and operated by <strong className="text-amber-400 font-semibold">KONDRA SHRAVAN KUMAR</strong> (Sole Proprietorship), registered in Secunderabad, Telangana, India.
            </p>
            <p className="mt-3">
              By accessing or using WinDeclare to browse or book sports grounds, box cricket turfs, football fields, or badminton courts, you agree to be bound by these Terms & Conditions.
            </p>
          </section>

          {/* Section 2 */}
          <section className="bg-[#161b22] border border-gray-800 rounded-2xl p-6">
            <h2 className="text-lg font-bold text-white mb-3">
              2. Venue Booking Terms & Slot Reservation
            </h2>
            <ul className="list-disc list-inside space-y-2 text-gray-300">
              <li>
                <strong className="text-white">Slot Confirmation:</strong> Bookings made through WinDeclare are real-time slot reservations. A slot is guaranteed once payment is successfully processed.
              </li>
              <li>
                <strong className="text-white">User Responsibilities:</strong> Users must provide accurate contact details (Name, Phone Number, Email) during checkout to receive booking verification codes and notifications.
              </li>
              <li>
                <strong className="text-white">Punctuality & Conduct:</strong> Users must respect the reserved time slot and adhere to venue ground rules, footwear requirements, and safety policies.
              </li>
            </ul>
          </section>

          {/* Section 3 */}
          <section className="bg-[#161b22] border border-gray-800 rounded-2xl p-6">
            <h2 className="text-lg font-bold text-white mb-3">
              3. Online Payment Processing (Cashfree Payments)
            </h2>
            <p>
              All online digital payments on WinDeclare are processed securely via <strong className="text-white">Cashfree Payments India Private Limited</strong>.
            </p>
            <p className="mt-3">
              WinDeclare does not store credit/debit card numbers, UPI PINs, CVVs, or Net Banking credentials on its servers. Payment transactions are executed directly through Cashfree&apos;s RBI-compliant payment gateway.
            </p>
          </section>

          {/* Section 4 */}
          <section className="bg-[#161b22] border border-gray-800 rounded-2xl p-6">
            <h2 className="text-lg font-bold text-white mb-3">
              4. Cancellations & Venue Owner Rules
            </h2>
            <p>
              Individual turf owners and venue managers set the specific cancellation, modification, and refund terms for their respective grounds.
            </p>
            <p className="mt-3">
              Unless explicitly declared refundable by a specific venue owner, confirmed slot bookings are non-refundable. Please review our <a href="/cancellation-policy" className="text-amber-400 underline font-medium">Refund & Cancellation Policy</a> prior to completing your transaction.
            </p>
          </section>

          {/* Section 5 */}
          <section className="bg-[#161b22] border border-gray-800 rounded-2xl p-6">
            <h2 className="text-lg font-bold text-white mb-3">
              5. Contact & Legal Entity Details
            </h2>
            <p className="text-xs text-gray-400">
              For any legal or contractual inquiries, please contact:
            </p>
            <div className="mt-3 space-y-1 text-xs text-gray-300 font-mono">
              <p>Legal Entity Name: KONDRA SHRAVAN KUMAR (Sole Proprietorship)</p>
              <p>Email: Kondrashravankumar@gmail.com</p>
              <p>Phone: +91 9505737751</p>
              <p>Address: Secunderabad, Telangana, India</p>
            </div>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
}
