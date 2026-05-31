import React, { useCallback, useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  TextInput,
  Modal,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { useLocalSearchParams, useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import { CheckCircle2, ChevronDown } from "lucide-react-native";

import { colors, spacing, typography, radius, shadows } from "@/theme/index";
import AppCard from "@/components/AppCard";
import AppButton from "@/components/AppButton";
import Chip from "@/components/Chip";
import { useChainlyStore } from "@/store/chainlyStore";
import { useGearStore } from "@/store/gearStore";
import { mockProducts } from "@/utils/ai/gearRecommender";
import ScreenHeader from "@/components/layout/ScreenHeader";

function findProductById({ productId, results }) {
  const id = String(productId || "");
  if (!id) {
    return null;
  }
  const inResults = [results?.top, ...(results?.alternatives || [])].filter(
    Boolean,
  );
  const found = inResults.find((p) => p.id === id);
  if (found) {
    return found;
  }
  return mockProducts.find((p) => p.id === id) || null;
}

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

export default function GearSaveScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const params = useLocalSearchParams();

  const bikes = useChainlyStore((s) => s.bikes);

  const results = useGearStore((s) => s.results);
  const saveToWishlist = useGearStore((s) => s.saveToWishlist);

  const [bikeId, setBikeId] = useState(String(bikes?.[0]?.id || "1"));
  const [bikeOpen, setBikeOpen] = useState(false);
  const [mode, setMode] = useState("upgrade_later"); // upgrade_later | replacing
  const [notes, setNotes] = useState("");
  const [saved, setSaved] = useState(false);

  const product = useMemo(() => {
    return findProductById({ productId: params?.productId, results });
  }, [params?.productId, results]);

  const selectedBike = useMemo(() => {
    return (
      (Array.isArray(bikes) ? bikes : []).find(
        (b) => String(b.id) === String(bikeId),
      ) || null
    );
  }, [bikeId, bikes]);

  const onBack = useCallback(() => router.back(), [router]);

  const onSave = useCallback(async () => {
    if (!product) {
      return;
    }
    try {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (e) {
      // no-op
    }

    saveToWishlist({
      product,
      bikeId,
      mode,
      notes,
    });

    setSaved(true);
  }, [bikeId, mode, notes, product, saveToWishlist]);

  const goToGarage = useCallback(() => {
    if (!bikeId) {
      return;
    }
    router.push(`/garage/${bikeId}`);
  }, [bikeId, router]);

  if (!product) {
    return (
      <View style={styles.container}>
        <StatusBar style="dark" />
        <ScreenHeader title="Save" showBack />
        <View style={{ padding: spacing.xl }}>
          <Text style={styles.title}>Save</Text>
          <Text style={styles.subtitle}>Pick an item from Results first.</Text>
          <AppButton title="Back" onPress={onBack} />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      <ScreenHeader title="Save" showBack />

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{
          padding: spacing.xl,
          paddingBottom: insets.bottom + 28,
        }}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.title}>Save this pick</Text>
        <Text style={styles.subtitle}>
          Wishlist it now. Build it when you’re ready.
        </Text>

        <AppCard
          style={{ backgroundColor: colors.surface }}
          padding={spacing.xl}
        >
          <Text style={styles.productName}>{product.name}</Text>
          <Text style={styles.productPrice}>{product.price}</Text>

          <View style={{ height: spacing.lg }} />

          <Text style={styles.sectionLabel}>Assign to bike</Text>
          <Pressable onPress={() => setBikeOpen(true)} style={styles.selectRow}>
            <Text style={styles.selectValue}>
              {selectedBike?.name || "Pick a bike"}
            </Text>
            <ChevronDown
              size={18}
              color={colors.textSecondary}
              strokeWidth={2.75}
            />
          </Pressable>

          <View style={{ height: spacing.lg }} />

          <Text style={styles.sectionLabel}>Save as</Text>
          <View
            style={{
              flexDirection: "row",
              flexWrap: "wrap",
              gap: spacing.sm,
              marginTop: spacing.md,
            }}
          >
            <Chip
              label="Upgrade later"
              tone="orange"
              selected={mode === "upgrade_later"}
              onPress={() => setMode("upgrade_later")}
            />
            <Chip
              label="Replacing current part"
              tone="orange"
              selected={mode === "replacing"}
              onPress={() => setMode("replacing")}
            />
          </View>

          <View style={{ height: spacing.lg }} />

          <Text style={styles.sectionLabel}>Notes (optional)</Text>
          <View style={styles.inputWrap}>
            <TextInput
              value={notes}
              onChangeText={setNotes}
              placeholder="e.g. Want lighter but still bombproof…"
              placeholderTextColor={colors.textTertiary}
              style={styles.input}
              multiline
            />
          </View>

          <View style={{ height: spacing.xl }} />

          {!saved ? (
            <AppButton title="Save to Wishlist" onPress={onSave} size="large" />
          ) : (
            <AppCard
              style={{
                backgroundColor: colors.successSoft,
                borderColor: "#CCF4DF",
              }}
              padding={spacing.lg}
            >
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: spacing.md,
                }}
              >
                <CheckCircle2
                  size={18}
                  color={colors.success}
                  strokeWidth={2.75}
                />
                <View style={{ flex: 1 }}>
                  <Text style={styles.savedTitle}>Saved!</Text>
                  <Text style={styles.savedSub}>
                    I’ll keep it in your Saved picks.
                  </Text>
                </View>
              </View>
            </AppCard>
          )}

          {saved ? (
            <View style={{ marginTop: spacing.md }}>
              <AppButton
                title="Go to Bike"
                variant="secondary"
                onPress={goToGarage}
                size="large"
              />
            </View>
          ) : null}
        </AppCard>
      </ScrollView>

      <ModalPicker
        visible={bikeOpen}
        title="Pick a bike"
        options={(Array.isArray(bikes) ? bikes : []).map((b) => ({
          key: String(b.id),
          label: b.name,
        }))}
        selectedKey={bikeId}
        onSelect={(key) => {
          setBikeOpen(false);
          setBikeId(String(key));
        }}
        onClose={() => setBikeOpen(false)}
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
    marginBottom: spacing.lg,
  },

  productName: {
    fontSize: 18,
    lineHeight: 22,
    fontFamily: typography.fontFamily.black,
    color: colors.textPrimary,
  },
  productPrice: {
    marginTop: 6,
    fontSize: 22,
    lineHeight: 26,
    fontFamily: typography.fontFamily.black,
    color: colors.textPrimary,
  },

  sectionLabel: {
    fontSize: typography.xs,
    fontFamily: typography.fontFamily.black,
    color: colors.textSecondary,
    letterSpacing: 1.1,
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
    minHeight: 64,
    fontSize: typography.base,
    fontFamily: typography.fontFamily.semibold,
    color: colors.textPrimary,
  },

  savedTitle: {
    fontSize: 16,
    lineHeight: 18,
    fontFamily: typography.fontFamily.black,
    color: colors.success,
  },
  savedSub: {
    marginTop: 4,
    fontSize: typography.sm,
    fontFamily: typography.fontFamily.semibold,
    color: colors.textSecondary,
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
