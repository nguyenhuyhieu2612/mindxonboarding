import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { APP_CONFIG } from '../config/constants';
import { logger } from '../utils/logger';

export interface AuthRequest extends Request {
  user?: any;
}

export const authenticateToken = (req: AuthRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    logger.warn('Access attempt without token');
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, APP_CONFIG.jwtSecret, (err: any, user: any) => {
    if (err) {
      logger.warn('Invalid token attempt', { error: err.message });
      return res.status(403).json({ error: 'Invalid or expired token' });
    }
    req.user = user;
    logger.debug('Token verified successfully', { userId: user.userId });
    next();
  });
};
