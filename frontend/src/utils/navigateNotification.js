import { Platform } from "react-native";
import { UserRoles } from "../enum/UserRoles";

const getPath = (url) => {
  if (!url) return "";

  try {
    return new URL(url, "app://notification").pathname;
  } catch {
    return String(url).split("?")[0];
  }
};

const getCourseLink = (path) => {
  const match = path.match(/^\/courses\/(\d+)(?:\/discussion\/(\d+))?/);
  if (!match) return null;

  return {
    courseId: Number(match[1]),
    discussionId: match[2] ? Number(match[2]) : undefined,
  };
};

export const navigateNotification = (navigation, url, currentUser) => {
  const path = getPath(url);
  const isAdmin = currentUser?.role === UserRoles.ADMIN;
  const isMobile = Platform.OS !== "web";
  const courseLink = getCourseLink(path);

  if (courseLink) {
    if (isAdmin) {
      navigation.navigate("Course Details", {
        id: courseLink.courseId,
        initialSection: courseLink.discussionId ? "forum" : "overview",
        discussionId: courseLink.discussionId,
      });
      return true;
    }

    const params = {
      id: courseLink.courseId,
      initialSection: courseLink.discussionId ? "forum" : "overview",
      discussionId: courseLink.discussionId,
    };

    if (isMobile) {
      navigation.navigate("UserModule", params);
    } else {
      navigation.navigate("UserModule", params);
    }
    return true;
  }

  if (path === "/discussions" || path.startsWith("/discussions/")) {
    navigation.navigate(isAdmin ? "Course Management" : "Courses");
    return true;
  }

  if (path === "/profile") {
    if (isAdmin) {
      navigation.navigate("User Profile");
    } else if (isMobile) {
      navigation.navigate("Profile");
    } else {
      navigation.navigate("ProfileStack", { screen: "UserProfile" });
    }
    return true;
  }

  if (path === "/todos" || path === "/calendar") {
    if (isMobile) {
      navigation.navigate("To Do", {
        screen: "To Do Calendar",
        params: { layout: "list" },
      });
    } else {
      navigation.navigate("Dashboard");
    }
    return true;
  }

  if (path === "/anomaly" || path === "/anomaly-events" || path === "/admin/dashboard") {
    navigation.navigate(isAdmin ? "Admin Dashboard" : isMobile ? "AI Detection" : "Anomaly");
    return true;
  }

  if (path === "/payments") {
    navigation.navigate(isAdmin ? "Enrollment Management" : "Payment");
    return true;
  }

  if (path === "/registrations" || path.startsWith("/registrations/")) {
    navigation.navigate(isAdmin ? "Registration Management" : "Dashboard");
    return true;
  }

  if (path === "/badges") {
    navigation.navigate("Badge");
    return true;
  }

  if (path === "/notifications") {
    return true;
  }

  navigation.navigate(isAdmin ? "Admin Dashboard" : "Dashboard");
  return false;
};
