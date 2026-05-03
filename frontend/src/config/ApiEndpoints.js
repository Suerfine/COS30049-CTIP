export const API_ENDPOINTS={
    USER:{
        SIGNUP: '/registrations',
        REGISTRATION_DOCUMENT: (id)=>`/registrations/${id}/document`,
        ACCOUNT: '/users',
        UPDATE:(id)=>`/users/${id}`,
        ME:'/users/me',
    },
    ADMIN:{
        APPROVE: (id)=>`/registrations/${id}/approve`,
        REJECT: (id)=>`/registrations/${id}/reject`,
    },
    COURSE:{
        LIST:'/courses',
        DETAIL:(id)=>`/courses/${id}`,
    }
};
