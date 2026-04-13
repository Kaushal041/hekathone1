const clampScore = (value) => {
  const numeric = Number(value) || 0;
  return Math.max(0, Math.min(100, numeric));
};

const normalizeCompletedJobs = (completedJobs) => {
  const jobs = Number(completedJobs) || 0;
  return clampScore((jobs / 100) * 100);
};

const normalizeReviewCount = (reviewCount) => {
  const reviews = Number(reviewCount) || 0;
  return clampScore((reviews / 50) * 100);
};

const normalizeRating = (rating) => {
  const score = (Number(rating) || 0) * 20;
  return clampScore(score);
};

const normalizeList = (value) => {
  if (!value) return [];
  if (Array.isArray(value)) return value.map((item) => String(item).trim().toLowerCase()).filter(Boolean);
  return String(value)
    .split(",")
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean);
};

const extractJobSkills = (job) => {
  const fromShortTitle = normalizeList(job?.shortTitle);
  if (fromShortTitle.length > 0) return fromShortTitle;

  const desc = String(job?.desc || "");
  const match = desc.match(/required skills\s*:\s*([^\n]+)/i);
  return normalizeList(match ? match[1] : "");
};

const extractJobLocation = (job) => {
  const shortDesc = String(job?.shortDesc || "");
  const match = shortDesc.match(/location\s*:\s*(.+)/i);
  if (match) return match[1].trim().toLowerCase();

  const desc = String(job?.desc || "");
  const descMatch = desc.match(/location\s*:\s*([^\n]+)/i);
  return descMatch ? descMatch[1].trim().toLowerCase() : "";
};

const getSkillMatchScore = (jobSkills, workerSkills) => {
  if (jobSkills.length === 0) return 60;
  const workerSet = new Set(workerSkills);
  const matched = jobSkills.filter((skill) => workerSet.has(skill)).length;
  return clampScore((matched / jobSkills.length) * 100);
};

const getLocationScore = (jobLocation, workerLocation) => {
  if (!jobLocation || !workerLocation) return 30;
  if (jobLocation === workerLocation) return 100;
  if (jobLocation.includes(workerLocation) || workerLocation.includes(jobLocation)) return 70;
  return 30;
};

const getRecommendationReason = (scores) => {
  if (scores.skillMatchScore >= 90 && scores.locationScore >= 90) {
    return "Perfect skill match and same location";
  }
  if (scores.priceScore >= 90 && scores.reputationScore >= 75) {
    return "Best price with strong reputation";
  }
  if (scores.reputationScore >= 80 && scores.performanceScore >= 80) {
    return "High rating and excellent on-time record";
  }
  return "Balanced profile across performance, price, and reliability";
};

export const rankWorkersForJob = ({ job, bids, workers }) => {
  const workerMap = new Map(workers.map((worker) => [String(worker._id), worker]));
  const lowestBid = bids.length > 0 ? Math.min(...bids.map((bid) => Number(bid.bidAmount) || Infinity)) : 1;

  const jobSkills = extractJobSkills(job);
  const jobLocation = extractJobLocation(job);

  const ranked = bids.map((bid) => {
    const worker = workerMap.get(String(bid.workerId));
    const workerSkills = normalizeList(worker?.skills || []);
    const workerLocation = String(worker?.location || "").trim().toLowerCase();

    const completedJobsScore = normalizeCompletedJobs(worker?.completedJobs);
    const reviewCountScore = normalizeReviewCount(worker?.reviewCount);

    const performanceScore = clampScore(
      (0.4 * clampScore(worker?.onTimeRate)) +
        (0.3 * completedJobsScore) +
        (0.2 * clampScore(worker?.responseTimeScore)) +
        (0.1 * clampScore(worker?.acceptanceRate))
    );

    const reputationScore = clampScore(
      (0.5 * normalizeRating(worker?.rating)) +
        (0.3 * clampScore(worker?.reliabilityScore)) +
        (0.2 * reviewCountScore)
    );

    const skillMatchScore = getSkillMatchScore(jobSkills, workerSkills);
    const priceScore = clampScore(((lowestBid || 1) / (Number(bid.bidAmount) || 1)) * 100);
    const locationScore = getLocationScore(jobLocation, workerLocation);

    const aiScore = clampScore(
      (0.3 * performanceScore) +
        (0.25 * reputationScore) +
        (0.2 * skillMatchScore) +
        (0.15 * priceScore) +
        (0.1 * locationScore)
    );

    const scores = {
      performanceScore: Math.round(performanceScore),
      reputationScore: Math.round(reputationScore),
      skillMatchScore: Math.round(skillMatchScore),
      priceScore: Math.round(priceScore),
      locationScore: Math.round(locationScore),
      aiScore: Math.round(aiScore),
    };

    return {
      bidId: bid._id,
      jobId: bid.jobId,
      workerId: bid.workerId,
      workerName: worker?.username || "Unknown Worker",
      bidAmount: bid.bidAmount,
      estimatedTime: bid.estimatedTime,
      proposal: bid.proposal,
      rating: Number(worker?.rating || 0),
      completedJobs: Number(worker?.completedJobs || 0),
      reviewCount: Number(worker?.reviewCount || 0),
      ...scores,
      recommendationReason: getRecommendationReason(scores),
    };
  });

  ranked.sort((a, b) => b.aiScore - a.aiScore);

  return ranked.map((item, index) => ({
    ...item,
    rank: index + 1,
    recommended: index === 0,
  }));
};
