export const API_ENDPOINTS = {
  USER: {
    SIGNUP: "/registrations",
    ACCOUNT: "/users",
    UPDATE: (id) => `/users/${id}`,
    ME: "/users/me",
  },
  ADMIN: {
    APPROVE: (id) => `/registrations/${id}/approve`,
    REJECT: (id) => `/registrations/${id}/reject`,
  },
  COURSE: {
    LIST: "/courses",
    DETAIL: (id) => `/courses/${id}`,
    MODULES: (courseId) => `/courses/${courseId}/modules`,
    MODULE_DETAIL: (courseId, moduleId) =>
      `/courses/${courseId}/modules/${moduleId}`,
    PAGES: (courseId, moduleId) =>
      `/courses/${courseId}/modules/${moduleId}/pages`,
    PAGES_DETAIL: (courseId, moduleId, pageId) =>
      `/courses/${courseId}/modules/${moduleId}/pages/${pageId}`,
    ELEMENTS: (courseId, moduleId, pageId) =>
      `/courses/${courseId}/modules/${moduleId}/pages/${pageId}/elements`,
    ELEMENT_DETAIL: (courseId, moduleId, pageId, elementId) =>
      `/courses/${courseId}/modules/${moduleId}/pages/${pageId}/elements/${elementId}`,
    USER_COURSES: "/courses/user",
  },
  DISCUSSION: {
    LIST: (courseId) => `/courses/${courseId}/discussion`,
    DETAIL: (courseId, discussionId) =>
      `/courses/${courseId}/discussion/${discussionId}`,
    MESSAGES: (discussionId) => `/discussion/${discussionId}/messages`,
  },
  MESSAGE: {
    DETAIL: (messageId) => `/messages/${messageId}`,
  },
  ENROLLMENT: {
    LIST: "/enrollments",
    ENROLL: (courseId) => `/enrollments/${courseId}/enroll`,
    UPDATE_STATUS: (id, status) => `/enrollments/${id}/status/${status}`,
    MY_ENROLLMENTS: `/enrollments/my-enrollments`,
    DETAIL: (id) => `/enrollments/${id}`,
    SUMARRIES: "/enrollments/submissions/summaries",
    AUDIT: (id) => `/enrollments/${id}/audit`,
    PATCH: (id) => `/enrollments/${id}/approve`,
    HISTORY_BY_ENROLLMENT: (enrollmentId) =>
      `/submission/enrollment/${enrollmentId}`,
  },
  WORKSHOP: {
    JOIN_WORKSHOP: (courseId, elementId) =>
      `/api/courses/${courseId}/elements/${elementId}/workshops/join`,
    ALL_WORKSHOP: (courseId) => `/courses/${courseId}/elements/workshops`,
  },
  TAGS: {
    LIST: "/tags",
    CREATE: "/tags",
  },
  NOTIFICATION: {
    LIST: "/notifications",
    MY_NOTIFICATIONS: "/notifications/me",
    DETAIL: (id) => `/notifications/${id}`,
    UPDATE: (id) => `/notifications/${id}`,
    DISMISS: (id) => `/notifications/${id}/dismiss`,
    DELETE: (id) => `/notifications/${id}`,
  },
  SUBMISSION: {
    BASE: "/submission",
    BY_ID: (id) => `/submission/${id}`,
    SUBMIT_ATTEMPT: (id) => `/submission/${id}/submit`,
    MARK: (id) => `/submission/${id}/mark`,
    GET_BY_ELEMENT: (enrolId, elId) => `/enrollment/${enrolId}/element/${elId}`,
  },
  EVENTS: {
    BASE: "/events",
    STATUS: (id) => `/events/${id}/status`,
  },
  AR: {
    LIST: "/ar-models",
    DETAIL: (id) => `/ar-models/${id}`,
    PATTERN: (id) => `/ar-models/${id}/pattern`,
  },
  PROGRESS: {
    COURSE: (courseId) => `/progress/course/${courseId}`,
    MODULE: (moduleId, courseId) =>
      `/progress/module/${moduleId}?courseId=${courseId}`,
    ELEMENT: (elementId) => `/progress/element/${elementId}`,
  },
  PAYMENT: {
    LIST: "/payments",
    SUBMIT: "/payments",
    BY_USER: (userId) => `/payments/user/${userId}`,
    DETAIL: (id) => `/payments/${id}`,
    RECEIPT: (paymentId) => `/payments/${paymentId}/receipt`,
    UPDATE_STATUS: (paymentId, status) =>
      `/payments/${paymentId}/status/${status}`,
  },
  CHATBOT: {
    SEND_MESSAGE: "/chatbot",
    CREATE_SESSION: "/chatbot/create-session",
  },
};
