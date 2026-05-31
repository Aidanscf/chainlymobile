import { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Image,
  Modal,
} from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import {
  Plus,
  Trophy,
  TrendingUp,
  CheckCircle,
  Circle,
  X,
} from "lucide-react-native";
import useUser from "@/utils/auth/useUser";
import { colors, spacing, radius, typography } from "@/theme/index";
import ScreenHeader from "@/components/layout/ScreenHeader";

export default function RidingLogsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { data: user } = useUser();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [personalBests, setPersonalBests] = useState({
    jump: null,
    drop: null,
  });
  const [goals, setGoals] = useState({ jump: [], drop: [] });
  const [logs, setLogs] = useState([]);
  const [activeTab, setActiveTab] = useState("all"); // 'all', 'jumps', 'drops'
  const [goalsModalVisible, setGoalsModalVisible] = useState(false);
  const [goalsModalType, setGoalsModalType] = useState(null); // 'jump' or 'drop'

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user]);

  const loadData = async () => {
    try {
      setLoading(true);

      // Fetch goals and personal bests
      const goalsRes = await fetch("/api/riding-goals");
      if (goalsRes.ok) {
        const goalsData = await goalsRes.json();
        setPersonalBests(goalsData.personalBests);
        setGoals(goalsData.goals);
      }

      // Fetch logs
      const logsRes = await fetch("/api/riding-logs");
      if (logsRes.ok) {
        const logsData = await logsRes.json();
        setLogs(logsData.logs);
      }
    } catch (error) {
      console.error("Error loading riding logs data:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const handleNewLog = () => {
    router.push("/(tabs)/ai/riding-logs/select-type");
  };

  const handleBack = () => {
    router.replace("/ai");
  };

  const openGoalsModal = (type) => {
    setGoalsModalType(type);
    setGoalsModalVisible(true);
  };

  const closeGoalsModal = () => {
    setGoalsModalVisible(false);
    setGoalsModalType(null);
  };

  const filteredLogs = logs.filter((log) => {
    if (activeTab === "all") return true;
    if (activeTab === "jumps") return log.type === "jump";
    if (activeTab === "drops") return log.type === "drop";
    return true;
  });

  const jumpCount = goals.jump.filter((g) => g.completed).length;
  const dropCount = goals.drop.filter((g) => g.completed).length;

  // Categorize goals into tiers
  const categorizeTiers = (goalsList) => {
    const sorted = [...goalsList].sort(
      (a, b) => a.threshold_value - b.threshold_value,
    );
    const tiers = {
      beginner: [],
      intermediate: [],
      advanced: [],
      expert: [],
    };

    sorted.forEach((goal, idx) => {
      if (idx < 2) tiers.beginner.push(goal);
      else if (idx < 4) tiers.intermediate.push(goal);
      else if (idx < 5) tiers.advanced.push(goal);
      else tiers.expert.push(goal);
    });

    return tiers;
  };

  const addButton = (
    <TouchableOpacity
      onPress={handleNewLog}
      style={{
        backgroundColor: colors.primary,
        borderRadius: radius.round,
        paddingHorizontal: spacing.lg,
        paddingVertical: spacing.sm,
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
      }}
    >
      <Plus size={18} color={colors.surface} strokeWidth={2.5} />
      <Text
        style={{
          color: colors.surface,
          fontSize: typography.sm,
          fontFamily: typography.fontFamily.bold,
        }}
      >
        Add
      </Text>
    </TouchableOpacity>
  );

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <StatusBar style="dark" />

      <ScreenHeader
        title="Riding Logs"
        showBack
        onBack={handleBack}
        rightAction={addButton}
      />

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: insets.bottom + 80 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
          />
        }
      >
        {/* Personal Bests */}
        <View
          style={{ paddingHorizontal: spacing.xl, marginBottom: spacing.xxl }}
        >
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: spacing.sm,
              marginBottom: spacing.md,
            }}
          >
            <Trophy size={20} color={colors.gold} strokeWidth={2.5} />
            <Text
              style={{
                fontSize: typography.lg,
                fontFamily: typography.fontFamily.black,
                color: colors.textPrimary,
                letterSpacing: -0.2,
              }}
            >
              Personal Bests
            </Text>
          </View>
          <View style={{ flexDirection: "row", gap: spacing.md }}>
            <View
              style={{
                flex: 1,
                backgroundColor: colors.surface,
                borderRadius: radius.xl,
                padding: spacing.lg,
                borderWidth: 1,
                borderColor: colors.border,
              }}
            >
              <Text
                style={{
                  fontSize: typography.sm,
                  color: colors.textSecondary,
                  marginBottom: spacing.sm,
                  fontFamily: typography.fontFamily.semibold,
                }}
              >
                Longest Jump
              </Text>
              <Text
                style={{
                  fontSize: 32,
                  fontFamily: typography.fontFamily.black,
                  color: colors.textPrimary,
                  letterSpacing: -0.6,
                }}
              >
                {personalBests.jump ? `${personalBests.jump}` : "—"}
              </Text>
              {personalBests.jump && (
                <Text
                  style={{
                    fontSize: typography.base,
                    color: colors.textSecondary,
                    marginTop: 2,
                    fontFamily: typography.fontFamily.regular,
                  }}
                >
                  ft
                </Text>
              )}
            </View>
            <View
              style={{
                flex: 1,
                backgroundColor: colors.surface,
                borderRadius: radius.xl,
                padding: spacing.lg,
                borderWidth: 1,
                borderColor: colors.border,
              }}
            >
              <Text
                style={{
                  fontSize: typography.sm,
                  color: colors.textSecondary,
                  marginBottom: spacing.sm,
                  fontFamily: typography.fontFamily.semibold,
                }}
              >
                Biggest Drop
              </Text>
              <Text
                style={{
                  fontSize: 32,
                  fontFamily: typography.fontFamily.black,
                  color: colors.textPrimary,
                  letterSpacing: -0.6,
                }}
              >
                {personalBests.drop ? `${personalBests.drop}` : "—"}
              </Text>
              {personalBests.drop && (
                <Text
                  style={{
                    fontSize: typography.base,
                    color: colors.textSecondary,
                    marginTop: 2,
                    fontFamily: typography.fontFamily.regular,
                  }}
                >
                  ft
                </Text>
              )}
            </View>
          </View>
        </View>

        {/* Goals Progress */}
        <View
          style={{ paddingHorizontal: spacing.xl, marginBottom: spacing.xxl }}
        >
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: spacing.sm,
              marginBottom: spacing.md,
            }}
          >
            <TrendingUp size={20} color={colors.success} strokeWidth={2.5} />
            <Text
              style={{
                fontSize: typography.lg,
                fontFamily: typography.fontFamily.black,
                color: colors.textPrimary,
                letterSpacing: -0.2,
              }}
            >
              Goals Progress
            </Text>
          </View>

          {/* Jump Goals */}
          <TouchableOpacity
            onPress={() => openGoalsModal("jump")}
            style={{
              backgroundColor: colors.surface,
              borderRadius: radius.xl,
              padding: spacing.lg,
              marginBottom: spacing.md,
              borderWidth: 1,
              borderColor: colors.border,
            }}
          >
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: spacing.md,
              }}
            >
              <Text
                style={{
                  fontSize: typography.base,
                  fontFamily: typography.fontFamily.bold,
                  color: colors.textPrimary,
                }}
              >
                Jump Goals
              </Text>
              <Text
                style={{
                  fontSize: typography.sm,
                  color: colors.textSecondary,
                  fontFamily: typography.fontFamily.semibold,
                }}
              >
                {jumpCount} / {goals.jump.length} completed
              </Text>
            </View>
            <View
              style={{
                flexDirection: "row",
                flexWrap: "wrap",
                gap: spacing.sm,
              }}
            >
              {goals.jump.slice(0, 6).map((goal) => (
                <View
                  key={goal.id}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 6,
                    backgroundColor: goal.completed
                      ? colors.successSoft
                      : colors.surfaceWarm,
                    paddingHorizontal: spacing.md,
                    paddingVertical: spacing.sm,
                    borderRadius: radius.round,
                    borderWidth: 1,
                    borderColor: goal.completed
                      ? colors.success
                      : colors.border,
                  }}
                >
                  {goal.completed ? (
                    <CheckCircle size={14} color={colors.success} />
                  ) : (
                    <Circle size={14} color={colors.textTertiary} />
                  )}
                  <Text
                    style={{
                      fontSize: typography.sm,
                      fontFamily: typography.fontFamily.semibold,
                      color: goal.completed
                        ? colors.success
                        : colors.textSecondary,
                    }}
                  >
                    {goal.threshold_value} ft
                  </Text>
                </View>
              ))}
            </View>
          </TouchableOpacity>

          {/* Drop Goals */}
          <TouchableOpacity
            onPress={() => openGoalsModal("drop")}
            style={{
              backgroundColor: colors.surface,
              borderRadius: radius.xl,
              padding: spacing.lg,
              borderWidth: 1,
              borderColor: colors.border,
            }}
          >
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: spacing.md,
              }}
            >
              <Text
                style={{
                  fontSize: typography.base,
                  fontFamily: typography.fontFamily.bold,
                  color: colors.textPrimary,
                }}
              >
                Drop Goals
              </Text>
              <Text
                style={{
                  fontSize: typography.sm,
                  color: colors.textSecondary,
                  fontFamily: typography.fontFamily.semibold,
                }}
              >
                {dropCount} / {goals.drop.length} completed
              </Text>
            </View>
            <View
              style={{
                flexDirection: "row",
                flexWrap: "wrap",
                gap: spacing.sm,
              }}
            >
              {goals.drop.slice(0, 6).map((goal) => (
                <View
                  key={goal.id}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 6,
                    backgroundColor: goal.completed
                      ? colors.successSoft
                      : colors.surfaceWarm,
                    paddingHorizontal: spacing.md,
                    paddingVertical: spacing.sm,
                    borderRadius: radius.round,
                    borderWidth: 1,
                    borderColor: goal.completed
                      ? colors.success
                      : colors.border,
                  }}
                >
                  {goal.completed ? (
                    <CheckCircle size={14} color={colors.success} />
                  ) : (
                    <Circle size={14} color={colors.textTertiary} />
                  )}
                  <Text
                    style={{
                      fontSize: typography.sm,
                      fontFamily: typography.fontFamily.semibold,
                      color: goal.completed
                        ? colors.success
                        : colors.textSecondary,
                    }}
                  >
                    {goal.threshold_value} ft
                  </Text>
                </View>
              ))}
            </View>
          </TouchableOpacity>
        </View>

        {/* Logs List */}
        <View style={{ paddingHorizontal: spacing.xl }}>
          <Text
            style={{
              fontSize: typography.lg,
              fontFamily: typography.fontFamily.black,
              color: colors.textPrimary,
              marginBottom: spacing.md,
              letterSpacing: -0.2,
            }}
          >
            Your Logs
          </Text>

          {/* Tabs */}
          <View
            style={{
              flexDirection: "row",
              gap: spacing.sm,
              marginBottom: spacing.lg,
            }}
          >
            {["all", "jumps", "drops"].map((tab) => (
              <TouchableOpacity
                key={tab}
                onPress={() => setActiveTab(tab)}
                style={{
                  paddingHorizontal: spacing.lg,
                  paddingVertical: spacing.sm,
                  borderRadius: radius.round,
                  backgroundColor:
                    activeTab === tab ? colors.primary : colors.surface,
                  borderWidth: 1,
                  borderColor:
                    activeTab === tab ? colors.primary : colors.border,
                }}
              >
                <Text
                  style={{
                    fontSize: typography.base,
                    fontFamily: typography.fontFamily.bold,
                    color:
                      activeTab === tab ? colors.surface : colors.textSecondary,
                    textTransform: "capitalize",
                  }}
                >
                  {tab}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Log Cards */}
          {filteredLogs.length === 0 ? (
            <View
              style={{
                backgroundColor: colors.surfaceWarm,
                borderRadius: radius.xl,
                padding: spacing.xxxl,
                alignItems: "center",
                borderWidth: 1,
                borderColor: colors.border,
              }}
            >
              <Text
                style={{
                  fontSize: typography.base,
                  color: colors.textSecondary,
                  textAlign: "center",
                  fontFamily: typography.fontFamily.regular,
                }}
              >
                No logs yet. Tap "Add" to add your first{" "}
                {activeTab === "all" ? "jump or drop" : activeTab.slice(0, -1)}!
              </Text>
            </View>
          ) : (
            filteredLogs.map((log) => <LogCard key={log.id} log={log} />)
          )}
        </View>
      </ScrollView>

      {/* Goals Tiers Modal */}
      <Modal
        visible={goalsModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={closeGoalsModal}
      >
        <View
          style={{
            flex: 1,
            justifyContent: "flex-end",
            backgroundColor: "rgba(0,0,0,0.5)",
          }}
        >
          <View
            style={{
              backgroundColor: colors.background,
              borderTopLeftRadius: radius.xxl,
              borderTopRightRadius: radius.xxl,
              paddingTop: spacing.xl,
              paddingBottom: insets.bottom + spacing.xl,
              maxHeight: "80%",
            }}
          >
            <View
              style={{
                paddingHorizontal: spacing.xl,
                marginBottom: spacing.lg,
              }}
            >
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <Text
                  style={{
                    fontSize: typography.xxl,
                    fontFamily: typography.fontFamily.black,
                    color: colors.textPrimary,
                    letterSpacing: -0.4,
                  }}
                >
                  {goalsModalType === "jump" ? "Jump" : "Drop"} Goals
                </Text>
                <TouchableOpacity onPress={closeGoalsModal}>
                  <X size={24} color={colors.textPrimary} strokeWidth={2.5} />
                </TouchableOpacity>
              </View>
            </View>

            <ScrollView
              style={{ flex: 1 }}
              contentContainerStyle={{ paddingHorizontal: spacing.xl }}
            >
              {goalsModalType && (
                <GoalsTiersView
                  tiers={categorizeTiers(goals[goalsModalType] || [])}
                  type={goalsModalType}
                />
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

function GoalsTiersView({ tiers, type }) {
  const renderTier = (title, goalsList) => {
    if (goalsList.length === 0) return null;

    return (
      <View style={{ marginBottom: spacing.xxl }}>
        <Text
          style={{
            fontSize: typography.lg,
            fontFamily: typography.fontFamily.black,
            color: colors.textPrimary,
            marginBottom: spacing.md,
            letterSpacing: -0.2,
          }}
        >
          {title}
        </Text>
        <View style={{ gap: spacing.sm }}>
          {goalsList.map((goal) => (
            <View
              key={goal.id}
              style={{
                backgroundColor: colors.surface,
                borderRadius: radius.xl,
                padding: spacing.lg,
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                borderWidth: 1,
                borderColor: goal.completed ? colors.success : colors.border,
              }}
            >
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: spacing.md,
                }}
              >
                {goal.completed ? (
                  <CheckCircle
                    size={20}
                    color={colors.success}
                    strokeWidth={2.5}
                  />
                ) : (
                  <Circle
                    size={20}
                    color={colors.textTertiary}
                    strokeWidth={2.5}
                  />
                )}
                <Text
                  style={{
                    fontSize: typography.base,
                    fontFamily: typography.fontFamily.semibold,
                    color: colors.textPrimary,
                  }}
                >
                  {goal.threshold_value} ft {type}
                </Text>
              </View>
              {goal.completed && (
                <View
                  style={{
                    backgroundColor: colors.successSoft,
                    paddingHorizontal: spacing.md,
                    paddingVertical: spacing.xs,
                    borderRadius: radius.round,
                    borderWidth: 1,
                    borderColor: colors.success,
                  }}
                >
                  <Text
                    style={{
                      fontSize: typography.xs,
                      fontFamily: typography.fontFamily.bold,
                      color: colors.success,
                    }}
                  >
                    Completed
                  </Text>
                </View>
              )}
            </View>
          ))}
        </View>
      </View>
    );
  };

  return (
    <>
      {renderTier("Beginner", tiers.beginner)}
      {renderTier("Intermediate", tiers.intermediate)}
      {renderTier("Advanced", tiers.advanced)}
      {renderTier("Expert", tiers.expert)}
    </>
  );
}

function LogCard({ log }) {
  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const getStatusColor = (status) => {
    if (status === "measured") return colors.success;
    if (status === "failed") return colors.danger;
    return colors.warning;
  };

  const getStatusLabel = (status) => {
    if (status === "measured") return "Measured";
    if (status === "failed") return "Failed";
    return "Analyzing";
  };

  return (
    <View
      style={{
        backgroundColor: colors.surface,
        borderRadius: radius.xl,
        marginBottom: spacing.md,
        overflow: "hidden",
        borderWidth: 1,
        borderColor: colors.border,
      }}
    >
      <View style={{ flexDirection: "row" }}>
        {/* Image Thumbnail */}
        <Image
          source={{ uri: log.image_url }}
          style={{ width: 100, height: 100 }}
          resizeMode="cover"
        />

        {/* Log Info */}
        <View
          style={{
            flex: 1,
            padding: spacing.md,
            justifyContent: "space-between",
          }}
        >
          <View>
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "flex-start",
                marginBottom: 6,
              }}
            >
              <Text
                style={{
                  fontSize: typography.base,
                  fontFamily: typography.fontFamily.bold,
                  color: colors.textPrimary,
                  textTransform: "capitalize",
                }}
              >
                {log.type}
              </Text>
              <View
                style={{
                  backgroundColor: `${getStatusColor(log.status)}15`,
                  paddingHorizontal: spacing.sm,
                  paddingVertical: 4,
                  borderRadius: radius.sm,
                  borderWidth: 1,
                  borderColor: getStatusColor(log.status),
                }}
              >
                <Text
                  style={{
                    fontSize: 11,
                    fontFamily: typography.fontFamily.bold,
                    color: getStatusColor(log.status),
                  }}
                >
                  {getStatusLabel(log.status)}
                </Text>
              </View>
            </View>

            {log.status === "measured" && log.measured_value != null ? (
              <Text
                style={{
                  fontSize: typography.xxl,
                  fontFamily: typography.fontFamily.black,
                  color: colors.textPrimary,
                  letterSpacing: -0.4,
                }}
              >
                {log.measured_value} ft
              </Text>
            ) : (
              <Text
                style={{
                  fontSize: typography.base,
                  color: colors.textSecondary,
                  fontStyle: "italic",
                  fontFamily: typography.fontFamily.regular,
                }}
              >
                {log.status === "failed" ? "Analysis failed" : "Analyzing..."}
              </Text>
            )}
          </View>

          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <Text
              style={{
                fontSize: typography.sm,
                color: colors.textTertiary,
                fontFamily: typography.fontFamily.regular,
              }}
            >
              {formatDate(log.created_at)}
            </Text>
            {log.confidence != null && log.status === "measured" && (
              <Text
                style={{
                  fontSize: typography.sm,
                  color: colors.textSecondary,
                  fontFamily: typography.fontFamily.semibold,
                }}
              >
                {Math.round(log.confidence * 100)}% confident
              </Text>
            )}
          </View>
        </View>
      </View>
    </View>
  );
}
