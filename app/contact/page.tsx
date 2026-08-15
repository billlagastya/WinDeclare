import React from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Mail, Phone, MapPin, Building, ShieldCheck } from 'lucide-react';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Contact Us | WinDeclare',
  description: 'Contact WinDeclare support and management operated by ArivuZ (Sole Proprietorship).'
};

export default function ContactPage() {
  return (
    <div className="min-h-screen flex flex-col bg-[#0d1117] text-gray-100">
      <Navbar />

      <main className="flex-1 max-w-4xl w-full mx-auto px-4 py-12">
        <div className="text-center mb-10">
          <span className="text-xs font-bold text-[#EC4899] uppercase tracking-widest bg-pink-500/10 px-3 py-1 rounded-full border border-pink-500/20 inline-block mb-3">
            Customer Support & Inquiries
          </span>
          <h1 className="text-3xl md:text-4xl font-extrabold text-white">Contact Us</h1>
          <p className="text-gray-400 text-sm mt-2">
            Have questions or need assistance with your venue booking? Reach out to us.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
          {/* Card 1: Legal Entity Info */}
          <div className="bg-[#161b22] border border-gray-800 rounded-2xl p-6 flex flex-col justify-between">
            <div>
              <div className="w-10 h-10 rounded-xl bg-pink-500/10 border border-pink-500/20 flex items-center justify-center text-[#EC4899] mb-4">
                <Building className="w-5 h-5" />
              </div>
              <h2 className="text-lg font-bold text-white mb-2">Legal Business Entity</h2>
              <div className="space-y-2 text-sm text-gray-300">
                <p>
                  <span className="text-gray-400">Legal Entity Name:</span>{' '}
                  <strong className="text-white">ArivuZ</strong>
                </p>
                <p>
                  <span className="text-gray-400">Business Structure:</span>{' '}
                  <span className="text-[#EC4899] font-medium">Sole Proprietorship</span>
                </p>
                <p>
                  <span className="text-gray-400">Brand Name:</span>{' '}
                  <span className="text-white font-medium">WinDeclare</span>
                </p>
              </div>
            </div>
            <div className="mt-6 pt-4 border-t border-gray-800/80 flex items-center gap-2 text-xs text-emerald-400 font-medium">
              <ShieldCheck className="w-4 h-4" />
              RBI-Authorized Payment Gateway Secured Merchant
            </div>
          </div>

          {/* Card 2: Contact Details */}
          <div className="bg-[#161b22] border border-gray-800 rounded-2xl p-6 space-y-5">
            <h2 className="text-lg font-bold text-white mb-4">Get In Touch</h2>

            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-gray-900 border border-gray-800 text-[#EC4899] shrink-0">
                <Mail className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs text-gray-400">Official Support Email</p>
                <a 
                  href="mailto:arivuzai@gmail.com" 
                  className="text-sm font-semibold text-white hover:text-[#EC4899] transition"
                >
                  arivuzai@gmail.com
                </a>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-gray-900 border border-gray-800 text-[#EC4899] shrink-0">
                <Phone className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs text-gray-400">Contact Phone / WhatsApp</p>
                <a 
                  href="tel:+919505737751" 
                  className="text-sm font-semibold text-white hover:text-[#EC4899] transition"
                >
                  +91 9505737751
                </a>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-gray-900 border border-gray-800 text-[#EC4899] shrink-0">
                <MapPin className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs text-gray-400">Operating Address</p>
                <p className="text-sm font-medium text-white">
                  Secunderabad, Telangana, India
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Operating Disclosure */}
        <div className="bg-[#080c14] border border-gray-800 rounded-xl p-5 text-center text-xs text-gray-400">
          <p>
            WinDeclare website and mobile application services are owned and operated by{' '}
            <strong className="text-gray-200">ArivuZ</strong> (Sole Proprietorship).
          </p>
        </div>
      </main>

      <Footer />
    </div>
  );
}
