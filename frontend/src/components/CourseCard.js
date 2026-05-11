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
  APPLIED: "applied",
  IN_PROGRESS: "in_progress",
  IN_REVIEW: "in_review",
  COMPLETED: "completed",
  FAILED: "failed",
  // EXPIRED: "expired",
  REJECTED: "rejected",
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
  isEnrollable,
  onPress,
  onEdit,
  onDelete,
  onEnroll,
}) => {
  const { t, i18n } = useTranslation();
  const isWeb = Platform.OS === "web";
  const isAdmin = userType === "admin";
  const handleEnrollPress = () => {
    onEnroll?.();
  };

  // show status
  const renderEnrollmentWidget = () => {
    if (!enrollmentStatus) {
      // if can enroll show enroll button
      if (isEnrollable) {
        return (
          <Pressable style={styles.enrollBtn} onPress={handleEnrollPress}>
            <Text style={styles.enrollText}>{t("enroll"),"Enroll"}</Text>
          </Pressable>
        );
      }
      // prerequisites not met
      return (
        <Pressable style={styles.enrollBtn} onPress={handleEnrollPress}>
          <Text style={styles.enrollText}>{t("enroll"),"Enroll"}</Text>
        </Pressable>
      );
    }

    if (enrollmentStatus === EnrollmentStatus.APPLIED) {
      return (
        <View style={[styles.statusBadge, styles.badgeApplied]}>
          <Text style={styles.statusBadgeText}>
            {t("status.pending_approval"),"Pending Approval"}
          </Text>
        </View>
      );
    }

    // show progress bar
    if (enrollmentStatus === EnrollmentStatus.IN_PROGRESS) {
      return <ProgressBar progress={progress} />;
    }

    if (enrollmentStatus === EnrollmentStatus.IN_REVIEW) {
      return (
        <View style={[styles.statusBadge, styles.badgeInReview]}>
          <Text style={styles.statusBadgeText}>
            {t("status.in_review"),"In Review"}
          </Text>
        </View>
      );
    }

    if (enrollmentStatus === EnrollmentStatus.COMPLETED) {
      return <ProgressBar progress={progress} />
    }
    
    if (enrollmentStatus === EnrollmentStatus.FAILED) {
      return (
        <Pressable style={styles.enrollBtn} onPress={handleEnrollPress}>
          <Text style={styles.enrollText}>{t("enroll"),"Enroll"}</Text>
        </Pressable>
      );
    }
    
    if (enrollmentStatus === EnrollmentStatus.REJECTED) {
      return (
        <Pressable style={styles.enrollBtn} onPress={handleEnrollPress}>
          <Text style={styles.enrollText}>{t("enroll"),"Enroll"}</Text>
        </Pressable>
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
  badgeApplied: {
    backgroundColor: "#fff3cd",
    borderWidth: 1,
    borderColor: "#ffc107",
  },
  statusBadgeText: {
    fontSize: Platform.select({ web: 13, default: 10 }),
    fontWeight: "600",
    color: "#3e3e3e",
  },
  failedContainer: {
    marginTop: 10,
    width: '100%',
  },
  failedActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 8,
  },
  viewRecordBtn: {
    flex: 1,
    padding: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#64748b',
    backgroundColor: 'white',
  },
  viewRecordText: {
    textAlign: 'center',
    color: '#64748b',
    fontSize: 12,
    fontWeight: '600',
  },
  retryBtn: {
    flex: 1,
    padding: 8,
    borderRadius: 6,
    backgroundColor: '#dc2626',
  },
  retryText: {
    textAlign: 'center',
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
});

export default CourseCard;

// When quiz does not pass but complete the course progress will 100%