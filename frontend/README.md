# Frontend Architecture and Routing Guide

## Frontend Structure

The frontend is organized by responsibility so UI, state, and navigation are easy to maintain.

- src/components: Reusable UI components (navigation bars, cards, modal layouts, sidebars, etc.)
- src/config: App-level configuration values
- src/context: Global state providers (authentication is managed here)
- src/enum: Shared constants such as role values
- src/hooks: Feature-specific hooks for dashboard, courses, outline, registration, and account flows
- src/navigation: All navigator definitions and route flow logic
- src/screens: Screen-level pages for admin, park guide, and auth
- src/services: API/data-access functions used by hooks and screens
- src/utils: Shared helper functions

## Navigation Layers

Navigation is split into three layers:

1. App entry layer
2. Root auth/role routing layer
3. Role-specific or auth-specific navigator layer

At app startup, the app is wrapped with AuthProvider and NavigationContainer. The root navigator then decides which stack to show based on authentication state and role.

## Required Routing Flow

Use this flow as the single source of truth:

1. If auth state is still initializing, render loading state only.
2. If no current user, route to the unlogged-in navigator.
3. If current user exists and role is admin, route to admin navigator.
4. If current user exists and role is park_guide, route to park guide navigator.

This enforces clean separation between public routes and protected routes.

## Unlogged-In Routing

The unlogged-in navigator should contain only public routes:

- Landing
- Login
- SignUp
- ForgotPassword

The initial route is Landing.

## Logged-In Routing

### Admin routes

The admin navigator contains management screens such as:

- Course Management
- Course Details
- Registration Management
- Account Management
- Enrollment Management
- User Profile

### Park guide routes

Park guide navigation is platform-aware:

- Mobile: tab navigator (Dashboard, Courses, To Do, Badge) plus hidden Profile route and stack routes like UserModule
- Web: stack navigator (Dashboard, Courses, UserModule, UserProfile)

## Deep Linking

Route linking is configured at app root and should stay centralized there. If you add a new screen, update linking config in the same place where NavigationContainer is declared.

## How to Add a New Route Correctly

When introducing a screen:

1. Create the screen under src/screens.
2. Register it in the correct navigator (UnloggedIn, Admin, or ParkGuide).
3. If it should be addressable by URL/deep link, add it to root linking config.
4. Do not place protected routes in unlogged-in navigation.
5. Do not bypass root auth/role checks from screen-level code.

## Programmatic Navigation Rules

- Navigate within the current navigator for feature flow.
- Use root role changes through auth state updates (login/logout), not manual cross-stack jumps.
- After login, set currentUser in auth context; root routing will switch stacks automatically.
- After logout, clear currentUser and token; root routing will return to unlogged-in stack.

## Auth Context Responsibility

Auth context is responsible for:

- currentUser
- accessToken
- isLoading (startup/auth restore)
- login and logout actions

Routing decisions should read only from this context so route guarding remains consistent across the app.

## Maintenance Notes

- Keep role constants in one place and reuse them everywhere.
- Keep deprecated navigators unused in production route wiring.
- Prefer adding routes through the existing layered navigation model instead of creating parallel top-level containers.
