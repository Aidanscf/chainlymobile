import { create } from "zustand";
import { riderCharacter } from "../data/mock";
import {
  createTripPlanPreview,
  hydrateTripPlanToFull,
  getDestinationById,
} from "../services/trailsService";
import useChainlyStore from "@/store/chainlyStore";
import useSettingsStore from "@/store/settings";
import { startAIJob, waitForAIJob } from "@/services/aiJobClient";
import { geocodeDestinationName } from "@/services/geoService";
import { uuidv4 } from "@/utils/uuid";

function deepClone(obj) {
  return JSON.parse(JSON.stringify(obj));
}

function normalizeDifficulty(input) {
  const d = String(input || "")
    .toLowerCase()
    .replace(/\s+/g, "_");
  if (d === "green") return "green";
  if (d === "blue") return "blue";
  if (d === "black") return "black";
  if (d === "double_black" || d === "double-black" || d === "doubleblack") {
    return "double_black";
  }
  // fallback: treat unknown as blue-ish
  return "blue";
}

function safeArray(value) {
  return Array.isArray(value) ? value : [];
}

function toNumberFromString(value) {
  if (value == null) {
    return 0;
  }
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }
  const raw = String(value);
  // pull the first number we see (handles "25", "25 km", "~25", "25-30")
  const match = raw.match(/-?\d+(?:\.\d+)?/);
  const n = match ? Number(match[0]) : NaN;
  return Number.isFinite(n) ? n : 0;
}

function mapWizardToTripPlannerInput({ wizard, userProfile, selectedBike }) {
  const destinationName = String(wizard?.destination?.name || "").trim();
  const region = String(wizard?.destination?.region || "").trim();

  const skillLevel = String(
    wizard?.riderProfile?.skillLevel ||
      userProfile?.skillLevel ||
      "Intermediate",
  ).trim();
  const fitness = String(wizard?.riderProfile?.fitness || "Medium").trim();
  const bikeType = String(
    wizard?.riderProfile?.bikeType || userProfile?.primaryDiscipline || "Trail",
  ).trim();

  const strengths = safeArray(wizard?.riderProfile?.strengths).slice(0, 6);
  const terrainTags = safeArray(wizard?.preferences?.terrainTags).slice(0, 12);

  const preferences = [];
  if (wizard?.preferences?.wantsFlow) preferences.push("flow");
  if (wizard?.preferences?.wantsTech) preferences.push("tech");
  if (wizard?.preferences?.wantsJumps) preferences.push("jumps");
  for (const t of terrainTags) {
    const st = String(t || "").trim();
    if (st) preferences.push(st);
  }

  const dedupedPrefs = Array.from(new Set(preferences)).slice(0, 12);

  return {
    destination: {
      name: destinationName,
      region: region || null,
      lat: wizard?.destination?.lat ?? null,
      lng: wizard?.destination?.lng ?? null,
    },
    dates: {
      start: null,
      end: null,
      days: Number(wizard?.durationDays || 2) || 2,
    },
    rider: {
      skill_level: skillLevel,
      fitness,
      bike_type: bikeType,
      strengths,
      preferences: dedupedPrefs,
      // MVP: inferred rather than collected
      daily_time_hours:
        wizard?.preferences?.difficulty === "easy"
          ? 3
          : wizard?.preferences?.difficulty === "hard"
            ? 6
            : 4,
    },
    logistics: {
      budget_tier: String(wizard?.constraints?.budget || "$$"),
      group_size: Number(wizard?.constraints?.groupSize || 1) || 1,
      lodging_preference: String(
        wizard?.constraints?.accommodationType || "Lodge",
      ),
      notes: null,
    },
    bike_profile: selectedBike
      ? {
          name: selectedBike?.name || null,
          bike_type: selectedBike?.bike_type || null,
          wheel_size: selectedBike?.wheel_size || null,
          drivetrain_speed: selectedBike?.drivetrain_speed || null,
          suspension_travel_front:
            selectedBike?.suspension_travel_front || null,
          suspension_travel_rear: selectedBike?.suspension_travel_rear || null,
          is_tubeless:
            typeof selectedBike?.is_tubeless === "boolean"
              ? selectedBike.is_tubeless
              : null,
          brake_mount: selectedBike?.brake_mount || null,
        }
      : null,
  };
}

