const CATEGORY_KEYWORDS = {
  Plumbing: ["plumber", "plumbing", "pipe", "leak", "leakage", "tap", "drain"],
  "Home Repairs": ["repair", "fix", "maintenance", "carpenter", "furniture", "door", "window", "paint"],
  Tutoring: ["tutor", "tuition", "teach", "teacher", "math", "science", "english", "class"],
  "Graphic Design": ["design", "logo", "poster", "banner", "branding", "photoshop"],
  "Technical Help": ["tech", "laptop", "computer", "wifi", "network", "software", "install", "setup"],
};

const SKILL_KEYWORDS = {
  plumbing: ["plumbing", "pipe repair", "leak fixing", "tap fitting", "drain cleaning"],
  repair: ["repair", "maintenance", "troubleshooting"],
  electrical: ["wiring", "electrical", "switch repair"],
  ac: ["ac servicing", "cooling repair"],
  tutoring: ["teaching", "subject expertise", "lesson planning"],
  design: ["graphic design", "canva", "photoshop"],
  technical: ["device setup", "software installation", "network troubleshooting"],
};

const normalizeSpaces = (text) => text.replace(/\s+/g, " ").trim();

const detectCategory = (text) => {
  const lowerText = text.toLowerCase();
  const match = Object.entries(CATEGORY_KEYWORDS).find(([, keywords]) =>
    keywords.some((keyword) => lowerText.includes(keyword))
  );
  return match ? match[0] : "Home Repairs";
};

const detectBudget = (text) => {
  const budgetMatch = text.match(/(?:budget|cost|price)\s*(?:is|of|around|about)?\s*(?:rs\.?|inr|rupees)?\s*(\d{2,6})/i);
  if (budgetMatch) return Number(budgetMatch[1]);

  const plainNumber = text.match(/\b(\d{2,6})\b/);
  return plainNumber ? Number(plainNumber[1]) : 0;
};

const detectLocation = (text) => {
  const inPattern = text.match(/\bin\s+([a-zA-Z ]{2,40})(?:\bfor\b|\bbudget\b|\burgent\b|\bneed\b|$)/i);
  if (!inPattern) return "";
  return normalizeSpaces(inPattern[1]);
};

const detectSkills = (text, category) => {
  const lowerText = text.toLowerCase();
  const found = new Set();

  Object.entries(SKILL_KEYWORDS).forEach(([trigger, skills]) => {
    if (lowerText.includes(trigger)) {
      skills.forEach((skill) => found.add(skill));
    }
  });

  if (category === "Plumbing") {
    ["pipe repair", "leak fixing", "tap fitting"].forEach((skill) => found.add(skill));
  }

  if (category === "Tutoring") {
    ["teaching", "subject expertise"].forEach((skill) => found.add(skill));
  }

  return Array.from(found);
};

const buildTitle = (category, text) => {
  if (/leak|leakage|pipe/i.test(text)) return "Need plumber for pipe leakage";
  if (/urgent/i.test(text)) return `Urgent ${category} help needed`;
  return `Need ${category} service`;
};

const buildDescription = (text) => {
  const cleaned = normalizeSpaces(text);
  return cleaned.length > 180 ? `${cleaned.slice(0, 177)}...` : cleaned;
};

export const parseVoiceTranscript = (transcript) => {
  const cleanedText = normalizeSpaces(transcript || "");
  if (!cleanedText) {
    return {
      title: "",
      description: "",
      category: "",
      budget: 0,
      location: "",
      skills: [],
    };
  }

  const category = detectCategory(cleanedText);
  const budget = detectBudget(cleanedText);
  const location = detectLocation(cleanedText);
  const skills = detectSkills(cleanedText, category);

  return {
    title: buildTitle(category, cleanedText),
    description: buildDescription(cleanedText),
    category,
    budget,
    location,
    skills,
  };
};
