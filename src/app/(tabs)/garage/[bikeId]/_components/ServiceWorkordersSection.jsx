import React, { useCallback, useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Modal,
  TextInput,
  Alert,
  Platform,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import { Calendar } from "react-native-calendars";
import {
  X,
  FileImage,
  Trash2,
  ChevronDown,
  ChevronUp,
} from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import AppCard from "@/components/AppCard";
import AppButton from "@/components/AppButton";
import KeyboardAvoidingAnimatedView from "@/components/KeyboardAvoidingAnimatedView";
import { colors, spacing, typography, radius } from "@/theme/index";

import { useServiceWorkorders } from "../_hooks/useServiceWorkorders";
import { formatShortDate } from "../_utils/formatters";
import { Badge } from "./Badge";

function toYmd(d) {
  if (!d) return new Date().toISOString().slice(0, 10);
  if (typeof d === "string") {
    const s = d.trim();
    if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
    const parsed = new Date(s);
    if (Number.isFinite(parsed.getTime()))
      return parsed.toISOString().slice(0, 10);
    return new Date().toISOString().slice(0, 10);
  }
  const date = d instanceof Date ? d : new Date(d);
  if (!Number.isFinite(date.getTime()))
    return new Date().toISOString().slice(0, 10);
  return date.toISOString().slice(0, 10);
}

export function ServiceWorkordersSection({ bikeId }) {
  const insets = useSafeAreaInsets();
  const id = useMemo(() => String(bikeId || "").trim(), [bikeId]);

  const {
    workorders,
    isLoading,
    createWorkorder,
    creating,
    analyzeWorkorder,
    deleteWorkorder,
  } = useServiceWorkorders(id);

  const [addOpen, setAddOpen] = useState(false);
  const [viewer, setViewer] = useState(null);

  const [title, setTitle] = useState("");
  const [serviceDate, setServiceDate] = useState(() => toYmd(new Date()));
  const [showCalendar, setShowCalendar] = useState(false);
  const [imageAsset, setImageAsset] = useState(null);
  const [aiOpen, setAiOpen] = useState(true);
  const [busyId, setBusyId] = useState(null);

  const resetForm = useCallback(() => {
    setTitle("");
    setServiceDate(toYmd(new Date()));
    setShowCalendar(false);
    setImageAsset(null);
  }, []);

  const openAdd = useCallback(() => {
    resetForm();
    setAddOpen(true);
  }, [resetForm]);

  const closeAdd = useCallback(() => {
    setAddOpen(false);
    setShowCalendar(false);
  }, []);

  const pickImage = useCallback(async () => {
    try {
      const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!perm?.granted) {
        Alert.alert(
          "Permission needed",
          "Please allow photo library access to upload a workorder image.",
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.9,
      });

      if (result.canceled) {
        return;
      }

      const asset = result?.assets?.[0] || null;
      if (!asset) {
        return;
      }

      setImageAsset(asset);
    } catch (e) {
      console.error(e);
      Alert.alert("Couldn’t pick image", "Try again.");
    }
  }, []);

  const onSave = useCallback(async () => {
    try {
      await createWorkorder({
        title,
        serviceDate,
        imageAsset,
      });
      Alert.alert("Saved", "Workorder added");
      setAddOpen(false);
      resetForm();
    } catch (e) {
      console.error(e);
      Alert.alert("Couldn’t upload workorder", "Try again.");
    }
  }, [createWorkorder, imageAsset, resetForm, serviceDate, title]);

  const canSave =
    !!String(title || "").trim() && !!serviceDate && !!imageAsset && !creating;

  const hasWorkorders = Array.isArray(workorders) && workorders.length > 0;

  const list = hasWorkorders ? workorders.slice(0, 20) : [];

  const marked = useMemo(() => {
    if (!serviceDate) return {};
    return {
      [serviceDate]: {
        selected: true,
        selectedColor: colors.primary,
      },
    };
  }, [serviceDate]);

  const onAnalyze = useCallback(async () => {
    if (!viewer?.id) return;
    const workorder = viewer;

    setBusyId(String(workorder.id));
    try {
      const res = await analyzeWorkorder({ workorder });
      const updated = res?.workorder || null;
      if (updated) {
        setViewer(updated);
      }
      setAiOpen(true);
    } catch (e) {
      console.error(e);
      Alert.alert("Couldn’t analyze", "Try again.");
    } finally {
      setBusyId(null);
    }
  }, [analyzeWorkorder, viewer]);

  const onDelete = useCallback(() => {
    if (!viewer?.id) return;

    Alert.alert("Delete this service record?", "This can’t be undone.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          const workorder = viewer;
          setBusyId(String(workorder.id));
          try {
            await deleteWorkorder({ workorder });
            setViewer(null);
          } catch (e) {
            console.error(e);
            Alert.alert("Couldn’t delete", "Try again.");
          } finally {
            setBusyId(null);
          }
        },
      },
    ]);
  }, [deleteWorkorder, viewer]);

  const viewerBusy = useMemo(() => {
    const wid = viewer?.id ? String(viewer.id) : "";
    return !!wid && wid === String(busyId || "");
  }, [busyId, viewer?.id]);

  const aiStatus = useMemo(() => {
    const s = viewer?.ai_status ? String(viewer.ai_status) : "idle";
    if (s === "processing" || s === "done" || s === "failed") return s;
    return "idle";
  }, [viewer?.ai_status]);

  const analyzeLabel = useMemo(() => {
    if (aiStatus === "done") return "Re-analyze";
    return "Analyze Work Order";
  }, [aiStatus]);

  const summary = useMemo(() => {
    const s =
      viewer?.ai_summary && typeof viewer.ai_summary === "object"
        ? viewer.ai_summary
        : null;
    return s;
  }, [viewer?.ai_summary]);

  const showAi = aiStatus === "done" && (viewer?.ai_summary_text || summary);

  return (
    <>
      <View style={styles.sectionHeader}>
        <View style={styles.headerRow}>
          <View style={{ flex: 1, paddingRight: spacing.md }}>
            <Text style={styles.sectionTitle}>Service Workorders</Text>
            <Text style={styles.sectionSub}>
              Upload receipts and service records for this bike.
            </Text>
          </View>

          <AppButton
            title="+ Add"
            variant="secondary"
            size="small"
            onPress={openAdd}
          />
        </View>
      </View>

      <AppCard style={styles.card} pressable={false}>
        {isLoading ? (
          <Text style={styles.emptyText}>Loading…</Text>
        ) : !hasWorkorders ? (
          <Text style={styles.emptyText}>No workorders yet.</Text>
        ) : (
          list.map((w, idx) => {
            const when = formatShortDate(w?.service_date || w?.created_at);
            const showBorder = idx !== 0;
            const rowBorderStyle = showBorder ? styles.rowBorder : null;

            return (
              <Pressable
                key={String(w?.id || idx)}
                onPress={() => setViewer(w)}
                style={[styles.row, rowBorderStyle]}
              >
                <View style={styles.thumbWrap}>
                  {w?.image_url ? (
                    <Image
                      source={{ uri: String(w.image_url) }}
                      style={styles.thumb}
                      contentFit="cover"
                      transition={100}
                    />
                  ) : (
                    <View style={styles.thumbFallback}>
                      <FileImage size={18} color={colors.textSecondary} />
                    </View>
                  )}
                </View>

                <View style={{ flex: 1, paddingRight: spacing.md }}>
                  <Text style={styles.rowTitle} numberOfLines={1}>
                    {String(w?.title || "Workorder")}
                  </Text>
                  <Text style={styles.rowMeta}>{when || ""}</Text>
                </View>

                {w?.pending ? <Badge tone="due" text="Pending" /> : null}
              </Pressable>
            );
          })
        )}
      </AppCard>

      {/* Add Workorder Modal */}
      <Modal
        visible={addOpen}
        animationType="slide"
        presentationStyle={Platform.OS === "ios" ? "pageSheet" : "fullScreen"}
        onRequestClose={closeAdd}
      >
        <KeyboardAvoidingAnimatedView
          style={{ flex: 1, backgroundColor: colors.background }}
          behavior="padding"
        >
          {/* small top "tab" handle */}
          <View style={styles.modalHandleWrap}>
            <View style={styles.modalHandle} />
          </View>

          <View style={styles.modalHeader}>
            <Pressable onPress={closeAdd} style={styles.modalHeaderIconBtn}>
              <X size={20} color={colors.textPrimary} />
            </Pressable>

            <Text style={styles.modalTitle}>Add Workorder</Text>

            <View style={{ width: 40 }} />
          </View>

          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={{
              padding: spacing.xl,
              paddingBottom: spacing.xxxl + 96, // leave room for footer buttons
            }}
            keyboardShouldPersistTaps="handled"
          >
            <Text style={styles.fieldLabel}>Title</Text>
            <TextInput
              value={title}
              onChangeText={setTitle}
              placeholder="e.g. Fork service receipt"
              placeholderTextColor={colors.textTertiary}
              style={styles.input}
              autoCapitalize="sentences"
              returnKeyType="done"
            />

            <Text style={[styles.fieldLabel, { marginTop: spacing.lg }]}>
              Date
            </Text>
            <Pressable
              onPress={() => setShowCalendar((v) => !v)}
              style={styles.dateRow}
            >
              <Text style={styles.dateValue}>
                {formatShortDate(serviceDate) || serviceDate}
              </Text>
              <Text style={styles.dateHint}>
                {showCalendar ? "Hide" : "Pick"}
              </Text>
            </Pressable>

            {showCalendar ? (
              <View style={styles.calendarWrap}>
                <Calendar
                  markedDates={marked}
                  onDayPress={(day) => {
                    const next = day?.dateString
                      ? String(day.dateString)
                      : null;
                    if (next) {
                      setServiceDate(next);
                      setShowCalendar(false);
                    }
                  }}
                  enableSwipeMonths
                  theme={{
                    todayTextColor: colors.primary,
                    arrowColor: colors.primary,
                    textDayFontFamily: typography.fontFamily.regular,
                    textMonthFontFamily: typography.fontFamily.black,
                    textDayHeaderFontFamily: typography.fontFamily.semibold,
                  }}
                />
              </View>
            ) : null}

            <Text style={[styles.fieldLabel, { marginTop: spacing.lg }]}>
              Image
            </Text>

            <View style={styles.imageRow}>
              <Pressable onPress={pickImage} style={styles.pickBtn}>
                <Text style={styles.pickBtnText}>
                  {imageAsset ? "Change image" : "Pick image"}
                </Text>
              </Pressable>

              {imageAsset?.uri ? (
                <Image
                  source={{ uri: String(imageAsset.uri) }}
                  style={styles.preview}
                  contentFit="cover"
                  transition={100}
                />
              ) : null}
            </View>

            <Text style={styles.helpText}>
              Tip: crop the receipt so it’s easy to read.
            </Text>
          </ScrollView>

          {/* Footer actions (moved down) */}
          <View style={styles.modalFooter}>
            <AppButton
              title="Cancel"
              variant="secondary"
              onPress={closeAdd}
              style={{ flex: 1, marginRight: spacing.md }}
            />
            <AppButton
              title="Save"
              variant="primary"
              onPress={onSave}
              disabled={!canSave}
              loading={creating}
              style={{ flex: 1 }}
            />
          </View>
        </KeyboardAvoidingAnimatedView>
      </Modal>

      {/* Viewer Modal */}
      <Modal
        visible={!!viewer}
        animationType="fade"
        presentationStyle="fullScreen"
        onRequestClose={() => setViewer(null)}
      >
        <View style={styles.viewerWrap}>
          <View
            style={[
              styles.viewerHeader,
              { paddingTop: insets.top + spacing.md },
            ]}
          >
            <Pressable
              onPress={() => setViewer(null)}
              style={styles.viewerClose}
              disabled={viewerBusy}
            >
              <X size={22} color="#FFFFFF" />
            </Pressable>

            <View style={{ flex: 1, paddingHorizontal: spacing.md }}>
              <Text style={styles.viewerTitle} numberOfLines={1}>
                {String(viewer?.title || "Workorder")}
              </Text>
              <Text style={styles.viewerMeta}>
                {formatShortDate(viewer?.service_date || viewer?.created_at) ||
                  ""}
              </Text>
            </View>

            <Pressable
              onPress={onDelete}
              style={styles.viewerClose}
              disabled={viewerBusy}
              accessibilityRole="button"
              accessibilityLabel="Delete workorder"
            >
              <Trash2
                size={20}
                color={viewerBusy ? "rgba(255,255,255,0.5)" : "#FFFFFF"}
              />
            </Pressable>
          </View>

          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={{ paddingBottom: insets.bottom + 28 }}
            showsVerticalScrollIndicator={false}
          >
            {viewer?.image_url ? (
              <Image
                source={{ uri: String(viewer.image_url) }}
                style={styles.viewerImage}
                contentFit="contain"
                transition={150}
              />
            ) : (
              <View style={styles.viewerEmpty}>
                <Text style={styles.viewerEmptyText}>No image</Text>
              </View>
            )}

            <View
              style={{ paddingHorizontal: spacing.xl, paddingTop: spacing.lg }}
            >
              <View style={styles.viewerActionsRow}>
                <View style={{ flex: 1 }}>
                  <AppButton
                    title={
                      aiStatus === "processing" ? "Analyzing…" : analyzeLabel
                    }
                    onPress={onAnalyze}
                    disabled={viewerBusy || aiStatus === "processing"}
                    loading={aiStatus === "processing" && viewerBusy}
                  />
                </View>

                <View style={{ width: spacing.md }} />

                <Pressable
                  onPress={onDelete}
                  disabled={viewerBusy}
                  style={styles.deleteBtn}
                >
                  {viewerBusy ? (
                    <ActivityIndicator color={colors.textSecondary} />
                  ) : (
                    <Text style={styles.deleteBtnText}>Delete</Text>
                  )}
                </Pressable>
              </View>

              {aiStatus === "failed" ? (
                <Text style={styles.aiErrorText}>
                  {String(viewer?.ai_error || "Could not analyze. Try again.")}
                </Text>
              ) : null}

              {aiStatus === "processing" ? (
                <Text style={styles.aiHintText}>
                  Parsing the receipt… this can take a few seconds.
                </Text>
              ) : null}

              {showAi ? (
                <View style={{ marginTop: spacing.lg }}>
                  <Pressable
                    onPress={() => setAiOpen((v) => !v)}
                    style={styles.aiHeaderRow}
                  >
                    <Text style={styles.aiHeaderTitle}>AI Summary</Text>
                    {aiOpen ? (
                      <ChevronUp size={18} color={colors.textSecondary} />
                    ) : (
                      <ChevronDown size={18} color={colors.textSecondary} />
                    )}
                  </Pressable>

                  {aiOpen ? (
                    <AppCard style={styles.aiCard}>
                      {viewer?.ai_summary_text ? (
                        <Text style={styles.aiSummaryText}>
                          {String(viewer.ai_summary_text)}
                        </Text>
                      ) : null}

                      {summary ? (
                        <View
                          style={{
                            marginTop: viewer?.ai_summary_text ? spacing.md : 0,
                          }}
                        >
                          <View style={styles.aiKeyRow}>
                            <Text style={styles.aiKeyLabel}>Shop</Text>
                            <Text style={styles.aiKeyValue} numberOfLines={1}>
                              {String(summary?.shop_name || "")}
                            </Text>
                          </View>
                          <View style={styles.aiKeyRow}>
                            <Text style={styles.aiKeyLabel}>Date</Text>
                            <Text style={styles.aiKeyValue} numberOfLines={1}>
                              {String(summary?.date || "")}
                            </Text>
                          </View>
                          <View style={styles.aiKeyRow}>
                            <Text style={styles.aiKeyLabel}>Total</Text>
                            <Text style={styles.aiKeyValue} numberOfLines={1}>
                              {String(summary?.total_cost || "")}
                            </Text>
                          </View>

                          {Array.isArray(summary?.line_items) &&
                          summary.line_items.length ? (
                            <View style={{ marginTop: spacing.md }}>
                              <Text style={styles.aiSubTitle}>Line items</Text>
                              {summary.line_items
                                .slice(0, 12)
                                .map((li, idx) => (
                                  <Text key={idx} style={styles.aiBullet}>
                                    • {String(li?.name || "")}
                                    {li?.notes ? ` — ${String(li.notes)}` : ""}
                                  </Text>
                                ))}
                            </View>
                          ) : null}

                          {Array.isArray(summary?.bike_impact_notes) &&
                          summary.bike_impact_notes.length ? (
                            <View style={{ marginTop: spacing.md }}>
                              <Text style={styles.aiSubTitle}>
                                Bike impact notes
                              </Text>
                              {summary.bike_impact_notes
                                .slice(0, 8)
                                .map((t, idx) => (
                                  <Text key={idx} style={styles.aiBullet}>
                                    • {String(t)}
                                  </Text>
                                ))}
                            </View>
                          ) : null}

                          {Array.isArray(summary?.recommendations) &&
                          summary.recommendations.length ? (
                            <View style={{ marginTop: spacing.md }}>
                              <Text style={styles.aiSubTitle}>
                                Recommendations
                              </Text>
                              {summary.recommendations
                                .slice(0, 8)
                                .map((t, idx) => (
                                  <Text key={idx} style={styles.aiBullet}>
                                    • {String(t)}
                                  </Text>
                                ))}
                            </View>
                          ) : null}

                          {Array.isArray(summary?.safety_flags) &&
                          summary.safety_flags.length ? (
                            <View style={{ marginTop: spacing.md }}>
                              <Text style={styles.aiSubTitle}>
                                Safety flags
                              </Text>
                              {summary.safety_flags
                                .slice(0, 8)
                                .map((t, idx) => (
                                  <Text key={idx} style={styles.aiSafetyBullet}>
                                    • {String(t)}
                                  </Text>
                                ))}
                            </View>
                          ) : null}
                        </View>
                      ) : null}
                    </AppCard>
                  ) : null}
                </View>
              ) : null}
            </View>
          </ScrollView>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  sectionHeader: {
    marginTop: spacing.xxl,
    marginBottom: spacing.md,
    paddingHorizontal: spacing.xl,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
  },
  sectionTitle: {
    fontSize: 20,
    lineHeight: 22,
    fontFamily: typography.fontFamily.black,
    color: colors.textPrimary,
    letterSpacing: -0.3,
  },
  sectionSub: {
    marginTop: 6,
    fontSize: typography.base,
    lineHeight: 19,
    fontFamily: typography.fontFamily.regular,
    color: colors.textSecondary,
  },
  card: {
    marginHorizontal: spacing.xl,
  },
  emptyText: {
    fontSize: typography.base,
    lineHeight: 18,
    fontFamily: typography.fontFamily.regular,
    color: colors.textSecondary,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: spacing.md,
  },
  rowBorder: {
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
  thumbWrap: {
    width: 44,
    height: 44,
    marginRight: spacing.md,
    borderRadius: 12,
    overflow: "hidden",
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  thumb: {
    width: 44,
    height: 44,
  },
  thumbFallback: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  rowTitle: {
    fontSize: typography.base,
    lineHeight: 18,
    fontFamily: typography.fontFamily.black,
    color: colors.textPrimary,
    letterSpacing: -0.2,
  },
  rowMeta: {
    marginTop: 4,
    fontSize: typography.sm,
    lineHeight: 16,
    fontFamily: typography.fontFamily.semibold,
    color: colors.textSecondary,
  },

  // Modal
  modalHandleWrap: {
    alignItems: "center",
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
    backgroundColor: colors.background,
  },
  modalHandle: {
    width: 44,
    height: 5,
    borderRadius: 999,
    backgroundColor: colors.borderLight,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
    backgroundColor: colors.background,
  },
  modalHeaderIconBtn: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  modalTitle: {
    fontSize: typography.base,
    lineHeight: 18,
    fontFamily: typography.fontFamily.black,
    color: colors.textPrimary,
  },
  modalFooter: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
    paddingBottom: spacing.xl,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
    backgroundColor: colors.background,
    flexDirection: "row",
    alignItems: "center",
  },

  fieldLabel: {
    fontSize: typography.sm,
    lineHeight: 16,
    fontFamily: typography.fontFamily.black,
    color: colors.textSecondary,
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.borderLight,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    fontSize: typography.base,
    fontFamily: typography.fontFamily.regular,
    color: colors.textPrimary,
  },
  dateRow: {
    borderWidth: 1,
    borderColor: colors.borderLight,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  dateValue: {
    fontSize: typography.base,
    fontFamily: typography.fontFamily.semibold,
    color: colors.textPrimary,
  },
  dateHint: {
    fontSize: typography.sm,
    fontFamily: typography.fontFamily.semibold,
    color: colors.primary,
  },
  calendarWrap: {
    marginTop: spacing.md,
    borderWidth: 1,
    borderColor: colors.borderLight,
    borderRadius: radius.lg,
    overflow: "hidden",
    backgroundColor: colors.surface,
  },
  imageRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  pickBtn: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.borderLight,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    marginRight: spacing.md,
  },
  pickBtnText: {
    fontSize: typography.base,
    fontFamily: typography.fontFamily.semibold,
    color: colors.primary,
  },
  preview: {
    width: 72,
    height: 72,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  helpText: {
    marginTop: spacing.md,
    fontSize: typography.sm,
    lineHeight: 16,
    fontFamily: typography.fontFamily.regular,
    color: colors.textTertiary,
  },

  // Viewer
  viewerWrap: {
    flex: 1,
    backgroundColor: "#000000",
  },
  viewerHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingTop: spacing.xl,
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.md,
  },
  viewerClose: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  viewerTitle: {
    fontSize: typography.base,
    lineHeight: 18,
    fontFamily: typography.fontFamily.black,
    color: "#FFFFFF",
  },
  viewerMeta: {
    marginTop: 4,
    fontSize: typography.sm,
    lineHeight: 16,
    fontFamily: typography.fontFamily.semibold,
    color: "rgba(255,255,255,0.75)",
  },
  viewerImage: {
    width: "100%",
    height: 420,
  },
  viewerEmpty: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  viewerEmptyText: {
    fontSize: typography.base,
    fontFamily: typography.fontFamily.semibold,
    color: "rgba(255,255,255,0.7)",
  },

  viewerActionsRow: {
    flexDirection: "row",
    alignItems: "center",
  },

  deleteBtn: {
    width: 96,
    height: 44,
    borderRadius: radius.round,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  deleteBtnText: {
    fontSize: typography.sm,
    fontFamily: typography.fontFamily.black,
    color: colors.textPrimary,
  },

  aiHintText: {
    marginTop: spacing.md,
    fontSize: typography.sm,
    lineHeight: 16,
    fontFamily: typography.fontFamily.semibold,
    color: "rgba(255,255,255,0.75)",
  },
  aiErrorText: {
    marginTop: spacing.md,
    fontSize: typography.sm,
    lineHeight: 16,
    fontFamily: typography.fontFamily.semibold,
    color: "rgba(255,140,140,0.95)",
  },

  aiHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: spacing.md,
  },
  aiHeaderTitle: {
    fontSize: typography.base,
    lineHeight: 18,
    fontFamily: typography.fontFamily.black,
    color: "#FFFFFF",
  },

  aiCard: {
    backgroundColor: colors.surface,
    borderColor: colors.borderLight,
  },
  aiSummaryText: {
    fontSize: typography.base,
    lineHeight: 19,
    fontFamily: typography.fontFamily.regular,
    color: colors.textPrimary,
  },
  aiKeyRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 6,
  },
  aiKeyLabel: {
    fontSize: typography.sm,
    fontFamily: typography.fontFamily.black,
    color: colors.textSecondary,
    width: 70,
  },
  aiKeyValue: {
    flex: 1,
    textAlign: "right",
    fontSize: typography.sm,
    fontFamily: typography.fontFamily.semibold,
    color: colors.textPrimary,
  },
  aiSubTitle: {
    fontSize: typography.sm,
    lineHeight: 16,
    fontFamily: typography.fontFamily.black,
    color: colors.textSecondary,
    marginBottom: 6,
  },
  aiBullet: {
    fontSize: typography.sm,
    lineHeight: 16,
    fontFamily: typography.fontFamily.regular,
    color: colors.textPrimary,
    marginBottom: 4,
  },
  aiSafetyBullet: {
    fontSize: typography.sm,
    lineHeight: 16,
    fontFamily: typography.fontFamily.semibold,
    color: "#B45309",
    marginBottom: 4,
  },
});
