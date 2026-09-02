import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  User, 
  Mail, 
  GraduationCap, 
  Building, 
  Users, 
  Phone, 
  Droplet, 
  FileText, 
  CreditCard, 
  Sparkles, 
  Save, 
  AlertCircle,
  CheckCircle2
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { generateMicaInsuranceId } from '../firebase';
import type { UserProfile } from '../types';

interface ProfileSetupProps {
  isEditing?: boolean;
  onComplete?: () => void;
}

export const ProfileSetup: React.FC<ProfileSetupProps> = ({ isEditing = false, onComplete }) => {
  const { user, profile, saveProfile } = useAuth();

  const [name, setName] = useState(profile?.name || user?.displayName || '');
  const [email, setEmail] = useState(profile?.email || user?.email || '');
  const [collegeEmail, setCollegeEmail] = useState(profile?.collegeEmail || '');
  const [collegeEmailError, setCollegeEmailError] = useState<string | null>(null);
  const [course, setCourse] = useState(profile?.course || 'PGDM-C (Communications)');
  const [year, setYear] = useState(profile?.year || '1st Year');
  const [hostel, setHostel] = useState(profile?.hostel || 'Hostel Block A - Room 204');
  const [roommateDetails, setRoommateDetails] = useState(profile?.roommateDetails || '');
  const [emergencyContactName, setEmergencyContactName] = useState(profile?.emergencyContactName || '');
  const [emergencyContactPhone, setEmergencyContactPhone] = useState(profile?.emergencyContactPhone || '');
  const [bloodGroup, setBloodGroup] = useState(profile?.bloodGroup || 'O+');
  const [otherInsuranceInfo, setOtherInsuranceInfo] = useState(profile?.otherInsuranceInfo || 'Star Health Student Plan / None');
  const [panNumber, setPanNumber] = useState(profile?.panNumber || 'ABCDE1234F');
  const [aadharNumber, setAadharNumber] = useState(profile?.aadharNumber || '1234 5678 9012');
  const [micaInsuranceId, setMicaInsuranceId] = useState(profile?.micaInsuranceId || '');

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!micaInsuranceId) {
      setMicaInsuranceId(generateMicaInsuranceId());
    }
  }, [micaInsuranceId]);

  const handleCollegeEmailChange = (val: string) => {
    setCollegeEmail(val);
    if (collegeEmailError) {
      if (/@micamail\.in$/i.test(val.trim())) {
        setCollegeEmailError(null);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setCollegeEmailError(null);

    if (!name.trim()) {
      setError('Please provide your full student name.');
      return;
    }

    const trimmedCollegeEmail = collegeEmail.trim();
    if (!trimmedCollegeEmail) {
      setCollegeEmailError('MICA college email is required.');
      setError('Please provide your MICA college email ending with @micamail.in.');
      return;
    }

    if (!/@micamail\.in$/i.test(trimmedCollegeEmail)) {
      setCollegeEmailError('Must end with @micamail.in (e.g. student.24@micamail.in)');
      setError('Please enter a valid MICA college email ending with @micamail.in');
      return;
    }

    if (!emergencyContactName.trim() || !emergencyContactPhone.trim()) {
      setError('Emergency contact details are required for campus safety.');
      return;
    }

    setSaving(true);
    try {
      const generatedId = profile?.micaInsuranceId || micaInsuranceId || generateMicaInsuranceId();
      await saveProfile({
        name: name.trim(),
        email: email.trim(),
        collegeEmail: trimmedCollegeEmail,
        course: course.trim(),
        year: year.trim(),
        hostel: hostel.trim(),
        roommateDetails: roommateDetails.trim(),
        emergencyContactName: emergencyContactName.trim(),
        emergencyContactPhone: emergencyContactPhone.trim(),
        bloodGroup,
        otherInsuranceInfo: otherInsuranceInfo.trim(),
        panNumber: panNumber.trim(),
        aadharNumber: aadharNumber.trim(),
        micaInsuranceId: generatedId,
        createdAt: profile?.createdAt || Date.now(),
        updatedAt: Date.now()
      });
      setSuccess(true);
      if (onComplete) {
        setTimeout(() => {
          onComplete();
        }, 800);
      }
    } catch (err: any) {
      console.error('Error saving profile:', err);
      setError(err?.message || 'Failed to save health profile. Please check connection.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-6 px-4 sm:px-6">
      <div className="bg-white/60 backdrop-blur-xl rounded-3xl border border-white/60 shadow-2xl shadow-teal-900/5 overflow-hidden">
        {/* Header Banner */}
        <div className="bg-gradient-to-r from-teal-900/90 via-teal-800/90 to-emerald-900/90 backdrop-blur-xl text-white p-6 sm:p-8 border-b border-white/20">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5">
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-teal-200 text-xs font-bold uppercase tracking-wider mb-2.5">
                <ShieldCheck className="w-3.5 h-3.5" />
                {isEditing ? 'Update Health Record' : 'First-Time Registration'}
              </div>
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
                {isEditing ? 'Student Health & Medical Profile' : 'Setup Your Campus Health Profile'}
              </h1>
              <p className="text-teal-100/90 text-xs sm:text-sm mt-1.5 max-w-2xl leading-relaxed">
                This medical profile ensures immediate triage by campus doctors, hospital admission clearance, and automatic link to your MICA Student Health Insurance.
              </p>
            </div>

            {/* Generated MICA Insurance ID badge */}
            <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-4 text-center shrink-0 shadow-lg">
              <span className="text-[10px] font-bold text-teal-200 block uppercase tracking-wider">
                Assigned MICA Insurance ID
              </span>
              <span className="text-xl sm:text-2xl font-mono font-black text-emerald-300 tracking-wider">
                {profile?.micaInsuranceId || micaInsuranceId}
              </span>
              <span className="text-[10px] text-teal-200/80 block mt-0.5 font-medium">Auto-generated & Linked</span>
            </div>
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-6">
          {error && (
            <div className="p-4 bg-rose-50/80 backdrop-blur-sm border border-rose-200 rounded-2xl flex items-center gap-3 text-sm text-rose-800">
              <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="p-4 bg-emerald-50/80 backdrop-blur-sm border border-emerald-200 rounded-2xl flex items-center gap-3 text-sm text-emerald-800">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <span>Profile saved successfully! Redirecting...</span>
            </div>
          )}

          {/* Section 1: Basic Student Info */}
          <div>
            <h2 className="text-sm font-extrabold text-slate-800 uppercase tracking-wider flex items-center gap-2 border-b border-white/60 pb-2.5">
              <User className="w-4 h-4 text-teal-600" />
              1. Student Identification
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Full Student Name *</label>
                <input
                  id="profile-name"
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Rahul Sharma"
                  className="w-full px-3.5 py-2.5 rounded-2xl border border-white/80 bg-white/70 backdrop-blur-sm focus:ring-2 focus:ring-teal-500 focus:bg-white text-sm outline-none transition shadow-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Your MICA college email * <span className="text-[11px] font-normal text-slate-500">(@micamail.in)</span>
                </label>
                <input
                  id="profile-college-email"
                  type="email"
                  required
                  value={collegeEmail}
                  onChange={(e) => handleCollegeEmailChange(e.target.value)}
                  placeholder="e.g. rahul.24@micamail.in"
                  className={`w-full px-3.5 py-2.5 rounded-2xl border backdrop-blur-sm text-sm outline-none transition shadow-xs ${
                    collegeEmailError 
                      ? 'border-rose-400 bg-rose-50/70 focus:ring-2 focus:ring-rose-500 text-rose-900' 
                      : 'border-white/80 bg-white/70 focus:ring-2 focus:ring-teal-500 focus:bg-white text-slate-800'
                  }`}
                />
                {collegeEmailError && (
                  <p id="college-email-error" className="text-xs text-rose-600 font-bold mt-1.5 flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    {collegeEmailError}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Personal Google Account</label>
                <input
                  id="profile-email"
                  type="email"
                  disabled
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="personal@gmail.com"
                  className="w-full px-3.5 py-2.5 rounded-2xl border border-white/80 bg-white/40 backdrop-blur-sm text-sm outline-none text-slate-500 cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Academic Program / Course</label>
                <input
                  id="profile-course"
                  type="text"
                  value={course}
                  onChange={(e) => setCourse(e.target.value)}
                  placeholder="e.g. PGDM-C / B.Tech / MBA"
                  className="w-full px-3.5 py-2.5 rounded-2xl border border-white/80 bg-white/70 backdrop-blur-sm focus:ring-2 focus:ring-teal-500 focus:bg-white text-sm outline-none transition shadow-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Academic Year</label>
                <select
                  id="profile-year"
                  value={year}
                  onChange={(e) => setYear(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-2xl border border-white/80 bg-white/80 backdrop-blur-sm focus:ring-2 focus:ring-teal-500 text-sm outline-none font-medium shadow-xs"
                >
                  <option value="1st Year">1st Year</option>
                  <option value="2nd Year">2nd Year</option>
                  <option value="Final Year">Final Year</option>
                  <option value="PhD / Research Scholar">PhD / Research Scholar</option>
                </select>
              </div>
            </div>
          </div>

          {/* Section 2: Hostel & Accommodation */}
          <div>
            <h2 className="text-sm font-extrabold text-slate-800 uppercase tracking-wider flex items-center gap-2 border-b border-white/60 pb-2.5">
              <Building className="w-4 h-4 text-teal-600" />
              2. Campus Residence & Roommate Details
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Hostel Block & Room Number *</label>
                <input
                  id="profile-hostel"
                  type="text"
                  required
                  value={hostel}
                  onChange={(e) => setHostel(e.target.value)}
                  placeholder="e.g. Hostel Block B, Room 312"
                  className="w-full px-3.5 py-2.5 rounded-2xl border border-white/80 bg-white/70 backdrop-blur-sm focus:ring-2 focus:ring-teal-500 focus:bg-white text-sm outline-none transition shadow-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Roommate Name & Phone (For Wardens)</label>
                <input
                  id="profile-roommate"
                  type="text"
                  value={roommateDetails}
                  onChange={(e) => setRoommateDetails(e.target.value)}
                  placeholder="e.g. Aryan Patel (+91 98250 11223)"
                  className="w-full px-3.5 py-2.5 rounded-2xl border border-white/80 bg-white/70 backdrop-blur-sm focus:ring-2 focus:ring-teal-500 focus:bg-white text-sm outline-none transition shadow-xs"
                />
              </div>
            </div>
          </div>

          {/* Section 3: Emergency Contact & Medical Info */}
          <div>
            <h2 className="text-sm font-extrabold text-slate-800 uppercase tracking-wider flex items-center gap-2 border-b border-white/60 pb-2.5">
              <Phone className="w-4 h-4 text-rose-600" />
              3. Emergency Contact & Vital Health Data
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Emergency Contact Name (Parent/Guardian) *</label>
                <input
                  id="profile-em-name"
                  type="text"
                  required
                  value={emergencyContactName}
                  onChange={(e) => setEmergencyContactName(e.target.value)}
                  placeholder="e.g. Sunita Sharma (Mother)"
                  className="w-full px-3.5 py-2.5 rounded-2xl border border-white/80 bg-white/70 backdrop-blur-sm focus:ring-2 focus:ring-teal-500 focus:bg-white text-sm outline-none transition shadow-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Emergency Contact Phone *</label>
                <input
                  id="profile-em-phone"
                  type="tel"
                  required
                  value={emergencyContactPhone}
                  onChange={(e) => setEmergencyContactPhone(e.target.value)}
                  placeholder="+91 98765 43210"
                  className="w-full px-3.5 py-2.5 rounded-2xl border border-white/80 bg-white/70 backdrop-blur-sm focus:ring-2 focus:ring-teal-500 focus:bg-white text-sm outline-none transition shadow-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Blood Group *</label>
                <select
                  id="profile-blood-group"
                  value={bloodGroup}
                  onChange={(e) => setBloodGroup(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-2xl border border-white/80 bg-white/80 backdrop-blur-sm focus:ring-2 focus:ring-teal-500 text-sm outline-none font-bold shadow-xs"
                >
                  <option value="A+">A +ve</option>
                  <option value="A-">A -ve</option>
                  <option value="B+">B +ve</option>
                  <option value="B-">B -ve</option>
                  <option value="O+">O +ve</option>
                  <option value="O-">O -ve</option>
                  <option value="AB+">AB +ve</option>
                  <option value="AB-">AB -ve</option>
                </select>
              </div>
            </div>
          </div>

          {/* Section 4: Insurance & Demo Government Identifiers */}
          <div>
            <h2 className="text-sm font-extrabold text-slate-800 uppercase tracking-wider flex items-center gap-2 border-b border-white/60 pb-2.5">
              <CreditCard className="w-4 h-4 text-teal-600" />
              4. Insurance Policy & Government IDs (Demo fields)
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Other Insurance Details / Policy</label>
                <input
                  id="profile-other-insurance"
                  type="text"
                  value={otherInsuranceInfo}
                  onChange={(e) => setOtherInsuranceInfo(e.target.value)}
                  placeholder="e.g. HDFC Ergo / None"
                  className="w-full px-3.5 py-2.5 rounded-2xl border border-white/80 bg-white/70 backdrop-blur-sm focus:ring-2 focus:ring-teal-500 focus:bg-white text-sm outline-none transition shadow-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">PAN Number (Demo)</label>
                <input
                  id="profile-pan"
                  type="text"
                  value={panNumber}
                  onChange={(e) => setPanNumber(e.target.value)}
                  placeholder="ABCDE1234F"
                  className="w-full px-3.5 py-2.5 rounded-2xl border border-white/80 bg-white/70 backdrop-blur-sm focus:ring-2 focus:ring-teal-500 focus:bg-white text-sm outline-none uppercase font-mono tracking-wider transition shadow-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Aadhar Number (Demo)</label>
                <input
                  id="profile-aadhar"
                  type="text"
                  value={aadharNumber}
                  onChange={(e) => setAadharNumber(e.target.value)}
                  placeholder="1234 5678 9012"
                  className="w-full px-3.5 py-2.5 rounded-2xl border border-white/80 bg-white/70 backdrop-blur-sm focus:ring-2 focus:ring-teal-500 focus:bg-white text-sm outline-none font-mono tracking-wider transition shadow-xs"
                />
              </div>
            </div>
            <p className="text-[11px] text-slate-400 mt-2 font-medium">
              Note: PAN and Aadhar are collected as plain demo text fields for student identity clearance at campus affiliate hospitals.
            </p>
          </div>

          {/* Submit Action */}
          <div className="pt-5 flex items-center justify-end gap-3 border-t border-white/60">
            {isEditing && onComplete && (
              <button
                type="button"
                onClick={onComplete}
                className="px-5 py-2.5 rounded-2xl border border-white/80 bg-white/50 backdrop-blur-sm text-slate-700 hover:bg-white/80 text-sm font-bold transition cursor-pointer"
              >
                Cancel
              </button>
            )}
            <button
              id="save-profile-btn"
              type="submit"
              disabled={saving}
              className="px-6 py-3 rounded-2xl bg-teal-600 hover:bg-teal-700 text-white text-sm font-bold shadow-lg shadow-teal-600/25 transition transform active:scale-95 flex items-center gap-2 disabled:opacity-60 cursor-pointer"
            >
              {saving ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <Save className="w-4 h-4" />
              )}
              <span>{isEditing ? 'Update Medical Profile' : 'Complete Setup & Enter Platform'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
