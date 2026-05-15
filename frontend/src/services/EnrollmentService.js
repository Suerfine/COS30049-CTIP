import { API_ENDPOINTS } from "../config/ApiEndpoints";
import apiClient from "../config/apiConfig";
import { appendFile } from "../utils/AppendFile";
import { Platform } from "react-native";

export const enrollmentService = {
  /**
   * GET: Fetch all enrollments enriched with User names (Admin View)
   */
  getAll: async (
    page = 1,
    size = 10,
    searchQuery = "",
    sortConfig,
    status = "All",
    courseId = "All",
  ) => {
    try {
      const params = { page, size };
      let filters = [];

      if (status && status !== "All") {
        filters.push(`status eq "${status}"`);
      }

      if (courseId && courseId !== "All") {
        filters.push(`course_id eq ${Number(courseId)}`);
      }

      if (filters.length > 0) {
        params.filter = filters.join(" and ");
      }

      if (sortConfig?.key) {
        params.orderBy = `${sortConfig.key} ${sortConfig.direction}`;
      }

      const [enrollRes, userRes, courseRes] = await Promise.all([
        apiClient.get(API_ENDPOINTS.ENROLLMENT.LIST, { params }),
        apiClient.get(API_ENDPOINTS.USER.ACCOUNT, { params: { size: 100 } }),
        apiClient.get(API_ENDPOINTS.COURSE.LIST, { params: { size: 100 } }),
      ]);

      const enrollmentData = enrollRes.data;
      const rawEnrollments = enrollmentData?.data || [];
      const usersArray = userRes.data?.data || userRes.data || [];
      const coursesArray = courseRes.data?.data || courseRes.data || [];

      let enrichedData = rawEnrollments.map((enroll) => {
        const user = usersArray.find(
          (u) => Number(u.id) === Number(enroll.user_id),
        );
        const course = coursesArray.find(
          (c) => Number(c.id) === Number(enroll.course_id),
        );

        let expiryDate = "N/A";
        if (enroll.enrolled_at && course?.must_complete_in_weeks) {
          const enrolledDate = new Date(enroll.enrolled_at);
          const durationInMs =
            Number(course.must_complete_in_weeks) * 7 * 24 * 60 * 60 * 1000;
          const calculatedDate = new Date(
            enrolledDate.getTime() + durationInMs,
          );
          expiryDate = `${String(calculatedDate.getDate()).padStart(2, "0")}/${String(calculatedDate.getMonth() + 1).padStart(2, "0")}/${calculatedDate.getFullYear()}`;
        }

        return {
          ...enroll,
          fullName: user
            ? `${user.firstname} ${user.lastname}`
            : `User #${enroll.user_id}`,
          courseName: course ? course.title : `Course #${enroll.course_id}`,
          course: course,
          expiry_date: expiryDate,
        };
      });

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        enrichedData = enrichedData.filter(
          (item) =>
            item.fullName.toLowerCase().includes(q) ||
            item.courseName.toLowerCase().includes(q),
        );
      }

      return {
        ...enrollmentData,
        data: enrichedData,
        courses: coursesArray,
      };
    } catch (error) {
      console.error("Enrollment Service Error:", error);
      console.error("DATA:", error.response?.data);
      console.error("MESSAGE:", error.message);
    }
  },
  /**
   * GET: My personal enrollments (Current User View)
   */
  getMyEnrollments: async () => {
    try {
      const res = await apiClient.get(API_ENDPOINTS.ENROLLMENT.MY_ENROLLMENTS);
      return res.data;
    } catch (error) {
      console.error("My Enrollments Error:", error);
      return [];
    }
  },

  /**
   * GET: Filter enrollments based on user id locally
   */
  getByUserId: async (userId) => {
    const allEnrollments = await enrollmentService.getAll();
    return allEnrollments.filter((enroll) => enroll.user_id === userId);
  },

  /**
   * POST: Create new Enrollment
   */
  enroll: async (courseId, receipt) => {
    try {
        const formData = new FormData();

        if (Platform.OS === 'web') {
            formData.append("receipt", receipt.file ?? receipt);
        } else {
            formData.append("receipt", {
                uri: receipt.uri,
                name: receipt.fileName ?? "receipt.jpg",
                type: receipt.mimeType ?? "image/jpeg",
            });
        }

        const res = await apiClient.post(
            API_ENDPOINTS.ENROLLMENT.ENROLL(courseId),
            formData,
            {
                headers: Platform.OS === 'web' ? {} : { "Content-Type": "multipart/form-data" }, 
            }
        );

        return res.data;

    } catch (error) {
        console.error("Enrollment Error:", error);
        throw error;
    }
  },

  /**
   * PATCH: Update enrollment status (Approval Logic)
   */
  updateStatus: async (enrollmentId, status) => {
    try {
      const id = Number(enrollmentId);

      const res = await apiClient.patch(
        API_ENDPOINTS.ENROLLMENT.UPDATE_STATUS(id, status),
        {},
      );

      return res.data;
    } catch (error) {
      console.error("Update Status Error:", error);
      throw error;
    }
  },

  // Patch: approved enrollments
  approve: async (enrollmentId) => {
    try {
      const id = Number(enrollmentId);
      const res = await apiClient.patch(API_ENDPOINTS.ENROLLMENT.APPROVE(enrollmentId));
      return res.data;
    } catch (err) {
      console.error("Approve badge error:", err);
      throw err;
    }
  },

  /**
   * DELETE: Permanently remove an enrollment record
   */
  delete: async (enrollmentId) => {
    try {
      const res = await apiClient.delete(
        API_ENDPOINTS.ENROLLMENT.DETAIL(enrollmentId),
      );
      return res.data;
    } catch (error) {
      console.error("Delete Enrollment Error:", error);
      throw error;
    }
  },
};
