export const CATEGORY_IMAGE_MAP = {
  "Home Repairs": "https://images.pexels.com/photos/5691613/pexels-photo-5691613.jpeg?auto=compress&cs=tinysrgb&w=1200",
  Repair: "https://images.pexels.com/photos/5691613/pexels-photo-5691613.jpeg?auto=compress&cs=tinysrgb&w=1200",
  Plumbing: "https://images.pexels.com/photos/8486972/pexels-photo-8486972.jpeg?auto=compress&cs=tinysrgb&w=1200",
  Tutoring: "https://images.pexels.com/photos/4145354/pexels-photo-4145354.jpeg?auto=compress&cs=tinysrgb&w=1200",
  "Graphic Design": "https://images.pexels.com/photos/3183150/pexels-photo-3183150.jpeg?auto=compress&cs=tinysrgb&w=1200",
  Design: "https://images.pexels.com/photos/3183150/pexels-photo-3183150.jpeg?auto=compress&cs=tinysrgb&w=1200",
  Delivery: "https://images.pexels.com/photos/4391470/pexels-photo-4391470.jpeg?auto=compress&cs=tinysrgb&w=1200",
  "Technical Help": "https://images.pexels.com/photos/3861969/pexels-photo-3861969.jpeg?auto=compress&cs=tinysrgb&w=1200",
  "Tech Help": "https://images.pexels.com/photos/3861969/pexels-photo-3861969.jpeg?auto=compress&cs=tinysrgb&w=1200",
  "Content Writing": "https://images.pexels.com/photos/261662/pexels-photo-261662.jpeg?auto=compress&cs=tinysrgb&w=1200",
  "Delivery and Errands": "https://images.pexels.com/photos/4391470/pexels-photo-4391470.jpeg?auto=compress&cs=tinysrgb&w=1200",
  "Cleaning and Organizing": "https://images.pexels.com/photos/4239037/pexels-photo-4239037.jpeg?auto=compress&cs=tinysrgb&w=1200",
  "Event Support": "https://images.pexels.com/photos/587741/pexels-photo-587741.jpeg?auto=compress&cs=tinysrgb&w=1200",
};

export const getCategoryImage = (category, fallback = "") => {
  if (!category) return fallback;
  return CATEGORY_IMAGE_MAP[category] || fallback;
};
