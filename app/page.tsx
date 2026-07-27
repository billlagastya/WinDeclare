'use client';

import React, { useState, useMemo } from 'react';
import { 
  Trophy, User, MapPin, Search, Navigation, 
  ChevronRight, Calendar, CheckCircle2, Phone, X, ShieldCheck,
  Building2, Plus, DollarSign, Clock, LayoutDashboard, Sparkles,
  SlidersHorizontal, Star, AlertCircle, Ticket, QrCode
} from 'lucide-react';

interface Arena {
  id: number;
  title: string;
  location: string;
  address: string;
  price: number;
  rating: number;
  reviews: number;
  sports: string[];
  image: string;
  surface: string;
  amenities: string[];
  description: string;
  slots: string[];
  locationUrl?: string;
}

interface Booking {
  id: string;
  arenaId: number;
  arenaTitle: string;
  location: string;
  locationUrl?: string;
  date: string;
  timeSlot: string;
  sport: string;
  price: number;
  totalPrice: number;
  status: 'Confirmed' | 'Completed' | 'Cancelled';
  paymentMethod: string;
  createdAt: string;
}

export default function WinDeclareApp() {
  // Navigation views: 'browse' (Player view), 'profile' (Player Bookings), 'owner-dashboard' (Owner portal)
  const [view, setView] = useState<'browse' | 'profile' | 'owner-dashboard'>('browse');
  const [selectedSport, setSelectedSport] = useState<string>('All');
  const [maxPrice, setMaxPrice] = useState<number>(2800);
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Auth & Booking States
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [ownerLoggedIn, setOwnerLoggedIn] = useState<boolean>(false);
  const [selectedArena, setSelectedArena] = useState<Arena | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<string>('');
  
  // Modal States
  const [isBookingModalOpen, setIsBookingModalOpen] = useState<boolean>(false);
  const [isOwnerLoginModalOpen, setIsOwnerLoginModalOpen] = useState<boolean>(false);
  const [isAddArenaModalOpen, setIsAddArenaModalOpen] = useState<boolean>(false);
  const [otpSent, setOtpSent] = useState<boolean>(false);
  const [phoneNumber, setPhoneNumber] = useState<string>('');
  const [otpCode, setOtpCode] = useState<string>('');

  // Owner Form State
  const [ownerPhone, setOwnerPhone] = useState<string>('');
  const [ownerArenaName, setOwnerArenaName] = useState<string>('');

  // Toast Notification
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Mock Arenas Data
  const [arenas, setArenas] = useState<Arena[]>([
    {
      id: 1,
      title: 'Kelo Bharat Sports Arena',
      location: 'Gachibowli, Hyderabad',
      address: 'Opp. IIIT Campus, Sports Village, Gachibowli',
      price: 500,
      rating: 4.9,
      reviews: 39,
      sports: ['Cricket', 'Badminton', 'Tennis'],
      surface: 'BWF Certified Teak Wood Court',
      amenities: ['AC Courts', 'Floodlights', 'Shower Rooms', 'Cafeteria', 'Parking'],
      image: 'https://images.unsplash.com/photo-1518604666860-9ed391f76460?w=800&auto=format&fit=crop',
      description: 'World-class indoor sports complex with air-conditioned synthetic badminton courts and professional coaching facilities.',
      locationUrl: 'https://maps.google.com/?q=Gachibowli+Hyderabad+Sports+Arena',
      slots: ['06:00 AM - 07:00 AM', '07:00 AM - 08:00 AM', '06:00 PM - 07:00 PM', '07:00 PM - 08:00 PM', '08:00 PM - 09:00 PM']
    },
    {
      id: 2,
      title: 'Smash & Serve Tennis Hub',
      location: 'Jubilee Hills, Hyderabad',
      address: 'Road No. 36, Beside Metro Station, Jubilee Hills',
      price: 1200,
      rating: 4.9,
      reviews: 31,
      sports: ['Tennis', 'Pickleball'],
      surface: 'DecoTurf Hard Court',
      amenities: ['US Open Standard Hard Court', 'Night Lights', 'Pro Shop', 'Valet Parking'],
      image: 'https://images.unsplash.com/photo-1529900748604-07564a03e7a6?w=800&auto=format&fit=crop',
      description: 'Professional grade tennis and pickleball venue built according to ITF specs with tournament lighting.',
      locationUrl: 'https://maps.google.com/?q=Jubilee+Hills+Tennis+Hub',
      slots: ['06:00 AM - 07:00 AM', '08:00 AM - 09:00 AM', '05:00 PM - 06:00 PM', '06:00 PM - 07:00 PM']
    },
    {
      id: 3,
      title: 'Akshay Box Turf',
      location: 'Addagutta, Hyderabad',
      address: 'Plot 42, Near Metro Pillar 120, Addagutta Main Rd',
      price: 800,
      rating: 4.8,
      reviews: 22,
      sports: ['Football', 'Cricket'],
      surface: 'FIFA 2-Star 5G Grass',
      amenities: ['Floodlights', 'Parking', 'Water Dispenser', 'Changing Room'],
      image: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=800&auto=format&fit=crop',
      description: 'Premium enclosed multi-sport box turf with professional shock-pad underlayment and high-intensity LED stadium floodlights.',
      locationUrl: 'https://maps.google.com/?q=Addagutta+Hyderabad+Box+Turf',
      slots: ['07:00 AM - 08:00 AM', '08:00 AM - 09:00 AM', '08:00 PM - 09:00 PM', '09:00 PM - 10:00 PM', '10:00 PM - 11:00 PM']
    }
  ]);

  // Initial User Bookings Data
  const [userBookings, setUserBookings] = useState<Booking[]>([
    {
      id: 'WD-43R5KMN70',
      arenaId: 1,
      arenaTitle: 'Kelo Bharat Sports Arena',
      location: 'Gachibowli, Hyderabad',
      locationUrl: 'https://maps.google.com/?q=Gachibowli+Hyderabad+Sports+Arena',
      date: 'Jul 28, 2026',
      timeSlot: '06:00 AM - 07:00 AM',
      sport: 'Badminton',
      price: 500,
      totalPrice: 520,
      status: 'Confirmed',
      paymentMethod: 'UPI (GPay)',
      createdAt: '2026-07-27 12:30'
    }
  ]);

  const sportsList = ['All', 'Football', 'Cricket', 'Basketball', 'Tennis', 'Badminton', 'Volleyball', 'Pickleball'];

  // Helper function for Google Maps navigation
  const handleNavigate = (arenaTitle: string, location: string, locationUrl?: string) => {
    if (locationUrl && locationUrl.trim() !== '') {
      window.open(locationUrl, '_blank');
    } else {
      const query = encodeURIComponent(`${arenaTitle}, ${location}`);
      window.open(`https://www.google.com/maps/search/?api=1&query=${query}`, '_blank');
    }
  };

  const handleOpenBooking = (arena: Arena) => {
    setSelectedArena(arena);
    setSelectedSlot(arena.slots[0]);
    setIsBookingModalOpen(true);
  };

  const handleSendOtp = (e: React.FormEvent) => {
    e.preventDefault();
    if (phoneNumber.length >= 10) {
      setOtpSent(true);
      showToast(`OTP Code sent to +91 ${phoneNumber}`);
    } else {
      alert('Please enter a valid 10-digit mobile phone number');
    }
  };

  const handleVerifyOtp = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedArena || !selectedSlot) return;

    if (otpCode.length >= 4) {
      setIsAuthenticated(true);
      const newBookingId = `WD-${Math.random().toString(36).substring(2, 9).toUpperCase()}`;

      const newBooking: Booking = {
        id: newBookingId,
        arenaId: selectedArena.id,
        arenaTitle: selectedArena.title,
        location: selectedArena.location,
        locationUrl: selectedArena.locationUrl,
        date: 'Jul 28, 2026',
        timeSlot: selectedSlot,
        sport: selectedArena.sports[0] || 'Football',
        price: selectedArena.price,
        totalPrice: selectedArena.price + 20,
        status: 'Confirmed',
        paymentMethod: 'UPI (GPay / PhonePe)',
        createdAt: new Date().toISOString().replace('T', ' ').substring(0, 16)
      };

      setUserBookings([newBooking, ...userBookings]);
      setIsBookingModalOpen(false);
      setOtpSent(false);
      setOtpCode('');
      showToast(`🎉 Booking Confirmed! Ticket ID: ${newBookingId}`);
      setView('profile');
    } else {
      alert('Please enter a valid 6-digit OTP code');
    }
  };

  const handleOwnerLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setOwnerLoggedIn(true);
    setIsOwnerLoginModalOpen(false);
    showToast(`Welcome to Partner Portal, ${ownerArenaName || 'Owner'}!`);
    setView('owner-dashboard');
  };

  const filteredArenas = useMemo(() => {
    return arenas.filter((arena) => {
      const matchesSport = selectedSport === 'All' || arena.sports.includes(selectedSport);
      const matchesPrice = arena.price <= maxPrice;
      const matchesQuery = 
        arena.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        arena.location.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesSport && matchesPrice && matchesQuery;
    });
  }, [arenas, selectedSport, maxPrice, searchQuery]);

  return (
    <div className="min-h-screen bg-[#0d1117] text-gray-100 font-sans antialiased flex flex-col justify-between selection:bg-amber-500 selection:text-black">
      <div>
        {/* Toast Notification */}
        {toastMessage && (
          <div className="fixed top-20 right-6 z-50 bg-emerald-500 text-black font-bold px-5 py-3 rounded-xl shadow-2xl flex items-center gap-3 animate-bounce">
            <CheckCircle2 className="w-5 h-5 text-black" />
            <span>{toastMessage}</span>
          </div>
        )}

        {/* Header */}
        <header className="border-b border-gray-800 bg-[#161b22]/90 backdrop-blur sticky top-0 z-40">
          <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
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
                <span className="bg-amber-500/10 text-amber-500 border border-amber-500/20 text-[10px] font-bold px-1.5 py-0.5 rounded uppercase">
                  India
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button 
                onClick={() => setView('browse')}
                className={`text-xs sm:text-sm font-semibold transition px-3 py-1.5 rounded-lg ${
                  view === 'browse' ? 'bg-amber-500 text-black font-bold' : 'text-gray-300 hover:text-white'
                }`}
              >
                Browse Turfs
              </button>

              {/* OWNER FEATURE CTA BUTTON */}
              <button 
                onClick={() => {
                  if (ownerLoggedIn) {
                    setView('owner-dashboard');
                  } else {
                    setIsOwnerLoginModalOpen(true);
                  }
                }}
                className={`flex items-center gap-1.5 text-xs font-bold border px-3 py-2 rounded-xl transition ${
                  view === 'owner-dashboard' 
                    ? 'bg-amber-500 text-black border-amber-400 font-extrabold' 
                    : 'bg-gray-900 hover:bg-gray-800 text-amber-400 border-amber-500/30'
                }`}
              >
                <Building2 className="w-4 h-4 text-amber-500" />
                <span>{ownerLoggedIn ? 'Owner Dashboard' : 'List New Turf / Partner Login'}</span>
              </button>

              <button 
                onClick={() => setView('profile')}
                className={`flex items-center gap-2 text-xs sm:text-sm px-3 py-1.5 rounded-lg transition font-medium ${
                  view === 'profile' ? 'bg-amber-500 text-black font-bold' : 'text-gray-300 hover:text-white bg-gray-900 border border-gray-800'
                }`}
              >
                <User className="w-4 h-4" />
                <span>My Bookings</span>
                <span className="bg-amber-400 text-black text-[10px] font-black px-1.5 py-0.5 rounded-full ml-0.5">
                  {userBookings.length}
                </span>
              </button>
            </div>
          </div>
        </header>

        {/* VIEW 1: PLAYER BROWSE DASHBOARD (DEFAULT) */}
        {view === 'browse' && (
          <main className="max-w-7xl mx-auto px-4 py-8">
            <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
              <div>
                <span className="text-xs font-bold text-amber-500 tracking-widest uppercase bg-amber-500/10 border border-amber-500/20 px-2.5 py-1 rounded-md">
                  ⚡ Real-Time Slot Availability
                </span>
                <h1 className="text-3xl sm:text-4xl font-extrabold mt-3 text-white">
                  Find the perfect <span className="text-amber-400">turf</span> near you.
                </h1>
                <p className="text-gray-400 text-xs sm:text-sm mt-1">
                  Book 5-a-side grounds, box cricket pitches, and badminton courts with instant confirmation.
                </p>
              </div>

              {/* Banner CTA for Turf Owners */}
              <div className="bg-[#161b22] border border-amber-500/30 rounded-2xl p-4 flex items-center gap-4 max-w-sm shadow-xl">
                <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-400">
                  <Building2 className="w-6 h-6" />
                </div>
                <div className="space-y-1">
                  <h4 className="text-xs font-bold text-white uppercase">Own a Sports Turf?</h4>
                  <p className="text-[11px] text-gray-400">List your ground, set pricing, and manage real-time bookings.</p>
                  <button 
                    onClick={() => setIsOwnerLoginModalOpen(true)}
                    className="text-xs font-bold text-amber-400 hover:underline flex items-center gap-0.5 pt-0.5"
                  >
                    List Your Turf Now →
                  </button>
                </div>
              </div>
            </div>

            {/* Search & Filters Bar */}
            <div className="bg-[#161b22] border border-gray-800 rounded-2xl p-4 mb-6 flex flex-wrap gap-4 items-center justify-between shadow-xl">
              <div className="flex-1 min-w-[280px] relative">
                <Search className="w-4 h-4 absolute left-3 top-3.5 text-gray-500" />
                <input 
                  type="text" 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by arena name, location (e.g. Addagutta, Madhapur)..." 
                  className="w-full bg-gray-900 border border-gray-800 rounded-xl pl-9 pr-4 py-2 text-sm focus:outline-none focus:border-amber-500 text-white"
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

            {/* Sports Category Pills */}
            <div className="flex gap-2 overflow-x-auto pb-4 mb-6 no-scrollbar">
              {sportsList.map((sport) => (
                <button
                  key={sport}
                  onClick={() => setSelectedSport(sport)}
                  className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
                    selectedSport === sport 
                      ? 'bg-amber-500 text-black font-bold' 
                      : 'bg-[#161b22] border border-gray-800 text-gray-300 hover:border-gray-600'
                  }`}
                >
                  {sport}
                </button>
              ))}
            </div>

            {/* Arenas Grid */}
            <div className="grid md:grid-cols-3 gap-6">
              {filteredArenas.map((arena) => (
                <div key={arena.id} className="bg-[#161b22] border border-gray-800 rounded-2xl overflow-hidden hover:border-amber-500/50 transition duration-300 group flex flex-col justify-between shadow-xl">
                  <div>
                    <div className="relative h-48 overflow-hidden bg-gray-950">
                      <img 
                        src={arena.image} 
                        alt={arena.title} 
                        className="w-full h-full object-cover group-hover:scale-105 transition duration-500" 
                      />
                      <div className="absolute top-3 left-3 flex gap-1 flex-wrap">
                        {arena.sports.map(s => (
                          <span key={s} className="bg-black/70 backdrop-blur text-[10px] uppercase tracking-wider font-bold text-amber-400 px-2 py-1 rounded-md">
                            {s}
                          </span>
                        ))}
                      </div>
                      <div className="absolute top-3 right-3 bg-black/70 backdrop-blur text-xs font-bold text-amber-400 px-2 py-1 rounded-md flex items-center gap-1">
                        ★ {arena.rating} ({arena.reviews})
                      </div>
                    </div>

                    <div className="p-5 space-y-2">
                      <h3 className="font-bold text-lg text-white group-hover:text-amber-400 transition">{arena.title}</h3>
                      <p className="text-xs text-gray-400 flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-amber-500" /> {arena.location}
                      </p>
                    </div>
                  </div>

                  <div className="p-5 pt-0">
                    <div className="pt-4 border-t border-gray-800 space-y-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="text-2xl font-black text-white">₹{arena.price}</span>
                          <span className="text-xs text-gray-500"> / hour</span>
                        </div>
                        <button 
                          onClick={() => handleOpenBooking(arena)}
                          className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-black font-extrabold text-xs rounded-xl flex items-center gap-1 transition shadow-lg shadow-amber-500/10"
                        >
                          Book Slot <ChevronRight className="w-3.5 h-3.5 stroke-[3]" />
                        </button>
                      </div>

                      <button 
                        onClick={() => handleNavigate(arena.title, arena.location, arena.locationUrl)}
                        className="w-full py-2 bg-gray-900 hover:bg-gray-800 border border-teal-500/30 text-teal-400 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition"
                      >
                        <Navigation className="w-3.5 h-3.5" /> Navigate
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </main>
        )}

        {/* VIEW 2: TURF OWNER DASHBOARD */}
        {view === 'owner-dashboard' && (
          <main className="max-w-6xl mx-auto px-4 py-8 space-y-8">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between bg-[#161b22] border border-gray-800 rounded-2xl p-6 gap-4 shadow-xl">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center font-bold">
                  <Building2 className="w-7 h-7" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">Turf Owner Partner Portal</h2>
                  <p className="text-xs text-gray-400">+91 {ownerPhone || '9876543210'} • Active Partner</p>
                </div>
              </div>

              <button 
                onClick={() => showToast('Publish New Arena Modal Opened')}
                className="px-4 py-2.5 bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs rounded-xl flex items-center gap-2 transition shadow-lg shadow-amber-500/20"
              >
                <Plus className="w-4 h-4 stroke-[3]" /> Add New Turf Venue
              </button>
            </div>

            {/* Owner Analytics Cards */}
            <div className="grid md:grid-cols-3 gap-6">
              <div className="bg-[#161b22] border border-gray-800 p-6 rounded-2xl space-y-2 shadow-lg">
                <span className="text-xs text-gray-500 uppercase font-semibold">Total Revenue (This Month)</span>
                <p className="text-3xl font-black text-amber-400">₹42,500</p>
                <p className="text-xs text-emerald-400">+14% vs last month</p>
              </div>
              <div className="bg-[#161b22] border border-gray-800 p-6 rounded-2xl space-y-2 shadow-lg">
                <span className="text-xs text-gray-500 uppercase font-semibold">Total Bookings</span>
                <p className="text-3xl font-black text-white">85 Slots</p>
                <p className="text-xs text-gray-400">Average ₹500/hr slot price</p>
              </div>
              <div className="bg-[#161b22] border border-gray-800 p-6 rounded-2xl space-y-2 shadow-lg">
                <span className="text-xs text-gray-500 uppercase font-semibold">Active Venues</span>
                <p className="text-3xl font-black text-white">1 Venue</p>
                <p className="text-xs text-teal-400">Gachibowli Location</p>
              </div>
            </div>
          </main>
        )}

        {/* VIEW 3: PROFILE & USER BOOKINGS */}
        {view === 'profile' && (
          <main className="max-w-4xl mx-auto px-4 py-8 space-y-6">
            <div className="bg-[#161b22] border border-gray-800 rounded-2xl p-6 flex items-center justify-between shadow-xl">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-full bg-gradient-to-tr from-amber-400 to-orange-500 text-black font-extrabold text-xl flex items-center justify-center">
                  PL
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">Player Account</h2>
                  <p className="text-xs text-gray-400">player@windeclare.in</p>
                </div>
              </div>

              <div className="flex gap-6 text-center">
                <div>
                  <p className="text-xl font-bold text-white">{userBookings.length}</p>
                  <p className="text-xs text-gray-500 uppercase">Total</p>
                </div>
                <div>
                  <p className="text-xl font-bold text-emerald-400">
                    {userBookings.filter(b => b.status === 'Confirmed').length}
                  </p>
                  <p className="text-xs text-gray-500 uppercase">Confirmed</p>
                </div>
              </div>
            </div>

            <div className="bg-[#161b22] border border-gray-800 rounded-2xl p-6 shadow-xl space-y-4">
              <h3 className="text-lg font-bold text-white">Your Bookings</h3>
              
              <div className="space-y-4">
                {userBookings.map((booking) => (
                  <div key={booking.id} className="bg-gray-900 border border-gray-800 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <span className="text-xs font-bold text-amber-500 uppercase">{booking.id}</span>
                      <h4 className="font-bold text-white">{booking.arenaTitle}</h4>
                      <p className="text-xs text-gray-400 flex items-center gap-2">
                        <Calendar className="w-3.5 h-3.5 text-amber-400" /> {booking.date} • {booking.timeSlot}
                      </p>
                    </div>

                    <div className="sm:text-right space-y-2 flex sm:flex-col items-center sm:items-end justify-between">
                      <span className="text-lg font-bold text-white block">₹{booking.totalPrice}</span>
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1 text-xs text-emerald-400 bg-emerald-950/60 border border-emerald-800/50 px-2 py-0.5 rounded-md font-semibold">
                          <CheckCircle2 className="w-3 h-3" /> {booking.status}
                        </div>
                        <button 
                          onClick={() => handleNavigate(booking.arenaTitle, booking.location, booking.locationUrl)}
                          className="p-1.5 bg-gray-800 hover:bg-gray-700 text-teal-400 border border-teal-500/30 rounded-md transition"
                          title="Navigate to turf"
                        >
                          <Navigation className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </main>
        )}
      </div>

      {/* POPUP MODAL: OWNER LOGIN / REGISTRATION */}
      {isOwnerLoginModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#161b22] border border-gray-800 w-full max-w-md rounded-2xl p-6 shadow-2xl relative space-y-6">
            <button 
              onClick={() => setIsOwnerLoginModalOpen(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <div>
              <span className="text-xs font-bold text-amber-500 uppercase tracking-wider">Partner Portal</span>
              <h3 className="text-xl font-bold text-white mt-1">Turf Owner Login</h3>
              <p className="text-xs text-gray-400">List your sports venue or manage your existing slots</p>
            </div>

            <form onSubmit={handleOwnerLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase mb-1">Mobile Number</label>
                <div className="relative">
                  <Phone className="w-4 h-4 absolute left-3 top-3.5 text-gray-500" />
                  <input 
                    type="tel"
                    required
                    value={ownerPhone}
                    onChange={(e) => setOwnerPhone(e.target.value)}
                    placeholder="9876543210"
                    className="w-full bg-gray-900 border border-gray-800 rounded-xl pl-9 pr-4 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase mb-1">Turf / Arena Name</label>
                <input 
                  type="text"
                  required
                  value={ownerArenaName}
                  onChange={(e) => setOwnerArenaName(e.target.value)}
                  placeholder="e.g. Secunderabad Box Cricket Arena"
                  className="w-full bg-gray-900 border border-gray-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <button 
                type="submit"
                className="w-full bg-amber-500 hover:bg-amber-400 text-black font-bold py-3 rounded-xl transition text-sm flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20"
              >
                <Building2 className="w-4 h-4" /> Enter Owner Dashboard
              </button>
            </form>
          </div>
        </div>
      )}

      {/* POPUP MODAL: PLAYER SLOT SELECTION & OTP */}
      {isBookingModalOpen && selectedArena && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-[#161b22] border border-gray-800 w-full max-w-md rounded-2xl p-6 shadow-2xl relative space-y-6">
            <button 
              onClick={() => setIsBookingModalOpen(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-white p-1"
            >
              <X className="w-5 h-5" />
            </button>

            <div>
              <span className="text-xs font-bold text-amber-500 uppercase tracking-wider bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                Instant Slot Booking
              </span>
              <h3 className="text-xl font-extrabold text-white mt-2">{selectedArena.title}</h3>
              <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
                <MapPin className="w-3.5 h-3.5 text-amber-500" /> {selectedArena.location}
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-400 uppercase mb-2">Available Slots Today</label>
              <div className="grid grid-cols-3 gap-2">
                {selectedArena.slots.map((s: string) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setSelectedSlot(s)}
                    className={`py-2 px-1 text-xs font-semibold rounded-xl border transition ${
                      selectedSlot === s 
                        ? 'bg-amber-500 text-black border-amber-500 font-bold shadow-lg shadow-amber-500/20' 
                        : 'bg-gray-900 text-gray-300 border-gray-800 hover:border-gray-700'
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            {!otpSent ? (
              <form onSubmit={handleSendOtp} className="space-y-4 pt-4 border-t border-gray-800">
                <div>
                  <label className="block text-xs font-semibold text-gray-400 uppercase mb-1">
                    Enter Mobile Number for OTP
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 absolute left-3 top-3.5 text-gray-500" />
                    <input 
                      type="tel"
                      required
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      placeholder="9876543210"
                      className="w-full bg-gray-900 border border-gray-800 rounded-xl pl-9 pr-4 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500"
                    />
                  </div>
                </div>

                <div className="bg-gray-900 border border-gray-800 p-3 rounded-xl flex items-center justify-between text-xs">
                  <span className="text-gray-400">Total Price:</span>
                  <span className="text-lg font-black text-amber-400">₹{selectedArena.price}</span>
                </div>

                <button 
                  type="submit"
                  className="w-full bg-amber-500 hover:bg-amber-400 text-black font-extrabold py-3 rounded-xl transition text-sm flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20"
                >
                  Send OTP Code →
                </button>
              </form>
            ) : (
              <form onSubmit={handleVerifyOtp} className="space-y-4 pt-4 border-t border-gray-800">
                <div className="bg-amber-500/10 border border-amber-500/20 p-3 rounded-xl text-xs text-amber-400">
                  <ShieldCheck className="w-4 h-4 inline mr-1" />
                  <span>OTP Sent to +91 {phoneNumber}</span>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-400 uppercase mb-1">
                    Enter 6-Digit OTP Code
                  </label>
                  <input 
                    type="text"
                    required
                    maxLength={6}
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value)}
                    placeholder="123456"
                    className="w-full bg-gray-900 border border-gray-800 rounded-xl px-4 py-2.5 text-center text-lg font-mono text-white tracking-widest focus:outline-none focus:border-amber-500"
                  />
                </div>

                <button 
                  type="submit"
                  className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-black font-black py-3.5 rounded-xl transition text-sm flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20"
                >
                  <CheckCircle2 className="w-4 h-4 fill-black stroke-amber-400" /> Verify & Pay Slot (₹{selectedArena.price})
                </button>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="border-t border-gray-800 bg-[#161b22] py-8 mt-12 text-xs text-gray-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="bg-amber-500 p-1.5 rounded-lg text-black">
              <Trophy className="w-4 h-4" />
            </div>
            <span className="font-bold text-white text-sm">WinDeclare</span>
            <span>© 2026 WinDeclare Sports Technologies Pvt Ltd. All rights reserved.</span>
          </div>

          <div className="flex gap-6 font-semibold">
            <a href="#terms" onClick={(e) => e.preventDefault()} className="hover:text-amber-400">Terms of Service</a>
            <a href="#privacy" onClick={(e) => e.preventDefault()} className="hover:text-amber-400">Privacy Policy</a>
            <a href="#partner" onClick={(e) => e.preventDefault()} className="hover:text-amber-400">Partner with Us</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
