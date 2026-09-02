import React, { useState, useRef, useEffect } from 'react';
import { 
  HeartPulse, 
  LayoutDashboard, 
  PlusCircle, 
  Stethoscope, 
  Pill, 
  AlertOctagon, 
  UserCircle, 
  LogOut,
  ShieldCheck,
  ChevronDown
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onOpenEmergency: () => void;
  onOpenNewRequest?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ activeTab, setActiveTab, onOpenEmergency, onOpenNewRequest }) => {
  const { user, profile, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    };
    if (menuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [menuOpen]);

  const handleLogout = async () => {
    try {
      await logout();
    } catch (err) {
      console.error('Logout failed:', err);
    }
  };

  return (
    <header id="main-header" className="sticky top-0 z-40 bg-white/60 backdrop-blur-xl border-b border-white/40 shadow-sm transition-all">
      {/* Emergency Quick Bar for Fast Access */}
      <div className="bg-gradient-to-r from-rose-600/90 via-red-600/90 to-rose-700/90 text-white px-4 py-1.5 text-xs sm:text-sm font-medium flex items-center justify-between shadow-inner backdrop-blur-md">
        <div className="flex items-center gap-2 max-w-7xl mx-auto w-full justify-between">
          <div className="flex items-center gap-2">
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-200 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
            </span>
            <span>24/7 Campus Medical Helpline: <strong>+91 79 2397 0100</strong> (Health Center)</span>
          </div>
          <button
            id="quick-emergency-top-btn"
            onClick={onOpenEmergency}
            className="bg-white/95 hover:bg-white text-rose-700 hover:text-rose-800 px-3 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1.5 shadow-sm active:scale-95 cursor-pointer"
          >
            <AlertOctagon className="w-3.5 h-3.5 text-rose-600" />
            Emergency SOS
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Branding */}
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => setActiveTab('dashboard')}>
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-teal-600 to-emerald-500 flex items-center justify-center text-white shadow-lg shadow-teal-600/25">
              <HeartPulse className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-xl font-extrabold tracking-tight text-slate-900">MiHelp<span className="text-teal-600">+</span></span>
              </div>
              <p className="text-[11px] text-slate-500 font-medium">Student Medical & Insurance Desk</p>
            </div>
          </div>

          {/* Navigation Links (Desktop) */}
          <nav className="hidden md:flex items-center gap-1.5 bg-white/40 p-1.5 rounded-2xl border border-white/50 backdrop-blur-md">
            <button
              id="nav-dashboard-btn"
              onClick={() => setActiveTab('dashboard')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-semibold transition cursor-pointer ${
                activeTab === 'dashboard'
                  ? 'bg-teal-600 text-white shadow-md shadow-teal-700/20'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
              }`}
            >
              <LayoutDashboard className="w-4 h-4" />
              Dashboard
            </button>

            <button
              id="nav-new-request-btn"
              onClick={() => {
                if (onOpenNewRequest) {
                  onOpenNewRequest();
                } else {
                  setActiveTab('new-request');
                }
              }}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-semibold transition text-slate-600 hover:text-slate-900 hover:bg-white/60 cursor-pointer"
            >
              <PlusCircle className="w-4 h-4 text-teal-600" />
              New Request
            </button>

            <button
              id="nav-doctors-btn"
              onClick={() => setActiveTab('doctors')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-semibold transition cursor-pointer ${
                activeTab === 'doctors'
                  ? 'bg-teal-600 text-white shadow-md shadow-teal-700/20'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
              }`}
            >
              <Stethoscope className="w-4 h-4" />
              Doctors
            </button>

            <button
              id="nav-dispensaries-btn"
              onClick={() => setActiveTab('dispensaries')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-semibold transition cursor-pointer ${
                activeTab === 'dispensaries'
                  ? 'bg-teal-600 text-white shadow-md shadow-teal-700/20'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
              }`}
            >
              <Pill className="w-4 h-4" />
              Dispensaries
            </button>

            <button
              id="nav-emergency-btn"
              onClick={() => setActiveTab('emergency')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-bold transition cursor-pointer ${
                activeTab === 'emergency'
                  ? 'bg-rose-500 text-white shadow-md shadow-rose-500/25'
                  : 'text-rose-700 hover:bg-rose-50/80 hover:text-rose-800'
              }`}
            >
              <AlertOctagon className="w-4 h-4" />
              Emergency
            </button>
          </nav>

          {/* Right Action: Insurance ID & Profile Dropdown */}
          <div className="flex items-center gap-2 sm:gap-3">
            {profile && (
              <div 
                id="header-mica-card"
                onClick={() => setActiveTab('profile')}
                className="hidden lg:flex items-center gap-2.5 px-3 py-1.5 bg-white/70 hover:bg-white/90 border border-white/70 backdrop-blur-md rounded-2xl cursor-pointer transition shadow-sm text-left group"
                title="View Student Health & Insurance Profile"
              >
                <div className="w-7 h-7 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center border border-teal-100 group-hover:scale-105 transition">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-[9px] text-slate-400 font-bold block uppercase tracking-wider">MICA Insurance ID</span>
                  <span className="text-xs font-mono font-bold text-teal-700">{profile.micaInsuranceId}</span>
                </div>
              </div>
            )}

            {/* Profile Dropdown Trigger & Panel */}
            <div className="relative" ref={dropdownRef}>
              <button
                id="nav-profile-btn"
                type="button"
                onClick={() => setMenuOpen(!menuOpen)}
                className={`p-1.5 sm:px-3 sm:py-1.5 rounded-2xl transition flex items-center gap-2 border cursor-pointer ${
                  menuOpen || activeTab === 'profile'
                    ? 'bg-teal-600 text-white border-teal-600 shadow-md shadow-teal-700/20'
                    : 'bg-white/60 text-slate-700 hover:bg-white border-white/60 shadow-sm'
                }`}
                title="Account Menu"
              >
                {user?.photoURL ? (
                  <img 
                    src={user.photoURL} 
                    alt={user.displayName || 'Profile'} 
                    className="w-7 h-7 rounded-full border border-teal-200 object-cover"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="w-7 h-7 rounded-full bg-teal-100 flex items-center justify-center text-teal-700 font-bold text-xs">
                    {(profile?.name || user?.displayName || 'S').slice(0, 2).toUpperCase()}
                  </div>
                )}
                <span className="hidden sm:inline text-xs font-bold max-w-[110px] truncate">
                  {profile?.name || user?.displayName || 'Student'}
                </span>
                <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${menuOpen ? 'rotate-180' : ''}`} />
              </button>

              {/* Dropdown Menu Panel */}
              {menuOpen && (
                <div className="absolute right-0 mt-2 w-52 bg-white/95 backdrop-blur-xl rounded-2xl shadow-xl border border-slate-200/80 py-1.5 z-50 animate-in fade-in zoom-in-95 duration-100 divide-y divide-slate-100">
                  <div className="p-1 space-y-0.5">
                    {/* 1. View profile */}
                    <button
                      type="button"
                      onClick={() => {
                        setActiveTab('profile');
                        setMenuOpen(false);
                      }}
                      className="w-full px-3 py-2 text-left text-xs font-semibold text-slate-700 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition flex items-center gap-2.5 cursor-pointer"
                    >
                      <UserCircle className="w-4 h-4 text-slate-500" />
                      <span>View profile</span>
                    </button>

                    {/* 2. Dashboard */}
                    <button
                      type="button"
                      onClick={() => {
                        setActiveTab('dashboard');
                        setMenuOpen(false);
                      }}
                      className="w-full px-3 py-2 text-left text-xs font-semibold text-slate-700 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition flex items-center gap-2.5 cursor-pointer"
                    >
                      <LayoutDashboard className="w-4 h-4 text-slate-500" />
                      <span>Dashboard</span>
                    </button>

                    {/* 3. Log out */}
                    <button
                      type="button"
                      onClick={async () => {
                        setMenuOpen(false);
                        await handleLogout();
                      }}
                      className="w-full px-3 py-2 text-left text-xs font-semibold text-slate-700 hover:text-rose-700 hover:bg-slate-100 rounded-xl transition flex items-center gap-2.5 cursor-pointer"
                    >
                      <LogOut className="w-4 h-4 text-slate-500" />
                      <span>Log out</span>
                    </button>
                  </div>

                  <div className="p-1">
                    {/* 4. Emergency (SOS) */}
                    <button
                      type="button"
                      onClick={() => {
                        setMenuOpen(false);
                        onOpenEmergency();
                      }}
                      className="w-full px-3 py-2 text-left text-xs font-bold text-rose-700 bg-rose-50/90 hover:bg-rose-100/90 rounded-xl transition flex items-center gap-2.5 cursor-pointer border border-rose-200/60"
                    >
                      <AlertOctagon className="w-4 h-4 text-rose-600" />
                      <span>Emergency (SOS)</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Mobile Navigation bar */}
        <div className="grid grid-cols-4 md:hidden py-2 border-t border-white/40 gap-1 text-center">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`px-1.5 py-1.5 rounded-xl text-xs font-semibold flex flex-col items-center justify-center gap-1 transition text-center min-h-[48px] ${
              activeTab === 'dashboard' ? 'bg-teal-600 text-white shadow-sm' : 'text-slate-600 bg-white/40 hover:bg-white/70'
            }`}
          >
            <LayoutDashboard className="w-4 h-4 shrink-0" />
            <span className="leading-tight text-[11px] whitespace-normal break-words">Dashboard</span>
          </button>
          <button
            onClick={() => {
              if (onOpenNewRequest) {
                onOpenNewRequest();
              } else {
                setActiveTab('new-request');
              }
            }}
            className="px-1.5 py-1.5 rounded-xl text-xs font-semibold flex flex-col items-center justify-center gap-1 text-slate-600 bg-white/40 hover:bg-white/70 hover:text-teal-700 transition text-center min-h-[48px]"
          >
            <PlusCircle className="w-4 h-4 text-teal-600 shrink-0" />
            <span className="leading-tight text-[11px] whitespace-normal break-words">New</span>
          </button>
          <button
            onClick={() => setActiveTab('doctors')}
            className={`px-1.5 py-1.5 rounded-xl text-xs font-semibold flex flex-col items-center justify-center gap-1 transition text-center min-h-[48px] ${
              activeTab === 'doctors' ? 'bg-teal-600 text-white shadow-sm' : 'text-slate-600 bg-white/40 hover:bg-white/70'
            }`}
          >
            <Stethoscope className="w-4 h-4 shrink-0" />
            <span className="leading-tight text-[11px] whitespace-normal break-words">Doctors</span>
          </button>
          <button
            onClick={() => setActiveTab('dispensaries')}
            className={`px-1.5 py-1.5 rounded-xl text-xs font-semibold flex flex-col items-center justify-center gap-1 transition text-center min-h-[48px] ${
              activeTab === 'dispensaries' ? 'bg-teal-600 text-white shadow-sm' : 'text-slate-600 bg-white/40 hover:bg-white/70'
            }`}
          >
            <Pill className="w-4 h-4 shrink-0" />
            <span className="leading-tight text-[11px] whitespace-normal break-words">Dispensaries</span>
          </button>
        </div>
      </div>
    </header>
  );
};
