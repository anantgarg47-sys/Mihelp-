import React, { useState, useEffect } from 'react';
import { 
  Stethoscope, 
  Search, 
  Clock, 
  MapPin, 
  Phone, 
  PlusCircle, 
  Sparkles, 
  CheckCircle2,
  Calendar,
  Building2,
  Filter
} from 'lucide-react';
import { collection, getDocs } from 'firebase/firestore';
import { db, INITIAL_DOCTORS } from '../firebase';
import type { Doctor } from '../types';

interface DoctorDirectoryProps {
  onRequestDoctorConsult: (doctorName: string, category: 'campus' | 'community', doctorId?: string) => void;
}

export const DoctorDirectory: React.FC<DoctorDirectoryProps> = ({ onRequestDoctorConsult }) => {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSpecialty, setSelectedSpecialty] = useState<string>('all');

  useEffect(() => {
    const fetchDoctors = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, 'doctors'));
        if (!querySnapshot.empty) {
          const list: Doctor[] = [];
          querySnapshot.forEach((docSnap) => {
            const data = docSnap.data() as Omit<Doctor, 'id'>;
            const category = data.category || (data.type?.toLowerCase().includes('campus') ? 'campus' : 'community');
            list.push({
              id: docSnap.id,
              ...data,
              category
            });
          });
          setDoctors(list);
        } else {
          // Fallback to initial seed if network or newly initialized
          setDoctors(INITIAL_DOCTORS.map((d, i) => ({ ...d, id: `doc_${i + 1}` })));
        }
      } catch (err) {
        console.error('Error loading doctors:', err);
        setDoctors(INITIAL_DOCTORS.map((d, i) => ({ ...d, id: `doc_${i + 1}` })));
      } finally {
        setLoading(false);
      }
    };

    fetchDoctors();
  }, []);

  const specialties: string[] = ['all', ...(Array.from(new Set(doctors.map((d) => d.specialty))) as string[])];

  const filteredDoctors = doctors.filter((doc) => {
    if (selectedSpecialty !== 'all' && doc.specialty !== selectedSpecialty) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = doc.name.toLowerCase().includes(q);
      const matchSpec = doc.specialty.toLowerCase().includes(q);
      const matchType = doc.type.toLowerCase().includes(q);
      return matchName || matchSpec || matchType;
    }
    return true;
  });

  return (
    <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8 space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-teal-900/90 via-teal-800/90 to-emerald-900/90 backdrop-blur-xl text-white rounded-3xl p-6 sm:p-8 shadow-xl shadow-teal-950/15 border border-white/20">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-white/10 backdrop-blur border border-white/20 text-teal-200 text-xs font-bold uppercase tracking-wider mb-2.5">
              <Stethoscope className="w-3.5 h-3.5" />
              Verified Campus Medical Panel
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
              Campus Doctors & Medical Specialists Directory
            </h1>
            <p className="text-teal-100 text-xs sm:text-sm mt-1.5 max-w-2xl font-medium leading-relaxed">
              Consult resident medical officers, visiting specialists, and mental wellness counselors available for on-campus visits and telehealth consultations.
            </p>
          </div>

          <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-4 text-center shrink-0 shadow-xs">
            <span className="text-xs text-teal-200 block font-semibold">Hostel Health Center</span>
            <span className="text-sm font-bold text-white block mt-0.5">Cabin 1 & 2 (Ground Floor)</span>
            <span className="text-[11px] text-teal-300 block mt-1 font-medium">24x7 Nurse on Duty</span>
          </div>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="bg-white/60 backdrop-blur-xl rounded-3xl border border-white/60 p-4 sm:p-5 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm">
        {/* Search */}
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            id="doctor-search-input"
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by doctor name or specialty..."
            className="w-full pl-10 pr-4 py-2.5 rounded-2xl border border-white/80 bg-white/70 backdrop-blur-sm text-xs sm:text-sm focus:ring-2 focus:ring-teal-500 focus:bg-white outline-none shadow-xs transition"
          />
        </div>

        {/* Specialty Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider mr-1 hidden sm:inline">Specialty:</span>
          {specialties.slice(0, 5).map((spec) => (
            <button
              key={spec}
              onClick={() => setSelectedSpecialty(spec)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition cursor-pointer backdrop-blur-sm ${
                selectedSpecialty === spec
                  ? 'bg-teal-600 text-white shadow-md shadow-teal-600/20'
                  : 'bg-white/70 text-slate-700 hover:bg-white border border-white/80'
              }`}
            >
              {spec === 'all' ? 'All Panel Doctors' : spec.split('&')[0]}
            </button>
          ))}
        </div>
      </div>

      {/* Doctors Grid */}
      {loading ? (
        <div className="py-12 text-center text-slate-400">
          <div className="w-8 h-8 border-3 border-teal-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
          <p className="text-xs font-medium">Loading campus medical panel...</p>
        </div>
      ) : filteredDoctors.length === 0 ? (
        <div className="py-12 text-center border border-dashed border-slate-300 rounded-3xl p-6 bg-white/50 backdrop-blur-xl">
          <Stethoscope className="w-10 h-10 text-slate-400 mx-auto mb-2" />
          <h3 className="text-sm font-bold text-slate-700">No doctors match your search</h3>
          <p className="text-xs text-slate-400 mt-1">Try resetting search query or specialty filter.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredDoctors.map((doc) => (
            <div
              key={doc.id || doc.name}
              id={`doctor-card-${doc.name.replace(/\s+/g, '-').toLowerCase()}`}
              className="bg-white/60 backdrop-blur-xl rounded-3xl border border-white/60 shadow-xl shadow-teal-900/5 hover:shadow-2xl hover:bg-white/80 transition p-5 sm:p-6 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="w-12 h-12 rounded-2xl bg-teal-50 border border-teal-100 flex items-center justify-center text-teal-700 font-bold shrink-0 shadow-xs">
                    <Stethoscope className="w-6 h-6" />
                  </div>
                  <span className="px-3 py-1 rounded-full text-[11px] font-bold bg-teal-50/80 text-teal-800 border border-teal-200/80">
                    {doc.type}
                  </span>
                </div>

                <h3 className="text-base font-extrabold text-slate-900">{doc.name}</h3>
                <p className="text-xs font-bold text-teal-700 mt-0.5">{doc.specialty}</p>

                <div className="mt-4 space-y-2 text-xs text-slate-600">
                  <div className="flex items-start gap-2">
                    <Clock className="w-3.5 h-3.5 text-teal-600 shrink-0 mt-0.5" />
                    <span className="font-medium">{doc.availability}</span>
                  </div>

                  {doc.location && (
                    <div className="flex items-start gap-2">
                      <MapPin className="w-3.5 h-3.5 text-teal-600 shrink-0 mt-0.5" />
                      <span>{doc.location}</span>
                    </div>
                  )}

                  {doc.phone && (
                    <div className="flex items-start gap-2 text-slate-500">
                      <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                      <span>{doc.phone}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-5 pt-3.5 border-t border-white/60">
                <button
                  id={`consult-btn-${doc.name.replace(/\s+/g, '-').toLowerCase()}`}
                  onClick={() => onRequestDoctorConsult(doc.name, doc.category, doc.id)}
                  className="w-full py-2.5 px-3 rounded-2xl bg-teal-50/90 hover:bg-teal-600 text-teal-800 hover:text-white border border-teal-200/80 hover:border-teal-600 text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer group shadow-xs hover:shadow-md"
                >
                  <PlusCircle className="w-3.5 h-3.5 text-teal-600 group-hover:text-white" />
                  Request Consult with {doc.name.split(' ')[0]} {doc.name.split(' ')[1]}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
