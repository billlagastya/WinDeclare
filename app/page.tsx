'use client';

import React, { useState } from 'react';
import { 
  Trophy, User, MapPin, Search, Navigation, 
  ChevronRight, Calendar, CheckCircle2, Phone, X, ShieldCheck,
  Building2, Plus, LayoutDashboard, ScanLine, IndianRupee,
  Clock, CreditCard, LogOut, Mail, Check, Sparkles, SlidersHorizontal,
  Star, AlertCircle, Ticket, QrCode, Tag
} from 'lucide-react';

interface Arena {
  id: number;
  title: string;
  location: string;
  price: number;
  rating: number;
  reviews: number;
  sports: string[];
  image: string;
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
  playerPhone?: string;
  createdAt: string;
}

export default function WinDeclareApp() {
  const [view, setView] = useState<'browse' | 'profile' | 'owner-portal'>('browse');
  const [ownerTab, setOwnerTab] = useState<'listings' | 'bookings' | 'pricing' | 'checkin' | 'account'>('listings');
  const [selectedSport, setSelectedSport] = useState<string>('All');
  const [maxPrice, setMaxPrice] = useState<number>(2800);
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Dynamic Slot Pricing State
  const [selectedDay, setSelectedDay] = useState<string>('Mon');
  const [slotPrices, setSlotPrices] = useState<Record<string, Record<string, number>>>({});

  const hoursList = [
    '06:00 AM', '07:00 AM', '08:00 AM', '09:00 AM', '10:00 AM', '11:00 AM',
    '12:00 PM', '01:00 PM', '02:00 PM', '03:00 PM', '04:00 PM', '05:00 PM',
    '06:00 PM', '07:00 PM', '08:00 PM', '09:00 PM', '10:00 PM', '11:00 PM'
  ];

  // Auth & Booking States
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [ownerLoggedIn, setOwnerLoggedIn] = useState<boolean>(false);
  const [selectedArena, setSelectedArena] = useState<Arena | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<string>('');
  
  // Modal States
  const [isBookingModalOpen, setIsBookingModalOpen] = useState<boolean>(false);
  const [otpSent, setOtpSent] = useState<boolean>(false);
  const [phoneNumber, setPhoneNumber] = useState<string>('');
  const [otpCode, setOtpCode] = useState<string>('');

  // Owner Form State (Add New Turf Venue)
  const [showAddTurfForm, setShowAddTurfForm] = useState<boolean>(false);
  const [ticketCode, setTicketCode] = useState<string>('');
  const [checkInStatus, setCheckInStatus] = useState<string | null>(null);

  // Form selections for new venue
  const [newArenaName, setNewArenaName] = useState<string>('');
  const [newArenaLocation, setNewArenaLocation] = useState<string>('');
  const [newArenaPrice, setNewArenaPrice] = useState<number>(1200);
  const [newArenaEmail, setNewArenaEmail] = useState<string>('owner@windeclare.in');
  const [newArenaLocationUrl, setNewArenaLocationUrl] = useState<string>('');
  const [selectedSports, setSelectedSports] = useState<string[]>(['Football', 'Cricket']);
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>(['Floodlights', 'Parking']);
  const [gstEligible, setGstEligible] = useState<boolean>(true);

  // Toast State
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Arenas Data
  const [arenas, setArenas] = useState<Arena[]>([
    {
      id: 1,
      title: 'Kelo Bharat Sports Arena',
      location: 'Gachibowli, Hyderabad',
      price: 500,
      rating: 4.9,
      reviews: 39,
      sports: ['Cricket', 'Badminton', 'Tennis'],
      image: 'https://images.unsplash.com/photo-1518604666860-9ed391f76460?w=800&auto=format&fit=crop',
      locationUrl: 'https://maps.google.com/?q=Gachibowli+Hyderabad+Sports+Arena',
      slots: ['06:00 AM', '07:00 AM', '06:00 PM', '07:00 PM', '08:00 PM']
    },
    {
      id: 2,
      title: 'Smash & Serve Tennis Hub',
      location: 'Jubilee Hills, Hyderabad',
      price: 1200,
      rating: 4.9,
      reviews: 31,
      sports: ['Tennis', 'Pickleball'],
      image: 'https://images.unsplash.com/photo-1529900748604-07564a03e7a6?w=800&auto=format&fit=crop',
      locationUrl: 'https://maps.google.com/?q=Jubilee+Hills+Tennis+Hub',
      slots: ['06:00 AM', '08:00 AM', '05:00 PM', '06:00 PM']
    },
    {
      id: 3,
      title: 'Akshay Box Turf',
      location: 'Addagutta, Hyderabad',
      price: 800,
      rating: 4.8,
      reviews: 22,
      sports: ['Football', 'Cricket'],
      image: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=800&auto=format&fit=crop',
      locationUrl: 'https://maps.google.com/?q=Addagutta+Hyderabad+Box+Turf',
      slots: ['07:00 AM', '08:00 AM', '08:00 PM', '09:00 PM', '10:00 PM']
    }
  ]);

  // Player Bookings Data
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
      playerPhone: '9876543210',
      createdAt: '2026-07-27 12:30'
    }
  ]);

  const sportsList = ['Football', 'Cricket', 'Basketball', 'Tennis', 'Badminton', 'Volleyball', 'Pickleball'];
  const amenitiesList = ['Toilet', 'Parking', 'Drinking Water', 'Cafe', 'Floodlights', 'Changing Rooms'];

  const handleNavigate = (arenaTitle: string, location: string, locationUrl?: string) => {
    if (locationUrl && locationUrl.trim() !== '') {
      window.open(locationUrl, '_blank');
    } else {
      const query = encodeURIComponent(`${arenaTitle}, ${location}`);
      window.open(`https://www.google.com/maps/search/?api=1&query=${query}`, '_blank');
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
    hoursList.forEach(h => {
      updatedDayPrices[h] = newRate;
    });
    setSlotPrices(prev => ({
      ...prev,
      [selectedDay]: updatedDayPrices
    }));
    showToast(`Applied ${percentage > 0 ? `+${percentage}% surge (₹${newRate})` : `reset base rate (₹323)`} for ${selectedDay}`);
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
    if (!newArenaName || !newArenaLocation) {
      alert('Please fill out Arena Name and Location!');
      return;
    }

    const created: Arena = {
      id: Date.now(),
      title: newArenaName,
      location: newArenaLocation,
      price: Number(newArenaPrice),
      rating: 5.0,
      reviews: 1,
      sports: selectedSports.length > 0 ? selectedSports : ['Football'],
      image: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=800&auto=format&fit=crop',
      locationUrl: newArenaLocationUrl,
      slots: ['06:00 AM', '07:00 AM', '06:00 PM', '07:00 PM', '08:00 PM']
    };

    setArenas([created, ...arenas]);
    setShowAddTurfForm(false);
    showToast(`🏢 "${created.title}" Ground Arena Listed Successfully!`);
  };

  const handleVerifyTicket = (e: React.FormEvent) => {
    e.preventDefault();
    if (ticketCode.trim().length > 0) {
      const formatted = ticketCode.toUpperCase().trim();
      setCheckInStatus(`✓ Ticket ${formatted} Verified! Player Checked-In Successfully.`);
      showToast(`Verified Ticket ${formatted}`);
    } else {
      alert('Please enter a valid ticket reference code (e.g. WD-43R5KMN70)');
    }
  };

  const handleOpenBooking = (arena: Arena) => {
    setSelectedArena(arena);
    setSelectedSlot(arena.slots[0] || '06:00 PM');
    setIsBookingModalOpen(true);
  };

  const handleSendOtp = (e: React.FormEvent) => {
    e.preventDefault();
    if (phoneNumber.length >= 10) {
      setOtpSent(true);
      showToast(`OTP sent to +91 ${phoneNumber}`);
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
        playerPhone: phoneNumber,
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

  return (
    <div className="min-h-screen bg-[#070b12] text-gray-100 font-sans antialiased flex flex-col justify-between selection:bg-amber-500 selection:text-black">
      <div>
        {/* Toast Notification */}
        {toastMessage && (
          <div className="fixed top-20 right-6 z-50 bg-emerald-500 text-black font-bold px-5 py-3 rounded-xl shadow-2xl flex items-center gap-3 animate-bounce">
            <CheckCircle2 className="w-5 h-5 text-black" />
            <span>{toastMessage}</span>
          </div>
        )}

        {/* Top Header */}
        <header className="border-b border-gray-800/80 bg-[#0d1117]/90 backdrop-blur sticky top-0 z-40">
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
                {view === 'owner-portal' && (
                  <span className="bg-amber-500/20 text-amber-400 border border-amber-500/30 text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider">
                    Owner Portal
                  </span>
                )}
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button 
                onClick={() => setView('browse')}
                className={`text-xs font-semibold px-3 py-2 rounded-xl transition ${
                  view === 'browse' ? 'bg-amber-500 text-black font-bold' : 'text-gray-300 hover:text-white'
                }`}
              >
                Browse Turfs
              </button>

              <button 
                onClick={() => {
                  setOwnerLoggedIn(true);
                  setView('owner-portal');
                }}
                className={`flex items-center gap-1.5 text-xs font-bold px-3 py-2 rounded-xl border transition ${
                  view === 'owner-portal' 
                    ? 'bg-amber-500 text-black border-amber-500' 
                    : 'bg-amber-500/10 text-amber-400 border-amber-500/30 hover:bg-amber-500/20'
                }`}
              >
                <Building2 className="w-4 h-4" />
                <span>Owner Dashboard</span>
              </button>

              <button 
                onClick={() => setView('profile')}
                className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-xl border transition ${
                  view === 'profile'
                    ? 'bg-amber-500 text-black font-bold border-amber-400'
                    : 'text-gray-300 hover:text-white bg-gray-900 border-gray-800'
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

        {/* VIEW 1: PLAYER BROWSE DASHBOARD */}
        {view === 'browse' && (
          <main className="max-w-7xl mx-auto px-4 py-8">
            <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
              <div>
                <span className="text-xs font-bold text-amber-500 tracking-widest uppercase bg-amber-500/10 border border-amber-500/20 px-2.5 py-1 rounded-md">
                  ⚡ Instant Confirmation
                </span>
                <h1 className="text-3xl sm:text-4xl font-extrabold mt-3 text-white">
                  Find the perfect <span className="text-amber-400">turf</span> near you.
                </h1>
                <p className="text-gray-400 text-xs sm:text-sm mt-1">
                  Book 5-a-side grounds, box cricket pitches, and badminton courts with instant confirmation.
                </p>
              </div>

              <button 
                onClick={() => {
                  setOwnerLoggedIn(true);
                  setView('owner-portal');
                  setOwnerTab('listings');
                  setShowAddTurfForm(true);
                }}
                className="px-5 py-3 bg-gradient-to-r from-amber-500 to-orange-500 text-black font-extrabold text-sm rounded-xl shadow-lg hover:brightness-110 transition flex items-center gap-2"
              >
                <Plus className="w-5 h-5 stroke-[3]" /> Add New Turf Venue
              </button>
            </div>

            {/* Search & Filters */}
            <div className="bg-[#0e131f] border border-gray-800/80 rounded-2xl p-4 mb-6 flex flex-wrap gap-4 items-center justify-between shadow-xl">
              <div className="flex-1 min-w-[280px] relative">
                <Search className="w-4 h-4 absolute left-3 top-3.5 text-gray-500" />
                <input 
                  type="text" 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by arena name, location (e.g. Addagutta, Gachibowli)..." 
                  className="w-full bg-[#070b12] border border-gray-800 rounded-xl pl-9 pr-4 py-2 text-sm focus:outline-none focus:border-amber-500 text-white"
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

            {/* Category Pills */}
            <div className="flex gap-2 overflow-x-auto pb-4 mb-6 no-scrollbar">
              {['All', ...sportsList].map((sport) => (
                <button
                  key={sport}
                  onClick={() => setSelectedSport(sport)}
                  className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
                    selectedSport === sport 
                      ? 'bg-amber-500 text-black font-bold' 
                      : 'bg-[#0e131f] border border-gray-800 text-gray-300 hover:border-gray-600'
                  }`}
                >
                  {sport === 'All' ? '⚡ All Sports' : sport}
                </button>
              ))}
            </div>

            {/* Arenas Grid */}
            <div className="grid md:grid-cols-3 gap-6">
              {arenas
                .filter(a => (selectedSport === 'All' || a.sports.includes(selectedSport)) && a.price <= maxPrice && (a.title.toLowerCase().includes(searchQuery.toLowerCase()) || a.location.toLowerCase().includes(searchQuery.toLowerCase())))
                .map((arena) => (
                  <div key={arena.id} className="bg-[#0e131f] border border-gray-800/80 rounded-2xl overflow-hidden hover:border-amber-500/40 transition flex flex-col justify-between shadow-xl group">
                    <div>
                      <div className="relative h-48 bg-gray-950 overflow-hidden">
                        <img src={arena.image} alt={arena.title} className="w-full h-full object-cover group-hover:scale-105 transition duration-500" />
                        <div className="absolute top-3 right-3 bg-black/80 backdrop-blur text-xs font-bold text-amber-400 px-2.5 py-1 rounded-md">
                          ★ {arena.rating} ({arena.reviews})
                        </div>
                        <div className="absolute top-3 left-3 flex gap-1 flex-wrap">
                          {arena.sports.map(s => (
                            <span key={s} className="bg-black/80 text-amber-400 text-[10px] font-extrabold uppercase px-2 py-0.5 rounded">
                              {s}
                            </span>
                          ))}
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
                      <div className="mt-4 pt-4 border-t border-gray-800/80 space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-xl font-extrabold text-white">₹{arena.price}<span className="text-xs text-gray-500 font-normal">/hr</span></span>
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

        {/* VIEW 2: OWNER PORTAL WITH SIDEBAR (MATCHING SCREENSHOTS) */}
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
                <LogOut className="w-4 h-4" /> Logout
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

                    {/* ADD NEW TURF VENUE BUTTON */}
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

                        <div>
                          <label className="block text-[11px] font-bold text-amber-400 uppercase mb-1 flex items-center gap-1">
                            📍 Google Maps Share URL (Optional)
                          </label>
                          <input 
                            type="url" 
                            value={newArenaLocationUrl}
                            onChange={(e) => setNewArenaLocationUrl(e.target.value)}
                            placeholder="https://maps.app.goo.gl/..." 
                            className="w-full bg-[#080c14] border border-gray-800 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-amber-500" 
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

                        {/* Supported Sports Multi-Select */}
                        <div>
                          <label className="block text-[11px] font-bold text-gray-400 uppercase mb-2">Supported Sports *</label>
                          <div className="flex flex-wrap gap-2">
                            {sportsList.map((sport) => (
                              <button
                                type="button"
                                key={sport}
                                onClick={() => toggleSport(sport)}
                                className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition ${
                                  selectedSports.includes(sport)
                                    ? 'bg-amber-500/20 text-amber-400 border-amber-500/50 font-bold'
                                    : 'bg-[#080c14] text-gray-400 border-gray-800 hover:text-white'
                                }`}
                              >
                                {sport}
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Facilities & Amenities */}
                        <div>
                          <label className="block text-[11px] font-bold text-gray-400 uppercase mb-2">Facilities & Amenities</label>
                          <div className="flex flex-wrap gap-2">
                            {amenitiesList.map((amenity) => (
                              <button
                                type="button"
                                key={amenity}
                                onClick={() => toggleAmenity(amenity)}
                                className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition ${
                                  selectedAmenities.includes(amenity)
                                    ? 'bg-teal-500/20 text-teal-400 border-teal-500/50 font-bold'
                                    : 'bg-[#080c14] text-gray-400 border-gray-800 hover:text-white'
                                }`}
                              >
                                {amenity}
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Tax Settings */}
                        <div>
                          <label className="block text-[11px] font-bold text-gray-400 uppercase mb-1">Tax Settings</label>
                          <button
                            type="button"
                            onClick={() => setGstEligible(!gstEligible)}
                            className={`w-full py-2.5 px-4 rounded-xl text-xs font-bold border transition text-left flex items-center justify-between ${
                              gstEligible ? 'bg-amber-500/10 border-amber-500/40 text-amber-400' : 'bg-[#080c14] border-gray-800 text-gray-400'
                            }`}
                          >
                            <span>Eligible to collect 18% GST</span>
                            {gstEligible && <Check className="w-4 h-4 stroke-[3]" />}
                          </button>
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
                              <span>₹{arena.price}/hr</span> • <span>★ {arena.rating}</span> • <span>{arena.sports.join(', ')}</span>
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
                    {userBookings.map((b) => (
                      <div key={b.id} className="bg-[#0e1320] border border-gray-800 rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="space-y-1">
                          <span className="text-xs font-black text-amber-500">{b.id}</span>
                          <h4 className="font-bold text-white text-base">{b.arenaTitle}</h4>
                          <p className="text-xs text-gray-400 flex items-center gap-2">
                            <Clock className="w-3.5 h-3.5 text-amber-400" /> {b.date} • {b.timeSlot} ({b.sport})
                          </p>
                          <p className="text-[11px] text-gray-500">Player Contact: +91 {b.playerPhone || '9876543210'}</p>
                        </div>

                        <div className="sm:text-right space-y-1">
                          <span className="text-xl font-black text-amber-400 block">₹{b.price}</span>
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
                        <h3 className="font-bold text-white text-base">Kelo Bharat Sports Arena</h3>
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
                      {hoursList.map((hour) => (
                        <div 
                          key={hour} 
                          className="bg-[#080c14] border border-gray-800/80 p-3 rounded-xl space-y-2 hover:border-amber-500/40 transition"
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-extrabold text-white">{hour}</span>
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
                                value={slotPrices[selectedDay]?.[hour] ?? 323}
                                onChange={(e) => handlePriceChange(selectedDay, hour, Number(e.target.value))}
                                className="w-full bg-[#0e1320] border border-gray-800 rounded-lg pl-7 pr-3 py-1.5 text-xs text-amber-400 font-mono font-bold focus:outline-none focus:border-amber-500"
                              />
                            </div>
                            <p className="text-[10px] text-gray-500 font-semibold">
                              Charges: <span className="text-amber-400 font-bold">₹{slotPrices[selectedDay]?.[hour] ?? 323}</span>
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
                          placeholder="e.g. WD-43R5KMN70"
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

        {/* VIEW 3: PROFILE & USER BOOKINGS */}
        {view === 'profile' && (
          <main className="max-w-4xl mx-auto px-4 py-8 space-y-6">
            <div className="bg-[#0e131f] border border-gray-800 rounded-2xl p-6 flex items-center justify-between shadow-xl">
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

            <div className="bg-[#0e131f] border border-gray-800 rounded-2xl p-6 shadow-xl space-y-4">
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

      {/* POPUP MODAL: PLAYER SLOT SELECTION & OTP */}
      {isBookingModalOpen && selectedArena && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-[#0e1320] border border-gray-800 w-full max-w-md rounded-2xl p-6 shadow-2xl relative space-y-6">
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
                      className="w-full bg-[#080c14] border border-gray-800 rounded-xl pl-9 pr-4 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500"
                    />
                  </div>
                </div>

                <div className="bg-[#080c14] border border-gray-800 p-3 rounded-xl flex items-center justify-between text-xs">
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
                    className="w-full bg-[#080c14] border border-gray-800 rounded-xl px-4 py-2.5 text-center text-lg font-mono text-white tracking-widest focus:outline-none focus:border-amber-500"
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
            <a href="#partner" onClick={(e) => e.preventDefault()} className="hover:text-amber-400">Partner with Us</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
