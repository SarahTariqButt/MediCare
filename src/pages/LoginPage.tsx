import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { UserRole } from '@/types/hms';
import { Button } from '@/components/ui/button';
import {
  Heart,
  Stethoscope,
  Users,
  UserCircle,
  Activity,
  Shield,
  ArrowLeft
} from 'lucide-react';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface RoleCardProps {
  role: UserRole;
  title: string;
  description: string;
  icon: React.ReactNode;
  variant: 'roleAdmin' | 'roleDoctor' | 'roleReceptionist' | 'roleLab' | 'rolePatient';
  [key: string]: any;
}

const roleCards: RoleCardProps[] = [
  {
    role: 'doctor',
    title: 'Doctor',
    description: 'View appointments, consult patients, prescribe medicines',
    icon: <Stethoscope className="w-8 h-8" />,
    variant: 'roleDoctor',
  },
  {
    role: 'receptionist',
    title: 'Receptionist',
    description: 'Register patients, book appointments, manage billing',
    icon: <Users className="w-8 h-8" />,
    variant: 'roleReceptionist',
  },
  {
    role: 'patient',
    title: 'Patient Portal',
    description: 'View appointments, medical records, and test results',
    icon: <UserCircle className="w-8 h-8" />,
    variant: 'rolePatient',
  },
];

function RoleCard({ role, title, description, icon, variant, onDoctorClick }: RoleCardProps & { onDoctorClick?: () => void }) {
  const { login } = useAuth();

  const handleClick = () => {
    if (role === 'doctor' && onDoctorClick) {
      onDoctorClick();
    } else {
      login(role);
    }
  };

  return (
    <div
      className="group relative overflow-hidden rounded-2xl bg-card p-6 shadow-soft transition-all duration-300 hover:shadow-lifted hover:-translate-y-1 cursor-pointer border border-border/50"
      onClick={handleClick}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-transparent to-muted/30 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

      <div className="relative z-10">
        <div className={`inline-flex items-center justify-center w-14 h-14 rounded-xl mb-4 text-white bg-role-${role}`}
          style={{ backgroundColor: `hsl(var(--role-${role}))` }}
        >
          {icon}
        </div>

        <h3 className="text-lg font-semibold text-foreground mb-2">{title}</h3>
        <p className="text-sm text-muted-foreground mb-4">{description}</p>

        <Button variant={variant} size="sm" className="w-full">
          Login as {title}
        </Button>
      </div>
    </div>
  );
}

