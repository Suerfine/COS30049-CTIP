import { API_ENDPOINTS } from "../config/ApiEndpoints";
import apiClient from "../config/apiConfig";

/**
 * Helper: normalize API response
 */
const getData = (res) => res?.data?.data ?? res?.data ?? [];

/**
 * Helper: format full name
 */
const formatName = (user) =>
  user ? `${user.firstname} ${user.lastname}` : null;

const getUserProfileImage = (user, fallbackImage) =>
  fallbackImage ||
  user?.profileImage ||
  user?.pfp_url ||
  user?.pfp ||
  user?.user_profile_image ||
  user?.profile_image ||
  null;

const base64Alphabet =
  "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";

const arrayBufferToBase64 = (arrayBuffer) => {
  const bytes = new Uint8Array(arrayBuffer);
  let result = "";

  for (let index = 0; index < bytes.length; index += 3) {
    const byte1 = bytes[index];
    const byte2 = bytes[index + 1];
    const byte3 = bytes[index + 2];

    const triplet = ((byte1 || 0) << 16) | ((byte2 || 0) << 8) | (byte3 || 0);

    result += base64Alphabet[(triplet >> 18) & 63];
    result += base64Alphabet[(triplet >> 12) & 63];
    result +=
      index + 1 < bytes.length ? base64Alphabet[(triplet >> 6) & 63] : "=";
    result += index + 2 < bytes.length ? base64Alphabet[triplet & 63] : "=";
  }

  return result;
};

const getFilenameFromDisposition = (contentDisposition, fallback) => {
  const filenameMatch = contentDisposition?.match(
    /filename\*?=(?:UTF-8'')?"?([^";]+)"?/i,
  );

  if (!filenameMatch?.[1]) {
    return fallback;
  }

  try {
    return decodeURIComponent(filenameMatch[1]);
  } catch {
    return filenameMatch[1];
  }
};

const getReceiptExtension = (contentType) => {
  if (contentType?.includes("png")) return "png";
  if (contentType?.includes("webp")) return "webp";
  return "jpg";
};

