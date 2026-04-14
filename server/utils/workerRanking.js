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
  if (Array.isArray(value)) {
    return value.map((item) => String(item).trim().toLowerCase()).filter(Boolean);
  }
  return String(value)
    .split(/[;,]/)
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean);
};

const SKILL_ALIASES = {
  plumbing: ["plumber", "plumbing", "pipe repair", "leak fixing", "tap fitting", "drain"],
  electrician: ["electrical", "wiring", "electrician", "switch repair"],
  carpentry: ["carpenter", "wood work", "furniture repair", "carpentry"],
  tutoring: ["tuition", "tutor", "teaching", "math tutor", "science tutor"],
  design: ["graphic design", "logo design", "poster", "banner design", "photoshop"],
  technical: ["tech support", "technical help", "computer repair", "software install", "network"],
  delivery: ["delivery", "errands", "pickup", "drop"],
  cleaning: ["cleaning", "house cleaning", "deep cleaning", "organizing"],
};

const buildAliasIndex = () => {
  const map = new Map();
  Object.entries(SKILL_ALIASES).forEach(([canonical, aliases]) => {
    map.set(canonical, canonical);
    aliases.forEach((alias) => map.set(alias, canonical));
  });
  return map;
};

const SKILL_ALIAS_INDEX = buildAliasIndex();

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

const normalizeLocationText = (value) => {
  return String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9,\s-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
};

const normalizeLocationPart = (value) => {
  const cleaned = normalizeLocationText(value);
  return STATE_ALIASES[cleaned] || cleaned;
};

const parseLocationParts = (value) => {
  const normalized = normalizeLocationText(value);
  if (!normalized) {
    return {
      raw: "",
      city: "",
      state: "",
      parts: [],
    };
  }

  const parts = normalized
    .split(",")
    .map((part) => normalizeLocationPart(part))
    .filter(Boolean);

  const city = parts[0] || normalizeLocationPart(normalized.split(" ")[0]);
  const state = parts.length > 1 ? parts[parts.length - 1] : "";

  return {
    raw: normalized,
    city,
    state,
    parts,
  };
};

const getLocationTokenOverlap = (jobRaw, workerRaw) => {
  const jobTokens = new Set(jobRaw.split(/[^a-z0-9]+/).filter((token) => token.length > 2));
  const workerTokens = new Set(
    workerRaw.split(/[^a-z0-9]+/).filter((token) => token.length > 2)
  );

  if (jobTokens.size === 0 || workerTokens.size === 0) return 0;

  let overlap = 0;
  jobTokens.forEach((token) => {
    if (workerTokens.has(token)) overlap += 1;
  });

  return overlap / jobTokens.size;
};

const toCanonicalSkill = (skill) => {
  const value = String(skill || "").trim().toLowerCase();
  return SKILL_ALIAS_INDEX.get(value) || value;
};

const toSkillTokens = (skill) => {
  return String(skill || "")
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .map((token) => token.trim())
    .filter((token) => token.length > 1);
};

const extractJobSkills = (job) => {
  const skillSet = new Set();

  normalizeList(job?.shortTitle).forEach((skill) => skillSet.add(toCanonicalSkill(skill)));
  normalizeList(job?.cat).forEach((skill) => skillSet.add(toCanonicalSkill(skill)));

  const desc = String(job?.desc || "");
  const match = desc.match(/required skills\s*:\s*([^\n]+)/i);
  normalizeList(match ? match[1] : "").forEach((skill) =>
    skillSet.add(toCanonicalSkill(skill))
  );

  if (skillSet.size === 0) {
    normalizeList(job?.title).forEach((skill) => skillSet.add(toCanonicalSkill(skill)));
  }

  return Array.from(skillSet);
};

const extractJobLocation = (job) => {
  const shortDesc = String(job?.shortDesc || "");
  const match = shortDesc.match(/location\s*:\s*(.+)/i);
  if (match) return normalizeLocationText(match[1]);

  const desc = String(job?.desc || "");
  const descMatch = desc.match(/location\s*:\s*([^\n]+)/i);
  return descMatch ? normalizeLocationText(descMatch[1]) : "";
};

const getSkillMatchScore = (jobSkills, workerSkills) => {
  if (jobSkills.length === 0) return 60;

  const canonicalWorkerSkills = workerSkills.map((skill) => toCanonicalSkill(skill));
  const workerSet = new Set(canonicalWorkerSkills);

  const totalMatch = jobSkills.reduce((acc, jobSkill) => {
    const canonicalJobSkill = toCanonicalSkill(jobSkill);
    if (workerSet.has(canonicalJobSkill)) {
      return acc + 1;
    }

    const jobTokens = new Set(toSkillTokens(canonicalJobSkill));
    const hasPartial = canonicalWorkerSkills.some((workerSkill) => {
      const workerTokens = new Set(toSkillTokens(workerSkill));
      let overlap = 0;
      jobTokens.forEach((token) => {
        if (workerTokens.has(token)) overlap += 1;
      });
      return overlap >= 1;
    });

    return acc + (hasPartial ? 0.7 : 0);
  }, 0);

  return clampScore((totalMatch / jobSkills.length) * 100);
};

const getLocationScore = (jobLocation, workerLocation) => {
  if (!jobLocation || !workerLocation) return 30;

  const job = parseLocationParts(jobLocation);
  const worker = parseLocationParts(workerLocation);

  if (!job.raw || !worker.raw) return 30;

  if (job.raw === worker.raw) return 100;
  if (job.city && worker.city && job.city === worker.city) return 100;

  const overlapRatio = getLocationTokenOverlap(job.raw, worker.raw);
  if (overlapRatio >= 0.5) return 80;

  if (job.state && worker.state && job.state === worker.state) return 70;
  if (job.state && worker.city && job.state === worker.city) return 70;
  if (worker.state && job.city && worker.state === job.city) return 70;

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
