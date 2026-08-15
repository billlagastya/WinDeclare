'use client';

import React, { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { CheckCircle2, Calendar, ArrowRight, ShieldCheck } from 'lucide-react';

function BookingSuccessContent() {
  const searchParams = useSearchParams();
  const txnid = searchParams.get('txnid') || searchParams.get('booking_id') || 'N/A';
  const bookingId = searchParams.get('booking_id') || txnid;

  return (
    <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl text-center space-y-6 animate-in fade-in zoom-in duration-300">
        <div className="w-20 h-20 bg-emerald-500/10 border border-emerald-500/20 rounded-full flex items-center justify-center mx-auto text-emerald-400">
          <CheckCircle2 className="w-10 h-10 stroke-[2.5]" />
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-slate-100">Payment Successful!</h1>
          <p className="text-slate-400 text-sm">
            Your booking has been confirmed and registered with the turf operator.
          </p>
        </div>

        <div className="bg-slate-950/60 border border-slate-800/80 rounded-2xl p-4 space-y-3 text-left">
          <div className="flex justify-between items-center text-xs text-slate-400">
            <span>Transaction ID</span>
            <span className="font-mono text-emerald-400 font-medium">{txnid}</span>
          </div>
          {bookingId !== txnid && (
            <div className="flex justify-between items-center text-xs text-slate-400">
              <span>Booking Reference</span>
              <span className="font-mono text-slate-200 font-medium">{bookingId}</span>
            </div>
          )}
          <div className="flex justify-between items-center text-xs text-slate-400">
            <span>Payment Status</span>
            <span className="inline-flex items-center gap-1 text-emerald-400 font-medium">
              <ShieldCheck className="w-3.5 h-3.5" /> Verified
            </span>
          </div>
        </div>

        <div className="pt-2 flex flex-col sm:flex-row gap-3">
          <Link
            href="/#profile-bookings"
            className="flex-1 inline-flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-semibold px-5 py-3 rounded-xl transition duration-200 shadow-lg shadow-emerald-500/20 text-sm"
          >
            <Calendar className="w-4 h-4" /> View My Bookings
          </Link>
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-1 bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium px-5 py-3 rounded-xl transition duration-200 text-sm"
          >
            Home <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function BookingSuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-emerald-500"></div>
      </div>
    }>
      <BookingSuccessContent />
    </Suspense>
  );
}
