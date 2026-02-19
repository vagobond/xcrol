export interface TownSubcategory {
  key: string;
  label: string;
}

export interface TownCategory {
  key: string;
  label: string;
  subcategories: TownSubcategory[];
}

export const TOWN_CATEGORIES: TownCategory[] = [
  {
    key: "community",
    label: "community",
    subcategories: [
      { key: "activities", label: "activities" },
      { key: "artists", label: "artists" },
      { key: "childcare", label: "childcare" },
      { key: "general", label: "general" },
      { key: "groups", label: "groups" },
      { key: "pets", label: "pets" },
      { key: "events", label: "events" },
      { key: "lost-found", label: "lost+found" },
      { key: "musicians", label: "musicians" },
      { key: "politics", label: "politics" },
      { key: "rideshare", label: "rideshare" },
      { key: "volunteers", label: "volunteers" },
    ],
  },
  {
    key: "housing",
    label: "housing",
    subcategories: [
      { key: "apts-housing", label: "apts / housing" },
      { key: "rooms-shared", label: "rooms / shared" },
      { key: "sublets-temporary", label: "sublets / temporary" },
      { key: "housing-wanted", label: "housing wanted" },
      { key: "housing-swap", label: "housing swap" },
      { key: "vacation-rentals", label: "vacation rentals" },
      { key: "parking-storage", label: "parking / storage" },
      { key: "office-commercial", label: "office / commercial" },
    ],
  },
  {
    key: "for-sale",
    label: "for sale",
    subcategories: [
      { key: "barter", label: "barter" },
      { key: "bikes", label: "bikes" },
      { key: "boats", label: "boats" },
      { key: "books", label: "books" },
      { key: "business", label: "business" },
      { key: "cars-trucks", label: "cars+trucks" },
      { key: "cds-dvd-vhs", label: "cds/dvd/vhs" },
      { key: "clothing", label: "clothing+acc" },
      { key: "collectibles", label: "collectibles" },
      { key: "computers", label: "computers" },
      { key: "electronics", label: "electronics" },
      { key: "free", label: "free" },
      { key: "furniture", label: "furniture" },
      { key: "general", label: "general" },
      { key: "household", label: "household" },
      { key: "jewelry", label: "jewelry" },
      { key: "materials", label: "materials" },
      { key: "motorcycles", label: "motorcycles" },
      { key: "musical-instruments", label: "musical instruments" },
      { key: "photo-video", label: "photo+video" },
      { key: "sporting", label: "sporting" },
      { key: "tickets", label: "tickets" },
      { key: "tools", label: "tools" },
      { key: "toys-games", label: "toys+games" },
      { key: "video-gaming", label: "video gaming" },
      { key: "wanted", label: "wanted" },
    ],
  },
  {
    key: "services",
    label: "services",
    subcategories: [
      { key: "automotive", label: "automotive" },
      { key: "beauty", label: "beauty" },
      { key: "computer", label: "computer" },
      { key: "creative", label: "creative" },
      { key: "event", label: "event" },
      { key: "financial", label: "financial" },
      { key: "health", label: "health/well" },
      { key: "household", label: "household" },
      { key: "labor-move", label: "labor/move" },
      { key: "legal", label: "legal" },
      { key: "lessons", label: "lessons" },
      { key: "pet", label: "pet" },
      { key: "real-estate", label: "real estate" },
      { key: "skilled-trade", label: "skilled trade" },
      { key: "sm-biz-ads", label: "sm biz ads" },
      { key: "travel", label: "travel/vac" },
      { key: "writing", label: "write/ed/tr8" },
    ],
  },
  {
    key: "jobs",
    label: "jobs",
    subcategories: [
      { key: "accounting", label: "accounting+finance" },
      { key: "admin-office", label: "admin / office" },
      { key: "arch-engineering", label: "arch / engineering" },
      { key: "art-media-design", label: "art/media/design" },
      { key: "biotech-science", label: "biotech/science" },
      { key: "business-mgmt", label: "business/mgmt" },
      { key: "customer-service", label: "customer service" },
      { key: "education", label: "education" },
      { key: "food-bev-hosp", label: "food/bev/hosp" },
      { key: "general-labor", label: "general labor" },
      { key: "government", label: "government" },
      { key: "human-resources", label: "human resources" },
      { key: "internet-engineers", label: "internet engineers" },
      { key: "legal-paralegal", label: "legal/paralegal" },
      { key: "manufacturing", label: "manufacturing" },
      { key: "marketing", label: "marketing/pr/ad" },
      { key: "medical-health", label: "medical/health" },
      { key: "nonprofit", label: "nonprofit sector" },
      { key: "real-estate", label: "real estate" },
      { key: "retail-wholesale", label: "retail/wholesale" },
      { key: "sales", label: "sales/biz dev" },
      { key: "salon-spa", label: "salon/spa/fitness" },
      { key: "security", label: "security" },
      { key: "skilled-trades", label: "skilled trades/craft" },
      { key: "software", label: "software/qa/dba" },
      { key: "systems-network", label: "systems/network" },
      { key: "technical-support", label: "technical support" },
      { key: "transport", label: "transport" },
      { key: "tv-film-video", label: "tv/film/video" },
      { key: "web-design", label: "web/info design" },
      { key: "writing-editing", label: "writing/editing" },
    ],
  },
  {
    key: "gigs",
    label: "gigs",
    subcategories: [
      { key: "computer", label: "computer" },
      { key: "creative", label: "creative" },
      { key: "crew", label: "crew" },
      { key: "domestic", label: "domestic" },
      { key: "event", label: "event" },
      { key: "labor", label: "labor" },
      { key: "talent", label: "talent" },
      { key: "writing", label: "writing" },
    ],
  },
  {
    key: "resumes",
    label: "resumes",
    subcategories: [
      { key: "resumes", label: "resumes" },
    ],
  },
];

export function getCategoryLabel(key: string): string {
  return TOWN_CATEGORIES.find((c) => c.key === key)?.label ?? key;
}

export function getSubcategoryLabel(catKey: string, subKey: string): string {
  const cat = TOWN_CATEGORIES.find((c) => c.key === catKey);
  return cat?.subcategories.find((s) => s.key === subKey)?.label ?? subKey;
}
