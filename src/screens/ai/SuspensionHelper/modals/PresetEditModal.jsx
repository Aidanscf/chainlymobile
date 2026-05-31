import React from "react";
import {
  View,
  Text,
  Modal,
  Pressable,
  TextInput,
  ScrollView,
  StyleSheet,
} from "react-native";
import { X, Pencil } from "lucide-react-native";
import AppButton from "@/components/AppButton";
import Chip from "@/components/Chip";
import { colors, spacing, radius, typography, shadows } from "@/theme/index";
import { TERRAIN_OPTIONS, WEATHER_OPTIONS } from "../constants/filterOptions";
import { terrainLabel, weatherLabel } from "../utils/labelHelpers";

export function PresetEditModal({
  visible,
  editName,
  editNotes,
  editTerrain,
  editWeather,
  onNameChange,
  onNotesChange,
  onTerrainChange,
  onWeatherChange,
  onSave,
  onClose,
}) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable style={styles.sheetOverlay} onPress={onClose}>
        <Pressable style={styles.sheetCard} onPress={() => {}}>
          <View style={styles.sheetHeader}>
            <View style={styles.sheetHeaderLeft}>
              <View style={styles.sheetHeaderIcon}>
                <Pencil size={16} color={colors.primary} strokeWidth={2.75} />
              </View>
              <Text style={styles.sheetTitle}>Edit preset</Text>
            </View>
            <Pressable onPress={onClose} hitSlop={10}>
              <X size={18} color={colors.textSecondary} strokeWidth={2.75} />
            </Pressable>
          </View>

          <Text style={styles.modalLabel}>Preset name</Text>
          <TextInput
            value={editName}
            onChangeText={onNameChange}
            placeholder="e.g. Home Trails – Dry"
            placeholderTextColor={colors.textTertiary}
            style={styles.modalInput}
          />

          <Text style={[styles.modalLabel, { marginTop: spacing.md }]}>
            Terrain
          </Text>
          <ScrollView
            horizontal
            style={{ flexGrow: 0 }}
            showsHorizontalScrollIndicator={false}
          >
            <View style={styles.pillRow}>
              {TERRAIN_OPTIONS.map((t) => (
                <Chip
                  key={t}
                  label={terrainLabel(t)}
                  selected={editTerrain === t}
                  tone="orange"
                  onPress={() => onTerrainChange(t)}
                />
              ))}
            </View>
          </ScrollView>

          <Text style={[styles.modalLabel, { marginTop: spacing.md }]}>
            Weather
          </Text>
          <ScrollView
            horizontal
            style={{ flexGrow: 0 }}
            showsHorizontalScrollIndicator={false}
          >
            <View style={styles.pillRow}>
              {WEATHER_OPTIONS.map((w) => (
                <Chip
                  key={w}
                  label={weatherLabel(w)}
                  selected={editWeather === w}
                  tone="neutral"
                  onPress={() => onWeatherChange(w)}
                />
              ))}
            </View>
          </ScrollView>

          <Text style={[styles.modalLabel, { marginTop: spacing.md }]}>
            Notes
          </Text>
          <TextInput
            value={editNotes}
            onChangeText={onNotesChange}
            placeholder="Felt perfect on steep rolls, slightly harsh on chatter."
            placeholderTextColor={colors.textTertiary}
            style={[
              styles.modalInput,
              { height: 110, textAlignVertical: "top" },
            ]}
            multiline
          />

          <View style={{ height: spacing.lg }} />
          <AppButton title="Save" onPress={onSave} />
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  sheetOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.35)",
    justifyContent: "flex-end",
    padding: spacing.lg,
  },
  sheetCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.xl,
    ...shadows.large,
  },
  sheetHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  sheetHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    flex: 1,
  },
  sheetHeaderIcon: {
    width: 40,
    height: 40,
    borderRadius: radius.round,
    backgroundColor: colors.primarySoft,
    borderWidth: 1,
    borderColor: colors.primarySoft2,
    alignItems: "center",
    justifyContent: "center",
  },
  sheetTitle: {
    fontSize: 18,
    lineHeight: 20,
    fontFamily: typography.fontFamily.black,
    color: colors.textPrimary,
    letterSpacing: -0.2,
  },
  modalLabel: {
    marginTop: spacing.lg,
    fontSize: typography.xs,
    fontFamily: typography.fontFamily.black,
    color: colors.textSecondary,
    letterSpacing: 1.1,
    textTransform: "uppercase",
  },
  modalInput: {
    marginTop: 8,
    backgroundColor: colors.surfaceWarm,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.lg,
    paddingVertical: 12,
    fontSize: typography.base,
    fontFamily: typography.fontFamily.semibold,
    color: colors.textPrimary,
  },
  pillRow: {
    flexDirection: "row",
    gap: spacing.sm,
    paddingRight: spacing.lg,
    marginTop: spacing.sm,
  },
});
