import React, { useState, useEffect, useRef } from 'react';
import { 
  Pill, 
  Truck, 
  Clock, 
  MapPin, 
  Building, 
  Info, 
  Search, 
  ArrowRight, 
  FileText, 
  Phone, 
  Upload, 
  CheckCircle2, 
  AlertCircle, 
  Eye, 
  MessageCircle, 
  ExternalLink, 
  Send, 
  Trash2, 
  AlertOctagon, 
  Building2, 
  HelpCircle,
  Lock,
  ChevronRight,
  ShieldCheck
} from 'lucide-react';
import { 
  collection, 
  getDocs, 
  addDoc, 
  query, 
  where, 
  onSnapshot, 
  deleteDoc, 
  doc 
} from 'firebase/firestore';
import { db, storage, storageRef, uploadBytes, getDownloadURL, INITIAL_DISPENSARIES } from '../firebase';
import { useAuth } from '../context/AuthContext';
import type { Dispensary, MedicineOrder, Complaint, MedicineUrgency, HelpRequest } from '../types';

interface DispensaryDirectoryProps {
  initialTab?: 'browse' | 'place_order' | 'complaints';
  onSelectRequest?: (requestId: string) => void;
  onOpenDashboard?: () => void;
  onOpenPharmacyPortal?: () => void;
}

