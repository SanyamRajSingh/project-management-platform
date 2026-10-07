# Flowtide Mobile Android Client Guide

> Complete technical documentation for Flowtide's React Native / Expo Android application.

---

## 1. Overview & Architecture

The Flowtide mobile application is built with **Expo SDK 52** and **React Native 0.86**, sharing the exact same REST API and PostgreSQL database with the web application.

- **Application Identifier:** `com.flowtide.app`
- **Application Name:** Flowtide
- **Runtime Target:** Android (API 26+) and iOS

```
┌────────────────────────────────────────────────────────┐
│               Flowtide Mobile Architecture             │
└────────────────────────────────────────────────────────┘
                           │
       ┌───────────────────┴───────────────────┐
       ▼                                       ▼
┌──────────────┐                       ┌──────────────┐
│ AuthContext  │                       │NetworkContext│
│  Management  │                       │   (NetInfo)  │
└──────┬───────┘                       └──────┬───────┘
       │                                      │
       ▼                                      ▼
┌──────────────┐                       ┌──────────────┐
│ SecureStore  │                       │OfflineBanner │
│(Tokens/User) │                       │  Component   │
└──────┬───────┘                       └──────────────┘
       │
       ▼
┌──────────────┐
│  Axios Inter-│ ── Bearer Token & 401 Auto-Refresh
│   ceptors    │
└──────┬───────┘
       │ HTTPS / REST
       ▼
┌──────────────┐
│ Flowtide API │ (/api/v1/projects, /api/v1/tasks, /api/v1/dashboard)
└──────────────┘
```

---

## 2. Key Capabilities & Implementation

### 2.1 Secure Storage (`expo-secure-store`)
- Sensitive authentication material (Access Tokens, Refresh Tokens, and serialized User objects) are saved in hardware-backed encrypted storage (`SecureStore`) rather than plain `AsyncStorage`.
- Keys:
  - `flowtide_access_token`
  - `flowtide_refresh_token`
  - `flowtide_user`

### 2.2 Seamless Token Refresh Flow
- An Axios response interceptor monitors all outbound requests.
- When an API response returns `401 Unauthorized`, the interceptor queues the request, attempts a refresh call to `/api/auth/refresh` using the secure refresh token, updates storage, and transparently replays the original request without disrupting the user.
- If the refresh token has expired, all credentials are cleared and the user is redirected gracefully to the login screen with a warning badge.

### 2.3 Network State & Offline Awareness
- Integrated `@react-native-community/netinfo` inside `NetworkContext`.
- If the device loses internet connection, a non-intrusive `OfflineBanner` alerts the user.
- Cached screens remain readable, and pull-to-refresh will retry connection once network returns.

### 2.4 Pull-to-Refresh & Optimistic Interactions
- `DashboardScreen`, `ProjectsScreen`, and `TasksScreen` feature native `RefreshControl` support for rapid manual synchronization.
- Status changes (such as marking a task `done`) immediately reflect visually in the UI.

---

## 3. Screen Structure

| Screen | Location | Features |
| :--- | :--- | :--- |
| **Login** | `src/screens/auth/LoginScreen.tsx` | Secure authentication, form validation, error banners |
| **Register** | `src/screens/auth/RegisterScreen.tsx` | New account onboarding, organization setup |
| **Dashboard** | `src/screens/dashboard/DashboardScreen.tsx`| Metric cards, status distribution, progress indicators |
| **Projects** | `src/screens/projects/ProjectsScreen.tsx` | Search, status filters, project creation modal, pull-to-refresh |
| **Project Detail** | `src/screens/projects/ProjectDetailScreen.tsx`| Project stats, associated task lists, status updates |
| **Tasks** | `src/screens/tasks/TasksScreen.tsx` | Filter by status/priority, search, task completion toggling |

---

## 4. Building the Android APK

To generate an Android APK for distribution or evaluation:

1. Configure EAS CLI:
   ```bash
   npm install -g eas-cli
   eas login
   ```
2. Configure build profile in `eas.json`:
   ```json
   {
     "build": {
       "preview": {
         "distribution": "internal",
         "android": {
           "buildType": "apk"
         }
       }
     }
   }
   ```
3. Run the build:
   ```bash
   eas build -p android --profile preview
   ```
4. Download the generated `.apk` from the Expo dashboard.
