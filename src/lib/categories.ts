export type Subcategory = { slug: string; label: string };
export type Category = { slug: string; label: string; emoji: string; subs: Subcategory[] };

export const CATEGORIES: Category[] = [
  { slug: "fashion", label: "Fashion & Apparel", emoji: "🛍️", subs: [
    { slug: "mens", label: "Men's Clothing" },
    { slug: "womens", label: "Women's Clothing" },
    { slug: "kids", label: "Kids' Clothing" },
    { slug: "footwear", label: "Footwear" },
    { slug: "accessories", label: "Accessories" },
  ]},
  { slug: "electronics", label: "Electronics", emoji: "💻", subs: [
    { slug: "mobiles", label: "Mobile Phones" },
    { slug: "laptops", label: "Laptops" },
    { slug: "tablets", label: "Tablets" },
    { slug: "cameras", label: "Cameras" },
    { slug: "audio", label: "Audio Devices" },
  ]},
  { slug: "home", label: "Home & Living", emoji: "🏠", subs: [
    { slug: "furniture", label: "Furniture" },
    { slug: "decor", label: "Home Decor" },
    { slug: "kitchen", label: "Kitchen & Dining" },
    { slug: "bedding", label: "Bedding" },
  ]},
  { slug: "food", label: "Food & Grocery", emoji: "🍔", subs: [
    { slug: "produce", label: "Fresh Produce" },
    { slug: "packaged", label: "Packaged Foods" },
    { slug: "beverages", label: "Beverages" },
    { slug: "snacks", label: "Snacks" },
  ]},
  { slug: "beauty", label: "Beauty & Personal Care", emoji: "💄", subs: [
    { slug: "skincare", label: "Skincare" },
    { slug: "makeup", label: "Makeup" },
    { slug: "haircare", label: "Hair Care" },
    { slug: "fragrances", label: "Fragrances" },
  ]},
  { slug: "sports", label: "Sports & Fitness", emoji: "🏋️", subs: [
    { slug: "equipment", label: "Exercise Equipment" },
    { slug: "sportswear", label: "Sportswear" },
    { slug: "outdoor", label: "Outdoor Gear" },
  ]},
  { slug: "books", label: "Books & Stationery", emoji: "📚", subs: [
    { slug: "books", label: "Books" },
    { slug: "office", label: "Office Supplies" },
    { slug: "education", label: "Educational Materials" },
  ]},
  { slug: "toys", label: "Toys, Games & Hobbies", emoji: "🎮", subs: [
    { slug: "toys", label: "Toys" },
    { slug: "board", label: "Board Games" },
    { slug: "video", label: "Video Games" },
    { slug: "collectibles", label: "Collectibles" },
  ]},
  { slug: "auto", label: "Automotive", emoji: "🚗", subs: [
    { slug: "accessories", label: "Vehicle Accessories" },
    { slug: "parts", label: "Spare Parts" },
    { slug: "care", label: "Car Care Products" },
  ]},
  { slug: "pets", label: "Pet Supplies", emoji: "🐶", subs: [
    { slug: "food", label: "Pet Food" },
    { slug: "toys", label: "Pet Toys" },
    { slug: "grooming", label: "Grooming Products" },
  ]},
  { slug: "baby", label: "Baby Products", emoji: "👶", subs: [
    { slug: "clothing", label: "Baby Clothing" },
    { slug: "diapers", label: "Diapers" },
    { slug: "feeding", label: "Feeding Accessories" },
  ]},
  { slug: "jewelry", label: "Jewelry & Watches", emoji: "💍", subs: [
    { slug: "rings", label: "Rings" },
    { slug: "necklaces", label: "Necklaces" },
    { slug: "watches", label: "Watches" },
  ]},
  { slug: "health", label: "Health & Wellness", emoji: "🏥", subs: [
    { slug: "healthcare", label: "Healthcare Products" },
    { slug: "devices", label: "Medical Devices" },
    { slug: "vitamins", label: "Vitamins & Supplements" },
  ]},
  { slug: "gifts", label: "Gifts & Special Occasions", emoji: "🎁", subs: [
    { slug: "cards", label: "Gift Cards" },
    { slug: "personalized", label: "Personalized Gifts" },
    { slug: "festival", label: "Festival Collections" },
  ]},
  { slug: "digital", label: "Digital Products & Services", emoji: "📱", subs: [
    { slug: "software", label: "Software" },
    { slug: "courses", label: "Online Courses" },
    { slug: "subscriptions", label: "Digital Subscriptions" },
  ]},
];

export const findCategory = (slug: string) => CATEGORIES.find(c => c.slug === slug);