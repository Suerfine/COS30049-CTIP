export const API_ENDPOINTS={
    USER:{
        SIGNUP: '/registrations',
        ACCOUNT: '/users',
        UPDATE:(id)=>`/users/${id}`,
        ME:'/users/me',
    },
    ADMIN:{
        APPROVE: (id)=>`/registrations/${id}/approve`,
    }
};