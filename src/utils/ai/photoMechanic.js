import * as Linking from "expo-linking";
import { colors } from "@/theme/index";

export const ISSUE_CATEGORIES = [
  "brakes",
  "chain",
  "tires",
  "suspension",
  "drivetrain",
  "frame",
  "other",
];

export const CATEGORY_LABELS = {
  brakes: "Brakes",
  chain: "Chain",
  tires: "Tires",
  suspension: "Suspension",
  drivetrain: "Drivetrain",
  frame: "Frame",
  other: "Other",
};

export const CATEGORY_COLORS = {
  brakes: colors.danger,
  chain: colors.primary,
  tires: colors.warning,
  suspension: colors.info,
  drivetrain: "#A855F7",
  frame: colors.success,
  other: colors.textSecondary,
};

export const SYMPTOMS_BY_CATEGORY = {
  brakes: ["Squealing", "Spongy lever", "Rubbing", "Weak bite"],
  chain: ["Skipping", "Noisy drivetrain", "Chain slap", "Stiff link"],
  tires: ["Low pressure feel", "Sidewall cut", "Sealant leak", "Burping"],
  suspension: ["Bottoming out", "Harsh chatter", "Too bouncy", "Stiction"],
  drivetrain: ["Shifting ghosting", "Hard shifts", "Dropping chain"],
};

function confidenceDescriptor(confidence) {
  if (confidence >= 80) return "Pretty sure";
  if (confidence >= 50) return "Likely";
  return "Not sure";
}

function pickCategoryFromUri(imageUri) {
  const seed = String(imageUri || "");
  const n = seed.split("").reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
  const categories = [
    "brakes",
    "chain",
    "tires",
    "suspension",
    "drivetrain",
    "other",
  ];
  return categories[n % categories.length];
}

