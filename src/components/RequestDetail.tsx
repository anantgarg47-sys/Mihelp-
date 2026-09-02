import React, { useState } from 'react';
import { 
  ArrowLeft, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  AlertOctagon, 
  Stethoscope, 
  FileText, 
  Pill, 
  Trash2, 
  Edit3, 
  UserCheck, 
  Sparkles, 
  ThumbsUp, 
  RotateCcw, 
  Building2, 
  Users, 
  HeartHandshake, 
  ShieldCheck, 
  ChevronRight, 
  Upload
} from 'lucide-react';
import { doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../context/AuthContext';
import type { HelpRequest, RequestStatus, Scenario, ConsultType } from '../types';

interface RequestDetailProps {
  request: HelpRequest;
  onBack: () => void;
  onEdit: (request: HelpRequest) => void;
  onDeleteSuccess: () => void;
  onOpenDispensaries: (tab?: 'browse' | 'place_order' | 'complaints') => void;
}

const STAGE_ORDER: { status: RequestStatus; label: string; description: string; step: number }[] = [
  { status: 'pending', label: 'Pending Triage', description: 'Request received by campus health center', step: 1 },
  { status: 'doctor_assigned', label: 'Doctor Assigned', description: 'Consultant assigned for case review', step: 2 },
  { status: 'consulting', label: 'In Consultation', description: 'Active examination / telehealth chat in session', step: 3 },
  { status: 'prescribed', label: 'Prescribed', description: 'Medical diagnosis & prescription issued', step: 4 },
  { status: 'ordering_medicine', label: 'Ordering Medicine', description: 'Dispensary order placed or delivery scheduled', step: 5 },
  { status: 'closed_helped', label: 'Closed (Helped)', description: 'Recovery confirmed & consultation archived', step: 6 },
];

export const RequestDetail: React.FC<RequestDetailProps> = ({
  request,
  onBack,
  onEdit,
  onDeleteSuccess,
  onOpenDispensaries
}) => {
  const { profile } = useAuth();

  const [currentStatus, setCurrentStatus] = useState<RequestStatus>(request.status);
  const [assignedDoctor, setAssignedDoctor] = useState(request.assignedDoctorName || 'Dr. Rajesh Verma');
  const [doctorNotes, setDoctorNotes] = useState(
    request.doctorNotes || 'Patient examined for reported symptoms. Prescribed oral antipyretic & hydration rest for 48h. Follow up if fever recurs.'
  );
  const [updating, setUpdating] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);

  const updateRequestStatus = async (newStatus: RequestStatus, customNotes?: string, customDoctor?: string) => {
    if (!request.id) return;
    setUpdating(true);
    try {
      const docRef = doc(db, 'helpRequests', request.id);
      const updates: Partial<HelpRequest> = {
        status: newStatus,
        assignedDoctorName: customDoctor !== undefined ? customDoctor : assignedDoctor,
        doctorNotes: customNotes !== undefined ? customNotes : doctorNotes,
        updatedAt: Date.now(),
      };
      await updateDoc(docRef, updates);
      setCurrentStatus(newStatus);
      setNotification(`Status updated to: ${newStatus.replace('_', ' ').toUpperCase()}`);
      setTimeout(() => setNotification(null), 3000);
    } catch (err: any) {
      console.error('Error updating status:', err);
      alert('Failed to update status: ' + (err?.message || 'Unknown error'));
    } finally {
      setUpdating(false);
    }
  };

  const handleDelete = async () => {
    if (!request.id) return;
    setUpdating(true);
    try {
      await deleteDoc(doc(db, 'helpRequests', request.id));
      onDeleteSuccess();
    } catch (err: any) {
      console.error('Error deleting request:', err);
      alert('Failed to delete request: ' + (err?.message || 'Unknown error'));
      setUpdating(false);
    }
  };

  const getStatusBadge = (status: RequestStatus) => {
    switch (status) {
      case 'pending':
        return <span className="px-3 py-1 bg-amber-50 text-amber-800 border border-amber-200 rounded-full text-xs font-bold flex items-center gap-1.5"><Clock className="w-3.5 h-3.5 text-amber-600" /> Pending Triage</span>;
      case 'doctor_assigned':
        return <span className="px-3 py-1 bg-blue-50 text-blue-800 border border-blue-200 rounded-full text-xs font-bold flex items-center gap-1.5"><UserCheck className="w-3.5 h-3.5 text-blue-600" /> Doctor Assigned</span>;
      case 'consulting':
        return <span className="px-3 py-1 bg-indigo-50 text-indigo-800 border border-indigo-200 rounded-full text-xs font-bold flex items-center gap-1.5"><Stethoscope className="w-3.5 h-3.5 text-indigo-600" /> Consulting</span>;
      case 'prescribed':
        return <span className="px-3 py-1 bg-teal-50 text-teal-800 border border-teal-200 rounded-full text-xs font-bold flex items-center gap-1.5"><FileText className="w-3.5 h-3.5 text-teal-600" /> Prescribed</span>;
      case 'ordering_medicine':
        return <span className="px-3 py-1 bg-purple-50 text-purple-800 border border-purple-200 rounded-full text-xs font-bold flex items-center gap-1.5"><Pill className="w-3.5 h-3.5 text-purple-600" /> Ordering Medicine</span>;
      case 'closed_helped':
        return <span className="px-3 py-1 bg-emerald-100 text-emerald-900 border border-emerald-300 rounded-full text-xs font-bold flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" /> Closed (Helped)</span>;
      case 'reopened':
        return <span className="px-3 py-1 bg-orange-100 text-orange-900 border border-orange-300 rounded-full text-xs font-bold flex items-center gap-1.5"><RotateCcw className="w-3.5 h-3.5 text-orange-700" /> Reopened</span>;
      case 'escalated':
        return <span className="px-3 py-1 bg-rose-100 text-rose-900 border border-rose-300 rounded-full text-xs font-bold flex items-center gap-1.5"><AlertOctagon className="w-3.5 h-3.5 text-rose-700" /> Escalated (Emergency)</span>;
      default:
        return <span className="px-3 py-1 bg-slate-100 text-slate-800 rounded-full text-xs font-bold">{status}</span>;
    }
  };

  const getScenarioBadge = (scenario: Scenario) => {
    switch (scenario) {
      case 'minor':
        return <span className="px-2.5 py-0.5 rounded-md text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">Minor Case</span>;
      case 'major':
        return <span className="px-2.5 py-0.5 rounded-md text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">Major Case</span>;
      case 'emergency':
        return <span className="px-2.5 py-0.5 rounded-md text-xs font-bold bg-rose-100 text-rose-800 border border-rose-300">🚨 Emergency</span>;
    }
  };

  const getConsultBadge = (type: ConsultType) => {
    switch (type) {
      case 'campus':
        return <span className="flex items-center gap-1 text-xs text-slate-600"><Building2 className="w-3.5 h-3.5 text-teal-600" /> Campus Doctor</span>;
      case 'community':
        return <span className="flex items-center gap-1 text-xs text-slate-600"><Users className="w-3.5 h-3.5 text-indigo-600" /> Community Specialist</span>;
      case 'family':
        return <span className="flex items-center gap-1 text-xs text-slate-600"><HeartHandshake className="w-3.5 h-3.5 text-emerald-600" /> Family Teleconsult</span>;
    }
  };

  const currentStageIndex = STAGE_ORDER.findIndex((s) => s.status === currentStatus);

  return (
    <div className="max-w-5xl mx-auto py-6 px-4 sm:px-6 space-y-6">
      {/* Top Breadcrumb & Actions */}
      <div className="flex items-center justify-between">
        <button
          id="back-to-dashboard-btn"
          onClick={onBack}
          className="flex items-center gap-2 text-slate-700 hover:text-teal-700 font-bold text-sm transition cursor-pointer bg-white/50 backdrop-blur-sm px-3.5 py-1.5 rounded-xl border border-white/60 hover:bg-white/80"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Dashboard
        </button>

        {/* Pending Actions (Edit or Delete) */}
        {currentStatus === 'pending' && (
          <div className="flex items-center gap-2">
            <button
              id="edit-pending-request-btn"
              onClick={() => onEdit(request)}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl border border-white/80 bg-white/70 hover:bg-white text-slate-700 text-xs font-bold transition shadow-xs cursor-pointer"
            >
              <Edit3 className="w-3.5 h-3.5 text-slate-500" />
              Edit Request
            </button>
            <button
              id="delete-pending-request-btn"
              onClick={() => setShowDeleteConfirm(true)}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl border border-rose-200/80 bg-rose-50/80 hover:bg-rose-100 text-rose-700 text-xs font-bold transition shadow-xs cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5 text-rose-600" />
              Delete
            </button>
          </div>
        )}
      </div>

      {notification && (
        <div className="p-3.5 bg-teal-50/80 backdrop-blur-sm border border-teal-200 text-teal-800 text-xs font-bold rounded-2xl flex items-center gap-2 shadow-xs">
          <CheckCircle2 className="w-4 h-4 text-teal-600" />
          {notification}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 bg-slate-950/40 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white/85 backdrop-blur-2xl rounded-3xl max-w-md w-full p-6 sm:p-7 border border-white/80 shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-rose-600">
              <AlertCircle className="w-6 h-6" />
              <h3 className="text-lg font-black text-slate-900">Delete Help Request?</h3>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Are you sure you want to cancel and delete this medical help request for "<strong>{request.ailment}</strong>"? This action cannot be undone.
            </p>
            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2 rounded-2xl border border-white/80 bg-white/70 text-xs font-bold text-slate-700 hover:bg-white cursor-pointer"
              >
                Keep Request
              </button>
              <button
                id="confirm-delete-btn"
                onClick={handleDelete}
                disabled={updating}
                className="px-5 py-2 rounded-2xl bg-rose-600 text-white text-xs font-bold hover:bg-rose-700 transition shadow-md shadow-rose-600/20 cursor-pointer"
              >
                {updating ? 'Deleting...' : 'Yes, Delete Request'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Request Header Banner */}
      <div className="bg-white/60 backdrop-blur-xl rounded-3xl border border-white/60 shadow-xl shadow-teal-900/5 p-6 sm:p-7 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/40 pb-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              {getStatusBadge(currentStatus)}
              {getScenarioBadge(request.scenario)}
              {getConsultBadge(request.consultType)}
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 mt-2">
              {request.ailment}
            </h1>
          </div>

          <div className="text-right text-xs text-slate-500 shrink-0 font-medium">
            <span className="block">Submitted: {new Date(request.createdAt).toLocaleDateString()} at {new Date(request.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
            <span className="block font-mono text-[11px] text-slate-400 mt-0.5">ID: {request.id}</span>
          </div>
        </div>

        {/* Description & Patient Context */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div className="md:col-span-2 p-4 bg-white/50 backdrop-blur-sm rounded-2xl border border-white/70 shadow-xs">
            <h3 className="font-extrabold text-slate-800 mb-1.5 uppercase tracking-wider text-[11px]">Symptom Details</h3>
            <p className="text-slate-700 leading-relaxed whitespace-pre-wrap">{request.description}</p>
          </div>

          <div className="p-4 bg-teal-50/60 backdrop-blur-sm rounded-2xl border border-teal-200/70 space-y-2 shadow-xs">
            <h3 className="font-extrabold text-teal-900 flex items-center gap-1.5 uppercase tracking-wider text-[11px]">
              <ShieldCheck className="w-3.5 h-3.5 text-teal-700" />
              Student Health Card
            </h3>
            <div className="space-y-1 text-slate-700">
              <p>Name: <strong>{profile?.name || 'Student'}</strong></p>
              <p>MICA ID: <span className="font-mono font-bold text-teal-800">{profile?.micaInsuranceId}</span></p>
              <p>Hostel: {profile?.hostel || 'Hostel Block'}</p>
              <p>Blood Group: <strong className="text-rose-700">{profile?.bloodGroup || 'O+'}</strong></p>
              <p>Emergency Contact: {profile?.emergencyContactPhone || 'Available on file'}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Interactive Status Timeline & Stage Stepper */}
      <div className="bg-white/60 backdrop-blur-xl rounded-3xl border border-white/60 shadow-xl shadow-teal-900/5 p-6 sm:p-7 space-y-6">
        <div>
          <div className="flex items-center justify-between mb-1">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Clock className="w-5 h-5 text-teal-600" />
              Medical Consultation Status Timeline
            </h2>
            <span className="text-xs font-extrabold text-teal-700 bg-teal-50/80 px-3 py-1 rounded-full border border-teal-200/70 backdrop-blur-sm">
              Live Stage Tracker
            </span>
          </div>
          <p className="text-xs text-slate-500 font-medium">
            Track the progression of your campus medical consult. You can also simulate stage updates below.
          </p>
        </div>

        {/* Step Progress Bar */}
        <div className="relative">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
            {STAGE_ORDER.map((stage, idx) => {
              const isPastOrCurrent = currentStageIndex >= 0 && idx <= currentStageIndex;
              const isCurrent = currentStatus === stage.status;

              return (
                <button
                  key={stage.status}
                  id={`stage-step-${stage.status}`}
                  disabled={updating}
                  onClick={() => updateRequestStatus(stage.status)}
                  className={`p-3.5 rounded-2xl border text-left transition relative cursor-pointer backdrop-blur-sm ${
                    isCurrent
                      ? 'border-teal-500/80 bg-teal-50/90 shadow-md ring-2 ring-teal-500/30'
                      : isPastOrCurrent
                      ? 'border-emerald-300/80 bg-emerald-50/70 hover:bg-emerald-100/70 shadow-xs'
                      : 'border-white/80 bg-white/40 hover:bg-white/70 opacity-75 hover:opacity-100'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[11px] font-extrabold text-slate-400">Step 0{stage.step}</span>
                    {isCurrent ? (
                      <span className="w-2.5 h-2.5 rounded-full bg-teal-600 animate-pulse"></span>
                    ) : isPastOrCurrent ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    ) : (
                      <span className="w-2.5 h-2.5 rounded-full bg-slate-300"></span>
                    )}
                  </div>
                  <h4 className="text-xs font-bold text-slate-800 leading-tight">{stage.label}</h4>
                  <p className="text-[10px] text-slate-500 mt-1 line-clamp-2 leading-tight">
                    {stage.description}
                  </p>
                </button>
              );
            })}
          </div>
        </div>

        {/* Stage Simulator Toolbar */}
        <div className="p-4 bg-white/40 backdrop-blur-md rounded-2xl border border-white/60 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-amber-500" />
              Stage Progress Controls
            </span>
            <span className="text-[11px] text-slate-500 font-medium">Quick Stage Switcher:</span>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => updateRequestStatus('pending')}
              className="px-3 py-1.5 rounded-xl bg-white/80 border border-white/80 hover:bg-white text-xs font-bold text-slate-700 shadow-xs cursor-pointer"
            >
              1. Pending
            </button>
            <button
              onClick={() => updateRequestStatus('doctor_assigned', doctorNotes, 'Dr. Rajesh Verma')}
              className="px-3 py-1.5 rounded-xl bg-white/80 border border-white/80 hover:bg-white text-xs font-bold text-slate-700 shadow-xs cursor-pointer"
            >
              2. Assign Doctor
            </button>
            <button
              onClick={() => updateRequestStatus('consulting')}
              className="px-3 py-1.5 rounded-xl bg-white/80 border border-white/80 hover:bg-white text-xs font-bold text-slate-700 shadow-xs cursor-pointer"
            >
              3. Consulting
            </button>
            <button
              onClick={() => updateRequestStatus('prescribed')}
              className="px-3 py-1.5 rounded-xl bg-white/80 border border-white/80 hover:bg-white text-xs font-bold text-slate-700 shadow-xs cursor-pointer"
            >
              4. Prescribe
            </button>
            <button
              onClick={() => updateRequestStatus('ordering_medicine')}
              className="px-3 py-1.5 rounded-xl bg-purple-50/90 border border-purple-300/80 hover:bg-purple-100 text-xs font-bold text-purple-800 shadow-xs cursor-pointer"
            >
              5. Order Medicine
            </button>
            <button
              onClick={() => updateRequestStatus('closed_helped')}
              className="px-3 py-1.5 rounded-xl bg-emerald-50/90 border border-emerald-300/80 hover:bg-emerald-100 text-xs font-bold text-emerald-800 shadow-xs cursor-pointer"
            >
              6. Mark Closed
            </button>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* Stage 5: Medicine Ordering & Community Pharmacy Broadcast Workflow       */}
      {/* ========================================================================= */}
      {currentStatus === 'ordering_medicine' && (
        <div className="bg-white/60 backdrop-blur-xl rounded-3xl border border-purple-200/80 shadow-xl shadow-purple-900/5 p-6 sm:p-7 space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-100 text-purple-800 text-xs font-bold uppercase tracking-wider border border-purple-200">
                <Pill className="w-3.5 h-3.5 text-purple-600" />
                Stage 5: Medicine Ordering
              </div>
              <h2 className="text-xl font-black text-slate-900">
                Place Medicine Order via Campus Dispensaries Hub
              </h2>
              <p className="text-xs text-slate-600 max-w-2xl leading-relaxed">
                Prescription medicine ordering and pharmacy broadcasts are managed directly through the <strong>Dispensary Hub</strong>. Broadcast your doctor's prescription image across our network of verified campus partner pharmacies and track acceptance in real time.
              </p>
            </div>

            <button
              id="goto-place-order-btn"
              onClick={() => onOpenDispensaries('place_order')}
              className="px-6 py-3.5 rounded-2xl bg-purple-600 hover:bg-purple-700 text-white text-xs sm:text-sm font-extrabold shadow-lg shadow-purple-600/25 transition flex items-center justify-center gap-2 shrink-0 cursor-pointer"
            >
              <Upload className="w-4 h-4" />
              <span>Go to Place Order in Dispensaries</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <div className="p-4 bg-purple-50/60 rounded-2xl border border-purple-100/80 flex items-center gap-3 text-xs text-purple-900">
            <Sparkles className="w-4 h-4 text-purple-600 shrink-0" />
            <span>
              Once a pharmacy partner accepts your broadcast order, you will receive a direct WhatsApp link to confirm delivery times and campus gate drop-offs.
            </span>
          </div>
        </div>
      )}

      {/* Post-Prescription Feedback & Status Finalization */}
      <div className="bg-gradient-to-r from-slate-900/90 via-teal-950/90 to-slate-900/90 backdrop-blur-xl text-white rounded-3xl p-6 sm:p-7 shadow-xl shadow-teal-950/20 border border-white/20 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-white/10 text-teal-300 text-xs font-bold uppercase tracking-wider mb-1.5 border border-white/10">
              <Pill className="w-3.5 h-3.5 text-teal-400" />
              Prescription & Treatment Feedback
            </div>
            <h3 className="text-lg font-black tracking-tight">Did the prescribed medication & treatment help?</h3>
            <p className="text-xs text-slate-300 mt-1 leading-relaxed">
              Confirm your recovery status to finalize medical documentation or immediately reopen your request for urgent follow-up.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            {/* Medicines Helped Button */}
            <button
              id="medicines-helped-btn"
              disabled={updating}
              onClick={() => updateRequestStatus('closed_helped')}
              className="px-5 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs sm:text-sm font-bold shadow-lg shadow-emerald-600/30 transition transform active:scale-95 flex items-center gap-2 cursor-pointer"
            >
              <ThumbsUp className="w-4 h-4" />
              Medicines Helped
            </button>

            {/* Medicines Did Not Help Button */}
            <button
              id="medicines-not-helped-btn"
              disabled={updating}
              onClick={() => updateRequestStatus('reopened')}
              className="px-5 py-2.5 rounded-2xl bg-rose-600 hover:bg-rose-500 text-white text-xs sm:text-sm font-bold shadow-lg shadow-rose-600/30 transition transform active:scale-95 flex items-center gap-2 cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
              Medicines Did Not Help
            </button>
          </div>
        </div>

        {/* Doctor Notes & Diagnosis Section */}
        <div className="pt-4 border-t border-white/15 grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div className="bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/15 space-y-2">
            <div className="flex items-center justify-between text-teal-300 font-bold">
              <span className="flex items-center gap-1.5">
                <Stethoscope className="w-4 h-4" />
                Assigned Doctor
              </span>
              <span className="text-[11px] text-slate-300 font-normal">Hostel Health Center</span>
            </div>
            <input
              type="text"
              value={assignedDoctor}
              onChange={(e) => setAssignedDoctor(e.target.value)}
              placeholder="e.g. Dr. Rajesh Verma (Campus RMO)"
              className="w-full px-3.5 py-2 rounded-xl bg-white/10 border border-white/20 text-white placeholder-slate-400 text-xs focus:ring-2 focus:ring-teal-400 outline-none"
            />
          </div>

          <div className="bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/15 space-y-2">
            <div className="flex items-center justify-between text-teal-300 font-bold">
              <span className="flex items-center gap-1.5">
                <FileText className="w-4 h-4" />
                Doctor Diagnosis & Notes
              </span>
              <button
                onClick={() => updateRequestStatus(currentStatus, doctorNotes, assignedDoctor)}
                className="text-[11px] text-teal-300 hover:text-white underline font-bold cursor-pointer"
              >
                Save Notes
              </button>
            </div>
            <textarea
              rows={2}
              value={doctorNotes}
              onChange={(e) => setDoctorNotes(e.target.value)}
              placeholder="Doctor's clinical findings, prescribed medicine dosages, rest duration..."
              className="w-full px-3.5 py-2 rounded-xl bg-white/10 border border-white/20 text-white placeholder-slate-400 text-xs focus:ring-2 focus:ring-teal-400 outline-none"
            />
          </div>
        </div>
      </div>

      {/* Quick Dispensary Directory Navigation */}
      <div className="bg-white/60 backdrop-blur-xl rounded-3xl border border-white/60 p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-purple-600 text-white rounded-2xl shadow-md shadow-purple-600/20">
            <Pill className="w-6 h-6" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-slate-900">Need to check pharmacy hours or delivery schedules?</h4>
            <p className="text-xs text-slate-500">
              Campus partnered dispensaries deliver at fixed gate delivery slots (12:30 PM & 6:30 PM daily).
            </p>
          </div>
        </div>

        <button
          id="detail-open-dispensaries-btn"
          onClick={onOpenDispensaries}
          className="px-5 py-2.5 rounded-2xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold transition shadow-md shadow-purple-600/20 flex items-center gap-1.5 shrink-0 cursor-pointer"
        >
          View Campus Dispensaries
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

