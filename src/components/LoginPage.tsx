import React, { useState } from 'react';
import { 
  HeartPulse, 
  ShieldCheck, 
  Stethoscope, 
  PhoneCall, 
  Clock, 
  Sparkles,
  Lock,
  ArrowRight,
  AlertCircle
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const LoginPage: React.FC = () => {
  const { signInWithGoogle } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setError(null);
    try {
      await signInWithGoogle();
    } catch (err: any) {
      console.error('Sign-in error:', err);
      setError(err?.message || 'Failed to sign in with Google. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      {/* Top Banner */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center px-4">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-3xl bg-gradient-to-tr from-teal-600 to-emerald-500 text-white shadow-xl shadow-teal-600/30 mb-4">
          <HeartPulse className="w-10 h-10" />
        </div>
        <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
          MiHelp<span className="text-teal-600">+</span>
        </h1>
        <p className="mt-2 text-xs sm:text-sm font-semibold text-slate-500 uppercase tracking-wider">
          Campus Medical & Student Health Concierge
        </p>
      </div>

      {/* Main Card */}
      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4">
        <div className="bg-white/60 backdrop-blur-xl py-8 px-6 sm:px-10 shadow-2xl shadow-teal-950/10 rounded-3xl border border-white/70">
          <div className="text-center mb-6">
            <h2 className="text-xl font-extrabold text-slate-800">Student Portal Sign In</h2>
            <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
              Sign in with your student Google account to access campus medical care, consultations, and dispensary services.
            </p>
          </div>

          {error && (
            <div className="mb-5 p-3.5 bg-rose-50/80 backdrop-blur-sm border border-rose-200 rounded-2xl flex items-start gap-2.5 text-xs text-rose-800">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Google Sign In Button */}
          <button
            id="google-signin-btn"
            onClick={handleGoogleSignIn}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 py-3.5 px-4 rounded-2xl border border-white/80 bg-white/80 hover:bg-white text-slate-800 font-bold shadow-md hover:shadow-lg transition-all transform active:scale-98 disabled:opacity-60 disabled:cursor-not-allowed group cursor-pointer"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-teal-600 border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"
                />
                <path
                  fill="#34A853"
                  d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.34 24 12 24z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 10.03 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
                />
                <path
                  fill="#EA4335"
                  d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.34 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                />
              </svg>
            )}
            <span className="text-sm">Continue with Google Account</span>
          </button>

          <div className="mt-6 pt-6 border-t border-white/40 flex items-center justify-between text-xs text-slate-500 font-medium">
            <span className="flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-teal-600" />
              Secure Campus Auth
            </span>
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              MICA Insurance Linked
            </span>
          </div>
        </div>

        {/* Feature Highlights Grid */}
        <div className="mt-8 grid grid-cols-2 gap-3">
          <div className="p-4 bg-white/50 backdrop-blur-md rounded-2xl border border-white/60 shadow-xs flex items-start gap-3">
            <div className="p-2.5 rounded-xl bg-teal-100/80 text-teal-800 shrink-0">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-slate-800">MICA Health ID</h3>
              <p className="text-[11px] text-slate-500 mt-0.5 leading-tight">Instant campus medical insurance profile code</p>
            </div>
          </div>

          <div className="p-4 bg-white/50 backdrop-blur-md rounded-2xl border border-white/60 shadow-xs flex items-start gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-100/80 text-emerald-800 shrink-0">
              <Stethoscope className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-slate-800">Doctor Requests</h3>
              <p className="text-[11px] text-slate-500 mt-0.5 leading-tight">Interactive consult stage tracking & notes</p>
            </div>
          </div>

          <div className="p-4 bg-white/50 backdrop-blur-md rounded-2xl border border-white/60 shadow-xs flex items-start gap-3">
            <div className="p-2.5 rounded-xl bg-blue-100/80 text-blue-800 shrink-0">
              <Clock className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-slate-800">Dispensary Slots</h3>
              <p className="text-[11px] text-slate-500 mt-0.5 leading-tight">Direct WhatsApp orders & campus delivery</p>
            </div>
          </div>

          <div className="p-4 bg-white/50 backdrop-blur-md rounded-2xl border border-white/60 shadow-xs flex items-start gap-3">
            <div className="p-2.5 rounded-xl bg-rose-100/80 text-rose-800 shrink-0">
              <PhoneCall className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-slate-800">SOS Escalation</h3>
              <p className="text-[11px] text-slate-500 mt-0.5 leading-tight">One-touch campus ambulance & emergency</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
