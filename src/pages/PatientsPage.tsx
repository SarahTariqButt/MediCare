import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import DashboardLayout from '@/layouts/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Search,
  Plus,
  User,
  Phone,
  Mail,
  MapPin,
  Calendar,
  Droplet,
  FileText,
  MoreVertical,
  Eye
} from 'lucide-react';
import { Patient } from '@/types/hms';
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
import { toast } from 'sonner';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';

function PatientCard({ patient, onView }: { patient: any; onView: (patient: any) => void;[key: string]: any }) {
  const patientId = patient.patientId || `PAT-Backend-${patient.id}`;
  const patientName = patient.fullName || patient.name;

  return (
    <div className="bg-card rounded-2xl border border-border/50 shadow-soft p-6 card-hover">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-xl bg-gradient-primary flex items-center justify-center text-primary-foreground text-xl font-semibold">
            {patientName.charAt(0)}
          </div>
          <div>
            <h3 className="font-semibold text-foreground">{patientName}</h3>
            <p className="text-sm text-muted-foreground">{patientId}</p>
          </div>
        </div>
      </div>

      <div className="space-y-3 mb-4">
        <div className="flex items-center gap-3 text-sm">
          <User className="w-4 h-4 text-muted-foreground" />
          <span className="text-muted-foreground">{patient.age} years, <span className="capitalize">{patient.gender || 'Not specified'}</span></span>
        </div>
        <div className="flex items-center gap-3 text-sm">
          <Phone className="w-4 h-4 text-muted-foreground" />
          <span className="text-muted-foreground">{patient.phone}</span>
        </div>
        <div className="flex items-center gap-3 text-sm">
          <FileText className="w-4 h-4 text-muted-foreground" />
          <span className="text-muted-foreground">CNIC: {patient.cnic || 'N/A'}</span>
        </div>
        {patient.bloodGroup && (
          <div className="flex items-center gap-3 text-sm">
            <Droplet className="w-4 h-4 text-destructive" />
            <span className="text-muted-foreground">Blood Group: {patient.bloodGroup}</span>
          </div>
        )}
      </div>

      <div className="flex gap-2">
        <Button variant="hero" size="sm" className="flex-1" onClick={() => onView(patient)}>
          <Eye className="w-4 h-4 mr-2" />
          View Full Profile
        </Button>
      </div>
    </div>
  );
}

