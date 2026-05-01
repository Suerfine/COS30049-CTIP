export const API_ENDPOINTS={
    USER:{
        SIGNUP: '/registrations',
        ACCOUNT: '/users',
        ME:'/users/me',
    },
    ADMIN:{
        APPROVE: (id)=>`/registrations/${id}/approve`,
    }
};