export default function LoginPage() {
  const [showDoctorDialog, setShowDoctorDialog] = useState(false);
  const [doctors, setDoctors] = useState<any[]>([]);
  const [loadingDoctors, setLoadingDoctors] = useState(false);
  const { loginAsDoctor } = useAuth();

  useEffect(() => {
    if (showDoctorDialog && doctors.length === 0) {
      fetchDoctors();
    }
  }, [showDoctorDialog]);

  const fetchDoctors = async () => {
    setLoadingDoctors(true);
    try {
      const response = await api.get('/doctors');
      setDoctors(response || []);
    } catch (error) {
      toast.error('Failed to load doctors');
      console.error('Error fetching doctors:', error);
    } finally {
      setLoadingDoctors(false);
    }
  };

  const handleDoctorSelect = async (doctorId: string, doctorName: string) => {
    await loginAsDoctor(doctorId, doctorName);
    setShowDoctorDialog(false);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 bg-gradient-hero opacity-5" />
        <div className="absolute inset-0" style={{
          backgroundImage: 'radial-gradient(circle at 2px 2px, hsl(var(--primary) / 0.15) 1px, transparent 0)',
          backgroundSize: '32px 32px',
        }} />

        <div className="relative container mx-auto px-4 py-16">
          {/* Header */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-3 mb-6">
              <div className="w-14 h-14 rounded-2xl bg-gradient-primary flex items-center justify-center shadow-glow">
                <Heart className="w-7 h-7 text-primary-foreground" />
              </div>
              <div className="text-left">
                <h1 className="text-2xl font-bold text-foreground font-display">MediCare</h1>
                <p className="text-sm text-muted-foreground">Hospital Management System</p>
              </div>
            </div>

            <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-4 font-display">
              Complete Healthcare
              <span className="text-gradient block mt-1">Management Solution</span>
            </h2>

            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Streamline your hospital operations with our comprehensive management system.
              From patient registration to discharge — all in one place.
            </p>
          </div>

          {/* Stats */}
          <div className="flex flex-wrap justify-center gap-8 mb-16">
            {[
              { value: '10,000+', label: 'Patients Served' },
              { value: '50+', label: 'Departments' },
              { value: '99.9%', label: 'Uptime' },
              { value: '24/7', label: 'Support' },
            ].map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-3xl font-bold text-primary font-display">{stat.value}</div>
                <div className="text-sm text-muted-foreground">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Role Selection */}
      <div className="container mx-auto px-4 pb-16">
        <div className="text-center mb-8">
          <h3 className="text-2xl font-semibold text-foreground mb-2 font-display">Select Your Role</h3>
          <p className="text-muted-foreground">Choose your role to access the system (Demo Mode)</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
          {roleCards.map((card) => (
            <RoleCard 
              key={card.role} 
              {...card} 
              onDoctorClick={() => setShowDoctorDialog(true)}
            />
          ))}
        </div>

        {/* Features Section */}
        <div className="mt-20">
          <h3 className="text-2xl font-semibold text-center text-foreground mb-10 font-display">Key Features</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
            {[
              { icon: <Users className="w-6 h-6" />, title: 'Patient Management', desc: 'Complete patient lifecycle from registration to discharge' },
              { icon: <Activity className="w-6 h-6" />, title: 'Real-time Tracking', desc: 'Live updates on appointments and patient status' },
              { icon: <Stethoscope className="w-6 h-6" />, title: 'Doctor Scheduling', desc: 'Efficient appointment booking and schedule management' },
              { icon: <Shield className="w-6 h-6" />, title: 'Secure Integration', desc: 'Collaborative environment for staff and patients' },
            ].map((feature, index) => (
              <div key={index} className="flex flex-col items-center text-center p-6 rounded-2xl bg-card border border-border/50">
                <div className="w-12 h-12 rounded-xl bg-secondary flex items-center justify-center text-primary mb-4">
                  {feature.icon}
                </div>
                <h4 className="font-semibold text-foreground mb-2">{feature.title}</h4>
                <p className="text-sm text-muted-foreground">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Doctor Selection Dialog */}
      <Dialog open={showDoctorDialog} onOpenChange={setShowDoctorDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <Button
              variant="ghost"
              size="sm"
              className="absolute left-4 top-4"
              onClick={() => setShowDoctorDialog(false)}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <DialogTitle className="text-center">Select Doctor Account</DialogTitle>
          </DialogHeader>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-96 overflow-y-auto mt-6">
            {loadingDoctors ? (
              <div className="col-span-2 text-center py-8">
                <p className="text-muted-foreground">Loading doctors...</p>
              </div>
            ) : doctors.length > 0 ? (
              doctors.map((doctor) => (
                <div
                  key={doctor.id}
                  className="border border-border rounded-lg p-4 hover:bg-accent cursor-pointer transition-colors"
                  onClick={() => handleDoctorSelect(String(doctor.id), doctor.name)}
                >
                  {doctor.image && (
                    <img 
                      src={doctor.image} 
                      alt={doctor.name}
                      className="w-full h-40 object-cover rounded-md mb-3"
                    />
                  )}
                  <h3 className="font-semibold text-foreground">{doctor.name}</h3>
                  <p className="text-sm text-muted-foreground">{doctor.specialty}</p>
                  <p className="text-xs text-muted-foreground mt-1">{doctor.department}</p>
                  <Button
                    size="sm"
                    className="w-full mt-3"
                    onClick={() => handleDoctorSelect(String(doctor.id), doctor.name)}
                  >
                    Login as {doctor.name.split(' ').pop()}
                  </Button>
                </div>
              ))
            ) : (
              <div className="col-span-2 text-center py-8">
                <p className="text-muted-foreground">No doctors available</p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
