import React, {
  useCallback,
  useMemo,
  useRef,
  useEffect,
  useState,
} from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  Modal,
  Pressable,
  Alert,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import { ChevronDown, RotateCcw } from "lucide-react-native";

import { colors, spacing, typography, radius, shadows } from "@/theme/index";
import AppCard from "@/components/AppCard";
import AppButton from "@/components/AppButton";
import Chip from "@/components/Chip";
import { useChainlyStore } from "@/store/chainlyStore";
import { useGearStore } from "@/store/gearStore";
import { riderCharacter } from "@/data/mock";
import { inferBikeCompatibilityProfile } from "@/utils/compatibility";
import RecommendedGearCarousel from "@/components/RecommendedGearCarousel";
import { apiFetch } from "@/services/apiClient";
import {
  INTENT_OPTIONS,
  FOCUS_OPTIONS,
  REGION_OPTIONS,
  BUDGET_PRESETS,
  focusToCategoryLabel,
  getRecommendedDiscoveryGear,
  mapAiRecommendedGearToGearCards,
} from "@/utils/ai/gearRecommender";
import ScreenHeader from "@/components/layout/ScreenHeader";
import useSettingsStore from "@/store/settings";
import { Toast } from "@/screens/ai/SuspensionHelper/components/Toast";
import { useToast } from "@/screens/ai/SuspensionHelper/hooks/useToast";

