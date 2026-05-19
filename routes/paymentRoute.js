import  { Router } from 'express'
import { createOrderId, verifyOrder } from '../controllers/PaymentControllers.js';

const router = Router();

router.post("/create-order", createOrderId);
router.post("/complete-order", verifyOrder);

export default router;