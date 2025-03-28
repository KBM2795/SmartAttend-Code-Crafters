import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

export const validateToken = (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    const userId = req.headers['x-user-id'];
    
    if (!token) {
      return res.status(401).json({ message: 'Authentication token required' });
    }

    const decoded = jwt.verify(token, process.env.JWT_KEY);
    req.user = { ...decoded, _id: userId }; // Include user ID in request object
    
    console.log('Validated token for user:', req.user);
    next();
  } catch (error) {
    console.error('Token validation error:', error);
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
};
