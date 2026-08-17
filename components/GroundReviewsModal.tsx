'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Star, X, ShieldCheck, MessageSquare, Loader2, Sparkles } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';

export interface GroundReviewItem {
  id: string;
  rating: number;
  comment?: string;
  tags?: string[];
  created_at: string;
  user_id?: string;
  user_name?: string;
  profiles?: {
    id?: string;
    name?: string;
    display_name?: string;
    full_name?: string;
    username?: string;
    email?: string;
    avatar_url?: string;
  } | Array<{
    id?: string;
    name?: string;
    display_name?: string;
    full_name?: string;
    username?: string;
    email?: string;
    avatar_url?: string;
  }>;
}

interface GroundReviewsModalProps {
  groundId: string;
  groundName: string;
  isOpen: boolean;
  onClose: () => void;
}

export default function GroundReviewsModal({
  groundId,
  groundName,
  isOpen,
  onClose
}: GroundReviewsModalProps) {
  const [reviews, setReviews] = useState<GroundReviewItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Helper to resolve player display name
  const getDisplayName = (review: any) => {
    const prof = Array.isArray(review?.profiles) ? review.profiles[0] : review?.profiles;
    return (
      review?.user_name ||
      prof?.display_name ||
      prof?.full_name ||
      prof?.name ||
      prof?.username ||
      (prof?.email ? prof.email.split('@')[0] : null) ||
      'Verified Player'
    );
  };

  const fetchGroundReviews = useCallback(async () => {
    if (!groundId || !isOpen) return;
    setLoading(true);

    try {
      // 1. Query reviews joined with profiles
      const { data, error } = await supabase
        .from('reviews')
        .select(`
          id,
          rating,
          comment,
          tags,
          created_at,
          user_id,
          user_name,
          profiles:user_id (
            display_name,
            full_name,
            email,
            avatar_url
          )
        `)
        .eq('ground_id', String(groundId))
        .order('created_at', { ascending: false });

      if (!error && data && data.length > 0) {
        const processed: GroundReviewItem[] = data.map((r: any) => ({
          id: r.id,
          rating: Number(r.rating || 5),
          comment: r.comment,
          tags: r.tags || [],
          created_at: r.created_at,
          user_id: r.user_id,
          user_name: r.user_name,
          profiles: r.profiles
        }));
        setReviews(processed);
        setLoading(false);
        return;
      }

      // 2. Fallback: Query reviews table directly, then query matching profiles
      const { data: rawReviews, error: rawErr } = await supabase
        .from('reviews')
        .select('*')
        .eq('ground_id', String(groundId))
        .order('created_at', { ascending: false });

      if (rawErr || !rawReviews || rawReviews.length === 0) {
        setReviews([]);
        setLoading(false);
        return;
      }

      const userIds = Array.from(new Set(rawReviews.map((r: any) => r.user_id).filter(Boolean)));
      let profileMap: Record<string, any> = {};

      if (userIds.length > 0) {
        const { data: profilesData } = await supabase
          .from('profiles')
          .select('id, name, display_name, full_name, username, email, avatar_url')
          .in('id', userIds);

        if (profilesData) {
          profilesData.forEach((p: any) => {
            profileMap[p.id] = p;
          });
        }
      }

      const mapped: GroundReviewItem[] = rawReviews.map((r: any) => ({
        id: r.id,
        rating: Number(r.rating || 5),
        comment: r.comment,
        tags: r.tags || [],
        created_at: r.created_at,
        user_id: r.user_id,
        user_name: r.user_name,
        profiles: profileMap[r.user_id]
      }));

      setReviews(mapped);
    } catch (err) {
      console.error('Error fetching ground reviews for modal:', err);
      setReviews([]);
    } finally {
      setLoading(false);
    }
  }, [groundId, isOpen]);

  useEffect(() => {
    if (isOpen) {
      fetchGroundReviews();
    }
  }, [isOpen, fetchGroundReviews]);

  if (!isOpen) return null;

  // Stats calculation
  const totalCount = reviews.length;
  const avgRating = totalCount > 0
    ? Math.round((reviews.reduce((acc, r) => acc + r.rating, 0) / totalCount) * 10) / 10
    : 5.0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl bg-[#0e1320] border border-gray-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 text-left max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-800/80 pb-4 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#0EA5E9] to-[#EC4899] p-0.5 flex items-center justify-center shadow-lg shadow-pink-500/10 shrink-0">
              <div className="w-full h-full bg-[#0e1320] rounded-[14px] flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-[#EC4899]" />
              </div>
            </div>
            <div>
              <h3 className="text-lg font-black text-white tracking-tight truncate max-w-[260px] sm:max-w-[320px]">
                {groundName}
              </h3>
              <div className="flex items-center gap-2 mt-0.5">
                <div className="flex items-center gap-1 bg-amber-400/10 border border-amber-400/20 px-2 py-0.5 rounded-lg text-amber-400 text-xs font-black">
                  <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                  <span>{totalCount > 0 ? avgRating.toFixed(1) : 'New'}</span>
                </div>
                <span className="text-xs text-gray-400 font-medium">
                  {totalCount} {totalCount === 1 ? 'Verified Review' : 'Verified Reviews'}
                </span>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl bg-gray-900 border border-gray-800 text-gray-400 hover:text-white hover:border-gray-700 transition shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Content Body */}
        <div className="flex-1 overflow-y-auto pr-1 space-y-4 no-scrollbar">
          {loading ? (
            <div className="text-center py-12 space-y-2">
              <Loader2 className="w-6 h-6 text-[#EC4899] animate-spin mx-auto" />
              <p className="text-xs text-gray-400 font-medium">Loading verified player reviews...</p>
            </div>
          ) : reviews.length === 0 ? (
            <div className="text-center py-12 px-4 bg-[#080c14] border border-dashed border-gray-800 rounded-2xl space-y-3">
              <MessageSquare className="w-8 h-8 text-[#EC4899] mx-auto opacity-70" />
              <h4 className="text-sm font-bold text-white">No reviews yet</h4>
              <p className="text-xs text-gray-400 max-w-sm mx-auto">
                Be the first verified player to review this ground! Complete a booking to leave a verified review.
              </p>
            </div>
          ) : (
            reviews.map((rev) => {
              const reviewerName = getDisplayName(rev);
              const profileObj = Array.isArray(rev.profiles) ? rev.profiles[0] : rev.profiles;
              const avatarUrl = profileObj?.avatar_url;
              const initial = reviewerName.trim().charAt(0).toUpperCase();

              return (
                <div
                  key={rev.id}
                  className="bg-[#080c14] border border-gray-800/80 rounded-2xl p-4 space-y-3 hover:border-gray-700 transition"
                >
                  {/* Reviewer Header */}
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      {avatarUrl ? (
                        <img
                          src={avatarUrl}
                          alt={reviewerName}
                          className="w-9 h-9 rounded-full object-cover border border-gray-800 shadow-md"
                        />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-pink-500 to-indigo-500 flex items-center justify-center font-bold text-white text-xs shadow-md shrink-0">
                          {initial}
                        </div>
                      )}
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-xs font-bold text-white">{reviewerName}</h4>
                          <span className="inline-flex items-center gap-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[9px] font-extrabold px-1.5 py-0.5 rounded-md">
                            <ShieldCheck className="w-2.5 h-2.5 text-emerald-400" /> Verified Booking
                          </span>
                        </div>
                        <span className="text-[10px] text-gray-500 font-mono">
                          {new Date(rev.created_at).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric'
                          })}
                        </span>
                      </div>
                    </div>

                    {/* Star Rating Badge */}
                    <div className="flex items-center gap-0.5 bg-amber-400/10 border border-amber-400/20 px-2 py-1 rounded-xl">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          className={`w-3 h-3 ${
                            star <= rev.rating
                              ? 'fill-amber-400 text-amber-400'
                              : 'text-gray-700 fill-gray-900/40'
                          }`}
                        />
                      ))}
                    </div>
                  </div>

                  {/* Highlight Tag Pills */}
                  {rev.tags && rev.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-0.5">
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

                  {/* Comment Text */}
                  {rev.comment && (
                    <p className="text-xs text-gray-300 leading-relaxed font-normal">
                      &quot;{rev.comment}&quot;
                    </p>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Modal Footer Close Button */}
        <div className="pt-2 border-t border-gray-800/80 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="w-full py-3 rounded-xl bg-gray-900 border border-gray-800 text-xs font-bold text-gray-300 hover:text-white hover:border-gray-700 transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}


