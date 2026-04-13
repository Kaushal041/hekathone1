import express from "express";
import { createBid, getBidsByJob } from "../controllers/bid.controller.js";
import { verifyToken } from "../middleware/jwt.js";

const router = express.Router();

router.post("/", verifyToken, createBid);
router.get("/job/:jobId", getBidsByJob);

export default router;
