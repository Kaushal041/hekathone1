import express from "express";
import { verifyToken } from "../middleware/jwt.js";
import {
	getOrders,
	intent,
	confirm,
	createRazorpayOrder,
	verifyRazorpayPayment,
} from "../controllers/order.controller.js";

const router = express.Router();

// router.post("/:gigId", verifyToken, createOrder);
router.get("/", verifyToken, getOrders);
router.post("/create-payment-intent/:id", verifyToken, intent);
router.post("/create-razorpay-order/:id", verifyToken, createRazorpayOrder);
router.post("/verify-razorpay-payment", verifyToken, verifyRazorpayPayment);
router.put("/", verifyToken, confirm);

export default router;
