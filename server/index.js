import express from 'express';
import cors from 'cors';
import authRouter from './routes/auth.js';
import connectDB from './DB/mongoose-connection.js';
import studentRoutes from './routes/student-routes.js';
import classRoutes from './routes/class-routes.js';
import attendanceRoutes from './routes/attendance-routes.js';
import teacherRoutes from './routes/teacher-routes.js';
import { mkdirSync } from 'fs';
import { join } from 'path';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();


connectDB();
app.use(express.json());
app.use(cors({
  origin: 'http://localhost:5173', // Replace with your frontend URL
  credentials: true
}));
app.use(express.static('public/uploads'));

// Add body parser for larger payloads
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Ensure uploads directory exists
const uploadDir = join(process.cwd(), 'public', 'uploads');
mkdirSync(uploadDir, { recursive: true });

// Serve static files
app.use('/uploads', express.static(uploadDir));
app.use('/api/uploads', express.static(path.join(__dirname, 'uploads')));
app.use('/api/uploads/photos', express.static(path.join(__dirname, 'uploads/photos')));

// Create uploads directories if they don't exist
import fs from 'fs';
const uploadsDir = path.join(__dirname, 'uploads');
const photosDir = path.join(__dirname, 'uploads/photos');

if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir);
}
if (!fs.existsSync(photosDir)) {
    fs.mkdirSync(photosDir);
}

// Add request logging middleware before routes
app.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`);
  next();
});

app.use('/api/auth', authRouter);
app.use('/api/students', studentRoutes);  // Ensure this matches frontend baseURL
app.use('/api/classes', classRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/teacher', teacherRoutes);

// Add 404 handler after all routes
app.use('*', (req, res) => {
  console.error(`Route not found: ${req.method} ${req.originalUrl}`);
  res.status(404).json({ 
    message: `Route ${req.originalUrl} not found`,
    availableRoutes: ['/api/students/*']
  });
});

// Add error handling middleware
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({ 
    message: 'Internal server error', 
    error: process.env.NODE_ENV === 'development' ? err.message : undefined 
  });
});

app.listen(process.env.PORT, () => {
    console.log(`server is running on port ${process.env.PORT}`);
  });