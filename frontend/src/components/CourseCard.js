import {
  View,
  Pressable,
  Image,
  Text,
  StyleSheet,
  Platform,
  Alert,
} from "react-native";
import {
  BookOpenText,
  Timer,
  ClockAlert,
  SquarePen,
  Trash2,
  CheckCircle2,
  Award,
} from "lucide-react-native";
import ProgressBar from "./ProgressBar.js";
import { useTranslation } from "react-i18next";
import { EnrollmentStatus } from "../enum/EnrollmentStatus.js";

const CourseCard = ({
  coverImgUrl,
  courseTitle,
  numModules,
  duration,
  expiry,
  userType,
  progress,
  enrollmentStatus,
  isEnrollable,
  onPress,
  onEdit,
  onDelete,
  onEnroll,
  previousEnrollments = [],
  onViewHistory,
  isPublished,
}) => {
  const { t, i18n } = useTranslation();
  const isWeb = Platform.OS === "web";
  const isAdmin = userType === "admin";
  const hasHistory = previousEnrollments.length > 0;

  // Normalize the URL to use forward slashes instead of backslashes
  const normalizedImageUrl = coverImgUrl
    ? coverImgUrl.replace(/\\/g, "/")
    : null;

  const handleEnrollPress = () => {
    onEnroll?.();
  };

  // show status
  const renderEnrollmentWidget = () => {
    switch (enrollmentStatus ?? null) {
      case EnrollmentStatus.PENDING_PAYMENT:
        return (
          <View style={[styles.statusBadge, styles.badgePendingPayment]}>
            <Text style={styles.statusBadgeText}>
              {t("status.pending_payment", "Pending Payment")}
            </Text>
          </View>
        );
      case EnrollmentStatus.APPLIED:
        return (
          <View style={[styles.statusBadge, styles.badgeApplied]}>
            <Text style={styles.statusBadgeText}>
              {t("status.pending_approval", "Pending Approval")}
            </Text>
          </View>
        );
      case EnrollmentStatus.IN_PROGRESS:
      case EnrollmentStatus.COMPLETED:
        return <ProgressBar progress={progress} />;
      case EnrollmentStatus.IN_REVIEW:
        return (
          <View style={[styles.statusBadge, styles.badgeInReview]}>
            <Text style={styles.statusBadgeText}>
              {t("status.in_review", "Under Admin Review")}
            </Text>
          </View>
        );
      case EnrollmentStatus.FAILED:
      case EnrollmentStatus.REJECTED:
        return (
          <View style={styles.historyActionContainer}>
            <Pressable
              style={[styles.enrollBtn, { marginTop: 8 }]}
              onPress={handleEnrollPress}
            >
              <Text style={styles.enrollText}>
                {t("enroll_again", "Enroll Again")}
              </Text>
            </Pressable>
            {hasHistory && (
              <Pressable style={styles.historyBtn} onPress={onViewHistory}>
                <Text style={styles.historyBtnText}>
                  {t("view_history", "View History")}
                </Text>
              </Pressable>
            )}
          </View>
        );
      case EnrollmentStatus.EXPIRED:
        return (
          <View>
            <View style={[styles.statusBadge, styles.badgeExpired]}>
              <Text style={styles.statusBadgeText}>
                {t("status.badge_expired", "Badge Expired")}
              </Text>
            </View>
            <View style={styles.historyActionContainer}>
              <Pressable
                style={[styles.enrollBtn, { marginTop: 8 }]}
                onPress={handleEnrollPress}
              >
                <Text style={styles.enrollText}>
                  {t("enroll_again", "Enroll Again")}
                </Text>
              </Pressable>
              {hasHistory && (
                <Pressable style={styles.historyBtn} onPress={onViewHistory}>
                  <Text style={styles.historyBtnText}>
                    {t("view_history", "View History")}
                  </Text>
                </Pressable>
              )}
            </View>
          </View>
        );
      default:
        return (
          <View style={styles.historyActionContainer}>
            <Pressable style={styles.enrollBtn} onPress={handleEnrollPress}>
              <Text style={styles.enrollText}>{t("enroll", "Enroll")}</Text>
            </Pressable>
            {/* Show history link even if they aren't currently enrolled but have past attempts */}
            {hasHistory && (
              <Pressable style={styles.historyBtnLink} onPress={onViewHistory}>
                <Text style={styles.historyLinkText}>
                  {t("view_past_records", "Show Past Records")}
                </Text>
              </Pressable>
            )}
          </View>
        );
    }
  };

  return (
    <Pressable
      style={({ pressed, hovered }) => [
        styles.card,
        isWeb && hovered && styles.cardHover,
        !isWeb && pressed && styles.cardPressed,
      ]}
      onPress={onPress}
    >
      <View style={styles.imageWrapper}>
        <Image
          source={{ uri: normalizedImageUrl }}
          style={styles.courseImg}
          accessibilityLabel="Cover Photo of Course"
        />
        {enrollmentStatus === EnrollmentStatus.COMPLETED && (
          <View style={styles.completedBadgeFloating}>
            <Award size={12} color="#fff" />
            <Text style={styles.completedBadgeText}>Badge Received</Text>
          </View>
        )}
      </View>

      <View style={styles.details}>
        <Text style={styles.CourseTitle}>{courseTitle}</Text>
        <View style={styles.row}>
          <View>
            <View style={styles.courseDetails}>
              <BookOpenText size={isWeb ? 20 : 15} />
              <Text style={styles.DetailsText}>
                {numModules} {t("modules")}
              </Text>
            </View>
            <View style={styles.courseDetails}>
              <Timer size={isWeb ? 20 : 15} />
              <Text style={styles.DetailsText}>{duration} Weeks</Text>
            </View>
            <View style={styles.courseDetails}>
              <ClockAlert size={isWeb ? 20 : 15} />
              <Text style={styles.DetailsText}>Valid for {expiry} Weeks</Text>
            </View>
          </View>

          {/* mobile */}
          {!isAdmin && !isWeb && (
            <View style={styles.mobileWidgetContainer}>
              {renderEnrollmentWidget()}
            </View>
          )}
        </View>

        {isAdmin && !isPublished && (
          <View style={styles.icon}>
            <Pressable
              onPress={onEdit}
              style={({ hovered }) => [hovered && styles.btnHover]}
            >
              <SquarePen size={20} />
            </Pressable>
            <Pressable
              onPress={onDelete}
              style={({ hovered }) => [hovered && styles.btnHover]}
            >
              <Trash2 size={20} />
            </Pressable>
          </View>
        )}
        {isPublished && isAdmin && (
          <View style={styles.publishedBadge}>
            <CheckCircle2 size={12} color="#065f46" strokeWidth={3} />
            <Text style={styles.publishedText}>PUBLISHED</Text>
          </View>
        )}

        {/* web */}
        {!isAdmin && isWeb && (
          <View style={styles.webWidgetContainer}>
            {renderEnrollmentWidget()}
          </View>
        )}
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: "white",
    borderRadius: 10,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    overflow: "hidden",
    borderColor: "#897474",
  },
  imageWrapper: {
    width: "100%",
    height: Platform.select({
      web: 180,
      default: 140,
    }),
    overflow: "hidden",
  },
  courseImg: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  // drop courses toolbar
  dropToolbarContainer: {
    position: "absolute",
    top: 8,
    right: 8,
    zIndex: 10,
  },
  dropBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: "rgba(0,0,0,0.60)",
    alignItems: "center",
    justifyContent: "center",
  },
  dropBtnActive: {
    backgroundColor: "red",
    opacity: 2.0,
  },
  // course detail
  CourseTitle: {
    borderBottomColor: "#8f8f8f",
    borderBottomWidth: 1,
    fontSize: Platform.select({ web: 17, default: 14 }),
    paddingVertical: Platform.select({ web: 10, default: 5 }),
    marginBottom: 10,
    textAlign: "left",
    fontWeight: "600",
    minHeight: Platform.OS === "web" ? 60 : 50,
  },
  courseDetails: {
    flexDirection: "row",
    alignContent: "center",
    padding: 2,
    color: "#3e3e3e",
    gap: 5,
    marginBottom: Platform.select({
      web: 3,
      default: 0,
    }),
  },
  DetailsText: {
    color: "#3e3e3e",
    fontSize: Platform.select({
      web: 14,
      default: 11,
    }),
  },
  icon: {
    flexDirection: "row",
    color: "#474747",
    marginTop: 10,
    gap: 10,
    justifyContent: "flex-end",
  },
  btnHover: {
    color: "#efab21",
  },
  enrollBtn: {
    marginVertical: 5,
    backgroundColor: "#efab21",
    padding: 8,
    borderRadius: 6,
    maxHeight: 35,
  },
  enrollText: {
    color: "white",
    textAlign: "center",
    fontWeight: "600",
  },
  details: {
    padding: Platform.select({
      web: 20,
      default: 10,
    }),
    flex: 1,
    justifyContent: "space-between",
  },
  cardHover: {
    ...Platform.select({
      web: {
        borderColor: "#efab21",
        shadowOpacity: 0.25,
        shadowRadius: 10,
      },
    }),
  },
  cardPressed: {
    opacity: 0.8,
    transform: [{ scale: 0.98 }],
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
  },
  mobileWidgetContainer: {
    justifyContent: "flex-end",
    alignItems: "flex-end",
  },
  webWidgetContainer: {
    marginTop: 10,
  },
  // status
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    alignSelf: "flex-start",
  },
  badgeInReview: {
    backgroundColor: "#fff3cd",
    borderWidth: 1,
    borderColor: "#ffc107",
  },
  badgeApplied: {
    backgroundColor: "#fff3cd",
    borderWidth: 1,
    borderColor: "#ffc107",
  },
  badgePendingPayment: {
    backgroundColor: "#fff3cd",
    borderWidth: 1,
    borderColor: "#ffc107",
  },
  badgeExpired: {
    backgroundColor: "#fee2e2",
    borderWidth: 1,
    borderColor: "#fecaca",
  },
  statusBadgeText: {
    fontSize: Platform.select({ web: 13, default: 10 }),
    fontWeight: "600",
    color: "#3e3e3e",
  },
  failedContainer: {
    marginTop: 10,
    width: "100%",
  },
  failedActions: {
    flexDirection: "row",
    gap: 10,
    marginTop: 8,
  },
  viewRecordBtn: {
    flex: 1,
    padding: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#64748b",
    backgroundColor: "white",
  },
  viewRecordText: {
    textAlign: "center",
    color: "#64748b",
    fontSize: 12,
    fontWeight: "600",
  },
  retryBtn: {
    flex: 1,
    padding: 8,
    borderRadius: 6,
    backgroundColor: "#dc2626",
  },
  retryText: {
    textAlign: "center",
    color: "white",
    fontSize: 12,
    fontWeight: "600",
  },

  historyActionContainer: {
    flexDirection: "column",
    gap: 5,
    width: "100%",
  },
  historyBtn: {
    backgroundColor: "#f3f4f6",
    padding: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#d1d5db",
  },
  historyBtnText: {
    color: "#374151",
    textAlign: "center",
    fontSize: 12,
    fontWeight: "600",
  },
  publishedBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#dcfce7",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#86efac",
    gap: 5,
    alignSelf: "flex-start",
    marginTop: 5,
  },
  publishedText: {
    fontSize: 10,
    fontWeight: "800",
    color: "#065f46",
    letterSpacing: 0.5,
  },
  completedBadgeFloating: {
    position: "absolute",
    top: 10,
    right: 10,
    backgroundColor: "#0a6340",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    gap: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 5,
    borderWidth: 1,
    borderColor: "#FFD700",
  },
  completedBadgeText: {
    color: "white",
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
});

export default CourseCard;

// When quiz does not pass but complete the course progress will 100%
