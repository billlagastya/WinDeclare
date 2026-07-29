'use client';

import React, { useState, useEffect } from 'react';
import { 
  Trophy, User, MapPin, Navigation, ArrowLeft,
  Calendar, CheckCircle2, Phone, ShieldCheck,
  Building2, Plus, LayoutDashboard, ScanLine, IndianRupee,
  LogOut, Mail, Check, Star, Clock, Compass,
  CreditCard, Smartphone, CheckCircle, X, Loader2, Search,
  Heart, Shield, Users, ChevronDown, Settings, Lock, Wallet, KeyRound, Filter
} from 'lucide-react';

import { supabase } from '@/lib/supabaseClient';

interface Arena {
  id: number;
  title: string;
  location: string;
  lat: number;
  lng: number;
  price: number;
  rating: number;
  reviews: number;
  amenities: string[];
  sports: string[];
  image: string;
  locationUrl?: string;
  plan: 'subscription' | 'commission';
  ownerUpiId?: string;
  ownerQrCodeUrl?: string;
  ownerEmail?: string;
}

interface Booking {
  id: string;
  arenaId: number;
  arenaTitle: string;
  date: string;
  dateIndex: number;
  slots: string;
  amount: number;
  userContact: string;
  planUsed: 'subscription' | 'commission';
  paymentQrUsed: string;
  createdAt: string;
}

interface BookedSlot {
  arenaId: number;
  dateIndex: number;
  time: string;
}

interface Profile {
  id: string;
  email: string;
  display_name: string;
  role?: string;
}

