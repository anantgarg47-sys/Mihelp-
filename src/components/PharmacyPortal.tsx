import React, { useState, useEffect } from 'react';
import { 
  Building2, 
  Lock, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  ArrowLeft, 
  ExternalLink, 
  Eye, 
  Sparkles, 
  RefreshCw, 
  ShieldCheck, 
  User, 
  FileText,
  X,
  LogIn
} from 'lucide-react';
import { collection, query, where, onSnapshot, updateDoc, doc, getDocs } from 'firebase/firestore';
import { db, INITIAL_DISPENSARIES, auth, googleProvider } from '../firebase';
import { signInWithPopup } from 'firebase/auth';
import { useAuth } from '../context/AuthContext';
import type { MedicineOrder, Dispensary } from '../types';

/* =========================================================================
   NOTE: This passcode screen is a basic demonstration & simulator gate for
   campus dispensary partner operations, NOT production authentication.
   ========================================================================= */
const DEFAULT_PASSCODE = 'PHARMA2026';

interface PharmacyPortalProps {
  onBackToStudentView: () => void;
}

export const PharmacyPortal: React.FC<PharmacyPortalProps> = ({ onBackToStudentView }) => {
  const { user } = useAuth();
  const [passcode, setPasscode] = useState('');
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [passcodeError, setPasscodeError] = useState<string | null>(null);

  const [dispensaries, setDispensaries] = useState<Dispensary[]>([]);
  const [selectedDispensaryId, setSelectedDispensaryId] = useState<string>('');
  
  const [pendingOrders, setPendingOrders] = useState<MedicineOrder[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [acceptingOrderId, setAcceptingOrderId] = useState<string | null>(null);
  const [feedbackMessage, setFeedbackMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Fullscreen Prescription Preview Modal
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  // Load Dispensaries
  useEffect(() => {
    const fetchDispensaries = async () => {
      try {
        const snap = await getDocs(collection(db, 'dispensaries'));
        if (!snap.empty) {
          const list: Dispensary[] = [];
          snap.forEach((d) => {
            list.push({
              id: d.id,
              ...(d.data() as Omit<Dispensary, 'id'>)
            });
          });
          setDispensaries(list);
          if (list.length > 0 && !selectedDispensaryId) {
            setSelectedDispensaryId(list[0].id || list[0].name);
          }
        } else {
          const fallback = INITIAL_DISPENSARIES.map((d, i) => ({ ...d, id: `disp_${i + 1}` }));
          setDispensaries(fallback);
          if (fallback.length > 0 && !selectedDispensaryId) {
            setSelectedDispensaryId(fallback[0].id || fallback[0].name);
          }
        }
      } catch (err) {
        console.error('Error fetching dispensaries:', err);
        const fallback = INITIAL_DISPENSARIES.map((d, i) => ({ ...d, id: `disp_${i + 1}` }));
        setDispensaries(fallback);
        if (fallback.length > 0 && !selectedDispensaryId) {
          setSelectedDispensaryId(fallback[0].id || fallback[0].name);
        }
      }
    };

    fetchDispensaries();
  }, []);

  // Listen to Pending Orders once unlocked and signed in
  useEffect(() => {
    if (!isUnlocked || !user) return;

    setLoadingOrders(true);
    const q = query(
      collection(db, 'orders'),
      where('status', '==', 'pending')
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const ordersList: MedicineOrder[] = [];
        snapshot.forEach((docSnap) => {
          ordersList.push({
            id: docSnap.id,
            ...(docSnap.data() as Omit<MedicineOrder, 'id'>)
          });
        });
        // Sort newest first
        ordersList.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
        setPendingOrders(ordersList);
        setLoadingOrders(false);
      },
      (err) => {
        console.error('Error listening to pending orders:', err);
        setLoadingOrders(false);
      }
    );

    return () => unsubscribe();
  }, [isUnlocked, user]);

  const handlePasscodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (passcode.trim().toUpperCase() === DEFAULT_PASSCODE || passcode.trim() === '1234' || passcode.trim().toLowerCase() === 'pharma') {
      setIsUnlocked(true);
      setPasscodeError(null);
    } else {
      setPasscodeError('Invalid partner passcode. (Demo Hint: Use PHARMA2026)');
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err: any) {
      console.error('Sign in error:', err);
      alert('Sign-in failed: ' + (err?.message || 'Unknown error'));
    }
  };

  const selectedDispensary = dispensaries.find(
    (d) => (d.id || d.name) === selectedDispensaryId
  ) || dispensaries[0];

  const handleAcceptOrder = async (order: MedicineOrder) => {
    if (!order.id) return;
    if (!selectedDispensary) {
      alert('Please select the pharmacy you are acting on behalf of first.');
      return;
    }

    if (user && order.studentId === user.uid) {
      setFeedbackMessage({
        text: 'Self-acceptance disallowed: Per Firestore security rules, you cannot accept an order you authored as a student. Sign in with a separate partner account.',
        type: 'error'
      });
      return;
    }

    setAcceptingOrderId(order.id);
    setFeedbackMessage(null);

    try {
      const orderRef = doc(db, 'orders', order.id);
      await updateDoc(orderRef, {
        status: 'accepted',
        acceptedByDispensaryId: selectedDispensary.id || selectedDispensary.name,
        acceptedByDispensaryName: selectedDispensary.name,
        acceptedAt: Date.now()
      });

      setFeedbackMessage({
        text: `Successfully accepted order for ${order.studentName}! The student now has your WhatsApp link to coordinate delivery.`,
        type: 'success'
      });
    } catch (err: any) {
      console.error('Error accepting order:', err);
      setFeedbackMessage({
        text: 'Failed to accept order: ' + (err?.message || 'Firestore security violation'),
        type: 'error'
      });
    } finally {
      setAcceptingOrderId(null);
    }
  };

  // 1. Passcode Gate Screen
  if (!isUnlocked) {
    return (
      <div className="max-w-md mx-auto py-12 px-4">
        <div className="bg-white/80 backdrop-blur-xl rounded-3xl p-6 sm:p-8 border border-white/80 shadow-2xl shadow-purple-950/10 text-center space-y-6">
          <div className="w-16 h-16 rounded-3xl bg-purple-100 border border-purple-200 text-purple-700 flex items-center justify-center mx-auto shadow-inner">
            <Building2 className="w-8 h-8" />
          </div>

          <div>
            <h2 className="text-xl font-black text-slate-900">Campus Pharmacy Partner Portal</h2>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              Restricted portal for verified dispensaries to review broadcast student prescriptions and accept fulfillment requests.
            </p>
          </div>

          <form onSubmit={handlePasscodeSubmit} className="space-y-4 text-left">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Pharmacy Partner Passcode
              </label>
              <div className="relative">
                <input
                  id="pharmacy-passcode-input"
                  type="password"
                  value={passcode}
                  onChange={(e) => {
                    setPasscode(e.target.value);
                    setPasscodeError(null);
                  }}
                  placeholder="Enter partner passcode..."
                  className="w-full pl-10 pr-4 py-2.5 rounded-2xl border border-slate-200 bg-white text-sm focus:ring-2 focus:ring-purple-500 outline-none transition"
                  autoFocus
                />
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              </div>
              <p className="text-[11px] text-slate-400 mt-1.5">
                * Demo Passcode: <span className="font-mono font-bold text-purple-600">PHARMA2026</span>
              </p>
            </div>

            {passcodeError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                <span>{passcodeError}</span>
              </div>
            )}

            <button
              id="unlock-pharmacy-portal-btn"
              type="submit"
              className="w-full py-3 rounded-2xl bg-purple-700 hover:bg-purple-800 text-white font-bold text-xs sm:text-sm shadow-lg shadow-purple-700/25 transition cursor-pointer"
            >
              Unlock Pharmacy Portal
            </button>
          </form>

          <div className="pt-2 border-t border-slate-100">
            <button
              onClick={onBackToStudentView}
              className="text-xs font-bold text-slate-500 hover:text-slate-800 flex items-center justify-center gap-1.5 mx-auto transition cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Return to Student Health Hub</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 2. Main Pharmacy Dashboard View
  return (
    <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8 space-y-6">
      {/* Top Bar with Navigation & Dispensary Selector */}
      <div className="bg-white/70 backdrop-blur-xl rounded-3xl p-5 sm:p-6 border border-white/70 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <button
            onClick={onBackToStudentView}
            className="p-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition cursor-pointer"
            title="Return to Student View"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-purple-100 text-purple-800 font-extrabold text-[10px] uppercase tracking-wider">
                Partner Operator
              </span>
              <span className="text-xs text-slate-400 font-mono">Simulated Session</span>
            </div>
            <h1 className="text-lg sm:text-xl font-black text-slate-900 mt-0.5">
              Dispensary Order Dispatch Desk
            </h1>
          </div>
        </div>

        {/* Selected Dispensary Dropdown */}
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <div className="flex items-center gap-2 bg-purple-50/90 border border-purple-200/80 px-3.5 py-2 rounded-2xl">
            <Building2 className="w-4 h-4 text-purple-700 shrink-0" />
            <div className="text-left">
              <span className="text-[10px] uppercase tracking-wider font-extrabold text-purple-900 block">
                Operating As:
              </span>
              <select
                id="portal-dispensary-select"
                value={selectedDispensaryId}
                onChange={(e) => setSelectedDispensaryId(e.target.value)}
                className="bg-transparent font-bold text-xs text-purple-950 outline-none cursor-pointer"
              >
                {dispensaries.map((disp) => (
                  <option key={disp.id || disp.name} value={disp.id || disp.name}>
                    {disp.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {!user ? (
            <button
              onClick={handleGoogleSignIn}
              className="px-4 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md transition flex items-center gap-1.5 cursor-pointer"
            >
              <LogIn className="w-3.5 h-3.5" />
              Sign in with Google to Accept
            </button>
          ) : (
            <div className="px-3 py-2 rounded-2xl bg-slate-100 text-slate-700 text-xs font-medium flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-slate-500" />
              <span>{user.displayName || user.email}</span>
            </div>
          )}
        </div>
      </div>

      {/* Notifications */}
      {feedbackMessage && (
        <div
          className={`p-4 rounded-2xl border text-xs font-medium flex items-start gap-2.5 ${
            feedbackMessage.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
              : 'bg-rose-50 border-rose-200 text-rose-900'
          }`}
        >
          {feedbackMessage.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
          )}
          <span className="leading-relaxed">{feedbackMessage.text}</span>
        </div>
      )}

      {/* Pending Orders Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-black text-slate-900 flex items-center gap-2">
              <Clock className="w-4 h-4 text-purple-600" />
              Live Broadcast Prescription Orders ({pendingOrders.length})
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Review broadcast orders from campus students. Accepting an order binds fulfillment to{' '}
              <strong>{selectedDispensary?.name}</strong>.
            </p>
          </div>

          <span className="text-xs font-mono font-bold text-slate-400 bg-white/60 px-3 py-1 rounded-xl border border-white/80">
            Auto-refresh active
          </span>
        </div>

        {loadingOrders ? (
          <div className="p-12 text-center bg-white/60 backdrop-blur-xl rounded-3xl border border-white/60">
            <div className="w-8 h-8 border-3 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
            <p className="text-xs font-bold text-slate-600">Checking for incoming student orders...</p>
          </div>
        ) : pendingOrders.length === 0 ? (
          <div className="p-12 text-center bg-white/60 backdrop-blur-xl rounded-3xl border border-white/60 space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-purple-50 border border-purple-100 text-purple-600 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-black text-slate-800">No Pending Orders</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              All broadcast student prescriptions have either been accepted or none have been submitted yet. New orders will appear here automatically.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {pendingOrders.map((order) => {
              const isUrgent = order.urgency === 'immediate';
              const isAccepting = acceptingOrderId === order.id;

              return (
                <div
                  key={order.id}
                  className={`bg-white/80 backdrop-blur-xl rounded-3xl border p-5 flex flex-col justify-between space-y-4 shadow-sm transition hover:shadow-md ${
                    isUrgent ? 'border-rose-300 ring-2 ring-rose-400/20' : 'border-white/80'
                  }`}
                >
                  <div className="space-y-3.5">
                    {/* Header */}
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                            order.urgency === 'immediate'
                              ? 'bg-rose-100 text-rose-800 border border-rose-200'
                              : order.urgency === 'today'
                              ? 'bg-purple-100 text-purple-800 border border-purple-200'
                              : 'bg-teal-100 text-teal-800 border border-teal-200'
                          }`}
                        >
                          {order.urgency === 'immediate' && '⚡ Immediate SOS'}
                          {order.urgency === 'today' && '📦 Today Standard'}
                          {order.urgency === 'flexible' && '🗓️ Flexible Refill'}
                        </span>
                        <h3 className="text-sm font-black text-slate-900 mt-1.5">{order.studentName}</h3>
                        <p className="text-[11px] text-slate-500 font-mono">
                          MICA ID: <strong>{order.micaInsuranceId}</strong>
                        </p>
                      </div>

                      <span className="text-[10px] font-medium text-slate-400">
                        {order.createdAt ? new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                      </span>
                    </div>

                    {/* Prescription Image Preview */}
                    <div className="space-y-1.5">
                      <span className="text-[11px] font-bold text-slate-700 block">Prescription Document:</span>
                      <div
                        onClick={() => setPreviewImage(order.prescriptionImageUrl)}
                        className="relative group cursor-pointer w-full h-36 rounded-2xl overflow-hidden border border-slate-200 bg-slate-950/5 flex items-center justify-center"
                      >
                        <img
                          src={order.prescriptionImageUrl}
                          alt="Student Prescription"
                          className="w-full h-full object-cover group-hover:scale-105 transition"
                          referrerPolicy="no-referrer"
                        />
                        <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 flex items-center justify-center gap-2 transition text-white text-xs font-bold">
                          <Eye className="w-4 h-4" />
                          <span>View Full Image</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Accept Order Action */}
                  <div className="pt-3 border-t border-slate-100 space-y-2">
                    <button
                      id={`accept-order-btn-${order.id}`}
                      disabled={isAccepting}
                      onClick={() => handleAcceptOrder(order)}
                      className="w-full py-2.5 px-4 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs shadow-md shadow-emerald-600/20 transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
                    >
                      {isAccepting ? (
                        <>
                          <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          <span>Accepting Order...</span>
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="w-4 h-4" />
                          <span>Accept Order for {selectedDispensary?.name}</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Fullscreen Image Modal */}
      {previewImage && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="relative max-w-4xl max-h-[90vh] bg-white rounded-3xl overflow-hidden shadow-2xl flex flex-col">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800">Prescription Verification View</span>
              <button
                onClick={() => setPreviewImage(null)}
                className="p-1.5 rounded-full hover:bg-slate-100 text-slate-500 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 overflow-auto max-h-[75vh] flex items-center justify-center bg-slate-900/5">
              <img
                src={previewImage}
                alt="Prescription Full Preview"
                className="max-w-full max-h-[70vh] object-contain rounded-xl"
                referrerPolicy="no-referrer"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
