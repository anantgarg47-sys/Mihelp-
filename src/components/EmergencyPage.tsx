import React, { useState } from 'react';
import { 
  AlertOctagon, 
  PhoneCall, 
  ShieldAlert, 
  MapPin, 
  UserCheck, 
  HeartPulse, 
  Radio, 
  Building, 
  Users, 
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';
import { addDoc, collection } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../context/AuthContext';
import type { HelpRequest } from '../types';

interface EmergencyPageProps {
  onEmergencyCreated: (requestId: string) => void;
}

export const EmergencyPage: React.FC<EmergencyPageProps> = ({ onEmergencyCreated }) => {
  const { user, profile } = useAuth();
  const [declaring, setDeclaring] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Two hardcoded campus medical emergency phone numbers as tap-to-call links (explicitly requested)
  const EMERGENCY_PHONE_1 = '+91 79 2397 0100';
  const EMERGENCY_PHONE_1_TEL = 'tel:+917923970100';
  const EMERGENCY_PHONE_1_LABEL = 'Campus 24/7 Ambulance & Health Center Desk';

  const EMERGENCY_PHONE_2 = '+91 79 2397 0108';
  const EMERGENCY_PHONE_2_TEL = 'tel:+917923970108';
  const EMERGENCY_PHONE_2_LABEL = 'Chief Campus Medical Warden & Emergency Response';

  const handleDeclareEmergency = async () => {
    if (!user) {
      setError('You must be signed in to declare a campus medical emergency.');
      return;
    }

    setDeclaring(true);
    setError(null);

    try {
      const studentName = profile?.name || 'Student';
      const hostel = profile?.hostel || 'Hostel Residence';
      const blood = profile?.bloodGroup || 'Blood group on file';

      const emergencyDoc: Omit<HelpRequest, 'id'> = {
        studentId: user.uid,
        ailment: 'CRITICAL CAMPUS MEDICAL EMERGENCY (SOS)',
        description: `Emergency declared via SOS button by ${studentName}. Located at ${hostel}. Blood Group: ${blood}. Immediate paramedic & warden response requested.`,
        scenario: 'emergency',
        consultType: 'campus',
        status: 'escalated',
        assignedDoctorName: 'Dr. Rajesh Verma (Emergency Rapid Response)',
        doctorNotes: 'Emergency escalated by student. Health center ambulance and hostel warden notified.',
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      const docRef = await addDoc(collection(db, 'helpRequests'), emergencyDoc);
      onEmergencyCreated(docRef.id);
    } catch (err: any) {
      console.error('Error declaring emergency:', err);
      setError(err?.message || 'Failed to dispatch emergency request. Please call the emergency numbers below directly!');
      setDeclaring(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-6 px-4 sm:px-6 space-y-6">
      {/* High-Alert Header */}
      <div className="bg-gradient-to-r from-rose-700/90 via-red-800/90 to-rose-900/90 backdrop-blur-xl text-white rounded-3xl p-6 sm:p-8 shadow-2xl shadow-rose-950/20 text-center relative overflow-hidden border border-white/20">
        <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
          <AlertOctagon className="w-48 h-48" />
        </div>

        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/20 border border-white/30 text-white text-xs font-bold uppercase tracking-wider mb-4 animate-pulse backdrop-blur-sm">
          <Radio className="w-4 h-4 text-rose-200" />
          Campus Rapid Emergency Response
        </div>

        <h1 className="text-3xl sm:text-4xl font-black tracking-tight">
          Campus Medical Emergency Assistance
        </h1>
        <p className="text-rose-100 text-sm mt-2 max-w-xl mx-auto font-medium">
          If you or a fellow student requires immediate medical attention, declare an emergency below or tap the direct hotline numbers immediately.
        </p>

        {/* Large "Declare Emergency" Button */}
        <div className="mt-8">
          <button
            id="declare-emergency-main-btn"
            disabled={declaring}
            onClick={handleDeclareEmergency}
            className="w-full sm:w-auto px-8 py-5 rounded-3xl bg-white/95 hover:bg-white text-rose-800 text-base sm:text-lg font-black shadow-2xl hover:shadow-rose-900/40 transition transform hover:-translate-y-0.5 active:translate-y-0 flex items-center justify-center gap-3 mx-auto cursor-pointer border-2 border-rose-300 backdrop-blur-md"
          >
            {declaring ? (
              <div className="w-6 h-6 border-3 border-rose-800 border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <AlertOctagon className="w-7 h-7 text-rose-600 animate-bounce" />
            )}
            <span>{declaring ? 'DISPATCHING EMERGENCY ALERT...' : '🚨 DECLARE EMERGENCY NOW'}</span>
          </button>
        </div>

        {error && (
          <div className="mt-4 p-3.5 bg-white/20 backdrop-blur-md rounded-2xl text-xs text-white font-medium max-w-md mx-auto border border-white/20">
            {error}
          </div>
        )}
      </div>

      {/* Direct Tap to Call Links Grid */}
      <div className="space-y-3">
        <h2 className="text-sm font-extrabold text-slate-800 uppercase tracking-wider flex items-center gap-2">
          <PhoneCall className="w-4 h-4 text-rose-600" />
          Immediate Tap-to-Call Emergency Helplines
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Hotline 1 */}
          <a
            id="emergency-call-hotline-1"
            href={EMERGENCY_PHONE_1_TEL}
            className="bg-white/60 backdrop-blur-xl hover:bg-white/80 border border-white/80 hover:border-rose-300 rounded-3xl p-5 sm:p-6 shadow-xl shadow-rose-900/5 transition flex items-center justify-between group cursor-pointer"
          >
            <div className="flex items-center gap-4">
              <div className="w-13 h-13 rounded-2xl bg-rose-100 text-rose-700 flex items-center justify-center shrink-0 group-hover:scale-110 transition shadow-xs">
                <PhoneCall className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                  {EMERGENCY_PHONE_1_LABEL}
                </span>
                <span className="text-lg sm:text-xl font-mono font-black text-slate-900 group-hover:text-rose-700 transition">
                  {EMERGENCY_PHONE_1}
                </span>
                <span className="text-[11px] text-rose-600 block mt-0.5 font-bold">Tap to call ambulance desk</span>
              </div>
            </div>
          </a>

          {/* Hotline 2 */}
          <a
            id="emergency-call-hotline-2"
            href={EMERGENCY_PHONE_2_TEL}
            className="bg-white/60 backdrop-blur-xl hover:bg-white/80 border border-white/80 hover:border-rose-300 rounded-3xl p-5 sm:p-6 shadow-xl shadow-rose-900/5 transition flex items-center justify-between group cursor-pointer"
          >
            <div className="flex items-center gap-4">
              <div className="w-13 h-13 rounded-2xl bg-rose-100 text-rose-700 flex items-center justify-center shrink-0 group-hover:scale-110 transition shadow-xs">
                <PhoneCall className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                  {EMERGENCY_PHONE_2_LABEL}
                </span>
                <span className="text-lg sm:text-xl font-mono font-black text-slate-900 group-hover:text-rose-700 transition">
                  {EMERGENCY_PHONE_2}
                </span>
                <span className="text-[11px] text-rose-600 block mt-0.5 font-bold">Tap to call chief medical warden</span>
              </div>
            </div>
          </a>
        </div>
      </div>

      {/* Student Location & Vital Context for Paramedics */}
      {profile && (
        <div className="bg-white/60 backdrop-blur-xl rounded-3xl border border-white/60 p-6 sm:p-7 space-y-4 shadow-xl shadow-teal-900/5">
          <h3 className="text-sm font-extrabold text-slate-800 uppercase tracking-wider flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-teal-600" />
            Your Medical Dispatch Card (Relayed to Paramedics)
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs bg-white/50 backdrop-blur-sm p-4.5 rounded-2xl border border-white/70 shadow-xs">
            <div>
              <span className="text-slate-400 block font-bold uppercase tracking-wider text-[10px]">Student Name</span>
              <span className="font-black text-slate-800 text-sm mt-0.5 block">{profile.name}</span>
              <span className="font-mono text-teal-700 font-bold block mt-0.5 bg-teal-50 px-2 py-0.5 rounded-md border border-teal-200/60 inline-block">
                {profile.micaInsuranceId}
              </span>
            </div>

            <div>
              <span className="text-slate-400 block font-bold uppercase tracking-wider text-[10px]">Hostel & Room</span>
              <span className="font-bold text-slate-800 text-sm mt-0.5 block">{profile.hostel}</span>
              <span className="text-slate-500 block mt-0.5">Roommate: {profile.roommateDetails || 'On file'}</span>
            </div>

            <div>
              <span className="text-slate-400 block font-bold uppercase tracking-wider text-[10px]">Blood Group & Emergency Contact</span>
              <span className="font-black text-rose-700 text-sm mt-0.5 block">{profile.bloodGroup}</span>
              <span className="text-slate-700 block mt-0.5 font-semibold">Contact: {profile.emergencyContactPhone}</span>
            </div>
          </div>
        </div>
      )}

      {/* Critical First-Aid Protocols */}
      <div className="bg-white/60 backdrop-blur-xl rounded-3xl border border-white/60 p-6 sm:p-7 space-y-4 shadow-xl shadow-teal-900/5">
        <h3 className="text-sm font-extrabold text-slate-800 uppercase tracking-wider flex items-center gap-2">
          <HeartPulse className="w-4 h-4 text-rose-600" />
          Campus Emergency Response Steps
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          <div className="p-4 bg-rose-50/70 backdrop-blur-sm rounded-2xl border border-rose-200/70 space-y-1.5 shadow-xs">
            <span className="font-extrabold text-rose-900 block">1. Stay in Position</span>
            <p className="text-slate-600 leading-relaxed">Do not move patient if injury or spinal strain is suspected. Keep hostel room unlocked.</p>
          </div>

          <div className="p-4 bg-teal-50/70 backdrop-blur-sm rounded-2xl border border-teal-200/70 space-y-1.5 shadow-xs">
            <span className="font-extrabold text-teal-900 block">2. Alert Roommates & Warden</span>
            <p className="text-slate-600 leading-relaxed">Notify the floor resident assistant or hostel security guard immediately.</p>
          </div>

          <div className="p-4 bg-purple-50/70 backdrop-blur-sm rounded-2xl border border-purple-200/70 space-y-1.5 shadow-xs">
            <span className="font-extrabold text-purple-900 block">3. Insurance Clearance</span>
            <p className="text-slate-600 leading-relaxed">Ambulance team will use your MICA Insurance ID for cashless priority hospital clearance.</p>
          </div>
        </div>
      </div>
    </div>
  );
};