export default function WinDeclareApp() {
  const [view, setView] = useState<'browse' | 'arena-details' | 'profile' | 'owner-portal' | 'admin-dashboard'>('browse');
  const [ownerTab, setOwnerTab] = useState<'listings' | 'bookings' | 'pricing' | 'checkin' | 'account'>('listings');
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

  // User Favorites State
  const [favoriteArenaIds, setFavoriteArenaIds] = useState<number[]>([1]);

  // Auth States
  const [currentUser, setCurrentUser] = useState<{ name: string; phone?: string; email?: string; provider: 'phone' | 'google' } | null>(null);
  const [authMode, setAuthMode] = useState<'phone' | 'google'>('google');
  const [showAuthModal, setShowAuthModal] = useState<boolean>(false);
  const [otpSent, setOtpSent] = useState<boolean>(false);
  const [phoneNumber, setPhoneNumber] = useState<string>('');
  const [otpCode, setOtpCode] = useState<string>('');
  const [confirmationResult, setConfirmationResult] = useState<any>(null);

  // Admin Security Access & Settings State
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState<boolean>(false);
  const [showAdminLoginModal, setShowAdminLoginModal] = useState<boolean>(false);
  const [adminEmailInput, setAdminEmailInput] = useState<string>('');
  const [adminPasswordInput, setAdminPasswordInput] = useState<string>('');
  const [adminAuthError, setAdminAuthError] = useState<string | null>(null);
  const [adminTab, setAdminTab] = useState<'owners-subscription' | 'owners-commission' | 'players' | 'turfs' | 'bookings' | 'settings'>('owners-subscription');
  
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

  // Form selections for new venue
  const [newArenaName, setNewArenaName] = useState<string>('');
  const [newArenaLocation, setNewArenaLocation] = useState<string>('');
  const [newArenaPrice, setNewArenaPrice] = useState<number>(1200);
  const [newArenaEmail, setNewArenaEmail] = useState<string>('owner@windeclare.in');
  const [newArenaLocationUrl, setNewArenaLocationUrl] = useState<string>('');
  const [newArenaQrCodeUrl, setNewArenaQrCodeUrl] = useState<string>('');
  const [newArenaPlan, setNewArenaPlan] = useState<'subscription' | 'commission'>('subscription');
  const [newArenaUpiId, setNewArenaUpiId] = useState<string>('');
  const [selectedSports, setSelectedSports] = useState<string[]>(['Cricket', 'Football']);
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>(['Changing Rooms', 'Washrooms', 'Parking']);
  const [gstEligible, setGstEligible] = useState<boolean>(true);

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
      ownerQrCodeUrl: 'https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=upi://pay?pa=akshay.box@okaxis'
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
      ownerQrCodeUrl: 'https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=upi://pay?pa=kelobharat@upi'
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
      ownerQrCodeUrl: 'https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=upi://pay?pa=smashserve@okicici'
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

  // Sync Supabase Auth State & Upsert Profile
  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session?.user) {
        const user = session.user;
        setCurrentUser({
          name: user.user_metadata?.full_name || user.user_metadata?.name || user.email?.split('@')[0] || 'Verified Player',
          email: user.email || undefined,
          phone: user.phone || undefined,
          provider: 'google'
        });
        try {
          await supabase.from('profiles').upsert({
            id: user.id,
            email: user.email,
            display_name: user.user_metadata?.full_name || user.user_metadata?.name || 'Player'
          });
          fetchProfilesFromSupabase();
        } catch (e) {
          console.error("Profile upsert error:", e);
        }
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        const user = session.user;
        setCurrentUser({
          name: user.user_metadata?.full_name || user.user_metadata?.name || user.email?.split('@')[0] || 'Verified Player',
          email: user.email || undefined,
          phone: user.phone || undefined,
          provider: 'google'
        });

        // Upsert user details into `profiles` table
        try {
          await supabase.from('profiles').upsert({
            id: user.id,
            email: user.email,
            display_name: user.user_metadata?.full_name || user.user_metadata?.name || 'Player'
          });
          fetchProfilesFromSupabase();
        } catch (e) {
          console.error("Profile upsert error:", e);
        }
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
          display_name: p.display_name || p.displayName || p.name || 'Player',
          role: p.role || 'Player'
        })));
      }
    } catch (err) {
      console.error("Error fetching profiles from Supabase:", err);
    }
  };

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

  // Fetch initial bookings from Supabase
  useEffect(() => {
    const fetchBookingsFromSupabase = async () => {
      try {
        const { data, error } = await supabase.from('bookings').select('*').order('created_at', { ascending: false });
        if (!error && data && data.length > 0) {
          const mapped: Booking[] = data.map((item: any) => ({
            id: item.booking_id || item.id || `WD-${Math.random().toString(36).substring(2, 9).toUpperCase()}`,
            arenaId: item.arena_id || item.arenaId || 1,
            arenaTitle: item.arena_title || item.arenaTitle || 'Arena',
            date: item.date || '',
            dateIndex: item.date_index ?? item.dateIndex ?? 0,
            slots: item.slots || '',
            amount: item.amount || 0,
            userContact: item.user_contact || item.userContact || '',
            planUsed: item.plan_used || item.planUsed || 'subscription',
            paymentQrUsed: item.payment_qr_used || item.paymentQrUsed || '',
            createdAt: item.created_at || item.createdAt || ''
          }));
          setMyBookings(prev => {
            const combined = [...mapped];
            prev.forEach(p => {
              if (!combined.some(c => c.id === p.id)) combined.push(p);
            });
            return combined;
          });
        }
      } catch (e) {
        console.error("Supabase initial fetch bookings error:", e);
      }
    };
    fetchBookingsFromSupabase();
  }, []);

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

  const datesList = [
    { day: 'TUE', date: '28' },
    { day: 'WED', date: '29' },
    { day: 'THU', date: '30' },
    { day: 'FRI', date: '31' },
    { day: 'SAT', date: '1' },
    { day: 'SUN', date: '2' },
    { day: 'MON', date: '3' }
  ];

  const slotsData = [
    { time: '12:00 AM', price: 323 },
    { time: '1:00 AM', price: 323 },
    { time: '2:00 AM', price: 323 },
    { time: '3:00 AM', price: 323 },
    { time: '4:00 AM', price: 323 },
    { time: '5:00 AM', price: 323 },
    { time: '6:00 AM', price: 323 },
    { time: '7:00 AM', price: 323 },
    { time: '8:00 AM', price: 323 },
    { time: '9:00 AM', price: 323 },
    { time: '10:00 AM', price: 323 },
    { time: '11:00 AM', price: 323 },
    { time: '12:00 PM', price: 323 },
    { time: '1:00 PM', price: 323 },
    { time: '2:00 PM', price: 323 },
    { time: '3:00 PM', price: 323 },
    { time: '4:00 PM', price: 323 },
    { time: '5:00 PM', price: 404 },
    { time: '6:00 PM', price: 404 },
    { time: '7:00 PM', price: 404 },
    { time: '8:00 PM', price: 404 },
    { time: '9:00 PM', price: 404 },
    { time: '10:00 PM', price: 323 },
    { time: '11:00 PM', price: 323 }
  ];

  const toggleFavorite = (arenaId: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (favoriteArenaIds.includes(arenaId)) {
      setFavoriteArenaIds(favoriteArenaIds.filter(id => id !== arenaId));
      showToast('Removed from favorites');
    } else {
      setFavoriteArenaIds([...favoriteArenaIds, arenaId]);
      showToast('Added to favorites ❤️');
    }
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

  // SUPABASE AUTH GOOGLE SIGN-IN
  const handleGoogleSignIn = async () => {
    try {
      const origin = typeof window !== 'undefined' ? window.location.origin : '';
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${origin}`
        }
      });
      if (error) throw error;
      setShowAuthModal(false);
    } catch (err: any) {
      console.error("Supabase Google Sign In Error:", err);
      const fallbackUser = {
        name: 'Google Player',
        email: 'user.google@gmail.com',
        provider: 'google' as const
      };
      setCurrentUser(fallbackUser);
      setShowAuthModal(false);
      showToast('Signed in via Google');
      if (selectedSlots.length > 0) {
        setShowPaymentModal(true);
      }
    }
  };

  // PHONE OTP SEND
  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (phoneNumber.length >= 10) {
      const formattedPhone = phoneNumber.startsWith('+') ? phoneNumber : `+91${phoneNumber}`;
      setOtpSent(true);
      showToast(`OTP Code sent to ${formattedPhone}`);
    } else {
      alert('Please enter a valid 10-digit mobile number');
    }
  };

  // PHONE OTP VERIFICATION
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otpCode.length >= 4) {
      const newUser = {
        name: 'Verified Player',
        phone: `+91 ${phoneNumber}`,
        provider: 'phone' as const
      };
      setCurrentUser(newUser);
      setShowAuthModal(false);
      showToast('Mobile number verified!');
      if (selectedSlots.length > 0) {
        setShowPaymentModal(true);
      }
    } else {
      alert('Please enter a valid OTP code');
    }
  };

  // STRICT GATEKEEPER: Check authentication before opening checkout
  const handleInitiateCheckout = () => {
    if (selectedSlots.length === 0) {
      alert('Please select at least 1 time slot to proceed!');
      return;
    }

    if (!currentUser) {
      setShowAuthModal(true);
      showToast('🔒 Please sign in to book your slot!');
      return;
    }

    setShowPaymentModal(true);
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
    const newBooking: Booking = {
      id: `WD-${Math.random().toString(36).substring(2, 9).toUpperCase()}`,
      arenaId: selectedArena.id,
      arenaTitle: selectedArena.title,
      date: `${activeDate.day}, Jul ${activeDate.date}`,
      dateIndex: selectedDateIndex,
      slots: selectedSlots.map(s => s.time).join(', '),
      amount: totalPrice,
      userContact: currentUser?.phone || currentUser?.email || '+91 9505737751',
      planUsed: selectedArena.plan,
      paymentQrUsed: selectedArena.plan === 'subscription' 
        ? (selectedArena.ownerUpiId || 'owner@okaxis') 
        : adminUpiId,
      createdAt: new Date().toISOString()
    };

    // LOCK SLOTS FOR DOUBLE-BOOKING PREVENTION
    const newLockedSlots: BookedSlot[] = selectedSlots.map(s => ({
      arenaId: selectedArena.id,
      dateIndex: selectedDateIndex,
      time: s.time
    }));

    // Save Booking Record directly to Supabase `bookings` table
    try {
      const { error } = await supabase.from('bookings').insert([{
        booking_id: newBooking.id,
        arena_id: newBooking.arenaId,
        arena_title: newBooking.arenaTitle,
        date: newBooking.date,
        date_index: newBooking.dateIndex,
        slots: newBooking.slots,
        amount: newBooking.amount,
        user_contact: newBooking.userContact,
        plan_used: newBooking.planUsed,
        payment_qr_used: newBooking.paymentQrUsed,
        created_at: newBooking.createdAt
      }]);

      if (error) {
        console.warn("Supabase insert warning (retrying with alternative schema):", error.message);
        await supabase.from('bookings').insert([{
          id: newBooking.id,
          arenaId: newBooking.arenaId,
          arenaTitle: newBooking.arenaTitle,
          date: newBooking.date,
          dateIndex: newBooking.dateIndex,
          slots: newBooking.slots,
          amount: newBooking.amount,
          userContact: newBooking.userContact,
          planUsed: newBooking.planUsed,
          paymentQrUsed: newBooking.paymentQrUsed,
          createdAt: newBooking.createdAt
        }]);
      }
    } catch (e) {
      console.error("Saved booking to Supabase exception:", e);
    }

    setTimeout(() => {
      setMyBookings([newBooking, ...myBookings]);
      setBookedSlots(prev => [...prev, ...newLockedSlots]);
      setIsProcessingPayment(false);
      setShowPaymentModal(false);
      setSelectedSlots([]);
      setOtpSent(false);
      setOtpCode('');
      showToast(`🎉 Payment Successful! Ticket ID: ${newBooking.id}`);
      setProfileTab('bookings');
      setView('profile');
    }, 2000);
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
      plan: newArenaPlan,
      ownerEmail: newArenaEmail,
      ownerUpiId: upi,
      ownerQrCodeUrl: qrUrl
    };

    setArenas([created, ...arenas]);
    setShowAddTurfForm(false);
    showToast(`🏢 "${created.title}" Arena Listed under ${newArenaPlan === 'subscription' ? 'Plan 1 (Free Tier)' : 'Plan 2 (10% Commission)'}!`);
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
    const basePrice = 323;
    const newRate = Math.round(basePrice * (1 + percentage / 100));
    const updatedDayPrices: Record<string, number> = {};
    slotsData.forEach(s => {
      updatedDayPrices[s.time] = newRate;
    });
    setSlotPrices(prev => ({
      ...prev,
      [selectedDay]: updatedDayPrices
    }));
    showToast(`Applied ${percentage > 0 ? `+${percentage}% surge (₹${newRate})` : `reset base rate (₹323)`} for ${selectedDay}`);
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
            {/* WinDeclare Logo */}
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

                    {/* Secret Admin Gatekeeper Entrance */}
                    <button 
                      onClick={() => { setIsProfileMenuOpen(false); handleOpenAdminDashboard(); }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-xs text-purple-400 hover:bg-purple-500/10 rounded-xl transition font-semibold"
                    >
                      <Shield className="w-3.5 h-3.5 text-purple-400" /> Admin Console
                    </button>

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
                .filter(a => (selectedSport === 'All' || a.sports.includes(selectedSport)) && a.price <= maxPrice && (a.title.toLowerCase().includes(searchQuery.toLowerCase()) || a.location.toLowerCase().includes(searchQuery.toLowerCase())))
                .map((arena) => {
                  const distance = userLocation 
                    ? calculateDistance(userLocation.lat, userLocation.lng, arena.lat, arena.lng)
                    : null;

                  const isFav = favoriteArenaIds.includes(arena.id);

                  return (
                    <div key={arena.id} className="bg-[#0e1320] border border-gray-800 rounded-2xl overflow-hidden hover:border-amber-500/40 transition flex flex-col justify-between shadow-xl group">
                      <div>
                        <div className="relative h-48 bg-gray-950 overflow-hidden">
                          <img src={arena.image} alt={arena.title} className="w-full h-full object-cover group-hover:scale-105 transition duration-500" />
                          
                          {/* Favorite Button */}
                          <button 
                            onClick={(e) => toggleFavorite(arena.id, e)}
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

                          {/* Pricing Plan Badge */}
                          <div className="absolute bottom-3 right-3 bg-black/90 backdrop-blur text-[10px] font-bold px-2 py-0.5 rounded border border-white/10">
                            {arena.plan === 'subscription' ? (
                              <span className="text-teal-400">Plan 1: Free Tier</span>
                            ) : (
                              <span className="text-amber-400">Plan 2: 10% Comm.</span>
                            )}
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
                <span className={`text-xs font-bold px-2.5 py-1 rounded border ${
                  selectedArena.plan === 'subscription' ? 'bg-teal-500/10 border-teal-500/30 text-teal-400' : 'bg-amber-500/10 border-amber-500/30 text-amber-400'
                }`}>
                  {selectedArena.plan === 'subscription' ? 'Plan 1: Free Tier / Owner QR' : 'Plan 2: 10% Comm. / Admin QR'}
                </span>
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
                  {slotsData.map((slot) => {
                    const isSelected = selectedSlots.some(s => s.time === slot.time);
                    const isBooked = bookedSlots.some(b => b.arenaId === selectedArena.id && b.dateIndex === selectedDateIndex && b.time === slot.time);

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

        {/* VIEW 4: OWNER PORTAL WITH SIDEBAR */}
        {view === 'owner-portal' && (
          <div className="min-h-[calc(100vh-64px)] flex">
            {/* Sidebar Navigation */}
            <aside className="w-64 border-r border-gray-800/80 bg-[#0a0e17] p-4 flex flex-col justify-between shrink-0">
              <div className="space-y-6">
                <div className="px-3 py-2 border-b border-gray-800/60 pb-4">
                  <div className="flex items-center gap-2.5">
                    <div className="bg-amber-500 p-2 rounded-xl text-black shadow-lg shadow-amber-500/20">
                      <Trophy className="w-4 h-4 fill-black stroke-black" />
                    </div>
                    <div>
                      <h3 className="font-extrabold text-sm text-white leading-none">WinDeclare</h3>
                      <span className="text-[10px] font-bold text-teal-400 uppercase tracking-wider block mt-1">Owner Portal</span>
                    </div>
                  </div>
                </div>

                {/* Navigation Menu Links */}
                <nav className="space-y-1">
                  <button
                    onClick={() => { setOwnerTab('listings'); setShowAddTurfForm(false); }}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition ${
                      ownerTab === 'listings' ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/20' : 'text-gray-400 hover:text-white hover:bg-gray-900'
                    }`}
                  >
                    <LayoutDashboard className="w-4 h-4" /> Listings Manager
                  </button>

                  <button
                    onClick={() => setOwnerTab('bookings')}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition ${
                      ownerTab === 'bookings' ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/20' : 'text-gray-400 hover:text-white hover:bg-gray-900'
                    }`}
                  >
                    <Calendar className="w-4 h-4" /> Upcoming Bookings
                  </button>

                  <button
                    onClick={() => setOwnerTab('pricing')}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition ${
                      ownerTab === 'pricing' ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/20' : 'text-gray-400 hover:text-white hover:bg-gray-900'
                    }`}
                  >
                    <IndianRupee className="w-4 h-4" /> Slot Pricing
                  </button>

                  <button
                    onClick={() => setOwnerTab('checkin')}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition ${
                      ownerTab === 'checkin' ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/20' : 'text-gray-400 hover:text-white hover:bg-gray-900'
                    }`}
                  >
                    <ScanLine className="w-4 h-4" /> Check-In Scanner
                  </button>

                  <button
                    onClick={() => setOwnerTab('account')}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition ${
                      ownerTab === 'account' ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/20' : 'text-gray-400 hover:text-white hover:bg-gray-900'
                    }`}
                  >
                    <User className="w-4 h-4" /> My Account
                  </button>
                </nav>
              </div>

              <button 
                onClick={() => setView('browse')}
                className="w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold text-gray-400 hover:text-rose-400 transition"
              >
                <LogOut className="w-4 h-4" /> Exit Owner Portal
              </button>
            </aside>

            {/* Main Dashboard Panel */}
            <main className="flex-1 bg-[#070b12] p-6 sm:p-8 max-w-5xl">
              
              {/* TAB 1: LISTINGS MANAGER & ADD NEW VENUE FORM */}
              {ownerTab === 'listings' && (
                <div className="space-y-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <span className="text-[10px] font-bold text-amber-500 uppercase tracking-widest bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                        Listings Manager
                      </span>
                      <h2 className="text-3xl font-extrabold text-white mt-1">Your sports grounds</h2>
                      <p className="text-xs text-gray-400">Arenas listed under owner@windeclare.in</p>
                    </div>

                    <button 
                      onClick={() => setShowAddTurfForm(true)}
                      className="px-4 py-2.5 bg-amber-500 hover:bg-amber-400 text-black font-extrabold text-xs rounded-xl transition flex items-center gap-2 self-start sm:self-auto shadow-lg shadow-amber-500/20"
                    >
                      <Plus className="w-4 h-4 stroke-[3]" /> Add New Turf Venue
                    </button>
                  </div>

                  {/* ADD TURF FORM */}
                  {showAddTurfForm && (
                    <form onSubmit={handleCreateVenue} className="bg-[#0e1320] border border-gray-800 rounded-2xl p-6 space-y-5 shadow-2xl">
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

                        {/* SELECT PRICING PLAN */}
                        <div>
                          <label className="block text-[11px] font-bold text-amber-400 uppercase mb-1">Select Pricing Plan *</label>
                          <div className="grid grid-cols-2 gap-3">
                            <button
                              type="button"
                              onClick={() => setNewArenaPlan('subscription')}
                              className={`p-3 rounded-xl border text-left transition ${
                                newArenaPlan === 'subscription' ? 'bg-teal-500/10 border-teal-500 text-teal-400 font-bold' : 'bg-[#080c14] border-gray-800 text-gray-400'
                              }`}
                            >
                              <p className="text-xs font-bold">Plan 1: Free Tier / ₹2,000/mo</p>
                              <p className="text-[10px] text-gray-500 mt-0.5">Direct player payment to your QR</p>
                            </button>
                            <button
                              type="button"
                              onClick={() => setNewArenaPlan('commission')}
                              className={`p-3 rounded-xl border text-left transition ${
                                newArenaPlan === 'commission' ? 'bg-amber-500/10 border-amber-500 text-amber-400 font-bold' : 'bg-[#080c14] border-gray-800 text-gray-400'
                              }`}
                            >
                              <p className="text-xs font-bold">Plan 2: 10% Commission</p>
                              <p className="text-[10px] text-gray-500 mt-0.5">Automated Admin QR payment</p>
                            </button>
                          </div>
                        </div>

                        <div>
                          <label className="block text-[11px] font-bold text-gray-400 uppercase mb-1">Owner Personal UPI ID (For Plan 1)</label>
                          <input 
                            type="text" 
                            value={newArenaUpiId}
                            onChange={(e) => setNewArenaUpiId(e.target.value)}
                            placeholder="owner.name@okaxis" 
                            className="w-full bg-[#080c14] border border-gray-800 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-amber-500 font-mono" 
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
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
                              value={newArenaEmail}
                              onChange={(e) => setNewArenaEmail(e.target.value)}
                              placeholder="owner@turf.in" 
                              className="w-full bg-[#080c14] border border-gray-800 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-amber-500" 
                            />
                          </div>
                        </div>

                        {/* FEATURE 2: Ground Location URL (`location_url`) */}
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

                        {/* FEATURE 2: Custom UPI QR Code Upload / Link (`qr_code_url`) */}
                        <div>
                          <label className="block text-[11px] font-bold text-purple-400 uppercase mb-1">Owner Personal UPI QR Code Image Link ('QR_CODE_URL')</label>
                          <input 
                            type="text" 
                            value={newArenaQrCodeUrl}
                            onChange={(e) => setNewArenaQrCodeUrl(e.target.value)}
                            placeholder="Enter UPI ID (e.g. name@upi) or QR Image Link" 
                            className="w-full bg-[#080c14] border border-gray-800 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-purple-500 font-mono" 
                          />
                        </div>

                        {/* FEATURE 2: Multi-Sport Selection Checkboxes / Tags */}
                        <div>
                          <label className="block text-[11px] font-bold text-amber-400 uppercase mb-2">Available Sports Checklist *</label>
                          <div className="flex flex-wrap gap-2">
                            {sportsList.map((sport) => {
                              const isSelected = selectedSports.includes(sport);
                              return (
                                <button
                                  key={sport}
                                  type="button"
                                  onClick={() => toggleSport(sport)}
                                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                                    isSelected 
                                      ? 'bg-amber-500 text-black shadow-md font-extrabold' 
                                      : 'bg-[#080c14] border border-gray-800 text-gray-400 hover:text-white'
                                  }`}
                                >
                                  <input type="checkbox" checked={isSelected} readOnly className="pointer-events-none w-3 h-3 accent-amber-500" />
                                  {sport}
                                </button>
                              );
                            })}
                          </div>
                        </div>

                        {/* FEATURE 2: Facilities Checklist Checkboxes */}
                        <div>
                          <label className="block text-[11px] font-bold text-emerald-400 uppercase mb-2">Facilities Checklist *</label>
                          <div className="flex flex-wrap gap-2">
                            {amenitiesList.map((facility) => {
                              const isSelected = selectedAmenities.includes(facility);
                              return (
                                <button
                                  key={facility}
                                  type="button"
                                  onClick={() => toggleAmenity(facility)}
                                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                                    isSelected 
                                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40' 
                                      : 'bg-[#080c14] border border-gray-800 text-gray-400 hover:text-white'
                                  }`}
                                >
                                  <input type="checkbox" checked={isSelected} readOnly className="pointer-events-none w-3 h-3 accent-emerald-500" />
                                  {facility}
                                </button>
                              );
                            })}
                          </div>
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
                    {arenas.map((arena) => (
                      <div key={arena.id} className="bg-[#0e1320] border border-gray-800 rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
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
                              <span>₹{arena.price}/hr</span> • <span>★ {arena.rating}</span> • <span className="text-purple-400 uppercase font-bold">{arena.plan}</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <button 
                            onClick={() => handleNavigate(arena.title, arena.location, arena.locationUrl)}
                            className="text-xs font-bold bg-gray-900 hover:bg-gray-800 text-teal-400 border border-teal-500/30 px-3 py-2 rounded-xl transition flex items-center gap-1"
                          >
                            <Navigation className="w-3.5 h-3.5" /> Navigate
                          </button>
                          <button 
                            onClick={() => {
                              setArenas(arenas.filter(a => a.id !== arena.id));
                              showToast(`Unlisted ${arena.title}`);
                            }}
                            className="text-xs font-bold text-rose-400 hover:bg-rose-500/10 border border-rose-500/20 px-3 py-2 rounded-xl transition"
                          >
                            Unlist
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* TAB 2: UPCOMING BOOKINGS */}
              {ownerTab === 'bookings' && (
                <div className="space-y-6">
                  <div>
                    <span className="text-[10px] font-bold text-amber-500 uppercase tracking-widest bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                      Bookings
                    </span>
                    <h2 className="text-3xl font-extrabold text-white mt-1">Upcoming Player Bookings</h2>
                    <p className="text-xs text-gray-400">Live reserved slots across all your venues</p>
                  </div>

                  <div className="space-y-4">
                    {myBookings.map((b) => (
                      <div key={b.id} className="bg-[#0e1320] border border-gray-800 rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="space-y-1">
                          <span className="text-xs font-black text-amber-500">{b.id}</span>
                          <h4 className="font-bold text-white text-base">{b.arenaTitle}</h4>
                          <p className="text-xs text-gray-400 flex items-center gap-2">
                            <Clock className="w-3.5 h-3.5 text-amber-400" /> {b.date} • {b.slots}
                          </p>
                          <p className="text-[11px] text-gray-500">Player Contact: {b.userContact}</p>
                        </div>

                        <div className="sm:text-right space-y-1">
                          <span className="text-xl font-black text-amber-400 block font-mono">₹{b.amount}</span>
                          <span className="inline-block bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold px-2 py-0.5 rounded">
                            ✓ Payment Collected
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* TAB 3: DYNAMIC TIME & DAY BASED SLOT PRICING */}
              {ownerTab === 'pricing' && (
                <div className="space-y-6">
                  <div>
                    <span className="text-[10px] font-bold text-amber-500 uppercase tracking-widest bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                      Slot Pricing Manager
                    </span>
                    <h2 className="text-3xl font-extrabold text-white mt-1">Time-based pricing</h2>
                    <p className="text-xs text-gray-400 mt-1">
                      Set custom hourly rates per slot for each day of the week. Apply weekend hikes or peak-hour surges dynamically.
                    </p>
                  </div>

                  {/* Day Selector & Bulk Controls */}
                  <div className="bg-[#0e1320] border border-gray-800 rounded-2xl p-6 space-y-6 shadow-2xl">
                    <div className="flex flex-wrap items-center justify-between gap-4 border-b border-gray-800/80 pb-4">
                      <div>
                        <h3 className="font-bold text-white text-base">Akshay Box Turf</h3>
                        <p className="text-xs text-gray-400">Base price: <span className="text-amber-400 font-bold">₹323/hr</span></p>
                      </div>

                      {/* Day of the Week Selector */}
                      <div className="flex gap-1 overflow-x-auto bg-[#080c14] p-1.5 rounded-xl border border-gray-800">
                        {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => (
                          <button
                            key={day}
                            type="button"
                            onClick={() => setSelectedDay(day)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
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

                    {/* Quick Surge Modifiers */}
                    <div className="flex flex-wrap items-center justify-between gap-3 bg-[#080c14] border border-gray-800/80 p-3 rounded-xl">
                      <span className="text-xs font-bold text-gray-400 uppercase">
                        Quick Preset for {selectedDay}:
                      </span>
                      <div className="flex gap-2">
                        <button 
                          type="button"
                          onClick={() => handleApplySurge(0)}
                          className="px-2.5 py-1 bg-gray-900 border border-gray-800 text-gray-300 rounded-lg text-xs font-semibold hover:border-gray-700"
                        >
                          Reset (₹323)
                        </button>
                        <button 
                          type="button"
                          onClick={() => handleApplySurge(15)}
                          className="px-2.5 py-1 bg-amber-500/10 border border-amber-500/30 text-amber-400 rounded-lg text-xs font-semibold hover:bg-amber-500/20"
                        >
                          +15% Peak
                        </button>
                        <button 
                          type="button"
                          onClick={() => handleApplySurge(25)}
                          className="px-2.5 py-1 bg-orange-500/20 border border-orange-500/40 text-orange-400 rounded-lg text-xs font-semibold hover:bg-orange-500/30"
                        >
                          +25% Weekend Hike
                        </button>
                      </div>
                    </div>

                    {/* 24-Hour Price Edit Cards Grid */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 max-h-[500px] overflow-y-auto pr-2 no-scrollbar">
                      {slotsData.map((slot) => (
                        <div 
                          key={slot.time} 
                          className="bg-[#080c14] border border-gray-800/80 p-3 rounded-xl space-y-2 hover:border-amber-500/40 transition"
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-extrabold text-white">{slot.time}</span>
                            {(selectedDay === 'Sat' || selectedDay === 'Sun') && (
                              <span className="text-[9px] font-bold bg-orange-500/20 text-orange-400 px-1.5 py-0.5 rounded">
                                Hike
                              </span>
                            )}
                          </div>

                          <div className="space-y-1">
                            <div className="relative">
                              <span className="absolute left-3 top-2 text-xs font-bold text-gray-500">₹</span>
                              <input 
                                type="number" 
                                value={slotPrices[selectedDay]?.[slot.time] ?? slot.price}
                                onChange={(e) => handlePriceChange(selectedDay, slot.time, Number(e.target.value))}
                                className="w-full bg-[#0e1320] border border-gray-800 rounded-lg pl-7 pr-3 py-1.5 text-xs text-amber-400 font-mono font-bold focus:outline-none focus:border-amber-500"
                              />
                            </div>
                            <p className="text-[10px] text-gray-500 font-semibold">
                              Charges: <span className="text-amber-400 font-bold">₹{slotPrices[selectedDay]?.[slot.time] ?? slot.price}</span>
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Action Bar */}
                    <div className="pt-4 border-t border-gray-800 flex justify-end gap-3">
                      <button 
                        type="button"
                        onClick={() => showToast(`Pricing saved successfully for ${selectedDay}!`)}
                        className="px-6 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:brightness-110 text-black font-extrabold text-xs rounded-xl shadow-lg transition"
                      >
                        Save {selectedDay} Pricing
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 4: CHECK-IN SCANNER */}
              {ownerTab === 'checkin' && (
                <div className="space-y-6">
                  <div>
                    <span className="text-[10px] font-bold text-amber-500 uppercase tracking-widest bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                      Ticket Check-In
                    </span>
                    <h2 className="text-3xl font-extrabold text-white mt-1">Player Ticket Scanner</h2>
                    <p className="text-xs text-gray-400">Verify player booking reference code at entry</p>
                  </div>

                  <form onSubmit={handleVerifyTicket} className="bg-[#0e1320] border border-gray-800 rounded-2xl p-6 space-y-4 max-w-md shadow-2xl">
                    <div>
                      <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Booking Ticket Reference Code</label>
                      <div className="relative">
                        <ScanLine className="w-5 h-5 absolute left-3.5 top-3 text-amber-500" />
                        <input 
                          type="text"
                          required
                          value={ticketCode}
                          onChange={(e) => setTicketCode(e.target.value)}
                          placeholder="e.g. WD-09TKPU8"
                          className="w-full bg-[#080c14] border border-gray-800 rounded-xl pl-11 pr-4 py-3 text-sm font-mono text-white tracking-widest uppercase focus:outline-none focus:border-amber-500"
                        />
                      </div>
                    </div>

                    <button 
                      type="submit"
                      className="w-full bg-amber-500 hover:bg-amber-400 text-black font-extrabold py-3 rounded-xl transition text-xs shadow-lg flex items-center justify-center gap-2"
                    >
                      <CheckCircle2 className="w-4 h-4 stroke-[3]" /> Verify & Check-In Player
                    </button>

                    {checkInStatus && (
                      <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-xs font-bold text-emerald-400 text-center">
                        {checkInStatus}
                      </div>
                    )}
                  </form>
                </div>
              )}

              {/* TAB 5: MY ACCOUNT */}
              {ownerTab === 'account' && (
                <div className="space-y-6">
                  <div>
                    <span className="text-[10px] font-bold text-amber-500 uppercase tracking-widest bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                      Partner Profile
                    </span>
                    <h2 className="text-3xl font-extrabold text-white mt-1">Owner Account Details</h2>
                    <p className="text-xs text-gray-400">Manage account information and payout bank settings</p>
                  </div>

                  <div className="bg-[#0e1320] border border-gray-800 rounded-2xl p-6 space-y-4 max-w-md shadow-2xl">
                    <div>
                      <span className="text-xs text-gray-500 uppercase block font-bold">Partner Email</span>
                      <span className="text-sm font-bold text-white">owner@windeclare.in</span>
                    </div>

                    <div>
                      <span className="text-xs text-gray-500 uppercase block font-bold">Payout UPI / Bank</span>
                      <span className="text-sm font-mono font-bold text-amber-400">owner@okaxis</span>
                    </div>

                    <div>
                      <span className="text-xs text-gray-500 uppercase block font-bold">GST Status</span>
                      <span className="text-xs text-emerald-400 font-bold bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded">
                        ✓ Registered (18% GST Applicable)
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </main>
          </div>
        )}

        {/* VIEW 5: USER PROFILE VIEW (BOOKINGS, FAVORITES, ACCOUNT) */}
        {view === 'profile' && (
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
                  My Bookings ({myBookings.length})
                </button>
                <button
                  onClick={() => setProfileTab('favorites')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${profileTab === 'favorites' ? 'bg-amber-500 text-black' : 'text-gray-400 hover:text-white'}`}
                >
                  Favorites ({favoriteArenaIds.length})
                </button>
                <button
                  onClick={() => setProfileTab('account')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${profileTab === 'account' ? 'bg-amber-500 text-black' : 'text-gray-400 hover:text-white'}`}
                >
                  Settings
                </button>
              </div>
            </div>

            {/* TAB CONTENT: BOOKINGS */}
            {profileTab === 'bookings' && (
              <div className="bg-[#0e1320] border border-gray-800 rounded-2xl p-6 space-y-4 shadow-xl">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-amber-500" /> Active & Upcoming Bookings
                </h3>

                <div className="space-y-3">
                  {myBookings.map((b) => (
                    <div key={b.id} className="bg-[#080c14] border border-gray-800 rounded-xl p-4 flex items-center justify-between">
                      <div className="space-y-1">
                        <span className="text-[10px] font-bold text-amber-500 uppercase font-mono">{b.id}</span>
                        <h4 className="font-bold text-white text-sm">{b.arenaTitle}</h4>
                        <p className="text-xs text-gray-400 flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-amber-400" /> {b.date} • {b.slots}
                        </p>
                        <p className="text-[10px] text-purple-400 font-mono">Plan: {b.planUsed} • Payout: {b.paymentQrUsed}</p>
                      </div>

                      <div className="text-right">
                        <span className="text-sm font-black text-amber-400 block font-mono">₹{b.amount}</span>
                        <span className="text-[10px] text-emerald-400 bg-emerald-950/60 border border-emerald-800/50 px-2 py-0.5 rounded font-bold inline-block mt-1">
                          ✓ Confirmed
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TAB CONTENT: FAVORITES */}
            {profileTab === 'favorites' && (
              <div className="bg-[#0e1320] border border-gray-800 rounded-2xl p-6 space-y-4 shadow-xl">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Heart className="w-4 h-4 text-rose-500 fill-rose-500" /> Saved Favorite Turfs
                </h3>

                <div className="grid md:grid-cols-2 gap-4">
                  {arenas.filter(a => favoriteArenaIds.includes(a.id)).map((arena) => (
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
                        onClick={() => handleSelectArena(arena)}
                        className="px-3 py-1.5 bg-amber-500 text-black text-xs font-bold rounded-lg"
                      >
                        Book
                      </button>
                    </div>
                  ))}
                </div>
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
        )}
      </div>

      {/* POPUP MODAL 1: AUTHENTICATION MODAL (Triggered if player clicks book while not logged in) */}
      {showAuthModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#0e1320] border border-gray-800 w-full max-w-md rounded-2xl p-6 shadow-2xl relative space-y-6">
            <button 
              onClick={() => setShowAuthModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-white p-1"
            >
              <X className="w-5 h-5" />
            </button>

            <div>
              <div className="flex items-center gap-2 text-xs font-bold text-amber-500 uppercase tracking-wider">
                <Lock className="w-3.5 h-3.5" /> Sign In Required
              </div>
              <h3 className="text-xl font-extrabold text-white mt-1">Authenticate to Confirm Slot</h3>
              <p className="text-xs text-gray-400 mt-0.5">Please log in to verify your ticket booking</p>
            </div>

            <div className="space-y-3">
              <button 
                type="button"
                onClick={handleGoogleSignIn}
                className="w-full py-3 bg-white text-black font-extrabold text-xs rounded-xl hover:bg-gray-100 transition shadow-lg flex items-center justify-center gap-2"
              >
                <Mail className="w-4 h-4 text-red-500" /> Continue with Google
              </button>

              <div className="relative flex py-2 items-center">
                <div className="flex-grow border-t border-gray-800"></div>
                <span className="flex-shrink mx-4 text-[10px] text-gray-500 uppercase font-bold">Or Mobile Phone OTP</span>
                <div className="flex-grow border-t border-gray-800"></div>
              </div>

              {!otpSent ? (
                <form onSubmit={handleSendOtp} className="space-y-3">
                  <div className="relative">
                    <Phone className="w-4 h-4 absolute left-3 top-3 text-gray-500" />
                    <input 
                      type="tel"
                      required
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      placeholder="Enter mobile number for OTP"
                      className="w-full bg-[#080c14] border border-gray-800 rounded-xl pl-9 pr-4 py-2.5 text-xs text-white focus:outline-none focus:border-amber-500"
                    />
                  </div>
                  <button 
                    type="submit"
                    className="w-full py-3 bg-amber-500 hover:bg-amber-400 text-black font-extrabold text-xs rounded-xl transition shadow-lg"
                  >
                    Send Firebase OTP & Continue
                  </button>
                </form>
              ) : (
                <form onSubmit={handleVerifyOtp} className="space-y-3">
                  <input 
                    type="text"
                    maxLength={6}
                    required
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value)}
                    placeholder="Enter 6-digit OTP code"
                    className="w-full bg-[#080c14] border border-gray-800 rounded-xl px-4 py-2.5 text-center text-sm font-mono text-amber-400 tracking-widest focus:outline-none focus:border-amber-500"
                  />
                  <button 
                    type="submit"
                    className="w-full py-3 bg-emerald-500 hover:bg-emerald-400 text-black font-extrabold text-xs rounded-xl transition shadow-lg flex items-center justify-center gap-2"
                  >
                    <ShieldCheck className="w-4 h-4" /> Verify OTP & Login
                  </button>
                </form>
              )}
            </div>
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

      {/* POPUP MODAL 3: PAYMENT CHECKOUT WITH DYNAMIC QR ROUTING BASED ON PLAN */}
      {showPaymentModal && selectedArena && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#0e1320] border border-gray-800 w-full max-w-md rounded-2xl p-6 shadow-2xl relative space-y-6">
            <button 
              onClick={() => setShowPaymentModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-white p-1"
            >
              <X className="w-5 h-5" />
            </button>

            <div>
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-xs font-bold text-amber-500 uppercase tracking-wider">
                  <Lock className="w-3.5 h-3.5" /> Secure Checkout
                </span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                  selectedArena.plan === 'subscription' ? 'bg-teal-500/10 border-teal-500/30 text-teal-400' : 'bg-purple-500/10 border-purple-500/30 text-purple-400'
                }`}>
                  {selectedArena.plan === 'subscription' ? 'Plan 1: Direct Owner QR' : 'Plan 2: Admin Commission QR'}
                </span>
              </div>

              <h3 className="text-xl font-extrabold text-white mt-1">Scan & Pay ₹{totalPrice}</h3>
              <p className="text-xs text-gray-400 mt-0.5">{selectedArena.title} • {selectedSlots.map(s => s.time).join(', ')}</p>
            </div>

            {/* DYNAMIC QR PAYMENT ROUTING */}
            <div className="bg-[#080c14] border border-gray-800 rounded-2xl p-4 text-center space-y-3 shadow-inner">
              <span className="text-xs text-gray-400 font-bold block">
                {selectedArena.plan === 'subscription' 
                  ? 'Turf Owner Personal UPI QR Code' 
                  : 'Platform Master Commission UPI QR Code'}
              </span>

              <div className="flex justify-center">
                <img 
                  src={selectedArena.plan === 'subscription'
                    ? (selectedArena.ownerQrCodeUrl || 'https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=upi://pay?pa=owner@okaxis')
                    : adminQrCodeUrl} 
                  alt="Payment QR" 
                  className="w-44 h-44 rounded-xl bg-white p-2 border border-gray-800 shadow-md"
                />
              </div>

              <p className="text-xs font-mono font-bold text-amber-400">
                {selectedArena.plan === 'subscription'
                  ? (selectedArena.ownerUpiId || 'akshay.box@okaxis')
                  : adminUpiId}
              </p>

              <p className="text-[10px] text-gray-500">
                {selectedArena.plan === 'subscription' 
                  ? '✓ Payout routed directly to Turf Owner (Plan 1: Free Tier)'
                  : '✓ Payout routed to Platform Admin for 10% Commission auto-ticket release'}
              </p>
            </div>

            {/* Payment Method Selector */}
            <div className="space-y-2">
              <button
                type="button"
                onClick={() => setSelectedPaymentMethod('upi')}
                className={`w-full p-3 rounded-xl border text-left flex items-center justify-between transition ${
                  selectedPaymentMethod === 'upi'
                    ? 'bg-amber-500/10 border-amber-500 text-amber-400 font-bold'
                    : 'bg-[#080c14] border-gray-800 text-gray-300 hover:border-gray-700'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Smartphone className="w-4 h-4 text-amber-400" />
                  <div>
                    <p className="text-xs font-bold">UPI Apps (GPay / PhonePe / Paytm / BHIM)</p>
                    <p className="text-[10px] text-gray-500 font-normal">Scan QR or Pay via VPA</p>
                  </div>
                </div>
                {selectedPaymentMethod === 'upi' && <CheckCircle className="w-4 h-4 text-amber-500" />}
              </button>

              <button
                type="button"
                onClick={() => setSelectedPaymentMethod('card')}
                className={`w-full p-3 rounded-xl border text-left flex items-center justify-between transition ${
                  selectedPaymentMethod === 'card'
                    ? 'bg-amber-500/10 border-amber-500 text-amber-400 font-bold'
                    : 'bg-[#080c14] border-gray-800 text-gray-300 hover:border-gray-700'
                }`}
              >
                <div className="flex items-center gap-3">
                  <CreditCard className="w-4 h-4 text-amber-400" />
                  <div>
                    <p className="text-xs font-bold">Credit / Debit Card</p>
                    <p className="text-[10px] text-gray-500 font-normal">Visa, Mastercard, RuPay</p>
                  </div>
                </div>
                {selectedPaymentMethod === 'card' && <CheckCircle className="w-4 h-4 text-amber-500" />}
              </button>
            </div>

            {/* Submit Payment Button */}
            <button
              type="button"
              disabled={isProcessingPayment}
              onClick={handleProcessPayment}
              className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-black font-extrabold py-3.5 rounded-xl transition text-sm flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20"
            >
              {isProcessingPayment ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Verifying & Confirming Slot...
                </>
              ) : (
                <>
                  <Lock className="w-4 h-4 stroke-[3]" /> Confirm Payment of ₹{totalPrice}
                </>
              )}
            </button>
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
