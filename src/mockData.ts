import { Department, Doctor, Patient, Appointment } from '@/types/hms';
import { generateDoctorWithAvatar } from '@/lib/avatarUtils';

export const departments: Department[] = [
  { id: '1', name: 'Cardiology', description: 'Heart and cardiovascular system', icon: 'Heart', doctorCount: 5 },
  { id: '2', name: 'Neurology', description: 'Brain and nervous system', icon: 'Brain', doctorCount: 4 },
  { id: '3', name: 'Orthopedics', description: 'Bones and joints', icon: 'Bone', doctorCount: 6 },
  { id: '4', name: 'Pediatrics', description: 'Child healthcare', icon: 'Baby', doctorCount: 4 },
  { id: '5', name: 'General Medicine', description: 'General health issues', icon: 'Stethoscope', doctorCount: 8 },
  { id: '6', name: 'ENT', description: 'Ear, nose, and throat', icon: 'Ear', doctorCount: 3 },
  { id: '7', name: 'Dermatology', description: 'Skin conditions', icon: 'Fingerprint', doctorCount: 3 },
  { id: '8', name: 'Ophthalmology', description: 'Eye care', icon: 'Eye', doctorCount: 4 },
];

const _doctors: Doctor[] = [
  { id: '1', name: 'Dr. Ahmad Khan', specialization: 'Cardiologist', department: 'Cardiology', qualification: 'MBBS, MD Cardiology', experience: 15, available: true, consultationFee: 2000, gender: 'male' },
  { id: '2', name: 'Dr. Fatima Noor', specialization: 'Neurologist', department: 'Neurology', qualification: 'MBBS, MD Neurology', experience: 12, available: true, consultationFee: 2500, gender: 'female' },
  { id: '3', name: 'Dr. Hassan Ali', specialization: 'Orthopedic Surgeon', department: 'Orthopedics', qualification: 'MBBS, MS Ortho', experience: 18, available: true, consultationFee: 2000, gender: 'male' },
  { id: '4', name: 'Dr. Ayesha Malik', specialization: 'Pediatrician', department: 'Pediatrics', qualification: 'MBBS, DCH', experience: 10, available: false, consultationFee: 1500, gender: 'female' },
  { id: '5', name: 'Dr. Usman Tariq', specialization: 'General Physician', department: 'General Medicine', qualification: 'MBBS, FCPS', experience: 8, available: true, consultationFee: 1000, gender: 'male' },
  { id: '6', name: 'Dr. Sana Riaz', specialization: 'ENT Specialist', department: 'ENT', qualification: 'MBBS, MS ENT', experience: 14, available: true, consultationFee: 1800, gender: 'female' },
];

export const doctors: Doctor[] = _doctors.map(d => generateDoctorWithAvatar({
  ...d,
  // DiceBear generator uses the `specialty` key in other places — map if needed
  specialty: (d.specialization || d.specialization || '').toString(),
}));

export const patients: Patient[] = [
  {
    id: '1',
    patientId: 'PAT-2024-0001',
    name: 'Muhammad Imran',
    cnic: '35201-1234567-1',
    age: 45,
    gender: 'male',
    phone: '0300-1234567',
    email: 'imran@email.com',
    address: '123 Main Street, Lahore',
    bloodGroup: 'A+',
    registeredAt: new Date('2024-01-15'),
  },
  {
    id: '2',
    patientId: 'PAT-2024-0002',
    name: 'Aisha Bibi',
    cnic: '35201-7654321-2',
    age: 32,
    gender: 'female',
    phone: '0321-9876543',
    address: '456 Garden Town, Karachi',
    bloodGroup: 'B+',
    registeredAt: new Date('2024-01-20'),
  },
  {
    id: '3',
    patientId: 'PAT-2024-0003',
    name: 'Ali Hassan',
    cnic: '35201-1111111-1',
    age: 28,
    gender: 'male',
    phone: '0333-5555555',
    address: '789 Model Town, Islamabad',
    bloodGroup: 'O+',
    registeredAt: new Date('2024-02-01'),
  },
];

export const todaysAppointments: Appointment[] = [
  { id: '1', patientId: '1', doctorId: '1', departmentId: '1', date: new Date(), timeSlot: '09:00 AM', tokenNumber: 1, status: 'completed' },
  { id: '2', patientId: '2', doctorId: '1', departmentId: '1', date: new Date(), timeSlot: '09:30 AM', tokenNumber: 2, status: 'in-progress' },
  { id: '3', patientId: '3', doctorId: '1', departmentId: '1', date: new Date(), timeSlot: '10:00 AM', tokenNumber: 3, status: 'scheduled' },
];

export const timeSlots = [
  '09:00 AM', '09:30 AM', '10:00 AM', '10:30 AM', '11:00 AM', '11:30 AM',
  '12:00 PM', '02:00 PM', '02:30 PM', '03:00 PM', '03:30 PM', '04:00 PM',
  '04:30 PM', '05:00 PM',
];

export const stats = {
  totalPatients: 1250,
  todayAppointments: 45,
  availableDoctors: 18,
  pendingLabTests: 12,
  occupiedBeds: 85,
  totalBeds: 120,
  monthlyRevenue: 2450000,
  todayRevenue: 125000,
};