function ModalPicker({
  visible,
  title,
  options,
  selectedKey,
  onSelect,
  onClose,
}) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        <View style={styles.modalSheet}>
          <Text style={styles.modalTitle}>{title}</Text>
          <View style={{ gap: spacing.sm }}>
            {options.map((opt) => {
              const selected = opt.key === selectedKey;
              return (
                <Pressable
                  key={opt.key}
                  onPress={() => onSelect(opt.key)}
                  style={[
                    styles.modalRow,
                    selected && {
                      borderColor: colors.primary,
                      backgroundColor: colors.primarySoft,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.modalRowText,
                      selected && { color: colors.primary },
                    ]}
                  >
                    {opt.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>
      </View>
    </Modal>
  );
}

function spendRangeToBudget(range) {
  const r = String(range || "").trim();
  if (r === "$0–250") return "$";
  if (r === "$250–750") return "$$";
  if (r === "$750–1500") return "$$";
  if (r === "$1500–3000") return "$$$";
  if (r === "$3000+") return "$$$";
  return "$$";
}

function terrainPrefsToWizardTerrain(list) {
  const prefs = Array.isArray(list) ? list : [];
  if (prefs.includes("Tech") || prefs.includes("Steeps")) return "tech";
  if (prefs.includes("Flow")) return "flow";
  return "all_mountain";
}

function toOverviewProduct(card) {
  const c = card && typeof card === "object" ? card : {};
  const ai = c.ai && typeof c.ai === "object" ? c.ai : {};

  const whyRecommended = Array.isArray(ai?.whyRecommended)
    ? ai.whyRecommended.map((x) => String(x || "").trim()).filter(Boolean)
    : [];

  const fitChecks =
    ai?.bikeFit &&
    typeof ai.bikeFit === "object" &&
    Array.isArray(ai.bikeFit.fitChecks)
      ? ai.bikeFit.fitChecks
      : [];

  const compatibleBecause =
    ai?.bikeFit &&
    typeof ai.bikeFit === "object" &&
    Array.isArray(ai.bikeFit.compatibleBecause)
      ? ai.bikeFit.compatibleBecause
          .map((x) => String(x || "").trim())
          .filter(Boolean)
      : [];

  const compatText = compatibleBecause.slice(0, 2).join(" • ");

  // Nicer "Why this fits you" for AI refresh results: blend whyRecommended + compatibility reasons.
  const whyParts = [];
  whyParts.push(...whyRecommended.slice(0, 2));

  if (compatibleBecause.length > 0) {
    whyParts.push(`Fit: ${compatibleBecause.slice(0, 2).join(" • ")}`);
  }

  const builtWhy = whyParts.filter(Boolean).join("\n\n");

  const why =
    builtWhy ||
    String(ai?.description || "").trim() ||
    String(c.buddyCopy || "").trim() ||
    "";

  const trust = whyRecommended.slice(0, 2);
  const trustFallback = compatText ? [compatText] : [String(c.buddyCopy || "")];

  return {
    id: String(c.productId || c.id || ""),
    focus: c.focus,
    name: String(c.name || ""),
    image: String(c.image || ""),
    price: String(c.price || ""),
    match: typeof c.matchScore === "number" ? c.matchScore : 80,
    retailer: "",
    affiliateUrl: "",
    trust: trust.length > 0 ? trust : trustFallback.filter(Boolean),
    why,
    compatibility: {
      compatible: c.compatible !== false,
      reason: String(fitChecks?.[0] || "").trim() || "",
    },
    attrs: {
      weight: "",
      durability: "",
      ridingFit: "",
      compatibility: compatText,
    },
  };
}

export default function GearRecommenderWizardScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const userProfile = useSettingsStore((s) => s.settings.userProfile);
  const bikeInfo = useSettingsStore((s) => s.settings.bikeInfo);

  const bikes = useChainlyStore((s) => s.bikes);
  const getBikeById = useChainlyStore((s) => s.getBikeById);
  const getBikeDetailById = useChainlyStore((s) => s.getBikeDetailById);

  const wizard = useGearStore((s) => s.wizard);
  const setWizardField = useGearStore((s) => s.setWizardField);
  const resetWizard = useGearStore((s) => s.resetWizard);
  const setResults = useGearStore((s) => s.setResults);
  const wishlist = useGearStore((s) => s.wishlist);

  const didPrefill = useRef(false);
  useEffect(() => {
    if (didPrefill.current) {
      return;
    }
    didPrefill.current = true;

    try {
      const budget = spendRangeToBudget(userProfile?.yearlySpendRange);
      const terrain = terrainPrefsToWizardTerrain(
        userProfile?.terrainPreference,
      );

      // Only override if wizard is still at defaults.
      if (wizard?.budget === "$$" && budget) {
        setWizardField("budget", budget);
      }
      if (wizard?.terrain === "all_mountain" && terrain) {
        setWizardField("terrain", terrain);
      }
    } catch (e) {
      console.error(e);
    }
  }, [
    setWizardField,
    userProfile?.terrainPreference,
    userProfile?.yearlySpendRange,
    wizard?.budget,
    wizard?.terrain,
  ]);

  const [focusOpen, setFocusOpen] = useState(false);
  const [bikeOpen, setBikeOpen] = useState(false);
  const [regionOpen, setRegionOpen] = useState(false);

  // Refresh-only state for the "Recommended for You" list.
  const [isRefreshingRecommendedGear, setIsRefreshingRecommendedGear] =
    useState(false);
  const [recommendedGear, setRecommendedGear] = useState([]);
  const [recommendedGearSource, setRecommendedGearSource] =
    useState("discovery");

  const selectedBike = useMemo(() => {
    const fromStore = getBikeById?.(wizard.bikeId);
    return fromStore || bikes?.[0] || null;
  }, [bikes, getBikeById, wizard.bikeId]);

  const bikeDetail = useMemo(() => {
    if (!selectedBike) {
      return null;
    }
    return getBikeDetailById?.(selectedBike.id);
  }, [getBikeDetailById, selectedBike]);

  const compatibilityHint = useMemo(() => {
    if (!selectedBike) {
      return null;
    }
    return `Compatible with: ${selectedBike.name}`;
  }, [selectedBike]);

  const bikeProfile = useMemo(() => {
    if (!selectedBike) {
      return null;
    }
    return inferBikeCompatibilityProfile({
      bike: selectedBike,
      bikeDetail,
    });
  }, [bikeDetail, selectedBike]);

  const recommendedDiscovery = useMemo(() => {
    return getRecommendedDiscoveryGear({
      bikeProfile,
      riderCharacter,
      userProfile,
      bikeInfo,
    });
  }, [bikeInfo, bikeProfile, userProfile]);

  const recommendedItems = useMemo(() => {
    const list = Array.isArray(recommendedGear) ? recommendedGear : [];
    if (list.length > 0) {
      return list;
    }
    return recommendedDiscovery;
  }, [recommendedDiscovery, recommendedGear]);

  useEffect(() => {
    if (isRefreshingRecommendedGear) {
      return;
    }
    if (recommendedGearSource !== "discovery") {
      return;
    }
    setRecommendedGear(recommendedDiscovery);
  }, [
    isRefreshingRecommendedGear,
    recommendedDiscovery,
    recommendedGearSource,
  ]);

  const lastBikeIdRef = useRef(null);
  useEffect(() => {
    const bikeId = selectedBike?.id ? String(selectedBike.id) : "";
    if (!bikeId) {
      return;
    }
    if (lastBikeIdRef.current === null) {
      lastBikeIdRef.current = bikeId;
      return;
    }
    if (lastBikeIdRef.current !== bikeId) {
      lastBikeIdRef.current = bikeId;
      if (!isRefreshingRecommendedGear) {
        setRecommendedGearSource("discovery");
        setRecommendedGear(recommendedDiscovery);
      }
    }
  }, [isRefreshingRecommendedGear, recommendedDiscovery, selectedBike?.id]);

  const { toast, showToast } = useToast();

  const fetchRecommendedGear = useCallback(async () => {
    const unknowns = [];

    // Bike (raw fields; avoid treating inferred defaults as known)
    if (!selectedBike?.wheel_size) unknowns.push("wheel_size");
    if (!selectedBike?.hub_driver) unknowns.push("hub_driver/freehub");
    if (selectedBike?.drivetrain_speed == null)
      unknowns.push("drivetrain_speed");
    if (!selectedBike?.brake_mount) unknowns.push("brake_mount");
    if (
      selectedBike?.rotor_size_front == null &&
      selectedBike?.rotor_size == null
    ) {
      unknowns.push("rotor_size_front");
    }
    if (selectedBike?.rotor_size_rear == null) unknowns.push("rotor_size_rear");

    // Rider profile
    if (!userProfile?.skillLevel) unknowns.push("skillLevel");
    if (!userProfile?.yearlySpendRange) unknowns.push("budget");

    const bikeProfilePayload = {
      name: selectedBike?.name || "",
      brand: selectedBike?.brand || "",
      model: selectedBike?.model || "",
      modelYear: selectedBike?.model_year ?? null,
      discipline: userProfile?.primaryDiscipline || "",
      wheelSize: selectedBike?.wheel_size || null,
      hubDriver: selectedBike?.hub_driver || null,
      drivetrainSpeed: selectedBike?.drivetrain_speed ?? null,
      brakeMount: selectedBike?.brake_mount || null,
      rotorSizeFront:
        selectedBike?.rotor_size_front ?? selectedBike?.rotor_size ?? null,
      rotorSizeRear: selectedBike?.rotor_size_rear ?? null,
      isTubeless: selectedBike?.is_tubeless ?? null,
      compatibilityProfile: bikeProfile || null,
    };

    const riderProfilePayload = {
      skillLevel: userProfile?.skillLevel || "",
      ridingStylePreferences: Array.isArray(userProfile?.terrainPreference)
        ? userProfile.terrainPreference
        : [],
      primaryDiscipline: userProfile?.primaryDiscipline || "",
      budgetRange: userProfile?.yearlySpendRange || "",
      upgradeGoals: Array.isArray(userProfile?.ridingGoals)
        ? userProfile.ridingGoals
        : [],
      brandPreferences: [],
      brandAvoid: [],
    };

    const spend = String(userProfile?.yearlySpendRange || "").trim();
    let budgetMin = 0;
    let budgetMax = 0;
    if (spend === "$0–250") {
      budgetMin = 0;
      budgetMax = 250;
    } else if (spend === "$250–750") {
      budgetMin = 250;
      budgetMax = 750;
    } else if (spend === "$750–1500") {
      budgetMin = 750;
      budgetMax = 1500;
    } else if (spend === "$1500–3000") {
      budgetMin = 1500;
      budgetMax = 3000;
    } else if (spend === "$3000+") {
      budgetMin = 3000;
      budgetMax = 6000;
    }

    const preferences = {
      budgetMin,
      budgetMax,
      brandsPreferred: [],
      brandsAvoid: [],
      priority: "value",
    };

    const res = await apiFetch("/api/gear/recommendations/refresh", {
      method: "POST",
      body: JSON.stringify({
        bikeProfile: bikeProfilePayload,
        riderProfile: riderProfilePayload,
        preferences,
        unknowns,
        region: wizard?.region || undefined,
        currency: wizard?.region === "canada" ? "CAD" : "USD",
        context: { intent: "recommendations_refresh" },
      }),
    });

    const apiList = Array.isArray(res?.recommendedGear)
      ? res.recommendedGear
      : [];

    const notes = Array.isArray(res?.notes) ? res.notes : [];
    const usedFallback = notes
      .map((n) => String(n || "").toLowerCase())
      .some((n) => n.includes("fallback") || n.includes("took too long"));

    return {
      cards: mapAiRecommendedGearToGearCards(apiList),
      usedFallback,
    };
  }, [bikeProfile, selectedBike, userProfile, wizard?.region]);

  const buildLoadingCards = useCallback((cards) => {
    const base = Array.isArray(cards) ? cards : [];
    if (base.length === 0) {
      return Array.from({ length: 6 }).map((_, idx) => ({
        productId: `loading_${idx}`,
        id: `loading_${idx}`,
        focus: "drivetrain",
        name: "",
        image: "",
        price: "",
        category: "drivetrain",
        tag: "",
        trendingScore: 0,
        matchScore: null,
        compatible: true,
        buddyCopy: "",
        standards: {},
        isLoading: true,
      }));
    }

    return base.map((c) => ({
      ...c,
      id: c?.id || c?.productId,
      isLoading: true,
    }));
  }, []);

  const onRefreshRecommendedGear = useCallback(async () => {
    if (isRefreshingRecommendedGear) {
      return;
    }

    // Snapshot current cards so we can restore on error (no blank state).
    const previousCards = Array.isArray(recommendedItems)
      ? recommendedItems
      : [];

    setIsRefreshingRecommendedGear(true);
    try {
      setRecommendedGear(buildLoadingCards(previousCards));

      const res = await fetchRecommendedGear();
      const next = res?.cards;

      if (Array.isArray(next) && next.length > 0) {
        setRecommendedGearSource("ai_refresh");
        setRecommendedGear(next);

        if (res?.usedFallback) {
          showToast(
            "Showing quick recommendations (AI took too long). Tap refresh to try again.",
          );
        }
      } else {
        setRecommendedGear(previousCards);
      }
    } catch (error) {
      console.error(error);
      setRecommendedGear(previousCards);

      Alert.alert(
        "Couldn't refresh",
        "No worries — try again in a sec. Your current picks are still here.",
      );
    } finally {
      setIsRefreshingRecommendedGear(false);
    }
  }, [
    buildLoadingCards,
    fetchRecommendedGear,
    isRefreshingRecommendedGear,
    recommendedItems,
    showToast,
  ]);

  const openRecommendedGearOverview = useCallback(
    (item, allItems) => {
      const list = Array.isArray(allItems) ? allItems : [];
      const clicked = item;
      if (!clicked) {
        return;
      }

      const top = toOverviewProduct(clicked);

      const alternatives = list
        .filter(
          (x) =>
            x && (x.productId || x.id) !== (clicked.productId || clicked.id),
        )
        .filter((x) => !x.isLoading)
        .slice(0, 3)
        .map(toOverviewProduct);

      const alert =
        top?.compatibility && top.compatibility.compatible === false
          ? {
              tone: "orange",
              title: "Compatibility heads‑up",
              message:
                top.compatibility.reason ||
                "Double‑check standards before you buy — this one might need a quick fit check.",
            }
          : null;

      setResults({ top, alternatives, alert });
      router.push("/ai/gear-recommender/results");
    },
    [router, setResults],
  );

  const openDiscoveryItem = useCallback(
    async (item) => {
      if (!item || !selectedBike || !bikeProfile) {
        return;
      }

      // AI refresh items should open instantly, using already-loaded data.
      // IMPORTANT: no API calls on click.
      if (item?.source === "ai_refresh" || item?.ai) {
        if (item?.isLoading) {
          return;
        }
        openRecommendedGearOverview(item, recommendedItems);
        return;
      }

      // --- existing discovery behavior (kept intact): set wizard fields ---
      setWizardField("intent", "upgrade");
      setWizardField("focus", item.focus);
      setWizardField("query", item.name);

      // NEW: show full-screen generating page while the API call runs.
      router.push("/ai/gear-recommender/generating");
    },
    [
      bikeProfile,
      openRecommendedGearOverview,
      recommendedItems,
      router,
      selectedBike,
      setWizardField,
    ],
  );

  const onReset = useCallback(async () => {
    try {
      await Haptics.selectionAsync();
    } catch (e) {
      // no-op
    }
    resetWizard();
  }, [resetWizard]);

  const onGenerate = useCallback(async () => {
    if (wizard.intent !== "find" && !selectedBike) {
      return;
    }

    try {
      if (typeof Haptics.selectionAsync === "function") {
        await Haptics.selectionAsync();
      }
    } catch (e) {
      // no-op
    }

    // NEW: show full-screen generating page while the API call runs.
    router.push("/ai/gear-recommender/generating");
  }, [router, selectedBike, wizard.intent]);

  const focusLabel = useMemo(
    () => focusToCategoryLabel(wizard.focus),
    [wizard.focus],
  );

  const savedPicks = useMemo(() => {
    const items = Array.isArray(wishlist) ? wishlist : [];
    return items.slice(0, 4);
  }, [wishlist]);

  const resetAction = (
    <Pressable
      onPress={onRefreshRecommendedGear}
      onLongPress={onReset}
      hitSlop={10}
      style={{
        width: 44,
        height: 44,
        borderRadius: radius.round,
        alignItems: "center",
        justifyContent: "center",
      }}
      accessibilityRole="button"
      accessibilityLabel="Refresh recommended gear"
    >
      <RotateCcw size={18} color={colors.textSecondary} strokeWidth={2.75} />
    </Pressable>
  );

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />

      <ScreenHeader
        title="Gear Recommender"
        showBack
        rightAction={resetAction}
      />

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{
          padding: spacing.xl,
          paddingBottom: insets.bottom + 28,
        }}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.title}>Gear Recommender</Text>
        <Text style={styles.subtitle}>Tell me what you want to swap.</Text>

        <AppCard style={styles.card}>
          {/* A) Intent */}
          <Text style={styles.sectionLabel}>I WANT TO…</Text>
          <View style={styles.rowWrap}>
            {INTENT_OPTIONS.map((opt) => (
              <Chip
                key={opt.key}
                label={opt.label}
                tone="orange"
                selected={wizard.intent === opt.key}
                onPress={() => setWizardField("intent", opt.key)}
              />
            ))}
          </View>

          <View style={styles.divider} />

          {/* B) Search Query - moved to first position, optional text removed */}
          <Text style={styles.sectionLabel}>SEARCH SPECIFIC ITEM</Text>
          <View style={styles.inputWrap}>
            <TextInput
              value={wizard.query}
              onChangeText={(t) => setWizardField("query", t)}
              placeholder="e.g. SRAM GX Eagle AXS…"
              placeholderTextColor={colors.textTertiary}
              style={styles.input}
              autoCorrect={false}
              autoCapitalize="none"
              returnKeyType="search"
            />
          </View>

          <View style={styles.divider} />

          {/* C) Bike selector + focus - hidden when intent is "find" */}
          {wizard.intent !== "find" && (
            <>
              <Text style={styles.sectionLabel}>BIKE</Text>
              <Pressable
                onPress={() => setBikeOpen(true)}
                style={styles.selectRow}
              >
                <Text style={styles.selectValue}>
                  {selectedBike?.name || "Pick a bike"}
                </Text>
                <ChevronDown
                  size={18}
                  color={colors.textSecondary}
                  strokeWidth={2.75}
                />
              </Pressable>

              <Text style={styles.hintText}>{compatibilityHint}</Text>

              <View style={{ height: spacing.lg }} />
            </>
          )}

          <Text style={styles.sectionLabel}>BIKE COMPONENT FOCUS</Text>
          <Pressable
            onPress={() => setFocusOpen(true)}
            style={styles.selectRow}
          >
            <Text style={styles.selectValue}>{focusLabel}</Text>
            <ChevronDown
              size={18}
              color={colors.textSecondary}
              strokeWidth={2.75}
            />
          </Pressable>

          <View style={styles.divider} />

          {/* D) Filters */}
          <Text style={styles.sectionLabel}>FILTERS</Text>

          <Text style={styles.filterLabel}>Budget</Text>
          <View style={styles.rowWrap}>
            {BUDGET_PRESETS.map((b) => (
              <Chip
                key={b.key}
                label={`Budget: ${b.label}`}
                tone="orange"
                selected={wizard.budget === b.key}
                onPress={() => setWizardField("budget", b.key)}
              />
            ))}
          </View>

          <Text style={[styles.filterLabel, { marginTop: spacing.lg }]}>
            Region
          </Text>
          <Pressable
            onPress={() => setRegionOpen(true)}
            style={styles.selectRow}
          >
            <Text style={styles.selectValue}>
              {REGION_OPTIONS.find((r) => r.key === wizard.region)?.label ||
                "Select region"}
            </Text>
            <ChevronDown
              size={18}
              color={colors.textSecondary}
              strokeWidth={2.75}
            />
          </Pressable>

          <View style={{ height: spacing.xl }} />

          {/* E) Primary CTA */}
          <AppButton
            title="Generate Recommendations"
            onPress={onGenerate}
            size="large"
          />

          <Text style={styles.ctaNote}>
            {wizard.intent === "find"
              ? "I'll find compatible gear based on the component focus and your filters."
              : "I'll use your bike's standards + your rider strengths to keep picks legit."}
          </Text>
        </AppCard>

        <RecommendedGearCarousel
          title="Recommended for You"
          subtitle="Based on your bike, riding style, and what other riders are upgrading"
          items={recommendedItems}
          onSelectItem={openDiscoveryItem}
        />

        {/* Saved picks */}
        <View style={{ marginTop: spacing.xxl }}>
          <Text style={styles.savedTitle}>Saved picks</Text>
          {savedPicks.length === 0 ? (
            <AppCard
              style={{
                backgroundColor: colors.surfaceWarm,
                borderColor: colors.border,
              }}
            >
              <Text style={styles.savedEmptyTitle}>Nothing saved yet</Text>
              <Text style={styles.savedEmptySub}>
                Generate a few picks and save the ones that feel like "yep,
                that's the move."
              </Text>
            </AppCard>
          ) : (
            <View style={{ gap: spacing.md }}>
              {savedPicks.map((w) => (
                <AppCard
                  key={w.id}
                  padding={spacing.lg}
                  style={styles.savedRow}
                  onPress={() =>
                    router.push({
                      pathname: "/ai/gear-recommender/save",
                      params: { productId: w.product?.id },
                    })
                  }
                >
                  <View style={{ flex: 1 }}>
                    <Text style={styles.savedRowTitle} numberOfLines={1}>
                      {w.product?.name || "Saved gear"}
                    </Text>
                    <Text style={styles.savedRowMeta}>
                      {w.mode === "replacing" ? "Replacing" : "Upgrade later"}
                      {w.bikeId ? ` • Bike ${w.bikeId}` : ""}
                    </Text>
                  </View>
                  <Text style={styles.savedRowPrice}>
                    {w.product?.price || ""}
                  </Text>
                </AppCard>
              ))}
            </View>
          )}
        </View>
      </ScrollView>

      <Toast message={toast} />

      <ModalPicker
        visible={focusOpen}
        title="Pick a component"
        options={FOCUS_OPTIONS}
        selectedKey={wizard.focus}
        onSelect={(key) => {
          setFocusOpen(false);
          setWizardField("focus", key);
        }}
        onClose={() => setFocusOpen(false)}
      />

      <ModalPicker
        visible={bikeOpen}
        title="Pick a bike"
        options={(Array.isArray(bikes) ? bikes : []).map((b) => ({
          key: String(b.id),
          label: b.name,
        }))}
        selectedKey={wizard.bikeId}
        onSelect={(key) => {
          setBikeOpen(false);
          setWizardField("bikeId", key);
        }}
        onClose={() => setBikeOpen(false)}
      />

      <ModalPicker
        visible={regionOpen}
        title="Region"
        options={REGION_OPTIONS}
        selectedKey={wizard.region}
        onSelect={(key) => {
          setRegionOpen(false);
          setWizardField("region", key);
        }}
        onClose={() => setRegionOpen(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },

  title: {
    fontSize: 32,
    lineHeight: 34,
    fontFamily: typography.fontFamily.black,
    color: colors.textPrimary,
    letterSpacing: -0.6,
  },
  subtitle: {
    marginTop: spacing.sm,
    fontSize: typography.base,
    lineHeight: 20,
    fontFamily: typography.fontFamily.regular,
    color: colors.textSecondary,
    marginBottom: spacing.xxl,
  },

  card: {
    backgroundColor: colors.surface,
    borderColor: colors.borderLight,
  },

  sectionLabel: {
    fontSize: typography.xs,
    fontFamily: typography.fontFamily.black,
    color: colors.textSecondary,
    letterSpacing: 1.1,
  },
  rowWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
    marginTop: spacing.md,
  },

  divider: {
    height: 1,
    backgroundColor: colors.borderLight,
    marginVertical: spacing.xl,
  },

  selectRow: {
    marginTop: spacing.md,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceWarm,
  },
  selectValue: {
    flex: 1,
    marginRight: spacing.sm,
    fontSize: 15,
    lineHeight: 18,
    fontFamily: typography.fontFamily.black,
    color: colors.textPrimary,
  },
  hintText: {
    marginTop: spacing.sm,
    fontSize: typography.sm,
    lineHeight: 16,
    fontFamily: typography.fontFamily.semibold,
    color: colors.textSecondary,
  },

  inputWrap: {
    marginTop: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceWarm,
    paddingHorizontal: spacing.lg,
    paddingVertical: 12,
  },
  input: {
    fontSize: typography.base,
    fontFamily: typography.fontFamily.semibold,
    color: colors.textPrimary,
  },

  filterLabel: {
    marginTop: spacing.md,
    fontSize: typography.sm,
    fontFamily: typography.fontFamily.black,
    color: colors.textPrimary,
  },

  ctaNote: {
    marginTop: spacing.md,
    fontSize: typography.sm,
    lineHeight: 17,
    fontFamily: typography.fontFamily.semibold,
    color: colors.textSecondary,
    textAlign: "center",
  },

  // Saved
  savedTitle: {
    fontSize: 18,
    lineHeight: 20,
    fontFamily: typography.fontFamily.black,
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  savedEmptyTitle: {
    fontSize: 16,
    lineHeight: 18,
    fontFamily: typography.fontFamily.black,
    color: colors.textPrimary,
  },
  savedEmptySub: {
    marginTop: 6,
    fontSize: typography.base,
    lineHeight: 19,
    fontFamily: typography.fontFamily.regular,
    color: colors.textSecondary,
  },
  savedRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  savedRowTitle: {
    fontSize: 15,
    lineHeight: 17,
    fontFamily: typography.fontFamily.black,
    color: colors.textPrimary,
  },
  savedRowMeta: {
    marginTop: 4,
    fontSize: typography.sm,
    fontFamily: typography.fontFamily.semibold,
    color: colors.textSecondary,
  },
  savedRowPrice: {
    fontSize: typography.sm,
    fontFamily: typography.fontFamily.black,
    color: colors.textPrimary,
  },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.35)",
    padding: spacing.xl,
    justifyContent: "flex-end",
  },
  modalSheet: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.borderLight,
    padding: spacing.xl,
    ...shadows.large,
  },
  modalTitle: {
    fontSize: 18,
    lineHeight: 20,
    fontFamily: typography.fontFamily.black,
    color: colors.textPrimary,
    marginBottom: spacing.lg,
  },
  modalRow: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceWarm,
  },
  modalRowText: {
    fontSize: 15,
    lineHeight: 18,
    fontFamily: typography.fontFamily.black,
    color: colors.textPrimary,
  },
});