export const DispensaryDirectory: React.FC<DispensaryDirectoryProps> = ({
  initialTab = 'browse',
  onSelectRequest,
  onOpenDashboard,
  onOpenPharmacyPortal
}) => {
  const { user, profile } = useAuth();
  
  // 3 Internal Tabs: 'browse' | 'place_order' | 'complaints'
  const [activeTab, setActiveTab] = useState<'browse' | 'place_order' | 'complaints'>(initialTab);

  // Sync with initialTab if prop changes
  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);

  // Dispensaries Reference Data
  const [dispensaries, setDispensaries] = useState<Dispensary[]>([]);
  const [loadingDispensaries, setLoadingDispensaries] = useState(true);

  // Browse Tab Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [deliveryFilter, setDeliveryFilter] = useState<'all' | 'delivery' | 'pickup'>('all');
  const [activeOrderingRequests, setActiveOrderingRequests] = useState<HelpRequest[]>([]);

  // Place Order Tab State
  const [prescriptionImageUrl, setPrescriptionImageUrl] = useState<string>('');
  const [urgency, setUrgency] = useState<MedicineUrgency>('today');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [submittingOrder, setSubmittingOrder] = useState(false);
  const [orderSuccessMsg, setOrderSuccessMsg] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Student's Orders List
  const [myOrders, setMyOrders] = useState<MedicineOrder[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [cancellingOrderId, setCancellingOrderId] = useState<string | null>(null);

  // Complaints Tab State
  const [selectedComplaintDispensaryId, setSelectedComplaintDispensaryId] = useState<string>('');
  const [complaintDescription, setComplaintDescription] = useState('');
  const [submittingComplaint, setSubmittingComplaint] = useState(false);
  const [complaintSuccessMsg, setComplaintSuccessMsg] = useState<string | null>(null);
  const [myComplaints, setMyComplaints] = useState<Complaint[]>([]);
  const [loadingComplaints, setLoadingComplaints] = useState(true);

  // Fullscreen Prescription Preview Modal
  const [previewModalUrl, setPreviewModalUrl] = useState<string | null>(null);

  // 1. Fetch Dispensaries
  useEffect(() => {
    const fetchDispensaries = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, 'dispensaries'));
        if (!querySnapshot.empty) {
          const list: Dispensary[] = [];
          querySnapshot.forEach((d) => {
            list.push({
              id: d.id,
              ...(d.data() as Omit<Dispensary, 'id'>)
            });
          });
          setDispensaries(list);
          if (list.length > 0 && !selectedComplaintDispensaryId) {
            setSelectedComplaintDispensaryId(list[0].id || list[0].name);
          }
        } else {
          const fallback = INITIAL_DISPENSARIES.map((d, i) => ({ ...d, id: `disp_seed_${i}` }));
          setDispensaries(fallback);
          if (fallback.length > 0 && !selectedComplaintDispensaryId) {
            setSelectedComplaintDispensaryId(fallback[0].id || fallback[0].name);
          }
        }
      } catch (err) {
        console.error('Error loading dispensaries:', err);
        const fallback = INITIAL_DISPENSARIES.map((d, i) => ({ ...d, id: `disp_seed_${i}` }));
        setDispensaries(fallback);
        if (fallback.length > 0 && !selectedComplaintDispensaryId) {
          setSelectedComplaintDispensaryId(fallback[0].id || fallback[0].name);
        }
      } finally {
        setLoadingDispensaries(false);
      }
    };

    fetchDispensaries();
  }, []);

  // 2. Fetch Active Ordering Requests (for Browse banner)
  useEffect(() => {
    if (!user) return;
    const fetchActiveReqs = async () => {
      try {
        const reqsQuery = query(
          collection(db, 'helpRequests'),
          where('studentId', '==', user.uid),
          where('status', '==', 'ordering_medicine')
        );
        const reqsSnap = await getDocs(reqsQuery);
        const activeReqs: HelpRequest[] = [];
        reqsSnap.forEach((d) => {
          activeReqs.push({
            id: d.id,
            ...(d.data() as Omit<HelpRequest, 'id'>)
          });
        });
        setActiveOrderingRequests(activeReqs);
      } catch (reqErr) {
        console.error('Error loading active medicine requests:', reqErr);
      }
    };

    fetchActiveReqs();
  }, [user]);

  // 3. Real-time Listener for Student's Orders
  useEffect(() => {
    if (!user) {
      setMyOrders([]);
      setLoadingOrders(false);
      return;
    }

    setLoadingOrders(true);
    const q = query(
      collection(db, 'orders'),
      where('studentId', '==', user.uid)
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
        setMyOrders(ordersList);
        setLoadingOrders(false);
      },
      (err) => {
        console.error('Error listening to user orders:', err);
        setLoadingOrders(false);
      }
    );

    return () => unsubscribe();
  }, [user]);

  // 4. Real-time Listener for Student's Complaints
  useEffect(() => {
    if (!user) {
      setMyComplaints([]);
      setLoadingComplaints(false);
      return;
    }

    setLoadingComplaints(true);
    const q = query(
      collection(db, 'complaints'),
      where('studentId', '==', user.uid)
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const complaintsList: Complaint[] = [];
        snapshot.forEach((docSnap) => {
          complaintsList.push({
            id: docSnap.id,
            ...(docSnap.data() as Omit<Complaint, 'id'>)
          });
        });
        complaintsList.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
        setMyComplaints(complaintsList);
        setLoadingComplaints(false);
      },
      (err) => {
        console.error('Error listening to user complaints:', err);
        setLoadingComplaints(false);
      }
    );

    return () => unsubscribe();
  }, [user]);

  // Handle Prescription File Upload to Firebase Storage
  const handleFileUpload = async (file: File) => {
    if (!file) return;
    if (!user) {
      setUploadError('Please sign in to upload a prescription.');
      return;
    }
    if (!file.type.startsWith('image/')) {
      setUploadError('Please select a valid image file (PNG, JPG, JPEG, WEBP).');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setUploadError('File size exceeds 10MB limit.');
      return;
    }

    setIsUploading(true);
    setUploadError(null);

    try {
      const fileName = `order_${Date.now()}_${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
      const path = `prescriptions/${user.uid}/${fileName}`;
      const fileRef = storageRef(storage, path);

      await uploadBytes(fileRef, file);
      const downloadUrl = await getDownloadURL(fileRef);

      setPrescriptionImageUrl(downloadUrl);
    } catch (err: any) {
      console.error('Firebase storage upload failed, creating local fallback:', err);
      // Fallback to data URL for seamless offline/permission resiliency
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          setPrescriptionImageUrl(reader.result);
        }
      };
      reader.readAsDataURL(file);
    } finally {
      setIsUploading(false);
    }
  };

  // Submit Broadcast Order
  const handleCreateOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      alert('Please sign in to broadcast a prescription order.');
      return;
    }
    if (!prescriptionImageUrl) {
      setUploadError('Please upload your prescription image first.');
      return;
    }

    setSubmittingOrder(true);
    setOrderSuccessMsg(null);

    try {
      const studentName = profile?.name || user.displayName || 'MICA Student';
      const micaInsuranceId = profile?.micaInsuranceId || 'MICA-VERIFIED';

      const newOrderData: Omit<MedicineOrder, 'id'> = {
        studentId: user.uid,
        studentName,
        micaInsuranceId,
        prescriptionImageUrl,
        urgency,
        status: 'pending',
        createdAt: Date.now()
      };

      await addDoc(collection(db, 'orders'), newOrderData);

      setPrescriptionImageUrl('');
      setUrgency('today');
      setOrderSuccessMsg('Order broadcast successfully! All campus partner pharmacies have been notified.');
      setTimeout(() => setOrderSuccessMsg(null), 5000);
    } catch (err: any) {
      console.error('Error broadcasting order:', err);
      alert('Failed to submit order: ' + (err?.message || 'Unknown error'));
    } finally {
      setSubmittingOrder(false);
    }
  };

  // Cancel/Delete Pending Order (only allowed while pending)
  const handleCancelOrder = async (orderId?: string) => {
    if (!orderId) return;
    if (!confirm('Are you sure you want to cancel this prescription order?')) return;

    setCancellingOrderId(orderId);
    try {
      await deleteDoc(doc(db, 'orders', orderId));
    } catch (err: any) {
      console.error('Error cancelling order:', err);
      alert('Failed to cancel order: ' + (err?.message || 'Cannot cancel accepted orders'));
    } finally {
      setCancellingOrderId(null);
    }
  };

  // Submit Pharmacy Complaint
  const handleCreateComplaint = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      alert('Please sign in to submit a complaint.');
      return;
    }
    if (!complaintDescription.trim()) {
      alert('Please enter your complaint details.');
      return;
    }

    setSubmittingComplaint(true);
    setComplaintSuccessMsg(null);

    try {
      const targetDisp = dispensaries.find(
        (d) => (d.id || d.name) === selectedComplaintDispensaryId
      ) || dispensaries[0];

      const newComplaint: Omit<Complaint, 'id'> = {
        studentId: user.uid,
        dispensaryId: targetDisp ? (targetDisp.id || targetDisp.name) : 'unknown',
        dispensaryName: targetDisp ? targetDisp.name : 'Campus Partner Pharmacy',
        description: complaintDescription.trim(),
        createdAt: Date.now()
      };

      await addDoc(collection(db, 'complaints'), newComplaint);

      setComplaintDescription('');
      setComplaintSuccessMsg('Complaint submitted securely to campus health administration.');
      setTimeout(() => setComplaintSuccessMsg(null), 5000);
    } catch (err: any) {
      console.error('Error submitting complaint:', err);
      alert('Failed to log complaint: ' + (err?.message || 'Unknown error'));
    } finally {
      setSubmittingComplaint(false);
    }
  };

  // WhatsApp Link Builder (ONLY used after acceptance!)
  const getWhatsAppAcceptedLink = (order: MedicineOrder) => {
    const disp = dispensaries.find(
      (d) => (d.id || d.name) === order.acceptedByDispensaryId || d.name === order.acceptedByDispensaryName
    );

    const rawPhone = disp?.whatsappNumber || '+919876543210';
    const cleanPhone = rawPhone.replace(/[^0-9]/g, '');
    const studentName = order.studentName || profile?.name || 'MICA Student';
    const micaId = order.micaInsuranceId || profile?.micaInsuranceId || 'MICA-VERIFIED';
    const urgencyLabel = order.urgency.toUpperCase();

    const message = encodeURIComponent(
      `Hello ${order.acceptedByDispensaryName || 'Dispensary'},\n\nI am ${studentName} (MICA ID: ${micaId}). My prescription order (${urgencyLabel}) was accepted on MICA Health Hub. Please confirm order dispatch and delivery details.`
    );

    return `https://wa.me/${cleanPhone}?text=${message}`;
  };

  // Filtered Dispensaries for Browse Tab
  const filteredDispensaries = dispensaries.filter((disp) => {
    if (deliveryFilter === 'delivery' && !disp.deliversToCampus) return false;
    if (deliveryFilter === 'pickup' && disp.deliversToCampus) return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        disp.name.toLowerCase().includes(q) ||
        disp.fixedDeliveryTime.toLowerCase().includes(q) ||
        disp.location?.toLowerCase().includes(q) ||
        disp.notes?.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const primaryOrderingRequest = activeOrderingRequests.length > 0 ? activeOrderingRequests[0] : null;

  return (
    <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8 space-y-6">
      {/* Top Banner Notice */}
      {primaryOrderingRequest ? (
        <div className="bg-gradient-to-r from-purple-700 via-indigo-700 to-teal-700 text-white rounded-3xl p-5 sm:p-6 shadow-xl shadow-purple-950/15 border border-purple-300/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center shrink-0 border border-white/30">
              <FileText className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-md bg-white/20 text-[11px] font-bold tracking-wide uppercase">
                  Active Consultation Ready
                </span>
                <span className="text-xs text-purple-100 font-medium">
                  {primaryOrderingRequest.ailment}
                </span>
              </div>
              <h2 className="text-base sm:text-lg font-black mt-0.5">
                Ready to Order Medicines for Your Consultation?
              </h2>
              <p className="text-xs text-purple-100 mt-0.5 leading-relaxed">
                Broadcast your prescription directly to all campus dispensaries below.
              </p>
            </div>
          </div>

          <button
            id="go-to-place-order-banner-btn"
            onClick={() => setActiveTab('place_order')}
            className="w-full sm:w-auto px-5 py-3 rounded-2xl bg-white text-purple-900 hover:bg-purple-50 text-xs sm:text-sm font-extrabold shadow-lg transition flex items-center justify-center gap-2 shrink-0 cursor-pointer"
          >
            <span>Broadcast Prescription Order</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <div className="bg-amber-50/90 backdrop-blur-xl border border-amber-200/90 rounded-3xl p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-amber-950 shadow-sm">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-xl bg-amber-100 border border-amber-200 flex items-center justify-center shrink-0 mt-0.5 text-amber-800">
              <Info className="w-4 h-4" />
            </div>
            <div className="text-xs space-y-0.5">
              <p className="font-extrabold text-amber-900 text-sm">
                Campus Pharmacy Dispatch & Prescription Verification
              </p>
              <p className="text-amber-800 leading-relaxed">
                To order medicine, upload your prescription in the <strong>Place Order</strong> tab. Direct messaging before pharmacy acceptance is disabled to ensure verified prescription triage.
              </p>
            </div>
          </div>

          <button
            id="switch-to-place-order-top-btn"
            onClick={() => setActiveTab('place_order')}
            className="text-xs font-bold text-amber-900 bg-amber-200/70 hover:bg-amber-200 px-3.5 py-2 rounded-xl border border-amber-300 transition shrink-0 cursor-pointer flex items-center gap-1.5"
          >
            <span>Place Order Now</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Hero Header */}
      <div className="bg-gradient-to-r from-purple-950/90 via-indigo-950/90 to-slate-900/90 backdrop-blur-xl text-white rounded-3xl p-6 sm:p-8 shadow-xl shadow-purple-950/15 border border-white/20">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-3 py-1 rounded-full bg-purple-500/30 text-purple-200 font-extrabold text-[10px] tracking-wider uppercase border border-purple-400/30 backdrop-blur-sm">
                Campus Pharmacy Network
              </span>
              <span className="text-xs text-purple-200 font-medium">&bull; Hostels & Gate Delivery</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
              Dispensary Hub & Medicine Orders
            </h1>
            <p className="text-purple-100 text-xs sm:text-sm mt-1.5 max-w-2xl font-medium leading-relaxed">
              Browse verified campus pharmacies, broadcast prescription orders to all partner dispensaries, and manage pharmacy feedback.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="p-3 bg-white/10 rounded-2xl border border-white/20 backdrop-blur-md flex items-center gap-3">
              <Pill className="w-8 h-8 text-purple-300 shrink-0" />
              <div className="text-left">
                <span className="text-lg font-black block leading-none">{dispensaries.length}</span>
                <span className="text-[11px] text-purple-200 font-medium">Partner Pharmacies</span>
              </div>
            </div>
          </div>
        </div>

        {/* 3 Internal Navigation Tabs */}
        <div className="mt-6 pt-5 border-t border-white/15 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2 p-1 bg-white/10 backdrop-blur-md rounded-2xl border border-white/20">
            <button
              id="dispensary-tab-browse"
              type="button"
              onClick={() => setActiveTab('browse')}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition flex items-center gap-2 cursor-pointer ${
                activeTab === 'browse'
                  ? 'bg-white text-purple-950 shadow-md'
                  : 'text-purple-200 hover:text-white'
              }`}
            >
              <Building className="w-4 h-4" />
              <span>Browse Pharmacies</span>
            </button>

            <button
              id="dispensary-tab-place-order"
              type="button"
              onClick={() => setActiveTab('place_order')}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition flex items-center gap-2 cursor-pointer ${
                activeTab === 'place_order'
                  ? 'bg-white text-purple-950 shadow-md'
                  : 'text-purple-200 hover:text-white'
              }`}
            >
              <Upload className="w-4 h-4" />
              <span>Place Order (Broadcast)</span>
              {myOrders.some((o) => o.status === 'pending') && (
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse"></span>
              )}
            </button>

            <button
              id="dispensary-tab-complaints"
              type="button"
              onClick={() => setActiveTab('complaints')}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition flex items-center gap-2 cursor-pointer ${
                activeTab === 'complaints'
                  ? 'bg-white text-purple-950 shadow-md'
                  : 'text-purple-200 hover:text-white'
              }`}
            >
              <AlertOctagon className="w-4 h-4" />
              <span>Pharmacy Complaints</span>
            </button>
          </div>

          {/* Unobtrusive Pharmacy Partner Portal Link */}
          {onOpenPharmacyPortal && (
            <button
              id="open-pharmacy-portal-link"
              type="button"
              onClick={onOpenPharmacyPortal}
              className="text-xs text-purple-200/80 hover:text-white underline underline-offset-4 flex items-center gap-1.5 transition font-medium cursor-pointer"
            >
              <Lock className="w-3.5 h-3.5" />
              <span>Pharmacy partner login</span>
            </button>
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: BROWSE DISPENSARIES                                                */}
      {/* ========================================================================= */}
      {activeTab === 'browse' && (
        <div className="space-y-6">
          {/* Filter and Search Controls */}
          <div className="bg-white/60 backdrop-blur-xl rounded-3xl border border-white/60 p-4 sm:p-5 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 shadow-sm">
            {/* Search */}
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                id="dispensary-search-input"
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search pharmacy name, location, or notes..."
                className="w-full pl-10 pr-4 py-2.5 rounded-2xl border border-white/80 bg-white/70 backdrop-blur-sm text-xs sm:text-sm focus:ring-2 focus:ring-purple-500 focus:bg-white outline-none shadow-xs transition text-slate-800 placeholder-slate-400"
              />
            </div>

            {/* Delivery vs Pickup Filter Toggle */}
            <div className="flex items-center gap-1.5 p-1 bg-slate-100/80 backdrop-blur-sm rounded-2xl border border-slate-200/80 shrink-0">
              <button
                type="button"
                id="filter-dispensary-all"
                onClick={() => setDeliveryFilter('all')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                  deliveryFilter === 'all'
                    ? 'bg-white text-purple-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                All ({dispensaries.length})
              </button>
              <button
                type="button"
                id="filter-dispensary-delivery"
                onClick={() => setDeliveryFilter('delivery')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                  deliveryFilter === 'delivery'
                    ? 'bg-purple-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Truck className="w-3.5 h-3.5" />
                Campus Delivery
              </button>
              <button
                type="button"
                id="filter-dispensary-pickup"
                onClick={() => setDeliveryFilter('pickup')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                  deliveryFilter === 'pickup'
                    ? 'bg-slate-800 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Building className="w-3.5 h-3.5" />
                Pickup Only
              </button>
            </div>
          </div>

          {/* Dispensaries Grid */}
          {loadingDispensaries ? (
            <div className="py-16 text-center text-slate-500">
              <div className="w-8 h-8 border-3 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
              <p className="text-xs font-medium">Loading campus pharmacy network...</p>
            </div>
          ) : filteredDispensaries.length === 0 ? (
            <div className="py-12 text-center bg-white/50 backdrop-blur-xl rounded-3xl border border-white/70 p-8">
              <Pill className="w-10 h-10 text-slate-300 mx-auto mb-3" />
              <h3 className="text-sm font-bold text-slate-700">No pharmacies match your filter</h3>
              <p className="text-xs text-slate-500 mt-1">Try changing your search keywords or switching delivery filters.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {filteredDispensaries.map((disp) => (
                <div
                  key={disp.id || disp.name}
                  className="bg-white/60 backdrop-blur-xl rounded-3xl border border-white/60 p-6 flex flex-col justify-between space-y-4 hover:border-purple-200 transition shadow-sm hover:shadow-md"
                >
                  <div className="space-y-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-2xl bg-purple-50/90 border border-purple-200/80 flex items-center justify-center shrink-0 text-purple-700">
                          <Building className="w-6 h-6" />
                        </div>
                        <div>
                          <h3 className="text-base font-extrabold text-slate-900">{disp.name}</h3>
                          <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium mt-0.5">
                            <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span>{disp.location || 'Near Campus'}</span>
                          </div>
                        </div>
                      </div>

                      {disp.deliversToCampus ? (
                        <span className="px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-bold flex items-center gap-1 shrink-0">
                          <Truck className="w-3.5 h-3.5 text-emerald-600" />
                          Gate Delivery
                        </span>
                      ) : (
                        <span className="px-3 py-1 rounded-full bg-slate-100 text-slate-700 text-xs font-bold shrink-0">
                          Pickup Only
                        </span>
                      )}
                    </div>

                    <div className="p-4 bg-white/50 backdrop-blur-sm rounded-2xl border border-white/70 space-y-2.5 text-xs text-slate-700 shadow-xs">
                      <div className="flex items-start gap-2">
                        <Clock className="w-4 h-4 text-purple-600 shrink-0 mt-0.5" />
                        <div>
                          <span className="font-bold text-slate-800 block">Daily Delivery Slots:</span>
                          <span className="text-slate-600 font-medium">{disp.fixedDeliveryTime}</span>
                        </div>
                      </div>

                      {disp.notes && (
                        <div className="flex items-start gap-2 pt-2 border-t border-white/60">
                          <Info className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                          <div>
                            <span className="font-bold text-slate-800 block text-[11px]">Pharmacy Notes:</span>
                            <span className="text-[11px] text-slate-600 leading-relaxed">{disp.notes}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Browse-Only Footer */}
                  <div className="mt-5 pt-3.5 border-t border-white/60 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-1.5 text-xs text-slate-600">
                      <Phone className="w-3.5 h-3.5 text-slate-400" />
                      <span className="font-mono font-medium text-[11px]">{disp.whatsappNumber}</span>
                    </div>

                    <button
                      onClick={() => setActiveTab('place_order')}
                      className="text-xs font-bold text-purple-700 hover:text-purple-900 bg-purple-50 hover:bg-purple-100 px-3 py-1.5 rounded-xl border border-purple-200 transition flex items-center gap-1 cursor-pointer"
                    >
                      <span>Order via Broadcast</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: PLACE ORDER (PRESCRIPTION BROADCAST FLOW)                          */}
      {/* ========================================================================= */}
      {activeTab === 'place_order' && (
        <div className="space-y-8">
          {/* Order Placement Form Card */}
          <div className="bg-white/70 backdrop-blur-xl rounded-3xl border border-white/70 p-6 sm:p-8 shadow-xl shadow-purple-900/5 space-y-6">
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-100 text-purple-800 text-xs font-bold uppercase tracking-wider mb-2 border border-purple-200">
                <Upload className="w-3.5 h-3.5 text-purple-600" />
                Network Prescription Broadcast
              </div>
              <h2 className="text-xl font-black text-slate-900">
                Broadcast Prescription Order to Campus Pharmacies
              </h2>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Upload your doctor's prescription image and choose an urgency level. Your order will be broadcast to all campus partner dispensaries. Once a pharmacy accepts, you can chat directly on WhatsApp.
              </p>
            </div>

            {orderSuccessMsg && (
              <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-bold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{orderSuccessMsg}</span>
              </div>
            )}

            <form onSubmit={handleCreateOrder} className="space-y-6">
              {/* Hidden File Input */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleFileUpload(file);
                }}
              />

              {/* 1. Prescription Upload Zone */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  1. Doctor's Prescription Image *
                </label>

                {!prescriptionImageUrl ? (
                  <div className="bg-purple-50/40 rounded-2xl border-2 border-dashed border-purple-200 p-6 sm:p-8 text-center space-y-3">
                    <div className="w-14 h-14 rounded-2xl bg-purple-100 text-purple-600 flex items-center justify-center mx-auto shadow-inner">
                      {isUploading ? (
                        <div className="w-7 h-7 border-3 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
                      ) : (
                        <Upload className="w-7 h-7" />
                      )}
                    </div>

                    <div>
                      <button
                        type="button"
                        id="upload-prescription-btn"
                        disabled={isUploading}
                        onClick={() => fileInputRef.current?.click()}
                        className="px-5 py-2.5 rounded-2xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold shadow-md shadow-purple-600/20 transition cursor-pointer"
                      >
                        {isUploading ? 'Uploading to Firebase Storage...' : 'Browse & Upload Prescription Image'}
                      </button>
                      <p className="text-[11px] text-slate-500 mt-2">
                        Supported formats: JPG, PNG, WEBP (Max 10MB)
                      </p>
                    </div>

                    {uploadError && (
                      <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 max-w-sm mx-auto flex items-center justify-center gap-1.5">
                        <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                        <span>{uploadError}</span>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="p-4 bg-purple-50/60 rounded-2xl border border-purple-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3.5">
                      <div
                        onClick={() => setPreviewModalUrl(prescriptionImageUrl)}
                        className="relative group cursor-pointer w-16 h-16 rounded-xl overflow-hidden border border-purple-200 bg-white shadow-xs shrink-0"
                      >
                        <img
                          src={prescriptionImageUrl}
                          alt="Prescription"
                          className="w-full h-full object-cover group-hover:scale-105 transition"
                          referrerPolicy="no-referrer"
                        />
                        <div className="absolute inset-0 bg-slate-950/30 opacity-0 group-hover:opacity-100 flex items-center justify-center transition">
                          <Eye className="w-4 h-4 text-white" />
                        </div>
                      </div>

                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-black text-purple-950">Prescription Attached</span>
                          <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">Ready</span>
                        </div>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          Verified prescription document ready for broadcast.
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setPreviewModalUrl(prescriptionImageUrl)}
                        className="px-3.5 py-1.5 rounded-xl bg-white border border-purple-200 text-purple-900 text-xs font-bold hover:bg-purple-50 shadow-xs transition flex items-center gap-1.5 cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5 text-purple-600" />
                        <span>View</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="px-3.5 py-1.5 rounded-xl bg-purple-100 border border-purple-200 text-purple-900 text-xs font-bold hover:bg-purple-200 shadow-xs transition flex items-center gap-1.5 cursor-pointer"
                      >
                        <span>Change</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* 2. Urgency Selector */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  2. Delivery Urgency Level *
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {/* Immediate */}
                  <button
                    type="button"
                    id="urgency-immediate-btn"
                    onClick={() => setUrgency('immediate')}
                    className={`p-4 rounded-2xl border text-left transition cursor-pointer flex flex-col justify-between ${
                      urgency === 'immediate'
                        ? 'border-rose-500 bg-rose-50 ring-2 ring-rose-500/25 text-rose-900 shadow-sm font-bold'
                        : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-medium'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-black uppercase tracking-wider">Immediate</span>
                      <span className="text-sm">⚡</span>
                    </div>
                    <p className="text-[11px] text-slate-500 leading-tight">
                      SOS urgent dispatch within 1-2 hours
                    </p>
                  </button>

                  {/* Today */}
                  <button
                    type="button"
                    id="urgency-today-btn"
                    onClick={() => setUrgency('today')}
                    className={`p-4 rounded-2xl border text-left transition cursor-pointer flex flex-col justify-between ${
                      urgency === 'today'
                        ? 'border-purple-500 bg-purple-50 ring-2 ring-purple-500/25 text-purple-900 shadow-sm font-bold'
                        : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-medium'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-black uppercase tracking-wider">Today</span>
                      <span className="text-sm">📦</span>
                    </div>
                    <p className="text-[11px] text-slate-500 leading-tight">
                      Standard slots (12:30 PM & 6:30 PM)
                    </p>
                  </button>

                  {/* Flexible */}
                  <button
                    type="button"
                    id="urgency-flexible-btn"
                    onClick={() => setUrgency('flexible')}
                    className={`p-4 rounded-2xl border text-left transition cursor-pointer flex flex-col justify-between ${
                      urgency === 'flexible'
                        ? 'border-teal-500 bg-teal-50 ring-2 ring-teal-500/25 text-teal-900 shadow-sm font-bold'
                        : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-medium'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-black uppercase tracking-wider">Flexible</span>
                      <span className="text-sm">🗓️</span>
                    </div>
                    <p className="text-[11px] text-slate-500 leading-tight">
                      Refills or scheduled next-day delivery
                    </p>
                  </button>
                </div>
              </div>

              {/* 3. Student Manifest Summary & Submit */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="text-xs text-slate-600">
                  <span>Ordering Student: </span>
                  <strong className="text-slate-900">{profile?.name || user?.displayName || 'MICA Student'}</strong>
                  <span className="mx-2">&bull;</span>
                  <span>MICA Insurance ID: </span>
                  <strong className="font-mono text-purple-900">{profile?.micaInsuranceId || 'MICA-VERIFIED'}</strong>
                </div>

                <button
                  type="submit"
                  id="submit-broadcast-order-btn"
                  disabled={submittingOrder || !prescriptionImageUrl}
                  className="px-6 py-3 rounded-2xl bg-purple-700 hover:bg-purple-800 text-white font-extrabold text-xs sm:text-sm shadow-lg shadow-purple-700/25 transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {submittingOrder ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Broadcasting Order...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      <span>Broadcast Order to Pharmacies</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* Past & Current Orders Section */}
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                <Clock className="w-5 h-5 text-purple-600" />
                Your Medicine Orders ({myOrders.length})
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Track real-time acceptance of your broadcast prescription orders by campus dispensaries.
              </p>
            </div>

            {loadingOrders ? (
              <div className="p-8 text-center bg-white/60 rounded-3xl border border-white/60">
                <div className="w-6 h-6 border-2 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                <p className="text-xs text-slate-500">Loading your orders...</p>
              </div>
            ) : myOrders.length === 0 ? (
              <div className="p-8 text-center bg-white/60 rounded-3xl border border-white/60 space-y-2">
                <Pill className="w-8 h-8 text-slate-300 mx-auto" />
                <h4 className="text-xs font-bold text-slate-700">No Orders Yet</h4>
                <p className="text-[11px] text-slate-500">
                  Broadcast your first prescription above to initiate pharmacy fulfillment.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {myOrders.map((order) => {
                  const isAccepted = order.status === 'accepted';
                  const isPending = order.status === 'pending';

                  return (
                    <div
                      key={order.id}
                      className={`bg-white/80 backdrop-blur-xl rounded-3xl border p-5 sm:p-6 shadow-sm transition ${
                        isAccepted
                          ? 'border-emerald-300 ring-2 ring-emerald-500/20'
                          : 'border-amber-200 ring-2 ring-amber-500/10'
                      }`}
                    >
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        {/* Order Details */}
                        <div className="flex items-start gap-4">
                          {/* Prescription Thumbnail */}
                          <div
                            onClick={() => setPreviewModalUrl(order.prescriptionImageUrl)}
                            className="relative group cursor-pointer w-16 h-16 rounded-2xl overflow-hidden border border-slate-200 bg-white shadow-xs shrink-0"
                          >
                            <img
                              src={order.prescriptionImageUrl}
                              alt="Prescription"
                              className="w-full h-full object-cover group-hover:scale-105 transition"
                              referrerPolicy="no-referrer"
                            />
                            <div className="absolute inset-0 bg-slate-950/30 opacity-0 group-hover:opacity-100 flex items-center justify-center transition">
                              <Eye className="w-4 h-4 text-white" />
                            </div>
                          </div>

                          <div className="space-y-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              {isPending ? (
                                <span className="px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-200 text-[10px] font-black uppercase tracking-wider flex items-center gap-1">
                                  <Clock className="w-3 h-3 text-amber-600 animate-spin" />
                                  Pending Pharmacy Acceptance
                                </span>
                              ) : (
                                <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-900 border border-emerald-200 text-[10px] font-black uppercase tracking-wider flex items-center gap-1">
                                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                  Accepted by {order.acceptedByDispensaryName}
                                </span>
                              )}

                              <span
                                className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                                  order.urgency === 'immediate'
                                    ? 'bg-rose-100 text-rose-800'
                                    : order.urgency === 'today'
                                    ? 'bg-purple-100 text-purple-800'
                                    : 'bg-teal-100 text-teal-800'
                                }`}
                              >
                                {order.urgency}
                              </span>
                            </div>

                            <p className="text-xs text-slate-600 font-medium">
                              Created:{' '}
                              <span className="text-slate-800">
                                {order.createdAt ? new Date(order.createdAt).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' }) : 'Recently'}
                              </span>
                              {order.acceptedAt && (
                                <>
                                  <span className="mx-1.5">&bull;</span>
                                  Accepted:{' '}
                                  <span className="text-emerald-800 font-bold">
                                    {new Date(order.acceptedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                  </span>
                                </>
                              )}
                            </p>

                            <p className="text-[11px] text-slate-500">
                              {isPending
                                ? 'Broadcast is active across all campus partner dispensaries. You will be able to message via WhatsApp once accepted.'
                                : `Order bound to ${order.acceptedByDispensaryName}. Use WhatsApp below to coordinate delivery time and payment.`}
                            </p>
                          </div>
                        </div>

                        {/* Order Actions */}
                        <div className="flex items-center gap-2.5 self-end md:self-center shrink-0">
                          {isPending && (
                            <button
                              id={`cancel-order-btn-${order.id}`}
                              disabled={cancellingOrderId === order.id}
                              onClick={() => handleCancelOrder(order.id)}
                              className="px-3.5 py-2 rounded-2xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              <span>{cancellingOrderId === order.id ? 'Cancelling...' : 'Cancel Order'}</span>
                            </button>
                          )}

                          {/* WhatsApp Button: Strictly ONLY visible after acceptance */}
                          {isAccepted && (
                            <a
                              id={`whatsapp-chat-btn-${order.id}`}
                              href={getWhatsAppAcceptedLink(order)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="px-5 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black shadow-lg shadow-emerald-600/25 transition flex items-center gap-2 cursor-pointer"
                            >
                              <MessageCircle className="w-4 h-4" />
                              <span>Chat on WhatsApp</span>
                              <ExternalLink className="w-3.5 h-3.5 opacity-80" />
                            </a>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: PHARMACY COMPLAINTS                                                */}
      {/* ========================================================================= */}
      {activeTab === 'complaints' && (
        <div className="space-y-8">
          {/* Complaint Submission Form Card */}
          <div className="bg-white/70 backdrop-blur-xl rounded-3xl border border-white/70 p-6 sm:p-8 shadow-xl shadow-rose-950/5 space-y-6">
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-100 text-rose-800 text-xs font-bold uppercase tracking-wider mb-2 border border-rose-200">
                <AlertOctagon className="w-3.5 h-3.5 text-rose-600" />
                Quality & Delivery Grievance Desk
              </div>
              <h2 className="text-xl font-black text-slate-900">
                Report a Pharmacy Issue or Delivery Delay
              </h2>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Submit complaints regarding overcharging, delayed gate delivery, missing medicines, or unprofessional communication. Reports are reviewed by campus health administrators.
              </p>
            </div>

            {complaintSuccessMsg && (
              <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-bold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{complaintSuccessMsg}</span>
              </div>
            )}

            <form onSubmit={handleCreateComplaint} className="space-y-5">
              {/* Dispensary Dropdown */}
              <div>
                <label 
                  htmlFor="complaint-dispensary-select" 
                  className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5"
                >
                  Select Partner Pharmacy *
                </label>
                <div className="relative">
                  <select
                    id="complaint-dispensary-select"
                    required
                    value={selectedComplaintDispensaryId}
                    onChange={(e) => setSelectedComplaintDispensaryId(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-2xl border border-slate-200 bg-white text-sm outline-none pl-10 focus:ring-2 focus:ring-rose-500 transition text-slate-800 font-medium cursor-pointer"
                  >
                    {dispensaries.map((disp) => (
                      <option key={disp.id || disp.name} value={disp.id || disp.name}>
                        {disp.name} ({disp.location || 'Campus Area'})
                      </option>
                    ))}
                  </select>
                  <Building2 className="w-4 h-4 text-rose-600 absolute left-3.5 top-3 pointer-events-none" />
                </div>
              </div>

              {/* Description Field */}
              <div>
                <label 
                  htmlFor="complaint-desc-input" 
                  className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5"
                >
                  Complaint Description *
                </label>
                <textarea
                  id="complaint-desc-input"
                  required
                  rows={4}
                  value={complaintDescription}
                  onChange={(e) => setComplaintDescription(e.target.value)}
                  placeholder="Provide specific details: order date, medicine names, delays experienced, or issues encountered..."
                  className="w-full px-4 py-3 rounded-2xl border border-slate-200 bg-white text-sm outline-none focus:ring-2 focus:ring-rose-500 transition text-slate-800 placeholder-slate-400"
                />
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  id="submit-complaint-btn"
                  disabled={submittingComplaint || !complaintDescription.trim()}
                  className="px-6 py-3 rounded-2xl bg-rose-700 hover:bg-rose-800 text-white font-extrabold text-xs sm:text-sm shadow-lg shadow-rose-700/25 transition flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {submittingComplaint ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Submitting Complaint...</span>
                    </>
                  ) : (
                    <>
                      <AlertOctagon className="w-4 h-4" />
                      <span>Submit Grievance to Administration</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* Past Complaints List */}
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                <FileText className="w-5 h-5 text-rose-600" />
                Your Logged Complaints ({myComplaints.length})
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Confidential log of your past submissions.
              </p>
            </div>

            {loadingComplaints ? (
              <div className="p-8 text-center bg-white/60 rounded-3xl border border-white/60">
                <div className="w-6 h-6 border-2 border-rose-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                <p className="text-xs text-slate-500">Loading your complaint records...</p>
              </div>
            ) : myComplaints.length === 0 ? (
              <div className="p-8 text-center bg-white/60 rounded-3xl border border-white/60 space-y-1">
                <ShieldCheck className="w-7 h-7 text-emerald-500 mx-auto" />
                <h4 className="text-xs font-bold text-slate-700">No Complaints Recorded</h4>
                <p className="text-[11px] text-slate-500">You haven't filed any pharmacy complaints.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {myComplaints.map((comp) => (
                  <div
                    key={comp.id}
                    className="bg-white/80 backdrop-blur-xl rounded-3xl border border-slate-200 p-5 shadow-xs space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Building2 className="w-4 h-4 text-rose-600" />
                        <h4 className="text-sm font-black text-slate-900">{comp.dispensaryName}</h4>
                      </div>
                      <span className="text-[11px] text-slate-400 font-medium">
                        {comp.createdAt ? new Date(comp.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' }) : ''}
                      </span>
                    </div>

                    <p className="text-xs text-slate-700 leading-relaxed bg-slate-50 p-3.5 rounded-2xl border border-slate-100">
                      {comp.description}
                    </p>

                    <div className="pt-1 flex items-center justify-between text-[10px] text-slate-500">
                      <span className="font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                        Status: Logged with Administration
                      </span>
                      <span>Case Reference: #{comp.id?.slice(0, 8)}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Fullscreen Image Preview Modal */}
      {previewModalUrl && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="relative max-w-4xl max-h-[90vh] bg-white rounded-3xl overflow-hidden shadow-2xl flex flex-col">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800">Prescription Verification View</span>
              <button
                onClick={() => setPreviewModalUrl(null)}
                className="p-1.5 rounded-full hover:bg-slate-100 text-slate-500 cursor-pointer"
              >
                <Eye className="w-4 h-4" />
              </button>
            </div>
            <div className="p-4 overflow-auto max-h-[75vh] flex items-center justify-center bg-slate-900/5">
              <img
                src={previewModalUrl}
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
