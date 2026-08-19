'use client';

import React, { useState } from 'react';
import { Star, X, Check, Loader2, Award, Sparkles } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';

interface ReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  groundId: string;
  groundTitle: string;
  bookingId?: string | null;
  currentUser?: { id?: string; name?: string; email?: string } | null;
  onReviewSubmitted?: () => void;
  onSuccess?: () => void;
  showToast?: (message: string) => void;
}

const AVAILABLE_TAGS = [
  '⚽ Great Turf',
  '💡 Good Lighting',
  '🚿 Clean Washrooms',
  '🤝 Friendly Staff',
  '🚗 Easy Parking',
  '🚰 Drinking Water',
  '🏆 Well Maintained',
  '🔊 Sound System'
];

const RATING_LABELS: Record<number, string> = {
  1: 'Poor - Needs Improvement',
  2: 'Fair - Below Expectations',
  3: 'Good - Satisfactory Experience',
  4: 'Very Good - Highly Recommended',
  5: 'Excellent! - Premium Turf Quality'
};

export default function ReviewModal({
  isOpen,
  onClose,
  groundId,
  groundTitle,
  bookingId,
  currentUser,
  onReviewSubmitted,
  onSuccess,
  showToast
}: ReviewModalProps) {
  const [rating, setRating] = useState<number>(5);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [selectedTags, setSelectedTags] = useState<string[]>(['⚽ Great Turf', '💡 Good Lighting']);
  const [comment, setComment] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const toggleTag = (tag: string) => {
    setSelectedTags(prev => 
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    );
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    setErrorMsg(null);

    if (!rating || Number(rating) < 1 || Number(rating) > 5) {
      setErrorMsg('Please select a star rating (1 to 5).');
      return;
    }

    if (!groundId) {
      setErrorMsg('Ground ID is required to submit a review.');
      return;
    }

    setSubmitting(true);

    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      const activeUser = user || currentUser;

      if (!activeUser?.id) {
        const noUserMsg = '🔒 Please sign in to submit a review!';
        setErrorMsg(noUserMsg);
        if (showToast) showToast(noUserMsg);
        setSubmitting(false);
        return;
      }

      // Resolve user's display name from profiles or user_metadata
      let resolvedName = '';

      if (activeUser.id) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('display_name, full_name, name, username')
          .eq('id', activeUser.id)
          .maybeSingle();

        if (profile) {
          resolvedName =
            profile.display_name ||
            profile.full_name ||
            profile.name ||
            profile.username ||
            '';
        }
      }

      if (!resolvedName) {
        resolvedName =
          user?.user_metadata?.display_name ||
          user?.user_metadata?.full_name ||
          user?.user_metadata?.name ||
          user?.user_metadata?.username ||
          (user?.email ? user.email.split('@')[0] : null) ||
          (currentUser as any)?.name ||
          (currentUser as any)?.email?.split('@')[0] ||
          'Player';
      }

      const { data, error } = await supabase
        .from('reviews')
        .insert({
          ground_id: groundId,
          user_id: activeUser.id,
          user_name: resolvedName,
          booking_id: bookingId || null,
          rating: Number(rating) || 5,
          comment: comment?.trim() || null,
          tags: Array.isArray(selectedTags) ? selectedTags : []
        });

      if (error) {
        const isUniqueError =
          error.code === '23505' ||
          String(error.code) === '23505' ||
          error.message?.includes('23505') ||
          error.details?.includes('23505') ||
          error.message?.toLowerCase().includes('unique constraint');

        if (isUniqueError) {
          const duplicateMsg = bookingId
            ? 'You have already reviewed this booking.'
            : 'You have already submitted a community review for this ground.';
          setErrorMsg(duplicateMsg);
          if (showToast) showToast(duplicateMsg);
          setSubmitting(false);
          return;
        }

        const errorMessage = error?.message || error?.details || 'Failed to submit review';
        console.error('Supabase review insert error details:', errorMessage);
        setErrorMsg(errorMessage);
        setSubmitting(false);
        return;
      }

      const successToast = bookingId
        ? '🌟 Verified review posted successfully!'
        : '🌟 Review posted successfully!';
      if (showToast) showToast(successToast);
      onReviewSubmitted?.();
      onSuccess?.();
      onClose?.();
    } catch (err: any) {
      const catchedErr = err?.message || err?.details || 'Failed to submit review';
      console.error('Unexpected review error details:', catchedErr);
      setErrorMsg(catchedErr);
    } finally {
      setSubmitting(false);
    }
  };

  const currentActiveRating = hoverRating || rating;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-[#0e1320] border border-gray-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 text-left">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-800/80 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#0EA5E9] to-[#EC4899] p-0.5 flex items-center justify-center shadow-lg shadow-pink-500/10">
              <div className="w-full h-full bg-[#0e1320] rounded-[14px] flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-[#EC4899]" />
              </div>
            </div>
            <div>
              <h3 className="text-lg font-black text-white tracking-tight">
                {bookingId ? 'Verified Player Review' : 'Community Review'}
              </h3>
              <p className="text-xs text-gray-400 font-medium truncate max-w-[240px]">{groundTitle}</p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl bg-gray-900 border border-gray-800 text-gray-400 hover:text-white hover:border-gray-700 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {errorMsg && (
          <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-400 text-xs font-semibold">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Interactive Star Rating Selector */}
          <div className="bg-[#080c14] border border-gray-800/80 rounded-2xl p-5 text-center space-y-3">
            <label className="text-xs font-extrabold text-gray-300 uppercase tracking-wider block">
              Overall Turf Rating
            </label>

            <div className="flex items-center justify-center gap-2 py-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                  className="p-1 hover:scale-125 transition-transform duration-150 focus:outline-none"
                >
                  <Star
                    className={`w-8 h-8 sm:w-9 sm:h-9 transition duration-150 ${
                      star <= currentActiveRating
                        ? 'fill-amber-400 text-amber-400 drop-shadow-[0_0_10px_rgba(251,191,36,0.5)]'
                        : 'text-gray-700 fill-gray-900/40'
                    }`}
                  />
                </button>
              ))}
            </div>

            <p className="text-xs font-bold text-[#EC4899] font-mono min-h-[18px]">
              {RATING_LABELS[currentActiveRating] || 'Click stars to rate'}
            </p>
          </div>

          {/* Quick Highlight Tags */}
          <div className="space-y-2">
            <label className="text-xs font-extrabold text-gray-300 uppercase tracking-wider block">
              Quick Highlights (Optional)
            </label>
            <div className="flex flex-wrap gap-2">
              {AVAILABLE_TAGS.map((tag) => {
                const isSelected = selectedTags.includes(tag);
                return (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => toggleTag(tag)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 border ${
                      isSelected
                        ? 'bg-gradient-to-r from-[#0EA5E9]/20 to-[#EC4899]/20 border-pink-500/50 text-white shadow-sm'
                        : 'bg-[#080c14] border-gray-800 text-gray-400 hover:border-gray-700 hover:text-gray-200'
                    }`}
                  >
                    {isSelected && <Check className="w-3 h-3 text-[#EC4899]" />}
                    {tag}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Feedback Text Area */}
          <div className="space-y-2">
            <label className="text-xs font-extrabold text-gray-300 uppercase tracking-wider flex items-center justify-between">
              <span>Detailed Review (Optional)</span>
              <span className="text-[10px] text-gray-500 font-mono">{comment.length}/300</span>
            </label>
            <textarea
              rows={3}
              maxLength={300}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Tell other players about pitch quality, lighting, parking, staff hospitality..."
              className="w-full bg-[#080c14] border border-gray-800 rounded-2xl p-3.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-pink-500/50 transition resize-none"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 px-4 rounded-xl bg-gray-900 border border-gray-800 text-xs font-bold text-gray-400 hover:text-white transition"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={submitting}
              className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-[#0EA5E9] to-[#EC4899] hover:from-[#0EA5E9]/90 hover:to-[#EC4899]/90 text-black font-extrabold text-xs transition shadow-lg shadow-pink-500/20 flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-black" />
                  Submitting...
                </>
              ) : (
                <>
                  <Award className="w-4 h-4" />
                  {bookingId ? 'Submit Verified Review' : 'Submit Review'}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
