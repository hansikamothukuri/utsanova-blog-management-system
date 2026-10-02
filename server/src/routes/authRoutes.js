import { Router } from 'express';
import adminService from '../services/adminService.js';
import { sendSuccess, sendError } from '../utils/apiResponse.js';

const router = Router();

/**
 * Register a new admin in the MySQL database
 * POST /api/auth/register-admin
 */
router.post('/register-admin', async (req, res) => {
  try {
    const { firebase_uid, email, name } = req.body;

    if (!firebase_uid || !email) {
      return sendError(res, 'Firebase UID and email are required to register admin.', 400);
    }

    const cleanEmail = email.trim().toLowerCase();
    const admin = await adminService.addAdmin({
      firebase_uid: firebase_uid.trim(),
      email: cleanEmail,
      name: name ? name.trim() : 'Utsanova Administrator',
    });

    console.log(`[Auth API] Admin account registered in MySQL: ${cleanEmail} (UID: ${firebase_uid})`);
    return sendSuccess(res, admin, 201);
  } catch (error) {
    console.error('[Register Admin Error]:', error);
    return sendError(res, error.message || 'Failed to register admin in database', 500);
  }
});

export default router;
