import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signOut,
  signInAnonymously
} from 'firebase/auth';
import { 
  getFirestore, 
  collection, 
  getDocs, 
  setDoc, 
  doc, 
  writeBatch 
} from 'firebase/firestore';
import { getStorage, ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';
import firebaseConfig from '../firebase-applet-config.json';
import type { Doctor, Dispensary } from './types';

// Initialize Firebase App
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Initialize Auth
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: 'select_account'
});

// Initialize Firestore with specific database ID if provided
export const db = firebaseConfig.firestoreDatabaseId && firebaseConfig.firestoreDatabaseId !== '(default)'
  ? getFirestore(app, firebaseConfig.firestoreDatabaseId)
  : getFirestore(app);

// Initialize Firebase Storage
export const storage = getStorage(app);
export { storageRef, uploadBytes, getDownloadURL };

// Seed Doctors Reference Data
export const INITIAL_DOCTORS: Omit<Doctor, 'id'>[] = [
  {
    name: 'Dr. Rajesh Verma',
    category: 'campus',
    type: 'Campus Resident Medical Officer',
    specialty: 'General Medicine & Acute Care',
    availability: 'Mon - Sat: 8:30 AM - 4:30 PM',
    location: 'Hostel Health Center, Ground Floor Cabin 1',
    phone: '+91 79 2397 0101'
  },
  {
    name: 'Dr. Ananya Sen',
    category: 'campus',
    type: 'Campus Wellness Consultant',
    specialty: 'Psychiatry & Student Mental Health',
    availability: 'Tue & Thu: 2:00 PM - 6:00 PM',
    location: 'Student Wellness Wing, Block C',
    phone: '+91 79 2397 0104'
  },
  {
    name: 'Dr. Sunil Kulkarni',
    category: 'community',
    type: 'Visiting Specialist',
    specialty: 'Orthopedics & Sports Rehabilitation',
    availability: 'Mon, Wed, Fri: 4:00 PM - 7:00 PM',
    location: 'Sports Complex Medical Room',
    phone: '+91 98250 88991'
  },
  {
    name: 'Dr. Priya Nair',
    category: 'community',
    type: 'Visiting Specialist',
    specialty: 'Dermatology & Allergic Disorders',
    availability: 'Wed & Sat: 10:00 AM - 1:30 PM',
    location: 'Hostel Health Center, Cabin 2',
    phone: '+91 98790 44321'
  },
  {
    name: 'Dr. Harish Mehta',
    category: 'community',
    type: 'Campus Telehealth Partner',
    specialty: 'ENT & Respiratory Infections',
    availability: 'Daily: 6:00 PM - 10:00 PM (Online / Video)',
    location: 'Telehealth Digital Desk',
    phone: '+91 99090 12389'
  }
];

// Seed Dispensaries Reference Data
export const INITIAL_DISPENSARIES: Omit<Dispensary, 'id'>[] = [
  {
    name: 'Apollo Pharmacy - Campus Gate Annex',
    whatsappNumber: '+919825012345',
    deliversToCampus: true,
    fixedDeliveryTime: '12:30 PM & 6:30 PM daily at Main Gate Security',
    location: 'Opp. Campus Main Gate (300m)',
    notes: 'Prescriptions via WhatsApp. Accepts UPI & Student Insurance.'
  },
  {
    name: 'MedPlus Health & Diagnostics',
    whatsappNumber: '+919825067890',
    deliversToCampus: true,
    fixedDeliveryTime: '2:00 PM & 8:00 PM daily at Student Center Desk',
    location: 'Shela Main Road Market (1.1 km)',
    notes: '15% discount for verified MICA students with MICA-ID.'
  },
  {
    name: 'Sanjivani 24x7 Chemist',
    whatsappNumber: '+919879054321',
    deliversToCampus: true,
    fixedDeliveryTime: '11:00 AM & 5:00 PM daily at Hostel Reception',
    location: 'Near Bopal Junction (2.5 km)',
    notes: 'Emergency night medicine deliveries available upon Warden clearance.'
  },
  {
    name: 'Campus Express Meds (In-Store Pickup)',
    whatsappNumber: '+919898011223',
    deliversToCampus: false,
    fixedDeliveryTime: 'Direct Counter Pickup (Open 8 AM - 11 PM)',
    location: 'South Gate Commercial Complex',
    notes: 'Immediate pickup for urgent over-the-counter and first-aid kits.'
  }
];

// Function to seed reference collections if empty or missing category fields
export async function seedReferenceDataIfNeeded() {
  try {
    // Check doctors
    const doctorsRef = collection(db, 'doctors');
    const docSnap = await getDocs(doctorsRef);
    if (docSnap.empty) {
      const batch = writeBatch(db);
      INITIAL_DOCTORS.forEach((docData, index) => {
        const dRef = doc(db, 'doctors', `doc_${index + 1}`);
        batch.set(dRef, docData);
      });
      await batch.commit();
    } else {
      // Ensure existing doctors in Firestore have category set
      const batch = writeBatch(db);
      let needsUpdate = false;
      docSnap.docs.forEach((dSnap) => {
        const data = dSnap.data();
        if (!data.category) {
          const matchedInitial = INITIAL_DOCTORS.find(
            (init) => init.name.toLowerCase() === (data.name || '').toLowerCase()
          );
          const category = matchedInitial?.category || (data.type?.toLowerCase().includes('campus') ? 'campus' : 'community');
          batch.update(dSnap.ref, { category });
          needsUpdate = true;
        }
      });
      if (needsUpdate) {
        await batch.commit();
      }
    }

    // Check dispensaries
    const dispRef = collection(db, 'dispensaries');
    const dispSnap = await getDocs(dispRef);
    if (dispSnap.empty) {
      const batch = writeBatch(db);
      INITIAL_DISPENSARIES.forEach((dispData, index) => {
        const dRef = doc(db, 'dispensaries', `disp_${index + 1}`);
        batch.set(dRef, dispData);
      });
      await batch.commit();
    }
  } catch (err) {
    console.error('Error seeding reference collections:', err);
  }
}

export function generateMicaInsuranceId(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let randomPart = '';
  for (let i = 0; i < 6; i++) {
    randomPart += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `MICA-${randomPart}`;
}

export { signInWithPopup, signOut, signInAnonymously };
