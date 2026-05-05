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
  DROPPED: "dropped",
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
  onDrop, // drop courses
}) => {
  const { t, i18n } = useTranslation();
  const isWeb = Platform.OS === "web";

  const isAdmin = userType === "admin";
  const isNotEnrolled = enrollmentStatus === null || enrollmentStatus === undefined;
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
  
  // handle drop courses
  const handleDropPress = () => {
    if (Platform.OS === "web") {
      const confirmed = window.confirm("Are you sure you want to drop the course?");
      if (confirmed) onDrop?.();
      } else {
        Alert.alert(
          "Drop Course",
          "Are you sure you want to drop the course?",
          [
            { text: "Cancel", style: "cancel" },
            {
              text: "Confirm",
              style: "destructive",
              onPress: () => onDrop?.(),
            },
          ]
        );
      }
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
          <Text style={styles.statusBadgeText}>In Review</Text>
        </View>
      );
    }

    if (isCompleted) {
      return (
        <View style={[styles.statusBadge, styles.badgeCompleted]}>
          <Text style={styles.statusBadgeText}>Completed</Text>
        </View>
      );
    }

    if (isFailed) {
      return (
        <View style={[styles.statusBadge, styles.badgeFailed]}>
          <Text style={styles.statusBadgeText}>Completed</Text>
        </View>
      );
    }

    return null;
  };

  // render drop course toolbar
  const renderDropToolbar = () => {
    if (isAdmin || !isInProgress) return null;
 
    return (
      <View style={styles.dropToolbarContainer}>
        <Pressable
          style={({ hovered, pressed }) => [
            styles.dropBtn,
            (isWeb && hovered) || pressed ? styles.dropBtnActive : null,
          ]}
          onPress={handleDropPress}
          accessibilityLabel="Drop course"
        >
          <Trash2 size={16} color="#fff"/>
        </Pressable>
      </View>
    );
  };

  return (
    // Title need change to course ID later
    // Not enrolled courses cannot view course content
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
        {renderDropToolbar()}
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
    </Pressable>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: "white",
    borderRadius: 12,
    paddingHorizontal: Platform.select({
      web: 17,
      default: 0,
    }),
    paddingVertical: Platform.select({
      web: 10,
      default: 0,
    }),
    borderRadius: Platform.select({
      web: 12,
      default: 15,
    }),
    width: Platform.select({
      web: 280,
      default: 190,
    }),
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
  },
  imageWrapper: {
    position: "relative",
  },
  courseImg: {
    width: Platform.select({
      web: 250,
      default: "100%",
    }),
    height: Platform.select({
      web: 170,
      default: 150,
    }),
    resizeMode: "fill",
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
    fontSize: Platform.select({
      web: 17,
      default: 14,
    }),
    paddingVertical: Platform.select({
      web: 10,
      default: 5,
    }),
    marginBottom: 10,
    textAlign: "left",
    fontWeight: "600",
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
    marginTop: 10,
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
    paddingHorizontal: Platform.select({
      web: 0,
      default: 10,
    }),
    paddingBottom: Platform.select({
      web: 0,
      default: 10,
    }),
  },
  cardHover: {
    transform: [{ translateY: -5 }],
    shadowOpacity: 0.2,
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
