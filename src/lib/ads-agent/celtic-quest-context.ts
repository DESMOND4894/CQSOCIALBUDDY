export const CELTIC_QUEST_CONTEXT = {
  businessName: "Celtic Quest Fishing Fleet",
  homePort: "Port Jefferson, New York",
  serviceArea: "Long Island Sound",
  phone: "(631) 928-3926",
  website: "https://celticquestfishing.com/",
  bookingUrl: "https://celticquestfishing.com/",
  privateChartersUrl: "https://celticquestfishing.com/private-group-charter/",
  verifiedFacts: [
    "Family-owned and operated since 2002",
    "Open-boat fishing trips run in season",
    "Private charters are available",
    "Family-friendly and beginner-friendly",
    "Rods, reels, bait, tackle, and fishing licenses are included",
    "Crew members help guests fish and fillet and bag the catch",
    "Primary departure point is Port Jefferson Harbor",
    "Private charters include exclusive use of the boat and crew",
    "Private charters are available for family outings and group events",
    "Private-charter inquiries are handled by Celtic Quest Charter Specialists",
  ],
  prohibitedAssumptions: [
    "Never say Celtic Quest is based in Montauk",
    "Never invent a fish species, sailing time, price, discount, availability, or catch guarantee",
    "Never use generated people or boats when approved Celtic Quest photography is available",
    "Never treat a fishing report as a guaranteed future result",
  ],
  creativeRules: [
    "If ad copy targets families, parents, grandparents, or kids, the selected photo must visibly include families or children",
    "If ad copy promotes a catch or fish species, the selected photo must show a real Celtic Quest catch that matches the claim",
    "If ad copy promotes a private charter or group event, use a real group or vessel photo",
    "Reject approval when the audience, offer, and photo do not match",
  ],
  targetingRules: [
    "Minimum age is 25",
    "Never target the entire United States",
    "Use only approved travel geography supported by campaign or reservation evidence",
    "Show age, locations, audiences, exclusions, Advantage+ behavior, budget, schedule, conversion event, and UTMs before approval",
    "Do not use a stale Custom Audience without a visible warning and Des's approval",
    "Do not create a Meta draft until the complete targeting plan is approved",
  ],
  sources: [
    {
      label: "Celtic Quest official website",
      url: "https://celticquestfishing.com/",
    },
    {
      label: "Celtic Quest booking information",
      url: "https://celticquestfishing.com/#book",
    },
  ],
} as const;

