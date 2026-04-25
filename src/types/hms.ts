export type UserRole = 'admin' | 'doctor' | 'receptionist' | 'lab' | 'patient';

export interface User {
    id: string;
    name: string;
    email: string;
    role: UserRole;
    avatar?: string;
    department?: string;
}

export interface Patient {
    id: string;
    patientId: string;
    name: string;
    cnic: string;
    age: number;
    gender: 'male' | 'female' | 'other';
    bloodGroup: string;
    phone: string;
    address: string;
    email?: string;
    lastVisit?: string;
    registeredAt?: Date;
}

export interface Department {
    id: string;
    name: string;
    description: string;
    icon: string;
    doctorCount: number;
}

export interface Doctor {
    id: string;
    name: string;
    specialization: string;
    department: string;
    qualification: string;
    experience: number;
    available: boolean;
    consultationFee: number;
    avatar?: string;
    gender?: 'male' | 'female' | 'other';
}

export interface Appointment {
    id: string;
    patientId: string;
    doctorId: string;
    departmentId: string;
    date: Date;
    timeSlot: string;
    status: 'scheduled' | 'in-progress' | 'completed' | 'cancelled';
    tokenNumber: number;
}
