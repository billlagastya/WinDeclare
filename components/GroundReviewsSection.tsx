'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Star, ShieldCheck, ThumbsUp, Filter, MessageSquare, Loader2, Sparkles, User } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';

export interface ReviewItem {
  id: string;
  ground_id: string;
  user_id: string;
  booking_id: string;
  rating: number;
  tags?: string[];
  comment?: string;
  created_at: string;
  profiles?: {
    name?: string;
    display_name?: string;
    username?: string;
    email?: string;
    avatar_url?: string;
  };
}

interface GroundReviewsSectionProps {
  groundId: string | number;
  groundTitle: string;
  initialRating?: number;
  initialReviewsCount?: number;
}

export default function GroundReviewsSection({
  groundId,
  groundTitle,
  initialRating = 4.8,
  initialReviewsCount = 0
}: GroundReviewsSectionProps) {
  const [reviews, setReviews] = useState<ReviewItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [filterStar, setFilterStar] = useState<number | 'ALL'>('ALL');
  const [selectedTagFilter, setSelectedTagFilter] = useState<string | 'ALL'>('ALL');

  const strGroundId = String(groundId);

  const fetchReviews = useCallback(async () => {
    if (!strGroundId) return;
    setLoading(true);
    try {
      // 1. Try querying reviews for ground_id joined with profiles(name, display_name, avatar_url)
      const { data: joinedReviews, error: revErr } = await supabase
        .from('reviews')
        .select('*, profiles(name, display_name, username, email, avatar_url)')
        .eq('ground_id', strGroundId)
        .order('created_at', { ascending: false });

      if (!revErr && joinedReviews && joinedReviews.length > 0) {
        // Clean profiles object inside reviews if present
        const processed = joinedReviews.map((r: any) => ({
          ...r,
          profiles: Array.isArray(r.profiles) ? r.profiles[0] : (r.profiles || { display_name: 'Verified Player' })
        }));
        setReviews(processed);
        setLoading(false);
        return;
      }

      // 2. Fallback: Query reviews table directly, then fetch matching profiles
      const { data: rawReviews, error: rawErr } = await supabase
        .from('reviews')
        .select('*')
        .eq('ground_id', strGroundId)
        .order('created_at', { ascending: false });

      if (rawErr || !rawReviews || rawReviews.length === 0) {
        setReviews([]);
        setLoading(false);
        return;
      }

      const userIds = Array.from(new Set(rawReviews.map(r => r.user_id).filter(Boolean)));
      let profileMap: Record<string, any> = {};

      if (userIds.length > 0) {
        const { data: profilesData } = await supabase
          .from('profiles')
          .select('id, display_name, email')
          .in('id', userIds);

        if (profilesData) {
          profilesData.forEach(p => {
            profileMap[p.id] = p;
          });
        }
      }

      const mapped: ReviewItem[] = rawReviews.map(r => ({
        ...r,
        profiles: profileMap[r.user_id] || { display_name: 'Verified Player' }
      }));

      setReviews(mapped);
    } catch (err) {
      console.error('Unexpected error fetching reviews:', err);
    } finally {
      setLoading(false);
    }
  }, [strGroundId]);

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  // Rating & Statistics Calculations
  const stats = useMemo(() => {
    if (reviews.length === 0) {
      return {
        avgRating: initialRating,
        totalCount: initialReviewsCount,
        starCounts: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
        tagsCount: {} as Record<string, number>
      };
    }

    const totalCount = reviews.length;
    const sumRating = reviews.reduce((acc, r) => acc + (r.rating || 5), 0);
    const avgRating = Math.round((sumRating / totalCount) * 10) / 10;

    const starCounts: Record<number, number> = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    const tagsCount: Record<string, number> = {};

    reviews.forEach(r => {
      const star = r.rating || 5;
      starCounts[star] = (starCounts[star] || 0) + 1;

      if (r.tags && Array.isArray(r.tags)) {
        r.tags.forEach(tag => {
          tagsCount[tag] = (tagsCount[tag] || 0) + 1;
        });
      }
    });

    return { avgRating, totalCount, starCounts, tagsCount };
  }, [reviews, initialRating, initialReviewsCount]);

  // Filtered reviews
  const filteredReviews = useMemo(() => {
    return reviews.filter(r => {
      const matchStar = filterStar === 'ALL' || r.rating === filterStar;
      const matchTag = selectedTagFilter === 'ALL' || (r.tags && r.tags.includes(selectedTagFilter));
      return matchStar && matchTag;
    });
  }, [reviews, filterStar, selectedTagFilter]);

  const topTags = useMemo(() => {
    return Object.entries(stats.tagsCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([tag]) => tag);
  }, [stats.tagsCount]);

  return (
    <div className="bg-[#0e1320] border border-gray-800 rounded-3xl p-6 sm:p-8 space-y-8 shadow-xl text-left">
      {/* Header & Overall Breakdown */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 border-b border-gray-800/80 pb-6">
        <div>
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-[#EC4899]" />
            <h3 className="text-xl font-black text-white tracking-tight">Verified Player Reviews</h3>
          </div>
          <p className="text-xs text-gray-400 mt-1">Real ratings and feedback submitted by players with confirmed slot bookings.</p>
        </div>

        {/* Rating Summary Box */}
        <div className="flex items-center gap-4 bg-[#080c14] border border-gray-800 px-5 py-3.5 rounded-2xl">
          <div className="text-center">
            <span className="text-3xl font-black text-white font-mono block leading-none">{stats.avgRating}</span>
            <div className="flex items-center gap-0.5 justify-center mt-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  className={`w-3.5 h-3.5 ${
                    star <= Math.round(stats.avgRating)
                      ? 'fill-amber-400 text-amber-400'
                      : 'text-gray-700 fill-gray-900/40'
                  }`}
                />
              ))}
            </div>
            <span className="text-[10px] text-gray-400 font-bold mt-0.5 block">{stats.totalCount} {stats.totalCount === 1 ? 'Review' : 'Reviews'}</span>
          </div>

          {/* Star Distribution Progress Bars */}
          <div className="space-y-1 pl-4 border-l border-gray-800 text-[10px] text-gray-400 w-36">
            {[5, 4, 3, 2, 1].map((num) => {
              const count = stats.starCounts[num] || 0;
              const pct = stats.totalCount > 0 ? (count / stats.totalCount) * 100 : 0;
              return (
                <div key={num} className="flex items-center gap-1.5">
                  <span className="w-3 font-mono font-bold">{num}★</span>
                  <div className="flex-1 h-1.5 bg-gray-900 rounded-full overflow-hidden border border-gray-800">
                    <div className="h-full bg-amber-400 rounded-full transition-all duration-300" style={{ width: `${pct}%` }} />
                  </div>
                  <span className="w-4 text-right font-mono text-[9px] text-gray-500">{count}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Quick Filter Tags & Star Filter */}
      {reviews.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold text-gray-300 uppercase tracking-wider flex items-center gap-1.5">
              <Filter className="w-3.5 h-3.5 text-[#EC4899]" /> Filter Reviews
            </span>
            {(filterStar !== 'ALL' || selectedTagFilter !== 'ALL') && (
              <button
                onClick={() => { setFilterStar('ALL'); setSelectedTagFilter('ALL'); }}
                className="text-[10px] font-bold text-[#EC4899] hover:underline"
              >
                Reset Filters
              </button>
            )}
          </div>

          <div className="flex flex-wrap gap-2">
            {/* Star Filters */}
            <button
              onClick={() => setFilterStar(filterStar === 'ALL' ? 'ALL' : 'ALL')}
              className={`px-3 py-1 rounded-xl text-xs font-bold transition border ${
                filterStar === 'ALL' && selectedTagFilter === 'ALL'
                  ? 'bg-gradient-to-r from-[#0EA5E9] to-[#EC4899] text-black border-transparent'
                  : 'bg-[#080c14] border-gray-800 text-gray-400 hover:text-white'
              }`}
            >
              All ({reviews.length})
            </button>

            {[5, 4, 3].map((star) => (
              <button
                key={star}
                onClick={() => setFilterStar(filterStar === star ? 'ALL' : star)}
                className={`px-3 py-1 rounded-xl text-xs font-bold transition border flex items-center gap-1 ${
                  filterStar === star
                    ? 'bg-amber-400 text-black border-amber-400 font-extrabold'
                    : 'bg-[#080c14] border-gray-800 text-gray-400 hover:text-white'
                }`}
              >
                {star} ★ ({stats.starCounts[star] || 0})
              </button>
            ))}

            {topTags.map((tag) => (
              <button
                key={tag}
                onClick={() => setSelectedTagFilter(selectedTagFilter === tag ? 'ALL' : tag)}
                className={`px-3 py-1 rounded-xl text-xs font-bold transition border ${
                  selectedTagFilter === tag
                    ? 'bg-pink-500/20 text-[#EC4899] border-pink-500/50'
                    : 'bg-[#080c14] border-gray-800 text-gray-400 hover:text-white'
                }`}
              >
                {tag}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Reviews List */}
      {loading ? (
        <div className="text-center py-12 bg-[#080c14] border border-gray-800 rounded-2xl space-y-2">
          <Loader2 className="w-6 h-6 text-[#EC4899] animate-spin mx-auto" />
          <p className="text-xs text-gray-400 font-medium">Loading verified player reviews...</p>
        </div>
      ) : filteredReviews.length === 0 ? (
        <div className="text-center py-12 px-4 bg-[#080c14] border border-dashed border-gray-800 rounded-2xl space-y-3">
          <MessageSquare className="w-8 h-8 text-[#EC4899] mx-auto opacity-70" />
          <h4 className="text-sm font-bold text-white">No verified reviews found</h4>
          <p className="text-xs text-gray-400 max-w-sm mx-auto">
            {reviews.length === 0
              ? 'No reviews have been submitted for this ground yet. Complete a slot booking to be the first to leave a verified review!'
              : 'No reviews match your selected filter criteria. Try resetting filters.'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredReviews.map((rev) => {
            const userName = rev.profiles?.name || rev.profiles?.display_name || rev.profiles?.username || 'Verified Player';
            const avatarUrl = rev.profiles?.avatar_url;
            const userInitial = userName.charAt(0).toUpperCase();

            return (
              <div
                key={rev.id}
                className="bg-[#080c14] border border-gray-800/80 rounded-2xl p-4 sm:p-5 space-y-3 hover:border-gray-700 transition shadow-lg"
              >
                {/* Reviewer Header */}
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    {avatarUrl ? (
                      <img src={avatarUrl} alt={userName} className="w-9 h-9 rounded-full object-cover border border-gray-800 shadow-md" />
                    ) : (
                      <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-[#0EA5E9] to-[#EC4899] text-black font-black flex items-center justify-center text-xs shadow-md">
                        {userInitial}
                      </div>
                    )}
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-xs font-bold text-white">{userName}</h4>
                        <span className="inline-flex items-center gap-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[9px] font-extrabold px-2 py-0.5 rounded-md">
                          <ShieldCheck className="w-3 h-3 text-emerald-400" /> Verified Booking
                        </span>
                      </div>
                      <span className="text-[10px] text-gray-500 font-mono">
                        {new Date(rev.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </span>
                    </div>
                  </div>

                  {/* Rating Stars */}
                  <div className="flex items-center gap-1 bg-amber-400/10 border border-amber-400/20 px-2.5 py-1 rounded-xl">
                    <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                    <span className="text-xs font-black text-amber-400 font-mono">{rev.rating}.0</span>
                  </div>
                </div>

                {/* Highlight Tags */}
                {rev.tags && rev.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {rev.tags.map((tag) => (
                      <span
                        key={tag}
                        className="bg-gray-900 border border-gray-800 text-[10px] font-bold text-gray-300 px-2 py-0.5 rounded-lg"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}

                {/* Review Comment */}
                {rev.comment && (
                  <p className="text-xs text-gray-300 leading-relaxed pt-1 font-normal">
                    &quot;{rev.comment}&quot;
                  </p>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
