import Gig from "../models/gig.model.js";
import User from "../models/user.model.js";
import Bid from "../models/bid.model.js";

const normalizeLocationText = (value) =>
  String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9,\s-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const STATE_ALIASES = {
  up: "uttar pradesh",
  mp: "madhya pradesh",
  mh: "maharashtra",
  dl: "delhi",
  ncr: "delhi",
  rj: "rajasthan",
  gj: "gujarat",
  ka: "karnataka",
  tn: "tamil nadu",
};

const normalizeLocationPart = (value) => {
  const cleaned = normalizeLocationText(value);
  return STATE_ALIASES[cleaned] || cleaned;
};

const parseLocation = (value) => {
  const normalized = normalizeLocationText(value);
  if (!normalized) {
    return { raw: "", city: "", state: "", parts: [] };
  }

  const parts = normalized
    .split(",")
    .map((part) => normalizeLocationPart(part))
    .filter(Boolean);

  const city = parts[0] || normalizeLocationPart(normalized.split(" ")[0]);
  const state = parts.length > 1 ? parts[parts.length - 1] : "";

  return { raw: normalized, city, state, parts };
};

const extractJobLocation = (job) => {
  const shortDesc = String(job?.shortDesc || "");
  const shortMatch = shortDesc.match(/location\s*:\s*(.+)/i);
  if (shortMatch) return normalizeLocationText(shortMatch[1]);

  const desc = String(job?.desc || "");
  const descMatch = desc.match(/location\s*:\s*([^\n]+)/i);
  if (descMatch) return normalizeLocationText(descMatch[1]);

  const title = String(job?.title || "");
  const titleMatch = title.match(/in\s+([a-zA-Z ]{2,40})/i);
  return titleMatch ? normalizeLocationText(titleMatch[1]) : "";
};

const getLocationMatchScore = (jobLocation, userLocation) => {
  if (!jobLocation || !userLocation) return 30;

  const job = parseLocation(jobLocation);
  const user = parseLocation(userLocation);

  if (!job.raw || !user.raw) return 30;
  if (job.raw === user.raw) return 100;
  if (job.city && user.city && job.city === user.city) return 100;
  if (job.state && user.state && job.state === user.state) return 80;

  const jobTokens = new Set(job.raw.split(/[^a-z0-9]+/).filter((token) => token.length > 2));
  const userTokens = new Set(user.raw.split(/[^a-z0-9]+/).filter((token) => token.length > 2));
  let overlap = 0;
  jobTokens.forEach((token) => {
    if (userTokens.has(token)) overlap += 1;
  });

  if (jobTokens.size > 0 && overlap / jobTokens.size >= 0.5) return 70;
  if (overlap > 0) return 60;

  return 30;
};

const getAllocationReason = (score) => {
  if (score >= 100) return "Same city match";
  if (score >= 80) return "Same state match";
  if (score >= 70) return "Nearby location match";
  return "Far location match";
};

const getLocationMatchType = (score) => {
  if (score >= 100) return "Same City";
  if (score >= 80) return "Same State";
  if (score >= 70) return "Nearby";
  return "Far";
};

export const allocateJobsForUser = async (userId) => {
  const user = await User.findById(userId);
  if (!user) {
    return { user: null, jobs: [] };
  }

  const userLocation = user.location || user.country || "";
  const jobs = await Gig.find({ userId: { $ne: String(userId) } }).sort({ createdAt: -1 });

  const allocatedJobs = jobs
    .map((job) => {
      const jobLocation = extractJobLocation(job);
      const locationScore = getLocationMatchScore(jobLocation, userLocation);

      return {
        jobId: job._id,
        title: job.title,
        category: job.cat,
        budget: job.price,
        cover: job.cover,
        jobLocation,
        workerLocation: userLocation,
        locationScore,
        locationMatchType: getLocationMatchType(locationScore),
        allocationReason: getAllocationReason(locationScore),
        isAllocated: locationScore >= 70,
        createdAt: job.createdAt,
      };
    })
    .filter((job) => job.isAllocated)
    .sort((a, b) => b.locationScore - a.locationScore || new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 8);

  const allocatedJobIds = allocatedJobs.map((job) => String(job.jobId));
  const existingBids = await Bid.find({
    workerId: String(userId),
    jobId: { $in: allocatedJobIds },
  }).select("jobId status");

  const bidByJobId = new Map(existingBids.map((bid) => [String(bid.jobId), bid]));

  const jobsWithClaimStatus = allocatedJobs.map((job) => {
    const existingBid = bidByJobId.get(String(job.jobId));
    return {
      ...job,
      alreadyClaimed: !!existingBid,
      bidStatus: existingBid?.status || null,
    };
  });

  return {
    user,
    jobs: jobsWithClaimStatus,
  };
};
