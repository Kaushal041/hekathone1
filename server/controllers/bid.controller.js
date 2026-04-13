import Bid from "../models/bid.model.js";
import Gig from "../models/gig.model.js";
import User from "../models/user.model.js";
import createError from "../utils/createError.js";
import { rankWorkersForJob } from "../utils/workerRanking.js";

export const createBid = async (req, res, next) => {
  try {
    if (!req.isSeller) {
      return next(createError(403, "Only workers can place bids"));
    }

    const { jobId, bidAmount, estimatedTime, proposal } = req.body;

    if (!jobId || !bidAmount || !estimatedTime || !proposal) {
      return next(createError(400, "jobId, bidAmount, estimatedTime and proposal are required"));
    }

    const job = await Gig.findById(jobId);
    if (!job) {
      return next(createError(404, "Job not found"));
    }

    if (String(job.userId) === String(req.userId)) {
      return next(createError(400, "You cannot bid on your own job"));
    }

    const existingBid = await Bid.findOne({ jobId: String(jobId), workerId: String(req.userId) });
    if (existingBid) {
      return next(createError(409, "You have already placed a bid for this job"));
    }

    const newBid = new Bid({
      jobId: String(jobId),
      workerId: String(req.userId),
      bidAmount: Number(bidAmount),
      estimatedTime: String(estimatedTime),
      proposal: String(proposal),
    });

    const savedBid = await newBid.save();
    return res.status(201).json(savedBid);
  } catch (err) {
    next(err);
  }
};

export const getBidsByJob = async (req, res, next) => {
  try {
    const { jobId } = req.params;
    const bids = await Bid.find({ jobId: String(jobId) }).sort({ createdAt: -1 });
    return res.status(200).json(bids);
  } catch (err) {
    next(err);
  }
};

export const getJobRecommendation = async (req, res, next) => {
  try {
    const { jobId } = req.params;
    const job = await Gig.findById(jobId);

    if (!job) {
      return next(createError(404, "Job not found"));
    }

    const bids = await Bid.find({ jobId: String(jobId) });
    if (bids.length === 0) {
      return res.status(200).json({
        jobId,
        rankedWorkers: [],
        message: "No bids yet for this job",
      });
    }

    const workerIds = [...new Set(bids.map((bid) => String(bid.workerId)))];
    const workers = await User.find({ _id: { $in: workerIds } });

    const rankedWorkers = rankWorkersForJob({
      job,
      bids,
      workers,
    });

    // Persist latest AI scores on bids for quick analytics/debugging.
    await Promise.all(
      rankedWorkers.map((workerRank) =>
        Bid.findByIdAndUpdate(workerRank.bidId, {
          performanceScore: workerRank.performanceScore,
          reputationScore: workerRank.reputationScore,
          skillMatchScore: workerRank.skillMatchScore,
          priceScore: workerRank.priceScore,
          locationScore: workerRank.locationScore,
          aiScore: workerRank.aiScore,
        })
      )
    );

    return res.status(200).json({
      jobId,
      rankedWorkers,
    });
  } catch (err) {
    next(err);
  }
};
