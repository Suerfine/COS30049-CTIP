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
} from "lucide-react-native";
import ProgressBar from "./ProgressBar.js";
import { useTranslation } from "react-i18next";

const EnrollmentStatus = {
  IN_PROGRESS: "in_progress",
  IN_REVIEW: "in_review",
  COMPLETED: "completed",
  FAILED: "failed",
  EXPIRED: "expired",
};

// Checks if the user satisfies at least one prerequisite group for the course.
// A group is satisfied when ALL prerequisites within it are completed.
const checkPrerequisitesMet = (prerequisiteGroups, myEnrollments) => {
  if (!prerequisiteGroups || prerequisiteGroups.length === 0) return true;
 
  return prerequisiteGroups.some((group) => {
    const prereqs = group.prerequisites || [];
    if (prereqs.length === 0) return true;
 
    return prereqs.every((prereq) => {
      const enrollment = myEnrollments.find(
        (e) => Number(e.course_id) === Number(prereq.course_id)
      );
      return enrollment?.status === EnrollmentStatus.COMPLETED;
    });
  });
};

const CourseCard = ({
  coverImgUrl,
  courseTitle,
  numModules,
  duration,
  expiry,
  userType,
  progress,
  enrollmentStatus,
  prerequisiteGroups,
  myEnrollments,
  onPress,
  onEdit,
  onDelete,
  onEnroll,
  // onDrop,
}) => {
  const { t, i18n } = useTranslation();
  const isWeb = Platform.OS === "web";

  const isAdmin = userType === "admin";
  const isNotEnrolled = !enrollmentStatus;
  const isInProgress = enrollmentStatus === EnrollmentStatus.IN_PROGRESS;
  const isInReview = enrollmentStatus === EnrollmentStatus.IN_REVIEW;
  const isCompleted = enrollmentStatus === EnrollmentStatus.COMPLETED;
  const isFailed = enrollmentStatus === EnrollmentStatus.FAILED;

  const cardPressable = isInProgress;

  // HANDLERS
  // check prerequisites
  const handleEnrollPress = () => {
    const prereqsMet = checkPrerequisitesMet(prerequisiteGroups, myEnrollments || []);
 
    if (!prereqsMet) {
      if (Platform.OS === "web") {
        window.alert("You need to pass the prerequisite(s) before enrolling in this course.");
      } else {
        Alert.alert(
          "Prerequisites Not Met",
          "You need to pass the prerequisite(s) before enrolling in this course."
        );
      }
      return;
    }
 
    // if prerequisites satisfied or no prerequisites then set status = in review
    onEnroll?.();
  };

  // show status (enroll, progress bar, in review, completed)
  const renderEnrollmentWidget = () => {
    if (isNotEnrolled) {
      return (
        <Pressable style={styles.enrollBtn} onPress={handleEnrollPress}>
          <Text style={styles.enrollText}>{t("enroll") || "Enroll"}</Text>
        </Pressable>
      );
    }

    if (isInProgress) {
      return <ProgressBar progress={progress} />;
    }

    if (isInReview) {
      return (
        <View style={[styles.statusBadge, styles.badgeInReview]}>
          <Text style={styles.statusBadgeText}>{t("in review")}</Text>
        </View>
      );
    }

    if (isCompleted) {
      return (
        <View style={[styles.statusBadge, styles.badgeCompleted]}>
          <Text style={styles.statusBadgeText}>{t("completed")}</Text>
        </View>
      );
    }

    if (isFailed) {
      return (
        <View style={[styles.statusBadge, styles.badgeFailed]}>
          <Text style={styles.statusBadgeText}>{t("failed")}</Text>
        </View>
      );
    }

    return null;
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
          source={{ uri: coverImgUrl }}
          style={styles.courseImg}
          accessibilityLabel="Cover Photo of Course"
        />
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

          {/* mobile */}
          {!isAdmin && !isWeb && (
            <View style={styles.mobileWidgetContainer}>
              {renderEnrollmentWidget()}
            </View>
          )}
          </View>
        </View>

        {isAdmin && (
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
    width: "100%", 
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    overflow: "hidden", 
    borderColor: "#897474",
    flex: 1,
  },
  imageWrapper: {
    width: "100%",
  },
  courseImg: {
    width: "100%", 
    height: 180, 
    resizeMode: "cover", 
    alignSelf: "center",
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
    minHeight: Platform.OS === 'web' ? 60 : 50, 
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
    paddingTop: 5,
    padding: 20, 
    flex: 1,
    justifyContent: "space-between",
  },
  cardHover: {
    ...Platform.select({
      web: {
        borderColor: "#efab21", 
        shadowOpacity: 0.25,
        shadowRadius: 10,
      }
    })
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
  mobileWidgetContainer:{
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
  badgeCompleted: {
    backgroundColor: "#d4edda",
    borderWidth: 1,
    borderColor: "#28a745",
  },
  badgeFailed:{
    backgroundColor: "#ffb7b3",
    borderWidth: 1,
    borderColor: "red",
  },
  statusBadgeText: {
    fontSize: Platform.select({ web: 13, default: 10 }),
    fontWeight: "600",
    color: "#3e3e3e",
  },
});

export default CourseCard;
