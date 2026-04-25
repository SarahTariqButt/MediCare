import { useAuth } from '@/context/AuthContext';
import DashboardLayout from '@/layouts/DashboardLayout';
import { useNavigate } from 'react-router-dom';
import {
  Users,
  Calendar,
  Stethoscope,
  FlaskConical,
  BedDouble,
  TrendingUp,
  Clock,
  AlertCircle,
  CheckCircle2,
  ArrowUpRight,
  Activity
} from 'lucide-react';
import { stats } from '@/mockData'; // Keeping stats mock for now
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';

interface StatCardProps {
  title: string;
  value: string | number;
  change?: string;
  icon: React.ReactNode;
  trend?: 'up' | 'down' | 'neutral';
  color: string;
}

function StatCard({ title, value, change, icon, trend = 'neutral', color }: StatCardProps) {
  return (
    <div className="bg-card rounded-2xl p-6 border border-border/50 shadow-soft card-hover">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-muted-foreground mb-1">{title}</p>
          <p className="text-3xl font-bold text-foreground font-display">{value}</p>
          {change && (
            <div className={cn(
              "flex items-center gap-1 mt-2 text-sm",
              trend === 'up' && "text-success",
              trend === 'down' && "text-destructive",
              trend === 'neutral' && "text-muted-foreground"
            )}>
              {trend === 'up' && <TrendingUp className="w-4 h-4" />}
              <span>{change}</span>
            </div>
          )}
        </div>
        <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center", color)}>
          {icon}
        </div>
      </div>
    </div>
  );
}

