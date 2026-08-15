'use client';

import React, { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { XCircle, RefreshCw, Home, AlertCircle } from 'lucide-react';

function BookingFailedContent() {
  const searchParams = useSearchParams();
  const txnid = searchParams.get('txnid') || 'N/A';
  const reason = searchParams.get('reason') || 'Transaction was canceled or could not be verified.';

  return (
    <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl text-center space-y-6 animate-in fade-in zoom-in duration-300">
        <div className="w-20 h-20 bg-rose-500/10 border border-rose-500/20 rounded-full flex items-center justify-center mx-auto text-rose-400">
          <XCircle className="w-10 h-10 stroke-[2.5]" />
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-slate-100">Payment Failed</h1>
          <p className="text-slate-400 text-sm">
            We could not complete your transaction. No funds were debited, or if deducted, will be automatically refunded by PayU.
          </p>
        </div>

        <div className="bg-slate-950/60 border border-slate-800/80 rounded-2xl p-4 space-y-3 text-left">
          <div className="flex justify-between items-center text-xs text-slate-400">
            <span>Transaction ID</span>
            <span className="font-mono text-rose-400 font-medium">{txnid}</span>
          </div>
          <div className="flex items-start gap-2 text-xs text-slate-400">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <span><strong className="text-slate-300">Reason:</strong> {reason}</span>
          </div>
        </div>

        <div className="pt-2 flex flex-col sm:flex-row gap-3">
          <Link
            href="/"
            className="flex-1 inline-flex items-center justify-center gap-2 bg-rose-500 hover:bg-rose-600 text-white font-semibold px-5 py-3 rounded-xl transition duration-200 shadow-lg shadow-rose-500/20 text-sm"
          >
            <RefreshCw className="w-4 h-4" /> Try Booking Again
          </Link>
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-1 bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium px-5 py-3 rounded-xl transition duration-200 text-sm"
          >
            <Home className="w-4 h-4" /> Home
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function BookingFailedPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-rose-500"></div>
      </div>
    }>
      <BookingFailedContent />
    </Suspense>
  );
}
