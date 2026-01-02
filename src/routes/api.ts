import { Router } from 'express';
import { AuthController } from '../controllers/AuthController';
import { CharacterController } from '../controllers/CharacterController';
import { DocumentController, upload } from '../controllers/DocumentController';
import { UploadController, imageUpload } from '../controllers/UploadController';
import { authenticate } from '../middleware/auth';
import { requireRole } from '../middleware/authorize';
import { UserController } from '../controllers/UserController';

const router = Router();

// Health check
router.get('/', (req, res) => {
  res.json({ status: 'ok', message: 'API is running' });
});

// Public routes
router.post('/register', AuthController.register);
router.post('/login', AuthController.login);

// Uploads genéricos (imagens) - autenticado
router.post('/uploads/images', authenticate, imageUpload.single('image'), UploadController.uploadImage);

// Protected routes
router.get('/user', authenticate, AuthController.getUser);
router.post('/logout', authenticate, AuthController.logout);

// Admin user management
router.get('/users', authenticate, requireRole(['ADMIN']), UserController.index);
router.post('/users', authenticate, requireRole(['ADMIN']), UserController.store);
router.put('/users/:id', authenticate, requireRole(['ADMIN']), UserController.update);
router.patch('/users/:id', authenticate, requireRole(['ADMIN']), UserController.update);
router.delete('/users/:id', authenticate, requireRole(['ADMIN']), UserController.destroy);

// Character routes (all protected)
router.get('/characters', authenticate, CharacterController.index);
router.post('/characters', authenticate, CharacterController.store);
router.get('/characters/:id', authenticate, CharacterController.show);
router.put('/characters/:id', authenticate, CharacterController.update);
router.patch('/characters/:id', authenticate, CharacterController.update);
router.delete('/characters/:id', authenticate, CharacterController.destroy);

// Document routes
// Public catalog (no auth required)
router.get('/documents', DocumentController.publicIndex);
router.get('/documents/:id', DocumentController.publicShow);

// Admin document management
router.get('/admin/documents', authenticate, requireRole(['ADMIN']), DocumentController.adminIndex);
router.get('/admin/documents/:id', authenticate, requireRole(['ADMIN']), DocumentController.adminShow);
router.post('/documents', authenticate, requireRole(['ADMIN']), upload.fields([
  { name: 'coverImage', maxCount: 1 },
  { name: 'pdfFile', maxCount: 1 }
]), DocumentController.store);
router.put('/documents/:id', authenticate, requireRole(['ADMIN']), upload.fields([
  { name: 'coverImage', maxCount: 1 },
  { name: 'pdfFile', maxCount: 1 }
]), DocumentController.update);
router.patch('/documents/:id', authenticate, requireRole(['ADMIN']), upload.fields([
  { name: 'coverImage', maxCount: 1 },
  { name: 'pdfFile', maxCount: 1 }
]), DocumentController.update);
router.delete('/documents/:id', authenticate, requireRole(['ADMIN']), DocumentController.destroy);

export default router;