function AppointmentItem({ appointment, patient, doctor }: { appointment: any; patient: any; doctor: any;[key: string]: any }) {
  const statusColors: any = {
    'Scheduled': 'bg-info/10 text-info',
    'In Progress': 'bg-warning/10 text-warning',
    'Completed': 'bg-success/10 text-success',
    'Cancelled': 'bg-destructive/10 text-destructive',
    'scheduled': 'bg-info/10 text-info',
    'in-progress': 'bg-warning/10 text-warning',
    'completed': 'bg-success/10 text-success',
    'cancelled': 'bg-destructive/10 text-destructive',
  };

  const statusIcons: any = {
    'Scheduled': <Clock className="w-4 h-4" />,
    'In Progress': <Activity className="w-4 h-4" />,
    'Completed': <CheckCircle2 className="w-4 h-4" />,
    'Cancelled': <AlertCircle className="w-4 h-4" />,
    'scheduled': <Clock className="w-4 h-4" />,
    'in-progress': <Activity className="w-4 h-4" />,
    'completed': <CheckCircle2 className="w-4 h-4" />,
    'cancelled': <AlertCircle className="w-4 h-4" />,
  };

  return (
    <div className="flex items-center gap-4 p-4 rounded-xl bg-secondary/50 hover:bg-secondary transition-colors">
      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold">
        {patient?.fullName?.charAt(0) || patient?.name?.charAt(0)}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-medium text-foreground truncate">{patient?.fullName || patient?.name}</p>
        <p className="text-sm text-muted-foreground">{appointment.timeSlot} • Token #{appointment.tokenNumber}</p>
      </div>
      <div className={cn("px-3 py-1.5 rounded-full text-xs font-medium flex items-center gap-1.5", statusColors[appointment.status] || statusColors['scheduled'])}>
        {statusIcons[appointment.status] || statusIcons['scheduled']}
        <span className="capitalize">{appointment.status.replace('-', ' ')}</span>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const { data: appointments = [] } = useQuery({
    queryKey: ['appointments'],
    queryFn: () => api.get('/appointments'),
  });

  const { data: patients = [] } = useQuery({
    queryKey: ['patients'],
    queryFn: () => api.get('/patients'),
  });

  const { data: doctors = [] } = useQuery({
    queryKey: ['doctors'],
    queryFn: () => api.get('/doctors'),
  });

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  return (
    <DashboardLayout currentPath="/dashboard">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground font-display">
          {getGreeting()}, {user?.name.split(' ')[0]}! 👋
        </h1>
        <p className="text-muted-foreground mt-1">
          Here's what's happening at the hospital today.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          title="Total Patients"
          value={patients.length > 0 ? patients.length : stats.totalPatients.toLocaleString()}
          change="+12% from last month"
          trend="up"
          icon={<Users className="w-6 h-6 text-primary-foreground" />}
          color="bg-gradient-primary"
        />
        <StatCard
          title="Today's Appointments"
          value={appointments.length > 0 ? appointments.length : stats.todayAppointments}
          change="5 pending"
          trend="neutral"
          icon={<Calendar className="w-6 h-6 text-info-foreground" />}
          color="bg-info"
        />
        <StatCard
          title="Available Doctors"
          value={doctors.length > 0 ? doctors.filter((d: any) => d.availableToday || d.available).length : stats.availableDoctors}
          icon={<Stethoscope className="w-6 h-6 text-success-foreground" />}
          color="bg-success"
        />
        <StatCard
          title="Active Role"
          value={user?.role || 'User'}
          icon={<Activity className="w-6 h-6 text-warning-foreground" />}
          color="bg-warning"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Today's Appointments */}
        <div className="lg:col-span-2 bg-card rounded-2xl border border-border/50 shadow-soft overflow-hidden">
          <div className="p-6 border-b border-border flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-foreground font-display">Today's Appointments</h2>
              <p className="text-sm text-muted-foreground">{appointments.length} appointments scheduled</p>
            </div>
            <Button variant={"outline" as any} size={"sm" as any} onClick={() => navigate('/appointments')}>
              View All
              <ArrowUpRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
          <div className="p-6 space-y-3">
            {appointments.length > 0 ? (
              appointments.map((appointment: any) => {
                const patient = patients.find((p: any) => String(p.id) === String(appointment.patientId));
                const doctor = doctors.find((d: any) => String(d.id) === String(appointment.doctorId));
                return (
                  <AppointmentItem
                    key={appointment.id}
                    appointment={appointment}
                    patient={patient}
                    doctor={doctor}
                  />
                );
              })
            ) : (
              <div className="text-center py-6 text-muted-foreground">
                No appointments found for today.
              </div>
            )}
          </div>
        </div>

        {/* Quick Stats / Bed Availability */}
        <div className="space-y-6">
          {/* Bed Availability */}
          <div className="bg-card rounded-2xl border border-border/50 shadow-soft p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-foreground font-display">Bed Availability</h3>
              <BedDouble className="w-5 h-5 text-muted-foreground" />
            </div>
            <div className="relative h-3 bg-secondary rounded-full overflow-hidden mb-3">
              <div
                className="absolute inset-y-0 left-0 bg-gradient-primary rounded-full"
                style={{ width: `${(stats.occupiedBeds / stats.totalBeds) * 100}%` }}
              />
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">
                <span className="text-foreground font-medium">{stats.occupiedBeds}</span> occupied
              </span>
              <span className="text-muted-foreground">
                <span className="text-foreground font-medium">{stats.totalBeds - stats.occupiedBeds}</span> available
              </span>
            </div>
          </div>

          {/* Revenue Card */}
          <div className="bg-card rounded-2xl border border-border/50 shadow-soft p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-foreground font-display">Today's Revenue</h3>
              <TrendingUp className="w-5 h-5 text-success" />
            </div>
            <p className="text-3xl font-bold text-foreground font-display">
              Rs. {stats.todayRevenue.toLocaleString()}
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              Monthly: Rs. {stats.monthlyRevenue.toLocaleString()}
            </p>
          </div>

          {/* Quick Actions */}
          <div className="bg-card rounded-2xl border border-border/50 shadow-soft p-6">
            <h3 className="font-semibold text-foreground mb-4 font-display">Quick Actions</h3>
            <div className="space-y-2">
              {user?.role === 'receptionist' && (
                <Button variant={"secondary" as any} className="w-full justify-start" onClick={() => navigate('/patients')}>
                  <Users className="w-4 h-4 mr-2" />
                  Register New Patient
                </Button>
              )}
              <Button variant={"secondary" as any} className="w-full justify-start" onClick={() => navigate('/appointments')}>
                <Calendar className="w-4 h-4 mr-2" />
                {user?.role === 'patient' ? 'Request Appointment' : 'View Schedule'}
              </Button>
              {user?.role === 'receptionist' && (
                <Button variant={"secondary" as any} className="w-full justify-start" onClick={() => navigate('/doctors')}>
                  <Stethoscope className="w-4 h-4 mr-2" />
                  Manage Doctors
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout >
  );
}
