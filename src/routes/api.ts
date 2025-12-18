import { Router } from 'express';
import { AuthController } from '../controllers/AuthController';
import { CharacterController } from '../controllers/CharacterController';
import { authenticate } from '../middleware/auth';

const router = Router();

// Health check
router.get('/', (req, res) => {
  res.json({ status: 'ok', message: 'API is running' });
});

// Public routes
router.post('/register', AuthController.register);
router.post('/login', AuthController.login);

// Protected routes
router.get('/user', authenticate, AuthController.getUser);
router.post('/logout', authenticate, AuthController.logout);

// Character routes (all protected)
router.get('/characters', authenticate, CharacterController.index);
router.post('/characters', authenticate, CharacterController.store);
router.get('/characters/:id', authenticate, CharacterController.show);
router.put('/characters/:id', authenticate, CharacterController.update);
router.patch('/characters/:id', authenticate, CharacterController.update);
router.delete('/characters/:id', authenticate, CharacterController.destroy);

export default router;
