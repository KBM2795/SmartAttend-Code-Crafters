import express from 'express';
import multer from 'multer';
import {
  getAllStudents,
  getStudentById,
  createStudent,
  updateStudent,
  deleteStudent,
  getStudentPhoto,
  getStudentProfile,
  getCompleteProfile,
} from '../controllers/student-controller.js';
import { validateToken } from '../middleware/auth.js';
import authMiddleware from "../middleware/authMiddleware.js"

const router = express.Router();

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'public/uploads/'); // Set the upload directory
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`); // Generate a unique filename
  },
});

const upload = multer({ storage });

// Define routes - Important: Order matters!
router.get('/complete-profile', validateToken, getCompleteProfile); // Most specific route first
router.get('/profile/:id', validateToken, getStudentProfile);
router.get('/', getAllStudents);
router.post('/create', upload.single('photo'), createStudent);
router.get('/:id/photo', getStudentPhoto);
router.get('/:id', getStudentById);
router.put('/:id', updateStudent);
router.delete('/:id', deleteStudent);

export default router;
