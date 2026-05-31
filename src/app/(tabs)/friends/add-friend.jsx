import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  Pressable,
  Platform,
  Share,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { useLocalSearchParams, useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import * as Clipboard from "expo-clipboard";
import { Check, Copy, Link2, UserPlus, Users } from "lucide-react-native";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import ScreenHeader from "@/components/layout/ScreenHeader";
import AppCard from "@/components/AppCard";
import AppButton from "@/components/AppButton";
import { colors, spacing, radius, typography, shadows } from "@/theme/index";
import { apiFetch } from "@/services/apiClient";
import { useAuth } from "@/utils/auth";

function normalizeCode(value) {
  return String(value || "")
    .trim()
    .toUpperCase();
}

export default function AddFriendScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const params = useLocalSearchParams();
  const queryClient = useQueryClient();

  const { isReady, isAuthenticated, signIn } = useAuth();

  const [friendCodeInput, setFriendCodeInput] = useState("");

  const [toast, setToast] = useState(null);
  const toastTimer = useRef(null);

  const showToast = useCallback((message) => {
    setToast(message);
    if (toastTimer.current) {
      clearTimeout(toastTimer.current);
    }
    toastTimer.current = setTimeout(() => setToast(null), 1600);
  }, []);

  useEffect(() => {
    return () => {
      if (toastTimer.current) {
        clearTimeout(toastTimer.current);
      }
    };
  }, []);

  useEffect(() => {
    const prefill = params?.code ? normalizeCode(params.code) : "";
    if (!prefill) {
      return;
    }
    if (friendCodeInput) {
      return;
    }
    setFriendCodeInput(prefill);
  }, [friendCodeInput, params?.code]);

  const meQuery = useQuery({
    queryKey: ["friends", "me"],
    enabled: !!(isReady && isAuthenticated),
    queryFn: async () => {
      return await apiFetch("/api/friends/me", { method: "GET" });
    },
  });

  const myFriendCode = useMemo(() => {
    const raw = meQuery.data?.friend_code;
    return raw ? String(raw) : null;
  }, [meQuery.data?.friend_code]);

  const incomingRequests = useMemo(() => {
    const rows = meQuery.data?.incoming_requests;
    return Array.isArray(rows) ? rows : [];
  }, [meQuery.data?.incoming_requests]);

  const outgoingRequests = useMemo(() => {
    const rows = meQuery.data?.outgoing_requests;
    return Array.isArray(rows) ? rows : [];
  }, [meQuery.data?.outgoing_requests]);

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

  const copyMyCode = useCallback(async () => {
    if (!myFriendCode) {
      return;
    }

    try {
      if (Platform.OS !== "web") {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
    } catch (e) {
      // no-op
    }

    try {
      await Clipboard.setStringAsync(myFriendCode);
      showToast("Copied your code");
    } catch (e) {
      console.error(e);
      showToast("Couldn’t copy");
    }
  }, [myFriendCode, showToast]);

  const shareMyCode = useCallback(async () => {
    if (!myFriendCode) {
      return;
    }

    const message = `Add me on Chainly — Friend Code: ${myFriendCode}`;

    try {
      await Share.share({ message });
    } catch (e) {
      // Share cancelled is fine.
    }
  }, [myFriendCode]);

  const sendRequestMutation = useMutation({
    mutationFn: async ({ code }) => {
      return await apiFetch("/api/friends/request", {
        method: "POST",
        body: JSON.stringify({ friend_code: code }),
      });
    },
    onSuccess: (data) => {
      const status = data?.status ? String(data.status) : "pending";
      if (status === "already_friends") {
        showToast("You’re already friends");
      } else if (status === "already_pending") {
        showToast("Request already pending");
      } else if (status === "accepted") {
        showToast("Connected — you’re friends now");
      } else {
        showToast("Friend request sent");
      }
    },
    onError: (e) => {
      console.error(e);
      showToast("Couldn’t send request");
    },
    onSettled: async () => {
      await queryClient.invalidateQueries({ queryKey: ["friends", "me"] });
      await queryClient.invalidateQueries({ queryKey: ["friends", "list"] });
    },
  });

  const respondMutation = useMutation({
    mutationFn: async ({ requestId, action }) => {
      return await apiFetch("/api/friends/request/respond", {
        method: "POST",
        body: JSON.stringify({ request_id: requestId, action }),
      });
    },
    onSuccess: (data) => {
      const status = data?.status ? String(data.status) : null;
      if (status === "accepted") {
        showToast("Friend added");
      } else if (status === "declined") {
        showToast("Request declined");
      } else {
        showToast("Updated");
      }
    },
    onError: (e) => {
      console.error(e);
      showToast("Couldn’t update request");
    },
    onSettled: async () => {
      await queryClient.invalidateQueries({ queryKey: ["friends", "me"] });
      await queryClient.invalidateQueries({ queryKey: ["friends", "list"] });
    },
  });

  const onSend = useCallback(async () => {
    const code = normalizeCode(friendCodeInput);
    if (!code) {
      showToast("Enter a friend code");
      return;
    }

    try {
      if (Platform.OS !== "web") {
        await Haptics.notificationAsync(
          Haptics.NotificationFeedbackType.Success,
        );
      }
    } catch (e) {
      // no-op
    }

    sendRequestMutation.mutate({ code });
  }, [friendCodeInput, sendRequestMutation, showToast]);

  if (!isReady) {
    return null;
  }

  if (!isAuthenticated) {
    return (
      <View style={styles.container}>
        <StatusBar style="dark" />
        <ScreenHeader title="Add Friend" showBack onBack={onBack} />

        <View
          style={{
            flex: 1,
            padding: spacing.xl,
            paddingBottom: insets.bottom + 28,
          }}
        >
          <AppCard
            style={{ backgroundColor: colors.surface }}
            pressable={false}
          >
            <Text style={styles.sectionTitle}>Sign in to add friends</Text>
            <Text style={styles.sectionSub}>
              Friends are tied to your account so your crew syncs everywhere.
            </Text>
            <View style={{ height: spacing.lg }} />
            <AppButton
              title="Sign In"
              onPress={() => router.push("/login")}
            />
          </AppCard>
        </View>
      </View>
    );
  }

  const isBusy = sendRequestMutation.isPending || respondMutation.isPending;
  const loadingCode = meQuery.isLoading && !myFriendCode;

  const incomingEmpty = incomingRequests.length === 0;
  const outgoingEmpty = outgoingRequests.length === 0;

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />

      <ScreenHeader title="Add Friend" showBack onBack={onBack} />

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{
          padding: spacing.xl,
          paddingBottom: insets.bottom + 28,
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* Your code */}
        <AppCard style={styles.myCodeCard} pressable={false}>
          <View style={styles.inviteHeader}>
            <View style={styles.inviteIcon}>
              <Link2 size={18} color={colors.primary} strokeWidth={2.5} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.inviteTitle}>Your Friend Code</Text>
              <Text style={styles.inviteSub}>
                Share this with someone you ride with.
              </Text>
            </View>
          </View>

          <View style={styles.codeRow}>
            <Text style={styles.codeText}>
              {myFriendCode || (loadingCode ? "Loading…" : "—")}
            </Text>
            <Pressable
              onPress={copyMyCode}
              style={styles.codeAction}
              hitSlop={10}
            >
              {myFriendCode ? (
                <Copy size={16} color={colors.primary} strokeWidth={2.5} />
              ) : (
                <Check
                  size={16}
                  color={colors.textSecondary}
                  strokeWidth={2.5}
                />
              )}
            </Pressable>
          </View>

          <View style={{ height: spacing.md }} />

          <View style={{ flexDirection: "row", gap: spacing.md }}>
            <View style={{ flex: 1 }}>
              <AppButton title="Copy code" onPress={copyMyCode} />
            </View>
            <View style={{ flex: 1 }}>
              <AppButton
                title="Share"
                variant="secondary"
                onPress={shareMyCode}
              />
            </View>
          </View>
        </AppCard>

        <View style={{ height: spacing.lg }} />

        {/* Add by code */}
        <AppCard style={styles.addCard} pressable={false}>
          <View style={styles.addHeaderRow}>
            <View style={styles.addHeaderIcon}>
              <UserPlus size={18} color={colors.primary} strokeWidth={2.5} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.sectionTitle}>Add friend by code</Text>
              <Text style={styles.sectionSub}>
                They’ll need to accept your request.
              </Text>
            </View>
          </View>

          <View style={{ height: spacing.md }} />

          <View style={styles.inputWrap}>
            <TextInput
              value={friendCodeInput}
              onChangeText={setFriendCodeInput}
              placeholder="Enter code (e.g. K7P3Q9)"
              placeholderTextColor={colors.textTertiary}
              style={styles.input}
              autoCapitalize="characters"
              autoCorrect={false}
              maxLength={12}
              editable={!isBusy}
              returnKeyType="done"
              onSubmitEditing={onSend}
            />
          </View>

          <View style={{ height: spacing.md }} />

          <AppButton
            title={sendRequestMutation.isPending ? "Sending…" : "Send request"}
            onPress={onSend}
            disabled={isBusy}
            loading={sendRequestMutation.isPending}
          />
        </AppCard>

        <View style={{ height: spacing.xl }} />

        {/* Requests */}
        <Text style={styles.sectionTitle}>Requests</Text>
        <Text style={styles.sectionSub}>Accept only people you know.</Text>

        <View style={{ height: spacing.md }} />

        <AppCard style={styles.requestsCard} pressable={false}>
          <View style={styles.requestsHeaderRow}>
            <Users size={18} color={colors.textSecondary} strokeWidth={2.5} />
            <Text style={styles.requestsHeaderTitle}>Incoming</Text>
          </View>

          <View style={{ height: spacing.md }} />

          {incomingEmpty ? (
            <Text style={styles.mutedLine}>No incoming requests.</Text>
          ) : (
            <View style={{ gap: spacing.md }}>
              {incomingRequests.map((r) => {
                const name = r?.requester_name
                  ? String(r.requester_name)
                  : "Rider";
                const accept = () =>
                  respondMutation.mutate({ requestId: r.id, action: "accept" });
                const decline = () =>
                  respondMutation.mutate({
                    requestId: r.id,
                    action: "decline",
                  });

                return (
                  <View key={r.id} style={styles.requestRow}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.requestName}>{name}</Text>
                      <Text style={styles.requestMeta}>Wants to add you</Text>
                    </View>

                    <View style={{ flexDirection: "row", gap: spacing.sm }}>
                      <Pressable
                        onPress={decline}
                        style={styles.declinePill}
                        hitSlop={10}
                      >
                        <Text style={styles.declineText}>Decline</Text>
                      </Pressable>
                      <Pressable
                        onPress={accept}
                        style={styles.acceptPill}
                        hitSlop={10}
                      >
                        <Text style={styles.acceptText}>Accept</Text>
                      </Pressable>
                    </View>
                  </View>
                );
              })}
            </View>
          )}

          <View style={{ height: spacing.lg }} />

          <View style={styles.requestsHeaderRow}>
            <Users size={18} color={colors.textSecondary} strokeWidth={2.5} />
            <Text style={styles.requestsHeaderTitle}>Outgoing</Text>
          </View>

          <View style={{ height: spacing.md }} />

          {outgoingEmpty ? (
            <Text style={styles.mutedLine}>No pending outgoing requests.</Text>
          ) : (
            <View style={{ gap: spacing.md }}>
              {outgoingRequests.map((r) => {
                const name = r?.addressee_name
                  ? String(r.addressee_name)
                  : "Rider";
                return (
                  <View key={r.id} style={styles.requestRow}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.requestName}>{name}</Text>
                      <Text style={styles.requestMeta}>Pending</Text>
                    </View>
                    <View style={styles.pendingPill}>
                      <Text style={styles.pendingText}>Pending</Text>
                    </View>
                  </View>
                );
              })}
            </View>
          )}
        </AppCard>

        {meQuery.isError ? (
          <View style={{ marginTop: spacing.lg }}>
            <Text
              style={{
                color: colors.danger,
                fontFamily: typography.fontFamily.semibold,
              }}
            >
              Couldn’t load friend info. Pull to refresh.
            </Text>
          </View>
        ) : null}
      </ScrollView>

      {toast ? (
        <View pointerEvents="none" style={styles.toastWrap}>
          <View style={styles.toastCard}>
            <Text style={styles.toastText}>{toast}</Text>
          </View>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },

  myCodeCard: {
    backgroundColor: colors.surfaceWarm,
    borderColor: colors.border,
  },

  inviteHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  inviteIcon: {
    width: 44,
    height: 44,
    borderRadius: radius.round,
    backgroundColor: colors.primarySoft,
    borderWidth: 1,
    borderColor: colors.primarySoft2,
    alignItems: "center",
    justifyContent: "center",
    ...shadows.small,
  },
  inviteTitle: {
    fontSize: 18,
    lineHeight: 20,
    fontFamily: typography.fontFamily.black,
    color: colors.textPrimary,
    letterSpacing: -0.2,
  },
  inviteSub: {
    marginTop: 6,
    fontSize: typography.base,
    lineHeight: 19,
    fontFamily: typography.fontFamily.regular,
    color: colors.textSecondary,
  },

  codeRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.md,
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  codeText: {
    fontSize: 22,
    letterSpacing: 2.2,
    fontFamily: typography.fontFamily.black,
    color: colors.textPrimary,
  },
  codeAction: {
    width: 38,
    height: 38,
    borderRadius: radius.round,
    backgroundColor: colors.primarySoft,
    borderWidth: 1,
    borderColor: colors.primarySoft2,
    alignItems: "center",
    justifyContent: "center",
  },

  addCard: {
    backgroundColor: colors.surface,
  },
  addHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  addHeaderIcon: {
    width: 44,
    height: 44,
    borderRadius: radius.round,
    backgroundColor: colors.primarySoft,
    borderWidth: 1,
    borderColor: colors.primarySoft2,
    alignItems: "center",
    justifyContent: "center",
  },

  sectionTitle: {
    fontSize: 22,
    lineHeight: 24,
    fontFamily: typography.fontFamily.black,
    color: colors.textPrimary,
    letterSpacing: -0.2,
  },
  sectionSub: {
    marginTop: 6,
    fontSize: typography.base,
    lineHeight: 20,
    fontFamily: typography.fontFamily.regular,
    color: colors.textSecondary,
  },

  inputWrap: {
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceWarm,
    paddingHorizontal: spacing.lg,
    paddingVertical: 12,
  },
  input: {
    fontSize: 16,
    fontFamily: typography.fontFamily.black,
    color: colors.textPrimary,
    letterSpacing: 1.2,
  },

  requestsCard: {
    backgroundColor: colors.surface,
  },
  requestsHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  requestsHeaderTitle: {
    fontSize: 16,
    fontFamily: typography.fontFamily.black,
    color: colors.textPrimary,
  },

  mutedLine: {
    fontSize: typography.sm,
    fontFamily: typography.fontFamily.regular,
    color: colors.textSecondary,
  },

  requestRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    padding: 12,
    borderRadius: radius.lg,
    backgroundColor: colors.surfaceWarm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  requestName: {
    fontSize: 15,
    fontFamily: typography.fontFamily.black,
    color: colors.textPrimary,
  },
  requestMeta: {
    marginTop: 6,
    fontSize: 12,
    fontFamily: typography.fontFamily.semibold,
    color: colors.textSecondary,
  },

  acceptPill: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: radius.round,
    backgroundColor: colors.primarySoft,
    borderWidth: 1,
    borderColor: colors.primarySoft2,
  },
  acceptText: {
    fontSize: 12,
    fontFamily: typography.fontFamily.black,
    color: colors.primary,
  },

  declinePill: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: radius.round,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  declineText: {
    fontSize: 12,
    fontFamily: typography.fontFamily.black,
    color: colors.textSecondary,
  },

  pendingPill: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: radius.round,
    backgroundColor: colors.borderLight,
    borderWidth: 1,
    borderColor: colors.border,
  },
  pendingText: {
    fontSize: 12,
    fontFamily: typography.fontFamily.black,
    color: colors.textSecondary,
  },

  toastWrap: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 24,
    alignItems: "center",
    paddingHorizontal: spacing.xl,
  },
  toastCard: {
    backgroundColor: colors.textPrimary,
    borderRadius: radius.round,
    paddingHorizontal: spacing.lg,
    paddingVertical: 10,
  },
  toastText: {
    fontSize: typography.sm,
    fontFamily: typography.fontFamily.black,
    color: "#fff",
  },
});
