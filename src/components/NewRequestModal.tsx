import React, { useState, useEffect } from 'react';
import { 
  PlusCircle, 
  Stethoscope, 
  Activity, 
  AlertTriangle, 
  Building2, 
  Users, 
  HeartHandshake, 
  Save, 
  X,
  FileEdit,
  ShieldCheck,
  CheckCircle2
} from 'lucide-react';
import { addDoc, collection, doc, updateDoc, getDocs } from 'firebase/firestore';
import { db, INITIAL_DOCTORS } from '../firebase';
import { useAuth } from '../context/AuthContext';
import type { Scenario, ConsultType, HelpRequest, Doctor } from '../types';

interface NewRequestModalProps {
  initialRequest?: HelpRequest | null;
  selectedDoctorName?: string;
  selectedDoctorId?: string;
  selectedConsultType?: ConsultType;
  onClose: () => void;
  onSuccess: (requestId: string) => void;
}

export const NewRequestModal: React.FC<NewRequestModalProps> = ({
  initialRequest,
  selectedDoctorName = '',
  selectedDoctorId = '',
  selectedConsultType,
  onClose,
  onSuccess
}) => {
  const { user, profile } = useAuth();

  const [ailment, setAilment] = useState(initialRequest?.ailment || '');
  const [description, setDescription] = useState(initialRequest?.description || '');
  const [scenario, setScenario] = useState<Scenario>(initialRequest?.scenario || 'minor');
  const [consultType, setConsultType] = useState<ConsultType>(
    initialRequest?.consultType || selectedConsultType || 'campus'
  );
  const [assignedDoctorId, setAssignedDoctorId] = useState<string>(
    initialRequest?.assignedDoctorId || selectedDoctorId || ''
  );
  const [assignedDoctorName, setAssignedDoctorName] = useState<string>(
    initialRequest?.assignedDoctorName || selectedDoctorName || ''
  );

  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [doctorsLoading, setDoctorsLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isEditing = !!initialRequest;

  // Fetch doctors from Firestore
  useEffect(() => {
    const fetchDoctors = async () => {
      try {
        const docSnap = await getDocs(collection(db, 'doctors'));
        if (!docSnap.empty) {
          const list: Doctor[] = [];
          docSnap.forEach((d) => {
            const data = d.data() as Omit<Doctor, 'id'>;
            // Ensure category is present
            const category = data.category || (data.type?.toLowerCase().includes('campus') ? 'campus' : 'community');
            list.push({
              id: d.id,
              ...data,
              category
            });
          });
          setDoctors(list);
        } else {
          setDoctors(INITIAL_DOCTORS.map((d, i) => ({ ...d, id: `doc_${i + 1}` })));
        }
      } catch (err) {
        console.error('Error fetching doctors in NewRequestModal:', err);
        setDoctors(INITIAL_DOCTORS.map((d, i) => ({ ...d, id: `doc_${i + 1}` })));
      } finally {
        setDoctorsLoading(false);
      }
    };

    fetchDoctors();
  }, []);

  // Sync / Auto-select doctor when doctors load or consultType changes
  useEffect(() => {
    if (doctorsLoading || doctors.length === 0) return;

    if (consultType === 'family') {
      setAssignedDoctorId('');
      setAssignedDoctorName('Family Physician (External)');
      return;
    }

    const availableForType = doctors.filter((d) => d.category === consultType);
    if (availableForType.length === 0) return;

    // If we have a pre-selected doctor name or ID, try matching
    if (assignedDoctorId) {
      const matchById = availableForType.find((d) => d.id === assignedDoctorId);
      if (matchById) {
        setAssignedDoctorName(matchById.name);
        return;
      }
    }

    if (assignedDoctorName && assignedDoctorName !== 'Family Physician (External)') {
      const matchByName = availableForType.find(
        (d) => d.name.toLowerCase() === assignedDoctorName.toLowerCase()
      );
      if (matchByName) {
        setAssignedDoctorId(matchByName.id || matchByName.name);
        setAssignedDoctorName(matchByName.name);
        return;
      }
    }

    // Default to the first available doctor in this category if none matched or if switching types
    if (!assignedDoctorId || !availableForType.some((d) => (d.id || d.name) === assignedDoctorId)) {
      setAssignedDoctorId(availableForType[0].id || availableForType[0].name);
      setAssignedDoctorName(availableForType[0].name);
    }
  }, [consultType, doctors, doctorsLoading]);

  const handleConsultTypeSelect = (type: ConsultType) => {
    setConsultType(type);
    setError(null);
    if (type === 'family') {
      setAssignedDoctorId('');
      setAssignedDoctorName('Family Physician (External)');
    } else {
      const available = doctors.filter((d) => d.category === type);
      if (available.length > 0) {
        setAssignedDoctorId(available[0].id || available[0].name);
        setAssignedDoctorName(available[0].name);
      } else {
        setAssignedDoctorId('');
        setAssignedDoctorName('');
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      setError('You must be logged in to submit a medical request.');
      return;
    }
    if (!ailment.trim()) {
      setError('Please state your primary ailment or symptom.');
      return;
    }
    if (!description.trim()) {
      setError('Please provide brief details of your symptoms for the medical team.');
      return;
    }

    // Validate Doctor Assignment for campus and community types
    if (consultType === 'campus' || consultType === 'community') {
      if (!assignedDoctorId || !assignedDoctorName.trim()) {
        setError(
          `Please select an assigned doctor from the ${consultType === 'campus' ? 'campus resident' : 'community specialist'} panel.`
        );
        return;
      }
    }

    setSaving(true);
    setError(null);

    try {
      const finalDocName = consultType === 'family' 
        ? 'Family Physician (External)' 
        : assignedDoctorName.trim();
      const finalDocId = consultType === 'family' ? '' : assignedDoctorId;

      if (isEditing && initialRequest?.id) {
        // Update pending request
        const reqRef = doc(db, 'helpRequests', initialRequest.id);
        await updateDoc(reqRef, {
          ailment: ailment.trim(),
          description: description.trim(),
          scenario,
          consultType,
          assignedDoctorId: finalDocId,
          assignedDoctorName: finalDocName,
          updatedAt: Date.now()
        });
        onSuccess(initialRequest.id);
      } else {
        // Create new request
        const newDoc: Omit<HelpRequest, 'id'> = {
          studentId: user.uid,
          ailment: ailment.trim(),
          description: description.trim(),
          scenario,
          consultType,
          status: 'pending',
          assignedDoctorId: finalDocId,
          assignedDoctorName: finalDocName,
          doctorNotes: '',
          createdAt: Date.now(),
          updatedAt: Date.now()
        };
        const docRef = await addDoc(collection(db, 'helpRequests'), newDoc);
        onSuccess(docRef.id);
      }
    } catch (err: any) {
      console.error('Error submitting help request:', err);
      setError(err?.message || 'Failed to submit medical request. Please try again.');
      setSaving(false);
    }
  };

  const availableDoctors = doctors.filter((doc) => doc.category === consultType);

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/40 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white/80 backdrop-blur-2xl rounded-3xl max-w-2xl w-full border border-white/70 shadow-2xl shadow-teal-950/20 overflow-hidden my-8">
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-teal-900/90 via-teal-800/90 to-emerald-900/90 backdrop-blur-xl text-white p-5 sm:p-6 flex items-center justify-between border-b border-white/20">
          <div className="flex items-center gap-3.5">
            <div className="p-2.5 rounded-2xl bg-white/10 backdrop-blur border border-white/20 shadow-xs">
              {isEditing ? <FileEdit className="w-6 h-6" /> : <PlusCircle className="w-6 h-6" />}
            </div>
            <div>
              <h2 className="text-xl font-black tracking-tight">
                {isEditing ? 'Edit Medical Help Request' : 'New Medical Help Request'}
              </h2>
              <p className="text-xs text-teal-200 mt-0.5 font-medium">
                {isEditing 
                  ? 'Update your consultation request and doctor assignment' 
                  : 'Submit symptoms for triage and doctor consultation'}
              </p>
            </div>
          </div>
          <button
            id="close-request-modal-btn"
            onClick={onClose}
            className="p-2 rounded-xl text-white/80 hover:text-white hover:bg-white/10 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {error && (
            <div className="p-3.5 bg-rose-50/80 backdrop-blur-sm border border-rose-200 rounded-2xl text-xs text-rose-800 flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Student Badge Reference */}
          {profile && (
            <div className="p-3.5 bg-white/50 backdrop-blur-md rounded-2xl border border-white/70 flex items-center justify-between text-xs text-slate-700 shadow-xs">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-teal-600" />
                <span>Student: <strong>{profile.name}</strong> ({profile.hostel})</span>
              </div>
              <span className="font-mono text-teal-800 font-bold bg-teal-50/80 px-2 py-0.5 rounded-md border border-teal-200/60">
                {profile.micaInsuranceId}
              </span>
            </div>
          )}

          {/* Primary Ailment */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Primary Ailment / Chief Complaint *
            </label>
            <input
              id="request-ailment-input"
              type="text"
              required
              value={ailment}
              onChange={(e) => setAilment(e.target.value)}
              placeholder="e.g., High fever & chills, acute food poisoning, sprained ankle..."
              className="w-full px-4 py-2.5 rounded-2xl border border-white/80 bg-white/70 backdrop-blur-sm focus:ring-2 focus:ring-teal-500 focus:bg-white text-sm outline-none font-medium transition shadow-xs text-slate-800 placeholder-slate-400"
            />
          </div>

          {/* Scenario Selection (minor, major, emergency) */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Select Medical Scenario Severity *
            </label>
            <div className="grid grid-cols-3 gap-3">
              {/* Minor */}
              <button
                type="button"
                id="scenario-minor-btn"
                onClick={() => setScenario('minor')}
                className={`p-3.5 rounded-2xl border text-left transition cursor-pointer backdrop-blur-sm ${
                  scenario === 'minor'
                    ? 'border-emerald-500/80 bg-emerald-50/90 ring-2 ring-emerald-500/30 shadow-xs'
                    : 'border-white/80 hover:border-slate-300 bg-white/50 hover:bg-white/80'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-emerald-800">Minor</span>
                  <Activity className="w-4 h-4 text-emerald-600" />
                </div>
                <p className="text-[11px] text-slate-500 leading-tight">
                  Cold, mild fever, headache, indigestion, minor rash
                </p>
              </button>

              {/* Major */}
              <button
                type="button"
                id="scenario-major-btn"
                onClick={() => setScenario('major')}
                className={`p-3.5 rounded-2xl border text-left transition cursor-pointer backdrop-blur-sm ${
                  scenario === 'major'
                    ? 'border-amber-500/80 bg-amber-50/90 ring-2 ring-amber-500/30 shadow-xs'
                    : 'border-white/80 hover:border-slate-300 bg-white/50 hover:bg-white/80'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-amber-800">Major</span>
                  <AlertTriangle className="w-4 h-4 text-amber-600" />
                </div>
                <p className="text-[11px] text-slate-500 leading-tight">
                  High fever &gt;102°F, sports fracture, severe migraine
                </p>
              </button>

              {/* Emergency */}
              <button
                type="button"
                id="scenario-emergency-btn"
                onClick={() => setScenario('emergency')}
                className={`p-3.5 rounded-2xl border text-left transition cursor-pointer backdrop-blur-sm ${
                  scenario === 'emergency'
                    ? 'border-rose-500/80 bg-rose-50/90 ring-2 ring-rose-500/30 shadow-xs'
                    : 'border-white/80 hover:border-slate-300 bg-white/50 hover:bg-white/80'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-rose-800">Emergency</span>
                  <Activity className="w-4 h-4 text-rose-600" />
                </div>
                <p className="text-[11px] text-slate-500 leading-tight">
                  Breathing trouble, heavy bleeding, sudden fainting
                </p>
              </button>
            </div>
          </div>

          {/* Consult Type (campus, community, family) */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Select Consult Type *
            </label>
            <div className="grid grid-cols-3 gap-3">
              <button
                type="button"
                id="consult-campus-btn"
                onClick={() => handleConsultTypeSelect('campus')}
                className={`p-3.5 rounded-2xl border text-left transition cursor-pointer backdrop-blur-sm ${
                  consultType === 'campus'
                    ? 'border-teal-500/80 bg-teal-50/90 ring-2 ring-teal-500/30 shadow-xs'
                    : 'border-white/80 hover:border-slate-300 bg-white/50 hover:bg-white/80'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-teal-900">Campus</span>
                  <Building2 className="w-4 h-4 text-teal-600" />
                </div>
                <p className="text-[11px] text-slate-500 leading-tight">
                  Hostel Health Center Resident Doctor
                </p>
              </button>

              <button
                type="button"
                id="consult-community-btn"
                onClick={() => handleConsultTypeSelect('community')}
                className={`p-3.5 rounded-2xl border text-left transition cursor-pointer backdrop-blur-sm ${
                  consultType === 'community'
                    ? 'border-teal-500/80 bg-teal-50/90 ring-2 ring-teal-500/30 shadow-xs'
                    : 'border-white/80 hover:border-slate-300 bg-white/50 hover:bg-white/80'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-teal-900">Community</span>
                  <Users className="w-4 h-4 text-teal-600" />
                </div>
                <p className="text-[11px] text-slate-500 leading-tight">
                  Affiliated City Clinic / Visiting Specialist
                </p>
              </button>

              <button
                type="button"
                id="consult-family-btn"
                onClick={() => handleConsultTypeSelect('family')}
                className={`p-3.5 rounded-2xl border text-left transition cursor-pointer backdrop-blur-sm ${
                  consultType === 'family'
                    ? 'border-teal-500/80 bg-teal-50/90 ring-2 ring-teal-500/30 shadow-xs'
                    : 'border-white/80 hover:border-slate-300 bg-white/50 hover:bg-white/80'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-teal-900">Family</span>
                  <HeartHandshake className="w-4 h-4 text-teal-600" />
                </div>
                <p className="text-[11px] text-slate-500 leading-tight">
                  Home Family Doctor Tele-Consultation
                </p>
              </button>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Detailed Description & Timeline of Symptoms *
            </label>
            <textarea
              id="request-description-input"
              rows={3}
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe when symptoms started, temperature, medications already taken, allergies, etc."
              className="w-full px-4 py-2.5 rounded-2xl border border-white/80 bg-white/70 backdrop-blur-sm focus:ring-2 focus:ring-teal-500 focus:bg-white text-sm outline-none transition shadow-xs text-slate-800 placeholder-slate-400"
            />
          </div>

          {/* Doctor Assignment Section: Conditional based on consultType */}
          {consultType === 'family' ? (
            /* Family Consult Note (No Doctor to Assign) */
            <div className="p-4 bg-teal-50/80 backdrop-blur-sm rounded-2xl border border-teal-200/80 text-xs text-teal-950 flex items-start gap-3">
              <HeartHandshake className="w-5 h-5 text-teal-700 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="font-bold text-teal-900">Family Doctor Tele-Consultation</p>
                <p className="text-teal-800 leading-relaxed">
                  This consultation happens directly with your own personal family physician outside the platform, so there is no campus or panel doctor to assign here.
                </p>
              </div>
            </div>
          ) : (
            /* Campus / Community Doctor Selection Dropdown */
            <div>
              <label 
                htmlFor="request-doctor-select" 
                className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5"
              >
                Assigned Doctor * ({consultType === 'campus' ? 'Campus Medical Panel' : 'Visiting Specialists & Telehealth'})
              </label>

              {doctorsLoading ? (
                <div className="p-3 bg-white/60 rounded-2xl border border-white/80 text-xs text-slate-500 flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-teal-600 border-t-transparent rounded-full animate-spin"></div>
                  <span>Loading available {consultType} doctors...</span>
                </div>
              ) : availableDoctors.length === 0 ? (
                <div className="p-3 bg-rose-50/80 rounded-2xl border border-rose-200 text-xs text-rose-800">
                  No doctors found in the {consultType} category.
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="relative">
                    <select
                      id="request-doctor-select"
                      required
                      value={assignedDoctorId}
                      onChange={(e) => {
                        const docId = e.target.value;
                        const docObj = availableDoctors.find((d) => (d.id || d.name) === docId);
                        setAssignedDoctorId(docId);
                        setAssignedDoctorName(docObj ? docObj.name : '');
                        setError(null);
                      }}
                      className="w-full px-4 py-2.5 rounded-2xl border border-white/80 bg-white/80 backdrop-blur-sm focus:ring-2 focus:ring-teal-500 focus:bg-white text-sm outline-none pl-10 transition shadow-xs text-slate-800 font-medium cursor-pointer"
                    >
                      <option value="">
                        -- Select {consultType === 'campus' ? 'Campus Resident Doctor' : 'Specialist Doctor'} --
                      </option>
                      {availableDoctors.map((doc) => {
                        const optionValue = doc.id || doc.name;
                        return (
                          <option key={optionValue} value={optionValue}>
                            {doc.name} — {doc.specialty} ({doc.type})
                          </option>
                        );
                      })}
                    </select>
                    <Stethoscope className="w-4 h-4 text-teal-600 absolute left-3.5 top-3 pointer-events-none" />
                  </div>

                  {assignedDoctorId && (
                    <div className="p-2.5 rounded-xl bg-teal-50/80 border border-teal-200/60 text-[11px] text-teal-900 flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-teal-600" />
                        <span>
                          Assigned: <strong>{assignedDoctorName}</strong>
                        </span>
                      </div>
                      <span className="text-teal-700 font-medium">
                        {availableDoctors.find((d) => (d.id || d.name) === assignedDoctorId)?.availability}
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="pt-4 border-t border-white/60 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-2xl border border-white/80 bg-white/50 backdrop-blur-sm text-slate-700 hover:bg-white/80 text-sm font-bold transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              id="submit-request-btn"
              type="submit"
              disabled={saving}
              className="px-6 py-2.5 rounded-2xl bg-teal-600 hover:bg-teal-700 text-white text-sm font-bold shadow-lg shadow-teal-600/25 transition transform active:scale-95 flex items-center gap-2 disabled:opacity-60 cursor-pointer"
            >
              {saving ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <Save className="w-4 h-4" />
              )}
              <span>{isEditing ? 'Save Changes' : 'Submit Help Request'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

