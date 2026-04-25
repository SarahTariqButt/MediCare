import { useState } from 'react';
import DashboardLayout from '@/layouts/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  FlaskConical,
  Search,
  Upload,
  Clock,
  CheckCircle2,
  AlertCircle,
  FileText,
  User,
  Calendar
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';

interface LabTestRequest {
  id: string;
  patientId: string;
  doctorId: string;
  testType: string;
  status: 'pending' | 'in-progress' | 'completed';
  requestedAt: Date;
  priority: 'normal' | 'urgent';
}

const mockLabTests: LabTestRequest[] = [
  { id: '1', patientId: '1', doctorId: '1', testType: 'Complete Blood Count', status: 'pending', requestedAt: new Date(), priority: 'urgent' },
  { id: '2', patientId: '2', doctorId: '2', testType: 'Blood Sugar', status: 'in-progress', requestedAt: new Date(), priority: 'normal' },
  { id: '3', patientId: '3', doctorId: '1', testType: 'Lipid Profile', status: 'completed', requestedAt: new Date(), priority: 'normal' },
  { id: '4', patientId: '1', doctorId: '5', testType: 'X-Ray Chest', status: 'pending', requestedAt: new Date(), priority: 'urgent' },
];

export default function LabPage() {
  const [filter, setFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const { data: patients = [] } = useQuery({
    queryKey: ['patients'],
    queryFn: () => api.get('/patients'),
  });

  const { data: doctors = [] } = useQuery({
    queryKey: ['doctors'],
    queryFn: () => api.get('/doctors'),
  });

  const filteredTests = mockLabTests.filter(test => {
    const matchesFilter = filter === 'all' || test.status === filter;
    const patient = patients.find((p: any) => String(p.id) === String(test.patientId));
    const matchesSearch = !searchQuery ||
      (patient?.fullName || patient?.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      test.testType.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const handleStartTest = (testId: string) => {
    toast.info(`Test ${testId} marked as in-progress`);
  };

  const handleUploadResult = (testId: string) => {
    toast.success(`Result for test ${testId} uploaded successfully!`);
  };

  const getStatusBadge = (status: string, priority: string) => {
    const styles = {
      'pending': priority === 'urgent' ? 'bg-destructive/10 text-destructive' : 'bg-warning/10 text-warning',
      'in-progress': 'bg-info/10 text-info',
      'completed': 'bg-success/10 text-success',
    };
    const icons = {
      'pending': <Clock className="w-4 h-4" />,
      'in-progress': <AlertCircle className="w-4 h-4" />,
      'completed': <CheckCircle2 className="w-4 h-4" />,
    };
    return (
      <span className={cn("px-3 py-1.5 rounded-full text-xs font-medium flex items-center gap-1.5", styles[status as keyof typeof styles])}>
        {icons[status as keyof typeof icons]}
        <span className="capitalize">{status.replace('-', ' ')}</span>
        {priority === 'urgent' && status === 'pending' && <span className="text-destructive">• URGENT</span>}
      </span>
    );
  };

  const pendingCount = mockLabTests.filter(t => t.status === 'pending').length;
  const inProgressCount = mockLabTests.filter(t => t.status === 'in-progress').length;
  const completedCount = mockLabTests.filter(t => t.status === 'completed').length;

  return (
    <DashboardLayout currentPath="/lab">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground font-display">Lab Tests</h1>
        <p className="text-muted-foreground mt-1">Process test requests and upload results</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-card rounded-2xl border border-border/50 shadow-soft p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Pending Tests</p>
              <p className="text-3xl font-bold text-warning font-display">{pendingCount}</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-warning/10 flex items-center justify-center">
              <Clock className="w-6 h-6 text-warning" />
            </div>
          </div>
        </div>
        <div className="bg-card rounded-2xl border border-border/50 shadow-soft p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">In Progress</p>
              <p className="text-3xl font-bold text-info font-display">{inProgressCount}</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-info/10 flex items-center justify-center">
              <FlaskConical className="w-6 h-6 text-info" />
            </div>
          </div>
        </div>
        <div className="bg-card rounded-2xl border border-border/50 shadow-soft p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Completed Today</p>
              <p className="text-3xl font-bold text-success font-display">{completedCount}</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-success/10 flex items-center justify-center">
              <CheckCircle2 className="w-6 h-6 text-success" />
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input
            placeholder="Search by patient or test type..."
            className="pl-10 h-12"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
          {['all', 'pending', 'in-progress', 'completed'].map(status => (
            <Button
              key={status}
              variant={filter === status ? "default" : "outline"}
              size="sm"
              onClick={() => setFilter(status)}
              className="capitalize"
            >
              {status === 'all' ? 'All' : status.replace('-', ' ')}
            </Button>
          ))}
        </div>
      </div>

      {/* Tests List */}
      <div className="space-y-4">
        {filteredTests.map((test) => {
          const patient = patients.find(p => p.id === test.patientId);
          const doctor = doctors.find(d => d.id === test.doctorId);

          return (
            <div key={test.id} className="bg-card rounded-2xl border border-border/50 shadow-soft p-6 card-hover">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-gradient-primary flex items-center justify-center text-primary-foreground">
                    <FlaskConical className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">{test.testType}</h3>
                    <div className="flex flex-wrap items-center gap-4 mt-2 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <User className="w-4 h-4" />
                        {patient?.name}
                      </span>
                      <span className="flex items-center gap-1">
                        <FileText className="w-4 h-4" />
                        Requested by {doctor?.name}
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        {test.requestedAt.toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  {getStatusBadge(test.status, test.priority)}

                  {test.status === 'pending' && (
                    <Button variant="default" size="sm" onClick={() => handleStartTest(test.id)}>
                      Start Test
                    </Button>
                  )}

                  {test.status === 'in-progress' && (
                    <Button variant="success" size="sm" onClick={() => handleUploadResult(test.id)}>
                      <Upload className="w-4 h-4 mr-1" />
                      Upload Result
                    </Button>
                  )}

                  {test.status === 'completed' && (
                    <Button variant="outline" size="sm">
                      <FileText className="w-4 h-4 mr-1" />
                      View Report
                    </Button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {filteredTests.length === 0 && (
        <div className="text-center py-12">
          <FlaskConical className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-foreground mb-2">No tests found</h3>
          <p className="text-muted-foreground">No lab tests match your current filters.</p>
        </div>
      )}
    </DashboardLayout>
  );
}
