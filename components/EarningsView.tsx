'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { 
  TrendingUp, IndianRupee, Building2, Calendar, 
  Percent, Loader2, Filter, RefreshCw, CheckCircle2, DollarSign
} from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';

export interface OwnerGroundEarnings {
  ground_id: string;
  ground_name: string;
  owner_id: string;
  commission_rate: number;
  booking_date: string;
  total_bookings_today: number;
  gross_earnings: number;
  net_owner_payout: number;
  platform_commission: number;
}

interface EarningsViewProps {
  currentUser: any;
  ownerTurfs: any[];
  activeOwnerTurf?: any;
}

export default function EarningsView({ currentUser, ownerTurfs }: EarningsViewProps) {
  const [earningsData, setEarningsData] = useState<OwnerGroundEarnings[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedGroundId, setSelectedGroundId] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<string>('all');

  const fetchEarnings = async () => {
    setLoading(true);
    try {
      let query = supabase.from('daily_owner_ground_earnings').select('*');
      
      const groundIds = ownerTurfs.map((t: any) => String(t.id));
      if (currentUser?.id && groundIds.length > 0) {
        // Query matching owner_id or ground_ids
        query = query.or(`owner_id.eq.${currentUser.id},ground_id.in.(${groundIds.join(',')})`);
      } else if (currentUser?.id) {
        query = query.eq('owner_id', currentUser.id);
      }

      const { data, error } = await query;
      if (error) {
        console.warn('Supabase query error on daily_owner_ground_earnings:', error);
        // Fallback without filter if RLS or query structure differs
        const fallbackRes = await supabase.from('daily_owner_ground_earnings').select('*');
        setEarningsData(fallbackRes.data || []);
      } else {
        setEarningsData(data || []);
      }
    } catch (err) {
      console.error('Error fetching daily owner ground earnings:', err);
      setEarningsData([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEarnings();
  }, [currentUser?.id, ownerTurfs]);

  const filteredEarnings = useMemo(() => {
    return earningsData
      .filter((item) => {
        if (selectedGroundId !== 'all' && String(item.ground_id) !== String(selectedGroundId)) {
          return false;
        }

        if (dateFilter === '7days') {
          const past = new Date();
          past.setDate(past.getDate() - 7);
          return new Date(item.booking_date) >= past;
        } else if (dateFilter === '30days') {
          const past = new Date();
          past.setDate(past.getDate() - 30);
          return new Date(item.booking_date) >= past;
        }

        return true;
      })
      .sort((a, b) => new Date(b.booking_date).getTime() - new Date(a.booking_date).getTime());
  }, [earningsData, selectedGroundId, dateFilter]);

  const totals = useMemo(() => {
    return filteredEarnings.reduce(
      (acc, curr) => ({
        gross: acc.gross + Number(curr.gross_earnings || 0),
        commission: acc.commission + Number(curr.platform_commission || 0),
        net: acc.net + Number(curr.net_owner_payout || 0),
        bookings: acc.bookings + Number(curr.total_bookings_today || 0)
      }),
      { gross: 0, commission: 0, net: 0, bookings: 0 }
    );
  }, [filteredEarnings]);

  return (
    <div className="space-y-6">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#0e1320] border border-gray-800 rounded-3xl p-6 shadow-2xl">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-extrabold uppercase tracking-widest px-2.5 py-0.5 rounded border bg-teal-500/10 border-teal-500/30 text-teal-400">
              Live Supabase Integration
            </span>
            <span className="text-xs font-mono text-gray-400">`daily_owner_ground_earnings`</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white mt-1 flex items-center gap-2.5">
            <TrendingUp className="w-7 h-7 text-[#EC4899]" /> Earnings & Revenue Analytics
          </h2>
          <p className="text-xs text-gray-400 mt-0.5">
            Comprehensive breakdown of gross collections, platform commission fees, and net owner payouts.
          </p>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Venue Selector */}
          {ownerTurfs.length > 0 && (
            <div className="flex items-center gap-1.5 bg-[#080c14] border border-gray-800 rounded-xl px-3 py-1.5 text-xs text-gray-300">
              <Building2 className="w-3.5 h-3.5 text-[#EC4899]" />
              <select
                value={selectedGroundId}
                onChange={(e) => setSelectedGroundId(e.target.value)}
                className="bg-transparent font-bold text-white focus:outline-none cursor-pointer"
              >
                <option value="all" className="bg-[#080c14] text-white">All Ground Venues</option>
                {ownerTurfs.map((t: any) => (
                  <option key={t.id} value={String(t.id)} className="bg-[#080c14] text-white">
                    {t.title || t.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Date Filter */}
          <div className="flex items-center gap-1.5 bg-[#080c14] border border-gray-800 rounded-xl px-3 py-1.5 text-xs text-gray-300">
            <Filter className="w-3.5 h-3.5 text-teal-400" />
            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="bg-transparent font-bold text-white focus:outline-none cursor-pointer"
            >
              <option value="all" className="bg-[#080c14] text-white">All Time</option>
              <option value="7days" className="bg-[#080c14] text-white">Last 7 Days</option>
              <option value="30days" className="bg-[#080c14] text-white">Last 30 Days</option>
            </select>
          </div>

          {/* Refresh Button */}
          <button
            onClick={fetchEarnings}
            disabled={loading}
            className="p-2 bg-[#080c14] hover:bg-gray-800 border border-gray-800 text-gray-300 hover:text-white rounded-xl transition flex items-center justify-center"
            title="Refresh Earnings Data"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-[#EC4899]' : ''}`} />
          </button>
        </div>
      </div>

      {/* 4 Summary Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Gross Collection */}
        <div className="bg-[#0e1320] border border-gray-800 rounded-2xl p-5 space-y-2 shadow-xl hover:border-emerald-500/40 transition">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Total Gross Collection</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <IndianRupee className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-emerald-400 font-mono">
            ₹{totals.gross.toLocaleString('en-IN')}
          </div>
          <p className="text-[10px] text-gray-500">Gross player slot payments before platform fee</p>
        </div>

        {/* Platform Commission Deductions */}
        <div className="bg-[#0e1320] border border-gray-800 rounded-2xl p-5 space-y-2 shadow-xl hover:border-pink-500/40 transition">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Platform Commission</span>
            <div className="w-8 h-8 rounded-xl bg-pink-500/10 border border-pink-500/30 flex items-center justify-center text-[#EC4899]">
              <Percent className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-[#EC4899] font-mono">
            ₹{totals.commission.toLocaleString('en-IN')}
          </div>
          <p className="text-[10px] text-gray-500">Total platform service & gateway commission</p>
        </div>

        {/* Final Net Owner Payout */}
        <div className="bg-[#0e1320] border border-gray-800 rounded-2xl p-5 space-y-2 shadow-xl hover:border-teal-500/40 transition">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Final Net Payout</span>
            <div className="w-8 h-8 rounded-xl bg-teal-500/10 border border-teal-500/30 flex items-center justify-center text-teal-400">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-teal-400 font-mono">
            ₹{totals.net.toLocaleString('en-IN')}
          </div>
          <p className="text-[10px] text-gray-500">Net earnings credited to owner bank/UPI</p>
        </div>

        {/* Total Bookings Count */}
        <div className="bg-[#0e1320] border border-gray-800 rounded-2xl p-5 space-y-2 shadow-xl hover:border-purple-500/40 transition">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Total Bookings</span>
            <div className="w-8 h-8 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400">
              <Calendar className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-purple-400 font-mono">
            {totals.bookings}
          </div>
          <p className="text-[10px] text-gray-500">Total processed slots across period</p>
        </div>
      </div>

      {/* Breakdown Table */}
      <div className="bg-[#0e1320] border border-gray-800 rounded-3xl p-6 shadow-2xl space-y-4">
        <div className="flex items-center justify-between border-b border-gray-800 pb-4">
          <div>
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-teal-400" /> Daily Revenue & Commission Breakdown
            </h3>
            <p className="text-xs text-gray-400">
              Query results directly from <code className="text-teal-400">daily_owner_ground_earnings</code> table
            </p>
          </div>
          <span className="text-xs font-mono text-gray-400 bg-[#080c14] border border-gray-800 px-3 py-1 rounded-xl">
            {filteredEarnings.length} records found
          </span>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16 space-x-3">
            <Loader2 className="w-6 h-6 animate-spin text-[#EC4899]" />
            <span className="text-sm font-semibold text-gray-400">Loading Supabase Earnings Data...</span>
          </div>
        ) : filteredEarnings.length === 0 ? (
          <div className="text-center py-16 px-4 bg-[#080c14] border border-dashed border-gray-800 rounded-2xl space-y-3">
            <Building2 className="w-10 h-10 text-gray-600 mx-auto" />
            <h4 className="text-base font-bold text-white">No Earnings Records Found</h4>
            <p className="text-xs text-gray-400 max-w-md mx-auto">
              There are no recorded earnings for the selected ground or filter criteria in <code className="text-teal-400">daily_owner_ground_earnings</code>.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-gray-800 text-gray-400 font-bold uppercase tracking-wider">
                  <th className="py-3 px-4">Transaction Date</th>
                  <th className="py-3 px-4">Ground Venue</th>
                  <th className="py-3 px-4 text-center">Bookings</th>
                  <th className="py-3 px-4 text-right">Gross Earnings</th>
                  <th className="py-3 px-4 text-right">Platform Fee</th>
                  <th className="py-3 px-4 text-right">Net Payout</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800/60 font-mono text-gray-300">
                {filteredEarnings.map((item, idx) => (
                  <tr key={`${item.ground_id}-${item.booking_date}-${idx}`} className="hover:bg-gray-900/50 transition">
                    {/* Date */}
                    <td className="py-3.5 px-4 font-bold text-white">
                      {new Date(item.booking_date).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                      })}
                    </td>
                    {/* Ground Name */}
                    <td className="py-3.5 px-4 font-sans font-medium text-gray-200">
                      {item.ground_name || 'Ground Venue'}
                    </td>
                    {/* Bookings Count */}
                    <td className="py-3.5 px-4 text-center">
                      <span className="inline-block px-2.5 py-0.5 rounded-lg bg-gray-800 text-gray-300 font-bold text-[11px]">
                        {item.total_bookings_today} slots
                      </span>
                    </td>
                    {/* Gross */}
                    <td className="py-3.5 px-4 text-right font-bold text-emerald-400">
                      ₹{Number(item.gross_earnings || 0).toLocaleString('en-IN')}
                    </td>
                    {/* Platform Fee */}
                    <td className="py-3.5 px-4 text-right text-[#EC4899]">
                      ₹{Number(item.platform_commission || 0).toLocaleString('en-IN')}
                      <span className="text-[10px] text-gray-500 block font-normal">
                        ({item.commission_rate || 0}%)
                      </span>
                    </td>
                    {/* Net Payout */}
                    <td className="py-3.5 px-4 text-right font-extrabold text-teal-400">
                      ₹{Number(item.net_owner_payout || 0).toLocaleString('en-IN')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
