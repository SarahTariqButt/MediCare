import React, { createContext, useContext, useState, ReactNode } from 'react';
import { User, UserRole } from '@/types/hms';
import { api } from '@/lib/api';
import { toast } from 'sonner';

export interface AuthUser extends User {
  doctorId?: string;
}

interface AuthContextType {
  user: AuthUser | null;
  login: (role: UserRole, doctorId?: string) => Promise<void>;
  loginAsDoctor: (doctorId: string, doctorName: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const roleCredentials: Record<UserRole, { email: string; password: string }> = {
  admin: { email: 'admin@hms.com', password: 'admin' },
  doctor: { email: 'doctor@hms.com', password: 'doc' },
  receptionist: { email: 'reception@hms.com', password: 'recep' },
  lab: { email: 'lab@hms.com', password: 'lab' },
  patient: { email: 'patient@hms.com', password: 'pat' },
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);

  const login = async (role: UserRole, doctorId?: string) => {
    try {
      const credentials = roleCredentials[role];
      const response = await api.post('/auth/login', credentials);

      if (response.success) {
        // Handle role name discrepancy ('lab_technician' -> 'lab')
        const backendUser = response.user;
        const mappedRole = backendUser.role === 'lab_technician' ? 'lab' : backendUser.role;

        setUser({
          ...backendUser,
          role: mappedRole as UserRole,
          doctorId: doctorId,
        });
        toast.success(response.message);
      }
    } catch (error) {
      toast.error('Failed to connect to backend server');
      console.error('Login error:', error);
    }
  };

  const loginAsDoctor = async (doctorId: string, doctorName: string) => {
    try {
      const credentials = roleCredentials['doctor'];
      const response = await api.post('/auth/login', credentials);

      if (response.success) {
        setUser({
          id: doctorId,
          name: doctorName,
          email: credentials.email,
          role: 'doctor',
          doctorId: doctorId,
        });
        toast.success(`Welcome, ${doctorName}!`);
      }
    } catch (error) {
      toast.error('Failed to connect to backend server');
      console.error('Login error:', error);
    }
  };

  const logout = () => {
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loginAsDoctor, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
