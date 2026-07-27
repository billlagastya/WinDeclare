'use client';

import React, { useState, useMemo } from 'react';
import { 
  Trophy, User, MapPin, Search, Filter, Navigation,
  ChevronRight, Calendar, CheckCircle2, LogOut,
  Clock, Plus, X, Star, ShieldCheck, SlidersHorizontal,
  Activity, Sparkles, Share2, Download, Phone, ArrowRight,
  Check, Zap, AlertCircle, Building2, Ticket, QrCode
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
  addOns: string[];
  totalPrice: number;
  status: 'Confirmed' | 'Completed' | 'Cancelled';
  paymentMethod: string;
  createdAt: string;
}

export default function WinDeclareApp() {
  const [view, setView] = useState<'login' | 'browse' | 'profile' | 'owner'>('browse');
  const [role, setRole] = useState<'player' | 'owner'>('player');
  const [selectedSport, setSelectedSport] = useState<string>('All');
  const [maxPrice, setMaxPrice] = useState<number>(2500);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortBy, setSortBy] = useState<'rating' | 'price-asc' | 'price-desc'>('rating');
  const [selectedAmenityFilter, setSelectedAmenityFilter] = useState<string>('All');

  // Interactive Modals State
  const [activeArenaForBooking, setActiveArenaForBooking] = useState<Arena | null>(null);
  const [activeArenaForDetails, setActiveArenaForDetails] = useState<Arena | null>(null);
  const [selectedBookingDate, setSelectedBookingDate] = useState<string>('Today, Jul 27');
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<string>('');
  const [selectedSportForBooking, setSelectedSportForBooking] = useState<string>('');
  const [selectedAddOns, setSelectedAddOns] = useState<string[]>([]);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>('UPI (GPay / PhonePe / Paytm)');
  
  // Notification Toast State
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [activeTicket, setActiveTicket] = useState<Booking | null>(null);

  // New Arena Form Modal for Turf Owners
  const [isAddArenaModalOpen, setIsAddArenaModalOpen] = useState<boolean>(false);
  const [newArena, setNewArena] = useState({
    title: '',
    location: '',
    locationUrl: '',
    address: '',
    price: 600,
    sports: ['Football', 'Cricket'],
    surface: '5G Synthetic Turf',
    image: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=800&auto=format&fit=crop',
    amenities: ['Floodlights', 'Parking', 'Changing Room'],
    description: 'State-of-the-art sports arena built with international standard turf materials.'
  });

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Helper function to open Google Maps for navigation (uses custom locationUrl if available)
  const handleNavigate = (arenaTitle: string, location: string, locationUrl?: string) => {
    if (locationUrl && locationUrl.trim() !== '') {
      window.open(locationUrl, '_blank');
    } else {
      const query = encodeURIComponent(`${arenaTitle}, ${location}`);
      window.open(`https://www.google.com/maps/search/?api=1&query=${query}`, '_blank');
    }
  };

  // Initial Arenas Data
  const [arenas, setArenas] = useState<Arena[]>([
    {
      id: 1,
      title: 'Akshay Box Turf',
      location: 'Addagutta, Hyderabad',
      address: 'Plot 42, Near Metro Pillar 120, Addagutta Main Rd',
      price: 800,
      rating: 4.8,
      reviews: 22,
      sports: ['Football', 'Cricket'],
      surface: 'FIFA 2-Star 5G Grass',
      amenities: ['Floodlights', 'Parking', 'Water Dispenser', 'Changing Room', 'Seating Dugout'],
      image: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=800&auto=format&fit=crop',
      description: 'Premium enclosed multi-sport box turf with professional shock-pad underlayment and high-intensity LED stadium floodlights.',
      locationUrl: 'https://maps.google.com/?q=Addagutta+Hyderabad+Box+Turf',
      slots: ['06:00 AM - 07:00 AM', '07:00 AM - 08:00 AM', '05:00 PM - 06:00 PM', '06:00 PM - 07:00 PM', '07:00 PM - 08:00 PM', '08:00 PM - 09:00 PM', '09:00 PM - 10:00 PM']
    },
    {
      id: 2,
      title: 'Monk Box Cricket & Turf',
      location: 'Secunderabad, Secu6',
      address: 'Behind City Center Mall, Lane 3, Secunderabad',
      price: 300,
      rating: 4.8,
      reviews: 44,
      sports: ['Cricket', 'Football', 'Volleyball'],
      surface: 'High-density Polypropylene Mat',
      amenities: ['Floodlights', 'Equipment Rental', 'CCTV Security', 'First Aid'],
      image: 'https://images.unsplash.com/photo-1529900748604-07564a03e7a6?w=800&auto=format&fit=crop',
      description: 'Budget-friendly, high-energy box cricket and 5-a-side football arena popular among local tournaments and weekend friendlies.',
      locationUrl: 'https://maps.google.com/?q=Secunderabad+Box+Cricket',
      slots: ['06:00 AM - 07:00 AM', '08:00 AM - 09:00 AM', '04:00 PM - 05:00 PM', '06:00 PM - 07:00 PM', '09:00 PM - 10:00 PM', '10:00 PM - 11:00 PM']
    },
    {
      id: 3,
      title: 'Kelo Bharat Sports Arena',
      location: 'Gachibowli, Hyderabad',
      address: 'Sports Village Campus, Opp. IIIT Hyderabad, Gachibowli',
      price: 500,
      rating: 4.9,
      reviews: 39,
      sports: ['Cricket', 'Badminton', 'Tennis'],
      surface: 'BWF Certified Teak Wood Court',
      amenities: ['AC Courts', 'Shower Rooms', 'Pro Shop', 'Cafeteria', 'Parking'],
      image: 'https://images.unsplash.com/photo-1518604666860-9ed391f76460?w=800&auto=format&fit=crop',
      description: 'World-class indoor sports complex with air-conditioned synthetic acrylic badminton courts and professional coaching facilities.',
      locationUrl: 'https://maps.google.com/?q=Gachibowli+Hyderabad+Sports+Arena',
      slots: ['06:00 AM - 07:00 AM', '07:00 AM - 08:00 AM', '09:00 AM - 10:00 AM', '03:00 PM - 04:00 PM', '05:00 PM - 06:00 PM', '08:00 PM - 09:00 PM']
    },
    {
      id: 4,
      title: 'Strikers 360 Arena',
      location: 'Madhapur, Hyderabad',
      address: '100 Feet Road, Near Cyber Towers, Madhapur',
      price: 1200,
      rating: 4.7,
      reviews: 58,
      sports: ['Football', 'Basketball'],
      surface: 'Cushioned Acrylic Hard Court',
      amenities: ['Floodlights', 'Sound System', 'Locker Rooms', 'Cafeteria'],
      image: 'https://images.unsplash.com/photo-1546519638-68e109498ffc?w=800&auto=format&fit=crop',
      description: 'Top-tier rooftop sports arena featuring dual basketball hoops and 7-a-side football setup with panoramic city light views.',
      locationUrl: 'https://maps.google.com/?q=Madhapur+Cyber+Towers+Turf',
      slots: ['07:00 AM - 08:00 AM', '05:00 PM - 06:00 PM', '07:00 PM - 08:00 PM', '09:00 PM - 10:00 PM']
    },
    {
      id: 5,
      title: 'Smash & Serve Tennis Hub',
      location: 'Jubilee Hills, Hyderabad',
      address: 'Road No. 36, Beside Metro Station, Jubilee Hills',
      price: 1500,
      rating: 4.9,
      reviews: 31,
      sports: ['Tennis', 'Pickleball'],
      surface: 'DecoTurf Hard Court',
      amenities: ['US Open Standard Hard Court', 'Ball Machine Rental', 'Night Lights', 'Valet Parking'],
      image: 'https://images.unsplash.com/photo-1622279457486-62dcc4a431d6?w=800&auto=format&fit=crop',
      description: 'Professional grade tennis and pickleball venue built according to ITF specs with tournament lighting.',
      locationUrl: 'https://maps.google.com/?q=Jubilee+Hills+Tennis+Hub',
      slots: ['06:00 AM - 07:00 AM', '07:00 AM - 08:00 AM', '04:00 PM - 05:00 PM', '06:00 PM - 07:00 PM']
    }
  ]);

  // Initial User Bookings Data
  const [userBookings, setUserBookings] = useState<Booking[]>([
    {
      id: 'WD-43R5KMN70',
      arenaId: 3,
      arenaTitle: 'Kelo Bharat Sports Arena',
      location: 'Gachibowli, Hyderabad',
      locationUrl: 'https://maps.google.com/?q=Gachibowli+Hyderabad+Sports+Arena',
      date: 'Jul 28, 2026',
      timeSlot: '06:00 AM - 07:00 AM',
      sport: 'Badminton',
      price: 500,
      addOns: ['Pro Racket Rental (+₹100)'],
      totalPrice: 620,
      status: 'Confirmed',
      paymentMethod: 'UPI (GPay)',
      createdAt: '2026-07-27 12:30'
    }
  ]);

  const sportsList = ['All', 'Football', 'Cricket', 'Basketball', 'Tennis', 'Badminton', 'Volleyball', 'Pickleball'];

  const addOnOptions = [
    { id: 'balls', name: 'Match Football / Cricket Gear', price: 150 },
    { id: 'lights', name: 'High-Power Night Floodlights', price: 200 },
    { id: 'bibs', name: '10x Team Color Bibs', price: 100 },
    { id: 'referee', name: 'Certified Match Referee', price: 400 }
  ];

  // Filtered Arenas logic
  const filteredArenas = useMemo(() => {
    return arenas
      .filter((arena) => {
        const matchesSport = selectedSport === 'All' || arena.sports.includes(selectedSport);
        const matchesPrice = arena.price <= maxPrice;
        const matchesQuery = 
          arena.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          arena.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
          arena.sports.some(s => s.toLowerCase().includes(searchQuery.toLowerCase()));
        const matchesAmenity = selectedAmenityFilter === 'All' || arena.amenities.includes(selectedAmenityFilter);

        return matchesSport && matchesPrice && matchesQuery && matchesAmenity;
      })
      .sort((a, b) => {
        if (sortBy === 'rating') return b.rating - a.rating;
        if (sortBy === 'price-asc') return a.price - b.price;
        if (sortBy === 'price-desc') return b.price - a.price;
        return 0;
      });
  }, [arenas, selectedSport, maxPrice, searchQuery, sortBy, selectedAmenityFilter]);

  // Handle Opening Booking Modal
  const openBookingModal = (arena: Arena) => {
    setActiveArenaForBooking(arena);
    setSelectedSportForBooking(arena.sports[0] || 'Football');
    setSelectedTimeSlot(arena.slots[0] || '06:00 PM - 07:00 PM');
    setSelectedAddOns([]);
  };

  // Handle Confirming Booking
  const handleConfirmBooking = () => {
    if (!activeArenaForBooking || !selectedTimeSlot) {
      alert('Please select a valid slot!');
      return;
    }

    const addOnTotal = selectedAddOns.reduce((acc, currId) => {
      const opt = addOnOptions.find(o => o.id === currId);
      return acc + (opt ? opt.price : 0);
    }, 0);

    const convenienceFee = 20;
    const finalTotal = activeArenaForBooking.price + addOnTotal + convenienceFee;

    const newBookingId = `WD-${Math.random().toString(36).substring(2, 9).toUpperCase()}`;

    const newBooking: Booking = {
      id: newBookingId,
      arenaId: activeArenaForBooking.id,
      arenaTitle: activeArenaForBooking.title,
      location: activeArenaForBooking.location,
      locationUrl: activeArenaForBooking.locationUrl,
      date: selectedBookingDate,
      timeSlot: selectedTimeSlot,
      sport: selectedSportForBooking,
      price: activeArenaForBooking.price,
      addOns: selectedAddOns.map(id => addOnOptions.find(o => o.id === id)?.name || id),
      totalPrice: finalTotal,
      status: 'Confirmed',
      paymentMethod: selectedPaymentMethod,
      createdAt: new Date().toISOString().replace('T', ' ').substring(0, 16)
    };

    setUserBookings([newBooking, ...userBookings]);
    setActiveArenaForBooking(null);
    showToast(`🎉 Booking Confirmed! Ticket ID: ${newBookingId}`);
    setActiveTicket(newBooking);
  };

  // Handle Adding New Arena (Turf Owner Mode)
  const handleCreateArena = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newArena.title || !newArena.location) return;

    const created: Arena = {
      id: Date.now(),
      title: newArena.title,
      location: newArena.location,
      locationUrl: newArena.locationUrl,
      address: newArena.address || newArena.location,
      price: Number(newArena.price),
      rating: 5.0,
      reviews: 1,
      sports: newArena.sports,
      surface: newArena.surface,
      amenities: newArena.amenities,
      image: newArena.image || 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=800&auto=format&fit=crop',
      description: newArena.description,
      slots: ['06:00 AM - 07:00 AM', '05:00 PM - 06:00 PM', '07:00 PM - 08:00 PM', '09:00 PM - 10:00 PM']
    };

    setArenas([created, ...arenas]);
    setIsAddArenaModalOpen(false);
    showToast(`🏢 "${created.title}" successfully published to WinDeclare!`);
  };

  return (
    <div className="min-h-screen bg-[#0d1117] text-gray-100 font-sans antialiased flex flex-col justify-between selection:bg-amber-500 selection:text-black">
      <div>
        {/* Top Floating Toast Notification */}
        {toastMessage && (
          <div className="fixed top-20 right-6 z-50 bg-emerald-500 text-black font-bold px-5 py-3 rounded-xl shadow-2xl flex items-center gap-3 animate-bounce">
            <CheckCircle2 className="w-5 h-5 text-black" />
            <span>{toastMessage}</span>
          </div>
        )}

        {/* Top Header Navigation */}
        <header className="border-b border-gray-800 bg-[#161b22]/90 backdrop-blur sticky top-0 z-40">
          <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
            <div 
              className="flex items-center gap-3 cursor-pointer group"
              onClick={() => setView('browse')}
            >
              <div className="bg-gradient-to-tr from-amber-500 to-orange-500 p-2.5 rounded-xl text-black shadow-lg shadow-amber-500/20 group-hover:scale-105 transition duration-300">
                <Trophy className="w-5 h-5 fill-black stroke-black" />
              </div>
              <div>
                <span className="font-black text-xl tracking-tight text-white group-hover:text-amber-400 transition">
                  WinDeclare
                </span>
                <span className="hidden sm:inline-block text-[10px] uppercase tracking-widest font-extrabold text-amber-500 ml-2 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
                  India
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 sm:gap-4">
              <button
                onClick={() => setView(role === 'owner' ? 'owner' : 'browse')}
                className={`text-xs sm:text-sm font-semibold px-3 py-1.5 rounded-lg transition ${
                  view === 'browse' ? 'text-amber-400 bg-amber-500/10 border border-amber-500/20' : 'text-gray-400 hover:text-white'
                }`}
              >
                Browse Turfs
              </button>

              {role === 'owner' && (
                <button
                  onClick={() => setView('owner')}
                  className={`text-xs sm:text-sm font-semibold px-3 py-1.5 rounded-lg transition flex items-center gap-1.5 ${
                    view === 'owner' ? 'text-amber-400 bg-amber-500/10 border border-amber-500/20' : 'text-gray-400 hover:text-white'
                  }`}
                >
                  <Building2 className="w-4 h-4" />
                  Owner Portal
                </button>
              )}

              {view !== 'login' ? (
                <>
                  <button 
                    onClick={() => setView('profile')}
                    className={`flex items-center gap-1.5 text-xs sm:text-sm px-3 py-1.5 rounded-lg transition font-medium ${
                      view === 'profile' ? 'bg-amber-500 text-black font-bold' : 'text-gray-300 hover:text-white bg-gray-900 border border-gray-800'
                    }`}
                  >
                    <User className="w-4 h-4" />
                    <span>My Bookings</span>
                    <span className="bg-amber-400 text-black text-[10px] font-black px-1.5 py-0.5 rounded-full ml-0.5">
                      {userBookings.length}
                    </span>
                  </button>
                  
                  <button 
                    onClick={() => {
                      setView('login');
                      showToast('Logged out successfully');
                    }}
                    className="flex items-center gap-1 text-xs text-gray-400 hover:text-rose-400 p-2 rounded-lg hover:bg-rose-500/10 transition"
                    title="Logout"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </>
              ) : (
                <button 
                  onClick={() => setView('browse')}
                  className="text-xs sm:text-sm bg-amber-500 text-black font-bold px-4 py-2 rounded-xl hover:bg-amber-400 transition shadow-lg shadow-amber-500/20"
                >
                  Quick Browse →
                </button>
              )}
            </div>
          </div>
        </header>

        {/* VIEW 1: SIGN IN / AUTH PAGE */}
        {view === 'login' && (
          <main className="max-w-7xl mx-auto px-4 py-12 md:py-20 grid md:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <div className="inline-flex items-center gap-2 bg-amber-500/10 border border-amber-500/20 px-3.5 py-1.5 rounded-full text-xs font-bold text-amber-400">
                <Zap className="w-3.5 h-3.5 fill-amber-400" />
                <span>Instant Slot Confirmation • Zero Convenience Markup</span>
              </div>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-tight">
                Book the field. <br />
                <span className="bg-gradient-to-r from-amber-400 via-orange-400 to-emerald-400 bg-clip-text text-transparent">
                  Own the game.
                </span>
              </h1>
              <p className="text-gray-400 text-base sm:text-lg leading-relaxed">
                India's premier sports turf platform. Book FIFA-certified synthetic boxes, wooden badminton courts, and floodlit cricket grounds in under 30 seconds.
              </p>
              
              <div className="grid grid-cols-3 gap-4 pt-4 border-t border-gray-800">
                <div>
                  <p className="text-2xl sm:text-3xl font-black text-white">2,400+</p>
                  <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold">Turfs Nationwide</p>
                </div>
                <div>
                  <p className="text-2xl sm:text-3xl font-black text-white">180K+</p>
                  <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold">Matches Played</p>
                </div>
                <div>
                  <p className="text-2xl sm:text-3xl font-black text-amber-400">4.9 ★</p>
                  <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold">User Rating</p>
                </div>
              </div>

              {/* Demo Quick Fill Buttons */}
              <div className="bg-[#161b22] border border-gray-800 rounded-2xl p-4 flex items-center justify-between">
                <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Try Demo Account:</span>
                <div className="flex gap-2">
                  <button 
                    onClick={() => {
                      setRole('player');
                      setView('browse');
                      showToast('Logged in as Player (Demo)');
                    }}
                    className="text-xs bg-amber-500/10 border border-amber-500/30 text-amber-400 font-bold px-3 py-1.5 rounded-lg hover:bg-amber-500 hover:text-black transition"
                  >
                    🏆 Player Login
                  </button>
                  <button 
                    onClick={() => {
                      setRole('owner');
                      setView('owner');
                      showToast('Logged in as Turf Owner (Demo)');
                    }}
                    className="text-xs bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-bold px-3 py-1.5 rounded-lg hover:bg-emerald-500 hover:text-black transition"
                  >
                    🏢 Owner Portal
                  </button>
                </div>
              </div>
            </div>

            <div className="bg-[#161b22] border border-gray-800 rounded-3xl p-8 shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full blur-3xl pointer-events-none"></div>

              <h2 className="text-2xl font-black mb-1 text-white">Sign in to WinDeclare</h2>
              <p className="text-sm text-gray-400 mb-6">Select your portal type to get started</p>

              <div className="grid grid-cols-2 gap-2 p-1.5 bg-gray-950 rounded-xl mb-6 border border-gray-800">
                <button
                  type="button"
                  onClick={() => setRole('player')}
                  className={`py-2.5 text-xs font-extrabold uppercase tracking-wider rounded-lg transition flex items-center justify-center gap-2 ${
                    role === 'player' ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/20' : 'text-gray-400 hover:text-white'
                  }`}
                >
                  🏆 Player
                </button>
                <button
                  type="button"
                  onClick={() => setRole('owner')}
                  className={`py-2.5 text-xs font-extrabold uppercase tracking-wider rounded-lg transition flex items-center justify-center gap-2 ${
                    role === 'owner' ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/20' : 'text-gray-400 hover:text-white'
                  }`}
                >
                  🏢 Turf Owner
                </button>
              </div>

              <form onSubmit={(e) => { 
                e.preventDefault(); 
                setView(role === 'owner' ? 'owner' : 'browse');
                showToast(`Welcome back, ${role === 'owner' ? 'Turf Owner' : 'Player'}!`);
              }} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5">Email Address</label>
                  <input 
                    type="email" 
                    required
                    defaultValue={role === 'player' ? 'player@windeclare.in' : 'owner@windeclare.in'}
                    placeholder="you@windeclare.in" 
                    className="w-full bg-gray-900 border border-gray-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-amber-500 transition"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5">Password</label>
                  <input 
                    type="password" 
                    required
                    defaultValue="••••••••" 
                    placeholder="••••••••" 
                    className="w-full bg-gray-900 border border-gray-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-amber-500 transition"
                  />
                </div>

                <div className="flex items-center justify-between text-xs text-gray-400 pt-1">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" defaultChecked className="accent-amber-500 rounded" />
                    <span>Remember this device</span>
                  </label>
                  <a href="#forgot" onClick={(e) => e.preventDefault()} className="text-amber-500 hover:underline">Forgot password?</a>
                </div>

                <button 
                  type="submit"
                  className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-black font-black py-3.5 rounded-xl transition shadow-lg shadow-amber-500/20 tracking-wide text-sm mt-4"
                >
                  Sign In as {role === 'player' ? 'Player' : 'Turf Owner'} →
                </button>
              </form>
            </div>
          </main>
        )}

        {/* VIEW 2: BROWSE & FILTER ARENAS */}
        {view === 'browse' && (
          <main className="max-w-7xl mx-auto px-4 py-8">
            {/* Hero / Filter Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
              <div>
                <div className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-500 uppercase tracking-widest bg-amber-500/10 px-3 py-1 rounded-full border border-amber-500/20 mb-2">
                  <Sparkles className="w-3.5 h-3.5" /> Real-time Slot Availability
                </div>
                <h1 className="text-3xl sm:text-4xl font-black tracking-tight">
                  Find the perfect <span className="text-amber-400">turf</span> near you.
                </h1>
                <p className="text-gray-400 text-xs sm:text-sm mt-1">
                  Book 5-a-side grounds, box cricket pitches, and badminton courts with instant confirmation.
                </p>
              </div>

              {/* View toggle badge */}
              <div className="flex items-center gap-2 text-xs text-gray-400 bg-[#161b22] p-1.5 rounded-xl border border-gray-800 self-start md:self-auto">
                <span className="font-semibold px-2">Showing:</span>
                <span className="bg-amber-500 text-black font-extrabold px-2.5 py-1 rounded-lg">
                  {filteredArenas.length} Arenas
                </span>
              </div>
            </div>

            {/* Search & Comprehensive Filters Bar */}
            <div className="bg-[#161b22] border border-gray-800 rounded-2xl p-4 mb-8 space-y-4 shadow-xl">
              <div className="flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between">
                {/* Search Bar */}
                <div className="flex-1 relative">
                  <Search className="w-4 h-4 absolute left-3.5 top-3.5 text-gray-500" />
                  <input 
                    type="text" 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search by arena name, location (e.g. Addagutta, Madhapur), or sport..." 
                    className="w-full bg-gray-900 border border-gray-800 rounded-xl pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:border-amber-500 text-white placeholder-gray-500 transition"
                  />
                  {searchQuery && (
                    <button 
                      onClick={() => setSearchQuery('')}
                      className="absolute right-3 top-3 text-gray-500 hover:text-white"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>

                {/* Price Range Slider */}
                <div className="flex items-center gap-3 bg-gray-900 border border-gray-800 px-4 py-2 rounded-xl">
                  <span className="text-xs text-gray-400 font-bold uppercase tracking-wider">Max Price:</span>
                  <input 
                    type="range" 
                    min="300" 
                    max="3000" 
                    step="100" 
                    value={maxPrice} 
                    onChange={(e) => setMaxPrice(Number(e.target.value))}
                    className="accent-amber-500 cursor-pointer w-24 sm:w-32"
                  />
                  <span className="text-sm font-black text-amber-400 min-w-[75px] text-right">
                    ₹{maxPrice}/hr
                  </span>
                </div>

                {/* Sorting Selector */}
                <div className="flex items-center gap-2 bg-gray-900 border border-gray-800 px-3 py-2 rounded-xl text-xs">
                  <SlidersHorizontal className="w-3.5 h-3.5 text-gray-400" />
                  <span className="text-gray-400 font-bold">Sort:</span>
                  <select 
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as any)}
                    className="bg-transparent text-white font-semibold focus:outline-none cursor-pointer"
                  >
                    <option value="rating" className="bg-gray-900 text-white">Top Rated ★</option>
                    <option value="price-asc" className="bg-gray-900 text-white">Price: Low to High</option>
                    <option value="price-desc" className="bg-gray-900 text-white">Price: High to Low</option>
                  </select>
                </div>
              </div>

              {/* Amenity Filter Tags */}
              <div className="flex items-center gap-2 pt-2 border-t border-gray-800/80 text-xs overflow-x-auto no-scrollbar">
                <span className="text-gray-500 font-bold uppercase tracking-wider text-[11px] whitespace-nowrap">Filter Amenity:</span>
                {['All', 'Floodlights', 'Parking', 'Changing Room', 'AC Courts', 'Cafeteria'].map((amenity) => (
                  <button
                    key={amenity}
                    onClick={() => setSelectedAmenityFilter(amenity)}
                    className={`px-3 py-1 rounded-lg font-medium whitespace-nowrap transition ${
                      selectedAmenityFilter === amenity 
                        ? 'bg-gray-800 text-amber-400 border border-amber-500/40' 
                        : 'bg-gray-950 text-gray-400 hover:text-white border border-gray-800'
                    }`}
                  >
                    {amenity}
                  </button>
                ))}
              </div>
            </div>

            {/* Sports Category Filter Pills */}
            <div className="flex gap-2 overflow-x-auto pb-4 mb-8 no-scrollbar">
              {sportsList.map((sport) => (
                <button
                  key={sport}
                  onClick={() => setSelectedSport(sport)}
                  className={`px-5 py-2.5 rounded-xl text-xs font-extrabold uppercase tracking-wider whitespace-nowrap transition-all duration-200 ${
                    selectedSport === sport 
                      ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-black shadow-lg shadow-amber-500/20 scale-105' 
                      : 'bg-[#161b22] border border-gray-800 text-gray-300 hover:border-gray-600 hover:text-white'
                  }`}
                >
                  {sport === 'All' ? '⚡ All Sports' : sport}
                </button>
              ))}
            </div>

            {/* Empty State */}
            {filteredArenas.length === 0 && (
              <div className="bg-[#161b22] border border-gray-800 rounded-3xl p-12 text-center max-w-md mx-auto my-12 space-y-4">
                <div className="w-16 h-16 bg-gray-900 text-amber-500 rounded-2xl flex items-center justify-center mx-auto">
                  <AlertCircle className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-black text-white">No Arenas Found</h3>
                <p className="text-gray-400 text-xs leading-relaxed">
                  We couldn't find any sports turfs matching your selected sport, price filter, or search query.
                </p>
                <button 
                  onClick={() => {
                    setSelectedSport('All');
                    setMaxPrice(3000);
                    setSearchQuery('');
                    setSelectedAmenityFilter('All');
                  }}
                  className="bg-amber-500 text-black text-xs font-extrabold px-4 py-2.5 rounded-xl hover:bg-amber-400 transition"
                >
                  Reset All Filters
                </button>
              </div>
            )}

            {/* Arena Cards Grid */}
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredArenas.map((arena) => (
                <div 
                  key={arena.id} 
                  className="bg-[#161b22] border border-gray-800/80 hover:border-amber-500/50 rounded-2xl overflow-hidden shadow-xl transition-all duration-300 group flex flex-col justify-between"
                >
                  <div>
                    {/* Image Header with Badges */}
                    <div className="relative h-52 overflow-hidden bg-gray-950">
                      <img 
                        src={arena.image} 
                        alt={arena.title} 
                        className="w-full h-full object-cover group-hover:scale-105 transition duration-500" 
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-[#161b22] via-transparent to-transparent opacity-80"></div>

                      <div className="absolute top-3 left-3 flex flex-wrap gap-1.5 max-w-[70%]">
                        {arena.sports.map(s => (
                          <span key={s} className="bg-black/80 backdrop-blur border border-amber-500/30 text-[10px] uppercase tracking-wider font-extrabold text-amber-400 px-2.5 py-1 rounded-md">
                            {s}
                          </span>
                        ))}
                      </div>

                      <div className="absolute top-3 right-3 bg-black/80 backdrop-blur border border-gray-800 text-xs font-black text-amber-400 px-2.5 py-1 rounded-md flex items-center gap-1 shadow-lg">
                        <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                        <span>{arena.rating}</span>
                        <span className="text-gray-400 text-[10px]">({arena.reviews})</span>
                      </div>

                      <div className="absolute bottom-3 left-3">
                        <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 backdrop-blur text-[10px] font-bold px-2 py-0.5 rounded-full">
                          {arena.surface}
                        </span>
                      </div>
                    </div>

                    {/* Card Content */}
                    <div className="p-5 space-y-3">
                      <div>
                        <h3 className="font-extrabold text-lg text-white group-hover:text-amber-400 transition leading-snug">
                          {arena.title}
                        </h3>
                        <p className="text-xs text-gray-400 flex items-center gap-1 mt-1">
                          <MapPin className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                          <span className="truncate">{arena.location}</span>
                        </p>
                      </div>

                      {/* Amenities pills */}
                      <div className="flex flex-wrap gap-1 pt-1">
                        {arena.amenities.slice(0, 3).map(a => (
                          <span key={a} className="text-[10px] text-gray-400 bg-gray-900 border border-gray-800 px-2 py-0.5 rounded">
                            ✓ {a}
                          </span>
                        ))}
                        {arena.amenities.length > 3 && (
                          <span className="text-[10px] text-gray-500 bg-gray-900 px-1.5 py-0.5 rounded">
                            +{arena.amenities.length - 3} more
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Pricing and Action Footer */}
                  <div className="p-5 pt-0 space-y-3">
                    <div className="pt-4 border-t border-gray-800/80 flex items-center justify-between">
                      <div>
                        <span className="text-2xl font-black text-white">₹{arena.price}</span>
                        <span className="text-xs text-gray-400 font-medium"> / hour</span>
                      </div>

                      <div className="flex items-center gap-2">
                        <button 
                          onClick={() => setActiveArenaForDetails(arena)}
                          className="text-xs font-bold text-gray-400 hover:text-white bg-gray-900 border border-gray-800 px-2.5 py-2 rounded-xl transition"
                          title="View Details & Location"
                        >
                          Info
                        </button>
                        <button 
                          onClick={() => openBookingModal(arena)}
                          className="text-xs font-black bg-amber-500 hover:bg-amber-400 text-black px-4 py-2 rounded-xl transition shadow-lg shadow-amber-500/10 flex items-center gap-1"
                        >
                          <span>View Slots</span>
                          <ChevronRight className="w-3.5 h-3.5 stroke-[3]" />
                        </button>
                      </div>
                    </div>

                    {/* RESTORED NAVIGATE BUTTON */}
                    <button 
                      onClick={() => handleNavigate(arena.title, arena.location, arena.locationUrl)}
                      className="w-full py-2 bg-gray-900 hover:bg-gray-800 border border-teal-500/30 text-teal-400 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition"
                    >
                      <Navigation className="w-3.5 h-3.5" /> Navigate
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </main>
        )}

        {/* VIEW 3: TURF OWNER PORTAL */}
        {view === 'owner' && (
          <main className="max-w-7xl mx-auto px-4 py-8 space-y-8">
            {/* Owner Header */}
            <div className="bg-[#161b22] border border-gray-800 rounded-3xl p-6 md:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-xl">
              <div>
                <div className="inline-flex items-center gap-2 text-xs font-bold text-emerald-400 uppercase tracking-widest bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20 mb-2">
                  <Building2 className="w-3.5 h-3.5" /> Partner Owner Dashboard
                </div>
                <h1 className="text-3xl font-black text-white">Manage Sports Turfs</h1>
                <p className="text-xs text-gray-400 mt-1">
                  List new grounds, set hourly rates, track live player bookings and daily revenue.
                </p>
              </div>

              <button 
                onClick={() => setIsAddArenaModalOpen(true)}
                className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-black font-black px-5 py-3 rounded-2xl transition shadow-lg shadow-amber-500/20 flex items-center gap-2 self-start md:self-auto"
              >
                <Plus className="w-5 h-5 stroke-[3]" />
                <span>List New Turf Arena</span>
              </button>
            </div>

            {/* Owner Analytics Summary Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-[#161b22] border border-gray-800 rounded-2xl p-5">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Active Arenas</p>
                <p className="text-3xl font-black text-white mt-2">{arenas.length}</p>
                <p className="text-[11px] text-emerald-400 mt-1">100% Listed Active</p>
              </div>
              <div className="bg-[#161b22] border border-gray-800 rounded-2xl p-5">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Today's Revenue</p>
                <p className="text-3xl font-black text-amber-400 mt-2">₹14,200</p>
                <p className="text-[11px] text-gray-400 mt-1">+18% vs yesterday</p>
              </div>
              <div className="bg-[#161b22] border border-gray-800 rounded-2xl p-5">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Booked Slots Today</p>
                <p className="text-3xl font-black text-white mt-2">24 Slots</p>
                <p className="text-[11px] text-emerald-400 mt-1">82% Peak Occupancy</p>
              </div>
              <div className="bg-[#161b22] border border-gray-800 rounded-2xl p-5">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Average Rating</p>
                <p className="text-3xl font-black text-amber-400 mt-2">4.85 ★</p>
                <p className="text-[11px] text-gray-400 mt-1">From 194 verified reviews</p>
              </div>
            </div>

            {/* Managed Arenas List */}
            <div className="bg-[#161b22] border border-gray-800 rounded-3xl p-6">
              <h2 className="text-xl font-bold text-white mb-4">Your Listed Arenas</h2>

              <div className="space-y-4">
                {arenas.map((arena) => (
                  <div key={arena.id} className="bg-gray-900 border border-gray-800 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
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

                    <div className="flex items-center gap-2 border-t sm:border-t-0 border-gray-800 pt-3 sm:pt-0">
                      <button 
                        onClick={() => handleNavigate(arena.title, arena.location, arena.locationUrl)}
                        className="text-xs font-bold bg-gray-800 hover:bg-gray-700 text-teal-400 border border-teal-500/30 px-3 py-2 rounded-xl transition flex items-center gap-1"
                      >
                        <Navigation className="w-3.5 h-3.5" /> Navigate
                      </button>
                      <button 
                        onClick={() => openBookingModal(arena)}
                        className="text-xs font-bold bg-gray-800 hover:bg-gray-700 text-white px-3 py-2 rounded-xl transition"
                      >
                        Preview Slots
                      </button>
                      <button 
                        onClick={() => {
                          setArenas(arenas.filter(a => a.id !== arena.id));
                          showToast(`Removed "${arena.title}"`);
                        }}
                        className="text-xs font-bold text-rose-400 hover:bg-rose-500/10 border border-rose-500/20 px-3 py-2 rounded-xl transition"
                      >
                        Unlist Arena
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </main>
        )}

        {/* VIEW 4: PROFILE & USER BOOKINGS */}
        {view === 'profile' && (
          <main className="max-w-4xl mx-auto px-4 py-8 space-y-6">
            {/* User Profile Card */}
            <div className="bg-[#161b22] border border-gray-800 rounded-3xl p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-6 shadow-xl">
              <div className="flex items-center gap-5">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-amber-400 via-orange-500 to-emerald-400 text-black font-black text-2xl flex items-center justify-center shadow-lg shadow-amber-500/20">
                  PL
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-2xl font-black text-white">Player Account</h2>
                    <span className="bg-amber-500/10 border border-amber-500/30 text-amber-400 text-[10px] font-bold px-2 py-0.5 rounded-full">
                      VERIFIED PLAYER
                    </span>
                  </div>
                  <p className="text-xs text-gray-400 mt-0.5">player@windeclare.in • +91 98765 43210</p>
                </div>
              </div>

              <div className="flex gap-6 text-center bg-gray-900 border border-gray-800 px-6 py-3 rounded-2xl">
                <div>
                  <p className="text-2xl font-black text-white">{userBookings.length}</p>
                  <p className="text-[10px] text-gray-500 uppercase tracking-wider font-bold">Total</p>
                </div>
                <div className="border-l border-gray-800 pl-6">
                  <p className="text-2xl font-black text-emerald-400">
                    {userBookings.filter(b => b.status === 'Confirmed').length}
                  </p>
                  <p className="text-[10px] text-gray-500 uppercase tracking-wider font-bold">Confirmed</p>
                </div>
                <div className="border-l border-gray-800 pl-6">
                  <p className="text-2xl font-black text-amber-400">
                    ₹{userBookings.reduce((sum, b) => sum + b.totalPrice, 0)}
                  </p>
                  <p className="text-[10px] text-gray-500 uppercase tracking-wider font-bold">Spent</p>
                </div>
              </div>
            </div>

            {/* Bookings List */}
            <div className="bg-[#161b22] border border-gray-800 rounded-3xl p-6 sm:p-8 space-y-6">
              <div className="flex items-center justify-between border-b border-gray-800 pb-4">
                <div>
                  <h3 className="text-xl font-extrabold text-white">Your Bookings History</h3>
                  <p className="text-xs text-gray-400">Real-time digital pass and booking details</p>
                </div>
                <button 
                  onClick={() => setView('browse')}
                  className="text-xs font-bold text-amber-400 hover:underline"
                >
                  + Book Another Court
                </button>
              </div>

              {userBookings.length === 0 ? (
                <div className="text-center py-12 space-y-3">
                  <Ticket className="w-12 h-12 text-gray-600 mx-auto" />
                  <p className="text-gray-400 font-medium text-sm">No bookings yet.</p>
                  <button 
                    onClick={() => setView('browse')}
                    className="bg-amber-500 text-black text-xs font-bold px-4 py-2 rounded-xl hover:bg-amber-400 transition"
                  >
                    Browse Arenas Now
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {userBookings.map((booking) => (
                    <div 
                      key={booking.id} 
                      className="bg-gray-900 border border-gray-800 rounded-2xl p-5 space-y-4 hover:border-gray-700 transition"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-gray-800/80 pb-3">
                        <div>
                          <span className="text-xs font-black text-amber-500 tracking-wider">
                            ID: {booking.id}
                          </span>
                          <h4 className="font-extrabold text-lg text-white mt-0.5">{booking.arenaTitle}</h4>
                          <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
                            <MapPin className="w-3.5 h-3.5 text-amber-500" /> {booking.location}
                          </p>
                        </div>

                        <div className="sm:text-right flex sm:flex-col items-center sm:items-end justify-between gap-2">
                          <span className="text-xl font-black text-white">₹{booking.totalPrice}</span>
                          <div className="flex items-center gap-2">
                            <div className="flex items-center gap-1 text-xs text-emerald-400 bg-emerald-950/60 border border-emerald-800/50 px-2.5 py-0.5 rounded-md font-bold">
                              <CheckCircle2 className="w-3.5 h-3.5" /> {booking.status}
                            </div>
                            {/* RESTORED NAVIGATE BUTTON IN MY BOOKINGS */}
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

                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                        <div className="bg-gray-950 p-2.5 rounded-xl border border-gray-800/50">
                          <span className="text-gray-500 font-bold block">Date & Time</span>
                          <span className="text-white font-semibold flex items-center gap-1 mt-0.5">
                            <Calendar className="w-3.5 h-3.5 text-amber-400" /> {booking.date}
                          </span>
                          <span className="text-amber-400 text-[11px] font-bold block mt-0.5">{booking.timeSlot}</span>
                        </div>

                        <div className="bg-gray-950 p-2.5 rounded-xl border border-gray-800/50">
                          <span className="text-gray-500 font-bold block">Sport & Add-ons</span>
                          <span className="text-white font-semibold">{booking.sport}</span>
                          <span className="text-gray-400 text-[10px] block mt-0.5 truncate">
                            {booking.addOns.length > 0 ? booking.addOns.join(', ') : 'No add-ons'}
                          </span>
                        </div>

                        <div className="bg-gray-950 p-2.5 rounded-xl border border-gray-800/50 col-span-2 sm:col-span-1 flex items-center justify-between">
                          <div>
                            <span className="text-gray-500 font-bold block">Payment Method</span>
                            <span className="text-white font-medium">{booking.paymentMethod}</span>
                          </div>
                          <button 
                            onClick={() => setActiveTicket(booking)}
                            className="bg-amber-500/10 border border-amber-500/30 text-amber-400 hover:bg-amber-500 hover:text-black text-[11px] font-bold px-3 py-1.5 rounded-lg transition flex items-center gap-1"
                          >
                            <QrCode className="w-3.5 h-3.5" /> Ticket
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </main>
        )}
      </div>

      {/* MODAL 1: ARENA DETAILS & MAP INFO MODAL */}
      {activeArenaForDetails && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#161b22] border border-gray-800 rounded-3xl max-w-2xl w-full overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-200">
            <div className="relative h-64 bg-gray-950">
              <img src={activeArenaForDetails.image} alt={activeArenaForDetails.title} className="w-full h-full object-cover" />
              <button 
                onClick={() => setActiveArenaForDetails(null)}
                className="absolute top-4 right-4 bg-black/70 text-gray-300 hover:text-white p-2 rounded-full backdrop-blur"
              >
                <X className="w-5 h-5" />
              </button>
              <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between">
                <span className="bg-amber-500 text-black font-extrabold text-xs px-3 py-1 rounded-lg">
                  ★ {activeArenaForDetails.rating} ({activeArenaForDetails.reviews} Reviews)
                </span>
                <span className="bg-black/80 backdrop-blur text-white text-xs font-bold px-3 py-1 rounded-lg border border-gray-700">
                  {activeArenaForDetails.surface}
                </span>
              </div>
            </div>

            <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto">
              <div>
                <h2 className="text-2xl font-black text-white">{activeArenaForDetails.title}</h2>
                <p className="text-xs text-gray-400 flex items-center gap-1 mt-1">
                  <MapPin className="w-4 h-4 text-amber-500" /> {activeArenaForDetails.address}
                </p>
              </div>

              <p className="text-sm text-gray-300 leading-relaxed">
                {activeArenaForDetails.description}
              </p>

              <div>
                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Available Amenities</h4>
                <div className="flex flex-wrap gap-2">
                  {activeArenaForDetails.amenities.map(a => (
                    <span key={a} className="bg-gray-900 border border-gray-800 text-gray-200 text-xs px-3 py-1.5 rounded-xl font-medium">
                      ✓ {a}
                    </span>
                  ))}
                </div>
              </div>

              <div className="bg-gray-900 border border-gray-800 rounded-2xl p-4 flex items-center justify-between">
                <div>
                  <span className="text-xs text-gray-400 font-bold block uppercase">Rate per Hour</span>
                  <span className="text-2xl font-black text-amber-400">₹{activeArenaForDetails.price}</span>
                </div>

                <div className="flex gap-2">
                  <button 
                    onClick={() => handleNavigate(activeArenaForDetails.title, activeArenaForDetails.location, activeArenaForDetails.locationUrl)}
                    className="bg-gray-800 hover:bg-gray-700 text-teal-400 border border-teal-500/30 font-bold px-4 py-3 rounded-xl transition flex items-center gap-1.5 text-xs"
                  >
                    <Navigation className="w-4 h-4" /> Navigate
                  </button>
                  <button 
                    onClick={() => {
                      const arena = activeArenaForDetails;
                      setActiveArenaForDetails(null);
                      openBookingModal(arena);
                    }}
                    className="bg-amber-500 hover:bg-amber-400 text-black font-black px-6 py-3 rounded-xl transition shadow-lg shadow-amber-500/20 text-xs"
                  >
                    Book Slot Now →
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: INTERACTIVE SLOT BOOKING MODAL */}
      {activeArenaForBooking && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-[#161b22] border border-gray-800 rounded-3xl max-w-2xl w-full my-8 overflow-hidden shadow-2xl">
            {/* Modal Header */}
            <div className="bg-gray-950 p-5 border-b border-gray-800 flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase tracking-widest font-black text-amber-500 bg-amber-500/10 px-2.5 py-0.5 rounded-full border border-amber-500/20">
                  Instant Slot Reservation
                </span>
                <h3 className="text-xl font-black text-white mt-1">{activeArenaForBooking.title}</h3>
              </div>
              <button 
                onClick={() => setActiveArenaForBooking(null)}
                className="text-gray-400 hover:text-white p-2 rounded-xl hover:bg-gray-900 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
              {/* Sport Selection if turf supports multiple */}
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Select Sport</label>
                <div className="flex gap-2">
                  {activeArenaForBooking.sports.map(s => (
                    <button
                      key={s}
                      onClick={() => setSelectedSportForBooking(s)}
                      className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
                        selectedSportForBooking === s 
                          ? 'bg-amber-500 text-black' 
                          : 'bg-gray-900 border border-gray-800 text-gray-400 hover:text-white'
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              {/* Date Selector */}
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Select Date</label>
                <div className="grid grid-cols-3 gap-2">
                  {['Today, Jul 27', 'Tomorrow, Jul 28', 'Jul 29, 2026'].map((d) => (
                    <button
                      key={d}
                      onClick={() => setSelectedBookingDate(d)}
                      className={`py-2.5 px-3 rounded-xl text-xs font-bold border transition text-center ${
                        selectedBookingDate === d 
                          ? 'bg-amber-500/10 border-amber-500 text-amber-400' 
                          : 'bg-gray-900 border-gray-800 text-gray-400 hover:text-white'
                      }`}
                    >
                      {d}
                    </button>
                  ))}
                </div>
              </div>

              {/* Time Slots Grid */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Select Available Time Slot</label>
                  <span className="text-[11px] text-amber-400 font-semibold">1 Hour Duration</span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {activeArenaForBooking.slots.map((slot) => {
                    const isSelected = selectedTimeSlot === slot;
                    return (
                      <button
                        key={slot}
                        onClick={() => setSelectedTimeSlot(slot)}
                        className={`p-3 rounded-xl text-xs font-extrabold border transition text-left flex flex-col justify-between ${
                          isSelected 
                            ? 'bg-amber-500 text-black border-amber-400 shadow-lg shadow-amber-500/20' 
                            : 'bg-gray-900 border-gray-800 text-gray-200 hover:border-amber-500/40'
                        }`}
                      >
                        <span>{slot}</span>
                        <span className={`text-[10px] mt-1 font-semibold ${isSelected ? 'text-black/80' : 'text-emerald-400'}`}>
                          {isSelected ? '✓ Selected' : 'Available'}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Optional Equipment & Add-ons */}
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Optional Match Add-ons</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {addOnOptions.map((opt) => {
                    const isChecked = selectedAddOns.includes(opt.id);
                    return (
                      <div
                        key={opt.id}
                        onClick={() => {
                          if (isChecked) {
                            setSelectedAddOns(selectedAddOns.filter(id => id !== opt.id));
                          } else {
                            setSelectedAddOns([...selectedAddOns, opt.id]);
                          }
                        }}
                        className={`p-3 rounded-xl border text-xs cursor-pointer transition flex items-center justify-between ${
                          isChecked 
                            ? 'bg-amber-500/10 border-amber-500 text-amber-300' 
                            : 'bg-gray-900 border-gray-800 text-gray-300 hover:border-gray-700'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <input type="checkbox" checked={isChecked} readOnly className="accent-amber-500" />
                          <span className="font-semibold">{opt.name}</span>
                        </div>
                        <span className="font-black text-amber-400">+₹{opt.price}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Payment Method Selector */}
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Select Payment Method</label>
                <div className="grid grid-cols-2 gap-2">
                  {['UPI (GPay / PhonePe / Paytm)', 'Credit / Debit Card', 'Netbanking', 'Pay at Turf Venue'].map((method) => (
                    <button
                      key={method}
                      onClick={() => setSelectedPaymentMethod(method)}
                      className={`p-2.5 rounded-xl text-xs font-bold border transition text-left ${
                        selectedPaymentMethod === method 
                          ? 'bg-emerald-500/10 border-emerald-500 text-emerald-400' 
                          : 'bg-gray-900 border-gray-800 text-gray-400 hover:text-white'
                      }`}
                    >
                      {method}
                    </button>
                  ))}
                </div>
              </div>

              {/* Price Calculation Summary */}
              <div className="bg-gray-950 border border-gray-800 rounded-2xl p-4 space-y-2 text-xs">
                <div className="flex justify-between text-gray-400">
                  <span>Slot Fee ({selectedSportForBooking}):</span>
                  <span className="font-bold text-white">₹{activeArenaForBooking.price}</span>
                </div>

                {selectedAddOns.length > 0 && (
                  <div className="flex justify-between text-gray-400">
                    <span>Selected Add-ons ({selectedAddOns.length}):</span>
                    <span className="font-bold text-amber-400">
                      +₹{selectedAddOns.reduce((sum, id) => sum + (addOnOptions.find(o => o.id === id)?.price || 0), 0)}
                    </span>
                  </div>
                )}

                <div className="flex justify-between text-gray-400">
                  <span>Convenience Fee & Taxes:</span>
                  <span className="font-bold text-white">₹20</span>
                </div>

                <div className="pt-2 border-t border-gray-800 flex justify-between items-center text-sm font-black text-white">
                  <span>Total Amount Payable:</span>
                  <span className="text-2xl font-black text-amber-400">
                    ₹{activeArenaForBooking.price + selectedAddOns.reduce((sum, id) => sum + (addOnOptions.find(o => o.id === id)?.price || 0), 0) + 20}
                  </span>
                </div>
              </div>

              {/* Confirm Action Button */}
              <button 
                onClick={handleConfirmBooking}
                className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-black font-black py-4 rounded-2xl transition shadow-xl shadow-amber-500/20 text-base flex items-center justify-center gap-2"
              >
                <CheckCircle2 className="w-5 h-5 fill-black stroke-amber-400" />
                <span>Confirm & Pay Slot →</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: TICKET & QR CODE PASS MODAL */}
      {activeTicket && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#161b22] border border-amber-500/40 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-6 relative overflow-hidden">
            <button 
              onClick={() => setActiveTicket(null)}
              className="absolute top-4 right-4 text-gray-400 hover:text-white p-2 rounded-full"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="text-center space-y-2">
              <div className="w-12 h-12 bg-amber-500 text-black rounded-2xl flex items-center justify-center mx-auto shadow-lg shadow-amber-500/20">
                <Trophy className="w-6 h-6 fill-black" />
              </div>
              <h3 className="text-2xl font-black text-white">WinDeclare Match Pass</h3>
              <p className="text-xs text-amber-400 font-bold uppercase tracking-widest">
                Booking Ref: {activeTicket.id}
              </p>
            </div>

            {/* Simulated QR Code Box */}
            <div className="bg-white p-4 rounded-2xl text-center space-y-2 shadow-inner mx-auto max-w-[200px]">
              <div className="w-36 h-36 border-4 border-black mx-auto p-2 flex flex-col items-center justify-center bg-gray-100 rounded-xl">
                <QrCode className="w-28 h-28 text-black" />
              </div>
              <p className="text-[10px] font-mono text-black font-extrabold tracking-wider uppercase">
                {activeTicket.id}
              </p>
            </div>

            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-4 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-gray-400">Turf Venue:</span>
                <span className="font-bold text-white text-right">{activeTicket.arenaTitle}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Date & Slot:</span>
                <span className="font-bold text-amber-400 text-right">{activeTicket.date} ({activeTicket.timeSlot})</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Sport:</span>
                <span className="font-bold text-white">{activeTicket.sport}</span>
              </div>
              <div className="flex justify-between border-t border-gray-800 pt-2 font-black text-sm">
                <span className="text-gray-300">Amount Paid:</span>
                <span className="text-emerald-400">₹{activeTicket.totalPrice} ({activeTicket.paymentMethod})</span>
              </div>
            </div>

            <div className="flex gap-2">
              <button 
                onClick={() => handleNavigate(activeTicket.arenaTitle, activeTicket.location, activeTicket.locationUrl)}
                className="bg-gray-800 hover:bg-gray-700 text-teal-400 border border-teal-500/30 font-bold px-3 py-2.5 rounded-xl text-xs transition flex items-center justify-center gap-1"
              >
                <Navigation className="w-4 h-4" /> Navigate
              </button>
              <button 
                onClick={() => {
                  showToast('Ticket Pass downloaded to device');
                }}
                className="flex-1 bg-amber-500 hover:bg-amber-400 text-black font-bold py-2.5 rounded-xl text-xs transition flex items-center justify-center gap-1.5"
              >
                <Download className="w-4 h-4" /> Download Pass
              </button>
              <button 
                onClick={() => setActiveTicket(null)}
                className="bg-gray-800 hover:bg-gray-700 text-white font-bold px-3 py-2.5 rounded-xl text-xs transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 4: TURF OWNER ADD / EDIT ARENA MODAL */}
      {isAddArenaModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-[#161b22] border border-gray-800 rounded-3xl max-w-xl w-full my-8 overflow-hidden shadow-2xl">
            <div className="bg-gray-950 p-5 border-b border-gray-800 flex items-center justify-between">
              <div>
                <h3 className="text-xl font-black text-white">Publish New Sports Turf</h3>
                <p className="text-xs text-gray-400">List your ground on WinDeclare for instant bookings</p>
              </div>
              <button onClick={() => setIsAddArenaModalOpen(false)} className="text-gray-400 hover:text-white p-2">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateArena} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto text-xs">
              <div>
                <label className="block font-bold text-gray-400 uppercase tracking-wider mb-1">Arena Title</label>
                <input 
                  type="text" 
                  required
                  value={newArena.title}
                  onChange={(e) => setNewArena({ ...newArena, title: e.target.value })}
                  placeholder="e.g. Apex Box Turf & Arena"
                  className="w-full bg-gray-900 border border-gray-800 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-gray-400 uppercase tracking-wider mb-1">Location / Area</label>
                  <input 
                    type="text" 
                    required
                    value={newArena.location}
                    onChange={(e) => setNewArena({ ...newArena, location: e.target.value })}
                    placeholder="e.g. Gachibowli, Hyderabad"
                    className="w-full bg-gray-900 border border-gray-800 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block font-bold text-gray-400 uppercase tracking-wider mb-1">Price per Hour (₹)</label>
                  <input 
                    type="number" 
                    required
                    value={newArena.price}
                    onChange={(e) => setNewArena({ ...newArena, price: Number(e.target.value) })}
                    className="w-full bg-gray-900 border border-gray-800 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              {/* NEW FEATURE: GOOGLE MAPS LOCATION LINK */}
              <div>
                <label className="block font-bold text-amber-400 uppercase tracking-wider mb-1 flex items-center gap-1">
                  📍 Google Maps Location Link
                </label>
                <input 
                  type="url" 
                  placeholder="https://maps.app.goo.gl/... or paste map link"
                  value={newArena.locationUrl || ''}
                  onChange={(e) => setNewArena({ ...newArena, locationUrl: e.target.value })}
                  className="w-full bg-gray-900 border border-gray-800 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-amber-500"
                />
                <p className="text-[11px] text-gray-500 mt-1">
                  Paste the share link from Google Maps so players can navigate straight to your turf.
                </p>
              </div>

              <div>
                <label className="block font-bold text-gray-400 uppercase tracking-wider mb-1">Surface Type</label>
                <input 
                  type="text" 
                  value={newArena.surface}
                  onChange={(e) => setNewArena({ ...newArena, surface: e.target.value })}
                  placeholder="e.g. FIFA 2-Star 5G Grass or Wooden Court"
                  className="w-full bg-gray-900 border border-gray-800 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block font-bold text-gray-400 uppercase tracking-wider mb-1">Cover Image URL</label>
                <input 
                  type="url" 
                  value={newArena.image}
                  onChange={(e) => setNewArena({ ...newArena, image: e.target.value })}
                  placeholder="https://images.unsplash.com/..."
                  className="w-full bg-gray-900 border border-gray-800 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block font-bold text-gray-400 uppercase tracking-wider mb-1">Description</label>
                <textarea 
                  rows={3}
                  value={newArena.description}
                  onChange={(e) => setNewArena({ ...newArena, description: e.target.value })}
                  placeholder="Detail your arena amenities, dimensions, rules..."
                  className="w-full bg-gray-900 border border-gray-800 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <button 
                type="submit"
                className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-black font-black py-3.5 rounded-2xl text-sm transition shadow-lg shadow-amber-500/20"
              >
                Publish Turf Arena →
              </button>
            </form>
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
            <a href="#support" onClick={(e) => e.preventDefault()} className="hover:text-amber-400">Support</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
