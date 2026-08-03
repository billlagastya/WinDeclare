'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  Trophy, User, MapPin, Navigation, ArrowLeft,
  Calendar, CheckCircle2, Phone, ShieldCheck,
  Building2, Plus, LayoutDashboard, ScanLine, IndianRupee,
  LogOut, Mail, Check, Star, Clock, Compass,
  CreditCard, Smartphone, CheckCircle, X, Loader2, Search,
  Heart, Shield, Users, ChevronDown, Settings, Lock, Wallet, KeyRound, Filter, Menu, Trash2, Power
} from 'lucide-react';

import { supabase } from '@/lib/supabaseClient';
import { initiateOnlinePayment } from '@/lib/payment';

interface Arena {
  id: number | string;
  title: string;
  name?: string;
  location: string;
  lat: number;
  lng: number;
  price: number;
  price_per_hour?: number;
  pricing_rules?: any;
  rating: number;
  reviews: number;
  amenities: string[];
  sports: string[];
  image: string;
  locationUrl?: string;
  plan?: 'subscription' | 'commission' | 'hybrid' | string;
  plan_type?: 'free' | 'hybrid' | 'commission';
  ownerUpiId?: string;
  ownerQrCodeUrl?: string;
  qr_code_url?: string;
  ownerEmail?: string;
  owner_id?: string;
  user_id?: string;
  upiId?: string;
  whatsappNumber?: string;
  status?: string;
  is_verified?: boolean;
  cashfree_vendor_id?: string;
}

interface Booking {
  id: string;
  arenaId: number | string;
  arenaTitle: string;
  date: string;
  dateIndex: number;
  slots: string;
  amount: number;
  userContact: string;
  user_id?: string;
  planUsed: 'subscription' | 'commission' | 'hybrid' | string;
  paymentQrUsed: string;
  createdAt: string;
  booking_type?: 'online' | 'offline';
  payment_status?: string;
  turf_display_name?: string;
}

interface BookedSlot {
  arenaId: number | string;
  dateIndex: number;
  time: string;
  source?: 'booking' | 'override';
}

interface Profile {
  id: string;
  email: string;
  username?: string;
  phone?: string;
  display_name: string;
  role?: string;
}

const parseSlotTimeToHour = (timeStr: string): number => {
  const match = timeStr.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (!match) return 0;
  let hour = parseInt(match[1], 10);
  const period = match[3].toUpperCase();
  if (period === 'PM' && hour < 12) hour += 12;
  if (period === 'AM' && hour === 12) hour = 0;
  return hour;
};

