import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import path from 'path';

// Config
dotenv.config();
const app = express();
const httpServer = createServer(app);
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
    origin: ["http://localhost:5173", "http://localhost:5174", "http://localhost:8080", "http://localhost:8081", "http://localhost:8082", "http://localhost:8083", "http://localhost:8084", "https://your-frontend-url.netlify.app"], // Add your production frontend URL here
    methods: ["GET", "POST", "PATCH", "PUT", "DELETE", "OPTIONS"]
}));
app.use(express.json());

// Socket.io Setup (Real-time)
const io = new Server(httpServer, {
    cors: {
        origin: ["http://localhost:5173", "http://localhost:5174", "http://localhost:8080", "http://localhost:8081", "http://localhost:8082", "http://localhost:8083", "http://localhost:8084", "https://your-frontend-url.netlify.app"], // Add your production frontend URL here
        methods: ["GET", "POST", "PATCH", "PUT", "DELETE", "OPTIONS"]
    }
});

io.on('connection', (socket) => {
    console.log('A user connected:', socket.id);
    socket.on('join_room', (roomId) => {
        socket.join(roomId);
        console.log(`User joined room: ${roomId}`);
    });
    socket.on('disconnect', () => {
        console.log('User disconnected');
    });
});

// Mock Database: 6 Actors
const USERS = [
    { id: 1, email: "admin@hms.com", password: "admin", role: "admin", name: "Super Admin" },
    { id: 2, email: "reception@hms.com", password: "recep", role: "receptionist", name: "Front Desk" },
    { id: 3, email: "doctor@hms.com", password: "doc", role: "doctor", name: "Dr. Sarah Wilson" },
    { id: 4, email: "lab@hms.com", password: "lab", role: "lab_technician", name: "Lab Tech Mike" },
    { id: 5, email: "patient@hms.com", password: "pat", role: "patient", name: "John Doe" },
    { id: 6, email: "billing@hms.com", password: "bill", role: "billing", name: "Finance Manager" }
];

// Mock Database (In-memory) - ids 1,2,3 match doctor list; user id 3 = Dr. Sarah Wilson
const DOCTORS = [
    {
        id: 1,
        name: "Dr. James Chen",
        specialty: "Neurologist",
        department: "Neurology",
        rating: 4.8,
        available: true,
        image: "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?auto=format&fit=crop&q=80&w=300"
    },
    {
        id: 2,
        name: "Dr. Emily Parker",
        specialty: "Pediatrician",
        department: "Pediatrics",
        rating: 5.0,
        available: true,
        image: "https://images.unsplash.com/photo-1594824476967-48c8b964273f?auto=format&fit=crop&q=80&w=300"
    },
    {
        id: 3,
        name: "Dr. Sarah Wilson",
        specialty: "Cardiologist",
        department: "Cardiology",
        rating: 4.9,
        available: true,
        image: "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&q=80&w=300"
    }
];

// In-memory data
let PATIENTS = [
    { id: 5, fullName: "John Doe", name: "John Doe", age: 35, gender: "Male", email: "patient@hms.com", phone: "123-456-7890", bloodGroup: "O+", patientId: "PAT-001" }
];
// Seed appointments so doctor schedules show data (Scheduled + in-progress for Start/Mark as Done)
let APPOINTMENTS = [
    { id: 1, patientId: 5, doctorId: 1, departmentId: "1", date: new Date().toISOString().split("T")[0], timeSlot: "09:00 AM", tokenNumber: 1, status: "Scheduled" },
    { id: 2, patientId: 5, doctorId: 1, departmentId: "1", date: new Date().toISOString().split("T")[0], timeSlot: "09:30 AM", tokenNumber: 2, status: "in-progress" },
    { id: 3, patientId: 5, doctorId: 2, departmentId: "2", date: new Date().toISOString().split("T")[0], timeSlot: "10:00 AM", tokenNumber: 3, status: "Scheduled" },
    { id: 4, patientId: 5, doctorId: 2, departmentId: "2", date: new Date().toISOString().split("T")[0], timeSlot: "10:30 AM", tokenNumber: 4, status: "Scheduled" },
    { id: 5, patientId: 5, doctorId: 3, departmentId: "4", date: new Date().toISOString().split("T")[0], timeSlot: "11:00 AM", tokenNumber: 5, status: "Scheduled" },
];
let FEEDBACK = [];
let BILLS = [];

