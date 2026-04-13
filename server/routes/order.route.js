import express from "express";
import { verifyToken } from "../middleware/jwt.js";
import {
  getOrders,
  createRazorpayOrder,
  verifyRazorpayPayment,
} from "../controllers/order.controller.js";

const router = express.Router();

router.get("/", verifyToken, getOrders);
router.post("/create-razorpay-order/:id", verifyToken, createRazorpayOrder);
router.post("/verify-razorpay-payment", verifyToken, verifyRazorpayPayment);

export default router;
