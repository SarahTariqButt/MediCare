import { useState, useEffect } from 'react';
import DashboardLayout from '@/layouts/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  Clock,
  CheckCircle2,
  AlertCircle,
  User,
  Phone,
  Mail,
  Calendar,
  MoreVertical,
  ChevronDown
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface Appointment {
  id: string | number;
  patientId: string | number;
  doctorId: string | number;
  departmentId: string;
  date: string;
  timeSlot: string;
  tokenNumber: number;
  status: string;
}

interface Patient {
  id: string;
  name: string;
  phone?: string;
  email?: string;
  age?: number;
  gender?: string;
}

export default function DoctorSchedulePage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [filterStatus, setFilterStatus] = useState('all');
  const [patients, setPatients] = useState<Record<string, Patient>>({});
  const [dialogOpenAppointmentId, setDialogOpenAppointmentId] = useState<string | null>(null);

  // Fetch appointments
  const { data: appointments = [], isLoading } = useQuery({
    queryKey: ['doctor-appointments', user?.doctorId],
    queryFn: async () => {
      const response = await api.get('/appointments');
      return (response || []).filter((apt: Appointment) => String(apt.doctorId) === String(user?.doctorId));
    },
  });

  // Fetch patients
  const { data: allPatients = [] } = useQuery({
    queryKey: ['patients'],
    queryFn: () => api.get('/patients'),
  });

  // Build patient map
  useEffect(() => {
    const patientMap: Record<string, Patient> = {};
    (allPatients || []).forEach((patient: any) => {
      patientMap[patient.id] = patient;
    });
    setPatients(patientMap);
  }, [allPatients]);

  // Update appointment status mutation
  const updateAppointmentMutation = useMutation({
    mutationFn: (data: { id: string | number; status: string }) =>
      api.patch(`/appointments/${data.id}`, { status: data.status }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['doctor-appointments', user?.doctorId] });
      toast.success(`Appointment marked as ${variables.status}`);
      setDialogOpenAppointmentId(null);
    },
    onError: () => {
      toast.error('Failed to update appointment');
    }
  });

  // Filter appointments
  const filteredAppointments = appointments.filter((apt: Appointment) => {
    const dateMatch = apt.date === selectedDate;
    const statusMatch = filterStatus === 'all' || apt.status.toLowerCase() === filterStatus.toLowerCase();
    return dateMatch && statusMatch;
  });

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'scheduled':
        return 'bg-blue-50 border-blue-200 text-blue-700';
      case 'in-progress':
        return 'bg-amber-50 border-amber-200 text-amber-700';
      case 'completed':
        return 'bg-green-50 border-green-200 text-green-700';
      case 'cancelled':
        return 'bg-red-50 border-red-200 text-red-700';
      default:
        return 'bg-gray-50 border-gray-200 text-gray-700';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
        return <CheckCircle2 className="w-4 h-4" />;
      case 'in-progress':
        return <Clock className="w-4 h-4" />;
      case 'scheduled':
        return <Calendar className="w-4 h-4" />;
      default:
        return <AlertCircle className="w-4 h-4" />;
    }
  };

  const statusOptions = ['Scheduled', 'in-progress', 'completed', 'cancelled'];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-foreground font-display">My Schedule</h1>
          <p className="text-muted-foreground mt-1">Manage your appointments and patient consultations</p>
        </div>

        {/* Info Card */}
        <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20 p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
              <User className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-foreground">{user?.name}</h2>
              <p className="text-sm text-muted-foreground">{user?.department || 'Doctor'}</p>
            </div>
          </div>
        </Card>

        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="text-sm font-medium text-foreground mb-2 block">Select Date</label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-foreground mb-2 block">Filter by Status</label>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger>
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="scheduled">Scheduled</SelectItem>
                <SelectItem value="in-progress">In Progress</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-end">
            <div className="text-sm text-muted-foreground">
              <span className="font-semibold text-foreground">{filteredAppointments.length}</span> appointments
            </div>
          </div>
        </div>

        {/* Appointments List */}
        <div className="space-y-4">
          {isLoading ? (
            <Card className="p-12 text-center">
              <p className="text-muted-foreground">Loading appointments...</p>
            </Card>
          ) : filteredAppointments.length > 0 ? (
            filteredAppointments.map((appointment: Appointment) => {
              const patient = patients[appointment.patientId];
              return (
                <Card
                  key={appointment.id}
                  className={cn(
                    'p-6 border-l-4 transition-all hover:shadow-md',
                    getStatusColor(appointment.status)
                  )}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="flex items-center gap-2">
                          {getStatusIcon(appointment.status)}
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border" style={{
                            backgroundColor: getStatusColor(appointment.status).split(' ')[0],
                            borderColor: getStatusColor(appointment.status).split(' ')[1],
                            color: getStatusColor(appointment.status).split(' ')[2],
                          }}>
                            {appointment.status}
                          </span>
                        </div>
                        <span className="text-xs font-semibold text-muted-foreground">Token #{appointment.tokenNumber}</span>
                      </div>

                      <h3 className="text-lg font-semibold text-foreground mb-2">
                        {patient?.name || `Patient ${appointment.patientId}`}
                      </h3>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                        <div className="flex items-center gap-2 text-sm">
                          <Clock className="w-4 h-4 text-muted-foreground" />
                          <span className="text-muted-foreground">{appointment.timeSlot}</span>
                        </div>
                        {patient?.phone && (
                          <div className="flex items-center gap-2 text-sm">
                            <Phone className="w-4 h-4 text-muted-foreground" />
                            <span className="text-muted-foreground">{patient.phone}</span>
                          </div>
                        )}
                        {patient?.email && (
                          <div className="flex items-center gap-2 text-sm">
                            <Mail className="w-4 h-4 text-muted-foreground" />
                            <span className="text-muted-foreground">{patient.email}</span>
                          </div>
                        )}
                        {patient?.age && (
                          <div className="text-sm text-muted-foreground">
                            Age: <span className="font-medium">{patient.age}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <Dialog open={dialogOpenAppointmentId === String(appointment.id)} onOpenChange={(open) => {
                      if (!open) setDialogOpenAppointmentId(null);
                    }}>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                            <MoreVertical className="w-4 h-4" />
                            <span className="sr-only">Open menu</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                          <DropdownMenuLabel>Update Status</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          {statusOptions.map((status) => (
                            <DropdownMenuItem
                              key={status}
                              onClick={() => updateAppointmentMutation.mutate({
                                id: appointment.id,
                                status: status
                              })}
                              disabled={updateAppointmentMutation.isPending}
                            >
                              {status}
                            </DropdownMenuItem>
                          ))}
                          <DropdownMenuSeparator />
                          <DialogTrigger asChild>
                            <DropdownMenuItem onClick={() => setDialogOpenAppointmentId(String(appointment.id))}>
                              View Details
                            </DropdownMenuItem>
                          </DialogTrigger>
                        </DropdownMenuContent>
                      </DropdownMenu>

                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Appointment Details</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div>
                            <label className="text-sm font-medium text-foreground">Patient</label>
                            <p className="text-muted-foreground">{patient?.name || `Patient ${appointment.patientId}`}</p>
                          </div>
                          <div>
                            <label className="text-sm font-medium text-foreground">Time</label>
                            <p className="text-muted-foreground">{appointment.timeSlot}</p>
                          </div>
                          <div>
                            <label className="text-sm font-medium text-foreground">Status</label>
                            <div className="mt-2">
                              <Select defaultValue={appointment.status} onValueChange={(newStatus) => {
                                updateAppointmentMutation.mutate({
                                  id: appointment.id,
                                  status: newStatus
                                });
                              }}>
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {statusOptions.map((status) => (
                                    <SelectItem key={status} value={status}>
                                      {status}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                          {patient && (
                            <>
                              <div>
                                <label className="text-sm font-medium text-foreground">Contact</label>
                                <p className="text-muted-foreground">{patient.phone || 'N/A'}</p>
                                <p className="text-muted-foreground">{patient.email || 'N/A'}</p>
                              </div>
                              <div>
                                <label className="text-sm font-medium text-foreground">Details</label>
                                <p className="text-muted-foreground">Age: {patient.age || 'N/A'}</p>
                                <p className="text-muted-foreground">Gender: {patient.gender || 'N/A'}</p>
                              </div>
                            </>
                          )}
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                </Card>
              );
            })
          ) : (
            <Card className="p-12 text-center">
              <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground text-lg">No appointments found for the selected date and filter</p>
              <p className="text-sm text-muted-foreground mt-2">Try selecting a different date or adjusting filters</p>
            </Card>
          )}
        </div>

        {/* Summary Stats */}
        {filteredAppointments.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="p-4">
              <div className="text-sm text-muted-foreground">Scheduled</div>
              <div className="text-2xl font-bold text-blue-600 mt-1">
                {filteredAppointments.filter((a: Appointment) => a.status.toLowerCase() === 'scheduled').length}
              </div>
            </Card>
            <Card className="p-4">
              <div className="text-sm text-muted-foreground">In Progress</div>
              <div className="text-2xl font-bold text-amber-600 mt-1">
                {filteredAppointments.filter((a: Appointment) => a.status.toLowerCase() === 'in-progress').length}
              </div>
            </Card>
            <Card className="p-4">
              <div className="text-sm text-muted-foreground">Completed</div>
              <div className="text-2xl font-bold text-green-600 mt-1">
                {filteredAppointments.filter((a: Appointment) => a.status.toLowerCase() === 'completed').length}
              </div>
            </Card>
            <Card className="p-4">
              <div className="text-sm text-muted-foreground">Cancelled</div>
              <div className="text-2xl font-bold text-red-600 mt-1">
                {filteredAppointments.filter((a: Appointment) => a.status.toLowerCase() === 'cancelled').length}
              </div>
            </Card>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
