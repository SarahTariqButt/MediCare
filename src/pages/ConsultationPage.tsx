import { useState, useEffect } from 'react';
import DashboardLayout from '@/layouts/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/context/AuthContext';
import {
  User,
  Clock,
  Phone,
  Droplet,
  FileText,
  Stethoscope,
  Pill,
  Plus,
  X,
  Save,
  ChevronLeft,
  ChevronRight,
  Activity
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export default function ConsultationPage() {
  const { user } = useAuth();
  const { data: appointmentsRaw = [], refetch: refetchAppointments } = useQuery({
    queryKey: ['appointments'],
    queryFn: () => api.get('/appointments'),
  });
  const appointments = Array.isArray(appointmentsRaw) ? appointmentsRaw : [];

  const { data: patientsRaw = [] } = useQuery({
    queryKey: ['patients'],
    queryFn: () => api.get('/patients'),
  });
  const patients = Array.isArray(patientsRaw) ? patientsRaw : [];

  const [selectedAppointment, setSelectedAppointment] = useState<any>(null);
  const [diagnosis, setDiagnosis] = useState('');
  const [notes, setNotes] = useState('');
  const [symptoms, setSymptoms] = useState<string[]>([]);
  const [newSymptom, setNewSymptom] = useState('');
  const [prescriptions, setPrescriptions] = useState<Array<{ medicine: string; dosage: string; frequency: string; duration: string }>>([]);

  // Filter appointments for the current doctor
  const myAppointments = appointments.filter((a: any) =>
    String(a.doctorId) === String(user?.id) || user?.role === 'receptionist'
  );

  const queuedAppointments = myAppointments.filter((a: any) => a.status?.toLowerCase() === 'scheduled');
  const currentAppointment = myAppointments.find((a: any) => a.status?.toLowerCase() === 'in-progress');

  useEffect(() => {
    if (currentAppointment && !selectedAppointment) {
      setSelectedAppointment(currentAppointment);
    } else if (queuedAppointments.length > 0 && !selectedAppointment && !currentAppointment) {
      setSelectedAppointment(queuedAppointments[0]);
    }
  }, [appointments, user]);

  const patient = patients.find((p: any) => String(p.id) === String(selectedAppointment?.patientId));

  const addSymptom = () => {
    if (newSymptom.trim()) {
      setSymptoms([...symptoms, newSymptom.trim()]);
      setNewSymptom('');
    }
  };

  const addPrescription = () => {
    setPrescriptions([...prescriptions, { medicine: '', dosage: '', frequency: '', duration: '' }]);
  };

  const updatePrescription = (index: number, field: string, value: string) => {
    const updated = [...prescriptions];
    updated[index] = { ...updated[index], [field]: value };
    setPrescriptions(updated);
  };

  const removePrescription = (index: number) => {
    setPrescriptions(prescriptions.filter((_, i) => i !== index));
  };

  const handleSaveConsultation = () => {
    if (!selectedAppointment) {
      toast.error('No appointment selected');
      return;
    }
    toast.success('Consultation saved successfully!');
  };

  const [showBill, setShowBill] = useState(false);
  const [generatedBill, setGeneratedBill] = useState<any>(null);

  const { data: feedbacks = [] } = useQuery({
    queryKey: ['feedback', user?.id],
    queryFn: () => api.get(`/feedback/${user?.id}`),
    enabled: !!user?.id,
  });

  const handleStartConsultation = async () => {
    if (!selectedAppointment) {
      toast.error('No appointment selected');
      return;
    }
    if (selectedAppointment.status?.toLowerCase() !== 'scheduled') {
      toast.error('Only scheduled appointments can be started');
      return;
    }
    try {
      await api.patch(`/appointments/${selectedAppointment.id}`, { status: 'in-progress' });
      toast.success('Consultation started!');
      refetchAppointments();
    } catch (error) {
      toast.error('Failed to start consultation');
      console.error(error);
    }
  };

  const handleCompleteConsultation = async () => {
    if (!selectedAppointment) {
      toast.error('No appointment selected');
      return;
    }
    if (selectedAppointment.status?.toLowerCase() !== 'in-progress') {
      toast.error('Start the consultation first before completing.');
      return;
    }
    try {
      // Create bill
      const billData = {
        appointmentId: selectedAppointment.id,
        patientId: selectedAppointment.patientId,
        patientName: patient?.fullName || patient?.name,
        doctorId: user?.id,
        doctorName: user?.name,
        amount: 1500 + (prescriptions.length * 200), // Random calculation
        details: diagnosis,
        date: new Date().toISOString()
      };

      await api.post('/bills', billData);
      setGeneratedBill(billData);

      await api.patch(`/appointments/${selectedAppointment.id}`, { status: 'completed' });
      toast.success('Consultation completed and bill generated!');
      setShowBill(true);
      setSelectedAppointment(null);
      refetchAppointments();
    } catch (error) {
      toast.error('Failed to complete consultation');
      console.error(error);
    }
  };

  return (
    <DashboardLayout currentPath="/consultation">
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Patient Queue */}
        <div className="lg:col-span-1">
          <div className="bg-card rounded-2xl border border-border/50 shadow-soft overflow-hidden">
            <div className="p-4 border-b border-border bg-muted/30">
              <h2 className="font-semibold text-foreground font-display">Patient Queue</h2>
              <p className="text-sm text-muted-foreground">{queuedAppointments.length + (currentAppointment ? 1 : 0)} patients waiting</p>
            </div>
            <div className="divide-y divide-border/50">
              {/* Current Patient */}
              {currentAppointment && (
                <div className={cn(
                  "p-4 cursor-pointer transition-colors",
                  selectedAppointment?.id === currentAppointment.id ? "bg-primary/5 border-l-4 border-l-primary" : "hover:bg-muted/30"
                )}
                  onClick={() => setSelectedAppointment(currentAppointment)}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-warning/20 text-warning flex items-center justify-center font-bold text-sm">
                      #{currentAppointment.tokenNumber}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-foreground truncate">
                        {(() => { const p = patients.find(x => x.id === currentAppointment.patientId); return p?.fullName || p?.name; })()}
                      </p>
                      <p className="text-xs text-warning flex items-center gap-1">
                        <Activity className="w-3 h-3" /> In Progress
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Queued Patients */}
              {queuedAppointments.map((appointment) => {
                const qPatient = patients.find(p => p.id === appointment.patientId);
                return (
                  <div
                    key={appointment.id}
                    className={cn(
                      "p-4 cursor-pointer transition-colors",
                      selectedAppointment?.id === appointment.id ? "bg-primary/5 border-l-4 border-l-primary" : "hover:bg-muted/30"
                    )}
                    onClick={() => setSelectedAppointment(appointment)}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center font-bold text-sm text-muted-foreground">
                        #{appointment.tokenNumber}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-foreground truncate">{qPatient?.fullName || qPatient?.name}</p>
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                          <Clock className="w-3 h-3" /> {appointment.timeSlot}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Main Consultation Area */}
        <div className="lg:col-span-3 space-y-6">
          {patient ? (
            <>
              {/* Patient Info Header */}
              <div className="bg-card rounded-2xl border border-border/50 shadow-soft p-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-primary flex items-center justify-center text-primary-foreground text-2xl font-bold">
                      {(patient.fullName || patient.name || '?').charAt(0)}
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-foreground font-display">{patient.fullName || patient.name}</h2>
                      <p className="text-muted-foreground">{patient.patientId}</p>
                      <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                        <span>{patient.age ?? '—'} years{patient.gender ? `, ${patient.gender}` : ''}</span>
                        {patient.bloodGroup && (
                          <span className="flex items-center gap-1 text-destructive">
                            <Droplet className="w-4 h-4" /> {patient.bloodGroup}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button variant={"outline" as any}>
                      <FileText className="w-4 h-4 mr-2" />
                      History
                    </Button>
                    <Button
                      variant={"success" as any}
                      onClick={handleStartConsultation}
                      disabled={selectedAppointment?.status?.toLowerCase() !== 'scheduled'}
                    >
                      <Activity className="w-4 h-4 mr-2" />
                      {selectedAppointment?.status?.toLowerCase() === 'in-progress' ? 'In progress' : 'Start Consultation'}
                    </Button>
                  </div>
                </div>
              </div>

              {/* Consultation Form */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Left Column - Diagnosis */}
                <div className="space-y-6">
                  {/* Symptoms */}
                  <div className="bg-card rounded-2xl border border-border/50 shadow-soft p-6">
                    <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2 font-display">
                      <Stethoscope className="w-5 h-5 text-primary" />
                      Symptoms
                    </h3>
                    <div className="flex gap-2 mb-3">
                      <Input
                        placeholder="Enter symptom..."
                        value={newSymptom}
                        onChange={(e) => setNewSymptom(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && addSymptom()}
                      />
                      <Button onClick={addSymptom} size={"icon" as any}>
                        <Plus className="w-4 h-4" />
                      </Button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {symptoms.map((symptom, index) => (
                        <span key={index} className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-secondary text-secondary-foreground text-sm">
                          {symptom}
                          <button onClick={() => setSymptoms(symptoms.filter((_, i) => i !== index))}>
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Diagnosis */}
                  <div className="bg-card rounded-2xl border border-border/50 shadow-soft p-6">
                    <h3 className="font-semibold text-foreground mb-4 font-display">Diagnosis</h3>
                    <Textarea
                      placeholder="Enter diagnosis..."
                      value={diagnosis}
                      onChange={(e) => setDiagnosis(e.target.value)}
                      rows={4}
                    />
                  </div>

                  {/* Notes */}
                  <div className="bg-card rounded-2xl border border-border/50 shadow-soft p-6">
                    <h3 className="font-semibold text-foreground mb-4 font-display">Clinical Notes</h3>
                    <Textarea
                      placeholder="Enter additional notes..."
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      rows={4}
                    />
                  </div>
                </div>

                {/* Right Column - Prescriptions */}
                <div className="space-y-6">
                  {/* Prescriptions */}
                  <div className="bg-card rounded-2xl border border-border/50 shadow-soft p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-semibold text-foreground flex items-center gap-2 font-display">
                        <Pill className="w-5 h-5 text-primary" />
                        Prescriptions
                      </h3>
                      <Button size={"sm" as any} variant={"outline" as any} onClick={addPrescription}>
                        <Plus className="w-4 h-4 mr-1" /> Add
                      </Button>
                    </div>
                    <div className="space-y-4">
                      {prescriptions.map((rx, index) => (
                        <div key={index} className="p-4 rounded-xl bg-muted/50 space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-muted-foreground">Medicine #{index + 1}</span>
                            <button onClick={() => removePrescription(index)} className="text-destructive hover:text-destructive/80">
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                          <Input
                            placeholder="Medicine name"
                            value={rx.medicine}
                            onChange={(e) => updatePrescription(index, 'medicine', e.target.value)}
                          />
                          <div className="grid grid-cols-3 gap-2">
                            <Input
                              placeholder="Dosage"
                              value={rx.dosage}
                              onChange={(e) => updatePrescription(index, 'dosage', e.target.value)}
                            />
                            <Input
                              placeholder="Frequency"
                              value={rx.frequency}
                              onChange={(e) => updatePrescription(index, 'frequency', e.target.value)}
                            />
                            <Input
                              placeholder="Duration"
                              value={rx.duration}
                              onChange={(e) => updatePrescription(index, 'duration', e.target.value)}
                            />
                          </div>
                        </div>
                      ))}
                      {prescriptions.length === 0 && (
                        <p className="text-center text-muted-foreground py-4">No prescriptions added yet</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-4">
                <Button variant={"outline" as any} size={"lg" as any} onClick={handleSaveConsultation}>
                  <Save className="w-5 h-5 mr-2" />
                  Save Draft
                </Button>
                <Button
                  variant={"hero" as any}
                  size={"lg" as any}
                  onClick={handleCompleteConsultation}
                  disabled={selectedAppointment?.status?.toLowerCase() !== 'in-progress'}
                >
                  Complete Consultation
                  <ChevronRight className="w-5 h-5 ml-2" />
                </Button>
              </div>
            </>
          ) : (
            <div className="bg-card rounded-2xl border border-border/50 shadow-soft p-12 text-center">
              <User className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-foreground mb-2 font-display">No Patient Selected</h3>
              <p className="text-muted-foreground">Select a patient from the queue to start consultation.</p>
            </div>
          )}

          {/* Feedback Section for Doctors */}
          <div className="bg-card rounded-2xl border border-border/50 shadow-soft p-6 mt-8">
            <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2 font-display">
              <User className="w-5 h-5 text-primary" />
              Patient Feedback & Ratings
            </h3>
            <div className="space-y-4">
              {feedbacks.length > 0 ? feedbacks.map((f: any) => (
                <div key={f.id} className="p-4 rounded-xl bg-muted/30 border border-border/30">
                  <div className="flex justify-between items-start mb-2">
                    <span className="font-medium text-foreground">{f.patientName}</span>
                    <div className="flex gap-1 text-warning">
                      {Array.from({ length: f.rating }).map((_, i) => (
                        <Activity key={i} className="w-4 h-4 fill-current" />
                      ))}
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground italic">"{f.comment}"</p>
                  <p className="text-xs text-muted-foreground mt-2">{new Date(f.date).toLocaleDateString()}</p>
                </div>
              )) : (
                <p className="text-center text-muted-foreground py-4">No feedback received yet.</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Bill Generation Modal */}
      <Dialog open={showBill} onOpenChange={setShowBill}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="font-display">Patient Bill Generated</DialogTitle>
          </DialogHeader>
          {generatedBill && (
            <div className="py-4 space-y-4">
              <div className="p-4 rounded-xl bg-primary/5 border border-primary/10">
                <div className="flex justify-between mb-2">
                  <span className="text-muted-foreground">Bill ID:</span>
                  <span className="font-medium">#BILL-{generatedBill.appointmentId}</span>
                </div>
                <div className="flex justify-between mb-2">
                  <span className="text-muted-foreground">Patient:</span>
                  <span className="font-medium">{generatedBill.patientName}</span>
                </div>
                <div className="flex justify-between font-bold text-lg mt-4 pt-4 border-t border-primary/10">
                  <span>Total Amount:</span>
                  <span className="text-primary">Rs. {generatedBill.amount.toLocaleString()}</span>
                </div>
              </div>
              <p className="text-sm text-muted-foreground text-center">
                Tell the patient to submit this at the billing counter.
              </p>
              <Button onClick={() => setShowBill(false)} className="w-full">Close & Print</Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
