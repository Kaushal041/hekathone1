import User from "../models/user.model.js";
import createError from "../utils/createError.js";
import { allocateJobsForUser } from "../utils/locationAllocation.js";
import Gig from "../models/gig.model.js";

const normalizeLocationText = (value) =>
  String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9,\s-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const parseCity = (value) => {
  const normalized = normalizeLocationText(value);
  if (!normalized) return "";
  const cityPart = normalized.split(",")[0] || "";
  return cityPart.trim();
};

export const deleteUser = async (req, res, next) => {
  const user = await User.findById(req.params.id);

  if (req.userId !== user._id.toString()) {
    return next(createError(403, "You can delete only your account!"));
  }
  await User.findByIdAndDelete(req.params.id);
  res.status(200).send("User deleted.");
};

export const getUser = async (req, res, next) => {
  const user = await User.findById(req.params.id);

  res.status(200).send(user);
};

export const getAllocatedJobs = async (req, res, next) => {
  try {
    if (String(req.userId) !== String(req.params.id)) {
      return next(createError(403, "You can view only your allocated jobs."));
    }

    const { user, jobs } = await allocateJobsForUser(req.params.id);

    if (!user) {
      return next(createError(404, "User not found"));
    }

    if (!user.isSeller) {
      return res.status(200).json({
        userId: user._id,
        userLocation: user.location || user.country || "",
        jobs: [],
        message: "Location-based allocation is available for worker accounts.",
      });
    }

    return res.status(200).json({
      userId: user._id,
      userLocation: user.location || user.country || "",
      jobs,
    });
  } catch (err) {
    next(err);
  }
};

export const getSameCityWorkers = async (req, res, next) => {
  try {
    if (String(req.userId) !== String(req.params.id)) {
      return next(createError(403, "You can view only your city worker matches."));
    }

    const user = await User.findById(req.params.id);
    if (!user) {
      return next(createError(404, "User not found"));
    }

    const userCity = parseCity(user.location || user.country);
    if (!userCity) {
      return res.status(200).json({
        userId: user._id,
        userCity: "",
        workers: [],
        message: "Please update your location to find same-city workers.",
      });
    }

    const sellers = await User.find({
      isSeller: true,
      _id: { $ne: user._id },
    });

    const sameCitySellers = sellers.filter((seller) => parseCity(seller.location || seller.country) === userCity);

    const sellerIds = sameCitySellers.map((seller) => String(seller._id));
    const gigs = await Gig.find({ userId: { $in: sellerIds } }).sort({ createdAt: -1 });

    const firstGigBySeller = gigs.reduce((acc, gig) => {
      const sellerId = String(gig.userId);
      if (!acc[sellerId]) {
        acc[sellerId] = gig;
      }
      return acc;
    }, {});

    const workers = sameCitySellers
      .map((seller) => {
        const previewGig = firstGigBySeller[String(seller._id)];
        return {
          workerId: seller._id,
          username: seller.username,
          location: seller.location || seller.country,
          rating: Number(seller.rating || 4.5),
          completedJobs: Number(seller.completedJobs || 0),
          skills: seller.skills || [],
          serviceTitle: previewGig?.title || "Service available",
          category: previewGig?.cat || "General",
          cover: previewGig?.cover || "",
          gigId: previewGig?._id || null,
        };
      })
      .sort((a, b) => b.rating - a.rating || b.completedJobs - a.completedJobs)
      .slice(0, 8);

    return res.status(200).json({
      userId: user._id,
      userCity,
      workers,
    });
  } catch (err) {
    next(err);
  }
};