export default function PatientsPage() {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newPatient, setNewPatient] = useState({
    fullName: '',
    cnic: '',
    age: '',
    gender: 'male' as 'male' | 'female' | 'other',
    phone: '',
    email: '',
    address: '',
    bloodGroup: '',
    emergencyContact: '',
  });

  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [viewingPatient, setViewingPatient] = useState<any>(null);

  const handleViewDetails = (patient: any) => {
    setViewingPatient(patient);
    setIsViewDialogOpen(true);
  };

  const { data: patients = [], refetch } = useQuery({
    queryKey: ['patients'],
    queryFn: () => api.get('/patients'),
  });

  const filteredPatients = patients.filter((patient: any) => {
    const name = patient.fullName || patient.name || '';
    const patientId = patient.patientId || '';
    const cnic = patient.cnic || '';
    const phone = patient.phone || '';

    return name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      patientId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      cnic.includes(searchQuery) ||
      phone.includes(searchQuery);
  });

  const handleRegisterPatient = async () => {
    try {
      const response = await api.post('/patients', newPatient);
      if (response.success) {
        toast.success(`Patient registered successfully!`);
        setIsDialogOpen(false);
        setNewPatient({
          fullName: '',
          cnic: '',
          age: '',
          gender: 'male',
          phone: '',
          email: '',
          address: '',
          bloodGroup: '',
          emergencyContact: '',
        });
        refetch();
      }
    } catch (error) {
      toast.error('Failed to register patient');
      console.error('Registration error:', error);
    }
  };

  return (
    <DashboardLayout currentPath="/patients">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground font-display">Patients</h1>
          <p className="text-muted-foreground mt-1">Manage patient records and registrations</p>
        </div>

        {user?.role === 'receptionist' && (
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="hero" size="lg">
                <Plus className="w-5 h-5 mr-2" />
                Register Patient
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle className="font-display">Register New Patient</DialogTitle>
                <DialogDescription>
                  Enter the patient's information to create a new record.
                </DialogDescription>
              </DialogHeader>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="fullName">Full Name *</Label>
                  <Input
                    id="fullName"
                    placeholder="Enter full name"
                    value={newPatient.fullName}
                    onChange={(e) => setNewPatient({ ...newPatient, fullName: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="cnic">CNIC *</Label>
                  <Input
                    id="cnic"
                    placeholder="XXXXX-XXXXXXX-X"
                    value={newPatient.cnic}
                    onChange={(e) => setNewPatient({ ...newPatient, cnic: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="age">Age *</Label>
                  <Input
                    id="age"
                    type="number"
                    placeholder="Enter age"
                    value={newPatient.age}
                    onChange={(e) => setNewPatient({ ...newPatient, age: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="gender">Gender *</Label>
                  <Select
                    value={newPatient.gender}
                    onValueChange={(value: 'male' | 'female' | 'other') => setNewPatient({ ...newPatient, gender: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select gender" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="male">Male</SelectItem>
                      <SelectItem value="female">Female</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number *</Label>
                  <Input
                    id="phone"
                    placeholder="03XX-XXXXXXX"
                    value={newPatient.phone}
                    onChange={(e) => setNewPatient({ ...newPatient, phone: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="email@example.com"
                    value={newPatient.email}
                    onChange={(e) => setNewPatient({ ...newPatient, email: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bloodGroup">Blood Group</Label>
                  <Select
                    value={newPatient.bloodGroup}
                    onValueChange={(value) => setNewPatient({ ...newPatient, bloodGroup: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select blood group" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="A+">A+</SelectItem>
                      <SelectItem value="A-">A-</SelectItem>
                      <SelectItem value="B+">B+</SelectItem>
                      <SelectItem value="B-">B-</SelectItem>
                      <SelectItem value="AB+">AB+</SelectItem>
                      <SelectItem value="AB-">AB-</SelectItem>
                      <SelectItem value="O+">O+</SelectItem>
                      <SelectItem value="O-">O-</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="emergency">Emergency Contact</Label>
                  <Input
                    id="emergency"
                    placeholder="03XX-XXXXXXX"
                    value={newPatient.emergencyContact}
                    onChange={(e) => setNewPatient({ ...newPatient, emergencyContact: e.target.value })}
                  />
                </div>

                <div className="md:col-span-2 space-y-2">
                  <Label htmlFor="address">Address *</Label>
                  <Input
                    id="address"
                    placeholder="Enter complete address"
                    value={newPatient.address}
                    onChange={(e) => setNewPatient({ ...newPatient, address: e.target.value })}
                  />
                </div>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
                <Button variant="hero" onClick={handleRegisterPatient}>
                  Register Patient
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Search */}
      <div className="mb-6">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input
            placeholder="Search by name, ID, CNIC, or phone..."
            className="pl-10 h-12"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Patients Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredPatients.map((patient: any) => (
          <PatientCard key={patient.id} patient={patient} onView={handleViewDetails} />
        ))}
      </div>

      {filteredPatients.length === 0 && (
        <div className="text-center py-12">
          <User className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-foreground mb-2">No patients found</h3>
          <p className="text-muted-foreground">Try adjusting your search or register a new patient.</p>
        </div>
      )}

      {/* View Details Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="font-display">Patient Profile Details</DialogTitle>
          </DialogHeader>

          {viewingPatient && (
            <div className="py-6 space-y-8">
              {/* Profile Header */}
              <div className="flex items-center gap-6 pb-6 border-b border-border/50">
                <div className="w-24 h-24 rounded-3xl bg-gradient-primary flex items-center justify-center text-primary-foreground text-3xl font-bold shadow-soft">
                  {(viewingPatient.fullName || viewingPatient.name).charAt(0)}
                </div>
                <div className="space-y-1">
                  <h2 className="text-3xl font-bold text-foreground font-display">
                    {viewingPatient.fullName || viewingPatient.name}
                  </h2>
                  <div className="flex items-center gap-2">
                    <span className="px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold uppercase tracking-wider border border-primary/10">
                      {viewingPatient.patientId || `PAT-${viewingPatient.id}`}
                    </span>
                    <span className="text-muted-foreground">•</span>
                    <span className="text-muted-foreground text-sm">
                      Registered on {new Date().toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>

              {/* Info Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="text-sm font-bold text-primary uppercase tracking-widest mb-4">Personal Information</h3>
                  <div className="grid gap-4">
                    <div className="flex items-center justify-between p-3 rounded-xl bg-muted/30 border border-border/50">
                      <span className="text-sm text-muted-foreground">Age</span>
                      <span className="font-medium">{viewingPatient.age} Years</span>
                    </div>
                    <div className="flex items-center justify-between p-3 rounded-xl bg-muted/30 border border-border/50">
                      <span className="text-sm text-muted-foreground">Gender</span>
                      <span className="font-medium capitalize">{viewingPatient.gender}</span>
                    </div>
                    <div className="flex items-center justify-between p-3 rounded-xl bg-muted/30 border border-border/50">
                      <span className="text-sm text-muted-foreground">Blood Group</span>
                      <span className="font-medium text-destructive">{viewingPatient.bloodGroup || 'N/A'}</span>
                    </div>
                    <div className="flex items-center justify-between p-3 rounded-xl bg-muted/30 border border-border/50">
                      <span className="text-sm text-muted-foreground">CNIC</span>
                      <span className="font-medium">{viewingPatient.cnic || 'N/A'}</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-sm font-bold text-primary uppercase tracking-widest mb-4">Contact Details</h3>
                  <div className="grid gap-4">
                    <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/30 border border-border/50">
                      <Phone className="w-5 h-5 text-primary" />
                      <div>
                        <p className="text-xs text-muted-foreground">Phone</p>
                        <p className="font-medium">{viewingPatient.phone}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/30 border border-border/50">
                      <Mail className="w-5 h-5 text-primary" />
                      <div>
                        <p className="text-xs text-muted-foreground">Email</p>
                        <p className="font-medium">{viewingPatient.email || 'N/A'}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/30 border border-border/50">
                      <MapPin className="w-5 h-5 text-primary" />
                      <div>
                        <p className="text-xs text-muted-foreground">Address</p>
                        <p className="font-medium">{viewingPatient.address || 'N/A'}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/30 border border-border/50">
                      <User className="w-5 h-5 text-primary" />
                      <div>
                        <p className="text-xs text-muted-foreground">Emergency Contact</p>
                        <p className="font-medium">{viewingPatient.emergencyContact || 'N/A'}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          <DialogFooter className="border-t border-border pt-6">
            <Button variant="hero" onClick={() => setIsViewDialogOpen(false)} className="w-full h-12 rounded-xl">
              Close Profile
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
