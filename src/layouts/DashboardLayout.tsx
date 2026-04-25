import { ReactNode, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import {
  Heart,
  Home,
  Users,
  Calendar,
  Stethoscope,
  FlaskConical,
  Receipt,
  BedDouble,
  Settings,
  LogOut,
  Menu,
  X,
  Activity,
  ChevronRight,
  Bell,
  Search
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface NavItem {
  icon: React.ReactNode;
  label: string;
  href: string;
  roles: string[];
}

const navItems: NavItem[] = [
  { icon: <Home className="w-5 h-5" />, label: 'Dashboard', href: '/dashboard', roles: ['admin', 'doctor', 'receptionist', 'patient'] },
  { icon: <Calendar className="w-5 h-5" />, label: 'My Schedule', href: '/doctor-schedule', roles: ['doctor'] },
  { icon: <Users className="w-5 h-5" />, label: 'Patients', href: '/patients', roles: ['admin', 'doctor', 'receptionist'] },
  { icon: <Stethoscope className="w-5 h-5" />, label: 'Doctors', href: '/doctors', roles: ['admin', 'doctor', 'receptionist', 'patient'] },
  { icon: <Calendar className="w-5 h-5" />, label: 'Appointments', href: '/appointments', roles: ['admin', 'doctor', 'receptionist', 'patient'] },
  { icon: <Activity className="w-5 h-5" />, label: 'Consultation', href: '/consultation', roles: ['doctor'] },
];

interface DashboardLayoutProps {
  children: ReactNode;
  currentPath?: string;
}

export default function DashboardLayout({ children, currentPath = '/dashboard' }: DashboardLayoutProps) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const filteredNavItems = navItems.filter(item =>
    user && item.roles.includes(user.role)
  );

  const roleColorMap: any = {
    doctor: 'bg-role-doctor',
    receptionist: 'bg-role-receptionist',
    patient: 'bg-role-patient',
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-card border-b border-border z-50 flex items-center justify-between px-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => setMobileMenuOpen(true)}>
            <Menu className="w-5 h-5" />
          </Button>
          <div className="flex items-center gap-2" onClick={() => navigate('/dashboard')} style={{ cursor: 'pointer' }}>
            <div className="w-8 h-8 rounded-lg bg-gradient-primary flex items-center justify-center">
              <Heart className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="font-semibold text-foreground">MediCare</span>
          </div>
        </div>
        <Button variant="ghost" size="icon">
          <Bell className="w-5 h-5" />
        </Button>
      </div>

      {/* Mobile Sidebar Overlay */}
      {mobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 bg-foreground/20 backdrop-blur-sm z-50" onClick={() => setMobileMenuOpen(false)}>
          <div className="w-72 h-full bg-card shadow-xl" onClick={e => e.stopPropagation()}>
            <div className="p-4 border-b border-border flex items-center justify-between">
              <div className="flex items-center gap-3" onClick={() => { navigate('/dashboard'); setMobileMenuOpen(false); }} style={{ cursor: 'pointer' }}>
                <div className="w-10 h-10 rounded-xl bg-gradient-primary flex items-center justify-center">
                  <Heart className="w-5 h-5 text-primary-foreground" />
                </div>
                <div>
                  <h1 className="font-bold text-foreground">MediCare</h1>
                  <p className="text-xs text-muted-foreground">HMS</p>
                </div>
              </div>
              <Button variant="ghost" size="icon" onClick={() => setMobileMenuOpen(false)}>
                <X className="w-5 h-5" />
              </Button>
            </div>
            <nav className="p-4 space-y-2">
              {filteredNavItems.map((item) => (
                <button
                  key={item.label}
                  onClick={() => { navigate(item.href); setMobileMenuOpen(false); }}
                  className={cn(
                    "w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all text-left",
                    currentPath === item.href
                      ? "bg-primary text-primary-foreground shadow-soft"
                      : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                  )}
                >
                  {item.icon}
                  <span>{item.label}</span>
                </button>
              ))}
            </nav>
          </div>
        </div>
      )}

      {/* Desktop Sidebar */}
      <aside className={cn(
        "hidden lg:fixed lg:flex lg:flex-col lg:top-0 lg:left-0 lg:h-screen bg-card border-r border-border z-40 transition-all duration-300",
        sidebarOpen ? "lg:w-64" : "lg:w-20"
      )}>
        {/* Logo */}
        <div className="p-4 border-b border-border">
          <div className="flex items-center gap-3" onClick={() => navigate('/dashboard')} style={{ cursor: 'pointer' }}>
            <div className="w-10 h-10 rounded-xl bg-gradient-primary flex items-center justify-center shadow-glow flex-shrink-0">
              <Heart className="w-5 h-5 text-primary-foreground" />
            </div>
            {sidebarOpen && (
              <div className="animate-fade-in">
                <h1 className="font-bold text-foreground font-display">MediCare</h1>
                <p className="text-xs text-muted-foreground">Hospital Management</p>
              </div>
            )}
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          {filteredNavItems.map((item) => (
            <button
              key={item.label}
              onClick={() => navigate(item.href)}
              className={cn(
                "w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all text-left",
                currentPath === item.href
                  ? "bg-primary text-primary-foreground shadow-soft"
                  : "text-muted-foreground hover:bg-secondary hover:text-foreground"
              )}
            >
              {item.icon}
              {sidebarOpen && <span className="animate-fade-in">{item.label}</span>}
            </button>
          ))}
        </nav>

        {/* User Section */}
        <div className="p-4 border-t border-border">
          <div className={cn(
            "flex items-center gap-3",
            !sidebarOpen && "justify-center"
          )}>
            <div className={cn(
              "w-10 h-10 rounded-full flex items-center justify-center text-white flex-shrink-0",
              user && roleColorMap[user.role]
            )}>
              {user?.name.charAt(0)}
            </div>
            {sidebarOpen && (
              <div className="flex-1 min-w-0 animate-fade-in">
                <p className="text-sm font-medium text-foreground truncate">{user?.name}</p>
                <p className="text-xs text-muted-foreground capitalize">{user?.role}</p>
              </div>
            )}
          </div>
          <Button
            variant="ghost"
            size={sidebarOpen ? "default" : "icon"}
            className={cn("w-full mt-4", !sidebarOpen && "justify-center")}
            onClick={logout}
          >
            <LogOut className="w-4 h-4" />
            {sidebarOpen && <span className="ml-2">Logout</span>}
          </Button>
        </div>

        {/* Collapse Button */}
        <button
          className="absolute -right-3 top-20 w-6 h-6 bg-card border border-border rounded-full flex items-center justify-center shadow-sm hover:bg-secondary transition-colors"
          onClick={() => setSidebarOpen(!sidebarOpen)}
        >
          <ChevronRight className={cn("w-4 h-4 transition-transform", !sidebarOpen && "rotate-180")} />
        </button>
      </aside>

      {/* Main Content */}
      <main className={cn(
        "transition-all duration-300 pt-16 lg:pt-0",
        sidebarOpen ? "lg:ml-64" : "lg:ml-20"
      )}>
        {/* Top Bar */}
        <div className="hidden lg:flex h-16 bg-card border-b border-border items-center justify-between px-6">
          <div className="relative w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search patients, appointments..."
              className="w-full h-10 pl-10 pr-4 rounded-lg bg-secondary border-0 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="w-5 h-5" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-accent rounded-full" />
            </Button>
            <div className="flex items-center gap-3">
              <div className={cn(
                "w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-medium",
                user && roleColorMap[user.role]
              )}>
                {user?.name.charAt(0)}
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">{user?.name}</p>
                <p className="text-xs text-muted-foreground capitalize">{user?.role}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Page Content */}
        <div className="p-6">
          {children}
        </div>
      </main>
    </div>
  );
}