export function createDiagnosisFromImage(imageUri, { useSample = false } = {}) {
  const detectedCategory = useSample ? "brakes" : pickCategoryFromUri(imageUri);
  const confidence = useSample ? 87 : 55 + ((imageUri?.length || 0) % 40);

  const titleByCategory = {
    brakes: "Brake rub + tired pads",
    chain: "Chain noise + dry links",
    tires: "Low pressure feel",
    suspension: "Suspension feels sticky",
    drivetrain: "Shifting ghosting",
    other: "Something feels off",
  };

  const warningsByCategory = {
    brakes: [
      "If your lever pulls to the bar, don’t ride until it’s sorted.",
      "After any brake work, do a low-speed test in a safe spot.",
    ],
    tires: ["If you see a big sidewall cut, stop and inspect before riding."],
    suspension: ["If there’s oil on the stanchions, pause and check seals."],
  };

  const guides = [
    {
      title: "Quick brake rub fix (5 min)",
      type: "video",
      url: "https://www.youtube.com/results?search_query=mtb+disc+brake+rub+fix",
    },
    {
      title: "How to bed in brake pads",
      type: "article",
      url: "https://www.parktool.com/blog/repair-help/bed-in-procedure-for-disc-brake-pads",
    },
  ];

  const fixStepsByCategory = {
    brakes: [
      {
        title: "Spin the wheel + listen",
        detail: "Find where the rotor rubs. Slow is smooth here.",
        estimatedTimeMin: 2,
        safetyLevel: "low",
        completed: false,
      },
      {
        title: "Center the caliper",
        detail: "Loosen bolts, squeeze lever, tighten evenly.",
        estimatedTimeMin: 6,
        safetyLevel: "med",
        completed: false,
      },
      {
        title: "Check pad thickness",
        detail: "If pads look thin or glazed, swap them.",
        estimatedTimeMin: 12,
        safetyLevel: "med",
        completed: false,
      },
    ],
    chain: [
      {
        title: "Wipe + lube the chain",
        detail: "Use a clean rag. One drop per link.",
        estimatedTimeMin: 8,
        safetyLevel: "low",
        completed: false,
      },
      {
        title: "Check for a stiff link",
        detail: "Flex the chain sideways. Free it with a chain tool if needed.",
        estimatedTimeMin: 10,
        safetyLevel: "low",
        completed: false,
      },
    ],
    tires: [
      {
        title: "Confirm pressure",
        detail: "Use a gauge — fingers lie.",
        estimatedTimeMin: 3,
        safetyLevel: "low",
        completed: false,
      },
      {
        title: "Inspect sidewalls",
        detail: "Look for cuts and weeping sealant.",
        estimatedTimeMin: 5,
        safetyLevel: "med",
        completed: false,
      },
    ],
    suspension: [
      {
        title: "Wipe stanchions",
        detail: "Clean the seals area. Dirt makes stiction worse.",
        estimatedTimeMin: 4,
        safetyLevel: "low",
        completed: false,
      },
      {
        title: "Set sag",
        detail: "Aim ~25–30% depending on your bike + style.",
        estimatedTimeMin: 10,
        safetyLevel: "low",
        completed: false,
      },
    ],
    drivetrain: [
      {
        title: "Check hanger alignment",
        detail: "A tiny bend can cause ghost shifts.",
        estimatedTimeMin: 8,
        safetyLevel: "med",
        completed: false,
      },
      {
        title: "Index gears",
        detail: "Small barrel adjuster turns — quarter turns only.",
        estimatedTimeMin: 10,
        safetyLevel: "med",
        completed: false,
      },
    ],
    other: [
      {
        title: "Pick a symptom",
        detail: "Tell me what you’re feeling and I’ll narrow it down.",
        estimatedTimeMin: 2,
        safetyLevel: "low",
        completed: false,
      },
    ],
  };

  const partsByCategory = {
    brakes: [
      {
        name: "Brake pads",
        specHint: "Match caliper model (e.g., Shimano SLX / SRAM Code)",
        priority: "must",
        estPriceRange: "$20–$45",
      },
      {
        name: "Rotor (if bent / glazed)",
        specHint: "Size + mount: 180/200mm, 6-bolt or Centerlock",
        priority: "nice",
        estPriceRange: "$35–$90",
      },
    ],
    chain: [
      {
        name: "Chain lube",
        specHint: "Wet or dry based on conditions",
        priority: "must",
        estPriceRange: "$8–$18",
      },
    ],
    tires: [
      {
        name: "Sealant",
        specHint: "Tubeless sealant (fresh)",
        priority: "must",
        estPriceRange: "$10–$25",
      },
      {
        name: "Tire plug kit",
        specHint: "Bacon strips / darts",
        priority: "nice",
        estPriceRange: "$10–$30",
      },
    ],
    suspension: [
      {
        name: "Shock pump",
        specHint: "High-pressure",
        priority: "must",
        estPriceRange: "$25–$60",
      },
    ],
    drivetrain: [
      {
        name: "Derailleur hanger (spare)",
        specHint: "Bike-specific",
        priority: "nice",
        estPriceRange: "$20–$45",
      },
    ],
    other: [],
  };

  const toolsByCategory = {
    brakes: [
      { name: "Allen keys", optional: false, have: false },
      { name: "Torque wrench", optional: true, have: false },
      { name: "Clean rag", optional: false, have: true },
    ],
    chain: [
      { name: "Clean rag", optional: false, have: true },
      { name: "Chain tool", optional: true, have: false },
    ],
    tires: [
      { name: "Tire levers", optional: false, have: false },
      { name: "Pump or compressor", optional: false, have: true },
    ],
    suspension: [
      { name: "Shock pump", optional: false, have: false },
      { name: "Hex key set", optional: true, have: true },
    ],
    drivetrain: [
      { name: "Hex key set", optional: false, have: true },
      { name: "Cable cutters", optional: true, have: false },
    ],
    other: [{ name: "Hex key set", optional: false, have: true }],
  };

  const confidenceText = confidenceDescriptor(confidence);

  const session = {
    id: String(Date.now()),
    createdAt: new Date().toISOString(),
    imageUri,
    bikeId: null,
    detectedCategory,
    confidence,
    symptomsSelected: [],
    summary: `${confidenceText}: this looks like a ${CATEGORY_LABELS[detectedCategory] || "bike"} issue. Confirm what you’re feeling and we’ll nail the fix.`,
    warnings: warningsByCategory[detectedCategory] || [],
    fixSteps: fixStepsByCategory[detectedCategory] || [],
    parts: partsByCategory[detectedCategory] || [],
    tools: toolsByCategory[detectedCategory] || [],
    guides,
    saveStatus: "not_saved",
    diagnosisTitle: titleByCategory[detectedCategory] || "Bike check",
    confidenceText,
  };

  return session;
}

export function createMaintenanceItemFromDiagnosis({
  bikeId,
  session,
  title,
  notes,
}) {
  const id = `ai_${Date.now()}`;
  const safeTitle = title || session?.diagnosisTitle || "AI Bike Check";

  const symptoms = (session?.symptomsSelected || []).join(", ");
  const autoNotes = [
    notes,
    session?.summary ? `Summary: ${session.summary}` : null,
    symptoms ? `Symptoms: ${symptoms}` : null,
    session?.confidence != null ? `Confidence: ${session.confidence}%` : null,
  ]
    .filter(Boolean)
    .join("\n");

  return {
    previewQuest: {
      id,
      title: safeTitle,
      completed: false,
      urgent: false,
    },
    maintenanceQuest: {
      id,
      title: safeTitle,
      category: session?.detectedCategory || "other",
      createdAt: new Date().toISOString(),
      source: "ai_photo_mechanic",
      notes: autoNotes,
    },
    bikeId: String(bikeId),
  };
}

export async function openGuide(url) {
  try {
    if (!url) {
      return;
    }
    const supported = await Linking.canOpenURL(url);
    if (!supported) {
      throw new Error(`Cannot open URL: ${url}`);
    }
    await Linking.openURL(url);
  } catch (error) {
    console.error(error);
    throw error;
  }
}
