export type Scenario = 'minor' | 'major' | 'emergency';

export type ConsultType = 'campus' | 'community' | 'family';

export type DoctorCategory = 'campus' | 'community';

export type RequestStatus =
  | 'pending'
  | 'doctor_assigned'
  | 'consulting'
  | 'prescribed'
  | 'ordering_medicine'
  | 'closed_helped'
  | 'reopened'
  | 'escalated';

export type MedicineUrgency = 'immediate' | 'today' | 'flexible';

export type OrderStatus = 'pending' | 'accepted';

export interface MedicineOrder {
  id?: string;
  studentId: string;
  studentName: string;
  micaInsuranceId: string;
  prescriptionImageUrl: string;
  urgency: MedicineUrgency;
  status: OrderStatus;
  acceptedByDispensaryId?: string;
  acceptedByDispensaryName?: string;
  createdAt: number;
  acceptedAt?: number;
}

export interface Complaint {
  id?: string;
  studentId: string;
  dispensaryId: string;
  dispensaryName: string;
  description: string;
  createdAt: number;
}

export interface UserProfile {
  uid: string;
  name: string;
  email: string;
  collegeEmail: string;
  course: string;
  year: string;
  hostel: string;
  roommateDetails: string;
  emergencyContactName: string;
  emergencyContactPhone: string;
  bloodGroup: string;
  otherInsuranceInfo: string;
  panNumber: string;
  aadharNumber: string;
  micaInsuranceId: string;
  createdAt?: string | number;
  updatedAt?: string | number;
}

export interface HelpRequest {
  id?: string;
  studentId: string;
  ailment: string;
  description: string;
  scenario: Scenario;
  consultType: ConsultType;
  status: RequestStatus;
  assignedDoctorId?: string;
  assignedDoctorName: string;
  doctorNotes: string;
  medicineRequirement?: string;
  prescriptionImageUrl?: string;
  medicineUrgency?: MedicineUrgency;
  chosenDispensaryId?: string;
  createdAt: number;
  updatedAt: number;
}

export interface Doctor {
  id?: string;
  name: string;
  category: DoctorCategory;
  type: string;
  specialty: string;
  availability: string;
  location?: string;
  phone?: string;
}

export interface Dispensary {
  id?: string;
  name: string;
  whatsappNumber: string;
  deliversToCampus: boolean;
  fixedDeliveryTime: string;
  location?: string;
  notes?: string;
}
