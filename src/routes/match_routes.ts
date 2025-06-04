import express from 'express';
import matchController from '../controllers/match_controller';
import { authMiddleware } from '../controllers/auth_controller';

const router = express.Router();


router.delete('/', authMiddleware, matchController.deleteById);
router.get('/', authMiddleware, matchController.getAllByUserId);
router.get('/:id', authMiddleware, matchController.getById);

export = router; 