export const CELTIC_QUEST_AD_PHOTOS = [
  {
    id: "family-kids",
    label: "Families and kids aboard Celtic Quest IV",
    path: "/ads/celtic-quest-family-kids.jpg",
    fileName: "celtic-quest-family-kids.jpg",
    tags: ["family", "kids", "group", "boat"],
    sourceUrl:
      "https://celticquestfishing.com/wp-content/uploads/2018/02/camp-shot-at-dock_group.jpg",
  },
  {
    id: "actual-guests",
    label: "Guests, crew, and catch",
    path: "/ads/celtic-quest-actual-guests.jpg",
    fileName: "celtic-quest-actual-guests.jpg",
    tags: ["adults", "catch", "crew"],
    sourceUrl:
      "https://celticquestfishing.com/wp-content/uploads/2023/07/IMG_5027.jpg",
  },
  {
    id: "actual-home",
    label: "Guests at the Celtic Grace",
    path: "/ads/celtic-quest-actual-home.jpg",
    fileName: "celtic-quest-actual-home.jpg",
    tags: ["adults", "group", "boat"],
    sourceUrl:
      "https://celticquestfishing.com/wp-content/uploads/2024/09/IMG_5764-scaled-e1713829044553.jpg",
  },
  {
    id: "charter-family-group",
    label: "Family group with the captain in the wheelhouse",
    path: "/ads/celtic-quest-charter-family-group.jpg",
    fileName: "celtic-quest-charter-family-group.jpg",
    tags: ["family", "kids", "group", "boat", "charter"],
    sourceUrl:
      "https://celticquestfishing.com/wp-content/uploads/2018/02/captdes_kids-in-wheelhouse.jpg",
  },
  {
    id: "charter-kids-steering",
    label: "Children participating at the wheel",
    path: "/ads/celtic-quest-charter-kids-steering.jpg",
    fileName: "celtic-quest-charter-kids-steering.jpg",
    tags: ["family", "kids", "boat", "charter"],
    sourceUrl:
      "https://celticquestfishing.com/wp-content/uploads/2018/02/kids-steering-boat.jpg",
  },
  {
    id: "charter-parent-child-catch",
    label: "Parent and child with their catch",
    path: "/ads/celtic-quest-charter-parent-child-catch.jpg",
    fileName: "celtic-quest-charter-parent-child-catch.jpg",
    tags: ["family", "kids", "catch", "charter"],
    sourceUrl:
      "https://celticquestfishing.com/wp-content/uploads/2013/02/IMAGE2879.jpg",
  },
  {
    id: "charter-kids-group",
    label: "Large kids group celebrating aboard the boat",
    path: "/ads/celtic-quest-charter-kids-group.jpg",
    fileName: "celtic-quest-charter-kids-group.jpg",
    tags: ["family", "kids", "group", "boat", "charter"],
    sourceUrl:
      "https://celticquestfishing.com/wp-content/uploads/2016/03/kids3-scaled.jpg",
  },
  {
    id: "charter-choice-01",
    label: "Kids group with the day's catch",
    path: "/ads/cq-charter-choice-01-kids-group-catch.jpg",
    fileName: "cq-charter-choice-01-kids-group-catch.jpg",
    tags: ["family", "kids", "group", "catch", "charter"],
    sourceLabel: "CQ 2024 PICS library",
  },
  {
    id: "charter-choice-02",
    label: "Kids group gathered around the catch",
    path: "/ads/cq-charter-choice-02-kids-group-baskets.jpg",
    fileName: "cq-charter-choice-02-kids-group-baskets.jpg",
    tags: ["family", "kids", "group", "catch", "charter"],
    sourceLabel: "CQ 2024 PICS library",
  },
  {
    id: "charter-choice-03",
    label: "Child proudly holding a large catch",
    path: "/ads/cq-charter-choice-03-child-big-catch.jpg",
    fileName: "cq-charter-choice-03-child-big-catch.jpg",
    tags: ["family", "kids", "catch", "charter"],
    sourceLabel: "CQ 2024 PICS library",
  },
  {
    id: "charter-choice-04",
    label: "Family group showing their catch",
    path: "/ads/cq-charter-choice-04-family-catch.jpg",
    fileName: "cq-charter-choice-04-family-catch.jpg",
    tags: ["family", "kids", "group", "catch", "charter"],
    sourceLabel: "CQ 2024 PICS library",
  },
  {
    id: "charter-choice-05",
    label: "Two kids with their fish",
    path: "/ads/cq-charter-choice-05-two-kids-catch.jpg",
    fileName: "cq-charter-choice-05-two-kids-catch.jpg",
    tags: ["family", "kids", "catch", "charter"],
    sourceLabel: "CQ 2024 PICS library",
  },
  {
    id: "charter-choice-06",
    label: "Parent and child giving a thumbs-up",
    path: "/ads/cq-charter-choice-06-parent-child-thumbs-up.jpg",
    fileName: "cq-charter-choice-06-parent-child-thumbs-up.jpg",
    tags: ["family", "kids", "catch", "charter"],
    sourceLabel: "CQ 2024 PICS library",
  },
  {
    id: "charter-choice-07",
    label: "Young angler with a catch at the rail",
    path: "/ads/cq-charter-choice-07-child-catch.jpg",
    fileName: "cq-charter-choice-07-child-catch.jpg",
    tags: ["family", "kids", "catch", "charter"],
    sourceLabel: "CQ 2024 PICS library",
  },
  {
    id: "charter-choice-08",
    label: "Parent and child holding their fish",
    path: "/ads/cq-charter-choice-08-parent-child-catch.jpg",
    fileName: "cq-charter-choice-08-parent-child-catch.jpg",
    tags: ["family", "kids", "catch", "charter"],
    sourceLabel: "CQ 2024 PICS library",
  },
  {
    id: "charter-choice-09",
    label: "Family fishing together aboard Celtic Quest",
    path: "/ads/cq-charter-choice-09-family-fishing.jpg",
    fileName: "cq-charter-choice-09-family-fishing.jpg",
    tags: ["family", "kids", "group", "catch", "charter"],
    sourceLabel: "CQ 2024 PICS library",
  },
  {
    id: "charter-choice-10",
    label: "Parent and daughter with her catch",
    path: "/ads/cq-charter-choice-10-parent-daughter-catch.jpg",
    fileName: "cq-charter-choice-10-parent-daughter-catch.jpg",
    tags: ["family", "kids", "catch", "charter"],
    sourceLabel: "CQ 2024 PICS library",
  },
] as const;