export const paymentService = {
  /**
   * GET: All payments (raw or enriched)
   */
  getAll: async (
    page = 1,
    size = 10,
    searchQuery = "",
    sortConfig = null,
    status = "All",
  ) => {
    try {
      const params = { page, size };

      // filters
      if (status !== "All") {
        params.filter = `status eq "${status}"`;
      }

      // sorting
      if (sortConfig?.key) {
        params.orderBy = `${sortConfig.key} ${sortConfig.direction}`;
      }

      const [paymentRes, userRes] = await Promise.all([
        apiClient.get(API_ENDPOINTS.PAYMENT.LIST, { params }),
        apiClient.get(API_ENDPOINTS.USER.ACCOUNT, { params: { size: 100 } }),
      ]);

      const paymentData = paymentRes?.data || {};
      const payments = paymentData?.data || [];
      const users = userRes?.data?.data || [];

      let enriched = payments.map((p) => {
        const user = users.find(
          (u) =>
            Number(u.id) === Number(p.user_id) ||
            (p.user_email && u.personal_email === p.user_email),
        );
        const name = formatName(user) || p.user_fullname || `User #${p.user_id || 'unknown'}`;
        const imageSource = getUserProfileImage(user, p.user_profile_image || p.user_profile_img);

        return {
          ...p,
          fullName: name,
          user_fullname: p.user_fullname || name,
          user_profile_image: imageSource,
          profileImage: imageSource,
        };
      });

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();

        enriched = enriched.filter(
          (p) =>
            String(p.user_fullname || "")
              .toLowerCase()
              .includes(q) ||
            String(p.course_id || "")
              .toLowerCase()
              .includes(q) ||
            String(p.status || "")
              .toLowerCase()
              .includes(q),
        );
      }

      return {
        data: enriched,
        totalPages: paymentData?.totalPages || 1,
        totalElements: paymentData?.totalElements || enriched.length,
      };
    } catch (error) {
      console.error("Payment Service Error:", error);
      throw new Error("Failed to fetch payment records");
    }
  },

  /**
   * GET: Payment by ID
   */
  getById: async (paymentId) => {
    try {
      const res = await apiClient.get(API_ENDPOINTS.PAYMENT.DETAIL(paymentId));
      return res.data;
    } catch (error) {
      console.error("Payment Detail Error:", error);
      throw error;
    }
  },

  /**
   * GET: Authenticated receipt file as a data URI
   */
  getReceiptFile: async (paymentId) => {
    try {
      const res = await apiClient.get(
        API_ENDPOINTS.PAYMENT.RECEIPT(paymentId),
        {
          responseType: "arraybuffer",
        },
      );

      const contentType = res.headers?.["content-type"] || "image/jpeg";
      const base64 = arrayBufferToBase64(res.data);

      return {
        uri: `data:${contentType};base64,${base64}`,
        contentType,
      };
    } catch (error) {
      console.error("Get Receipt File Error:", error);
      throw error;
    }
  },

  /**
   * GET: Authenticated receipt file and trigger a browser download
   */
  downloadReceiptFile: async (paymentId) => {
    try {
      const res = await apiClient.get(
        API_ENDPOINTS.PAYMENT.RECEIPT(paymentId),
        {
          responseType: "arraybuffer",
        },
      );

      const contentType = res.headers?.["content-type"] || "image/jpeg";
      const fallbackFilename = `receipt-${paymentId}.${getReceiptExtension(contentType)}`;
      const filename = getFilenameFromDisposition(
        res.headers?.["content-disposition"],
        fallbackFilename,
      );

      if (typeof window === "undefined" || typeof document === "undefined") {
        return { filename, contentType };
      }

      const blob = new Blob([res.data], { type: contentType });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");

      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      return { filename, contentType };
    } catch (error) {
      console.error("Download Receipt File Error:", error);
      throw error;
    }
  },

  /**
   * POST: Create payment
   */
  create: async (payload) => {
    console.log(payload);
    try {
      const res = await apiClient.post(API_ENDPOINTS.PAYMENT.SUBMIT, payload, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      return res.data;
    } catch (error) {
      console.error("Create Payment Error:", error);
      throw error;
    }
  },

  /**
   * PATCH: Update status
   * Cleaner: uses body instead of URL params
   */
  updateStatus: async (paymentId, status) => {
    try {
      const res = await apiClient.patch(
        API_ENDPOINTS.PAYMENT.DETAIL(paymentId),
        { status },
      );
      return res.data;
    } catch (error) {
      console.error("Update Payment Status Error:", error);
      throw error;
    }
  },

  /**
   * DELETE: Remove payment
   */
  delete: async (paymentId) => {
    try {
      const res = await apiClient.delete(
        API_ENDPOINTS.PAYMENT.DETAIL(paymentId),
      );
      return res.data;
    } catch (error) {
      console.error("Delete Payment Error:", error);
      throw error;
    }
  },

  /**
   * OPTIONAL (recommended): Enrichment layer moved out of service
   * Call this only when UI needs full display data
   */
  enrichPayments: (payments, users = [], courses = []) => {
    return payments.map((payment) => {
      const user = users.find((u) => Number(u.id) === Number(payment.user_id));

      const course = courses.find(
        (c) => Number(c.id) === Number(payment.course_id),
      );

      return {
        ...payment,
        fullName: formatName(user) || `User #${payment.user_id}`,
        courseName: course?.title || `Course #${payment.course_id}`,
        course,
      };
    });
  },

  /**
   * Verify Payment
   */
  verifyPayment: async (paymentId, status, adminRemark = "") => {
    try {
      const res = await apiClient.patch(
        API_ENDPOINTS.PAYMENT.UPDATE_STATUS(paymentId, status),
        {
          status,
          admin_id: 1,
          admin_remark: adminRemark,
        },
      );

      return res.data;
    } catch (error) {
      console.error("Verify Payment Error:", error);
      throw error;
    }
  },
};
