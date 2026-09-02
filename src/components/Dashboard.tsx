import React, { useState, useEffect } from 'react';
import { 
  PlusCircle, 
  AlertOctagon, 
  HeartPulse, 
  Clock, 
  CheckCircle2, 
  Stethoscope, 
  Pill, 
  ArrowRight, 
  Search, 
  Filter, 
  AlertTriangle, 
  ShieldCheck, 
  Calendar,
  Building,
  Edit3,
  Trash2,
  PhoneCall,
  ChevronRight
} from 'lucide-react';
import { collection, query, where, onSnapshot, orderBy } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../context/AuthContext';
import type { HelpRequest, RequestStatus } from '../types';

interface DashboardProps {
  onNewRequest: () => void;
  onOpenEmergency: () => void;
  onSelectRequest: (request: HelpRequest) => void;
  onEditPendingRequest: (request: HelpRequest) => void;
  onOpenDoctors: () => void;
  onOpenDispensaries: () => void;
  onOpenProfile: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  onNewRequest,
  onOpenEmergency,
  onSelectRequest,
  onEditPendingRequest,
  onOpenDoctors,
  onOpenDispensaries,
  onOpenProfile
}) => {
  const { user, profile } = useAuth();
  const [requests, setRequests] = useState<HelpRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'active' | 'resolved'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (!user) {
      setRequests([]);
      setLoading(false);
      return;
    }

    // Subscribe to student's own help requests in real-time
    const q = query(
      collection(db, 'helpRequests'),
      where('studentId', '==', user.uid)
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const fetchedRequests: HelpRequest[] = [];
        snapshot.forEach((docSnap) => {
          fetchedRequests.push({
            id: docSnap.id,
            ...(docSnap.data() as Omit<HelpRequest, 'id'>)
          });
        });
        // Sort descending by createdAt
        fetchedRequests.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
        setRequests(fetchedRequests);
        setLoading(false);
      },
      (error) => {
        console.error('Error fetching student help requests:', error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user]);

  const filteredRequests = requests.filter((req) => {
    // Filter status
    const isResolved = req.status === 'closed_helped';
    if (filter === 'active' && isResolved) return false;
    if (filter === 'resolved' && !isResolved) return false;

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchAilment = req.ailment.toLowerCase().includes(q);
      const matchDesc = req.description.toLowerCase().includes(q);
      const matchDoc = req.assignedDoctorName?.toLowerCase().includes(q);
      return matchAilment || matchDesc || matchDoc;
    }
    return true;
  });

  const getStatusBadge = (status: RequestStatus) => {
    switch (status) {
      case 'pending':
        return <span className="px-2.5 py-1 bg-amber-50 text-amber-800 border border-amber-200 rounded-lg text-xs font-bold flex items-center gap-1"><Clock className="w-3.5 h-3.5 text-amber-600" /> Pending Triage</span>;
      case 'doctor_assigned':
        return <span className="px-2.5 py-1 bg-blue-50 text-blue-800 border border-blue-200 rounded-lg text-xs font-bold flex items-center gap-1"><Stethoscope className="w-3.5 h-3.5 text-blue-600" /> Doctor Assigned</span>;
      case 'consulting':
        return <span className="px-2.5 py-1 bg-indigo-50 text-indigo-800 border border-indigo-200 rounded-lg text-xs font-bold flex items-center gap-1"><Stethoscope className="w-3.5 h-3.5 text-indigo-600" /> In Consultation</span>;
      case 'prescribed':
        return <span className="px-2.5 py-1 bg-teal-50 text-teal-800 border border-teal-200 rounded-lg text-xs font-bold flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5 text-teal-600" /> Prescribed</span>;
      case 'ordering_medicine':
        return <span className="px-2.5 py-1 bg-purple-50 text-purple-800 border border-purple-200 rounded-lg text-xs font-bold flex items-center gap-1"><Pill className="w-3.5 h-3.5 text-purple-600" /> Ordering Meds</span>;
      case 'closed_helped':
        return <span className="px-2.5 py-1 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-lg text-xs font-bold flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Closed (Helped)</span>;
      case 'reopened':
        return <span className="px-2.5 py-1 bg-orange-50 text-orange-800 border border-orange-200 rounded-lg text-xs font-bold flex items-center gap-1"><AlertTriangle className="w-3.5 h-3.5 text-orange-600" /> Reopened</span>;
      case 'escalated':
        return <span className="px-2.5 py-1 bg-rose-100 text-rose-800 border border-rose-300 rounded-lg text-xs font-bold flex items-center gap-1"><AlertOctagon className="w-3.5 h-3.5 text-rose-600 animate-pulse" /> Escalated (Emergency)</span>;
      default:
        return <span className="px-2.5 py-1 bg-slate-100 text-slate-700 rounded-lg text-xs font-bold">{status}</span>;
    }
  };

  const activeCount = requests.filter((r) => r.status !== 'closed_helped').length;
  const resolvedCount = requests.filter((r) => r.status === 'closed_helped').length;
  const emergencyCount = requests.filter((r) => r.scenario === 'emergency' || r.status === 'escalated').length;

  return (
    <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8 space-y-6">
      {/* Top Welcome & Quick Actions Bar */}
      <div className="bg-white/60 backdrop-blur-xl rounded-3xl border border-white/60 shadow-xl shadow-teal-900/5 p-6 sm:p-7 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Welcome, {profile?.name ? profile.name.split(' ')[0] : 'Student'}
            </h1>
            <span className="bg-teal-50/80 text-teal-700 text-xs font-extrabold px-3 py-1 rounded-full border border-teal-200/70 backdrop-blur-sm shadow-xs">
              Active Member
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 font-medium">
            {profile?.course} • {profile?.hostel || 'Hostel Residence'}
          </p>
        </div>

        {/* Buttons for New request and Emergency (Explicitly requested) */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            id="dashboard-new-request-btn"
            onClick={onNewRequest}
            className="px-5 py-3 rounded-2xl bg-teal-600 hover:bg-teal-700 text-white text-xs sm:text-sm font-bold shadow-lg shadow-teal-600/25 transition transform active:scale-95 flex items-center gap-2 cursor-pointer border border-teal-500/50"
          >
            <PlusCircle className="w-4 h-4" />
            New Request
          </button>

          <button
            id="dashboard-emergency-btn"
            onClick={onOpenEmergency}
            className="px-5 py-3 rounded-2xl bg-rose-500 hover:bg-rose-600 text-white text-xs sm:text-sm font-bold shadow-lg shadow-rose-500/30 transition transform active:scale-95 flex items-center gap-2 cursor-pointer uppercase tracking-tight"
          >
            <AlertOctagon className="w-4 h-4 animate-pulse" />
            Emergency SOS
          </button>
        </div>
      </div>

      {/* Overview Cards & Insurance Card Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Card 1: Active Requests Stat */}
        <div className="bg-white/60 backdrop-blur-md p-5 sm:p-6 rounded-3xl border border-white/60 shadow-sm flex items-center justify-between transition hover:bg-white/75">
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Active Cases</span>
            <span className="text-3xl font-black text-slate-900 mt-1 block">{activeCount}</span>
            <span className="text-[11px] text-teal-600 font-semibold">In consultation & review</span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-teal-50/80 border border-teal-100/80 flex items-center justify-center text-teal-600 shadow-xs">
            <HeartPulse className="w-6 h-6" />
          </div>
        </div>

        {/* Card 2: Resolved Cases Stat */}
        <div className="bg-white/60 backdrop-blur-md p-5 sm:p-6 rounded-3xl border border-white/60 shadow-sm flex items-center justify-between transition hover:bg-white/75">
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Resolved & Helped</span>
            <span className="text-3xl font-black text-slate-900 mt-1 block">{resolvedCount}</span>
            <span className="text-[11px] text-emerald-600 font-semibold">Successfully treated</span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-50/80 border border-emerald-100/80 flex items-center justify-center text-emerald-600 shadow-xs">
            <CheckCircle2 className="w-6 h-6" />
          </div>
        </div>

        {/* Card 3: MICA Insurance ID Card Widget */}
        <div 
          onClick={onOpenProfile}
          className="bg-gradient-to-br from-slate-900/90 via-teal-950/90 to-slate-900/90 backdrop-blur-xl text-white p-5 sm:p-6 rounded-3xl shadow-xl shadow-teal-950/20 border border-white/20 cursor-pointer hover:border-teal-400/60 transition group relative overflow-hidden"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs text-teal-300 font-bold uppercase tracking-wider">
              <ShieldCheck className="w-4 h-4 text-teal-400" />
              MICA Insurance Card
            </div>
            <span className="text-[10px] text-teal-200 bg-white/10 backdrop-blur-sm px-2.5 py-0.5 rounded-full border border-white/20 font-mono font-bold">
              Blood: {profile?.bloodGroup || 'O+'}
            </span>
          </div>
          <div className="mt-3">
            <span className="text-[9px] text-slate-400 font-bold tracking-wider uppercase block">STUDENT POLICY ID</span>
            <span className="text-xl sm:text-2xl font-mono font-black text-emerald-300 tracking-wider">
              {profile?.micaInsuranceId || 'MICA-PENDING'}
            </span>
          </div>
          <div className="mt-2 text-[11px] text-slate-300 flex items-center justify-between pt-2.5 border-t border-white/15">
            <span className="font-medium truncate max-w-[150px]">{profile?.name}</span>
            <span className="text-teal-300 group-hover:translate-x-1 transition flex items-center gap-1 font-bold">
              View Profile <ChevronRight className="w-3.5 h-3.5" />
            </span>
          </div>
        </div>
      </div>

      {/* Main Help Requests Section */}
      <div className="bg-white/60 backdrop-blur-xl rounded-3xl border border-white/60 shadow-xl shadow-teal-900/5 p-6 sm:p-7 space-y-6">
        {/* Section Header & Filters */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/40 pb-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Your Medical Help Requests</h2>
            <p className="text-xs text-slate-500">
              Track status, doctor notes, prescription delivery, and post-treatment recovery
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3">
            {/* Search Input */}
            <div className="relative w-full sm:w-56">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                id="search-requests-input"
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search requests..."
                className="w-full pl-9 pr-3 py-1.5 rounded-2xl bg-white/70 backdrop-blur-sm border border-white/80 text-xs focus:ring-2 focus:ring-teal-500 outline-none shadow-xs"
              />
            </div>

            {/* Filter Tabs */}
            <div className="flex items-center bg-white/40 backdrop-blur-md p-1 rounded-2xl border border-white/50 w-full sm:w-auto">
              <button
                onClick={() => setFilter('all')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer flex-1 sm:flex-none ${
                  filter === 'all' ? 'bg-teal-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900 hover:bg-white/40'
                }`}
              >
                All ({requests.length})
              </button>
              <button
                onClick={() => setFilter('active')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer flex-1 sm:flex-none ${
                  filter === 'active' ? 'bg-teal-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900 hover:bg-white/40'
                }`}
              >
                Active ({activeCount})
              </button>
              <button
                onClick={() => setFilter('resolved')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer flex-1 sm:flex-none ${
                  filter === 'resolved' ? 'bg-teal-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900 hover:bg-white/40'
                }`}
              >
                Resolved ({resolvedCount})
              </button>
            </div>
          </div>
        </div>

        {/* Requests List */}
        {loading ? (
          <div className="py-12 text-center text-slate-400">
            <div className="w-8 h-8 border-3 border-teal-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
            <p className="text-xs">Loading your medical requests...</p>
          </div>
        ) : filteredRequests.length === 0 ? (
          <div className="py-12 text-center bg-white/30 backdrop-blur-md border border-dashed border-white/70 rounded-3xl p-8">
            <div className="w-14 h-14 rounded-2xl bg-teal-50/80 border border-teal-100 text-teal-600 flex items-center justify-center mx-auto mb-3 shadow-xs">
              <HeartPulse className="w-7 h-7" />
            </div>
            <h3 className="text-base font-bold text-slate-800">No medical requests found</h3>
            <p className="text-xs text-slate-500 mt-1.5 max-w-sm mx-auto">
              {searchQuery
                ? 'No requests matched your search term.'
                : "You don't have any medical help requests recorded yet. Click '+ New Request' anytime you feel unwell."}
            </p>
            <div className="mt-5 flex items-center justify-center gap-3">
              <button
                onClick={onNewRequest}
                className="px-5 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-2xl text-xs font-bold transition flex items-center gap-2 cursor-pointer shadow-md shadow-teal-600/20"
              >
                <PlusCircle className="w-4 h-4" />
                Submit New Medical Request
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredRequests.map((req) => (
              <div
                key={req.id}
                id={`request-card-${req.id}`}
                className="bg-white/70 hover:bg-white/95 backdrop-blur-md border border-white/80 hover:border-teal-300/80 rounded-3xl p-5 sm:p-6 transition-all duration-200 shadow-sm hover:shadow-lg flex flex-col justify-between group cursor-pointer"
                onClick={() => onSelectRequest(req)}
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div className="flex items-center gap-2 flex-wrap">
                      {getStatusBadge(req.status)}
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider backdrop-blur-sm ${
                        req.scenario === 'emergency'
                          ? 'bg-rose-100/80 text-rose-800 border border-rose-200'
                          : req.scenario === 'major'
                          ? 'bg-amber-100/80 text-amber-800 border border-amber-200'
                          : 'bg-emerald-100/80 text-emerald-800 border border-emerald-200'
                      }`}>
                        {req.scenario}
                      </span>
                    </div>

                    <span className="text-[11px] text-slate-400 shrink-0 font-medium">
                      {new Date(req.createdAt).toLocaleDateString()}
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-slate-900 group-hover:text-teal-700 transition line-clamp-1">
                    {req.ailment}
                  </h3>

                  <p className="text-xs text-slate-600 mt-1.5 line-clamp-2 leading-relaxed">
                    {req.description}
                  </p>

                  {(req.prescriptionImageUrl || req.medicineRequirement || req.medicineUrgency) && (
                    <div className="mt-2.5 flex items-center gap-2 flex-wrap text-[11px] font-semibold">
                      {req.prescriptionImageUrl && (
                        <span className="text-purple-700 bg-purple-50/90 px-2.5 py-0.5 rounded-lg border border-purple-100 flex items-center gap-1">
                          <Pill className="w-3 h-3 text-purple-600 shrink-0" />
                          Prescription Attached
                        </span>
                      )}
                      {req.medicineUrgency && (
                        <span className={`px-2 py-0.5 rounded-lg border ${
                          req.medicineUrgency === 'immediate'
                            ? 'bg-rose-50 text-rose-700 border-rose-200'
                            : req.medicineUrgency === 'today'
                            ? 'bg-purple-50 text-purple-700 border-purple-200'
                            : 'bg-teal-50 text-teal-700 border-teal-200'
                        }`}>
                          Urgency: {req.medicineUrgency.toUpperCase()}
                        </span>
                      )}
                    </div>
                  )}
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100/80 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 text-slate-500">
                    <Stethoscope className="w-3.5 h-3.5 text-teal-600" />
                    <span className="truncate max-w-[150px] sm:max-w-[200px] font-medium">
                      {req.assignedDoctorName || 'Pending doctor triage'}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    {/* If pending, show quick edit button */}
                    {req.status === 'pending' && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onEditPendingRequest(req);
                        }}
                        className="p-1.5 text-slate-400 hover:text-teal-600 rounded-lg hover:bg-white/60 transition"
                        title="Edit pending request"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                    )}

                    <span className="text-teal-700 font-bold flex items-center gap-1 group-hover:translate-x-1 transition text-xs">
                      View Timeline <ArrowRight className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Quick Access to Doctors & Dispensaries Banner */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Doctors Directory Teaser */}
        <div 
          onClick={onOpenDoctors}
          className="p-5 sm:p-6 bg-white/60 hover:bg-white/80 backdrop-blur-md rounded-3xl border border-white/70 flex items-center justify-between cursor-pointer hover:border-teal-300 transition shadow-sm group"
        >
          <div className="flex items-center gap-4">
            <div className="p-3 bg-teal-600 text-white rounded-2xl shadow-md shadow-teal-600/20 group-hover:scale-105 transition">
              <Stethoscope className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-900">Campus Doctors Directory</h4>
              <p className="text-xs text-slate-500">Resident medical officers, specialists & telehealth timings</p>
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-teal-700 group-hover:translate-x-1 transition" />
        </div>

        {/* Dispensary Teaser */}
        <div 
          onClick={onOpenDispensaries}
          className="p-5 sm:p-6 bg-white/60 hover:bg-white/80 backdrop-blur-md rounded-3xl border border-white/70 flex items-center justify-between cursor-pointer hover:border-purple-300 transition shadow-sm group"
        >
          <div className="flex items-center gap-4">
            <div className="p-3 bg-purple-600 text-white rounded-2xl shadow-md shadow-purple-600/20 group-hover:scale-105 transition">
              <Pill className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-900">Campus Partner Dispensaries</h4>
              <p className="text-xs text-slate-500">Direct WhatsApp orders & daily fixed hostel gate deliveries</p>
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-purple-700 group-hover:translate-x-1 transition" />
        </div>
      </div>
    </div>
  );
};
