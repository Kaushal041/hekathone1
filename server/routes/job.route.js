import express from "express";
import { parseVoiceJob } from "../controllers/gig.controller.js";
import { getJobRecommendation } from "../controllers/bid.controller.js";

const router = express.Router();

router.post("/parse-voice", parseVoiceJob);
router.get("/:jobId/recommendation", getJobRecommendation);

export default router;
