import createError from "../utils/createError.js";
import Order from "../models/order.model.js";
import Gig from "../models/gig.model.js";
import Stripe from "stripe";
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

export const intent = async (req, res, next) => {
  try {
    if (!process.env.STRIPE) {
      return next(createError(500, "Stripe secret is not configured."));
    }

    const stripe = new Stripe(process.env.STRIPE);
    const gig = await Gig.findById(req.params.id);

    if (!gig) {
      return next(createError(404, "Gig not found!"));
    }

    const amountInCents = Math.round(Number(gig.price) * 100);
    if (!Number.isFinite(amountInCents) || amountInCents <= 0) {
      return next(createError(400, "Invalid gig price for payment."));
    }

    const customerName = req.body.name || "Test User";
    const customerAddress = req.body.address || {
      line1: "123 Main Street",
      city: "Mumbai",
      state: "MH",
      postal_code: "400001",
      country: "IN",
    };

    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountInCents,
      currency: "inr",
      description: `Order for gig: ${gig.title} by seller ${gig.userId} for buyer ${req.userId}`,
      automatic_payment_methods: {
        enabled: true,
      },
      shipping: {
        name: customerName,
        address: customerAddress,
      },
    });

    const newOrder = new Order({
      gigId: gig._id,
      img: gig.cover,
      title: gig.title,
      buyerId: req.userId,
      sellerId: gig.userId,
      price: gig.price,
      payment_intent: paymentIntent.id,
    });

    await newOrder.save();

    res.status(200).send({
      clientSecret: paymentIntent.client_secret,
    });
  } catch (err) {
    next(err);
  }
};

export const getOrders = async (req, res, next) => {
  try {
    const orders = await Order.find({
      ...(req.isSeller ? { sellerId: req.userId } : { buyerId: req.userId }),
      isCompleted: true,
    });

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
      // Razorpay receipt must be short (max 40 chars).
      receipt: `r_${Date.now()}`,
      notes: {
        gigId: gig._id.toString(),
        buyerId: req.userId,
        sellerId: gig.userId,
      },
    });

    const newOrder = new Order({
      gigId: gig._id,
      img: gig.cover,
      title: gig.title,
      buyerId: req.userId,
      sellerId: gig.userId,
      price: gig.price,
      payment_intent: razorpayOrder.id,
    });

    await newOrder.save();

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

    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex");

    if (expectedSignature !== razorpay_signature) {
      return next(createError(400, "Invalid Razorpay signature."));
    }

    const existingOrder = await Order.findOne({ payment_intent: razorpay_order_id });

    if (!existingOrder) {
      return next(createError(404, "Order not found."));
    }

    if (existingOrder.isCompleted) {
      return res.status(200).send({ message: "Order already confirmed." });
    }

    const order = await Order.findOneAndUpdate(
      { payment_intent: razorpay_order_id },
      {
        $set: {
          isCompleted: true,
        },
      },
      { new: true }
    );

    if (!order) {
      return next(createError(404, "Order not found."));
    }

    res.status(200).send({ message: "Razorpay payment verified and order confirmed." });
  } catch (err) {
    next(createError(err?.statusCode || 500, extractGatewayErrorMessage(err)));
  }
};

export const confirm = async (req, res, next) => {
  try {
    const order = await Order.findOneAndUpdate(
      {
        payment_intent: req.body.payment_intent,
      },
      {
        $set: {
          isCompleted: true,
        },
      },
      { new: true }
    );

    if (!order) {
      return next(createError(404, "Order not found."));
    }

    res.status(200).send("Order has been confirmed.");
  } catch (err) {
    next(err);
  }
};