function adaptTripPlannerJsonToInternalPlan({
  json,
  wizard,
  fallbackDestination,
}) {
  const destination =
    wizard?.destination ||
    fallbackDestination ||
    (json?.trip_summary?.destination
      ? {
          id: String(wizard?.destination?.id || "unknown"),
          name: String(json.trip_summary.destination),
          region: String(wizard?.destination?.region || ""),
          lat: wizard?.destination?.lat ?? null,
          lng: wizard?.destination?.lng ?? null,
        }
      : null);

  const durationDays = Number(wizard?.durationDays || 2) || 2;

  // Backwards-compatible: if we ever get the old schema (daily_itinerary), keep using it.
  const dailyLegacy = safeArray(json?.daily_itinerary).slice(0, 7);
  const hasLegacy = dailyLegacy.length > 0;

  const featuredTrails = [];
  let itineraryDays = [];

  if (hasLegacy) {
    const daily = dailyLegacy;

    itineraryDays = daily.map((d, idx) => {
      const trails = safeArray(d?.ride_plan?.trails).slice(0, 5);

      // Build featured trail objects for map + trail screens
      const trailIds = [];
      for (let i = 0; i < trails.length; i += 1) {
        const t = trails[i];
        const id =
          String(t?.trailforks_id || "") || `ai-trail-${idx}-${i}-${uuidv4()}`;
        trailIds.push(id);
        featuredTrails.push({
          id,
          destinationId: destination?.id || "unknown",
          name: String(t?.name || `Trail ${i + 1}`),
          difficulty: normalizeDifficulty(t?.difficulty),
          distanceKm: Number(t?.distance_km || 0) || 0,
          climbingM: Number(t?.elevation_m || 0) || 0,
          tags: safeArray(wizard?.preferences?.terrainTags).slice(0, 8),
          image:
            "https://images.unsplash.com/photo-1520975958225-71c5d1f6a9b9?w=1200&h=800&fit=crop",
        });
      }

      const entries = [];
      const title = String(d?.title || `Day ${idx + 1}`);
      const notes = safeArray(d?.notes).filter(Boolean).slice(0, 3);
      const bailouts = safeArray(d?.ride_plan?.bailouts)
        .filter(Boolean)
        .slice(0, 2);

      entries.push({
        id: `d${idx}-morning`,
        type: "ride",
        title: `Morning ride: ${trails[0]?.name ? String(trails[0]?.name) : "Warm-up laps"}`,
        time: "9:30 AM",
        duration: `${Math.max(1, Math.round(Number(d?.ride_plan?.estimated_time_hours || 3)))}h`,
        tips:
          bailouts.length > 0
            ? `Bailouts: ${bailouts.join(" • ")}`
            : notes[0] || "Start easy and build into it.",
        trailIds,
      });

      entries.push({
        id: `d${idx}-lunch`,
        type: "lunch",
        title: safeArray(d?.food)?.[0]?.name
          ? `Lunch: ${String(safeArray(d?.food)?.[0]?.name)}`
          : "Lunch: quick carbs + hydration",
        time: "12:15 PM",
        duration: "45m",
        tips: safeArray(d?.food)?.[0]?.why
          ? String(safeArray(d?.food)?.[0]?.why).slice(0, 120)
          : "Electrolytes + something salty.",
      });

      entries.push({
        id: `d${idx}-afternoon`,
        type: "ride",
        title: trails[1]?.name
          ? `Afternoon ride: ${String(trails[1]?.name)}`
          : "Afternoon ride: pick your spice",
        time: "1:30 PM",
        duration: "2h",
        tips: notes[1] || "If you’re feeling good, add one bonus lap.",
        trailIds,
      });

      return {
        id: `day-${idx + 1}`,
        dayIndex: idx,
        title,
        entries,
      };
    });
  } else {
    // New schema: trail_networks + top_trails_or_loops (no day-by-day itinerary)
    const networks = safeArray(json?.trail_networks).slice(0, 8);
    const top = safeArray(json?.top_trails_or_loops).slice(0, 6);

    // Build featured trails from top trails/loops first (best for Map + Trail screens)
    for (let i = 0; i < top.length; i += 1) {
      const t = top[i];
      const trailIds = safeArray(t?.trail_ids).filter(Boolean);
      const id = String(trailIds?.[0] || "") || `ai-trail-top-${i}-${uuidv4()}`;

      featuredTrails.push({
        id,
        destinationId: destination?.id || "unknown",
        name: String(t?.name || `Top ride ${i + 1}`),
        difficulty: normalizeDifficulty(t?.difficulty),
        distanceKm: toNumberFromString(t?.distance_km),
        climbingM: toNumberFromString(t?.elevation_m),
        tags: safeArray(wizard?.preferences?.terrainTags).slice(0, 8),
        image:
          "https://images.unsplash.com/photo-1520975958225-71c5d1f6a9b9?w=1200&h=800&fit=crop",
      });
    }

    // If AI didn’t give top trails, fall back to networks as “featured trails” so UI still renders.
    if (featuredTrails.length === 0) {
      for (let i = 0; i < networks.length; i += 1) {
        const n = networks[i];
        const trailIds = safeArray(n?.trail_ids).filter(Boolean);
        const id = String(trailIds?.[0] || "") || `ai-network-${i}-${uuidv4()}`;

        featuredTrails.push({
          id,
          destinationId: destination?.id || "unknown",
          name: String(n?.name || `Trail network ${i + 1}`),
          difficulty: normalizeDifficulty(n?.difficulty_range || "blue"),
          distanceKm: toNumberFromString(n?.classic_ride_estimate?.distance_km),
          climbingM: toNumberFromString(n?.classic_ride_estimate?.elevation_m),
          tags: safeArray(wizard?.preferences?.terrainTags).slice(0, 8),
          image:
            "https://images.unsplash.com/photo-1520975958225-71c5d1f6a9b9?w=1200&h=800&fit=crop",
        });
      }
    }

    const stayList = safeArray(json?.stay_recommendations).slice(0, 4);
    const foodList = safeArray(json?.food_recommendations).slice(0, 8);

    const rides = [...featuredTrails];
    const perDay = 2;

    itineraryDays = Array.from({ length: Math.max(1, durationDays) }).map(
      (_, dayIdx) => {
        const startIndex = dayIdx * perDay;
        const morning = rides[startIndex] || rides[0] || null;
        const afternoon = rides[startIndex + 1] || rides[1] || morning;

        const morningTrailIds = morning?.id ? [morning.id] : [];
        const afternoonTrailIds = afternoon?.id ? [afternoon.id] : [];
        const allTrailIds = Array.from(
          new Set([...morningTrailIds, ...afternoonTrailIds]),
        );

        const titleBase = networks?.[dayIdx]?.name
          ? String(networks[dayIdx].name)
          : destination?.name
            ? String(destination.name)
            : `Day ${dayIdx + 1}`;

        const entries = [];

        entries.push({
          id: `d${dayIdx}-morning`,
          type: "ride",
          title: morning?.name
            ? `Ride: ${String(morning.name)}`
            : "Ride: classic loop",
          time: "9:30 AM",
          duration: wizard?.preferences?.difficulty === "hard" ? "4h" : "3h",
          tips: top?.[0]?.why
            ? String(top[0].why).slice(0, 140)
            : "Start with the best network close to trail access.",
          trailIds: allTrailIds,
        });

        const lunchPick =
          foodList.find((f) => String(f?.type || "") === "lunch") ||
          foodList.find((f) => String(f?.type || "") === "post_ride") ||
          foodList[0] ||
          null;

        entries.push({
          id: `d${dayIdx}-lunch`,
          type: "lunch",
          title: lunchPick?.name
            ? `Food: ${String(lunchPick.name)}`
            : "Food: refuel",
          time: "12:15 PM",
          duration: "45m",
          tips: lunchPick?.why
            ? String(lunchPick.why).slice(0, 120)
            : "Carbs + hydration = better laps.",
        });

        if (afternoon && afternoon?.name && afternoon?.id !== morning?.id) {
          entries.push({
            id: `d${dayIdx}-afternoon`,
            type: "ride",
            title: `Bonus: ${String(afternoon.name)}`,
            time: "1:30 PM",
            duration: "2h",
            tips: "If you’re feeling good, add one bonus loop.",
            trailIds: allTrailIds,
          });
        }

        // Add a simple stay note (the UI shows logistics separately, but this keeps the itinerary from feeling empty)
        const stayPick = stayList[0] || null;
        if (stayPick?.name) {
          entries.push({
            id: `d${dayIdx}-stay`,
            type: "stay",
            title: `Stay: ${String(stayPick.name)}`,
            time: "7:00 PM",
            duration: "",
            tips: stayPick?.proximity_to_trails
              ? String(stayPick.proximity_to_trails)
              : String(stayPick.why || "Close to trail access").slice(0, 120),
          });
        }

        return {
          id: `day-${dayIdx + 1}`,
          dayIndex: dayIdx,
          title: titleBase,
          entries,
        };
      },
    );
  }

  const dedupedFeaturedTrails = [];
  const seenTrailIds = new Set();
  for (const t of featuredTrails) {
    if (!t?.id) continue;
    if (seenTrailIds.has(t.id)) continue;
    seenTrailIds.add(t.id);
    dedupedFeaturedTrails.push(t);
  }

  // Summary numbers
  const distSum = dedupedFeaturedTrails.reduce(
    (acc, t) => acc + (Number(t.distanceKm || 0) || 0),
    0,
  );
  const climbSum = dedupedFeaturedTrails.reduce(
    (acc, t) => acc + (Number(t.climbingM || 0) || 0),
    0,
  );

  // Logistics + essentials (supports both schemas)
  const stayRawLegacy = safeArray(dailyLegacy?.[0]?.stay).slice(0, 2);
  const eatRawLegacy = safeArray(dailyLegacy?.[0]?.food).slice(0, 2);

  const stayRawNew = safeArray(json?.stay_recommendations).slice(0, 3);
  const eatRawNew = safeArray(json?.food_recommendations).slice(0, 4);

  const stayRaw = hasLegacy ? stayRawLegacy : stayRawNew;
  const eatRaw = hasLegacy ? eatRawLegacy : eatRawNew;

  const safetyNotes = safeArray(json?.safety_and_access_notes)
    .filter(Boolean)
    .slice(0, 5);

  // New schema doesn’t include local_tips, so use network watch-outs + follow-ups as “access notes”
  const accessNotesFromNetworks = safeArray(json?.trail_networks)
    .flatMap((n) => safeArray(n?.watch_outs))
    .filter(Boolean)
    .slice(0, 4);
  const accessNotesFromFollowUps = safeArray(json?.follow_up_questions)
    .filter(Boolean)
    .slice(0, 2)
    .map((q) => `Quick question: ${String(q)}`);

  const accessNotes = hasLegacy
    ? safeArray(json?.local_tips).filter(Boolean).slice(0, 4)
    : [...accessNotesFromNetworks, ...accessNotesFromFollowUps].slice(0, 4);

  const pack = json?.packing_checklist || {};
  const packItems = [
    ...safeArray(pack?.bike),
    ...safeArray(pack?.spares_tools),
    ...safeArray(pack?.clothing),
    ...safeArray(pack?.nutrition),
  ]
    .filter(Boolean)
    .slice(0, 18)
    .map((label) => ({
      id: `pack-${uuidv4()}`,
      label: String(label),
      checked: false,
    }));

  const plan = {
    id: String(Date.now()),
    destination,
    durationDays,
    riderProfile: wizard?.riderProfile || {},
    preferences: wizard?.preferences || {},
    constraints: wizard?.constraints || {},
    itineraryDays: safeArray(itineraryDays).slice(0, durationDays),
    featuredTrails: dedupedFeaturedTrails.slice(0, 12),
    logistics: {
      stay: stayRaw.map((s) => ({
        id: `stay-${uuidv4()}`,
        name: String(s?.name || "Stay option"),
        rating: 4.6,
        type: String(s?.type || s?.tier || "Lodge"),
      })),
      eat: eatRaw.map((e) => ({
        id: `eat-${uuidv4()}`,
        name: String(e?.name || "Food stop"),
        rating: 4.6,
        vibe: String(e?.why || "Solid post-ride fuel").slice(0, 40),
      })),
    },
    essentials: {
      safetyNotes: safetyNotes.length
        ? safetyNotes
        : ["Check trail conditions and closures before you drop in."],
      accessNotes: accessNotes.length
        ? accessNotes
        : ["Respect trail signage and local rules."],
    },
    packingChecklist: packItems.length
      ? packItems
      : [
          {
            id: `pack-${uuidv4()}`,
            label: "Spare tube + levers",
            checked: false,
          },
          { id: `pack-${uuidv4()}`, label: "Mini-pump / CO₂", checked: false },
          {
            id: `pack-${uuidv4()}`,
            label: "Multi-tool + quick link",
            checked: false,
          },
        ],
    shareCardData: {
      title: `${destination?.name || "Trip"} Trip Plan`,
      subtitle: `${durationDays} day${durationDays === 1 ? "" : "s"} • Built for your vibe`,
      badges: ["Rider Favorite"],
      topTrails: dedupedFeaturedTrails.slice(0, 3).map((t) => t.name),
    },
    summary: {
      distanceKm: Math.round(distSum),
      climbingM: Math.round(climbSum),
    },
    aiPlan: json || null,
  };

  return plan;
}

