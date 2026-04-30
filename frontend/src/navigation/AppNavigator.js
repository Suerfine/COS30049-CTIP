/**
 * Navigation Architecture
 * ======================
 *
 * This file is deprecated. The new navigation structure is organized as follows:
 *
 * RootNavigator (App.js entry point)
 *   ├─ UnloggedInNavigator (no user logged in)
 *   │  ├─ Landing
 *   │  ├─ Login
 *   │  ├─ SignUp
 *   │  └─ ForgotPassword
 *   │
 *   ├─ AdminNavigator (for admin role)
 *   │  ├─ Course Management
 *   │  ├─ Course Details
 *   │  ├─ Registration Management
 *   │  ├─ Account Management
 *   │  ├─ Enrollment Management
 *   │  └─ User Profile
 *   │
 *   └─ ParkGuideNavigator (for park_guide role)
 *      ├─ Mobile: Tab Navigator with Dashboard, Courses, To Do, Badge, Profile
 *      ├─ Web: Stack with Dashboard, Courses, User Module, Profile
 *      └─ Shared: TaskDetails, UserModule
 */
