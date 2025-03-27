import express from 'express';
import { getAllClasses, getStudentsByClass } from '../controllers/class-controller.js';
import authMiddleware from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(authMiddleware);
router.get('/', getAllClasses);
router.get('/:classId/students', getStudentsByClass);

export default router;
