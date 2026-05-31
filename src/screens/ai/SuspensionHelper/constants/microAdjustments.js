import {
  Waves,
  ArrowBigDownDash,
  Grip,
  ArrowDownToLine,
  SlidersHorizontal,
  Flame,
} from "lucide-react-native";

export const MICRO_ADJUSTMENT_ITEMS = [
  {
    key: "harsh",
    title: "Too Harsh",
    subtitle: "Soften small-bump feel",
    icon: Waves,
    appliesTo: "both",
    explanation:
      "If it feels chattery or pingy, you're likely riding too stiff or too closed on compression.",
    changes: [
      {
        label: "-1 click compression",
        appliesTo: "fork",
        delta: { compressionDelta: -1 },
      },
      {
        label: "-1 click compression",
        appliesTo: "shock",
        delta: { compressionDelta: -1 },
      },
    ],
  },
  {
    key: "bottomout",
    title: "Bottoming Out",
    subtitle: "More support on hits",
    icon: ArrowBigDownDash,
    appliesTo: "shock",
    explanation:
      "If you're smashing through travel, add a touch of spring and slow the return a hair.",
    changes: [
      {
        label: "+5 PSI rear shock",
        appliesTo: "shock",
        delta: { psiDelta: 5 },
      },
      {
        label: "+1 click compression",
        appliesTo: "shock",
        delta: { compressionDelta: 1 },
      },
    ],
  },
  {
    key: "traction",
    title: "Poor Traction",
    subtitle: "More grip, less skip",
    icon: Grip,
    appliesTo: "both",
    explanation:
      "If the bike is skittering, you're not tracking the ground. Open compression and/or slow rebound slightly.",
    changes: [
      {
        label: "-1 click compression",
        appliesTo: "fork",
        delta: { compressionDelta: -1 },
      },
      {
        label: "-1 click compression",
        appliesTo: "shock",
        delta: { compressionDelta: -1 },
      },
    ],
  },
  {
    key: "bouncy",
    title: "Too Bouncy",
    subtitle: "Calm the pogo",
    icon: ArrowDownToLine,
    appliesTo: "both",
    explanation:
      "If it rebounds too fast and bucks you, add a click of rebound damping.",
    changes: [
      {
        label: "+1 click rebound",
        appliesTo: "fork",
        delta: { reboundDelta: 1 },
      },
      {
        label: "+1 click rebound",
        appliesTo: "shock",
        delta: { reboundDelta: 1 },
      },
    ],
  },
  {
    key: "frontdive",
    title: "Front Diving",
    subtitle: "More fork support",
    icon: SlidersHorizontal,
    appliesTo: "fork",
    explanation:
      "If the fork dives under braking, add support with a touch of air and compression.",
    changes: [
      { label: "+3 PSI fork", appliesTo: "fork", delta: { psiDelta: 3 } },
      {
        label: "+1 click compression",
        appliesTo: "fork",
        delta: { compressionDelta: 1 },
      },
    ],
  },
  {
    key: "rearpack",
    title: "Rear Packing",
    subtitle: "Free up the shock",
    icon: Flame,
    appliesTo: "shock",
    explanation:
      "If the rear feels stuck down in repeated hits, your rebound may be too slow.",
    changes: [
      {
        label: "-1 click rebound",
        appliesTo: "shock",
        delta: { reboundDelta: -1 },
      },
    ],
  },
];
