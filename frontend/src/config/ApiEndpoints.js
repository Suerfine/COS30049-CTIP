export const API_ENDPOINTS={
    USER:{
        SIGNUP: '/registrations',
        ACCOUNT: '/users',
        UPDATE:(id)=>`/users/${id}`,
        ME:'/users/me',
    },
    ADMIN:{
        APPROVE: (id)=>`/registrations/${id}/approve`,
        REJECT:(id)=>`/registrations/${id}/reject`,
    },
    COURSE:{
        LIST:'/courses',
        DETAIL:(id)=>`/courses/${id}`,
        MODULES:(courseId)=>`/courses/${courseId}/modules`,
        MODULE_DETAIL:(courseId, moduleId)=>`/courses/${courseId}/modules/${moduleId}`,
        PAGES:(courseId, moduleId)=>`/courses/${courseId}/modules/${moduleId}/pages`,
        PAGES_DETAIL:(courseId, moduleId, pageId)=>`/courses/${courseId}/modules/${moduleId}/pages/${pageId}`,
        ELEMENTS: (courseId, moduleId, pageId)=> `/courses/${courseId}/modules/${moduleId}/pages/${pageId}/elements`,
        ELEMENT_DETAIL:(courseId, moduleId, pageId, elementId)=>`/courses/${courseId}/modules/${moduleId}/pages/${pageId}/elements/${elementId}`,
    },
    DISCUSSION:{
        LIST:(courseId)=>`/courses/${courseId}/discussion`,
        MESSAGES:(discussionId)=>`/discussion/${discussionId}/messages`,
    },
    ENROLLMENT: {
        LIST: '/enrollments',
        ENROLL: (courseId) => `/enrollments/${courseId}/enroll`,
        UPDATE_STATUS: (id, status) => `/enrollments/${id}/status/${status}`,
        MY_ENROLLMENTS:`/enrollments/my-enrollments`,
        DETAIL:(id)=>`/enrollments/${id}`,
    },
};