// Routes
app.get('/', (req, res) => {
    res.send('HMS API is running...');
});

// Auth Login Endpoint
app.post('/api/auth/login', (req, res) => {
    const { email, password } = req.body;
    const user = USERS.find(u => u.email === email && u.password === password);

    if (!user) {
        return res.status(401).json({ success: false, message: "Invalid email or password" });
    }

    res.json({
        success: true,
        token: `mock_token_${user.role}_${user.id}`,
        user: { id: user.id, name: user.name, email: user.email, role: user.role },
        message: `Welcome back, ${user.name}!`
    });
});

// Patients & Appointments
app.get('/api/patients', (req, res) => res.json(PATIENTS));

app.post('/api/patients', (req, res) => {
    const newPatient = { id: PATIENTS.length + 1, ...req.body };
    PATIENTS.push(newPatient);
    res.status(201).json({ success: true, patient: newPatient });
});

app.get('/api/appointments', (req, res) => res.json(APPOINTMENTS));

app.post('/api/appointments', (req, res) => {
    const { status = 'Scheduled' } = req.body;
    const newAppointment = {
        id: APPOINTMENTS.length + 1,
        ...req.body,
        status: status // Use status from body (e.g., 'pending') or default to 'Scheduled'
    };
    APPOINTMENTS.push(newAppointment);

    // Real-time notification
    io.emit('new_appointment', newAppointment);

    res.status(201).json({ success: true, appointment: newAppointment });
});

app.patch('/api/appointments/:id', (req, res) => {
    const { id } = req.params;
    const index = APPOINTMENTS.findIndex(a => String(a.id) === String(id));

    if (index === -1) {
        return res.status(404).json({ success: false, message: "Appointment not found" });
    }

    APPOINTMENTS[index] = { ...APPOINTMENTS[index], ...req.body };

    // Real-time notification
    io.emit('appointment_updated', APPOINTMENTS[index]);

    res.json({ success: true, appointment: APPOINTMENTS[index] });
});

app.patch('/api/doctors/:id', (req, res) => {
    const { id } = req.params;
    const index = DOCTORS.findIndex(d => String(d.id) === String(id));

    if (index === -1) {
        return res.status(404).json({ success: false, message: "Doctor not found" });
    }

    DOCTORS[index] = { ...DOCTORS[index], ...req.body };
    io.emit('doctor_updated', DOCTORS[index]);
    res.json({ success: true, doctor: DOCTORS[index] });
});

// Feedback Endpoints
app.get('/api/feedback/:doctorId', (req, res) => {
    const { doctorId } = req.params;
    const doctorFeedback = FEEDBACK.filter(f => String(f.doctorId) === String(doctorId));
    res.json(doctorFeedback);
});

app.post('/api/feedback', (req, res) => {
    const feedback = { id: FEEDBACK.length + 1, ...req.body, date: new Date().toISOString() };
    FEEDBACK.push(feedback);
    res.status(201).json({ success: true, feedback });
});

// Billing Endpoints
app.post('/api/bills', (req, res) => {
    const bill = { id: BILLS.length + 1, ...req.body, date: new Date().toISOString() };
    BILLS.push(bill);
    res.status(201).json({ success: true, bill });
});

app.get('/api/bills/:patientId', (req, res) => {
    const patientBills = BILLS.filter(b => String(b.patientId) === String(req.params.patientId));
    res.json(patientBills);
});

// Doctors
app.get('/api/doctors', (req, res) => res.json(DOCTORS));

app.post('/api/doctors', (req, res) => {
    const newDoctor = {
        id: DOCTORS.length + 1,
        ...req.body,
        available: true,
        image: "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?auto=format&fit=crop&q=80&w=300" // Default image
    };
    DOCTORS.push(newDoctor);
    res.status(201).json({ success: true, doctor: newDoctor });
});

// Start Server
httpServer.listen(PORT, () => {
    console.log(`CareSync Backend running on http://localhost:${PORT}`);
});
