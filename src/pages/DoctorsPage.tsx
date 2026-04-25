import { useState } from 'react';
import DashboardLayout from '@/layouts/DashboardLayout';
import { Button } from '@/components/ui/button';
import {
    Plus,
    Search,
    Stethoscope,
    AlertCircle,
    CheckCircle2,
    Clock,
    MoreVertical,
    Mail,
    Phone,
    Calendar
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import { generateDoctorWithAvatar } from '@/lib/avatarUtils';
import { cn } from '@/lib/utils';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function DoctorsPage() {
    const { user } = useAuth();
    const queryClient = useQueryClient();
    const navigate = useNavigate();
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    const [newDoctor, setNewDoctor] = useState({
        name: '',
        specialty: '',
        department: '',
        email: '',
        phone: '',
        available: true,
    });

    const { data: doctors = [], isLoading } = useQuery({
        queryKey: ['doctors'],
        queryFn: () => api.get('/doctors'),
    });

    const generateDoctorMutation = useMutation({
        mutationFn: (doctor: any) => api.post('/doctors', doctor),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['doctors'] });
            toast.success('Doctor added successfully!');
            setIsDialogOpen(false);
            setNewDoctor({
                name: '',
                specialty: '',
                department: '',
                email: '',
                phone: '',
                available: true,
            });
        },
        onError: () => {
            toast.error('Failed to add doctor');
        }
    });

    const handleAddDoctor = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newDoctor.name || !newDoctor.specialty) {
            toast.error('Please fill in name and specialty');
            return;
        }
        // Generate doctor with gender-aware avatar
        const doctorWithAvatar = generateDoctorWithAvatar(newDoctor);
        generateDoctorMutation.mutate(doctorWithAvatar);
    };

    const filteredDoctors = doctors.filter((doc: any) =>
        doc.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        doc.specialty.toLowerCase().includes(searchTerm.toLowerCase()) ||
        doc.department?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <DashboardLayout currentPath="/doctors">
            <div className="p-6 md:p-8">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-foreground font-display">Doctors Management</h1>
                        <p className="text-muted-foreground mt-1 text-sm md:text-base">View and manage hospital medical staff.</p>
                    </div>

                    {user?.role === 'receptionist' && (
                        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                            <DialogTrigger asChild>
                                <Button className="bg-gradient-primary shadow-glow hover:shadow-lifted transition-all">
                                    <Plus className="w-4 h-4 mr-2" />
                                    Add New Doctor
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-[425px]">
                                <DialogHeader>
                                    <DialogTitle>Add New Doctor</DialogTitle>
                                </DialogHeader>
                                <form onSubmit={handleAddDoctor} className="space-y-4 py-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="name">Full Name</Label>
                                        <Input
                                            id="name"
                                            placeholder="Dr. John Smith"
                                            value={newDoctor.name}
                                            onChange={(e) => setNewDoctor({ ...newDoctor, name: e.target.value })}
                                        />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="specialty">Specialty</Label>
                                            <Input
                                                id="specialty"
                                                placeholder="Cardiologist"
                                                value={newDoctor.specialty}
                                                onChange={(e) => setNewDoctor({ ...newDoctor, specialty: e.target.value })}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="department">Department</Label>
                                            <Input
                                                id="department"
                                                placeholder="Cardiology"
                                                value={newDoctor.department}
                                                onChange={(e) => setNewDoctor({ ...newDoctor, department: e.target.value })}
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="email">Email</Label>
                                        <Input
                                            id="email"
                                            type="email"
                                            placeholder="john.smith@medicare.com"
                                            value={newDoctor.email}
                                            onChange={(e) => setNewDoctor({ ...newDoctor, email: e.target.value })}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="phone">Phone Number</Label>
                                        <Input
                                            id="phone"
                                            placeholder="+92 3XX XXXXXXX"
                                            value={newDoctor.phone}
                                            onChange={(e) => setNewDoctor({ ...newDoctor, phone: e.target.value })}
                                        />
                                    </div>
                                    <Button type="submit" className="w-full mt-2" disabled={generateDoctorMutation.isPending}>
                                        {generateDoctorMutation.isPending ? 'Adding...' : 'Register Doctor'}
                                    </Button>
                                </form>
                            </DialogContent>
                        </Dialog>
                    )}
                </div>

                <div className="relative mb-8">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <Input
                        className="pl-10 h-12 bg-card border-border shadow-soft rounded-xl"
                        placeholder="Search doctors by name, specialty or department..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

                {isLoading ? (
                    <div className="flex justify-center py-20">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredDoctors.map((doctor: any) => (
                            <DoctorCard key={doctor.id} doctor={doctor} />
                        ))}
                        {filteredDoctors.length === 0 && (
                            <div className="col-span-full text-center py-20 bg-card rounded-2xl border border-dashed border-border">
                                <Stethoscope className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
                                <p className="text-muted-foreground">No doctors found matching your search.</p>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
}

function DoctorCard({ doctor }: { doctor: any }) {
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    return (
        <div className="bg-card rounded-2xl border border-border/50 shadow-soft p-6 card-hover group">
            <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-4">
                    {doctor.image ? (
                        <img 
                            src={doctor.image} 
                            alt={doctor.name}
                            className="w-16 h-16 rounded-2xl object-cover shadow-soft"
                        />
                    ) : (
                        <div className="w-16 h-16 rounded-2xl bg-gradient-primary flex items-center justify-center text-primary-foreground text-2xl font-bold shadow-soft">
                            {doctor.name.charAt(0)}
                        </div>
                    )}
                    <div>
                        <h3 className="font-bold text-foreground group-hover:text-primary transition-colors text-lg">{doctor.name}</h3>
                        <p className="text-sm text-primary font-medium">{doctor.specialty}</p>
                    </div>
                </div>
                <div className={cn(
                    "px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider flex items-center gap-1",
                    doctor.available
                        ? "bg-success/10 text-success"
                        : "bg-destructive/10 text-destructive"
                )}>
                    {doctor.available ? (
                        <><CheckCircle2 className="w-3 h-3" /> Online</>
                    ) : (
                        <><Clock className="w-3 h-3" /> Offline</>
                    )}
                </div>
            </div>

            <div className="space-y-3 mb-6">
                <div className="flex items-center gap-3 text-sm text-muted-foreground">
                    <Mail className="w-4 h-4 text-primary/60" />
                    <span>{doctor.email || 'N/A'}</span>
                </div>
                <div className="flex items-center gap-3 text-sm text-muted-foreground">
                    <Phone className="w-4 h-4 text-primary/60" />
                    <span>{doctor.phone || 'N/A'}</span>
                </div>
                <div className="flex items-center gap-3 text-sm text-muted-foreground">
                    <Calendar className="w-4 h-4 text-primary/60" />
                    <span>{doctor.department || 'General'} Department</span>
                </div>
            </div>

            <div className="flex gap-2">
                <Button
                    variant="outline"
                    className="flex-1 rounded-xl h-11 text-xs"
                    onClick={() => navigate(`/appointments?doctorId=${doctor.id}`)}
                >
                    Show Schedules
                </Button>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-11 w-11 rounded-xl">
                            <MoreVertical className="w-4 h-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Doctor Actions</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={async () => {
                            await api.patch(`/doctors/${doctor.id}`, { available: !doctor.available });
                            queryClient.invalidateQueries({ queryKey: ['doctors'] });
                            toast.success(`Doctor ${doctor.available ? 'marked offline' : 'marked online'}`);
                        }}>
                            {doctor.available ? 'Mark Offline' : 'Mark Online'}
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => toast.info('Edit details feature coming soon!')}>
                            Edit Details
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </div>
    );
}
