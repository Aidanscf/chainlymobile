import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Platform,
  Alert,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import { Wrench, SlidersHorizontal, Share2 } from "lucide-react-native";

import ScreenHeader from "@/components/layout/ScreenHeader";
import PresetCard from "@/components/suspension/PresetCard";
import KeyboardAvoidingAnimatedView from "@/components/KeyboardAvoidingAnimatedView";
import { colors, spacing, typography } from "@/theme/index";
import { useSuspensionStore } from "@/store/suspension";
import { useChainlyStore } from "@/store/chainlyStore";

import { useToast } from "./hooks/useToast";
import { useBikeSelection } from "./hooks/useBikeSelection";
import { usePresetList } from "./hooks/usePresetList";
import { usePresetHandlers } from "./handlers/usePresetHandlers";
import { useMicroAdjustmentHandlers } from "./handlers/useMicroAdjustmentHandlers";

import { SectionHeader } from "./components/SectionHeader";
import { Toast } from "./components/Toast";
import { CreateNewCard } from "./components/CreateNewCard";
import { BikeSelectorCard } from "./components/BikeSelectorCard";
import { FilterCard } from "./components/FilterCard";
import { EmptyStateCard } from "./components/EmptyStateCard";
import { MicroAdjustmentGrid } from "./components/MicroAdjustmentGrid";
import { ShareActionsCard } from "./components/ShareActionsCard";

import { BikePickerModal } from "./modals/BikePickerModal";
import { PresetEditModal } from "./modals/PresetEditModal";
import { PresetMenuModal } from "./modals/PresetMenuModal";
import { MicroAdjustmentModal } from "./modals/MicroAdjustmentModal";

import { MICRO_ADJUSTMENT_ITEMS } from "./constants/microAdjustments";