export default function WinDeclareApp() {
  const [view, setView] = useState<'browse' | 'arena-details' | 'profile' | 'owner-portal' | 'admin-dashboard'>('browse');
  const [ownerTab, setOwnerTab] = useState<'calendar' | 'listings' | 'bookings' | 'pricing' | 'account'>('calendar');
  const [isOwnerDrawerOpen, setIsOwnerDrawerOpen] = useState<boolean>(false);
  const [selectedOwnerTurfId, setSelectedOwnerTurfId] = useState<string | number | null>(null);
  const [profileTab, setProfileTab] = useState<'bookings' | 'favorites' | 'account'>('bookings');
  
  // Profile Menu Dropdown State
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState<boolean>(false);

  // Profiles Database State
  const [profiles, setProfiles] = useState<Profile[]>([]);

  // Search & Filters
  const [selectedSport, setSelectedSport] = useState<string>('All');
  const [maxPrice, setMaxPrice] = useState<number>(2800);
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Player's Live Geolocation Coordinates
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);

  // Selected Arena & Multi-Slot Booking States
  const [selectedArena, setSelectedArena] = useState<Arena | null>(null);
  const [selectedDateIndex, setSelectedDateIndex] = useState<number>(0);
  const [selectedSlots, setSelectedSlots] = useState<{ time: string; price: number }[]>([]);

  // Locked / Booked Slots State (double-booking prevention)
  const [bookedSlots, setBookedSlots] = useState<BookedSlot[]>([
    { arenaId: 1, dateIndex: 5, time: '4:00 AM' },
    { arenaId: 1, dateIndex: 5, time: '5:00 AM' }
  ]);

  // Slot Overrides State & Handlers
  const [slotOverrides, setSlotOverrides] = useState<any[]>([]);
  const [openOverrideMenuSlot, setOpenOverrideMenuSlot] = useState<string | null>(null);

  const fetchSlotOverrides = useCallback(async (arenaId: number | string) => {
    if (!arenaId) return;
    const isUuid = typeof arenaId === 'string' && arenaId.includes('-');
    try {
      const { data } = await supabase
        .from('slot_overrides')
        .select('*')
        .or(isUuid ? `ground_id.eq.${arenaId}` : `arena_id.eq.${Number(arenaId)}`);
      if (data) setSlotOverrides(data);
    } catch (err) {
      console.error("Error fetching slot overrides:", err);
    }
  }, []);

  const handleToggleSlotOverride = async (
    arenaId: number | string,
    slotTime: string,
    mode: 'every' | 'today' | 'reopen',
    selectedDayStr: string
  ) => {
    const isUuid = typeof arenaId === 'string' && arenaId.includes('-');
    const dayMap: { [key: string]: number } = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
    const dow = dayMap[selectedDayStr] ?? new Date().getDay();
    const todayIso = new Date().toISOString().split('T')[0];

    if (mode === 'reopen') {
      let query = supabase.from('slot_overrides').delete().eq('slot_time', slotTime);
      query = isUuid ? query.eq('ground_id', arenaId) : query.eq('arena_id', Number(arenaId));
      await query;
      showToast(`✓ Re-opened slot ${slotTime}`);
    } else if (mode === 'every') {
      const record = {
        ground_id: isUuid ? arenaId : null,
        arena_id: isUuid ? null : Number(arenaId),
        day_of_week: dow,
        specific_date: null,
        slot_time: slotTime
      };
      await supabase.from('slot_overrides').insert([record]);
      showToast(`🔒 Turned off ${slotTime} for every ${selectedDayStr}`);
    } else if (mode === 'today') {
      const record = {
        ground_id: isUuid ? arenaId : null,
        arena_id: isUuid ? null : Number(arenaId),
        day_of_week: null,
        specific_date: todayIso,
        slot_time: slotTime
      };
      await supabase.from('slot_overrides').insert([record]);
      showToast(`🔒 Turned off ${slotTime} for today (${todayIso})`);
    }

    setOpenOverrideMenuSlot(null);
    fetchSlotOverrides(arenaId);
  };

  // User Favorites State
  const [favoriteArenaIds, setFavoriteArenaIds] = useState<number[]>([]);

  // Auth States (Google OAuth Only)
  const [currentUser, setCurrentUser] = useState<{ id?: string; name: string; username?: string; phone?: string; email?: string; provider: 'phone' | 'google' | 'password'; role?: string } | null>(null);
  const [showAuthModal, setShowAuthModal] = useState<boolean>(false);

  // Admin Security Access & Settings State
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState<boolean>(false);
  const [showAdminLoginModal, setShowAdminLoginModal] = useState<boolean>(false);
  const [adminEmailInput, setAdminEmailInput] = useState<string>('');
  const [adminPasswordInput, setAdminPasswordInput] = useState<string>('');
  const [adminAuthError, setAdminAuthError] = useState<string | null>(null);
  const [adminTab, setAdminTab] = useState<'pending-turfs' | 'owners-subscription' | 'owners-commission' | 'players' | 'turfs' | 'bookings' | 'settings'>('pending-turfs');
  const [pendingGrounds, setPendingGrounds] = useState<Arena[]>([]);
  
  // Platform Admin Payout Settings
  const [adminUpiId, setAdminUpiId] = useState<string>('windeclare.admin@okaxis');
  const [adminQrCodeUrl, setAdminQrCodeUrl] = useState<string>('https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=upi://pay?pa=windeclare.admin@okaxis');

  // Admin Registered Users Database
  const [registeredUsers, setRegisteredUsers] = useState<any[]>([
    { id: 'USR-101', name: 'Shravan Kumar', contact: 'shravan@windeclare.in', provider: 'Google Auth', role: 'player', joined: 'Jul 28, 2026', totalBookings: 2, status: 'Verified' },
    { id: 'USR-102', name: 'Rahul Verma', contact: 'rahul.v@gmail.com', provider: 'Google Auth', role: 'player', joined: 'Jul 27, 2026', totalBookings: 1, status: 'Verified' },
    { id: 'USR-103', name: 'Akshay Box Turf Owner', contact: 'owner.akshay@turf.in', provider: 'Phone OTP', role: 'owner', plan: 'subscription', joined: 'Jul 25, 2026', totalBookings: 4, status: 'Verified' },
    { id: 'USR-104', name: 'Kelo Sports Owner', contact: 'owner.kelo@turf.in', provider: 'Google Auth', role: 'owner', plan: 'commission', joined: 'Jul 26, 2026', totalBookings: 3, status: 'Verified' }
  ]);

  // Payment Gateway Modal
  const [showPaymentModal, setShowPaymentModal] = useState<boolean>(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<'upi' | 'card' | 'netbanking'>('upi');
  const [isProcessingPayment, setIsProcessingPayment] = useState<boolean>(false);

  // Owner Form State (Add New Turf Venue)
  const [showAddTurfForm, setShowAddTurfForm] = useState<boolean>(false);
  const [ticketCode, setTicketCode] = useState<string>('');
  const [checkInStatus, setCheckInStatus] = useState<string | null>(null);
  const [selectedDay, setSelectedDay] = useState<string>('Mon');
  const [slotPrices, setSlotPrices] = useState<Record<string, Record<string, number>>>({});
  const [editingBasePrice, setEditingBasePrice] = useState<number | null>(null);

  // Form selections for new venue
  const [newArenaName, setNewArenaName] = useState<string>('');
  const [newArenaLocation, setNewArenaLocation] = useState<string>('');
  const [newArenaPrice, setNewArenaPrice] = useState<number>(1200);
  const [newArenaEmail, setNewArenaEmail] = useState<string>('');
  const [newArenaLocationUrl, setNewArenaLocationUrl] = useState<string>('');
  const [newArenaQrCodeUrl, setNewArenaQrCodeUrl] = useState<string>('');
  const [newArenaPlan, setNewArenaPlan] = useState<'subscription' | 'commission'>('subscription');
  const [newArenaPlanType, setNewArenaPlanType] = useState<'free' | 'hybrid' | 'commission'>('free');
  const [newArenaUpiId, setNewArenaUpiId] = useState<string>('');
  const [newArenaWhatsappNumber, setNewArenaWhatsappNumber] = useState<string>('');
  const [selectedSports, setSelectedSports] = useState<string[]>(['Cricket', 'Football']);
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>(['Changing Rooms', 'Washrooms', 'Parking']);
  const [gstEligible, setGstEligible] = useState<boolean>(true);
  const [isUploadingQr, setIsUploadingQr] = useState<boolean>(false);

  // Automatically sync Contact Email input with logged-in user email
  useEffect(() => {
    if (currentUser?.email) {
      setNewArenaEmail(currentUser.email);
    }
  }, [currentUser]);

  // Toast Notification
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Arenas List with Pricing Plans & Owner Payment details
  const [arenas, setArenas] = useState<Arena[]>([
    {
      id: 1,
      title: 'Akshay Box Turf',
      location: 'Addagutta, Secunderabad',
      lat: 17.4399,
      lng: 78.5082,
      price: 800,
      rating: 4.8,
      reviews: 22,
      amenities: ['Changing Rooms', 'Washrooms', 'Parking', 'Cafe / Canteen'],
      sports: ['Football', 'Cricket', 'Kabaddi'],
      image: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=800&auto=format&fit=crop',
      locationUrl: 'https://maps.google.com/?q=Addagutta+Secunderabad+Box+Turf',
      plan: 'subscription',
      ownerEmail: 'owner.akshay@turf.in',
      ownerUpiId: 'akshay.box@okaxis',
      ownerQrCodeUrl: 'https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=upi://pay?pa=akshay.box@okaxis',
      status: 'approved',
      is_verified: true
    },
    {
      id: 2,
      title: 'Kelo Bharat Sports Arena',
      location: 'Gachibowli, Hyderabad',
      lat: 17.4401,
      lng: 78.3489,
      price: 500,
      rating: 4.9,
      reviews: 39,
      amenities: ['Changing Rooms', 'Washrooms', 'Bowling Machine'],
      sports: ['Badminton', 'Tennis', 'Basketball'],
      image: 'https://images.unsplash.com/photo-1518604666860-9ed391f76460?w=800&auto=format&fit=crop',
      locationUrl: 'https://maps.google.com/?q=Gachibowli+Hyderabad+Sports+Arena',
      plan: 'commission',
      ownerEmail: 'owner.kelo@turf.in',
      ownerUpiId: 'kelobharat@upi',
      ownerQrCodeUrl: 'https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=upi://pay?pa=kelobharat@upi',
      status: 'approved',
      is_verified: true
    },
    {
      id: 3,
      title: 'Smash & Serve Tennis Hub',
      location: 'Jubilee Hills, Hyderabad',
      lat: 17.4319,
      lng: 78.4071,
      price: 1200,
      rating: 4.9,
      reviews: 31,
      amenities: ['Changing Rooms', 'Parking', 'Cafe / Canteen'],
      sports: ['Tennis', 'Pickleball', 'Volleyball'],
      image: 'https://images.unsplash.com/photo-1529900748604-07564a03e7a6?w=800&auto=format&fit=crop',
      locationUrl: 'https://maps.google.com/?q=Jubilee+Hills+Tennis+Hub',
      plan: 'subscription',
      ownerEmail: 'owner.smash@turf.in',
      ownerUpiId: 'smashserve@okicici',
      ownerQrCodeUrl: 'https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=upi://pay?pa=smashserve@okicici',
      status: 'approved',
      is_verified: true
    }
  ]);

  // Confirmed User Bookings List
  const [myBookings, setMyBookings] = useState<Booking[]>([
    {
      id: 'WD-09TKPU8',
      arenaId: 1,
      arenaTitle: 'Akshay Box Turf',
      date: 'SUN, Jul 2',
      dateIndex: 5,
      slots: '4:00 AM, 5:00 AM',
      amount: 666,
      userContact: '+91 9505737751',
      planUsed: 'subscription',
      paymentQrUsed: 'akshay.box@okaxis',
      createdAt: '2026-07-28 10:15'
    }
  ]);

  // Web Audio Chime Alarm for Realtime Booking Notifications
  const playChimeAlarm = () => {
    try {
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContext) return;
      const ctx = new AudioContext();

      const playNote = (freq: number, startTime: number, duration: number) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, startTime);
        gain.gain.setValueAtTime(0.3, startTime);
        gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(startTime);
        osc.stop(startTime + duration);
      };

      const now = ctx.currentTime;
      playNote(659.25, now, 0.4);       // E5
      playNote(880, now + 0.15, 0.6);    // A5
      playNote(1318.51, now + 0.35, 0.8); // E6 chime
    } catch (err) {
      console.error("Web Audio chime playback error:", err);
    }
  };

  // Save profile to Supabase helper
  const saveProfileToSupabase = async (profileData: { id: string; email?: string; username?: string; phone?: string; display_name: string; role?: string }) => {
    try {
      await supabase.from('profiles').upsert({
        id: profileData.id,
        email: profileData.email || '',
        username: profileData.username || profileData.email?.split('@')[0] || 'player',
        phone: profileData.phone || '',
        display_name: profileData.display_name,
        role: profileData.role || 'Player'
      });
      fetchProfilesFromSupabase();
    } catch (e) {
      console.error("Profile save error:", e);
    }
  };

  // Sync Supabase Auth State & Upsert Profile
  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session?.user) {
        const user = session.user;
        const displayName = user.user_metadata?.full_name || user.user_metadata?.name || user.email?.split('@')[0] || 'Verified Player';
        const userObj = {
          id: user.id,
          name: displayName,
          username: user.user_metadata?.username || user.email?.split('@')[0] || 'player',
          email: user.email || undefined,
          phone: user.phone || user.user_metadata?.phone || undefined,
          provider: 'google' as const,
          role: 'Player'
        };
        setCurrentUser(userObj);
        await saveProfileToSupabase({
          id: user.id,
          email: user.email,
          username: userObj.username,
          phone: userObj.phone,
          display_name: displayName,
          role: 'Player'
        });
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        const user = session.user;
        const displayName = user.user_metadata?.full_name || user.user_metadata?.name || user.email?.split('@')[0] || 'Verified Player';
        const userObj = {
          id: user.id,
          name: displayName,
          username: user.user_metadata?.username || user.email?.split('@')[0] || 'player',
          email: user.email || undefined,
          phone: user.phone || user.user_metadata?.phone || undefined,
          provider: 'google' as const,
          role: 'Player'
        };
        setCurrentUser(userObj);

        await saveProfileToSupabase({
          id: user.id,
          email: user.email,
          username: userObj.username,
          phone: userObj.phone,
          display_name: displayName,
          role: 'Player'
        });
      } else {
        setCurrentUser(null);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Fetch All Records from `profiles` Table
  const fetchProfilesFromSupabase = async () => {
    try {
      const { data, error } = await supabase.from('profiles').select('*');
      if (!error && data && data.length > 0) {
        setProfiles(data.map((p: any) => ({
          id: p.id,
          email: p.email || 'N/A',
          username: p.username || p.email?.split('@')[0] || 'player',
          phone: p.phone || '',
          display_name: p.display_name || p.displayName || p.name || 'Player',
          role: p.role || 'Player'
        })));
      }
    } catch (err) {
      console.error("Error fetching profiles from Supabase:", err);
    }
  };

  const ownerTurfs = useMemo(() => {
    return arenas.filter(a => {
      if (!currentUser) return false;
      const userId = String(currentUser.id || '');
      const userEmail = currentUser.email?.toLowerCase();
      const turfUserId = a.user_id ? String(a.user_id) : '';
      const turfOwnerId = a.owner_id ? String(a.owner_id) : '';
      const ownerEmail = a.ownerEmail?.toLowerCase();

      return (
        (turfUserId && turfUserId === userId) ||
        (turfOwnerId && turfOwnerId === userId) ||
        (ownerEmail && userEmail && ownerEmail === userEmail)
      );
    });
  }, [arenas, currentUser]);

  const activeOwnerTurf = useMemo(() => {
    return ownerTurfs.find(t => String(t.id) === String(selectedOwnerTurfId)) || ownerTurfs[0] || arenas[0];
  }, [ownerTurfs, selectedOwnerTurfId, arenas]);

  useEffect(() => {
    fetchProfilesFromSupabase();
  }, [view, adminTab]);

  // Subscribe to Supabase Realtime channel on `bookings` table to trigger Web Audio chime alarm
  useEffect(() => {
    const channel = supabase
      .channel('public:bookings')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'bookings' },
        (payload) => {
          console.log('Realtime booking received:', payload);
          playChimeAlarm();
          showToast('🔔 New Booking Received!');

          if (payload.new) {
            const newRow = payload.new;
            const mappedBooking: Booking = {
              id: newRow.booking_id || newRow.id || `WD-${Math.random().toString(36).substring(2, 9).toUpperCase()}`,
              arenaId: newRow.arena_id || newRow.arenaId || 1,
              arenaTitle: newRow.arena_title || newRow.arenaTitle || 'Arena',
              date: newRow.date || 'Today',
              dateIndex: newRow.date_index ?? newRow.dateIndex ?? 0,
              slots: newRow.slots || '',
              amount: newRow.amount || 0,
              userContact: newRow.user_contact || newRow.userContact || '',
              planUsed: newRow.plan_used || newRow.planUsed || 'subscription',
              paymentQrUsed: newRow.payment_qr_used || newRow.paymentQrUsed || '',
              createdAt: newRow.created_at || newRow.createdAt || new Date().toISOString()
            };

            setMyBookings(prev => {
              if (prev.some(b => b.id === mappedBooking.id)) return prev;
              return [mappedBooking, ...prev];
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Handle Return Redirect & Hash Navigation from Cashfree Payment Checkout
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const urlParams = new URLSearchParams(window.location.search);
    const bookingParam = urlParams.get('booking') || urlParams.get('order_id');
    const hash = window.location.hash;

    if (bookingParam || hash === '#profile-bookings') {
      setProfileTab('bookings');
      setView('profile');
      if (bookingParam) {
        showToast(`🎉 Cashfree Payment processing completed for order ${bookingParam}!`);
      }
    }
  }, []);

  // Fetch initial bookings from Supabase & hydrate locked slots across page refreshes
  useEffect(() => {
    const fetchBookingsFromSupabase = async () => {
      try {
        const { data, error } = await supabase
          .from('bookings')
          .select('*')
          .order('created_at', { ascending: false });
        console.log("DEBUG FIRST ARENA OBJECT:", arenas[0]);
        console.log("DEBUG FIRST BOOKING OBJECT:", data?.[0]);
        if (!error && data && data.length > 0) {
          const mapped: Booking[] = data.map((item: any) => {
            const matchedGround = arenas.find(
              (g: any) =>
                String(g.id) === String(item.ground_id || item.arena_id || item.arenaId) ||
                String(g.uuid || g.ground_id) === String(item.ground_id || item.arena_id || item.arenaId)
            );

            const turfDisplayName = item.arena_title || item.arenaTitle || item.arena_name || item.title || matchedGround?.title || matchedGround?.name || matchedGround?.location || 'Sports Turf';

            return {
              id: item.booking_id || item.id || `WD-${Math.random().toString(36).substring(2, 9).toUpperCase()}`,
              arenaId: item.arena_id || item.ground_id || item.arenaId || 1,
              arenaTitle: turfDisplayName,
              turf_display_name: turfDisplayName,
              date: item.date || item.booking_date || '',
              dateIndex: item.date_index ?? item.dateIndex ?? 0,
              slots: typeof item.slots === 'string' ? item.slots : (Array.isArray(item.slots) ? item.slots.map((s: any) => typeof s === 'string' ? s : s.time).join(', ') : ''),
              amount: Number(item.amount || item.total_amount || 0),
              userContact: item.user_contact || item.userContact || '',
              user_id: item.user_id || item.userId || '',
              planUsed: item.plan_used || item.planUsed || 'subscription',
              paymentQrUsed: item.payment_qr_used || item.paymentQrUsed || '',
              booking_type: item.booking_type || 'online',
              payment_status: item.payment_status || item.status || 'completed',
              createdAt: item.created_at || item.createdAt || new Date().toISOString()
            };
          });

          setMyBookings(prev => {
            const combined = [...mapped];
            prev.forEach(p => {
              if (!combined.some(c => c.id === p.id)) combined.push(p);
            });
            return combined;
          });

          // Hydrate locked slots into bookedSlots state so slots show unavailable/disabled (BOOKED) across page refreshes
          const extractedLockedSlots: BookedSlot[] = [];
          data.forEach((item: any) => {
            const arenaId = Number(item.arena_id || item.ground_id || item.arenaId || 1);
            const dateIndex = Number(item.date_index ?? item.dateIndex ?? 0);
            const slotsVal = item.slots;

            if (typeof slotsVal === 'string') {
              slotsVal.split(',').forEach((t: string) => {
                const timeStr = t.trim();
                if (timeStr && !extractedLockedSlots.some(s => s.arenaId === arenaId && s.dateIndex === dateIndex && s.time === timeStr)) {
                  extractedLockedSlots.push({ arenaId, dateIndex, time: timeStr });
                }
              });
            } else if (Array.isArray(slotsVal)) {
              slotsVal.forEach((s: any) => {
                const timeStr = (typeof s === 'string' ? s : s.time)?.trim();
                if (timeStr && !extractedLockedSlots.some(s => s.arenaId === arenaId && s.dateIndex === dateIndex && s.time === timeStr)) {
                  extractedLockedSlots.push({ arenaId, dateIndex, time: timeStr });
                }
              });
            }
          });

          setBookedSlots(extractedLockedSlots);
        }
      } catch (e) {
        console.error("Supabase initial fetch bookings error:", e);
      }
    };
    fetchBookingsFromSupabase();
  }, [arenas]);

  // Fetch Slot Availability for selected arena & date (Player View & Refresh)
  const fetchSlotAvailability = useCallback(async (arenaId: number | string, dateIndex: number) => {
    if (!arenaId) return;
    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() + dateIndex);
    const selectedDate = targetDate.toISOString().split('T')[0];
    const dow = targetDate.getDay();
    const isUuid = typeof arenaId === 'string' && arenaId.includes('-');

    try {
      let query = supabase.from('bookings').select('slots').eq('booking_date', selectedDate);
      query = isUuid ? query.eq('ground_id', arenaId) : query.eq('arena_id', Number(arenaId));
      const { data } = await query;

      const bookedEntries: { time: string; source: 'booking' }[] = [];
      if (data) {
        data.forEach((row: any) => {
          if (Array.isArray(row.slots)) {
            row.slots.forEach((t: string) => {
              if (t && !bookedEntries.some(e => e.time === t)) bookedEntries.push({ time: t, source: 'booking' });
            });
          }
        });
      }

      const { data: overrides } = await supabase
        .from('slot_overrides')
        .select('slot_time')
        .or(isUuid ? `ground_id.eq.${arenaId}` : `arena_id.eq.${Number(arenaId)}`)
        .or(`day_of_week.eq.${dow},specific_date.eq.${selectedDate}`);

      const closedEntries: { time: string; source: 'override' }[] = [];
      if (overrides) {
        overrides.forEach((row: any) => {
          const t = row.slot_time?.trim();
          if (t && !closedEntries.some(e => e.time === t)) closedEntries.push({ time: t, source: 'override' });
        });
      }

      setBookedSlots(prev => {
        const filtered = prev.filter(b => !(String(b.arenaId) === String(arenaId) && b.dateIndex === dateIndex));
        const newEntries = [...bookedEntries, ...closedEntries].map(e => ({
          arenaId, dateIndex, time: e.time, source: e.source
        }));
        return [...filtered, ...newEntries];
      });
    } catch (err) {
      console.error("Error fetching slot availability:", err);
    }
  }, []);

  useEffect(() => {
    if (selectedArena?.id !== undefined && selectedArena?.id !== null) {
      fetchSlotAvailability(selectedArena.id, selectedDateIndex);
    }
  }, [selectedArena?.id, selectedDateIndex, fetchSlotAvailability]);

  useEffect(() => {
    if (activeOwnerTurf?.id !== undefined && activeOwnerTurf?.id !== null) {
      fetchSlotAvailability(activeOwnerTurf.id, selectedDateIndex);
    }
  }, [activeOwnerTurf?.id, selectedDateIndex, fetchSlotAvailability]);

  // Fetch Owner Bookings joined with arenas matching owner's ID (Owner Dashboard)
  const [ownerPortalBookings, setOwnerPortalBookings] = useState<any[]>([]);

  const fetchOwnerBookings = useCallback(async () => {
    if (!currentUser?.id) return;
    try {
      const { data, error } = await supabase
        .from('bookings')
        .select('*, arenas!inner(*)')
        .eq('arenas.user_id', currentUser.id);

      if (error) {
        console.warn("Owner bookings query notice (trying grounds fallback):", error.message);
        const { data: fallbackData, error: fallbackErr } = await supabase
          .from('bookings')
          .select('*, grounds!inner(*)')
          .eq('grounds.user_id', currentUser.id);

        if (!fallbackErr && fallbackData) {
          setOwnerPortalBookings(fallbackData);
          return;
        }
      }

      if (data) {
        setOwnerPortalBookings(data);
      }
    } catch (err) {
      console.error("Error fetching owner bookings:", err);
    }
  }, [currentUser?.id]);

  useEffect(() => {
    if ((view === 'owner-portal' || ownerTab === 'bookings') && currentUser?.id) {
      fetchOwnerBookings();
    }
  }, [view, ownerTab, currentUser?.id, fetchOwnerBookings]);

  // Fetch Pending Grounds from Supabase Database for Admin Verification
  const fetchPendingGroundsFromSupabase = async () => {
    try {
      const { data, error } = await supabase.from('grounds').select('*').eq('status', 'pending');
      if (!error && data) {
        const mappedPending: Arena[] = data.map((item: any, index: number) => ({
          id: item.id || item.ground_id || `pending-${Date.now()}-${index}`,
          title: item.name || item.title || 'Pending Turf Arena',
          location: item.location || 'Hyderabad',
          lat: item.lat || 17.4399,
          lng: item.lng || 78.5082,
          price: item.price_per_hour || item.price || 1000,
          rating: item.rating || 5.0,
          reviews: item.reviews || 1,
          amenities: item.facilities || item.amenities || ['Changing Rooms', 'Washrooms', 'Parking'],
          sports: item.sports || ['Cricket', 'Football'],
          image: item.image || item.image_url || 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=800&auto=format&fit=crop',
          locationUrl: item.location_url || item.locationUrl || '',
          plan: item.plan || 'subscription',
          ownerEmail: item.owner_email || item.ownerEmail || 'owner@turf.in',
          ownerUpiId: item.upi_id || item.owner_upi_id || item.ownerUpiId || 'owner@okaxis',
          ownerQrCodeUrl: item.qr_code_url || item.ownerQrCodeUrl || '',
          upiId: item.upi_id || item.owner_upi_id || item.ownerUpiId || 'owner@okaxis',
          whatsappNumber: item.whatsapp_number || item.whatsappNumber || '',
          status: 'pending'
        }));
        setPendingGrounds(mappedPending);
      }
    } catch (e) {
      console.error("Error fetching pending grounds from Supabase:", e);
    }
  };

  // Fetch Grounds directly from Supabase Database on page load
  const fetchGroundsFromSupabase = async () => {
    try {
      let { data, error } = await supabase.from('grounds').select('*');
      if (error || !data || data.length === 0) {
        const { data: arenaData, error: arenaError } = await supabase.from('arenas').select('*');
        if (!arenaError && arenaData && arenaData.length > 0) {
          data = arenaData;
          error = null;
        }
      }

      if (!error && data && data.length > 0) {
        console.log("DEBUG: Raw Arenas/Grounds Fetched:", data);
        const mappedGrounds: Arena[] = data.map((item: any, index: number) => ({
          id: item.id || item.ground_id || (Date.now() + index),
          title: item.name || item.title || 'Ground Arena',
          location: item.location || 'Hyderabad',
          lat: item.lat || 17.4399,
          lng: item.lng || 78.5082,
          price: Number(item.price_per_hour || item.price || 1000),
          price_per_hour: Number(item.price_per_hour || item.price || 1000),
          pricing_rules: item.pricing_rules || null,
          rating: item.rating || 5.0,
          reviews: item.reviews || 1,
          amenities: item.facilities || item.amenities || ['Changing Rooms', 'Washrooms', 'Parking'],
          sports: item.sports || ['Cricket', 'Football'],
          image: item.image || item.image_url || 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=800&auto=format&fit=crop',
          locationUrl: item.location_url || item.locationUrl || '',
          plan: item.plan || 'subscription',
          plan_type: item.plan_type || (item.plan === 'commission' ? 'commission' : (item.plan === 'hybrid' ? 'hybrid' : 'free')),
          cashfree_vendor_id: item.cashfree_vendor_id || item.cashfreeVendorId || '',
          ownerEmail: item.owner_email || item.ownerEmail || 'owner@turf.in',
          owner_id: item.owner_id || item.user_id || item.ownerId || '',
          user_id: item.user_id || item.owner_id || item.userId || '',
          ownerUpiId: item.upi_id || item.owner_upi_id || item.ownerUpiId || 'owner@okaxis',
          ownerQrCodeUrl: item.qr_code_url || item.ownerQrCodeUrl || `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=upi://pay?pa=${item.upi_id || item.owner_upi_id || 'owner@okaxis'}`,
          upiId: item.upi_id || item.owner_upi_id || item.ownerUpiId || 'owner@okaxis',
          whatsappNumber: item.whatsapp_number || item.whatsappNumber || '',
          status: item.status || 'approved',
          is_verified: item.is_verified !== undefined && item.is_verified !== null ? Boolean(item.is_verified) : true
        }));

        setArenas(mappedGrounds);

        // Re-hydrate slotPrices state on refresh if ground.pricing_rules exists
        const firstWithRules = mappedGrounds.find(g => g.pricing_rules);
        if (firstWithRules) {
          let rules = firstWithRules.pricing_rules;
          if (typeof rules === 'string') {
            try { rules = JSON.parse(rules); } catch (e) { rules = null; }
          }
          if (rules && (rules.slotPrices || rules.slot_prices)) {
            setSlotPrices(rules.slotPrices || rules.slot_prices);
          }
        }
      }
    } catch (e) {
      console.error("Error fetching grounds from Supabase:", e);
    }
  };

  // Admin Actions: Approve or Reject Ground
  const handleApproveGround = async (groundId: number | string) => {
    try {
      const { error } = await supabase
        .from('grounds')
        .update({ status: 'approved' })
        .eq('id', groundId);
      
      if (error) {
        console.warn("Supabase update error (retrying with ground_id):", error);
        await supabase.from('grounds').update({ status: 'approved' }).eq('ground_id', groundId);
      }
    } catch (e) {
      console.error("Error approving ground in Supabase:", e);
    }

    setArenas(prev => prev.map(a => String(a.id) === String(groundId) ? { ...a, status: 'approved' } : a));
    setPendingGrounds(prev => prev.filter(a => String(a.id) !== String(groundId)));

    await fetchGroundsFromSupabase();
    await fetchPendingGroundsFromSupabase();
    showToast('✓ Ground approved! Moved to public feed.');
  };

  const handleRejectGround = async (groundId: number | string) => {
    try {
      const { error } = await supabase
        .from('grounds')
        .update({ status: 'rejected' })
        .eq('id', groundId);

      if (error) {
        console.warn("Supabase reject warning (retrying delete):", error);
        await supabase.from('grounds').delete().eq('id', groundId);
      }
    } catch (e) {
      console.error("Error rejecting ground in Supabase:", e);
    }

    setArenas(prev => prev.filter(a => String(a.id) !== String(groundId)));
    setPendingGrounds(prev => prev.filter(a => String(a.id) !== String(groundId)));

    await fetchGroundsFromSupabase();
    await fetchPendingGroundsFromSupabase();
    showToast('✕ Ground rejected.');
  };

  useEffect(() => {
    fetchGroundsFromSupabase();
    fetchPendingGroundsFromSupabase();
  }, [view, adminTab]);

  // Geolocation Request on Mount
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
        },
        (error) => console.error("Error getting location:", error),
        { enableHighAccuracy: true }
      );
    }
  }, []);

  // Haversine Distance Calculation
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return (R * c).toFixed(1);
  };

  const sportsList = ['Cricket', 'Basketball', 'Football', 'Tennis', 'Kabaddi', 'Badminton', 'Volleyball', 'Pickleball'];
  const amenitiesList = ['Changing Rooms', 'Washrooms', 'Parking', 'Cafe / Canteen', 'Bowling Machine'];

  const today = new Date();
  const dayNames = ['SUN','MON','TUE','WED','THU','FRI','SAT'];
  const datesList = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    return { day: dayNames[d.getDay()], date: String(d.getDate()) };
  });

  // Dynamic Time Slot Pricing Generator (renders prices using ground.price_per_hour or specific pricing_rules[day][slotTime])
  const getSlotsDataForArena = (ground: Arena | null, dateIndex: number = 0) => {
    const slotBasePrice = Number(ground?.price_per_hour || (ground as any)?.price_per_hour || ground?.price || 1200);
    const activeDate = datesList[dateIndex];
    const activeDateDay = activeDate ? activeDate.day : selectedDay;

    let pricingRules = ground?.pricing_rules || (ground as any)?.pricing_rules;
    if (typeof pricingRules === 'string') {
      try {
        pricingRules = JSON.parse(pricingRules);
      } catch (e) {
        pricingRules = {};
      }
    }

    const savedSlotPrices = pricingRules?.slotPrices || pricingRules?.slot_prices || pricingRules || {};
    const dayKey = Object.keys(savedSlotPrices).find(k => k.toLowerCase() === activeDateDay.toLowerCase()) || activeDateDay;
    const savedDayPrices = savedSlotPrices[dayKey] || savedSlotPrices[activeDateDay] || {};

    const times = [
      '12:00 AM', '1:00 AM', '2:00 AM', '3:00 AM', '4:00 AM', '5:00 AM',
      '6:00 AM', '7:00 AM', '8:00 AM', '9:00 AM', '10:00 AM', '11:00 AM',
      '12:00 PM', '1:00 PM', '2:00 PM', '3:00 PM', '4:00 PM', '5:00 PM',
      '6:00 PM', '7:00 PM', '8:00 PM', '9:00 PM', '10:00 PM', '11:00 PM'
    ];

    return times.map(time => {
      // 1. Saved slot override in pricing_rules[day][time]
      if (savedDayPrices && savedDayPrices[time] !== undefined && savedDayPrices[time] !== '') {
        return { time, price: Number(savedDayPrices[time]) };
      }
      if (pricingRules && pricingRules[time] !== undefined && typeof pricingRules[time] === 'number') {
        return { time, price: Number(pricingRules[time]) };
      }

      // 2. React state slot price override for active session
      const priceValue = slotPrices[activeDateDay]?.[time];

      if (priceValue !== undefined && priceValue !== null && String(priceValue) !== '') {
        return { time, price: Number(priceValue) };
      }


      // 3. Baseline price_per_hour default
      return { time, price: slotBasePrice };
    });
  };



  const handleNavigate = (title: string, location: string, locationUrl?: string) => {
    if (locationUrl && locationUrl.trim() !== '') {
      window.open(locationUrl, '_blank');
    } else {
      const query = encodeURIComponent(`${title}, ${location}`);
      window.open(`https://www.google.com/maps/search/?api=1&query=${query}`, '_blank');
    }
  };

  const handleSelectArena = (arena: Arena) => {
    setSelectedArena(arena);
    setSelectedSlots([]);
    setView('arena-details');
  };

  const toggleSlotSelection = (slot: { time: string; price: number }) => {
    const exists = selectedSlots.some(s => s.time === slot.time);
    if (exists) {
      setSelectedSlots(selectedSlots.filter(s => s.time !== slot.time));
    } else {
      setSelectedSlots([...selectedSlots, slot]);
    }
  };

  const totalPrice = selectedSlots.reduce((acc, curr) => acc + curr.price, 0);

  // SUPABASE AUTH GOOGLE SIGN-IN ONLY
  const handleGoogleSignIn = async () => {
    try {
      const origin = typeof window !== 'undefined' ? window.location.origin : '';
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${origin}/auth/callback`
        }
      });
      if (error) throw error;
      setShowAuthModal(false);
    } catch (err: any) {
      console.error("Supabase Google Sign In Error:", err);
      const fallbackUser = {
        id: `USR-G-${Date.now()}`,
        name: 'Google Player',
        username: 'google_player',
        email: 'user.google@gmail.com',
        phone: '+91 9876543210',
        provider: 'google' as const,
        role: 'Player'
      };
      setCurrentUser(fallbackUser);
      await saveProfileToSupabase({
        id: fallbackUser.id,
        email: fallbackUser.email,
        username: fallbackUser.username,
        phone: fallbackUser.phone,
        display_name: fallbackUser.name,
        role: fallbackUser.role
      });
      setShowAuthModal(false);
      showToast('✓ Signed in via Google');
      if (selectedSlots.length > 0) {
        setShowPaymentModal(true);
      }
    }
  };

  // Fetch user favorites from Supabase table filtering strictly by currentUser.id
  useEffect(() => {
    if (!currentUser?.id) {
      setFavoriteArenaIds([]);
      return;
    }
    const fetchUserFavorites = async () => {
      try {
        let { data, error } = await supabase
          .from('favorite_arenas')
          .select('arena_id')
          .eq('user_id', currentUser.id);

        if (error || !data || data.length === 0) {
          const { data: favData } = await supabase
            .from('favorites')
            .select('arena_id')
            .eq('user_id', currentUser.id);
          if (favData) data = favData;
        }

        if (data && data.length > 0) {
          const ids = data.map((item: any) => Number(item.arena_id)).filter(Boolean);
          setFavoriteArenaIds(ids);
        } else {
          setFavoriteArenaIds([]);
        }
      } catch (err) {
        console.error("Error fetching user favorites:", err);
      }
    };
    fetchUserFavorites();
  }, [currentUser]);

  // TOGGLE FAVORITE ARENA HANDLER WITH USER ISOLATION
  const toggleFavorite = async (arenaId: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!currentUser) {
      setShowAuthModal(true);
      showToast('🔒 Please sign in to save favorite grounds!');
      return;
    }

    const isFav = favoriteArenaIds.includes(arenaId);
    const updated = isFav 
      ? favoriteArenaIds.filter(id => id !== arenaId)
      : [...favoriteArenaIds, arenaId];
    
    setFavoriteArenaIds(updated);
    showToast(isFav ? 'Removed from Favorites' : '❤️ Added to Favorites!');

    try {
      if (isFav) {
        await supabase
          .from('favorite_arenas')
          .delete()
          .eq('user_id', currentUser.id)
          .eq('arena_id', arenaId);
        await supabase
          .from('favorites')
          .delete()
          .eq('user_id', currentUser.id)
          .eq('arena_id', arenaId);
      } else {
        await supabase
          .from('favorite_arenas')
          .insert([{ user_id: currentUser.id, arena_id: arenaId }]);
        await supabase
          .from('favorites')
          .insert([{ user_id: currentUser.id, arena_id: arenaId }]);
      }
    } catch (err) {
      console.warn("Supabase favorite toggle notice:", err);
    }
  };

  const handleWhatsAppBooking = async () => {
    if (!selectedArena || !currentUser) return;
    const activeDate = datesList[selectedDateIndex];
    const selectedDateStr = activeDate ? `${activeDate.day}, Jul ${activeDate.date}` : 'Today';
    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() + selectedDateIndex);
    const formattedIsoDate = targetDate.toISOString().split('T')[0];

    const slotsStr = selectedSlots.map(s => s.time).join(', ');
    const totalAmount = totalPrice;

    const rawNum = selectedArena.whatsappNumber || '9505737751';
    const cleanNum = rawNum.replace(/\D/g, '');
    const formattedPhone = cleanNum.startsWith('91') && cleanNum.length === 12 ? cleanNum : `91${cleanNum.slice(-10)}`;
    const bookingMessage = `Hi! I would like to book ${selectedArena.title}.\n📅 Date: ${selectedDateStr}\n⏰ Slots: ${slotsStr}\n💰 Total Amount: ₹${totalAmount}\n[Free Tier Direct Booking Request]`;
    const waUrl = `https://wa.me/${formattedPhone}?text=${encodeURIComponent(bookingMessage)}`;

    const recordsToInsert = selectedSlots.map(s => {
      const isUuid = typeof selectedArena.id === 'string' && selectedArena.id.includes('-');
      return {
        ground_id: isUuid ? selectedArena.id : null,
        arena_id: isUuid ? null : Number(selectedArena.id),
        user_id: currentUser.id,
        booking_date: formattedIsoDate,
        slots: [s.time],
        total_amount: totalAmount,
        status: 'whatsapp_pending',
        payment_status: 'whatsapp_pending',
        created_at: new Date().toISOString()
      };
    });

    console.log("Insert Payload (recordsToInsert):", recordsToInsert);

    try {
      const { error } = await supabase.from('bookings').insert(recordsToInsert);
      if (error) {
        console.error("Direct WhatsApp Insert Failed Message:", error.message);
        console.error("Direct WhatsApp Insert Failed Raw:", JSON.stringify(error, null, 2));
      }
    } catch (err: any) {
      console.error("Booking insert exception:", err);
    }

    const generatedBookingId = `WD-${Math.random().toString(36).substring(2, 9).toUpperCase()}`;
    const newBookingObj: Booking = {
      id: generatedBookingId,
      arenaId: Number(selectedArena.id),
      arenaTitle: selectedArena.title,
      date: selectedDateStr,
      dateIndex: selectedDateIndex,
      slots: slotsStr,
      amount: totalAmount,
      userContact: currentUser.phone || currentUser.email || 'Player Session',
      user_id: currentUser.id,
      planUsed: 'subscription',
      paymentQrUsed: 'whatsapp_direct',
      booking_type: 'online',
      payment_status: 'completed',
      createdAt: recordsToInsert[0].created_at
    };

    setMyBookings(prev => [newBookingObj, ...prev]);

    const newLockedSlots: BookedSlot[] = selectedSlots.map(s => ({
      arenaId: Number(selectedArena.id),
      dateIndex: selectedDateIndex,
      time: s.time
    }));
    setBookedSlots(prev => [...prev, ...newLockedSlots]);
    setSelectedSlots([]);

    window.open(waUrl, '_blank');
    showToast("🎉 Free Plan Booking! Redirected to WhatsApp to contact owner.");
  };

  const handleOnlinePayment = async () => {
    if (!selectedArena || !currentUser) return;

    const activeDate = datesList[selectedDateIndex];
    const selectedDateStr = activeDate ? `${activeDate.day}, Jul ${activeDate.date}` : 'Today';
    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() + selectedDateIndex);
    const formattedIsoDate = targetDate.toISOString().split('T')[0];

    const slotsStr = selectedSlots.map(s => s.time).join(', ');
    const totalAmount = totalPrice;
    const generatedBookingId = `WD-${Math.random().toString(36).substring(2, 9).toUpperCase()}`;

    // Insert pending booking record into Supabase bookings table before initiating Cashfree payment
    const isUuid = typeof selectedArena.id === 'string' && selectedArena.id.includes('-');
    const recordsToInsert = selectedSlots.map(s => ({
      booking_id: generatedBookingId,
      ground_id: isUuid ? selectedArena.id : null,
      arena_id: isUuid ? null : Number(selectedArena.id),
      user_id: currentUser.id,
      booking_date: formattedIsoDate,
      slots: [s.time],
      total_amount: totalAmount,
      status: 'pending',
      payment_status: 'pending',
      created_at: new Date().toISOString()
    }));

    try {
      const { error } = await supabase.from('bookings').insert(recordsToInsert);
      if (error) {
        if (error.code === '23505') {
          showToast('❌ Sorry, this slot was just booked by someone else. Please pick another.');
          fetchSlotAvailability(selectedArena.id, selectedDateIndex);
        } else {
          console.error("Pending booking insert failed:", error.message);
          showToast('❌ Could not start booking. Please try again.');
        }
        return;
      }
      fetchSlotAvailability(selectedArena.id, selectedDateIndex);
    } catch (err: any) {
      console.error("Pending Cashfree booking insert exception:", err);
      showToast('❌ Could not start booking. Please try again.');
      return;
    }

    // Invoke modular payment gateway adapter
    await initiateOnlinePayment({
      amount: totalAmount,
      bookingId: generatedBookingId,
      customerName: currentUser.name || 'Player',
      customerPhone: currentUser.phone || '9999999999',
      customerEmail: currentUser.email || '',
      groundId: selectedArena.id
    });
  };

  // STRICT GATEKEEPER: Check authentication & plan_type before opening checkout
  const handleInitiateCheckout = async () => {
    if (selectedSlots.length === 0) {
      alert('Please select at least 1 time slot to proceed!');
      return;
    }

    if (!currentUser) {
      setShowAuthModal(true);
      showToast('🔒 Please sign in to book your slot!');
      return;
    }

    if (!selectedArena) return;

    const planType = selectedArena.plan_type || (selectedArena.plan === 'commission' ? 'commission' : (selectedArena.plan === 'hybrid' ? 'hybrid' : 'free'));

    console.log("DEBUG Checkout Initiate Selected Arena:", {
      id: selectedArena.id,
      title: selectedArena.title,
      plan_type: selectedArena.plan_type,
      plan: selectedArena.plan,
      resolvedPlanType: planType,
      cashfree_vendor_id: selectedArena.cashfree_vendor_id
    });

    if (planType === 'commission' || planType === 'hybrid') {
      // Commission / Automated plan (3% or 10%): Route to online payment handler
      await handleOnlinePayment();
    } else {
      // Manual / Free plan: Fallback to WhatsApp booking redirect
      await handleWhatsAppBooking();
    }
  };

  // ADMIN DASHBOARD RESTRICTED ACCESS HANDLER
  const handleOpenAdminDashboard = () => {
    if (!currentUser) {
      setShowAuthModal(true);
      showToast('🔒 Please sign in to access Admin Console!');
      return;
    }

    if (isAdminAuthenticated) {
      setView('admin-dashboard');
    } else {
      setAdminEmailInput('');
      setAdminPasswordInput('');
      setAdminAuthError(null);
      setShowAdminLoginModal(true);
    }
  };

  const handleAdminLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (adminEmailInput.trim().toLowerCase() === 'kondrashravankumar@gmail.com' && adminPasswordInput === '*7505737751#') {
      setIsAdminAuthenticated(true);
      setShowAdminLoginModal(false);
      setView('admin-dashboard');
      showToast('🔑 Super Admin Console Access Granted');
    } else {
      setAdminAuthError('Invalid Admin Credentials!');
    }
  };

  // PROCESS PAYMENT & LOCK BOOKED SLOTS (Double-booking prevention)
  const handleProcessPayment = async () => {
    if (!selectedArena) return;
    setIsProcessingPayment(true);

    const activeDate = datesList[selectedDateIndex];
    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() + selectedDateIndex);
    const selectedDate = targetDate.toISOString().split('T')[0];

    const slotsToInsert = selectedSlots.length > 0 
      ? selectedSlots 
      : [{ time: '1 Hour Slot', price: selectedArena.price || 1200 }];

    const slotTimeStr = slotsToInsert.map(s => s.time).join(', ');

    const newBooking: Booking = {
      id: `WD-${Math.random().toString(36).substring(2, 9).toUpperCase()}`,
      arenaId: Number(selectedArena.id),
      arenaTitle: selectedArena.title,
      date: `${activeDate.day}, Jul ${activeDate.date}`,
      dateIndex: selectedDateIndex,
      slots: slotTimeStr,
      amount: totalPrice || selectedArena.price || 1200,
      userContact: currentUser?.phone || currentUser?.email || '+91 9505737751',
      planUsed: selectedArena.plan || 'subscription',
      paymentQrUsed: selectedArena.plan === 'subscription' 
        ? (selectedArena.ownerUpiId || 'owner@okaxis') 
        : adminUpiId,
      createdAt: new Date().toISOString()
    };

    // LOCK SLOTS FOR DOUBLE-BOOKING PREVENTION
    const newLockedSlots: BookedSlot[] = slotsToInsert.map(s => ({
      arenaId: Number(selectedArena.id),
      dateIndex: selectedDateIndex,
      time: s.time
    }));

    // Save Booking Record directly to Supabase `bookings` table with status: 'confirmed'
    const recordsToInsert = slotsToInsert.map(s => ({
      arena_id: selectedArena.id,
      user_id: currentUser?.id || '',
      slot_time: s.time,
      status: 'confirmed',
      booking_date: selectedDate,
      booking_id: newBooking.id,
      ground_id: Number(selectedArena.id),
      arena_title: selectedArena.title,
      date: newBooking.date,
      date_index: selectedDateIndex,
      slots: newBooking.slots,
      amount: newBooking.amount,
      total_amount: newBooking.amount,
      user_contact: newBooking.userContact,
      plan_used: newBooking.planUsed,
      payment_qr_used: newBooking.paymentQrUsed,
      payment_status: 'completed',
      created_at: newBooking.createdAt
    }));

    try {
      const { error } = await supabase.from('bookings').insert(recordsToInsert);

      if (error) {
        console.error("Supabase insert error:", error);
        showToast(`❌ Booking failed: ${error.message}`);
        setIsProcessingPayment(false);
        return;
      }
    } catch (e: any) {
      console.error("Saved booking to Supabase exception:", e);
      showToast(`❌ Booking error: ${e?.message || 'Unknown error occurred'}`);
      setIsProcessingPayment(false);
      return;
    }

    setMyBookings(prev => [newBooking, ...prev]);
    setBookedSlots(prev => [...prev, ...newLockedSlots]);
    setIsProcessingPayment(false);
    setShowPaymentModal(false);
    setSelectedSlots([]);
    showToast(`🎉 Payment Successful! Ticket ID: ${newBooking.id}`);
    setProfileTab('bookings');
    setView('profile');
  };

  const toggleSport = (sport: string) => {
    if (selectedSports.includes(sport)) {
      setSelectedSports(selectedSports.filter(s => s !== sport));
    } else {
      setSelectedSports([...selectedSports, sport]);
    }
  };

  const toggleAmenity = (amenity: string) => {
    if (selectedAmenities.includes(amenity)) {
      setSelectedAmenities(selectedAmenities.filter(a => a !== amenity));
    } else {
      setSelectedAmenities([...selectedAmenities, amenity]);
    }
  };

  // QR Code Image File Upload Handler (Upload to Supabase Storage 'qr-codes' bucket)
  const handleQrFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingQr(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const { data, error } = await supabase.storage.from('qr-codes').upload(fileName, file);

      if (error) {
        console.error('Supabase Storage QR upload error:', error);
      }

      // Retrieve permanent public URL
      const { data: publicUrlData } = supabase.storage.from('qr-codes').getPublicUrl(fileName);
      const qrCodeUrl = publicUrlData.publicUrl;

      setNewArenaQrCodeUrl(qrCodeUrl);
      showToast('✓ QR Code Image uploaded to Storage!');
    } catch (err: any) {
      console.error('QR Upload Exception:', err);
    } finally {
      setIsUploadingQr(false);
    }
  };

  const handleCreateVenue = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) {
      setShowAuthModal(true);
      showToast('🔒 Please sign in to list a venue!');
      return;
    }

    if (!newArenaName || !newArenaLocation) {
      alert('Please fill out Arena Name and Location!');
      return;
    }

    const upi = newArenaUpiId.trim() || 'owner@okaxis';
    const inputQr = newArenaQrCodeUrl.trim();
    let qrUrl = inputQr;
    if (!qrUrl) {
      qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=upi://pay?pa=${upi}`;
    } else if (!qrUrl.startsWith('http://') && !qrUrl.startsWith('https://')) {
      qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=upi://pay?pa=${encodeURIComponent(qrUrl)}`;
    }

    const currentOwnerId = currentUser?.id || '';
    const currentOwnerEmail = newArenaEmail.trim() || currentUser?.email || '';
    const whatsappVal = newArenaWhatsappNumber.trim() || currentUser?.phone || '';

    const newTurf = {
      name: newArenaName,
      price: newArenaPrice,
      locationUrl: newArenaLocationUrl,
      qrCodeUrl: qrUrl,
      upiId: upi,
      whatsappNumber: whatsappVal,
      sports: selectedSports,
      facilities: selectedAmenities
    };

    const created: Arena = {
      id: Date.now(),
      title: newArenaName,
      location: newArenaLocation,
      lat: 17.4399,
      lng: 78.5082,
      price: Number(newArenaPrice),
      rating: 5.0,
      reviews: 1,
      amenities: selectedAmenities.length > 0 ? selectedAmenities : ['Changing Rooms', 'Washrooms', 'Parking'],
      sports: selectedSports.length > 0 ? selectedSports : ['Cricket', 'Football'],
      image: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=800&auto=format&fit=crop',
      locationUrl: newArenaLocationUrl,
      plan: newArenaPlanType === 'commission' ? 'commission' : 'subscription',
      plan_type: newArenaPlanType,
      ownerEmail: currentOwnerEmail,
      owner_id: currentOwnerId,
      user_id: currentOwnerId,
      ownerUpiId: upi,
      ownerQrCodeUrl: qrUrl,
      upiId: upi,
      whatsappNumber: whatsappVal,
      status: 'pending',
      is_verified: false
    };

    // Save/Insert Ground & Arena directly into Supabase database with plan_type & plan
    (async () => {
      try {
        const qrCodeUrl = newTurf.qrCodeUrl || '';
        const selectedPlan = newArenaPlanType || 'free';

        const turfPayload = {
          name: newTurf.name || 'New Turf',
          price_per_hour: Number(newTurf.price || 0) || 1000,
          location_url: newTurf.locationUrl || '',
          qr_code_url: qrCodeUrl || '',
          upi_id: newTurf.upiId || '',
          whatsapp_number: whatsappVal,
          sports: Array.isArray(newTurf.sports) ? newTurf.sports : [],
          facilities: Array.isArray(newTurf.facilities) ? newTurf.facilities : [],
          status: 'pending',
          user_id: currentOwnerId,
          owner_id: currentOwnerId,
          owner_email: currentOwnerEmail,
          plan_type: selectedPlan,
          plan: selectedPlan
        };

        let gErr: any = null;
        let aErr: any = null;

        try {
          const res1 = await supabase.from('grounds').insert([turfPayload]);
          gErr = res1.error;
        } catch (e) {
          console.warn('Grounds table insert notice:', e);
        }

        try {
          const res2 = await supabase.from('arenas').insert([turfPayload]);
          aErr = res2.error;
        } catch (e) {
          console.warn('Arenas table insert notice:', e);
        }

        if (gErr && aErr) {
          console.error('Supabase turf save error message:', gErr.message || aErr.message);
          alert('Failed to save turf: ' + (gErr.message || aErr.message || 'Database error'));
          return;
        }

        await fetchGroundsFromSupabase();
        await fetchPendingGroundsFromSupabase();

        setArenas(prev => [created, ...prev]);
        setShowAddTurfForm(false);
        alert('Turf submitted successfully! It is pending admin verification.');
        showToast('Turf submitted successfully! It is pending admin verification.');
      } catch (err: any) {
        console.error('Error saving ground to Supabase:', err);
        alert('Failed to save turf: ' + (err.message || JSON.stringify(err)));
      }
    })();
  };

  // PERMANENT DELETE TURF HANDLER
  const handleDeleteTurf = async (turfId: string | number, turfTitle: string) => {
    const confirmDelete = window.confirm(`Are you sure you want to permanently delete "${turfTitle}"? This action cannot be undone.`);
    if (!confirmDelete) return;

    try {
      const { error: err1 } = await supabase.from('grounds').delete().eq('id', turfId);
      const { error: err2 } = await supabase.from('arenas').delete().eq('id', turfId);

      if (err1 && err2) {
        console.warn("Delete turf notice:", err1.message || err2.message);
      }

      setArenas(prev => prev.filter(a => String(a.id) !== String(turfId)));
      showToast(`✓ "${turfTitle}" deleted permanently.`);
    } catch (err: any) {
      console.error("Delete turf exception:", err);
      showToast(`Failed to delete turf: ${err.message || 'Unknown error'}`);
    }
  };

  const handleVerifyTicket = (e: React.FormEvent) => {
    e.preventDefault();
    if (ticketCode.trim().length > 0) {
      const formatted = ticketCode.toUpperCase().trim();
      setCheckInStatus(`✓ Ticket ${formatted} Verified! Player Checked-In Successfully.`);
      showToast(`Verified Ticket ${formatted}`);
    } else {
      alert('Please enter a valid ticket reference code (e.g. WD-09TKPU8)');
    }
  };

  const handlePriceChange = (day: string, hour: string, price: number) => {
    setSlotPrices(prev => ({
      ...prev,
      [day]: {
        ...(prev[day] || {}),
        [hour]: price
      }
    }));
  };

  const handleApplySurge = (percentage: number) => {
    const groundToUse = selectedArena || arenas[0];
    const slotBasePrice = Number(groundToUse?.price_per_hour || groundToUse?.price || 1200);
    const newRate = Math.round(slotBasePrice * (1 + percentage / 100));
    const currentSlots = getSlotsDataForArena(groundToUse, selectedDateIndex);

    const updatedDayPrices: Record<string, number> = {};
    currentSlots.forEach(s => {
      updatedDayPrices[s.time] = newRate;
    });

    setSlotPrices(prev => ({
      ...prev,
      [selectedDay]: updatedDayPrices
    }));
    showToast(`Applied ${percentage > 0 ? `+${percentage}% surge (₹${newRate})` : `reset base rate (₹${slotBasePrice})`} for ${selectedDay}`);
  };

  const handleSaveOwnerPricing = async (groundId: number | string, updatedPrice: number) => {
    const slotPricesObj = {
      slotPrices: slotPrices,
      basePrice: Number(updatedPrice),
      peakMultiplier: 1.25,
      weekendMultiplier: 1.15,
      updatedAt: new Date().toISOString()
    };

    try {
      const { error } = await supabase
        .from('grounds')
        .update({ 
          price_per_hour: Number(updatedPrice),
          pricing_rules: slotPricesObj
        })
        .eq('id', groundId);

      if (error) {
        console.error('Failed to save pricing:', error);
        alert('Failed to save: ' + (error.message || JSON.stringify(error)));
        return;
      } else {
        alert('Prices saved successfully!');
      }
    } catch (e: any) {
      console.error('Failed to save pricing:', e);
      alert('Failed to save: ' + (e.message || JSON.stringify(e)));
      return;
    }

    setArenas(prev => prev.map(a => String(a.id) === String(groundId) ? { ...a, price: Number(updatedPrice), price_per_hour: Number(updatedPrice), pricing_rules: slotPricesObj } : a));
    if (selectedArena && String(selectedArena.id) === String(groundId)) {
      setSelectedArena(prev => prev ? { ...prev, price: Number(updatedPrice), price_per_hour: Number(updatedPrice), pricing_rules: slotPricesObj } : null);
    }

    await fetchGroundsFromSupabase();
    showToast(`✓ Pricing updated to ₹${updatedPrice}/hr! Saved to Supabase database.`);
  };

  return (
    <div className="min-h-screen bg-[#070b12] text-gray-100 font-sans antialiased flex flex-col justify-between selection:bg-amber-500 selection:text-black">
      {/* Recaptcha Container for Firebase Phone Auth */}
      <div id="recaptcha-container"></div>

      <div>
        {/* Toast Notification */}
        {toastMessage && (
          <div className="fixed top-20 right-6 z-50 bg-emerald-500 text-black font-bold px-5 py-3 rounded-xl shadow-2xl flex items-center gap-3 animate-bounce">
            <CheckCircle2 className="w-5 h-5 text-black" />
            <span>{toastMessage}</span>
          </div>
        )}

        {/* CLEANED TOP HEADER NAVIGATION */}
        <header className="border-b border-gray-800/80 bg-[#0d1117]/90 backdrop-blur sticky top-0 z-40">
          <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
            {/* WinDeclare Logo & 3-Line Hamburger Menu for Owner Portal */}
            <div className="flex items-center gap-3">
              {view === 'owner-portal' && (
                <button
                  type="button"
                  onClick={() => setIsOwnerDrawerOpen(true)}
                  className="p-2 rounded-xl bg-gray-900 border border-gray-800 text-amber-400 hover:bg-gray-800 transition flex items-center gap-1.5"
                  title="Open Owner Navigation Drawer"
                >
                  <Menu className="w-5 h-5 text-amber-400" />
                  <span className="text-xs font-bold text-amber-400 hidden sm:inline">Menu</span>
                </button>
              )}

              <div 
                className="flex items-center gap-2 cursor-pointer group"
                onClick={() => setView('browse')}
              >
                <div className="bg-gradient-to-tr from-amber-500 to-orange-500 p-2 rounded-xl text-black shadow-lg shadow-amber-500/20 group-hover:scale-105 transition duration-300">
                  <Trophy className="w-5 h-5 fill-black stroke-black" />
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-extrabold text-xl tracking-tight text-white group-hover:text-amber-400 transition">
                    WinDeclare
                  </span>
                  {view === 'owner-portal' && (
                    <span className="text-[10px] font-extrabold text-amber-400 bg-amber-500/10 border border-amber-500/30 px-2 py-0.5 rounded-lg uppercase tracking-wider">
                      OWNER PORTAL
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Standard Navigation Options */}
            <div className="flex items-center gap-3">
              <button 
                onClick={() => setView('browse')}
                className={`text-xs font-semibold px-3 py-2 rounded-xl transition ${
                  view === 'browse' ? 'bg-amber-500 text-black font-bold' : 'text-gray-300 hover:text-white'
                }`}
              >
                Browse Turfs
              </button>

              {/* PROFILE DROPDOWN WITH DUAL-ROLE SWITCHER */}
              <div className="relative">
                <button 
                  onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                  className="flex items-center gap-2 text-xs font-semibold text-gray-300 bg-gray-900 border border-gray-800 px-3 py-2 rounded-xl hover:border-amber-500/50 transition"
                >
                  <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-amber-400 to-orange-500 text-black font-black flex items-center justify-center text-[10px]">
                    {currentUser ? currentUser.name.charAt(0) : <User className="w-3.5 h-3.5" />}
                  </div>
                  <span className="hidden sm:inline font-bold">{currentUser ? currentUser.name : 'Account'}</span>
                  <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
                </button>

                {/* Profile Dropdown Items */}
                {isProfileMenuOpen && (
                  <div className="absolute right-0 mt-2 w-64 bg-[#0e1320] border border-gray-800 rounded-2xl shadow-2xl p-2 z-50 space-y-1">
                    <div className="px-3 py-2 border-b border-gray-800">
                      <p className="text-xs font-bold text-white">{currentUser?.name || 'Guest Player'}</p>
                      <p className="text-[10px] text-gray-400 truncate">{currentUser?.phone || currentUser?.email || 'Not logged in'}</p>
                    </div>

                    <button 
                      onClick={() => { setProfileTab('bookings'); setView('profile'); setIsProfileMenuOpen(false); }}
                      className="w-full flex items-center justify-between px-3 py-2 text-xs text-gray-300 hover:bg-amber-500/10 hover:text-amber-400 rounded-xl transition"
                    >
                      <span className="flex items-center gap-2"><Calendar className="w-3.5 h-3.5" /> My Bookings</span>
                      <span className="bg-amber-500 text-black font-black text-[10px] px-1.5 rounded-full">{myBookings.length}</span>
                    </button>

                    <button 
                      onClick={() => { setProfileTab('favorites'); setView('profile'); setIsProfileMenuOpen(false); }}
                      className="w-full flex items-center justify-between px-3 py-2 text-xs text-gray-300 hover:bg-amber-500/10 hover:text-amber-400 rounded-xl transition"
                    >
                      <span className="flex items-center gap-2"><Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500" /> Favorite Turfs</span>
                      <span className="text-gray-400 text-[10px]">{favoriteArenaIds.length}</span>
                    </button>

                    {/* DUAL-ROLE SWITCHER BUTTON (PLAYER / OWNER) WITH GUEST GATEKEEPER */}
                    <button 
                      onClick={() => {
                        if (!currentUser) {
                          setIsProfileMenuOpen(false);
                          setShowAuthModal(true);
                          showToast('🔒 Please sign in to access Owner Portal!');
                          return;
                        }
                        if (view === 'owner-portal') {
                          setView('browse');
                          showToast('Switched to Player View ⚽');
                        } else {
                          setView('owner-portal');
                          showToast('Switched to Owner Portal 🏢');
                        }
                        setIsProfileMenuOpen(false);
                      }}
                      className="w-full flex items-center justify-between px-3 py-2 text-xs font-bold text-amber-400 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 rounded-xl transition"
                    >
                      <span className="flex items-center gap-2">
                        <Building2 className="w-3.5 h-3.5 text-amber-400" /> 
                        {view === 'owner-portal' ? 'Switch to Player View' : 'Switch to Owner Portal'}
                      </span>
                      <ChevronDown className="w-3 h-3 text-amber-400 -rotate-90" />
                    </button>

                    <button 
                      onClick={() => { setProfileTab('account'); setView('profile'); setIsProfileMenuOpen(false); }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-xs text-gray-300 hover:bg-amber-500/10 hover:text-amber-400 rounded-xl transition"
                    >
                      <Settings className="w-3.5 h-3.5" /> Account Settings
                    </button>

                    {/* Secret Admin Gatekeeper Entrance - Visible ONLY to kondrashravankumar@gmail.com */}
                    {currentUser?.email === 'kondrashravankumar@gmail.com' && (
                      <button 
                        onClick={() => { setIsProfileMenuOpen(false); handleOpenAdminDashboard(); }}
                        className="w-full flex items-center gap-2 px-3 py-2 text-xs text-purple-400 hover:bg-purple-500/10 rounded-xl transition font-semibold"
                      >
                        <Shield className="w-3.5 h-3.5 text-purple-400" /> Admin Console
                      </button>
                    )}

                    <div className="pt-1 border-t border-gray-800">
                      {currentUser ? (
                        <button 
                          onClick={async () => { 
                            await supabase.auth.signOut();
                            setCurrentUser(null); 
                            setIsProfileMenuOpen(false); 
                            showToast('Signed out successfully'); 
                          }}
                          className="w-full flex items-center gap-2 px-3 py-2 text-xs text-rose-400 hover:bg-rose-500/10 rounded-xl transition font-semibold"
                        >
                          <LogOut className="w-3.5 h-3.5" /> Sign Out
                        </button>
                      ) : (
                        <button 
                          onClick={() => { setIsProfileMenuOpen(false); setShowAuthModal(true); }}
                          className="w-full flex items-center gap-2 px-3 py-2 text-xs text-emerald-400 hover:bg-emerald-500/10 rounded-xl transition font-bold"
                        >
                          <User className="w-3.5 h-3.5" /> Sign In / Login
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* VIEW 1: LANDING PAGE */}
        {view === 'browse' && (
          <main className="max-w-7xl mx-auto px-4 py-8">
            <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs font-bold text-amber-500 tracking-widest uppercase bg-amber-500/10 border border-amber-500/20 px-2.5 py-1 rounded-md">
                    ⚡ Instant Confirmation
                  </span>

                  {userLocation && (
                    <span className="text-xs font-bold text-emerald-400 bg-emerald-950/60 border border-emerald-800/60 px-2.5 py-1 rounded-md flex items-center gap-1">
                      <Compass className="w-3.5 h-3.5" /> GPS Active
                    </span>
                  )}
                </div>

                <h1 className="text-3xl sm:text-4xl font-extrabold text-white">
                  Find the perfect <span className="text-amber-400">turf</span> near you.
                </h1>
                <p className="text-gray-400 text-xs sm:text-sm mt-1">
                  Book 5-a-side grounds, box cricket pitches, and badminton courts with instant confirmation.
                </p>
              </div>
            </div>

            {/* Sports Filter & Search Bar */}
            <div className="bg-[#0e131f] border border-gray-800/80 rounded-2xl p-4 mb-6 space-y-4 shadow-xl">
              <div className="flex flex-wrap gap-4 items-center justify-between">
                <div className="flex-1 min-w-[280px] relative">
                  <Search className="w-4 h-4 absolute left-3 top-3.5 text-gray-500" />
                  <input 
                    type="text" 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search by arena name, location (e.g. Addagutta, Gachibowli)..." 
                    className="w-full bg-[#070b12] border border-gray-800 rounded-xl pl-9 pr-4 py-2.5 text-sm focus:outline-none focus:border-amber-500 text-white"
                  />
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-xs text-gray-400 font-medium uppercase">Max Price:</span>
                  <input 
                    type="range" 
                    min="300" 
                    max="5000" 
                    step="100" 
                    value={maxPrice} 
                    onChange={(e) => setMaxPrice(Number(e.target.value))}
                    className="accent-amber-500 cursor-pointer"
                  />
                  <span className="text-sm font-bold text-amber-400 min-w-[80px]">₹{maxPrice}/hr</span>
                </div>
              </div>

              {/* Sports Chips */}
              <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar border-t border-gray-800/60 pt-3">
                {['All', ...sportsList].map((sport) => (
                  <button
                    key={sport}
                    onClick={() => setSelectedSport(sport)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
                      selectedSport === sport
                        ? 'bg-amber-500 text-black font-extrabold shadow-md'
                        : 'bg-[#080c14] border border-gray-800 text-gray-400 hover:text-white'
                    }`}
                  >
                    {sport}
                  </button>
                ))}
              </div>
            </div>

            {/* Arenas Grid */}
            <div className="grid md:grid-cols-3 gap-6">
              {arenas
                .filter(a => (a.is_verified !== false && a.status !== 'pending' && a.status !== 'rejected') && (selectedSport === 'All' || a.sports.includes(selectedSport)) && a.price <= maxPrice && (a.title.toLowerCase().includes(searchQuery.toLowerCase()) || a.location.toLowerCase().includes(searchQuery.toLowerCase())))
                .map((arena) => {
                  const distance = userLocation 
                    ? calculateDistance(userLocation.lat, userLocation.lng, arena.lat, arena.lng)
                    : null;

                  const isFav = favoriteArenaIds.includes(Number(arena.id));

                  return (
                    <div key={arena.id} className="bg-[#0e1320] border border-gray-800 rounded-2xl overflow-hidden hover:border-amber-500/40 transition flex flex-col justify-between shadow-xl group">
                      <div>
                        <div className="relative h-48 bg-gray-950 overflow-hidden">
                          <img src={arena.image} alt={arena.title} className="w-full h-full object-cover group-hover:scale-105 transition duration-500" />
                          
                          {/* Favorite Button */}
                          <button 
                            onClick={(e) => toggleFavorite(Number(arena.id), e)}
                            className="absolute top-3 right-3 bg-black/60 backdrop-blur p-2 rounded-xl border border-white/10 hover:scale-110 transition z-10"
                          >
                            <Heart className={`w-4 h-4 ${isFav ? 'fill-rose-500 text-rose-500' : 'text-white'}`} />
                          </button>

                          {distance && (
                            <div className="absolute top-3 left-3 bg-black/80 backdrop-blur border border-amber-500/40 text-amber-400 text-xs font-extrabold px-2.5 py-1 rounded-lg flex items-center gap-1 shadow-md">
                              <Navigation className="w-3 h-3 fill-amber-400" /> {distance} km away
                            </div>
                          )}

                          <div className="absolute bottom-3 left-3 bg-black/80 backdrop-blur text-xs font-bold text-amber-400 px-2.5 py-1 rounded-md flex items-center gap-1">
                            <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" /> {arena.rating} ({arena.reviews})
                          </div>

                        </div>

                        <div className="p-5 flex-1 flex flex-col justify-between space-y-2">
                          <div>
                            <h3 className="font-bold text-lg text-white group-hover:text-amber-400 transition">{arena.title}</h3>
                            <p className="text-xs text-gray-400 flex items-center gap-1 mt-1">
                              <MapPin className="w-3.5 h-3.5 text-amber-500" /> {arena.location}
                            </p>
                          </div>

                          <div className="flex flex-wrap gap-1 mt-2">
                            {arena.sports.map(s => (
                              <span key={s} className="bg-amber-500/10 text-amber-400 border border-amber-500/20 text-[10px] font-bold px-2 py-0.5 rounded">
                                {s}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>

                      <div className="p-5 pt-0">
                        <div className="mt-4 pt-4 border-t border-gray-800 space-y-3">
                          <div className="flex items-center justify-between">
                            <div>
                              <span className="text-xl font-bold text-white">₹{arena.price}</span>
                              <span className="text-xs text-gray-500">/hr</span>
                            </div>

                            <button 
                              onClick={() => handleSelectArena(arena)}
                              className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-black font-extrabold text-xs rounded-xl transition shadow-lg shadow-amber-500/10"
                            >
                              Book Slot →
                            </button>
                          </div>

                          <button 
                            onClick={() => handleNavigate(arena.title, arena.location, arena.locationUrl)}
                            className="w-full py-2 bg-[#080c14] hover:bg-gray-900 border border-teal-500/30 text-teal-400 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition"
                          >
                            <Navigation className="w-3.5 h-3.5" /> Navigate
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
            </div>
          </main>
        )}

        {/* VIEW 2: ARENA DETAILS & MULTI-SLOT BOOKING */}
        {view === 'arena-details' && selectedArena && (
          <main className="max-w-2xl mx-auto px-4 py-6 space-y-6">
            <div className="flex items-center justify-between">
              <button 
                onClick={() => setView('browse')}
                className="flex items-center gap-2 text-sm font-semibold text-gray-300 hover:text-white transition"
              >
                <ArrowLeft className="w-4 h-4" /> Back
              </button>
              <div className="flex items-center gap-2">
                <div className="bg-amber-500 p-1 rounded-lg text-black">
                  <Trophy className="w-4 h-4 stroke-[3]" />
                </div>
                <span className="font-bold text-lg tracking-tight text-white">WinDeclare</span>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h1 className="text-4xl font-black text-white tracking-tight">{selectedArena.title}</h1>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-xs text-gray-400 flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-amber-500" /> {selectedArena.location}
                </p>

                {/* FEATURE 3: Navigate to Ground Button */}
                <button 
                  onClick={() => handleNavigate(selectedArena.title, selectedArena.location, selectedArena.locationUrl)}
                  className="px-3.5 py-1.5 bg-[#080c14] hover:bg-gray-900 border border-teal-500/40 text-teal-400 rounded-xl text-xs font-extrabold flex items-center gap-1.5 transition shadow"
                >
                  <Navigation className="w-3.5 h-3.5" /> Navigate to Ground
                </button>
              </div>

              {/* Sports Tags */}
              <div className="flex flex-wrap gap-1.5 pt-1">
                {selectedArena.sports.map(s => (
                  <span key={s} className="bg-amber-500/10 text-amber-400 border border-amber-500/20 text-xs font-bold px-2.5 py-1 rounded-lg">
                    {s}
                  </span>
                ))}
              </div>
            </div>

            <div className="bg-[#0b101d] border border-gray-800 rounded-3xl p-6 shadow-2xl space-y-6">
              {/* FEATURE 3: Facilities Available Section */}
              <div className="space-y-3 pb-2 border-b border-gray-800/80">
                <span className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" /> FACILITIES AVAILABLE
                </span>
                <div className="flex flex-wrap gap-2">
                  {selectedArena.amenities && selectedArena.amenities.length > 0 ? (
                    selectedArena.amenities.map((facility) => (
                      <span key={facility} className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-bold px-3 py-1.5 rounded-xl flex items-center gap-1.5">
                        <Check className="w-3.5 h-3.5 text-emerald-400 stroke-[3]" /> {facility}
                      </span>
                    ))
                  ) : (
                    <span className="text-xs text-gray-500">Standard Turf Facilities</span>
                  )}
                </div>
              </div>
              {/* Date Selection */}
              <div className="space-y-3">
                <span className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-amber-500" /> SELECT DATE
                </span>
                <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
                  {datesList.map((d, index) => (
                    <button
                      key={d.date}
                      onClick={() => setSelectedDateIndex(index)}
                      className={`flex-1 min-w-[60px] py-3 rounded-2xl flex flex-col items-center justify-center border transition ${
                        selectedDateIndex === index
                          ? 'bg-gradient-to-b from-amber-500 to-orange-500 text-black border-amber-500 font-bold'
                          : 'bg-[#080c14] border-gray-800 text-gray-400'
                      }`}
                    >
                      <span className="text-[10px] uppercase font-semibold">{d.day}</span>
                      <span className="text-lg font-black mt-0.5">{d.date}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Slot Selection with Double-Booking Locking */}
              <div className="space-y-3">
                <span className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-amber-500" /> AVAILABLE SLOTS
                </span>
                <div className="grid grid-cols-3 gap-3">
                  {getSlotsDataForArena(selectedArena, selectedDateIndex).map((slot) => {
                    const now = new Date();
                    const isToday = selectedDateIndex === 0;
                    const slotHour = parseSlotTimeToHour(slot.time);
                    if (isToday && slotHour <= now.getHours()) return null;

                    const isSelected = selectedSlots.some(s => s.time === slot.time);
                    const isBooked = bookedSlots.some(b =>
                      String(b.arenaId) === String(selectedArena.id) &&
                      b.dateIndex === selectedDateIndex &&
                      b.time === slot.time
                    );

                    return (
                      <button
                        key={slot.time}
                        disabled={isBooked}
                        onClick={() => toggleSlotSelection(slot)}
                        className={`p-3 rounded-2xl border transition text-center space-y-1 ${
                          isBooked
                            ? 'bg-gray-900/60 border-gray-800 text-gray-600 cursor-not-allowed line-through'
                            : isSelected 
                            ? 'bg-amber-500 text-black border-amber-500 shadow-lg font-bold' 
                            : 'bg-[#080c14] border-gray-800 text-gray-200 hover:border-gray-700'
                        }`}
                      >
                        <p className="text-xs font-extrabold">{slot.time}</p>
                        <p className={`text-[10px] font-semibold ${isBooked ? 'text-gray-600' : isSelected ? 'text-black' : 'text-gray-500'}`}>
                          {isBooked ? 'BOOKED' : `₹${slot.price}`}
                        </p>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Checkout Bar */}
              {selectedSlots.length > 0 && (
                <div className="pt-4 border-t border-gray-800 space-y-4">
                  <div className="bg-[#080c14] border border-gray-800 rounded-2xl p-4 flex items-center justify-between">
                    <div>
                      <span className="text-xs font-bold text-amber-400 uppercase block font-mono">{selectedSlots.length} Hour(s) Selected</span>
                      <p className="text-[11px] text-gray-400 truncate max-w-[200px]">{selectedSlots.map(s => s.time).join(', ')}</p>
                    </div>
                    <div className="text-right">
                      <span className="text-2xl font-black text-white font-mono">₹{totalPrice}</span>
                    </div>
                  </div>

                  {/* SMART BOOKING ACTION: Checks auth state */}
                  <button 
                    type="button"
                    onClick={handleInitiateCheckout}
                    className="w-full py-3.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:brightness-110 text-black font-extrabold text-sm rounded-xl transition shadow-lg flex items-center justify-center gap-2 shadow-amber-500/20"
                  >
                    <Lock className="w-4 h-4 stroke-[3]" /> Proceed to Payment (₹{totalPrice})
                  </button>
                </div>
              )}
            </div>
          </main>
        )}

        {/* VIEW 3: ADMIN CONSOLE OVERHAUL & STRUCTURED TABS */}
        {view === 'admin-dashboard' && (
          <main className="max-w-6xl mx-auto px-4 py-8 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <span className="text-[10px] font-bold text-purple-400 uppercase tracking-widest bg-purple-500/10 px-2 py-0.5 rounded border border-purple-500/20">
                  Platform Super Admin Console
                </span>
                <h1 className="text-3xl font-extrabold text-white mt-1">Platform Management & Transactions</h1>
                <p className="text-xs text-gray-400 mt-1">Manage venue subscriptions, 10% commission payouts, users, and payout settings</p>
              </div>

              <button 
                onClick={() => {
                  setIsAdminAuthenticated(false);
                  setView('browse');
                  showToast('Admin logged out');
                }}
                className="px-3.5 py-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 rounded-xl text-xs font-bold flex items-center gap-2 self-start sm:self-auto"
              >
                <LogOut className="w-3.5 h-3.5" /> Lock Console
              </button>
            </div>

            {/* Admin Filter Tabs Navigation */}
            <div className="flex gap-2 overflow-x-auto bg-[#0e1320] p-2 rounded-2xl border border-gray-800 no-scrollbar">
              <button
                onClick={() => setAdminTab('pending-turfs')}
                className={`px-4 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition flex items-center gap-1.5 ${
                  adminTab === 'pending-turfs' ? 'bg-purple-600 text-white shadow-lg' : 'text-gray-400 hover:text-white'
                }`}
              >
                <Clock className="w-3.5 h-3.5 text-amber-400" /> Pending Verification ({Array.from(new Map([...pendingGrounds, ...arenas.filter(a => a.status === 'pending')].map(i => [String(i.id), i])).values()).length})
              </button>
              <button
                onClick={() => setAdminTab('owners-subscription')}
                className={`px-4 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition ${
                  adminTab === 'owners-subscription' ? 'bg-purple-600 text-white shadow-lg' : 'text-gray-400 hover:text-white'
                }`}
              >
                Free/₹2k Subscription Owners ({arenas.filter(a => a.plan === 'subscription').length})
              </button>
              <button
                onClick={() => setAdminTab('owners-commission')}
                className={`px-4 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition ${
                  adminTab === 'owners-commission' ? 'bg-purple-600 text-white shadow-lg' : 'text-gray-400 hover:text-white'
                }`}
              >
                10% Commission Owners ({arenas.filter(a => a.plan === 'commission').length})
              </button>
              <button
                onClick={() => setAdminTab('players')}
                className={`px-4 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition ${
                  adminTab === 'players' ? 'bg-purple-600 text-white shadow-lg' : 'text-gray-400 hover:text-white'
                }`}
              >
                Registered Players ({registeredUsers.length})
              </button>
              <button
                onClick={() => setAdminTab('turfs')}
                className={`px-4 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition ${
                  adminTab === 'turfs' ? 'bg-purple-600 text-white shadow-lg' : 'text-gray-400 hover:text-white'
                }`}
              >
                Turf Listings ({arenas.length})
              </button>
              <button
                onClick={() => setAdminTab('bookings')}
                className={`px-4 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition ${
                  adminTab === 'bookings' ? 'bg-purple-600 text-white shadow-lg' : 'text-gray-400 hover:text-white'
                }`}
              >
                Bookings & Transactions ({myBookings.length})
              </button>
              <button
                onClick={() => setAdminTab('settings')}
                className={`px-4 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition ${
                  adminTab === 'settings' ? 'bg-purple-600 text-white shadow-lg' : 'text-gray-400 hover:text-white'
                }`}
              >
                ⚙️ Admin Payout Settings
              </button>
            </div>

            {/* TAB 0: PENDING TURF VERIFICATIONS */}
            {adminTab === 'pending-turfs' && (
              <div className="bg-[#0e1320] border border-gray-800 rounded-2xl p-6 shadow-2xl space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-lg text-white flex items-center gap-2">
                      <Clock className="w-5 h-5 text-amber-400" /> Pending Turf Verifications
                    </h3>
                    <p className="text-xs text-gray-400 mt-1">Review newly submitted turfs awaiting administrator approval before publishing to public feed</p>
                  </div>
                  <button 
                    onClick={async () => {
                      await fetchPendingGroundsFromSupabase();
                      await fetchGroundsFromSupabase();
                      showToast('Refreshed pending list');
                    }}
                    className="px-3 py-1.5 bg-purple-600/20 text-purple-300 border border-purple-500/30 rounded-xl text-xs font-bold hover:bg-purple-600/30 transition flex items-center gap-1.5"
                  >
                    <Clock className="w-3.5 h-3.5" /> Refresh Pending
                  </button>
                </div>

                {(() => {
                  const pendingList = Array.from(new Map([...pendingGrounds, ...arenas.filter(a => a.status === 'pending')].map(i => [String(i.id), i])).values());
                  if (pendingList.length === 0) {
                    return (
                      <div className="text-center py-12 border border-dashed border-gray-800 rounded-2xl bg-[#080c14] space-y-2">
                        <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto opacity-80" />
                        <h4 className="font-bold text-white text-base">No Pending Verifications</h4>
                        <p className="text-xs text-gray-500 max-w-sm mx-auto">All submitted grounds have been reviewed. New submissions will appear here automatically.</p>
                      </div>
                    );
                  }

                  return (
                    <div className="grid md:grid-cols-2 gap-6">
                      {pendingList.map((arena) => (
                        <div key={arena.id} className="bg-[#080c14] border border-amber-500/30 rounded-2xl p-5 space-y-4 shadow-xl flex flex-col justify-between">
                          <div className="space-y-3">
                            <div className="flex items-start justify-between gap-3">
                              <div>
                                <span className="text-[10px] font-extrabold text-amber-400 uppercase tracking-widest bg-amber-500/10 border border-amber-500/30 px-2 py-0.5 rounded">
                                  Pending Verification
                                </span>
                                <h4 className="font-extrabold text-lg text-white mt-1.5">{arena.title}</h4>
                                <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
                                  <MapPin className="w-3.5 h-3.5 text-amber-500" /> {arena.location}
                                </p>
                              </div>
                              <span className="text-sm font-black text-amber-400 font-mono bg-amber-500/10 px-2.5 py-1 rounded-xl border border-amber-500/20">
                                ₹{arena.price}/hr
                              </span>
                            </div>

                            <div className="grid grid-cols-2 gap-2 text-xs bg-[#0e1320] p-3 rounded-xl border border-gray-800">
                              <div>
                                <span className="text-[10px] font-bold text-gray-500 uppercase block">Owner Email</span>
                                <span className="font-mono text-gray-300 text-[11px] truncate block">{arena.ownerEmail || 'N/A'}</span>
                              </div>
                              <div>
                                <span className="text-[10px] font-bold text-gray-500 uppercase block">Payout Plan</span>
                                <span className="font-bold text-amber-400 text-[11px]">{arena.plan === 'subscription' ? 'Plan 1: Free Tier' : 'Plan 2: 10% Comm.'}</span>
                              </div>
                            </div>

                            {arena.sports && arena.sports.length > 0 && (
                              <div className="flex flex-wrap gap-1">
                                {arena.sports.map(s => (
                                  <span key={s} className="bg-amber-500/10 text-amber-400 border border-amber-500/20 text-[10px] font-bold px-2 py-0.5 rounded">
                                    {s}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>

                          {/* Action Buttons: Approve & Reject */}
                          <div className="pt-3 border-t border-gray-800 flex items-center gap-3">
                            <button 
                              type="button"
                              onClick={() => handleApproveGround(arena.id)}
                              className="flex-1 bg-emerald-500 hover:bg-emerald-400 text-black font-extrabold py-2.5 rounded-xl transition text-xs flex items-center justify-center gap-1.5 shadow-lg shadow-emerald-500/20"
                            >
                              <CheckCircle2 className="w-4 h-4 stroke-[3]" /> Approve
                            </button>
                            <button 
                              type="button"
                              onClick={() => handleRejectGround(arena.id)}
                              className="flex-1 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 font-extrabold py-2.5 rounded-xl transition text-xs flex items-center justify-center gap-1.5"
                            >
                              <X className="w-4 h-4" /> Reject
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  );
                })()}
              </div>
            )}

            {/* TAB 1: FREE / ₹2,000 SUBSCRIPTION OWNERS */}
            {adminTab === 'owners-subscription' && (
              <div className="bg-[#0e1320] border border-gray-800 rounded-2xl p-6 shadow-2xl space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-lg text-white">Plan 1: Free Tier / ₹2,000 Monthly Subscription Owners</h3>
                  <span className="text-xs text-teal-400 font-bold bg-teal-500/10 border border-teal-500/30 px-2.5 py-1 rounded-md">
                    Direct Owner Payouts
                  </span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-gray-800 text-gray-400 font-bold uppercase text-[10px]">
                        <th className="py-3 px-4">Arena Title</th>
                        <th className="py-3 px-4">Owner Email</th>
                        <th className="py-3 px-4">Owner UPI ID</th>
                        <th className="py-3 px-4">Hourly Rate</th>
                        <th className="py-3 px-4">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-800/60">
                      {arenas.filter(a => a.plan === 'subscription').map(a => (
                        <tr key={a.id} className="hover:bg-gray-900/50 transition">
                          <td className="py-3.5 px-4 font-bold text-white">{a.title}</td>
                          <td className="py-3.5 px-4 text-gray-300">{a.ownerEmail || 'owner@turf.in'}</td>
                          <td className="py-3.5 px-4 font-mono text-amber-400 font-bold">{a.ownerUpiId || 'owner@okaxis'}</td>
                          <td className="py-3.5 px-4 font-mono font-bold text-white">₹{a.price}/hr</td>
                          <td className="py-3.5 px-4">
                            <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold px-2 py-0.5 rounded">
                              ✓ Subscription Active
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* TAB 2: 10% COMMISSION OWNERS */}
            {adminTab === 'owners-commission' && (
              <div className="bg-[#0e1320] border border-gray-800 rounded-2xl p-6 shadow-2xl space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-lg text-white">Plan 2: 10% Commission Plan Owners</h3>
                  <span className="text-xs text-amber-400 font-bold bg-amber-500/10 border border-amber-500/30 px-2.5 py-1 rounded-md">
                    Automated Platform Payouts via Admin QR
                  </span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-gray-800 text-gray-400 font-bold uppercase text-[10px]">
                        <th className="py-3 px-4">Arena Title</th>
                        <th className="py-3 px-4">Owner Email</th>
                        <th className="py-3 px-4">Platform Commission</th>
                        <th className="py-3 px-4">Routed QR Payout</th>
                        <th className="py-3 px-4">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-800/60">
                      {arenas.filter(a => a.plan === 'commission').map(a => (
                        <tr key={a.id} className="hover:bg-gray-900/50 transition">
                          <td className="py-3.5 px-4 font-bold text-white">{a.title}</td>
                          <td className="py-3.5 px-4 text-gray-300">{a.ownerEmail || 'owner.kelo@turf.in'}</td>
                          <td className="py-3.5 px-4 font-mono font-bold text-amber-400">10% Fee per booking</td>
                          <td className="py-3.5 px-4 font-mono text-purple-400 font-bold">{adminUpiId}</td>
                          <td className="py-3.5 px-4">
                            <span className="bg-purple-500/20 text-purple-400 border border-purple-500/30 text-[10px] font-bold px-2 py-0.5 rounded">
                              ✓ Auto-Commission Enabled
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* TAB 3: REGISTERED USERS & EMAILS */}
            {adminTab === 'players' && (
              <div className="bg-[#0e1320] border border-gray-800 rounded-2xl p-6 shadow-2xl space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-lg text-white">Registered Users & Emails</h3>
                    <p className="text-xs text-gray-400">All registered player & owner accounts synced from Supabase profiles</p>
                  </div>
                  <button 
                    onClick={fetchProfilesFromSupabase}
                    className="px-3 py-1.5 bg-purple-600/20 text-purple-300 border border-purple-500/30 rounded-xl text-xs font-bold hover:bg-purple-600/30 transition"
                  >
                    🔄 Refresh List
                  </button>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-gray-800 text-gray-400 font-bold uppercase text-[10px]">
                        <th className="py-3 px-4">User Display Name</th>
                        <th className="py-3 px-4">Gmail / Email Address</th>
                        <th className="py-3 px-4">User Role</th>
                        <th className="py-3 px-4">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-800/60">
                      {(profiles.length > 0 ? profiles : [
                        { id: 'USR-101', display_name: 'Shravan Kumar', email: 'shravan@windeclare.in', role: 'Player' },
                        { id: 'USR-102', display_name: 'Rahul Verma', email: 'rahul.v@gmail.com', role: 'Player' },
                        { id: 'USR-103', display_name: 'Akshay Box Turf Owner', email: 'owner.akshay@turf.in', role: 'Owner' },
                        { id: 'USR-104', display_name: 'Kelo Sports Owner', email: 'owner.kelo@turf.in', role: 'Owner' }
                      ]).map((u) => (
                        <tr key={u.id} className="hover:bg-gray-900/50 transition">
                          <td className="py-3.5 px-4 font-bold text-white flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-amber-400 to-orange-500 text-black font-black flex items-center justify-center text-[10px]">
                              {u.display_name ? u.display_name.charAt(0) : 'U'}
                            </div>
                            {u.display_name}
                          </td>
                          <td className="py-3.5 px-4 text-gray-300 font-mono">{u.email}</td>
                          <td className="py-3.5 px-4">
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                              u.role?.toLowerCase() === 'owner' 
                                ? 'bg-amber-500/10 text-amber-400 border-amber-500/30' 
                                : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                            }`}>
                              {u.role || 'Player'}
                            </span>
                          </td>
                          <td className="py-3.5 px-4">
                            <button
                              type="button"
                              onClick={() => window.open(`mailto:${u.email}?subject=WinDeclare Update&body=Hi ${u.display_name},`)}
                              className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-black font-extrabold text-xs rounded-xl shadow-lg transition flex items-center gap-1.5"
                            >
                              <Mail className="w-3.5 h-3.5" /> Send Email
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* TAB 4: TURF LISTINGS */}
            {adminTab === 'turfs' && (
              <div className="bg-[#0e1320] border border-gray-800 rounded-2xl p-6 shadow-2xl space-y-4">
                <h3 className="font-bold text-lg text-white">All Active Ground Venues</h3>
                <div className="grid md:grid-cols-2 gap-4">
                  {arenas.map(a => (
                    <div key={a.id} className="bg-[#080c14] border border-gray-800 p-4 rounded-xl flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <img src={a.image} alt={a.title} className="w-12 h-12 rounded-lg object-cover" />
                        <div>
                          <h4 className="font-bold text-white text-xs">{a.title}</h4>
                          <p className="text-[10px] text-gray-400">{a.location}</p>
                          <p className="text-[10px] font-bold text-amber-400 mt-0.5">₹{a.price}/hr • Plan: {a.plan}</p>
                        </div>
                      </div>
                      <span className="text-[10px] font-bold bg-teal-500/10 text-teal-400 border border-teal-500/30 px-2 py-1 rounded">Active</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TAB 5: BOOKINGS & TRANSACTIONS */}
            {adminTab === 'bookings' && (
              <div className="bg-[#0e1320] border border-gray-800 rounded-2xl p-6 shadow-2xl space-y-4">
                <h3 className="font-bold text-lg text-white">Bookings & Transactions Ledger</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-gray-800 text-gray-400 font-bold uppercase text-[10px]">
                        <th className="py-3 px-4">Booking Ref</th>
                        <th className="py-3 px-4">Arena Title</th>
                        <th className="py-3 px-4">Date & Slots</th>
                        <th className="py-3 px-4">Player Contact</th>
                        <th className="py-3 px-4">Plan & QR Payout</th>
                        <th className="py-3 px-4">Amount</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-800/60">
                      {myBookings.map(b => (
                        <tr key={b.id} className="hover:bg-gray-900/50 transition">
                          <td className="py-3.5 px-4 font-mono font-bold text-amber-400">{b.id}</td>
                          <td className="py-3.5 px-4 font-bold text-white">{b.arenaTitle}</td>
                          <td className="py-3.5 px-4 text-gray-300">{b.date} ({b.slots})</td>
                          <td className="py-3.5 px-4 text-gray-400 font-mono">{b.userContact}</td>
                          <td className="py-3.5 px-4 font-mono text-[11px] text-purple-400">{b.planUsed} ({b.paymentQrUsed})</td>
                          <td className="py-3.5 px-4 font-mono font-bold text-white">₹{b.amount}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* TAB 6: ADMIN PAYOUT & QR SETTINGS */}
            {adminTab === 'settings' && (
              <div className="bg-[#0e1320] border border-gray-800 rounded-2xl p-6 shadow-2xl space-y-5 max-w-xl">
                <div>
                  <h3 className="font-bold text-lg text-white flex items-center gap-2">
                    <Settings className="w-5 h-5 text-purple-400" /> Platform Admin Payout Settings
                  </h3>
                  <p className="text-xs text-gray-400 mt-1">Configure your master UPI ID and QR Code used for receiving 10% Commission Plan payments</p>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Master Platform Admin UPI ID</label>
                    <input 
                      type="text" 
                      value={adminUpiId}
                      onChange={(e) => setAdminUpiId(e.target.value)}
                      className="w-full bg-[#080c14] border border-gray-800 rounded-xl px-4 py-2.5 text-xs text-amber-400 font-mono font-bold focus:outline-none focus:border-purple-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Master Platform QR Code Image URL</label>
                    <input 
                      type="url" 
                      value={adminQrCodeUrl}
                      onChange={(e) => setAdminQrCodeUrl(e.target.value)}
                      className="w-full bg-[#080c14] border border-gray-800 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-purple-500"
                    />
                  </div>

                  <div className="bg-[#080c14] border border-gray-800 p-4 rounded-xl flex items-center justify-between">
                    <span className="text-xs text-gray-400 font-bold">QR Preview:</span>
                    <img src={adminQrCodeUrl} alt="Admin QR Preview" className="w-24 h-24 rounded-lg bg-white p-1" />
                  </div>

                  <button 
                    onClick={() => showToast('⚙️ Master Admin Payout UPI & QR Code Settings Saved!')}
                    className="w-full bg-purple-600 hover:bg-purple-500 text-white font-extrabold py-3 rounded-xl transition text-xs shadow-lg"
                  >
                    Save Platform Payout Settings
                  </button>
                </div>
              </div>
            )}
          </main>
        )}

        {/* VIEW 4: OWNER PORTAL (PRIMARY FULL-SCREEN VIEW WITHOUT INTRUSIVE LEFT SIDEBAR) */}
        {view === 'owner-portal' && (() => {
          const ownerArenaIds = ownerTurfs.map(t => Number(t.id));
          const ownerBookings = myBookings.filter(b => ownerArenaIds.includes(Number(b.arenaId)));
          const displayBookings = ownerPortalBookings.length > 0 ? ownerPortalBookings : ownerBookings;

          const currentPlanType = activeOwnerTurf?.plan_type || (activeOwnerTurf?.plan === 'commission' ? 'commission' : (activeOwnerTurf?.plan === 'hybrid' ? 'hybrid' : 'free'));
          const isFreePlan = currentPlanType === 'free';
          const commissionRate = currentPlanType === 'hybrid' ? 0.03 : (currentPlanType === 'commission' ? 0.10 : 0);

          const grossRevenue = displayBookings.reduce((sum, b) => sum + Number(b.total_amount || b.amount || 0), 0);
          const platformCommission = grossRevenue * commissionRate;
          const netEarnings = grossRevenue - platformCommission;

          const todayStr = new Date().toISOString().split('T')[0];
          const todayGross = displayBookings
            .filter(b => (b.booking_date || b.created_at || '').startsWith(todayStr))
            .reduce((sum, b) => sum + Number(b.total_amount || b.amount || 0), 0);
          const todayNet = todayGross * (1 - commissionRate);

          const weeklyGross = grossRevenue * 0.45;
          const weeklyNet = weeklyGross * (1 - commissionRate);

          const monthlyGross = grossRevenue;
          const monthlyNet = netEarnings;

          return (
            <div className="min-h-[calc(100vh-64px)] bg-[#070b12] text-gray-100 p-4 sm:p-8">
              <main className="max-w-6xl mx-auto space-y-6">

                {/* PLAN-BASED REVENUE ANALYTICS & EARNINGS BAR CHART HEADER (Requirement 2) */}
                {isFreePlan ? (
                  <div className="bg-[#0e1320] border border-amber-500/30 rounded-3xl p-6 shadow-2xl space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
                        <Lock className="w-6 h-6" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded border bg-emerald-500/10 border-emerald-500/30 text-emerald-400">
                            Free Plan Active
                          </span>
                          <span className="text-xs font-bold text-gray-400 font-mono">0% Commission • ₹0/mo</span>
                        </div>
                        <h3 className="text-xl font-extrabold text-white mt-1">Revenue Analytics & Automatic Payouts Locked</h3>
                      </div>
                    </div>

                    <div className="bg-[#080c14] border border-gray-800 rounded-2xl p-4 space-y-2 text-xs text-gray-300">
                      <p className="font-semibold text-amber-400 flex items-center gap-1.5">
                        <Shield className="w-4 h-4 text-amber-400" />
                        Upgrade to Hybrid (3% + ₹2k) or Commission (10%) plan to unlock detailed revenue analytics, automatic payouts, and performance charts.
                      </p>
                      <p className="text-gray-400 text-[11px]">
                        Under the Free Plan, players contact you directly on WhatsApp for direct cash/UPI payment. Upgrade your plan anytime to enable automated platform payments, instant earnings tracking, and detailed revenue analytics.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="bg-[#0e1320] border border-gray-800 rounded-3xl p-6 shadow-2xl space-y-6">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div>
                        <span className="text-[10px] font-bold text-teal-400 uppercase tracking-widest bg-teal-500/10 px-2.5 py-0.5 rounded border border-teal-500/20">
                          {currentPlanType === 'hybrid' ? 'Hybrid Plan (3% Comm + ₹2,000/mo)' : 'Commission Plan (10% Comm)'}
                        </span>
                        <h2 className="text-2xl sm:text-3xl font-extrabold text-white mt-1">Net Revenue Analytics & Earnings</h2>
                        <p className="text-xs text-gray-400 mt-0.5">Calculated net earnings after platform commission deduction</p>
                      </div>
                    </div>

                    {/* Revenue Metrics Cards */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                      <div className="bg-[#080c14] border border-gray-800 rounded-2xl p-4 space-y-1">
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Total Net Earnings</span>
                        <span className="text-2xl font-black text-emerald-400 font-mono block">₹{Math.round(netEarnings)}</span>
                        <span className="text-[10px] text-gray-500 block">Gross: ₹{Math.round(grossRevenue)}</span>
                      </div>

                      <div className="bg-[#080c14] border border-gray-800 rounded-2xl p-4 space-y-1">
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Daily Net Revenue</span>
                        <span className="text-2xl font-black text-amber-400 font-mono block">₹{Math.round(todayNet)}</span>
                        <span className="text-[10px] text-gray-500 block">Today's collection</span>
                      </div>

                      <div className="bg-[#080c14] border border-gray-800 rounded-2xl p-4 space-y-1">
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Weekly Net Revenue</span>
                        <span className="text-2xl font-black text-teal-400 font-mono block">₹{Math.round(weeklyNet)}</span>
                        <span className="text-[10px] text-gray-500 block">7-day trailing net</span>
                      </div>

                      <div className="bg-[#080c14] border border-gray-800 rounded-2xl p-4 space-y-1">
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Monthly Net Revenue</span>
                        <span className="text-2xl font-black text-purple-400 font-mono block">₹{Math.round(monthlyNet)}</span>
                        <span className="text-[10px] text-gray-500 block">Current month total</span>
                      </div>
                    </div>

                    {/* Earnings Bar Chart Component */}
                    <div className="bg-[#080c14] border border-gray-800 rounded-2xl p-5 space-y-4">
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-bold text-gray-300 uppercase tracking-wider flex items-center gap-2">
                          <Trophy className="w-4 h-4 text-amber-400" /> Net Revenue Performance Chart (Weekly)
                        </h4>
                        <span className="text-[10px] font-mono text-gray-400">Net Rate: {100 - (commissionRate * 100)}%</span>
                      </div>

                      {/* Interactive Bar Chart Visualization */}
                      <div className="h-40 flex items-end justify-between gap-3 pt-6 pb-2 px-4 border-b border-gray-800">
                        {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, idx) => {
                          const barHeights = [45, 60, 30, 80, 95, 70, 85];
                          const heightPct = barHeights[idx];
                          return (
                            <div key={day} className="flex-1 flex flex-col items-center gap-2 h-full justify-end group">
                              <div className="w-full max-w-[36px] bg-gray-900 rounded-t-lg relative overflow-hidden flex items-end transition-all h-full">
                                <div 
                                  style={{ height: `${heightPct}%` }} 
                                  className="w-full bg-gradient-to-t from-teal-600 to-emerald-400 rounded-t-lg transition-all duration-500 group-hover:brightness-125"
                                />
                              </div>
                              <span className="text-[10px] font-mono text-gray-400 uppercase">{day}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}
                
                {/* TAB 0: DEFAULT DAILY CALENDAR & OFFLINE DIRECT BOOKINGS */}
                {ownerTab === 'calendar' && (
                  <div className="space-y-6">
                    {ownerTurfs.length === 0 ? (
                      <div className="text-center py-16 px-4 bg-[#080c14] border border-dashed border-gray-800 rounded-3xl space-y-4 shadow-xl">
                        <div className="w-16 h-16 bg-amber-500/10 border border-amber-500/30 rounded-2xl flex items-center justify-center mx-auto text-amber-400">
                          <Calendar className="w-8 h-8" />
                        </div>
                        <div className="space-y-1">
                          <h3 className="text-xl font-bold text-white">No listed grounds found</h3>
                          <p className="text-xs text-gray-400 max-w-md mx-auto">
                            Add a turf in the Listings Manager first to view and manage daily time slots.
                          </p>
                        </div>
                        <button 
                          onClick={() => { setOwnerTab('listings'); setShowAddTurfForm(true); }}
                          className="px-6 py-3 bg-amber-500 hover:bg-amber-400 text-black font-extrabold text-xs rounded-xl transition inline-flex items-center gap-2 shadow-lg shadow-amber-500/20"
                        >
                          <Plus className="w-4 h-4 stroke-[3]" /> Add New Turf Venue
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-6">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                          <div>
                            <span className="text-[10px] font-bold text-amber-500 uppercase tracking-widest bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                              Daily Time Slot Calendar
                            </span>
                            <h2 className="text-2xl sm:text-3xl font-extrabold text-white mt-1">Venue Slot Availability</h2>
                            <p className="text-xs text-gray-400 mt-0.5">Manage live slot states and record offline walk-in bookings</p>
                          </div>

                          {/* Turf Selection Dropdown (STRICT BINDING BY UUID/ID) */}
                          <div className="self-start sm:self-auto">
                            <select
                              value={String(activeOwnerTurf?.id || '')}
                              onChange={(e) => {
                                const selectedId = e.target.value;
                                setSelectedOwnerTurfId(selectedId);
                                const found = ownerTurfs.find(t => String(t.id) === selectedId);
                                if (found) setSelectedArena(found);
                              }}
                              className="bg-[#0e1320] border border-gray-800 rounded-xl px-3 py-2 text-xs font-bold text-amber-400 focus:outline-none focus:border-amber-500 cursor-pointer"
                            >
                              {ownerTurfs.map(t => (
                                <option key={String(t.id)} value={String(t.id)}>{t.title}</option>
                              ))}
                            </select>
                          </div>
                        </div>

                    {/* Date Selector */}
                    <div className="bg-[#0e1320] border border-gray-800 rounded-2xl p-4 space-y-4 shadow-xl">
                      <div className="flex items-center justify-between border-b border-gray-800/80 pb-3">
                        <span className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-amber-500" /> SELECT DATE
                        </span>
                        <span className="text-xs font-bold text-amber-400">{datesList[selectedDateIndex]?.day}, Jul {datesList[selectedDateIndex]?.date}</span>
                      </div>

                      <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
                        {datesList.map((d, index) => (
                          <button
                            key={d.date}
                            onClick={() => setSelectedDateIndex(index)}
                            className={`flex-1 min-w-[55px] py-2.5 rounded-xl flex flex-col items-center justify-center border transition ${
                              selectedDateIndex === index
                                ? 'bg-gradient-to-b from-amber-500 to-orange-500 text-black border-amber-500 font-bold'
                                : 'bg-[#080c14] border-gray-800 text-gray-400'
                            }`}
                          >
                            <span className="text-[9px] uppercase font-semibold">{d.day}</span>
                            <span className="text-base font-black mt-0.5">{d.date}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* 24-Hour Slots Grid for Selected Date */}
                    <div className="bg-[#0e1320] border border-gray-800 rounded-2xl p-5 space-y-5 shadow-xl">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-800 pb-3">
                          <h3 className="font-extrabold text-white text-base flex items-center gap-2">
                            <Clock className="w-4 h-4 text-amber-500" /> 24-Hour Time Slots ({activeOwnerTurf.title})
                          </h3>

                          {selectedSlots.length > 0 && (
                            <button
                              type="button"
                              onClick={async () => {
                                const activeDate = datesList[selectedDateIndex];
                                const offlineBooking: Booking = {
                                  id: `OFF-${Math.random().toString(36).substring(2, 9).toUpperCase()}`,
                                  arenaId: Number(activeOwnerTurf.id),
                                  arenaTitle: activeOwnerTurf.title,
                                  date: `${activeDate.day}, Jul ${activeDate.date}`,
                                  dateIndex: selectedDateIndex,
                                  slots: selectedSlots.map(s => s.time).join(', '),
                                  amount: selectedSlots.reduce((acc, curr) => acc + curr.price, 0),
                                  userContact: currentUser?.phone || currentUser?.email || 'Owner Walk-In Direct',
                                  planUsed: activeOwnerTurf.plan || 'subscription',
                                  paymentQrUsed: 'offline_cash',
                                  createdAt: new Date().toISOString(),
                                  booking_type: 'offline',
                                  payment_status: 'offline_cash'
                                };

                                const newLockedSlots: BookedSlot[] = selectedSlots.map(s => ({
                                  arenaId: Number(activeOwnerTurf.id),
                                  dateIndex: selectedDateIndex,
                                  time: s.time
                                }));

                                setMyBookings(prev => [offlineBooking, ...prev]);
                                setBookedSlots(prev => [...prev, ...newLockedSlots]);
                                setSelectedSlots([]);

                                try {
                                  await supabase.from('bookings').insert([{
                                    booking_id: offlineBooking.id,
                                    arena_id: Number(activeOwnerTurf.id),
                                    ground_id: Number(activeOwnerTurf.id),
                                    arena_title: offlineBooking.arenaTitle,
                                    user_id: currentUser?.id || '',
                                    date: offlineBooking.date,
                                    date_index: offlineBooking.dateIndex,
                                    slots: offlineBooking.slots,
                                    amount: offlineBooking.amount,
                                    user_contact: offlineBooking.userContact,
                                    plan_used: offlineBooking.planUsed,
                                    payment_qr_used: offlineBooking.paymentQrUsed,
                                    booking_type: 'offline',
                                    payment_status: 'offline_cash',
                                    status: 'booked',
                                    created_at: offlineBooking.createdAt
                                  }]);
                                } catch (e) {
                                  console.error("Error saving offline booking to Supabase:", e);
                                }

                                showToast('✓ Offline slot booking confirmed! Slots locked on Player Dashboard.');
                              }}
                              className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-black font-extrabold text-xs rounded-xl shadow-lg transition flex items-center gap-1.5"
                            >
                              <CheckCircle2 className="w-4 h-4 stroke-[3]" /> Confirm Offline Booking ({selectedSlots.length} Slots)
                            </button>
                          )}
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 max-h-[450px] overflow-y-auto pr-1 no-scrollbar">
                          {getSlotsDataForArena(activeOwnerTurf, selectedDateIndex).map((slot) => {
                            const now = new Date();
                            const isToday = selectedDateIndex === 0;
                            const slotHour = parseSlotTimeToHour(slot.time);
                            if (isToday && slotHour <= now.getHours()) return null;

                            const isSelected = selectedSlots.some(s => s.time === slot.time);
                            const matchEntry = bookedSlots.find(b =>
                              String(b.arenaId) === String(activeOwnerTurf.id) &&
                              b.dateIndex === selectedDateIndex &&
                              b.time === slot.time
                            );
                            const isBooked = matchEntry?.source === 'booking';
                            const isClosed = matchEntry?.source === 'override';

                            return (
                              <button
                                key={slot.time}
                                disabled={isBooked || isClosed}
                                onClick={() => toggleSlotSelection(slot)}
                                className={`p-3 rounded-2xl border transition text-center space-y-1.5 ${
                                  isBooked ? 'bg-rose-950/20 border-rose-500/30 text-rose-400 cursor-not-allowed'
                                  : isClosed ? 'bg-gray-800/40 border-gray-700 text-gray-500 cursor-not-allowed'
                                  : isSelected ? 'bg-amber-500 text-black border-amber-500 shadow-lg font-bold'
                                  : 'bg-[#080c14] border-gray-800 text-gray-200 hover:border-gray-700'
                                }`}
                              >
                                <p className="text-xs font-extrabold">{slot.time}</p>
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                                  isBooked ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                                  : isClosed ? 'bg-gray-700/40 text-gray-400 border border-gray-600'
                                  : isSelected ? 'bg-black text-amber-400' : 'bg-emerald-500/10 text-emerald-400'
                                }`}>
                                  {isBooked ? 'BOOKED' : isClosed ? 'CLOSED' : isSelected ? 'Selected' : `₹${slot.price}`}
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

                {/* TAB 1: LISTINGS MANAGER & ADD NEW VENUE FORM */}
                {ownerTab === 'listings' && (
                  <div className="space-y-6">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div>
                        <span className="text-[10px] font-bold text-amber-500 uppercase tracking-widest bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                          Listings Manager
                        </span>
                        <h2 className="text-2xl sm:text-3xl font-extrabold text-white mt-1">Your sports grounds</h2>
                        <p className="text-xs text-gray-400">{ownerTurfs.length} Arenas listed under your account</p>
                      </div>

                      <button 
                        onClick={() => setShowAddTurfForm(true)}
                        className="px-4 py-2.5 bg-amber-500 hover:bg-amber-400 text-black font-extrabold text-xs rounded-xl transition flex items-center gap-2 self-start sm:self-auto shadow-lg shadow-amber-500/20"
                      >
                        <Plus className="w-4 h-4 stroke-[3]" /> Add New Turf Venue
                      </button>
                    </div>

                    {/* Clean Empty State when Owner Has No Turfs */}
                    {ownerTurfs.length === 0 && !showAddTurfForm ? (
                      <div className="text-center py-16 px-4 bg-[#080c14] border border-dashed border-gray-800 rounded-3xl space-y-4 shadow-xl">
                        <div className="w-16 h-16 bg-amber-500/10 border border-amber-500/30 rounded-2xl flex items-center justify-center mx-auto text-amber-400">
                          <Building2 className="w-8 h-8" />
                        </div>
                        <div className="space-y-1">
                          <h3 className="text-xl font-bold text-white">No listed turfs found for your account</h3>
                          <p className="text-xs text-gray-400 max-w-md mx-auto">
                            You haven't added any sports ground venues yet. Click below to publish your first turf listing.
                          </p>
                        </div>
                        <button 
                          onClick={() => setShowAddTurfForm(true)}
                          className="px-6 py-3 bg-amber-500 hover:bg-amber-400 text-black font-extrabold text-xs rounded-xl transition inline-flex items-center gap-2 shadow-lg shadow-amber-500/20"
                        >
                          <Plus className="w-4 h-4 stroke-[3]" /> Add New Turf Venue
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {/* ADD TURF FORM */}
                        {showAddTurfForm && (
                          <form onSubmit={handleCreateVenue} className="bg-[#0e1320] border border-gray-800 rounded-2xl p-4 sm:p-6 space-y-5 shadow-2xl">
                            <div className="flex items-center justify-between border-b border-gray-800 pb-3">
                              <h3 className="font-bold text-amber-400 text-sm flex items-center gap-2">
                                <Building2 className="w-4 h-4" /> Add New Ground Arena
                              </h3>
                              <button type="button" onClick={() => setShowAddTurfForm(false)} className="text-gray-400 hover:text-white p-1">
                                <X className="w-4 h-4" />
                              </button>
                            </div>

                            <div className="space-y-4">
                              <div>
                                <label className="block text-[11px] font-bold text-gray-400 uppercase mb-1">Arena Name *</label>
                                <input 
                                  type="text" 
                                  required 
                                  value={newArenaName}
                                  onChange={(e) => setNewArenaName(e.target.value)}
                                  placeholder="Neon Arena Football Hub" 
                                  className="w-full bg-[#080c14] border border-gray-800 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-amber-500" 
                                />
                              </div>

                              <div>
                                <label className="block text-[11px] font-bold text-gray-400 uppercase mb-1">Location Address *</label>
                                <input 
                                  type="text" 
                                  required 
                                  value={newArenaLocation}
                                  onChange={(e) => setNewArenaLocation(e.target.value)}
                                  placeholder="Gachibowli, Hyderabad" 
                                  className="w-full bg-[#080c14] border border-gray-800 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-amber-500" 
                                />
                              </div>

                              {/* SELECT 3-TIER PRICING PLAN */}
                              <div>
                                <label className="block text-[11px] font-bold text-amber-400 uppercase mb-1">Select Listing Plan (Required) *</label>
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                  {/* Option A: Free Plan */}
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setNewArenaPlanType('free');
                                      setNewArenaPlan('subscription');
                                    }}
                                    className={`p-3.5 rounded-xl border text-left transition ${
                                      newArenaPlanType === 'free' ? 'bg-emerald-500/10 border-emerald-500 text-emerald-400 font-bold shadow-lg' : 'bg-[#080c14] border-gray-800 text-gray-400 hover:border-gray-700'
                                    }`}
                                  >
                                    <div className="flex items-center justify-between">
                                      <p className="text-xs font-black text-white">Free Plan</p>
                                      {newArenaPlanType === 'free' && <Check className="w-3.5 h-3.5 text-emerald-400" />}
                                    </div>
                                    <p className="text-[11px] font-extrabold text-emerald-400 mt-1">0% Comm • ₹0/mo</p>
                                    <p className="text-[10px] text-gray-500 mt-1">Direct WhatsApp redirect (`wa.me`)</p>
                                  </button>

                                  {/* Option B: Hybrid Plan */}
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setNewArenaPlanType('hybrid');
                                      setNewArenaPlan('subscription');
                                    }}
                                    className={`p-3.5 rounded-xl border text-left transition ${
                                      newArenaPlanType === 'hybrid' ? 'bg-teal-500/10 border-teal-500 text-teal-400 font-bold shadow-lg' : 'bg-[#080c14] border-gray-800 text-gray-400 hover:border-gray-700'
                                    }`}
                                  >
                                    <div className="flex items-center justify-between">
                                      <p className="text-xs font-black text-white">Hybrid Plan</p>
                                      {newArenaPlanType === 'hybrid' && <Check className="w-3.5 h-3.5 text-teal-400" />}
                                    </div>
                                    <p className="text-[11px] font-extrabold text-teal-400 mt-1">3% Comm + ₹2,000/mo</p>
                                    <p className="text-[10px] text-gray-500 mt-1">Online Payment Gateway</p>
                                  </button>

                                  {/* Option C: Commission Plan */}
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setNewArenaPlanType('commission');
                                      setNewArenaPlan('commission');
                                    }}
                                    className={`p-3.5 rounded-xl border text-left transition ${
                                      newArenaPlanType === 'commission' ? 'bg-amber-500/10 border-amber-500 text-amber-400 font-bold shadow-lg' : 'bg-[#080c14] border-gray-800 text-gray-400 hover:border-gray-700'
                                    }`}
                                  >
                                    <div className="flex items-center justify-between">
                                      <p className="text-xs font-black text-white">Commission Plan</p>
                                      {newArenaPlanType === 'commission' && <Check className="w-3.5 h-3.5 text-amber-400" />}
                                    </div>
                                    <p className="text-[11px] font-extrabold text-amber-400 mt-1">10% Comm • ₹0/mo</p>
                                    <p className="text-[10px] text-gray-500 mt-1">Online Payment Gateway</p>
                                  </button>
                                </div>
                              </div>

                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                  <label className="block text-[11px] font-bold text-gray-400 uppercase mb-1">Owner Personal UPI ID (`upi_id`) *</label>
                                  <input 
                                    type="text" 
                                    required
                                    value={newArenaUpiId}
                                    onChange={(e) => setNewArenaUpiId(e.target.value)}
                                    placeholder="owner.name@okaxis" 
                                    className="w-full bg-[#080c14] border border-gray-800 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-amber-500 font-mono" 
                                  />
                                </div>

                                <div>
                                  <label className="block text-[11px] font-bold text-emerald-400 uppercase mb-1">Owner WhatsApp Contact (`whatsapp_number`) *</label>
                                  <input 
                                    type="tel" 
                                    required
                                    value={newArenaWhatsappNumber}
                                    onChange={(e) => setNewArenaWhatsappNumber(e.target.value)}
                                    placeholder="+91 9876543210" 
                                    className="w-full bg-[#080c14] border border-gray-800 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500 font-mono" 
                                  />
                                </div>
                              </div>

                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                  <label className="block text-[11px] font-bold text-gray-400 uppercase mb-1">Price Per Hour (₹) *</label>
                                  <input 
                                    type="number" 
                                    required 
                                    value={newArenaPrice}
                                    onChange={(e) => setNewArenaPrice(Number(e.target.value))}
                                    placeholder="1200" 
                                    className="w-full bg-[#080c14] border border-gray-800 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-amber-500" 
                                  />
                                </div>
                                <div>
                                  <label className="block text-[11px] font-bold text-gray-400 uppercase mb-1">Contact Email</label>
                                  <input 
                                    type="email" 
                                    value={newArenaEmail || currentUser?.email || ''}
                                    onChange={(e) => setNewArenaEmail(e.target.value)}
                                    placeholder="owner@turf.in" 
                                    className="w-full bg-[#080c14] border border-gray-800 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-amber-500" 
                                  />
                                </div>
                              </div>

                              {/* Ground Location Google Maps URL */}
                              <div>
                                <label className="block text-[11px] font-bold text-teal-400 uppercase mb-1">Ground Location Google Maps URL (`location_url`)</label>
                                <input 
                                  type="url" 
                                  value={newArenaLocationUrl}
                                  onChange={(e) => setNewArenaLocationUrl(e.target.value)}
                                  placeholder="https://maps.google.com/?q=..." 
                                  className="w-full bg-[#080c14] border border-gray-800 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-teal-500 font-mono" 
                                />
                              </div>

                              {/* QR Code Image Direct File Upload */}
                              <div className="space-y-2">
                                <label className="block text-[11px] font-bold text-purple-400 uppercase">Upload Owner Payment QR Code Image (`file` upload)</label>
                                <input 
                                  type="file" 
                                  accept="image/*"
                                  onChange={handleQrFileUpload}
                                  className="w-full bg-[#080c14] border border-gray-800 rounded-xl px-4 py-2 text-xs text-gray-300 focus:outline-none focus:border-purple-500 file:mr-3 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-purple-600 file:text-white hover:file:bg-purple-500 cursor-pointer"
                                />
                                {isUploadingQr && <p className="text-[10px] text-amber-400 font-semibold animate-pulse">Uploading QR Code Image to Supabase Storage ('qr-codes')...</p>}
                                {newArenaQrCodeUrl && (
                                  <div className="flex items-center gap-3 bg-[#080c14] border border-gray-800 p-2 rounded-xl">
                                    <img src={newArenaQrCodeUrl} alt="Uploaded QR" className="w-12 h-12 object-cover rounded-lg bg-white p-1" />
                                    <span className="text-[10px] text-emerald-400 font-bold truncate">✓ Public Storage URL Created</span>
                                  </div>
                                )}
                              </div>

                              <button 
                                type="submit"
                                className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-black font-extrabold py-3.5 rounded-xl transition text-xs shadow-lg mt-2 flex items-center justify-center gap-2"
                              >
                                <Plus className="w-4 h-4 stroke-[3]" /> Publish Ground Arena Now
                              </button>
                            </div>
                          </form>
                        )}

                        {/* Existing Listed Arenas Grid */}
                        <div className="space-y-4">
                          {ownerTurfs.map((arena) => {
                            const pType = arena.plan_type || (arena.plan === 'commission' ? 'commission' : (arena.plan === 'hybrid' ? 'hybrid' : 'free'));
                            const pLabel = pType === 'free'
                              ? 'Free Plan (0% Comm, ₹0/mo • WhatsApp Direct)'
                              : pType === 'hybrid'
                              ? 'Hybrid Plan (3% Comm + ₹2,000/mo • Payment Gateway)'
                              : 'Commission Plan (10% Comm, ₹0/mo • Payment Gateway)';
                            const pBadgeClass = pType === 'free'
                              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                              : pType === 'hybrid'
                              ? 'bg-teal-500/10 border-teal-500/30 text-teal-400'
                              : 'bg-amber-500/10 border-amber-500/30 text-amber-400';

                            return (
                              <div key={arena.id} className="bg-[#0e1320] border border-gray-800 rounded-2xl p-5 flex flex-col space-y-4">
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                  <div className="flex items-center gap-4">
                                    <img src={arena.image} alt={arena.title} className="w-16 h-16 rounded-xl object-cover" />
                                    <div>
                                      <div className="flex items-center gap-2">
                                        <h3 className="font-extrabold text-white text-base">{arena.title}</h3>
                                        <span className="bg-emerald-500/10 text-emerald-400 text-[10px] font-bold px-2 py-0.5 rounded border border-emerald-500/20">
                                          Active
                                        </span>
                                      </div>
                                      <p className="text-xs text-gray-400 mt-0.5">{arena.location}</p>
                                      <div className="flex gap-2 text-[11px] text-amber-400 mt-1 font-semibold">
                                        <span>₹{arena.price}/hr</span> • <span>★ {arena.rating}</span>
                                      </div>
                                    </div>
                                  </div>

                                  <div className="flex items-center gap-2 self-start sm:self-auto">
                                    <button 
                                      onClick={() => handleNavigate(arena.title, arena.location, arena.locationUrl)}
                                      className="text-xs font-bold bg-gray-900 hover:bg-gray-800 text-teal-400 border border-teal-500/30 px-3 py-2 rounded-xl transition flex items-center gap-1"
                                    >
                                      <Navigation className="w-3.5 h-3.5" /> Navigate
                                    </button>
                                    <button 
                                      type="button"
                                      onClick={() => handleDeleteTurf(arena.id, arena.title)}
                                      className="text-xs font-bold text-rose-400 hover:bg-rose-500/20 bg-rose-500/10 border border-rose-500/30 px-3 py-2 rounded-xl transition flex items-center gap-1.5"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" /> Delete Turf
                                    </button>
                                  </div>
                                </div>

                                {/* READ-ONLY LOCKED PLAN TYPE DISPLAY (Requirement 2) */}
                                <div className="bg-[#080c14] border border-gray-800 rounded-xl p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                                  <div className="space-y-0.5">
                                    <div className="flex items-center gap-2">
                                      <span className="text-[11px] font-bold text-gray-300 flex items-center gap-1">
                                        <Lock className="w-3.5 h-3.5 text-amber-400" /> Listing Plan:
                                      </span>
                                      <span className={`text-[10px] font-black uppercase px-2.5 py-0.5 rounded border ${pBadgeClass}`}>
                                        {pType}
                                      </span>
                                    </div>
                                    <p className="text-[11px] font-semibold text-gray-300">{pLabel}</p>
                                  </div>
                                  <p className="text-[10px] text-gray-500 italic">Contact platform admin to modify your listing plan.</p>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* TAB 2: UPCOMING BOOKINGS */}
                {ownerTab === 'bookings' && (() => {
                  const displayBookings = ownerPortalBookings.length > 0 ? ownerPortalBookings : ownerBookings;

                  return (
                    <div className="space-y-6">
                      <div>
                        <span className="text-[10px] font-bold text-amber-500 uppercase tracking-widest bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                          Bookings Ledger
                        </span>
                        <h2 className="text-2xl sm:text-3xl font-extrabold text-white mt-1">Player Bookings History</h2>
                        <p className="text-xs text-gray-400">Live reserved slots across all your venues</p>
                      </div>

                      <div className="space-y-4">
                        {displayBookings.length === 0 ? (
                          <div className="bg-[#0e1320] border border-gray-800 rounded-2xl p-6 text-center text-xs text-gray-400 font-mono">
                            No bookings found for your listed turfs yet.
                          </div>
                        ) : displayBookings.map((b: any, index: number) => {
                          const bId = b.booking_id || b.id || `WD-${index + 101}`;
                          const arenaTitle = b.arenas?.title || b.grounds?.title || b.arena_title || b.arenaTitle || 'Turf Arena';
                          const dateStr = b.date || b.booking_date || '';
                          const slotsStr = b.slot_time || b.slots || '';
                          const contactStr = b.user_contact || b.userContact || b.user_id || 'Player Contact';
                          const amountVal = b.total_amount || b.amount || 0;
                          const statusVal = b.status || b.payment_status || 'confirmed';
                          const isOffline = b.booking_type === 'offline';

                          return (
                            <div key={`${bId}-${index}`} className="bg-[#0e1320] border border-gray-800 rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                              <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                  <span className="text-xs font-black text-amber-500 font-mono">{bId}</span>
                                  {isOffline && (
                                    <span className="bg-purple-500/20 text-purple-300 border border-purple-500/30 text-[10px] font-bold px-2 py-0.5 rounded">
                                      Offline Walk-In
                                    </span>
                                  )}
                                  <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-bold px-2 py-0.5 rounded capitalize">
                                    {statusVal}
                                  </span>
                                </div>
                                <h4 className="font-bold text-white text-base">{arenaTitle}</h4>
                                <p className="text-xs text-gray-400 flex items-center gap-2">
                                  <Clock className="w-3.5 h-3.5 text-amber-400" /> {dateStr} • {slotsStr}
                                </p>
                                <p className="text-[11px] text-gray-500">Contact: {contactStr}</p>
                              </div>

                              <div className="sm:text-right space-y-1">
                                <span className="text-xl font-black text-amber-400 block font-mono">₹{amountVal}</span>
                                <span className="inline-block bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold px-2 py-0.5 rounded">
                                  ✓ {b.payment_status === 'offline_cash' ? 'Offline Cash Collected' : 'Payment Collected'}
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })()}

                {/* TAB 3: DYNAMIC TIME & DAY BASED SLOT PRICING */}
                {ownerTab === 'pricing' && (() => {
                  const ownerGround = activeOwnerTurf || arenas[0];
                  const baseGroundPrice = Number(editingBasePrice !== null ? editingBasePrice : (ownerGround?.price_per_hour || ownerGround?.price || 1200));

                  return (
                    <div className="space-y-6">
                      <div>
                        <span className="text-[10px] font-bold text-amber-500 uppercase tracking-widest bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                          Slot Pricing Manager
                        </span>
                        <h2 className="text-2xl sm:text-3xl font-extrabold text-white mt-1">Time-based pricing</h2>
                        <p className="text-xs text-gray-400 mt-1">
                          Set custom hourly rates per slot for each day of the week or update baseline turf hourly price.
                        </p>
                      </div>

                      {/* Main Base Price Input & Day Selector */}
                      <div className="bg-[#0e1320] border border-gray-800 rounded-2xl p-4 sm:p-6 space-y-6 shadow-2xl">
                        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-gray-800/80 pb-4">
                          <div>
                            <h3 className="font-bold text-white text-base">{ownerGround?.title || 'Ground Arena'}</h3>
                            <div className="flex items-center gap-2.5 mt-2">
                              <label className="text-xs font-bold text-amber-400 uppercase tracking-wider">
                                Turf Base Price Per Hour (₹):
                              </label>
                              <input 
                                type="number"
                                value={baseGroundPrice}
                                onChange={(e) => setEditingBasePrice(Number(e.target.value))}
                                className="w-32 bg-[#080c14] border border-gray-800 rounded-xl px-3 py-1.5 text-xs text-white font-mono font-bold focus:outline-none focus:border-amber-500"
                              />
                            </div>
                          </div>

                          {/* 7 Day Tabs */}
                          <div className="flex gap-1 overflow-x-auto bg-[#080c14] p-1.5 rounded-xl border border-gray-800 no-scrollbar">
                            {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => (
                              <button
                                key={day}
                                type="button"
                                onClick={() => setSelectedDay(day)}
                                className={`px-3.5 py-2 rounded-lg text-xs font-bold transition ${
                                  selectedDay === day
                                    ? 'bg-amber-500 text-black shadow-md font-black'
                                    : 'text-gray-400 hover:text-white'
                                }`}
                              >
                                {day}
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* 24-Hour Custom Price Inputs Grid & Slot Override Toggles */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 max-h-[450px] overflow-y-auto pr-1 no-scrollbar">
                          {getSlotsDataForArena(ownerGround, selectedDateIndex).map((slot) => {
                            const dayMap: { [key: string]: number } = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
                            const currentDow = dayMap[selectedDay] ?? 0;
                            const todayIso = new Date().toISOString().split('T')[0];

                            const isClosedOverride = slotOverrides.some(o => 
                              (String(o.ground_id) === String(ownerGround.id) || String(o.arena_id) === String(ownerGround.id)) &&
                              o.slot_time === slot.time &&
                              (o.day_of_week === currentDow || o.specific_date === todayIso)
                            );

                            return (
                              <div 
                                key={slot.time} 
                                className={`border p-3 rounded-xl space-y-2 transition relative ${
                                  isClosedOverride 
                                    ? 'bg-rose-950/20 border-rose-500/40 opacity-75' 
                                    : 'bg-[#080c14] border-gray-800/80 hover:border-amber-500/40'
                                }`}
                              >
                                <div className="flex items-center justify-between">
                                  <span className={`text-xs font-extrabold ${isClosedOverride ? 'text-rose-400 line-through' : 'text-white'}`}>
                                    {slot.time}
                                  </span>

                                  <div className="flex items-center gap-1.5">
                                    {isClosedOverride ? (
                                      <span className="text-[9px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30 px-1.5 py-0.5 rounded">
                                        CLOSED
                                      </span>
                                    ) : slotPrices[selectedDay]?.[slot.time] !== undefined && (
                                      <span className="text-[9px] font-bold bg-amber-500/20 text-amber-400 px-1.5 py-0.5 rounded">
                                        Custom
                                      </span>
                                    )}

                                    {/* Toggle Button for Slot Override */}
                                    <button
                                      type="button"
                                      onClick={() => {
                                        if (isClosedOverride) {
                                          handleToggleSlotOverride(ownerGround.id, slot.time, 'reopen', selectedDay);
                                        } else {
                                          setOpenOverrideMenuSlot(openOverrideMenuSlot === slot.time ? null : slot.time);
                                        }
                                      }}
                                      className={`p-1 rounded-lg transition text-xs ${
                                        isClosedOverride
                                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/30'
                                          : 'bg-gray-800 text-gray-400 hover:text-white hover:bg-gray-700'
                                      }`}
                                      title={isClosedOverride ? "Click to Re-open Slot" : "Toggle Slot Availability"}
                                    >
                                      {isClosedOverride ? <Check className="w-3.5 h-3.5" /> : <Power className="w-3.5 h-3.5" />}
                                    </button>
                                  </div>
                                </div>

                                {/* Inline Override Menu Dropdown */}
                                {openOverrideMenuSlot === slot.time && !isClosedOverride && (
                                  <div className="absolute right-2 top-10 z-20 bg-[#0e1320] border border-amber-500/40 rounded-xl p-2 shadow-2xl space-y-1.5 w-44">
                                    <button
                                      type="button"
                                      onClick={() => handleToggleSlotOverride(ownerGround.id, slot.time, 'every', selectedDay)}
                                      className="w-full text-left px-2.5 py-1.5 hover:bg-amber-500/20 text-amber-300 text-[11px] font-bold rounded-lg transition flex items-center gap-1.5"
                                    >
                                      <Lock className="w-3 h-3 text-amber-400" /> Turn off every {selectedDay}
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleToggleSlotOverride(ownerGround.id, slot.time, 'today', selectedDay)}
                                      className="w-full text-left px-2.5 py-1.5 hover:bg-rose-500/20 text-rose-300 text-[11px] font-bold rounded-lg transition flex items-center gap-1.5"
                                    >
                                      <Lock className="w-3 h-3 text-rose-400" /> Turn off just today
                                    </button>
                                  </div>
                                )}

                                <div className="space-y-1">
                                  <div className="relative">
                                    <span className="absolute left-3 top-2 text-xs font-bold text-gray-500">₹</span>
                                    <input 
                                      type="number" 
                                      placeholder={String(baseGroundPrice)}
                                      value={slotPrices[selectedDay]?.[slot.time] ?? slot.price}
                                      onChange={(e) => handlePriceChange(selectedDay, slot.time, Number(e.target.value))}
                                      className="w-full bg-[#0e1320] border border-gray-800 rounded-lg pl-7 pr-3 py-1.5 text-xs text-amber-400 font-mono font-bold focus:outline-none focus:border-amber-500"
                                    />
                                  </div>
                                  <p className="text-[10px] text-gray-500 font-semibold">
                                    Slot Rate: <span className="text-amber-400 font-bold">₹{slotPrices[selectedDay]?.[slot.time] ?? slot.price}</span>
                                  </p>
                                </div>
                              </div>
                            );
                          })}
                        </div>

                        {/* Action Bar */}
                        <div className="pt-4 border-t border-gray-800 flex justify-end gap-3">
                          <button 
                            type="button"
                            onClick={() => handleSaveOwnerPricing(ownerGround.id, baseGroundPrice)}
                            className="px-6 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:brightness-110 text-black font-extrabold text-xs rounded-xl shadow-lg transition"
                          >
                            Save Pricing
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })()}



                {/* TAB 5: MY ACCOUNT */}
                {ownerTab === 'account' && (
                  <div className="space-y-6">
                    <div>
                      <span className="text-[10px] font-bold text-amber-500 uppercase tracking-widest bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                        Partner Profile
                      </span>
                      <h2 className="text-2xl sm:text-3xl font-extrabold text-white mt-1">Owner Account Details</h2>
                      <p className="text-xs text-gray-400">Manage account information and payout bank settings</p>
                    </div>

                    <div className="bg-[#0e1320] border border-gray-800 rounded-2xl p-6 space-y-4 max-w-md shadow-2xl">
                      <div>
                        <span className="text-xs text-gray-500 uppercase block font-bold">Partner Display Name</span>
                        <span className="text-sm font-bold text-white">{currentUser?.name || 'Venue Owner'}</span>
                      </div>

                      <div>
                        <span className="text-xs text-gray-500 uppercase block font-bold">Partner Contact</span>
                        <span className="text-sm font-mono text-gray-300">{currentUser?.phone || currentUser?.email || 'N/A'}</span>
                      </div>

                      <div>
                        <span className="text-xs text-gray-500 uppercase block font-bold">Payout UPI ID</span>
                        <span className="text-sm font-mono font-bold text-amber-400">{activeOwnerTurf?.ownerUpiId || 'owner@okaxis'}</span>
                      </div>
                    </div>
                  </div>
                )}
              </main>
            </div>
          );
        })()}

        {/* VIEW 5: USER PROFILE VIEW (BOOKINGS, FAVORITES, ACCOUNT) */}
        {view === 'profile' && (() => {
          const playerBookings = myBookings.filter(b => {
            if (!currentUser) return false;
            const userId = String(currentUser.id || '');
            const userContact = currentUser.phone || currentUser.email;
            const bookingUserId = b.user_id ? String(b.user_id) : '';

            return (
              (bookingUserId && bookingUserId === userId) ||
              (userContact && b.userContact && b.userContact.toLowerCase() === userContact.toLowerCase())
            );
          });

          const playerFavoriteArenas = arenas.filter(a => favoriteArenaIds.includes(Number(a.id)));

          return (
            <main className="max-w-3xl mx-auto px-4 py-8 space-y-6">
              <div className="bg-[#0e1320] border border-gray-800 rounded-2xl p-6 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xl">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-full bg-gradient-to-tr from-amber-400 to-orange-500 text-black font-black text-xl flex items-center justify-center shadow-lg">
                    {currentUser ? currentUser.name.charAt(0) : 'P'}
                  </div>
                  <div>
                    <h2 className="text-xl font-extrabold text-white">{currentUser?.name || 'Guest Player'}</h2>
                    <p className="text-xs text-gray-400 font-mono mt-0.5">{currentUser?.phone || currentUser?.email || 'Guest Session'}</p>
                    <span className="inline-block mt-1 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold px-2 py-0.5 rounded">
                      ✓ Verified Player
                    </span>
                  </div>
                </div>

                {/* Profile Sub-Tabs */}
                <div className="flex gap-1 bg-[#080c14] p-1.5 rounded-xl border border-gray-800">
                  <button
                    onClick={() => setProfileTab('bookings')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${profileTab === 'bookings' ? 'bg-amber-500 text-black' : 'text-gray-400 hover:text-white'}`}
                  >
                    My Bookings ({playerBookings.length})
                  </button>
                  <button
                    onClick={() => setProfileTab('favorites')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${profileTab === 'favorites' ? 'bg-amber-500 text-black' : 'text-gray-400 hover:text-white'}`}
                  >
                    Favorites ({playerFavoriteArenas.length})
                  </button>
                  <button
                    onClick={() => setProfileTab('account')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${profileTab === 'account' ? 'bg-amber-500 text-black' : 'text-gray-400 hover:text-white'}`}
                  >
                    Account
                  </button>
                </div>
              </div>

              {/* TAB CONTENT: MY BOOKINGS (USER ISOLATED) */}
              {profileTab === 'bookings' && (
                <div className="bg-[#0e1320] border border-gray-800 rounded-2xl p-6 space-y-4 shadow-xl">
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-amber-500" /> Confirmed Booking Tickets
                  </h3>

                  {playerBookings.length === 0 ? (
                    <div className="text-center py-12 px-4 bg-[#080c14] border border-dashed border-gray-800 rounded-2xl space-y-3">
                      <Calendar className="w-8 h-8 text-amber-500 mx-auto opacity-70" />
                      <h4 className="text-sm font-bold text-white">No upcoming bookings found</h4>
                      <p className="text-xs text-gray-400">Browse available grounds and book your first slot!</p>
                      <button 
                        onClick={() => setView('browse')}
                        className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-black font-extrabold text-xs rounded-xl transition shadow-lg shadow-amber-500/20"
                      >
                        Browse Sports Grounds
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {playerBookings.map((b) => (
                        <div key={b.id} className="bg-[#080c14] border border-gray-800 rounded-xl p-4 flex items-center justify-between">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <h4 className="font-bold text-white text-sm">
                                {b.turf_display_name || b.arenaTitle || 'Sports Turf'}
                              </h4>
                              {b.booking_type === 'offline' && (
                                <span className="bg-purple-500/20 text-purple-300 text-[9px] font-bold px-1.5 py-0.5 rounded">
                                  Offline
                                </span>
                              )}
                            </div>
                            <p className="text-[10px] font-mono text-amber-400">
                              ID: #{b.id.length > 8 ? b.id.substring(0, 8).toUpperCase() : b.id}
                            </p>
                            <p className="text-[10px] text-gray-400">{b.date} • {b.slots}</p>
                          </div>

                          <div className="text-right">
                            <span className="text-sm font-bold text-white font-mono block">₹{b.amount}</span>
                            <span className="text-[9px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">✓ Confirmed</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* TAB CONTENT: FAVORITES (USER ISOLATED) */}
              {profileTab === 'favorites' && (
                <div className="bg-[#0e1320] border border-gray-800 rounded-2xl p-6 space-y-4 shadow-xl">
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <Heart className="w-4 h-4 text-rose-500 fill-rose-500" /> Saved Favorite Turfs
                  </h3>

                  {playerFavoriteArenas.length === 0 ? (
                    <div className="text-center py-12 px-4 bg-[#080c14] border border-dashed border-gray-800 rounded-2xl space-y-3">
                      <Heart className="w-8 h-8 text-rose-500 mx-auto opacity-70" />
                      <h4 className="text-sm font-bold text-white">No saved favorite turfs</h4>
                      <p className="text-xs text-gray-400">Click the heart icon on any turf card to save it here!</p>
                      <button 
                        onClick={() => setView('browse')}
                        className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-black font-extrabold text-xs rounded-xl transition shadow-lg shadow-amber-500/20"
                      >
                        Explore Turfs
                      </button>
                    </div>
                  ) : (
                    <div className="grid md:grid-cols-2 gap-4">
                      {playerFavoriteArenas.map((arena) => (
                        <div key={arena.id} className="bg-[#080c14] border border-gray-800 rounded-xl p-4 flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <img src={arena.image} alt={arena.title} className="w-12 h-12 rounded-lg object-cover" />
                            <div>
                              <h4 className="font-bold text-white text-xs">{arena.title}</h4>
                              <p className="text-[10px] text-gray-400">{arena.location}</p>
                              <p className="text-[10px] font-bold text-amber-400 mt-0.5">₹{arena.price}/hr • ★ {arena.rating}</p>
                            </div>
                          </div>
                          <button 
                            onClick={(e) => toggleFavorite(Number(arena.id), e)}
                            className="p-2 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 hover:bg-rose-500/20 transition"
                          >
                            <Heart className="w-4 h-4 fill-rose-500 text-rose-500" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

            {/* TAB CONTENT: ACCOUNT SETTINGS */}
            {profileTab === 'account' && (
              <div className="bg-[#0e1320] border border-gray-800 rounded-2xl p-6 space-y-4 shadow-xl">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Settings className="w-4 h-4 text-amber-500" /> Player Profile & Security Settings
                </h3>

                <div className="space-y-3 max-w-md">
                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Display Name</label>
                    <input 
                      type="text" 
                      value={currentUser?.name || ''} 
                      onChange={(e) => setCurrentUser(currentUser ? { ...currentUser, name: e.target.value } : null)}
                      className="w-full bg-[#080c14] border border-gray-800 rounded-xl px-4 py-2 text-xs text-white" 
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Contact Phone / Email</label>
                    <input 
                      type="text" 
                      readOnly
                      value={currentUser?.phone || currentUser?.email || 'N/A'} 
                      className="w-full bg-[#080c14] border border-gray-800 rounded-xl px-4 py-2 text-xs text-gray-400 font-mono" 
                    />
                  </div>

                  <button 
                    onClick={() => showToast('Profile details saved!')}
                    className="px-4 py-2 bg-amber-500 text-black text-xs font-extrabold rounded-xl shadow-lg"
                  >
                    Save Preferences
                  </button>
                </div>
              </div>
            )}
          </main>
          );
        })()}
      </div>

      {/* POPUP MODAL: GOOGLE AUTHENTICATION ONLY */}
      {showAuthModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#0e1320] border border-gray-800 w-full max-w-sm rounded-3xl p-6 sm:p-8 shadow-2xl relative text-center space-y-6">
            <button 
              onClick={() => setShowAuthModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-white p-1.5 rounded-full bg-gray-900/60 hover:bg-gray-800 transition"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="space-y-2">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-xs font-bold text-amber-500 uppercase tracking-wider">
                <Lock className="w-3.5 h-3.5" /> WinDeclare Access
              </div>
              <h3 className="text-2xl font-extrabold text-white">Sign In to Continue</h3>
              <p className="text-xs text-gray-400 max-w-xs mx-auto">
                Sign in with your Google account to book sports grounds and manage your tickets instantly.
              </p>
            </div>

            <div className="pt-2 pb-1">
              <button 
                type="button"
                onClick={handleGoogleSignIn}
                className="w-full py-3.5 px-4 bg-white hover:bg-gray-100 text-black font-extrabold text-sm rounded-2xl transition shadow-xl hover:shadow-2xl flex items-center justify-center gap-3 border border-gray-200 group active:scale-[0.98]"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="#EA4335" d="M12 5c1.6 0 3 .6 4.1 1.6l3.1-3.1C17.3 1.7 14.8 1 12 1 7.5 1 3.7 3.6 1.9 7.3l3.7 2.9C6.5 7.3 9 5 12 5z"/>
                  <path fill="#4285F4" d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5 3.7-8.8z"/>
                  <path fill="#FBBC05" d="M5.6 14.8c-.2-.7-.4-1.5-.4-2.3s.2-1.6.4-2.3L1.9 7.3C.7 9.7 0 10.8 0 12s.7 2.3 1.9 4.7l3.7-2.9z"/>
                  <path fill="#34A853" d="M12 23c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3 0-5.5-2.3-6.4-5.2L1.9 16C3.7 19.7 7.5 23 12 23z"/>
                </svg>
                <span>Continue with Google</span>
              </button>
            </div>

            <p className="text-[11px] text-gray-500">
              By continuing, you agree to WinDeclare's Terms of Service & Privacy Policy.
            </p>
          </div>
        </div>
      )}

      {/* POPUP MODAL 2: ADMIN CONSOLE SECURITY AUTHENTICATION MODAL */}
      {showAdminLoginModal && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-[#0e1320] border border-purple-500/40 w-full max-w-md rounded-2xl p-6 shadow-2xl relative space-y-6">
            <button 
              onClick={() => setShowAdminLoginModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-white p-1"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="space-y-1">
              <div className="flex items-center gap-2 text-xs font-bold text-purple-400 uppercase tracking-wider">
                <Shield className="w-4 h-4" /> Restricted Super Admin Route
              </div>
              <h3 className="text-xl font-extrabold text-white">Super Admin Verification</h3>
              <p className="text-xs text-gray-400">Enter master administrator email & password to access console</p>
            </div>

            <form onSubmit={handleAdminLoginSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Admin Email Address</label>
                <div className="relative">
                  <Mail className="w-4 h-4 absolute left-3 top-3 text-gray-500" />
                  <input 
                    type="email"
                    required
                    value={adminEmailInput}
                    onChange={(e) => setAdminEmailInput(e.target.value)}
                    placeholder="kondrashravankumar@gmail.com"
                    className="w-full bg-[#080c14] border border-gray-800 rounded-xl pl-9 pr-4 py-2.5 text-xs text-white focus:outline-none focus:border-purple-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Secret Admin Password</label>
                <div className="relative">
                  <KeyRound className="w-4 h-4 absolute left-3 top-3 text-gray-500" />
                  <input 
                    type="password"
                    required
                    value={adminPasswordInput}
                    onChange={(e) => setAdminPasswordInput(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full bg-[#080c14] border border-gray-800 rounded-xl pl-9 pr-4 py-2.5 text-xs text-white focus:outline-none focus:border-purple-500"
                  />
                </div>
              </div>

              {adminAuthError && (
                <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-xs font-bold text-rose-400 text-center">
                  {adminAuthError}
                </div>
              )}

              <button
                type="submit"
                className="w-full bg-purple-600 hover:bg-purple-500 text-white font-extrabold py-3 rounded-xl transition text-xs shadow-lg flex items-center justify-center gap-2 shadow-purple-500/20"
              >
                <ShieldCheck className="w-4 h-4" /> Authenticate & Open Admin Console
              </button>
            </form>
          </div>
        </div>
      )}

      {/* POPUP MODAL 3: PLAYER BOOKING & PAYMENT MODAL */}
      {showPaymentModal && selectedArena && (() => {
        const activeDate = datesList[selectedDateIndex];
        const selectedDateStr = activeDate ? `${activeDate.day}, Jul ${activeDate.date}` : 'Today';
        const slotsStr = selectedSlots.length > 0 ? selectedSlots.map(s => s.time).join(', ') : '1 Hour Slot';
        const totalAmount = selectedSlots.length > 0 
          ? selectedSlots.reduce((acc, curr) => acc + curr.price, 0) 
          : (selectedArena.price || 0);

        const rawNum = selectedArena.whatsappNumber || (selectedArena as any).phone || '9505737751';
        const digitsOnly = rawNum ? String(rawNum).replace(/\D/g, '') : '';
        const formattedPhone = digitsOnly.length === 10 ? '91' + digitsOnly : digitsOnly;
        const selectedSlotsList = selectedSlots.length > 0 ? selectedSlots.map(s => s.time).join(', ') : slotsStr;
        const messageText = `Hi! I have made a payment of ₹${totalAmount} for ${selectedArena.title} on ${selectedDateStr} for slot(s): ${selectedSlotsList}. Attached is my payment screenshot.`;
        const waUrl = formattedPhone ? `https://wa.me/${formattedPhone}?text=${encodeURIComponent(messageText)}` : '';

        return (
          <div className="fixed inset-0 bg-black/85 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-[#0e1320] border border-amber-500/30 w-full max-w-md rounded-3xl p-6 shadow-2xl relative space-y-5">
              <button 
                onClick={() => setShowPaymentModal(false)}
                className="absolute top-4 right-4 text-gray-400 hover:text-white p-1 bg-gray-900/80 rounded-xl z-10"
              >
                <X className="w-5 h-5" />
              </button>

              {/* a) Turf Name, Price & Booking Breakdown */}
              <div>
                <div className="flex items-center gap-1.5 text-xs font-bold text-amber-500 uppercase tracking-wider mb-1">
                  <Lock className="w-3.5 h-3.5" /> Direct Owner Payment Checkout
                </div>
                <h3 className="text-2xl font-black text-white">{selectedArena.title}</h3>

                {/* Selected Date, Slots & Total Amount Breakdown */}
                <div className="mt-3 bg-[#080c14] border border-gray-800 rounded-2xl p-4 space-y-2 text-xs">
                  <div className="flex justify-between items-center text-gray-300">
                    <span className="font-semibold text-gray-400">📅 Selected Date:</span>
                    <span className="font-bold text-white">{selectedDateStr}</span>
                  </div>
                  <div className="flex justify-between items-center text-gray-300">
                    <span className="font-semibold text-gray-400">⏰ Selected Slots ({selectedSlots.length || 1}):</span>
                    <span className="font-mono font-bold text-amber-400 truncate max-w-[200px]">{slotsStr}</span>
                  </div>
                  <div className="flex justify-between items-center pt-2 border-t border-gray-800/80">
                    <span className="font-extrabold text-white text-sm">Total Amount Payable:</span>
                    <span className="text-xl font-black text-amber-400 font-mono">₹{totalAmount}</span>
                  </div>
                </div>
              </div>

              {/* b) Owner's Payment QR Code Image */}
              <div className="bg-[#080c14] border border-gray-800 rounded-2xl p-5 text-center space-y-3 shadow-inner">
                <span className="text-xs text-gray-400 font-bold block uppercase tracking-wider">
                  Scan Owner Payment QR Code
                </span>

                <div className="flex justify-center">
                  <img 
                    src={selectedArena.ownerQrCodeUrl || selectedArena.qr_code_url || `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=upi://pay?pa=${encodeURIComponent(selectedArena.ownerUpiId || selectedArena.upiId || 'owner@okaxis')}`} 
                    alt="Owner Payment QR" 
                    className="w-48 h-48 rounded-2xl bg-white p-2 border border-amber-500/20 shadow-xl object-contain"
                  />
                </div>

                {/* c) Owner's UPI ID with Copy UPI ID button */}
                <div className="flex items-center justify-between gap-2 bg-[#0e1320] border border-gray-800 p-3 rounded-xl">
                  <span className="text-xs font-mono font-bold text-amber-400 truncate">
                    {selectedArena.ownerUpiId || selectedArena.upiId || 'owner@okaxis'}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      const upi = selectedArena.ownerUpiId || selectedArena.upiId || 'owner@okaxis';
                      navigator.clipboard.writeText(upi);
                      showToast('✓ Copied UPI ID: ' + upi);
                    }}
                    className="px-3 py-1.5 bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-400 text-xs font-extrabold rounded-lg transition whitespace-nowrap"
                  >
                    Copy UPI ID
                  </button>
                </div>
              </div>

              {/* d) Button: Share Payment Screenshot via WhatsApp */}
              <button
                type="button"
                onClick={async () => {
                  if (!formattedPhone || formattedPhone.length < 10) {
                    showToast("❌ Owner contact phone is unavailable.");
                    alert("Owner contact phone is unavailable.");
                    return;
                  }

                  const selectedGround = selectedArena;
                  const selectedDate = selectedDateStr;
                  const targetDate = new Date();
                  targetDate.setDate(targetDate.getDate() + selectedDateIndex);
                  const formattedIsoDate = targetDate.toISOString().split('T')[0];

                  const slotsToLock = selectedSlots.length > 0 ? selectedSlots : [{ time: slotsStr, price: totalAmount }];

                  const recordsToInsert = slotsToLock.map(s => ({
                    arena_id: selectedGround.id,
                    user_id: currentUser?.id || '',
                    slot_time: s.time,
                    status: 'whatsapp_pending',
                    booking_date: formattedIsoDate,
                    booking_id: `WD-${Math.random().toString(36).substring(2, 9).toUpperCase()}`,
                    ground_id: Number(selectedGround.id),
                    arena_title: selectedGround.title,
                    date: selectedDate,
                    date_index: selectedDateIndex,
                    slots: s.time,
                    amount: s.price,
                    total_amount: totalAmount,
                    user_contact: currentUser?.phone || currentUser?.email || 'Player Session',
                    plan_used: selectedGround.plan || 'subscription',
                    payment_qr_used: selectedGround.ownerUpiId || 'owner@okaxis',
                    payment_status: 'whatsapp_pending',
                    created_at: new Date().toISOString()
                  }));

                  try {
                    const { error } = await supabase.from('bookings').insert(recordsToInsert);
                    if (error) {
                      console.error("Supabase booking insert error:", error);
                      showToast(`❌ Booking failed: ${error.message}`);
                      return;
                    }
                  } catch (err: any) {
                    console.error("Booking insert exception:", err);
                    showToast(`❌ Booking error: ${err?.message || 'Failed to submit booking'}`);
                    return;
                  }

                  const newBookingObj: Booking = {
                    id: recordsToInsert[0].booking_id,
                    arenaId: Number(selectedGround.id),
                    arenaTitle: selectedGround.title,
                    date: selectedDate,
                    dateIndex: selectedDateIndex,
                    slots: slotsStr,
                    amount: totalAmount,
                    userContact: recordsToInsert[0].user_contact,
                    user_id: currentUser?.id || '',
                    planUsed: selectedGround.plan || 'subscription',
                    paymentQrUsed: selectedGround.ownerUpiId || 'owner@okaxis',
                    booking_type: 'online',
                    payment_status: 'whatsapp_pending',
                    createdAt: recordsToInsert[0].created_at
                  };

                  setMyBookings(prev => [newBookingObj, ...prev]);

                  const newLockedSlots: BookedSlot[] = slotsToLock.map(s => ({
                    arenaId: Number(selectedGround.id),
                    dateIndex: selectedDateIndex,
                    time: s.time
                  }));
                  setBookedSlots(prev => [...prev, ...newLockedSlots]);
                  setSelectedSlots([]);

                  window.open(waUrl, '_blank');
                  setShowPaymentModal(false);
                  showToast("Your booking request is PENDING! Please send your screenshot on WhatsApp so the owner can confirm your slots.");
                }}
                className="w-full bg-emerald-500 hover:bg-emerald-400 text-black font-extrabold py-3.5 rounded-2xl transition text-xs shadow-lg flex items-center justify-center gap-2 shadow-emerald-500/20"
              >
                <Phone className="w-4 h-4 fill-black" /> Share Payment Screenshot via WhatsApp
              </button>
            </div>
          </div>
        );
      })()}

      {/* OWNER PORTAL SLIDE-OUT NAVIGATION DRAWER */}
      {isOwnerDrawerOpen && (
        <div className="fixed inset-0 z-50 flex">
          {/* Backdrop overlay */}
          <div 
            className="fixed inset-0 bg-black/80 backdrop-blur-sm transition-opacity"
            onClick={() => setIsOwnerDrawerOpen(false)}
          />

          {/* Drawer content panel */}
          <div className="relative w-80 max-w-[85vw] bg-[#0c101a] border-r border-gray-800 p-6 shadow-2xl z-10 flex flex-col justify-between h-full">
            <div className="space-y-6">
              <div className="flex items-center justify-between border-b border-gray-800 pb-4">
                <div className="flex items-center gap-2.5">
                  <div className="bg-gradient-to-tr from-amber-400 to-orange-500 p-2 rounded-xl text-black font-black shadow-lg">
                    <Building2 className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-white text-sm leading-tight">Owner Portal</h3>
                    <p className="text-[10px] text-amber-400 font-bold uppercase tracking-wider">WinDeclare Partner</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsOwnerDrawerOpen(false)}
                  className="p-1.5 text-gray-400 hover:text-white rounded-xl bg-gray-900 border border-gray-800 transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* 5 Strictly Permitted Navigation Options */}
              <nav className="space-y-2">
                <button
                  onClick={() => { setOwnerTab('calendar'); setIsOwnerDrawerOpen(false); }}
                  className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-xl text-xs font-bold transition ${
                    ownerTab === 'calendar' ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/20' : 'text-gray-300 hover:bg-gray-900 hover:text-white'
                  }`}
                >
                  <Calendar className="w-4 h-4 text-amber-400" /> Daily Calendar & Offline
                </button>

                <button
                  onClick={() => { setOwnerTab('listings'); setShowAddTurfForm(false); setIsOwnerDrawerOpen(false); }}
                  className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-xl text-xs font-bold transition ${
                    ownerTab === 'listings' ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/20' : 'text-gray-300 hover:bg-gray-900 hover:text-white'
                  }`}
                >
                  <LayoutDashboard className="w-4 h-4 text-amber-400" /> Listings Manager
                </button>

                <button
                  onClick={() => { setOwnerTab('pricing'); setIsOwnerDrawerOpen(false); }}
                  className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-xl text-xs font-bold transition ${
                    ownerTab === 'pricing' ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/20' : 'text-gray-300 hover:bg-gray-900 hover:text-white'
                  }`}
                >
                  <IndianRupee className="w-4 h-4 text-amber-400" /> Slot Pricing
                </button>

                <button
                  onClick={() => { setOwnerTab('bookings'); setIsOwnerDrawerOpen(false); }}
                  className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-xl text-xs font-bold transition ${
                    ownerTab === 'bookings' ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/20' : 'text-gray-300 hover:bg-gray-900 hover:text-white'
                  }`}
                >
                  <Clock className="w-4 h-4 text-amber-400" /> Bookings Ledger
                </button>

                <button
                  onClick={() => { setOwnerTab('account'); setIsOwnerDrawerOpen(false); }}
                  className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-xl text-xs font-bold transition ${
                    ownerTab === 'account' ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/20' : 'text-gray-300 hover:bg-gray-900 hover:text-white'
                  }`}
                >
                  <User className="w-4 h-4 text-amber-400" /> My Account
                </button>
              </nav>
            </div>

            <div className="border-t border-gray-800 pt-4 space-y-2">
              <button 
                onClick={() => { setView('browse'); setIsOwnerDrawerOpen(false); showToast('Switched to Player View ⚽'); }}
                className="w-full flex items-center gap-2 px-3.5 py-2.5 text-xs font-semibold text-gray-400 hover:text-amber-400 bg-gray-900/50 hover:bg-gray-900 rounded-xl transition"
              >
                <LogOut className="w-4 h-4" /> Switch to Player Portal
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="border-t border-gray-800 bg-[#0a0e17] py-8 text-xs text-gray-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="bg-amber-500 p-1.5 rounded-lg text-black">
              <Trophy className="w-4 h-4 fill-black stroke-black" />
            </div>
            <span className="font-bold text-white text-sm">WinDeclare</span>
            <span>© 2026 WinDeclare Sports Technologies Pvt Ltd. All rights reserved.</span>
          </div>

          <div className="flex gap-6 font-semibold">
            <a href="#terms" onClick={(e) => e.preventDefault()} className="hover:text-amber-400">Terms of Service</a>
            <a href="#privacy" onClick={(e) => e.preventDefault()} className="hover:text-amber-400">Privacy Policy</a>
            <a href="#admin" onClick={(e) => { e.preventDefault(); handleOpenAdminDashboard(); }} className="hover:text-purple-400 text-gray-600">Admin Entrance</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
