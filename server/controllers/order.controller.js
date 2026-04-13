import createError from "../utils/createError.js";
import Order from "../models/order.model.js";
import Gig from "../models/gig.model.js";
import Stripe from "stripe";

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
