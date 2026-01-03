import { Router } from 'express';
import { AuthController } from '../controllers/AuthController';
import { CharacterController } from '../controllers/CharacterController';
import { DocumentController, upload } from '../controllers/DocumentController';
import { UploadController, imageUpload } from '../controllers/UploadController';
import { authenticate } from '../middleware/auth';
import { requireRole } from '../middleware/authorize';
import { UserController } from '../controllers/UserController';
import { PartyController } from '../controllers/PartyController';
import { PostController } from '../controllers/PostController';
import InvitationController from '../controllers/InvitationController';

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
router.patch('/user/profile', authenticate, UserController.updateMe);
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

// Party routes (owner-only)
router.get('/parties', authenticate, PartyController.index);
router.post('/parties', authenticate, PartyController.store);
router.get('/parties/code/:code', authenticate, PartyController.findByCode);
router.post('/parties/join', authenticate, PartyController.joinParty);
router.get('/parties/:id', authenticate, PartyController.show);
router.put('/parties/:id', authenticate, PartyController.update);
router.patch('/parties/:id', authenticate, PartyController.update);
router.delete('/parties/:id', authenticate, PartyController.destroy);

// Party Posts routes
router.get('/parties/:partyId/posts', authenticate, PostController.index);
router.post('/parties/:partyId/posts', authenticate, PostController.store);
router.delete('/posts/:id', authenticate, PostController.destroy);

// Invitation routes
router.get('/users/search', authenticate, InvitationController.searchUsers);
router.post('/parties/:partyId/invitations', authenticate, InvitationController.inviteUser);

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
