import createError from "../utils/createError.js";
import Order from "../models/order.model.js";
import Gig from "../models/gig.model.js";
import Razorpay from "razorpay";
import crypto from "crypto";

const extractGatewayErrorMessage = (err) => {
  return (
    err?.error?.description ||
    err?.error?.message ||
    err?.error?.field ||
    err?.error?.reason ||
    err?.description ||
    err?.details ||
    err?.message ||
    "Payment request failed. Please verify Razorpay key settings and try again."
  );
};

export const getOrders = async (req, res, next) => {
  try {
    const orders = await Order.find({
      ...(req.isSeller ? { sellerId: req.userId } : { buyerId: req.userId }),
      isPaid: true,
    }).sort({ createdAt: -1 });

    res.status(200).send(orders);
  } catch (err) {
    next(err);
  }
};

export const createRazorpayOrder = async (req, res, next) => {
  try {
    if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
      return next(createError(500, "Razorpay keys are not configured."));
    }

    const gig = await Gig.findById(req.params.id);
    if (!gig) {
      return next(createError(404, "Gig not found!"));
    }

    const amountInPaise = Math.round(Number(gig.price) * 100);
    if (!Number.isFinite(amountInPaise) || amountInPaise <= 0) {
      return next(createError(400, "Invalid gig price for payment."));
    }

    const razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });

    const razorpayOrder = await razorpay.orders.create({
      amount: amountInPaise,
      currency: "INR",
      receipt: `r_${Date.now()}`,
      notes: {
        gigId: gig._id.toString(),
        buyerId: req.userId,
        sellerId: gig.userId,
      },
    });

    const existingOrder = await Order.findOne({ razorpayOrderId: razorpayOrder.id });
    if (!existingOrder) {
      await Order.create({
        gigId: gig._id,
        img: gig.cover,
        title: gig.title,
        buyerId: req.userId,
        sellerId: gig.userId,
        price: gig.price,
        paymentGateway: "razorpay",
        razorpayOrderId: razorpayOrder.id,
        razorpayPaymentId: "",
        isPaid: false,
        isCompleted: false,
        paidAt: null,
      });
    }

    res.status(200).send({
      orderId: razorpayOrder.id,
      amount: razorpayOrder.amount,
      currency: razorpayOrder.currency,
      key: process.env.RAZORPAY_KEY_ID,
      name: "CodeLance",
      description: `Payment for ${gig.title}`,
    });
  } catch (err) {
    next(createError(err?.statusCode || 500, extractGatewayErrorMessage(err)));
  }
};

export const verifyRazorpayPayment = async (req, res, next) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return next(createError(400, "Missing Razorpay payment verification fields."));
    }

    if (!process.env.RAZORPAY_KEY_SECRET) {
      return next(createError(500, "Razorpay secret is not configured."));
    }

    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex");

    if (expectedSignature !== razorpay_signature) {
      return next(createError(400, "Invalid Razorpay signature."));
    }

    const order = await Order.findOne({ razorpayOrderId: razorpay_order_id });

    if (!order) {
      return next(createError(404, "Order not found."));
    }

    if (order.isPaid) {
      return res.status(200).send({ message: "Order already confirmed." });
    }

    order.razorpayPaymentId = razorpay_payment_id;
    order.isPaid = true;
    order.isCompleted = true;
    order.paidAt = new Date();
    await order.save();

    res.status(200).send({
      message: "Razorpay payment verified and order confirmed.",
      orderId: order._id,
    });
  } catch (err) {
    next(createError(err?.statusCode || 500, extractGatewayErrorMessage(err)));
  }
};
