import express from 'express';
import { 
  saveAttendance, 
  getDashboardSummary, 
  generateAttendanceReport, 
  getDailyReport, 
  getTodayClassReport,
  createQRSession,
  markAttendanceByQR,
  verifyQRLocation
} from '../controllers/attendance-controller.js';
import authMiddleware from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(authMiddleware);
router.post('/save', saveAttendance);
router.get('/dashboard-summary', getDashboardSummary);
router.post('/report', generateAttendanceReport);
router.get('/daily-report', getDailyReport);
router.get('/monthly-report', getDailyReport);
router.get('/today-class-report', getTodayClassReport);

router.post('/qr-session', createQRSession);
router.post('/mark-by-qr', markAttendanceByQR);
router.post('/verify-location', verifyQRLocation);

export default router;
