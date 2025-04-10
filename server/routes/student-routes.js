import express from 'express';
import multer from 'multer';
import {
  getAllStudents,
  getStudentById,
  createStudent,
  updateStudent,
  deleteStudent,
  getStudentPhoto,
} from '../controllers/student-controller.js';

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

// Define routes
router.get('/', getAllStudents);
router.get('/:id', getStudentById);
router.get('/:id/photo', getStudentPhoto);
router.post('/create', upload.single('photo'), createStudent);
router.put('/:id', updateStudent);
router.delete('/:id', deleteStudent);

export default router;