export default function SavedPresetsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const session = useSuspensionStore((s) => s.session);
  const renamePreset = useSuspensionStore((s) => s.renamePreset);
  const updatePresetNotes = useSuspensionStore((s) => s.updatePresetNotes);
  const updatePresetTags = useSuspensionStore((s) => s.updatePresetTags);
  const setSessionField = useSuspensionStore((s) => s.setSessionField);

  const hydrateBikeGarageFromServer = useChainlyStore(
    (s) => s.hydrateBikeGarageFromServer,
  );

  const { toast, showToast } = useToast();
  const { bikeList, selectedBikeId, selectedBike, selectedBikeLabel } =
    useBikeSelection();

  // Best-effort: keep Garage canonical bike+components synced so Suspension Helper can prefill.
  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      const id = String(selectedBikeId || "");
      if (!id) return;
      try {
        await hydrateBikeGarageFromServer(id);
      } catch (e) {
        console.error(e);
      }
      if (cancelled) return;
    };

    run();

    return () => {
      cancelled = true;
    };
  }, [hydrateBikeGarageFromServer, selectedBikeId]);

  const [bikePickerOpen, setBikePickerOpen] = useState(false);
  const [terrainFilter, setTerrainFilter] = useState("all");
  const [weatherFilter, setWeatherFilter] = useState("all");

  const [editing, setEditing] = useState(null);
  const [editName, setEditName] = useState("");
  const [editNotes, setEditNotes] = useState("");
  const [editTerrain, setEditTerrain] = useState("trail");
  const [editWeather, setEditWeather] = useState("dry");

  const [menuPreset, setMenuPreset] = useState(null);
  const [microOpen, setMicroOpen] = useState(false);
  const [microItem, setMicroItem] = useState(null);

  const list = usePresetList(selectedBikeId, terrainFilter, weatherFilter);

  const { onApplyPreset, onDuplicate, onConfirmDelete, onCopyShareCard } =
    usePresetHandlers(selectedBike, showToast);

  const { onApplyMicroTemporary, onSaveMicroAsPreset } =
    useMicroAdjustmentHandlers(
      list,
      session,
      microItem,
      showToast,
      setMicroOpen,
    );

  const onBack = useCallback(async () => {
    try {
      if (Platform.OS !== "web") {
        await Haptics.selectionAsync();
      }
    } catch (e) {
      // no-op
    }
    router.back();
  }, [router]);

  const onCreateNew = useCallback(() => {
    router.push("/ai/suspension-helper/get-settings");
  }, [router]);

  const onOpenBikePicker = useCallback(async () => {
    if (bikeList.length === 0) {
      showToast("Add a bike in Garage first");
      return;
    }
    try {
      if (Platform.OS !== "web") {
        await Haptics.selectionAsync();
      }
    } catch (e) {
      // no-op
    }
    setBikePickerOpen(true);
  }, [bikeList.length, showToast]);

  const onSelectBike = useCallback(
    async (bikeId) => {
      try {
        if (Platform.OS !== "web") {
          await Haptics.selectionAsync();
        }
      } catch (e) {
        // no-op
      }
      setSessionField("bikeId", String(bikeId));
      setBikePickerOpen(false);
    },
    [setSessionField],
  );

  const onOpenEdit = useCallback(async (preset) => {
    try {
      if (Platform.OS !== "web") {
        await Haptics.selectionAsync();
      }
    } catch (e) {
      // no-op
    }
    setEditing(preset);
    setEditName(preset?.name || "");
    setEditNotes(preset?.notes || "");
    setEditTerrain(preset?.terrainTag || "trail");
    setEditWeather(preset?.weatherTag || "dry");
  }, []);

  const onSaveEdit = useCallback(async () => {
    if (!editing) return;

    try {
      if (Platform.OS !== "web") {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
    } catch (e) {
      // no-op
    }

    renamePreset(editing.id, editName);
    updatePresetNotes(editing.id, editNotes);
    updatePresetTags(editing.id, {
      terrainTag: editTerrain,
      weatherTag: editWeather,
    });

    setEditing(null);
    showToast("Saved changes");
  }, [
    editName,
    editNotes,
    editTerrain,
    editWeather,
    editing,
    renamePreset,
    showToast,
    updatePresetNotes,
    updatePresetTags,
  ]);

  const onOpenMenu = useCallback(async (preset) => {
    try {
      if (Platform.OS !== "web") {
        await Haptics.selectionAsync();
      }
    } catch (e) {
      // no-op
    }
    setMenuPreset(preset);
  }, []);

  const closeMenu = useCallback(() => setMenuPreset(null), []);

  const openMicro = useCallback(async (item) => {
    try {
      if (Platform.OS !== "web") {
        await Haptics.selectionAsync();
      }
    } catch (e) {
      // no-op
    }
    setMicroItem(item);
    setMicroOpen(true);
  }, []);

  const emptyState = useMemo(() => {
    if (bikeList.length === 0) {
      return {
        title: "Add your first bike",
        sub: "Your presets are saved per bike. Start in Garage, then come back here.",
        buttonTitle: "Go to Garage",
        onPress: () => router.push("/garage"),
      };
    }
    return {
      title: "No presets yet",
      sub: "Create your first setup, then you'll be able to organize it by terrain and conditions.",
      buttonTitle: "Create first setup",
      onPress: onCreateNew,
    };
  }, [bikeList.length, onCreateNew, router]);

  const activePreset = useMemo(() => {
    const candidate = list.find((p) => p.id === session.activePresetId);
    return candidate || list[0] || null;
  }, [list, session.activePresetId]);

  return (
    <KeyboardAvoidingAnimatedView style={{ flex: 1 }} behavior="padding">
      <View style={styles.container}>
        <StatusBar style="dark" />

        <ScreenHeader title="Suspension Presets" showBack onBack={onBack} />

        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{
            padding: spacing.xl,
            paddingBottom: insets.bottom + 28,
          }}
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.pageTitle}>Saved Presets</Text>

          <Text style={styles.subtitle}>
            Save setups for different trails, conditions, and riding styles.
          </Text>

          <CreateNewCard onPress={onCreateNew} />

          <View style={{ height: spacing.lg }} />

          <BikeSelectorCard
            selectedBikeLabel={selectedBikeLabel}
            onPress={onOpenBikePicker}
          />

          <View style={{ height: spacing.xl }} />
          <SectionHeader
            title="Preset Library"
            subtitle="Terrain + weather aware. Tap Apply when the trail changes."
            icon={Wrench}
          />

          <FilterCard
            terrainFilter={terrainFilter}
            weatherFilter={weatherFilter}
            onTerrainChange={setTerrainFilter}
            onWeatherChange={setWeatherFilter}
          />

          <View style={{ height: spacing.lg }} />

          {list.length === 0 ? (
            <EmptyStateCard
              title={emptyState.title}
              subtitle={emptyState.sub}
              buttonTitle={emptyState.buttonTitle}
              onPress={emptyState.onPress}
            />
          ) : (
            <View style={{ gap: spacing.md }}>
              {list.map((p) => (
                <PresetCard
                  key={p.id}
                  preset={p}
                  active={session.activePresetId === p.id}
                  onApply={() => onApplyPreset(p.id)}
                  onEdit={() => onOpenEdit(p)}
                  onDuplicate={() => onDuplicate(p.id)}
                  onMenu={() => onOpenMenu(p)}
                />
              ))}
            </View>
          )}

          <View style={{ height: spacing.xl }} />
          <SectionHeader
            title="Micro-Adjustment Playbook"
            subtitle="Quick fixes for common trail feelings."
            icon={SlidersHorizontal}
          />

          <MicroAdjustmentGrid
            items={MICRO_ADJUSTMENT_ITEMS}
            onItemPress={openMicro}
          />

          <View style={{ height: spacing.xl }} />
          <SectionHeader
            title="Actions"
            subtitle="Share, duplicate, or build a setup fast."
            icon={Share2}
          />

          <ShareActionsCard
            onCopyShareCard={() => {
              if (!activePreset) {
                showToast("Create a preset first");
                return;
              }
              onCopyShareCard(activePreset);
            }}
            onShareLink={() => showToast("Share link is stubbed (coming soon)")}
          />

          <View style={{ height: spacing.xxxl }} />
        </ScrollView>

        <BikePickerModal
          visible={bikePickerOpen}
          bikeList={bikeList}
          selectedBikeId={selectedBikeId}
          onSelectBike={onSelectBike}
          onClose={() => setBikePickerOpen(false)}
        />

        <PresetEditModal
          visible={!!editing}
          editName={editName}
          editNotes={editNotes}
          editTerrain={editTerrain}
          editWeather={editWeather}
          onNameChange={setEditName}
          onNotesChange={setEditNotes}
          onTerrainChange={setEditTerrain}
          onWeatherChange={setEditWeather}
          onSave={onSaveEdit}
          onClose={() => setEditing(null)}
        />

        <PresetMenuModal
          visible={!!menuPreset}
          preset={menuPreset}
          onCopyShareCard={() => onCopyShareCard(menuPreset)}
          onDuplicate={() => onDuplicate(menuPreset?.id)}
          onDelete={() => onConfirmDelete(menuPreset)}
          onClose={closeMenu}
        />

        <MicroAdjustmentModal
          visible={microOpen}
          microItem={microItem}
          onApplyTemporary={onApplyMicroTemporary}
          onSaveAsPreset={onSaveMicroAsPreset}
          onClose={() => setMicroOpen(false)}
        />

        <Toast message={toast} />
      </View>
    </KeyboardAvoidingAnimatedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },

  pageTitle: {
    marginTop: spacing.sm,
    fontSize: 22,
    lineHeight: 26,
    fontFamily: typography.fontFamily.black,
    color: colors.textPrimary,
    letterSpacing: -0.3,
  },

  subtitle: {
    marginTop: spacing.sm,
    fontSize: typography.base,
    lineHeight: 20,
    fontFamily: typography.fontFamily.regular,
    color: colors.textSecondary,
  },
});