export const CELTIC_QUEST_PRIVATE_CHARTER_PHOTO_IDS = [
  "charter-choice-01",
  "charter-choice-02",
  "charter-choice-03",
  "charter-choice-04",
  "charter-choice-05",
  "charter-choice-06",
  "charter-choice-07",
  "charter-choice-08",
  "charter-choice-09",
  "charter-choice-10",
] as const;

export const CELTIC_QUEST_PRIVATE_CHARTER_COPY_OPTIONS = [
  {
    id: "exclusive-boat",
    label: "Your Boat. Your Group.",
    angle: "Lead with the exclusive private-boat benefit",
    primaryText:
      "Long Island families and groups — make the whole boat yours.\n\nBook a private Celtic Quest fishing charter from Port Jefferson. Your group gets exclusive use of the boat and crew. Rods, tackle, bait, guidance, and fish cleaning are included.\n\nTell our Charter Specialists your group size and preferred date.",
    headline: "Your Group. Your Private Boat.",
    description: "Exclusive boat and crew. Gear and guidance included.",
  },
  {
    id: "family-gathering",
    label: "A Memorable Family & Group Day",
    angle: "Position the charter as a memorable group occasion",
    primaryText:
      "Planning a family reunion or group day on Long Island?\n\nBring everyone together on a private fishing charter from Port Jefferson. The Celtic Quest boat and crew are reserved for your group, and all fishing gear is included. Beginners are welcome.\n\nAsk about dates for your family or group.",
    headline: "Book a Memorable Day on the Water",
    description: "Private family and group charters from Port Jefferson.",
  },
  {
    id: "easy-all-inclusive",
    label: "We Handle the Gear",
    angle: "Remove the planning and experience barriers",
    primaryText:
      "Long Island group organizers — want an outing without the planning headache?\n\nCeltic Quest supplies the boat, crew, rods, tackle, bait, fishing guidance, and fish cleaning. Your group gets a private charter from Port Jefferson, even if some guests have never fished.\n\nSend us your group size and preferred date.",
    headline: "Private Charter. We Handle the Gear.",
    description: "An easy private outing for beginners and experienced anglers.",
  },
  {
    id: "whole-family",
    label: "Bring the Whole Family",
    angle: "Speak to multi-generation family groups",
    primaryText:
      "Kids, parents, and grandparents — get everyone on the same boat.\n\nA private Celtic Quest charter gives your family exclusive use of the boat and crew. All fishing gear is included, and beginners get help throughout the trip.\n\nPlan your private family outing from Port Jefferson.",
    headline: "Bring the Whole Family Fishing",
    description: "Your private boat, crew, gear and guidance.",
  },
] as const;

export const CELTIC_QUEST_PROVEN_TARGETING_BASELINE = {
  version: "cq-targeting-v1",
  sourceCampaignId: "120249341941310679",
  sourceAdSetId: "120249341941300679",
  sourceAdSetName: "KIDS ADS",
  ageMin: 25,
  ageMax: 65,
  locationTypes: ["home", "recent"],
  advantageAudience: true,
  customLocations: [
    { latitude: 40.676472, longitude: -73.822632, radius: 10, distanceUnit: "mile" },
    { latitude: 40.701464, longitude: -74.078064, radius: 10, distanceUnit: "mile" },
    { latitude: 40.763901, longitude: -73.861084, radius: 10, distanceUnit: "mile" },
    { latitude: 40.780541, longitude: -73.613892, radius: 10, distanceUnit: "mile" },
    { latitude: 40.784701, longitude: -73.361206, radius: 10, distanceUnit: "mile" },
    { latitude: 40.880295, longitude: -73.13324, radius: 10, distanceUnit: "mile" },
    { latitude: 40.884448, longitude: -73.866577, radius: 10, distanceUnit: "mile" },
    { latitude: 40.92804, longitude: -72.91626, radius: 10, distanceUnit: "mile" },
  ],
} as const;

export function copyTargetsFamilies(copy: string) {
  return /\b(famil(?:y|ies)|kids?|children|parents?|grandparents?|grandkids?)\b/i.test(
    copy
  );
}

export function photoMatchesFamilyCopy(photoId: string, copy: string) {
  if (!copyTargetsFamilies(copy)) return true;
  const photo = CELTIC_QUEST_AD_PHOTOS.find((item) => item.id === photoId);
  return Boolean(
    photo?.tags.some((tag) => tag === "family" || tag === "kids")
  );
}
