import express from 'express';
import { getTeacherProfile, updateTeacherProfile } from '../controllers/teacher-controller.js';
import authMiddleware from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(authMiddleware);

// Profile routes with error handling
router.get('/profile', async (req, res) => {
  try {
    await getTeacherProfile(req, res);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.put('/profile', async (req, res) => {
  try {
    await updateTeacherProfile(req, res);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
