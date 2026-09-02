import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LoginPage } from './components/LoginPage';
import { ProfileSetup } from './components/ProfileSetup';
import { Navbar } from './components/Navbar';
import { Dashboard } from './components/Dashboard';
import { NewRequestModal } from './components/NewRequestModal';
import { RequestDetail } from './components/RequestDetail';
import { DoctorDirectory } from './components/DoctorDirectory';
import { DispensaryDirectory } from './components/DispensaryDirectory';
import { PharmacyPortal } from './components/PharmacyPortal';
import { EmergencyPage } from './components/EmergencyPage';
import type { HelpRequest, ConsultType } from './types';
import { doc, getDoc } from 'firebase/firestore';
import { db } from './firebase';

function MainApp() {
  const { user, profile, loading, profileLoading } = useAuth();
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [dispensaryTab, setDispensaryTab] = useState<'browse' | 'place_order' | 'complaints'>('browse');
  const [selectedRequest, setSelectedRequest] = useState<HelpRequest | null>(null);
  const [isNewRequestModalOpen, setIsNewRequestModalOpen] = useState(false);
  const [editingRequest, setEditingRequest] = useState<HelpRequest | null>(null);
  const [prefilledDoctorName, setPrefilledDoctorName] = useState<string>('');
  const [prefilledDoctorId, setPrefilledDoctorId] = useState<string>('');
  const [prefilledConsultType, setPrefilledConsultType] = useState<ConsultType>('campus');

  if (loading || (user && profileLoading && !profile)) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center p-8 rounded-3xl bg-white/60 backdrop-blur-xl border border-white/60 shadow-xl shadow-teal-900/5 max-w-sm w-full">
          <div className="w-12 h-12 border-3 border-teal-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-base font-bold text-slate-800 tracking-tight">MiHelp<span className="text-teal-600">+</span></p>
          <p className="text-xs font-semibold text-slate-500 mt-1">Connecting to Campus Health...</p>
        </div>
      </div>
    );
  }

  // Not logged in -> Show Google Sign In Login Page
  if (!user) {
    return <LoginPage />;
  }

  // Profile setup check: If profile doesn't exist yet or collegeEmail is missing/invalid, keep on setup
  const isProfileValid = profile && profile.collegeEmail && /@micamail\.in$/i.test(profile.collegeEmail);
  if (!isProfileValid) {
    return <ProfileSetup isEditing={!!profile} onComplete={() => setActiveTab('dashboard')} />;
  }

  const handleSelectRequest = (request: HelpRequest) => {
    setSelectedRequest(request);
  };

  const handleEditPendingRequest = (request: HelpRequest) => {
    setEditingRequest(request);
    setPrefilledDoctorName(request.assignedDoctorName || '');
    setPrefilledDoctorId(request.assignedDoctorId || '');
    setPrefilledConsultType(request.consultType || 'campus');
    setIsNewRequestModalOpen(true);
  };

  const handleRequestCreatedOrUpdated = async (requestId: string) => {
    setIsNewRequestModalOpen(false);
    setEditingRequest(null);
    setPrefilledDoctorName('');
    setPrefilledDoctorId('');
    setPrefilledConsultType('campus');
    try {
      const docSnap = await getDoc(doc(db, 'helpRequests', requestId));
      if (docSnap.exists()) {
        setSelectedRequest({
          id: docSnap.id,
          ...(docSnap.data() as Omit<HelpRequest, 'id'>)
        });
      } else {
        setActiveTab('dashboard');
      }
    } catch (err) {
      console.error('Error fetching newly created request:', err);
      setActiveTab('dashboard');
    }
  };

  const handleDoctorConsult = (doctorName: string, category: 'campus' | 'community', doctorId?: string) => {
    setPrefilledDoctorName(doctorName);
    setPrefilledDoctorId(doctorId || '');
    setPrefilledConsultType(category);
    setEditingRequest(null);
    setIsNewRequestModalOpen(true);
  };

  const handleEmergencyCreated = async (requestId: string) => {
    try {
      const docSnap = await getDoc(doc(db, 'helpRequests', requestId));
      if (docSnap.exists()) {
        setSelectedRequest({
          id: docSnap.id,
          ...(docSnap.data() as Omit<HelpRequest, 'id'>)
        });
      }
    } catch (err) {
      console.error('Error loading created emergency request:', err);
    }
  };

  return (
    <div className="min-h-screen flex flex-col selection:bg-teal-500 selection:text-white">
      {/* Navigation with Logout button */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={(tab) => {
          setSelectedRequest(null);
          setActiveTab(tab);
        }}
        onOpenEmergency={() => {
          setSelectedRequest(null);
          setActiveTab('emergency');
        }}
        onOpenNewRequest={() => {
          setEditingRequest(null);
          setPrefilledDoctorName('');
          setIsNewRequestModalOpen(true);
        }}
      />

      {/* Main Content Area */}
      <main className="flex-1 pb-12">
        {selectedRequest ? (
          <RequestDetail
            request={selectedRequest}
            onBack={() => setSelectedRequest(null)}
            onEdit={(req) => {
              setEditingRequest(req);
              setIsNewRequestModalOpen(true);
            }}
            onDeleteSuccess={() => setSelectedRequest(null)}
            onOpenDispensaries={(tab) => {
              setSelectedRequest(null);
              setDispensaryTab(tab || 'place_order');
              setActiveTab('dispensaries');
            }}
          />
        ) : (
          <>
            {activeTab === 'dashboard' && (
              <Dashboard
                onNewRequest={() => {
                  setEditingRequest(null);
                  setPrefilledDoctorName('');
                  setPrefilledDoctorId('');
                  setPrefilledConsultType('campus');
                  setIsNewRequestModalOpen(true);
                }}
                onOpenEmergency={() => setActiveTab('emergency')}
                onSelectRequest={handleSelectRequest}
                onEditPendingRequest={handleEditPendingRequest}
                onOpenDoctors={() => setActiveTab('doctors')}
                onOpenDispensaries={() => {
                  setDispensaryTab('browse');
                  setActiveTab('dispensaries');
                }}
                onOpenProfile={() => setActiveTab('profile')}
              />
            )}

            {activeTab === 'new-request' && (
              <div className="py-6 px-4">
                <ProfileSetup isEditing={false} />
              </div>
            )}

            {activeTab === 'doctors' && (
              <DoctorDirectory onRequestDoctorConsult={handleDoctorConsult} />
            )}

            {activeTab === 'dispensaries' && (
              <DispensaryDirectory
                initialTab={dispensaryTab}
                onSelectRequest={handleSelectRequest}
                onOpenDashboard={() => setActiveTab('dashboard')}
                onOpenPharmacyPortal={() => setActiveTab('pharmacy_portal')}
              />
            )}

            {activeTab === 'pharmacy_portal' && (
              <PharmacyPortal
                onBack={() => setActiveTab('dispensaries')}
              />
            )}

            {activeTab === 'emergency' && (
              <EmergencyPage onEmergencyCreated={handleEmergencyCreated} />
            )}

            {activeTab === 'profile' && (
              <ProfileSetup
                isEditing={true}
                onComplete={() => setActiveTab('dashboard')}
              />
            )}
          </>
        )}
      </main>

      {/* New / Edit Help Request Modal */}
      {isNewRequestModalOpen && (
        <NewRequestModal
          initialRequest={editingRequest}
          selectedDoctorName={prefilledDoctorName}
          selectedDoctorId={prefilledDoctorId}
          selectedConsultType={prefilledConsultType}
          onClose={() => {
            setIsNewRequestModalOpen(false);
            setEditingRequest(null);
            setPrefilledDoctorName('');
            setPrefilledDoctorId('');
            setPrefilledConsultType('campus');
          }}
          onSuccess={handleRequestCreatedOrUpdated}
        />
      )}
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}
