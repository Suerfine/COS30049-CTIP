import React, { useEffect, useMemo, useState } from "react";
import {
  FlatList,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import {
  Award,
  Bell,
  BookOpen,
  Bot,
  CalendarDays,
  ChevronRight,
  CircleX,
  CreditCard,
  LayoutDashboard,
  MessageSquare,
  Search,
  Settings,
  ShieldAlert,
  User,
} from "lucide-react-native";
import { searchService } from "../services/SearchService";

const accent = "#efab21";

const SEARCH_ITEMS = [
  {
    title: "Dashboard",
    category: "Overview",
    description: "View learning summary, enrolled courses, and reminders",
    keywords: ["home", "summary", "overview", "dashboard"],
    icon: LayoutDashboard,
    mobileTarget: { screen: "Dashboard" },
    webTarget: { screen: "Dashboard" },
  },
  {
    title: "Courses",
    category: "Courses & learning",
    description: "Browse, enroll, and continue training courses",
    keywords: ["course", "training", "learn", "enroll", "module", "page", "quiz"],
    icon: BookOpen,
    mobileTarget: { screen: "Courses" },
    webTarget: { screen: "Courses" },
  },
  {
    title: "Course modules and quizzes",
    category: "Courses & learning",
    description: "Open course content, module pages, and quizzes",
    keywords: ["module", "modules", "page", "pages", "quiz", "quizzes", "lesson"],
    icon: BookOpen,
    mobileTarget: { screen: "Courses" },
    webTarget: { screen: "Courses" },
  },
  {
    title: "Discussion",
    category: "Courses & learning",
    description: "Open courses to post or reply in discussions",
    keywords: ["discussion", "forum", "message", "reply", "comment", "chat"],
    icon: MessageSquare,
    mobileTarget: { screen: "Courses" },
    webTarget: { screen: "Courses" },
  },
  {
    title: "Todo reminders",
    category: "Events & todo",
    description: "Create, edit, and track todo reminders",
    keywords: ["todo", "to do", "task", "reminder", "calendar", "event"],
    icon: CalendarDays,
    mobileTarget: {
      screen: "To Do",
      params: { screen: "To Do Calendar", params: { layout: "list" } },
    },
    webTarget: { screen: "Dashboard" },
  },
  {
    title: "Notifications",
    category: "Notifications",
    description: "View alerts and open linked updates",
    keywords: ["notification", "alert", "message", "notice"],
    icon: Bell,
    mobileTarget: { screen: "Notification" },
    webTarget: { screen: "Notification" },
  },
  {
    title: "Notification settings",
    category: "Settings",
    description: "Manage which notifications you receive",
    keywords: ["notification", "preference", "settings", "toggle", "alert"],
    icon: Settings,
    mobileTarget: { screen: "Settings" },
    webTarget: {
      screen: "ProfileStack",
      params: { screen: "Preferences" },
    },
  },
  {
    title: "Badges",
    category: "Badges & progress",
    description: "View earned badges and certification expiry",
    keywords: ["badge", "certificate", "certification", "expiry", "progress"],
    icon: Award,
    mobileTarget: { screen: "Badge" },
    webTarget: { screen: "Badge" },
  },
  {
    title: "Profile",
    category: "Users & account",
    description: "Update your personal profile information",
    keywords: ["profile", "account", "user", "details", "personal"],
    icon: User,
    mobileTarget: { screen: "Profile" },
    webTarget: {
      screen: "ProfileStack",
      params: { screen: "UserProfile" },
    },
  },
  {
    title: "Security",
    category: "Users & account",
    description: "Change password and review security options",
    keywords: ["security", "password", "login", "account"],
    icon: Settings,
    mobileTarget: { screen: "Settings" },
    webTarget: {
      screen: "ProfileStack",
      params: { screen: "Security" },
    },
  },
  {
    title: "AI detection",
    category: "Anomaly monitoring",
    description: "Open AI detection and anomaly monitoring tools",
    keywords: ["ai", "anomaly", "detection", "iot", "sensor", "camera"],
    icon: ShieldAlert,
    mobileTarget: { screen: "AI Detection" },
    webTarget: { screen: "Anomaly" },
  },
  {
    title: "AI chatbot",
    category: "Courses & learning",
    description: "Find the course assistant for learning support",
    keywords: ["chatbot", "ai assistant", "bot", "help", "question"],
    icon: Bot,
    mobileTarget: { screen: "Courses" },
    webTarget: { screen: "Courses" },
  },
];

const normalize = (value) => value.trim().toLowerCase();

const stripMarkup = (value = "") =>
  String(value)
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/!\[([^\]]*)\]\([^)]+\)/g, "$1")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/[*_~#>]/g, "")
    .replace(/^-+\s*/gm, "")
    .replace(/\s+/g, " ")
    .trim();

const getMatches = (query) => {
  const normalizedQuery = normalize(query);
  if (!normalizedQuery) {
    return SEARCH_ITEMS;
  }

  return SEARCH_ITEMS.filter((item) => {
    const haystack = [
      item.title,
      item.category,
      item.description,
      ...item.keywords,
    ]
      .join(" ")
      .toLowerCase();

    return haystack.includes(normalizedQuery);
  });
};

const getRemoteIcon = (type) => {
  switch (type) {
    case "course":
      return BookOpen;
    case "module":
    case "page":
      return BookOpen;
    case "discussion":
      return MessageSquare;
    default:
      return Search;
  }
};

const HighlightedText = ({ text, query, style, highlightStyle }) => {
  const displayText = stripMarkup(text);
  const normalizedQuery = normalize(query);
  const lowerText = displayText.toLowerCase();
  const index = normalizedQuery ? lowerText.indexOf(normalizedQuery) : -1;

  if (index < 0) {
    return <Text style={style}>{displayText}</Text>;
  }

  return (
    <Text style={style}>
      {displayText.slice(0, index)}
      <Text style={highlightStyle}>{displayText.slice(index, index + normalizedQuery.length)}</Text>
      {displayText.slice(index + normalizedQuery.length)}
    </Text>
  );
};

const navigateToItem = (navigation, item, variant) => {
  if (item.url) {
    const match = item.url.match(/^\/courses\/(\d+)(?:\/discussion\/(\d+))?/);
    if (match) {
      const params = {
        id: Number(match[1]),
        initialSection: match[2] ? "forum" : "overview",
        discussionId: match[2] ? Number(match[2]) : undefined,
        enrollmentId: item.enrollmentId,
        enrollmentStatus: item.enrollmentStatus,
      };

      if (variant === "mobile") {
        navigation.navigate("UserModule", params);
      } else {
        navigation.navigate("ParkGuideStack", {
          screen: "UserModule",
          params,
        });
      }
      return;
    }

    return;
  }

  const target = variant === "mobile" ? item.mobileTarget : item.webTarget;

  if (variant === "mobile") {
    navigation.navigate(target.screen, target.params);
    return;
  }

  navigation.navigate("ParkGuideStack", {
    screen: target.screen,
    params: target.params,
  });
};

const ParkGuideSiteSearch = ({ navigation, variant = "mobile", compact = false }) => {
  const [visible, setVisible] = useState(false);
  const [query, setQuery] = useState("");
  const [remoteResults, setRemoteResults] = useState([]);
  const [loadingRemote, setLoadingRemote] = useState(false);

  const hasQuery = normalize(query).length > 0;
  const featureResults = useMemo(() => (hasQuery ? getMatches(query) : []), [hasQuery, query]);
  const results = useMemo(() => {
    const normalizedRemoteResults = remoteResults.map((item) => ({
      ...item,
      icon: getRemoteIcon(item.type),
    }));

    return [...normalizedRemoteResults, ...featureResults];
  }, [featureResults, remoteResults]);

  useEffect(() => {
    if (!hasQuery || query.trim().length < 2) {
      setRemoteResults([]);
      setLoadingRemote(false);
      return;
    }

    let cancelled = false;
    setLoadingRemote(true);

    const timeout = setTimeout(async () => {
      try {
        const data = await searchService.parkGuide(query.trim());
        if (!cancelled) {
          setRemoteResults(data);
        }
      } catch (err) {
        if (!cancelled) {
          console.error("Park guide search error:", err);
          setRemoteResults([]);
        }
      } finally {
        if (!cancelled) {
          setLoadingRemote(false);
        }
      }
    }, 250);

    return () => {
      cancelled = true;
      clearTimeout(timeout);
    };
  }, [hasQuery, query]);

  const close = () => {
    setVisible(false);
    setQuery("");
  };

  const open = () => setVisible(true);

  const handleEntryChange = (value) => {
    setQuery(value);
    setVisible(normalize(value).length > 0);
  };

  const onSelect = (item) => {
    close();
    navigateToItem(navigation, item, variant);
  };

  const renderResult = ({ item }, compactResult = false) => {
    const Icon = item.icon;

    return (
      <Pressable
        onPress={() => onSelect(item)}
        style={({ hovered, pressed }) => [
          compactResult ? styles.dropdownItem : styles.resultItem,
          (hovered || pressed) && styles.resultItemActive,
        ]}
      >
        <View style={compactResult ? styles.dropdownIconBox : styles.iconBox}>
          <Icon size={compactResult ? 16 : 22} color="#fff" />
        </View>
        <View style={styles.resultText}>
          <Text style={compactResult ? styles.dropdownCategory : styles.category}>{item.category}</Text>
          <HighlightedText
            text={item.title}
            query={query}
            style={compactResult ? styles.dropdownTitle : styles.resultTitle}
            highlightStyle={styles.highlight}
          />
          <HighlightedText
            text={item.description}
            query={query}
            style={compactResult ? styles.dropdownDescription : styles.description}
            highlightStyle={styles.descriptionHighlight}
          />
        </View>
        <ChevronRight size={compactResult ? 18 : 24} color="#aaa" />
      </Pressable>
    );
  };

  if (variant === "web") {
    return (
      <View style={styles.webWrapper}>
        <View style={[styles.entry, compact && styles.entryCompact]}>
          <Search size={18} color="#666" />
          <TextInput
            value={query}
            onFocus={() => {
              if (hasQuery) setVisible(true);
            }}
            onChangeText={handleEntryChange}
            placeholder="Search..."
            placeholderTextColor="#8f8f8f"
            style={styles.entryInput}
          />
          {!!query && (
            <Pressable onPress={close} style={styles.entryClearBtn}>
              <CircleX size={16} color="#9ca3af" />
            </Pressable>
          )}
        </View>

        {visible && hasQuery && (
          <>
            <Pressable style={styles.webDismissLayer} onPress={close} />
            <View style={styles.dropdown}>
              {results.length === 0 ? (
                <View style={styles.dropdownEmpty}>
                  <Text style={styles.emptyTitle}>{loadingRemote ? "Searching..." : "No results"}</Text>
                  <Text style={styles.emptyText}>Try course, badge, todo, discussion, or anomaly.</Text>
                </View>
              ) : (
                <FlatList
                  keyboardShouldPersistTaps="handled"
                  data={results}
                  keyExtractor={(item) => item.title}
                  renderItem={(props) => renderResult(props, true)}
                  style={styles.dropdownList}
                />
              )}
            </View>
          </>
        )}
      </View>
    );
  }

  return (
    <>
      <Pressable onPress={open} style={[styles.entry, compact && styles.entryCompact]}>
        <Search size={18} color="#666" />
        <Text style={styles.entryText}>Search...</Text>
      </Pressable>

      <Modal
        visible={visible}
        animationType="fade"
        transparent
        onRequestClose={close}
      >
        <View style={styles.overlay}>
          <View style={[styles.panel, variant === "web" && styles.webPanel]}>
            <View style={styles.searchRow}>
              <View style={styles.searchBox}>
                <Search size={24} color="#666" />
                <TextInput
                  autoFocus
                  value={query}
                  onChangeText={setQuery}
                  placeholder="Search park guide features"
                  placeholderTextColor="#888"
                  style={styles.input}
                />
                {!!query && (
                  <Pressable onPress={() => setQuery("")} style={styles.clearBtn}>
                    <CircleX size={24} color="#9ca3af" />
                  </Pressable>
                )}
              </View>
              <Pressable onPress={close} style={styles.cancelBtn}>
                <Text style={styles.cancelText}>Cancel</Text>
              </Pressable>
            </View>

            <View style={styles.resultsCard}>
              {results.length === 0 ? (
                <View style={styles.emptyState}>
                  <Text style={styles.emptyTitle}>{loadingRemote ? "Searching..." : "No results found"}</Text>
                  <Text style={styles.emptyText}>Try searching course, badge, todo, payment, or anomaly.</Text>
                </View>
              ) : (
                <FlatList
                  keyboardShouldPersistTaps="handled"
                  data={results}
                  keyExtractor={(item) => item.title}
                  renderItem={(props) => renderResult(props)}
                />
              )}
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  webWrapper: {
    position: "relative",
    zIndex: 10000,
  },
  entry: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderWidth: 1,
    borderColor: "#8f8f8f",
    backgroundColor: "#fff",
    borderRadius: 14,
    minHeight: 32,
    paddingHorizontal: 8,
    width: 250,
  },
  entryCompact: {
    width: 220,
  },
  entryText: {
    color: "#8f8f8f",
    fontSize: 14,
  },
  entryInput: {
    flex: 1,
    color: "#111827",
    fontSize: 14,
    outlineStyle: "none",
    paddingVertical: 0,
  },
  entryClearBtn: {
    padding: 2,
  },
  webDismissLayer: {
    position: Platform.OS === "web" ? "fixed" : "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    zIndex: 9998,
  },
  dropdown: {
    position: "absolute",
    top: 42,
    right: 0,
    width: 520,
    maxHeight: 430,
    backgroundColor: "#fff",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    padding: 8,
    zIndex: 9999,
    shadowColor: "#000",
    shadowOpacity: 0.12,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 10,
  },
  dropdownList: {
    maxHeight: 360,
  },
  dropdownItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 8,
    gap: 10,
    borderRadius: 8,
  },
  dropdownIconBox: {
    width: 30,
    height: 30,
    borderRadius: 8,
    backgroundColor: accent,
    alignItems: "center",
    justifyContent: "center",
  },
  dropdownCategory: {
    color: "#737373",
    fontWeight: "600",
    fontSize: 11,
  },
  dropdownTitle: {
    color: "#111827",
    fontSize: 14,
    fontWeight: "700",
  },
  dropdownDescription: {
    color: "#737373",
    fontSize: 12,
  },
  dropdownEmpty: {
    padding: 18,
    alignItems: "center",
    gap: 6,
  },
  overlay: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.35)",
    paddingTop: Platform.OS === "web" ? 70 : 34,
    paddingHorizontal: 18,
  },
  panel: {
    width: "100%",
    alignSelf: "center",
    maxWidth: 620,
  },
  webPanel: {
    maxWidth: 760,
  },
  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 18,
  },
  searchBox: {
    flex: 1,
    minHeight: 58,
    borderRadius: 28,
    backgroundColor: "#e5e7eb",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 18,
    gap: 10,
  },
  input: {
    flex: 1,
    fontSize: 22,
    color: "#111827",
    outlineStyle: "none",
  },
  clearBtn: {
    padding: 4,
  },
  cancelBtn: {
    paddingVertical: 10,
  },
  cancelText: {
    color: accent,
    fontWeight: "700",
    fontSize: 18,
  },
  resultsCard: {
    backgroundColor: "#fff",
    borderRadius: 22,
    maxHeight: Platform.OS === "web" ? 560 : 620,
    overflow: "hidden",
  },
  resultItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 18,
    paddingHorizontal: 18,
    gap: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#eef2f7",
  },
  resultItemActive: {
    backgroundColor: "#f8fafc",
  },
  iconBox: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: accent,
    alignItems: "center",
    justifyContent: "center",
  },
  resultText: {
    flex: 1,
    gap: 4,
  },
  category: {
    color: "#737373",
    fontWeight: "600",
    fontSize: 13,
  },
  resultTitle: {
    color: "#111827",
    fontSize: 20,
    fontWeight: "700",
  },
  highlight: {
    color: accent,
  },
  description: {
    color: "#737373",
    fontSize: 14,
  },
  descriptionHighlight: {
    color: accent,
    fontWeight: "700",
  },
  emptyState: {
    padding: 28,
    alignItems: "center",
    gap: 8,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111827",
  },
  emptyText: {
    textAlign: "center",
    color: "#737373",
  },
});

export default ParkGuideSiteSearch;
