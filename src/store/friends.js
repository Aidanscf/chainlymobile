import { create } from "zustand";
import {
  friends as seedFriends,
  userData,
  leagueData,
  riderCharacter,
} from "@/data/mock";

function deepClone(obj) {
  return JSON.parse(JSON.stringify(obj));
}

function normalizeFriend(seed, idx) {
  const base = deepClone(seed);

  // Expand the existing mock data into the richer "Friend" model.
  const skillDefaults = {
    jumping: 70 + idx * 3,
    cornering: 74 + idx * 2,
    drops: 66 + idx * 4,
    flow: 78 + idx * 2,
    tech: 72 + idx * 3,
    climbing: 80 + idx * 2,
  };

  return {
    id: String(base.id),
    name: base.name,
    avatar: base.avatar,
    characterTitle: [
      "Trail Whisperer",
      "Flow Artist",
      "Tech Tamer",
      "Jump Coach",
    ][idx % 4],
    leagueTier: ["Bronze", "Silver", "Gold", "Diamond"][idx % 4],
    leagueRank: 1200 + idx * 97,
    overallScore: 72 + idx * 6,
    stats: {
      ...skillDefaults,
      // keep some of the older "fitness" stats around if we want them later
      endurance: base.stats?.endurance ?? 80,
      speed: base.stats?.speed ?? 78,
    },
    recentActivity: {
      label: [
        "Nailed a tech descent",
        "PR on the climb",
        "New jump line unlocked",
        "Cornering feels smoother",
      ][idx % 4],
      timeAgo: ["Today", "Yesterday", "2d ago", "This week"][idx % 4],
    },
  };
}

function buildCurrentUser() {
  const skills = Array.isArray(riderCharacter?.skills)
    ? riderCharacter.skills
    : [];
  const byKey = (key, fallback) => {
    const s = skills.find((x) => x.key === key);
    return typeof s?.value === "number" ? s.value : fallback;
  };

  return {
    id: "me",
    name: userData?.name || "You",
    avatar: "https://i.pravatar.cc/150?img=8",
    characterTitle: riderCharacter?.characterName || "Your Rider Character",
    leagueTier: leagueData?.tier || "League",
    leagueRank: leagueData?.rank || 0,
    overallScore: riderCharacter?.overall || 80,
    stats: {
      jumping: byKey("jumping", 72),
      cornering: byKey("cornering", 84),
      drops: byKey("drops", 77),
      flow: byKey("flow", 91),
      tech: byKey("tech", 79),
      climbing: byKey("climbing", 92),
    },
  };
}

const seedNormalized = deepClone(seedFriends).map((f, idx) =>
  normalizeFriend(f, idx),
);

const suggestedSeed = [
  {
    id: "s1",
    name: "Jordan Park",
    avatar: "https://i.pravatar.cc/150?img=11",
    characterTitle: "Enduro Energizer",
    leagueTier: "Gold",
    leagueRank: 2188,
    overallScore: 79,
    stats: {
      jumping: 74,
      cornering: 76,
      drops: 71,
      flow: 80,
      tech: 78,
      climbing: 73,
    },
    recentActivity: { label: "Flow session 🔥", timeAgo: "Yesterday" },
  },
  {
    id: "s2",
    name: "Riley Nguyen",
    avatar: "https://i.pravatar.cc/150?img=12",
    characterTitle: "Corner Queen",
    leagueTier: "Silver",
    leagueRank: 4982,
    overallScore: 70,
    stats: {
      jumping: 61,
      cornering: 84,
      drops: 58,
      flow: 77,
      tech: 66,
      climbing: 69,
    },
    recentActivity: { label: "Corner drills ✅", timeAgo: "Today" },
  },
  {
    id: "s3",
    name: "Sam Torres",
    avatar: "https://i.pravatar.cc/150?img=13",
    characterTitle: "Climb Crusher",
    leagueTier: "Diamond",
    leagueRank: 932,
    overallScore: 88,
    stats: {
      jumping: 68,
      cornering: 81,
      drops: 72,
      flow: 84,
      tech: 86,
      climbing: 94,
    },
    recentActivity: { label: "Big climb day", timeAgo: "This week" },
  },
];

export const useFriendsStore = create((set, get) => ({
  currentUser: buildCurrentUser(),

  friends: seedNormalized,
  suggestedFriends: suggestedSeed,

  // ----- selectors
  getFriendById: (id) => {
    const { friends } = get();
    return (friends || []).find((f) => String(f.id) === String(id)) || null;
  },

  // ----- mutations
  addFriend: (friend) => {
    set((state) => {
      const next = [friend, ...(state.friends || [])].filter(
        (f, idx, arr) => arr.findIndex((x) => x.id === f.id) === idx,
      );

      const nextSuggested = (state.suggestedFriends || []).filter(
        (s) => s.id !== friend.id,
      );

      return { friends: next, suggestedFriends: nextSuggested };
    });
  },

  removeFriend: (friendId) => {
    set((state) => {
      const removed = (state.friends || []).find((f) => f.id === friendId);
      const nextFriends = (state.friends || []).filter(
        (f) => f.id !== friendId,
      );

      // Put them back into suggested (MVP behavior)
      const nextSuggested = removed
        ? [removed, ...(state.suggestedFriends || [])].filter(
            (f, idx, arr) => arr.findIndex((x) => x.id === f.id) === idx,
          )
        : state.suggestedFriends;

      return { friends: nextFriends, suggestedFriends: nextSuggested };
    });
  },

  // Sort leaderboard based on overall score (MVP).
  getLeaderboard: () => {
    const { friends, currentUser } = get();
    const combined = [currentUser, ...(friends || [])];
    const sorted = combined
      .slice()
      .sort((a, b) => (b.overallScore || 0) - (a.overallScore || 0));

    return sorted.map((p, idx) => ({ ...p, rank: idx + 1 }));
  },

  getFeaturedFriend: () => {
    const { friends } = get();
    return (friends || [])[0] || null;
  },
}));

export default useFriendsStore;