const defaultWizard = {
  destination: null, // {id,name,region,lat,lng}
  durationDays: 2,
  dates: null,

  riderProfile: {
    skillLevel: riderCharacter?.overall > 84 ? "Advanced" : "Intermediate",
    fitness: riderCharacter?.overall > 88 ? "High" : "Medium",
    bikeType: "Trail",
    strengths: (riderCharacter?.strengths || []).slice(0, 3),
  },

  preferences: {
    difficulty: "medium", // easy | medium | hard
    terrainTags: ["flow"],
    wantsJumps: true,
    wantsTech: false,
    wantsFlow: true,
  },

  constraints: {
    budget: "$$",
    groupSize: 2,
    accommodationType: "Lodge",
  },

  stravaEnabled: false,
};

export const useTripsStore = create((set, get) => ({
  wizard: deepClone(defaultWizard),
  currentPlan: null,
  loading: false,
  aiJobId: null,
  aiProgress: 0,

  savedTrips: [],

  // --- Wizard setters
  setWizardField: (key, value) => {
    set((state) => ({
      wizard: {
        ...state.wizard,
        [key]: value,
      },
    }));
  },

  setWizardNestedField: (section, key, value) => {
    set((state) => ({
      wizard: {
        ...state.wizard,
        [section]: {
          ...(state.wizard?.[section] || {}),
          [key]: value,
        },
      },
    }));
  },

  setDestination: (destination) => {
    set((state) => ({
      wizard: {
        ...state.wizard,
        destination,
      },
    }));
  },

  resetWizard: () => {
    set({
      wizard: deepClone(defaultWizard),
      currentPlan: null,
      loading: false,
      aiJobId: null,
      aiProgress: 0,
    });
  },

  // --- Plan generation (AI-backed)
  generatePreviewPlan: async () => {
    const { wizard } = get();
    if (!wizard?.destination) {
      throw new Error("Pick a destination first");
    }

    set({ loading: true, aiProgress: 0 });
    try {
      // Keep it feeling premium
      await new Promise((r) => setTimeout(r, 250));

      const userProfile = useSettingsStore.getState?.().settings?.userProfile;
      const bikes = useChainlyStore.getState?.().bikes;
      const selectedBike = Array.isArray(bikes) ? bikes[0] : null;

      // If this is a typed/custom destination (no coords), try to resolve it.
      // No UI change — it just improves the AI prompt + map.
      let resolvedWizard = wizard;
      const hasCoords =
        typeof wizard?.destination?.lat === "number" &&
        typeof wizard?.destination?.lng === "number";

      if (!hasCoords) {
        const geo = await geocodeDestinationName(wizard?.destination?.name);
        if (geo?.lat != null && geo?.lng != null) {
          const nextDestination = {
            ...(wizard.destination || {}),
            // keep the user-facing name stable, but enrich region/coords
            region: wizard?.destination?.region || geo.region || "",
            lat: geo.lat,
            lng: geo.lng,
          };

          resolvedWizard = { ...wizard, destination: nextDestination };

          set((state) => ({
            wizard: {
              ...state.wizard,
              destination: nextDestination,
            },
          }));
        }
      }

      const plannerInput = mapWizardToTripPlannerInput({
        wizard: resolvedWizard,
        userProfile,
        selectedBike,
      });

      const { job } = await startAIJob({
        type: "trip_planner",
        input: plannerInput,
      });

      if (!job?.id) {
        throw new Error("Could not start planner job");
      }

      set({
        aiJobId: String(job.id),
        aiProgress: Number(job.progress || 0) || 0,
      });

      let finalJob = job;
      if (String(job.status || "") !== "completed") {
        const waiter = waitForAIJob({
          jobId: job.id,
          pollIntervalMs: 700,
          timeoutMs: 45000,
          onProgress: (j) => {
            const nextProg = Number(j?.progress || 0) || 0;
            set({ aiProgress: Math.max(0, Math.min(100, nextProg)) });
          },
        });
        finalJob = await waiter.done;
      }

      const planJson = finalJob?.result || null;
      const internal = planJson
        ? adaptTripPlannerJsonToInternalPlan({
            json: planJson,
            wizard: resolvedWizard,
            fallbackDestination: resolvedWizard.destination,
          })
        : null;

      // If AI fails hard, fall back to the existing mock planner
      const plan =
        internal ||
        createTripPlanPreview({
          destination: resolvedWizard.destination,
          durationDays: Number(resolvedWizard.durationDays || 2),
          riderProfile: resolvedWizard.riderProfile,
          preferences: resolvedWizard.preferences,
          constraints: resolvedWizard.constraints,
        });

      set({ currentPlan: plan, loading: false, aiProgress: 100 });
      return plan;
    } catch (error) {
      console.error(error);
      set({ loading: false });
      throw error;
    }
  },

  generateFullPlanFromPreview: async () => {
    const plan = get().currentPlan;
    if (!plan) {
      throw new Error("No preview plan found");
    }

    set({ loading: true });
    try {
      await new Promise((r) => setTimeout(r, 550));
      const next = hydrateTripPlanToFull(plan);
      set({ currentPlan: next, loading: false });
      return next;
    } catch (error) {
      console.error(error);
      set({ loading: false });
      throw error;
    }
  },

  // For deep links from Home: set destination + duration, generate preview
  prefillAndPreviewFromRecommendation: async ({
    destinationId,
    durationDays,
  }) => {
    const destination = getDestinationById(destinationId);
    if (!destination) {
      throw new Error("Unknown destination");
    }

    set((state) => ({
      wizard: {
        ...state.wizard,
        destination,
        durationDays: Number(durationDays || state.wizard.durationDays || 2),
      },
    }));

    return await get().generatePreviewPlan();
  },

  // --- Checklist & ordering
  toggleChecklistItem: (itemId) => {
    set((state) => {
      const plan = state.currentPlan;
      if (!plan) {
        return {};
      }
      const nextList = (plan.packingChecklist || []).map((i) => {
        if (i.id !== itemId) {
          return i;
        }
        return { ...i, checked: !i.checked };
      });
      return { currentPlan: { ...plan, packingChecklist: nextList } };
    });
  },

  moveEntry: ({ dayIndex, entryIndex, direction }) => {
    set((state) => {
      const plan = state.currentPlan;
      if (!plan) {
        return {};
      }
      const days = Array.isArray(plan.itineraryDays) ? plan.itineraryDays : [];
      const day = days[dayIndex];
      if (!day) {
        return {};
      }

      const entries = Array.isArray(day.entries) ? [...day.entries] : [];
      const nextIndex = direction === "up" ? entryIndex - 1 : entryIndex + 1;
      if (nextIndex < 0 || nextIndex >= entries.length) {
        return {};
      }

      const tmp = entries[entryIndex];
      entries[entryIndex] = entries[nextIndex];
      entries[nextIndex] = tmp;

      const nextDays = days.map((d, idx) => {
        if (idx !== dayIndex) {
          return d;
        }
        return { ...d, entries };
      });

      return { currentPlan: { ...plan, itineraryDays: nextDays } };
    });
  },

  // --- Save / list
  saveTrip: (plan) => {
    const p = plan || get().currentPlan;
    if (!p) {
      return null;
    }

    const item = {
      ...deepClone(p),
      savedAt: new Date().toISOString(),
    };

    set((state) => ({
      savedTrips: [item, ...(state.savedTrips || [])]
        .filter((x, idx, arr) => arr.findIndex((y) => y.id === x.id) === idx)
        .slice(0, 50),
    }));

    return item;
  },

  listTrips: () => {
    return get().savedTrips || [];
  },

  getTrip: (id) => {
    const list = get().savedTrips || [];
    return list.find((t) => String(t.id) === String(id)) || null;
  },
}));

export default useTripsStore;
