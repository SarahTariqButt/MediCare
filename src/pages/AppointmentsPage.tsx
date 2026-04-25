import { useState, useEffect } from 'react';
import DashboardLayout from '@/layouts/DashboardLayout';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/AuthContext';
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Search,
  Plus,
  Calendar,
  Clock,
  User,
  Stethoscope,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Filter,
  ChevronRight,
  Activity,
  Play,
  Star
} from 'lucide-react';
import { departments, timeSlots } from '@/mockData';
import { cn } from '@/lib/utils';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';

export default function AppointmentsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<any>(null); // For viewing details or confirming
  const [selectedDepartment, setSelectedDepartment] = useState('');
  const [selectedDoctor, setSelectedDoctor] = useState('');
  const [selectedPatient, setSelectedPatient] = useState(user?.role === 'patient' ? String(user.id) : '');
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);
  const [feedbackAppointment, setFeedbackAppointment] = useState<any>(null);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [showBillModal, setShowBillModal] = useState(false);
  const [patientBill, setPatientBill] = useState<any>(null);

  const [isViewFeedbackOpen, setIsViewFeedbackOpen] = useState(false);
  const [viewFeedback, setViewFeedback] = useState<any>(null);
  const [isViewDetailsOpen, setIsViewDetailsOpen] = useState(false);
  const [viewDetailsAppointment, setViewDetailsAppointment] = useState<any>(null);

  const handleSubmitFeedback = async () => {
    try {
      await api.post('/feedback', {
        appointmentId: feedbackAppointment.id,
        doctorId: feedbackAppointment.doctorId,
        patientId: user?.id,
        patientName: user?.name,
        rating,
        comment
      });
      toast.success('Thank you for your feedback!');
      setIsFeedbackOpen(false);
      setComment('');
      setRating(5);
    } catch (error) {
      toast.error('Failed to submit feedback');
    }
  };

  const handleStartConsultation = async (app: any) => {
    try {
      await api.patch(`/appointments/${app.id}`, { status: 'in-progress' });
      toast.success('Consultation started!');
      refetchAppointments();
    } catch (error) {
      toast.error('Failed to start consultation');
    }
  };

  const handleMarkAsDone = async (app: any) => {
    try {
      // Find patient name for bill
      const patient = patients.find((p: any) => String(p.id) === String(app.patientId));
      const doctor = doctors.find((d: any) => String(d.id) === String(app.doctorId));

      const billData = {
        appointmentId: app.id,
        patientId: app.patientId,
        patientName: patient?.fullName || patient?.name,
        doctorId: app.doctorId,
        doctorName: doctor?.name,
        amount: 1500 + Math.floor(Math.random() * 500), // Base fee + random medicine
        details: "Consultation Completed",
        date: new Date().toISOString()
      };

      await api.post('/bills', billData);
      setPatientBill(billData);
      setShowBillModal(true);

      await api.patch(`/appointments/${app.id}`, { status: 'completed' });
      toast.success('Appointment marked as done and bill generated!');
      refetchAppointments();
    } catch (error) {
      toast.error('Failed to complete appointment');
    }
  };

  const handleViewBill = async (app: any) => {
    try {
      const bills = await api.get(`/bills/${user?.id}`);
      const bill = bills.find((b: any) => String(b.appointmentId) === String(app.id));
      if (bill) {
        setPatientBill(bill);
        setShowBillModal(true);
      } else {
        toast.info('Bill not found for this appointment.');
      }
    } catch (error) {
      toast.error('Failed to fetch bill');
    }
  };

  const handleViewFeedback = (appointmentId: number) => {
    const feedback = allDoctorFeedback.find((f: any) => String(f.appointmentId) === String(appointmentId));
    if (feedback) {
      setViewFeedback(feedback);
      setIsViewFeedbackOpen(true);
    } else {
      toast.info('No feedback submitted yet for this appointment.');
    }
  };

  const handleDownloadPDF = (bill: any) => {
    // Create a simple HTML-based PDF download
    const billContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Medical Bill - #BILL-${bill.appointmentId}</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 40px; max-width: 600px; margin: 0 auto; }
          .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #333; padding-bottom: 20px; }
          .bill-info { margin: 20px 0; }
          .bill-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #eee; }
          .total { font-size: 24px; font-weight: bold; margin-top: 20px; padding-top: 20px; border-top: 2px solid #333; }
          .label { color: #666; }
          .value { font-weight: bold; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>MediCare Hospital</h1>
          <p>Medical Bill Receipt</p>
        </div>
        <div class="bill-info">
          <div class="bill-row">
            <span class="label">Bill Number:</span>
            <span class="value">#BILL-${bill.appointmentId}</span>
          </div>
          <div class="bill-row">
            <span class="label">Patient Name:</span>
            <span class="value">${bill.patientName}</span>
          </div>
          <div class="bill-row">
            <span class="label">Doctor:</span>
            <span class="value">${bill.doctorName}</span>
          </div>
          <div class="bill-row">
            <span class="label">Date:</span>
            <span class="value">${new Date(bill.date).toLocaleDateString()}</span>
          </div>
          <div class="bill-row">
            <span class="label">Service:</span>
            <span class="value">${bill.details}</span>
          </div>
        </div>
        <div class="total">
          <div style="display: flex; justify-content: space-between;">
            <span>Total Amount:</span>
            <span>Rs. ${bill.amount.toLocaleString()}</span>
          </div>
        </div>
      </body>
      </html>
    `;

    // Create a blob and download
    const blob = new Blob([billContent], { type: 'text/html' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `MediCare-Bill-${bill.appointmentId}-${new Date().getTime()}.html`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
    toast.success('Bill downloaded successfully!');
  };

  const { data: appointmentsRaw, refetch: refetchAppointments, isError: appointmentsError } = useQuery({
    queryKey: ['appointments'],
    queryFn: () => api.get('/appointments'),
  });
  const appointments = Array.isArray(appointmentsRaw) ? appointmentsRaw : [];

  const { data: patients = [] } = useQuery({
    queryKey: ['patients'],
    queryFn: () => api.get('/patients'),
  });

  const { data: doctors = [] } = useQuery({
    queryKey: ['doctors'],
    queryFn: () => api.get('/doctors'),
  });

  const { data: allDoctorFeedback = [] } = useQuery({
    queryKey: ['feedback', user?.id],
    queryFn: () => api.get(`/feedback/${user?.id}`),
    enabled: user?.role === 'doctor'
  });

  // Doctor ID from URL (?doctorId=3) or from navigation state — so "Show Schedules" persists on refresh
  const doctorIdFromUrl = searchParams.get('doctorId');
  const doctorIdFromState = (location.state as any)?.doctorId;
  const scheduleDoctorIdParam = doctorIdFromUrl ?? doctorIdFromState;

  useEffect(() => {
    if (scheduleDoctorIdParam) {
      setSelectedDoctor(String(scheduleDoctorIdParam));
      setFilterStatus('scheduled'); // Show scheduled appointments by default
      const doctor = doctors.find((d: any) => String(d.id) === String(scheduleDoctorIdParam));
      if (doctor?.department) {
        const dept = departments.find(d => d.name.toLowerCase() === doctor.department.toLowerCase());
        if (dept) setSelectedDepartment(dept.id);
      }
    }
  }, [scheduleDoctorIdParam, doctors]);

  const filteredDoctors = selectedDepartment
    ? doctors.filter((d: any) => {
      const deptName = departments.find(dept => dept.id === selectedDepartment)?.name.toLowerCase() || '';
      const doctorDept = (d.department || '').toLowerCase();
      const doctorSpecialty = (d.specialty || d.specialization || '').toLowerCase();

      return doctorDept.includes(deptName) ||
        deptName.includes(doctorDept) ||
        doctorSpecialty.includes(deptName) ||
        deptName.includes(doctorSpecialty.replace('ist', '')); // Handle Cardiologist vs Cardiology
    })
    : doctors;

  const handleBookAppointment = async () => {
    try {
      const payload = {
        patientId: selectedPatient || (user?.role === 'patient' ? user.id : ''),
        doctorId: selectedDoctor,
        departmentId: selectedDepartment,
        date: selectedDate,
        timeSlot: selectedTime,
        tokenNumber: appointments.length + 1,
        status: user?.role === 'patient' ? 'pending' : 'Scheduled'
      };

      if (selectedAppointment && selectedAppointment.status === 'pending') {
        // Confirming a request
        await api.patch(`/appointments/${selectedAppointment.id}`, {
          ...payload,
          status: 'Scheduled'
        });
        toast.success('Appointment confirmed and scheduled!');
      } else {
        // New booking/request
        const response = await api.post('/appointments', payload);
        if (response.success) {
          toast.success(user?.role === 'patient' ? 'Appointment requested successfully!' : `Appointment booked successfully! Token Number: ${response.appointment.tokenNumber}`);
        }
      }

      setIsDialogOpen(false);
      setSelectedAppointment(null);
      setSelectedDepartment('');
      setSelectedDoctor('');
      setSelectedPatient('');
      setSelectedDate('');
      setSelectedTime('');
      refetchAppointments();
    } catch (error) {
      toast.error('Failed to book appointment');
      console.error('Booking error:', error);
    }
  };

  // When viewing a specific doctor's schedule (from URL or "Show Schedules"), filter by that doctor
  const scheduleDoctorId = scheduleDoctorIdParam != null ? String(scheduleDoctorIdParam) : null;

  const filteredAppointments = appointments.filter((app: any) => {
    // When viewing doctor's schedule from Doctors page, only show that doctor's appointments
    if (scheduleDoctorId != null && String(app.doctorId) !== String(scheduleDoctorId)) return false;

    // Basic role filtering (admin sees all)
    if (user?.role === 'patient' && String(app.patientId) !== String(user.id)) return false;
    if (user?.role === 'doctor' && String(app.doctorId) !== String(user.id)) return false;

    if (filterStatus === 'all') {
      return true;
    }
    return app.status.toLowerCase() === filterStatus.toLowerCase();
  });

  const getStatusBadge = (status: string) => {
    const styles: any = {
      'Scheduled': 'bg-info/10 text-info',
      'Pending': 'bg-warning/10 text-warning',
      'In Progress': 'bg-primary/10 text-primary',
      'Completed': 'bg-success/10 text-success',
      'Cancelled': 'bg-destructive/10 text-destructive',
      'scheduled': 'bg-info/10 text-info',
      'pending': 'bg-warning/10 text-warning',
      'in-progress': 'bg-primary/10 text-primary',
      'completed': 'bg-success/10 text-success',
      'cancelled': 'bg-destructive/10 text-destructive',
    };
    const icons: any = {
      'Scheduled': <Clock className="w-4 h-4" />,
      'Pending': <AlertCircle className="w-4 h-4" />,
      'In Progress': <Activity className="w-4 h-4" />,
      'Completed': <CheckCircle2 className="w-4 h-4" />,
      'Cancelled': <XCircle className="w-4 h-4" />,
      'scheduled': <Clock className="w-4 h-4" />,
      'pending': <AlertCircle className="w-4 h-4" />,
      'in-progress': <Activity className="w-4 h-4" />,
      'completed': <CheckCircle2 className="w-4 h-4" />,
      'cancelled': <XCircle className="w-4 h-4" />,
    };
    const s = status.toLowerCase();
    const style = styles[s] || styles['pending'];
    const icon = icons[s] || icons['pending'];

    return (
      <div className={cn("inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border border-current/10", style)}>
        {icon}
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </div>
    );
  };

  return (
    <DashboardLayout currentPath="/appointments">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground font-display">
            {scheduleDoctorId ? `${doctors.find((d: any) => String(d.id) === String(scheduleDoctorId))?.name ?? 'Doctor'}'s Schedule` : 'Appointments'}
          </h1>
          <p className="text-muted-foreground mt-1">
            {scheduleDoctorId ? 'Start consultations and mark appointments as done.' : 'Manage and schedule patient appointments'}
          </p>
          {scheduleDoctorId && (
            <Button variant="ghost" size="sm" className="mt-2 text-muted-foreground" onClick={() => navigate('/appointments')}>
              View all appointments
            </Button>
          )}
        </div>

        {user?.role !== 'doctor' && (
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="hero" size="lg" onClick={() => {
                setSelectedAppointment(null);
                setIsDialogOpen(true);
              }}>
                <Plus className="w-5 h-5 mr-2" />
                {user?.role === 'patient' ? 'Request Appointment' : 'Book Appointment'}
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle className="font-display">
                  {selectedAppointment?.status === 'pending' ? 'Confirm Appointment Request' :
                    user?.role === 'patient' ? 'Request New Appointment' : 'Book New Appointment'}
                </DialogTitle>
                <DialogDescription>
                  {selectedAppointment?.status === 'pending' ? 'Review and schedule the patient request.' :
                    'Select a department, doctor, and time slot for the appointment.'}
                </DialogDescription>
              </DialogHeader>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
                <div className="space-y-2">
                  <Label>Select Patient *</Label>
                  <Select
                    value={selectedPatient}
                    onValueChange={setSelectedPatient}
                    disabled={user?.role === 'patient' || selectedAppointment?.status === 'pending'}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Choose patient" />
                    </SelectTrigger>
                    <SelectContent>
                      {patients.map((patient: any) => (
                        <SelectItem key={patient.id} value={String(patient.id)}>
                          {patient.fullName || patient.name} ({patient.patientId || `PAT-${patient.id}`})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Select Department *</Label>
                  <Select value={selectedDepartment} onValueChange={(val) => {
                    setSelectedDepartment(val);
                    setSelectedDoctor('');
                  }}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose department" />
                    </SelectTrigger>
                    <SelectContent>
                      {departments.map(dept => (
                        <SelectItem key={dept.id} value={dept.id}>
                          {dept.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Select Doctor *</Label>
                  <Select value={selectedDoctor} onValueChange={setSelectedDoctor}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose doctor" />
                    </SelectTrigger>
                    <SelectContent>
                      {filteredDoctors.map((doctor: any) => (
                        <SelectItem key={doctor.id} value={String(doctor.id)} disabled={doctor.unavailable}>
                          {doctor.name} {doctor.unavailable && '(Unavailable)'}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Appointment Date *</Label>
                  <Input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                  />
                </div>

                <div className="md:col-span-2 space-y-2">
                  <Label>Select Time Slot *</Label>
                  <div className="grid grid-cols-4 md:grid-cols-7 gap-2">
                    {timeSlots.map(slot => (
                      <button
                        key={slot}
                        type="button"
                        onClick={() => setSelectedTime(slot)}
                        className={cn(
                          "px-3 py-2 text-sm rounded-lg border transition-all",
                          selectedTime === slot
                            ? "bg-primary text-primary-foreground border-primary"
                            : "border-border hover:border-primary hover:bg-secondary"
                        )}
                      >
                        {slot}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
                <Button
                  variant="hero"
                  onClick={handleBookAppointment}
                  disabled={!selectedPatient || !selectedDoctor || !selectedDate || !selectedTime}
                >
                  {selectedAppointment?.status === 'pending' ? 'Confirm & Book' :
                    user?.role === 'patient' ? 'Send Request' : 'Confirm Booking'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 mb-6">
        <Button
          variant={filterStatus === 'all' ? 'hero' : 'outline'}
          size="sm"
          onClick={() => setFilterStatus('all')}
          className="rounded-full"
        >
          {user?.role === 'patient' ? 'My History' : 'All Appointments'}
        </Button>
        <Button
          variant={filterStatus === 'pending' ? 'hero' : 'outline'}
          size="sm"
          onClick={() => setFilterStatus('pending')}
          className="rounded-full"
        >
          Pending {user?.role === 'receptionist' && 'Requests'}
        </Button>
        <Button
          variant={filterStatus === 'scheduled' ? 'hero' : 'outline'}
          size="sm"
          onClick={() => setFilterStatus('scheduled')}
          className="rounded-full"
        >
          Scheduled
        </Button>
        <Button
          variant={filterStatus === 'in-progress' ? 'hero' : 'outline'}
          size="sm"
          onClick={() => setFilterStatus('in-progress')}
          className="rounded-full"
        >
          In Progress
        </Button>
        <Button
          variant={filterStatus === 'completed' ? 'hero' : 'outline'}
          size="sm"
          onClick={() => setFilterStatus('completed')}
          className="rounded-full"
        >
          Completed
        </Button>
      </div>

      {/* Connection error */}
      {appointmentsError && (
        <div className="mb-6 p-4 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive">
          <p className="font-medium">Could not load appointments.</p>
          <p className="text-sm mt-1">Make sure the server is running (e.g. <code className="bg-black/10 px-1 rounded">npm run start</code> from the project folder). API: http://localhost:3001</p>
        </div>
      )}

      {/* Appointments List */}
      <div className="bg-card rounded-2xl border border-border/50 shadow-soft overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="text-left p-4 text-sm font-medium text-muted-foreground">Token</th>
                <th className="text-left p-4 text-sm font-medium text-muted-foreground">Patient</th>
                <th className="text-left p-4 text-sm font-medium text-muted-foreground">Doctor</th>
                <th className="text-left p-4 text-sm font-medium text-muted-foreground">Time</th>
                <th className="text-left p-4 text-sm font-medium text-muted-foreground">Status</th>
                <th className="text-left p-4 text-sm font-medium text-muted-foreground" aria-label="Action"></th>
              </tr>
            </thead>
            <tbody>
              {filteredAppointments.map((appointment: any) => {
                const patient = patients.find((p: any) => String(p.id) === String(appointment.patientId));
                const doctor = doctors.find((d: any) => String(d.id) === String(appointment.doctorId));
                return (
                  <tr key={appointment.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                    <td className="p-4">
                      <span className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-primary/10 text-primary font-bold">
                        #{appointment.tokenNumber}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center text-primary font-medium">
                          {(patient?.fullName || patient?.name)?.charAt(0)}
                        </div>
                        <div>
                          <p className="font-medium text-foreground">{patient?.fullName || patient?.name}</p>
                          <p className="text-sm text-muted-foreground">{patient?.patientId || `PAT-${patient?.id}`}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <Stethoscope className="w-5 h-5 text-primary" />
                        <div>
                          <p className="font-medium text-foreground">{doctor?.name}</p>
                          <p className="text-sm text-muted-foreground">{doctor?.specialty || doctor?.department}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Clock className="w-4 h-4" />
                        <span>{appointment.timeSlot}</span>
                      </div>
                    </td>
                    <td className="p-4">
                      {getStatusBadge(appointment.status)}
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex justify-end gap-2">
                        {user?.role === 'receptionist' && appointment.status.toLowerCase() === 'pending' && (
                          <Button
                            variant={"success" as any}
                            size="sm"
                            onClick={() => {
                              setSelectedAppointment(appointment);
                              setSelectedPatient(String(appointment.patientId));
                              setSelectedDoctor(String(appointment.doctorId));
                              setSelectedDepartment(appointment.departmentId);
                              setIsDialogOpen(true);
                            }}
                          >
                            Confirm
                          </Button>
                        )}
                        {((user?.role === 'doctor') || scheduleDoctorId != null) && appointment.status.toLowerCase() === 'scheduled' && (
                          <Button
                            variant="hero"
                            size="sm"
                            onClick={() => handleStartConsultation(appointment)}
                          >
                            <Play className="w-4 h-4 mr-1" />
                            Start
                          </Button>
                        )}
                        {((user?.role === 'doctor') || scheduleDoctorId != null) && appointment.status.toLowerCase() === 'in-progress' && (
                          <Button
                            variant="success"
                            size="sm"
                            onClick={() => handleMarkAsDone(appointment)}
                          >
                            <CheckCircle2 className="w-4 h-4 mr-1" />
                            Mark as Done
                          </Button>
                        )}
                        {appointment.status.toLowerCase() === 'completed' && user?.role === 'patient' && (
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleViewBill(appointment)}
                            >
                              View Bill
                            </Button>
                            <Button
                              variant="hero"
                              size="sm"
                              onClick={() => {
                                setFeedbackAppointment(appointment);
                                setIsFeedbackOpen(true);
                              }}
                            >
                              Rate Doctor
                            </Button>
                          </div>
                        )}
                        {appointment.status.toLowerCase() === 'completed' && user?.role === 'doctor' ? (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleViewFeedback(appointment.id)}
                          >
                            <Star className="w-4 h-4 mr-1 text-warning" />
                            View Feedback
                          </Button>
                        ) : (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setViewDetailsAppointment(appointment);
                              setIsViewDetailsOpen(true);
                            }}
                          >
                            View <ChevronRight className="w-4 h-4 ml-1" />
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filteredAppointments.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-muted-foreground">
                    {appointmentsError
                      ? 'Could not load appointments. Check that the server is running.'
                      : appointments.length === 0
                        ? 'No appointments yet. Book one or ask reception to schedule.'
                        : 'No appointments found matching your filters.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      {/* Feedback Modal */}
      <Dialog open={isFeedbackOpen} onOpenChange={setIsFeedbackOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="font-display">Rate Your Consultation</DialogTitle>
            <DialogDescription>
              Your feedback helps Dr. {appointments.find(a => a.id === feedbackAppointment?.id)?.doctorName} improve.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Rating (1-5)</Label>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    className={cn(
                      "p-2 rounded-lg transition-all",
                      rating >= star ? "text-warning scale-110" : "text-muted-foreground opacity-50"
                    )}
                  >
                    <CheckCircle2 className={cn("w-6 h-6", rating >= star ? "fill-current" : "")} />
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="comment">Your Comments</Label>
              <Textarea
                id="comment"
                placeholder="How was your experience?"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                className="h-32"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsFeedbackOpen(false)}>Cancel</Button>
            <Button variant="hero" onClick={handleSubmitFeedback}>Submit Feedback</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bill View Modal for Patient */}
      <Dialog open={showBillModal} onOpenChange={setShowBillModal}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="font-display">Your Appointment Bill</DialogTitle>
          </DialogHeader>
          {patientBill && (
            <div className="py-4 space-y-4">
              <div className="p-6 rounded-2xl bg-primary/5 border border-primary/10 shadow-inner">
                <div className="flex justify-between mb-3">
                  <span className="text-muted-foreground text-sm uppercase tracking-wider">Bill #</span>
                  <span className="font-mono font-bold">#BILL-{patientBill.appointmentId}</span>
                </div>
                <div className="space-y-2 text-sm text-muted-foreground pb-4 border-b border-primary/10 mb-4">
                  <div className="flex justify-between">
                    <span>Doctor:</span>
                    <span className="text-foreground font-medium">{patientBill.doctorName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Date:</span>
                    <span className="text-foreground">{new Date(patientBill.date).toLocaleDateString()}</span>
                  </div>
                </div>
                <div className="flex justify-between font-bold text-xl">
                  <span>Total Due:</span>
                  <span className="text-primary">Rs. {patientBill.amount.toLocaleString()}</span>
                </div>
              </div>
              <Button onClick={() => {
                handleDownloadPDF(patientBill);
                setShowBillModal(false);
              }} className="w-full h-12 rounded-xl">Download PDF</Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
      {/* View Feedback Modal for Doctor */}
      <Dialog open={isViewFeedbackOpen} onOpenChange={setIsViewFeedbackOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="font-display">Patient Feedback</DialogTitle>
          </DialogHeader>
          {viewFeedback && (
            <div className="py-4 space-y-6">
              <div className="p-6 rounded-2xl bg-warning/5 border border-warning/10 text-center">
                <div className="flex justify-center gap-1 mb-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={cn(
                        "w-8 h-8",
                        viewFeedback.rating >= star ? "fill-warning text-warning" : "text-muted-foreground opacity-30"
                      )}
                    />
                  ))}
                </div>
                <p className="text-2xl font-bold text-foreground">{viewFeedback.rating} / 5</p>
                <p className="text-sm text-muted-foreground uppercase tracking-widest mt-1">Patient Rating</p>
              </div>

              <div className="space-y-2">
                <Label className="text-muted-foreground">Patient Comments</Label>
                <div className="p-4 rounded-xl bg-muted/30 border border-border italic text-foreground quotes">
                  "{viewFeedback.comment}"
                </div>
              </div>

              <div className="pt-2 text-xs text-muted-foreground flex justify-between">
                <span>Submitted by: {viewFeedback.patientName}</span>
                <span>{new Date(viewFeedback.date || new Date()).toLocaleDateString()}</span>
              </div>

              <Button onClick={() => setIsViewFeedbackOpen(false)} className="w-full h-12 rounded-xl">Close</Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* View Details Dialog */}
      <Dialog open={isViewDetailsOpen} onOpenChange={setIsViewDetailsOpen}>
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle className="font-display">Appointment Details</DialogTitle>
            <DialogDescription>
              Complete information about this appointment
            </DialogDescription>
          </DialogHeader>
          {viewDetailsAppointment && (() => {
            const patient = patients.find((p: any) => String(p.id) === String(viewDetailsAppointment.patientId));
            const doctor = doctors.find((d: any) => String(d.id) === String(viewDetailsAppointment.doctorId));
            const department = departments.find((dept: any) => dept.id === viewDetailsAppointment.departmentId);

            return (
              <div className="py-3 space-y-4">
                {/* Token Number */}
                <div className="flex items-center justify-center">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-xl bg-primary/10 text-primary">
                    <div className="text-center">
                      <div className="text-[10px] font-medium opacity-70">Token</div>
                      <div className="text-xl font-bold">#{viewDetailsAppointment.tokenNumber}</div>
                    </div>
                  </div>
                </div>

                {/* Status Badge */}
                <div className="flex justify-center">
                  {getStatusBadge(viewDetailsAppointment.status)}
                </div>

                {/* Patient Information */}
                <div className="space-y-2 p-3 rounded-xl bg-muted/30 border border-border">
                  <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground uppercase tracking-wider">
                    <User className="w-4 h-4" />
                    Patient Information
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <div className="text-xs text-muted-foreground mb-1">Name</div>
                      <div className="font-medium">{patient?.fullName || patient?.name}</div>
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground mb-1">Patient ID</div>
                      <div className="font-medium font-mono">{patient?.patientId || `PAT-${patient?.id}`}</div>
                    </div>
                    {patient?.contact && (
                      <div className="col-span-2">
                        <div className="text-xs text-muted-foreground mb-1">Contact</div>
                        <div className="font-medium">{patient.contact}</div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Doctor Information */}
                <div className="space-y-3 p-4 rounded-xl bg-muted/30 border border-border">
                  <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground uppercase tracking-wider">
                    <Stethoscope className="w-4 h-4" />
                    Doctor Information
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <div className="text-xs text-muted-foreground mb-1">Name</div>
                      <div className="font-medium">{doctor?.name}</div>
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground mb-1">Specialty</div>
                      <div className="font-medium">{doctor?.specialty || doctor?.specialization || doctor?.department}</div>
                    </div>
                  </div>
                </div>

                {/* Appointment Schedule */}
                <div className="space-y-3 p-4 rounded-xl bg-muted/30 border border-border">
                  <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground uppercase tracking-wider">
                    <Calendar className="w-4 h-4" />
                    Schedule
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <div className="text-xs text-muted-foreground mb-1">Date</div>
                      <div className="font-medium">{viewDetailsAppointment.date ? new Date(viewDetailsAppointment.date).toLocaleDateString() : 'Not set'}</div>
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground mb-1">Time Slot</div>
                      <div className="font-medium flex items-center gap-1">
                        <Clock className="w-4 h-4 text-primary" />
                        {viewDetailsAppointment.timeSlot}
                      </div>
                    </div>
                    {department && (
                      <div className="col-span-2">
                        <div className="text-xs text-muted-foreground mb-1">Department</div>
                        <div className="font-medium">{department.name}</div>
                      </div>
                    )}
                  </div>
                </div>

                <Button onClick={() => setIsViewDetailsOpen(false)} className="w-full h-12 rounded-xl">
                  Close
                </Button>
              </div>
            );
          })()}
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
