# 1. Apply database migration
cd backend
npx sequelize-cli db:migrate

# 2. Seed database with 30 compliance events
npx ts-node database/seeders/DevelopmentSeeder.ts

# 3. Start backend (Terminal 1)
npm run dev

# 4. Start inference server (Terminal 2)
cd c:\COS30049-CTIP
uvicorn server:app --host 0.0.0.0 --port 8000 --reload

# 5. Start mobile app (Terminal 3)
cd frontend
npm start


# ParkGuard AI System Integration - Setup Guide

## Overview
This document outlines the complete implementation of the compliance event logging system for ParkGuard AI, integrating the mobile client, inference server, and backend API, including the new Anomaly Detection dashboard with map visualization.

## Components Implemented

### 1. **Backend Database & API** (Express/TypeScript)
- **Model:** `ComplianceEvent.ts` - Stores compliance violations with event type, severity, metadata, and geolocation
- **Factory:** `ComplianceEventFactory.ts` - For seeding compliance events with automatic severity assignment
- **Controller:** `ComplianceEventController.ts` - Handles CRUD operations and statistics
- **Route:** `ComplianceEventRoute.ts` - REST endpoints for event management
- **Integration:** Routes registered in `routes/index.ts` as `/api/compliance-events`
- **Migration:** `20260505000000-update-compliance-event-types.js` - Updates ENUM values for new event types

### 2. **AI Inference Server** (Python/FastAPI)
- **Updated:** `server.py` to:
  - Accept `user_id` as query parameter in WebSocket URL
  - Track compliance event counts per session
  - Log new events to Express backend via HTTP
  - Support async event logging without blocking inference
  - Use new event type names with correct severity levels

### 3. **Mobile App - Admin Dashboard** (React Native/Expo)
- **Created:** `screens/AnomalyDetection.js` - Complete anomaly/compliance event dashboard with:
  - Sortable table with columns: ID, Event Type, Severity, Coordinates, Detected At, User
  - Real-time data fetching from `/api/compliance-events` endpoint
  - Search functionality for filtering events
  - Pagination with next/previous/jump-to-page controls
  - Interactive map modal - click coordinates to open embedded OpenStreetMap
  - Error handling with retry mechanism
  - Loading spinner UI
  - Empty state message
- **Created:** `hooks/useAnomalyDetection.js` - Custom hook for state management and API integration
- **Created:** `services/AnomalyService.js` - API service layer for compliance events
- **Updated:** `navigation/AdminNavigator.js` - Added Anomaly Detection route
- **Updated:** `components/SideBar.js` - Added Anomaly Detection menu item with Flag icon

---

## New Compliance Event Types

### Event Type Specifications

| Event Type | Severity | Description | Trigger |
|------------|----------|-------------|---------|
| **touching_plant** | Low | User touching a protected plant | Hand contact detected |
| **touching_animal** | Low | User touching a protected animal | Hand contact detected |
| **plucking_plants** | Medium | User attempting to pluck vegetation | Hand with upward motion on plant |
| **hitting_animal** | Medium | User attempting to hit an animal | High-velocity limb movement on animal |
| **extended_plant_touch** | Medium | Prolonged contact with protected plant | 2+ seconds of contact |
| **extended_animal_touch** | Medium | Prolonged contact with protected animal | 2+ seconds of contact |
| **forest_fire** | High | Forest fire detected in park area | Fire detection triggered |
| **other** | Medium | General compliance violation | Custom/undefined violations |

### Changes from Previous Implementation

**Old Event Types → New Event Types:**
- `plucking` → `plucking_plants` (High → Medium severity)
- `animal_strike` → `hitting_animal` (High → Medium severity)
- `extended_touch` → `extended_animal_touch` (Medium severity, unchanged)
- **New additions:** `touching_plant`, `touching_animal`, `extended_plant_touch`, `forest_fire`

---

## Setup Instructions

### Step 1: Update Database Schema

**Apply the migration:**

```bash
cd c:\COS30049-CTIP\backend
npx sequelize-cli db:migrate
```

This migration updates the `compliance_events` table's `event_type` ENUM to include the new event types:
- `touching_plant`
- `touching_animal`
- `plucking_plants`
- `hitting_animal`
- `extended_plant_touch`
- `extended_animal_touch`
- `forest_fire`
- `other`

### Step 2: Seed the Database

**Run the development seeder to populate compliance events:**

```bash
cd c:\COS30049-CTIP\backend
npx ts-node database/seeders/DevelopmentSeeder.ts
```

This creates:
- 5 admin users
- 10 park guide users (with linked compliance events)
- **30 compliance events** (3 per park guide) with:
  - Realistic event types with correct severity mappings
  - Random coordinates within Malaysia (1.3-1.6°N, 101-104°E)
  - Metadata with detection confidence and pose data
  - Properly formatted timestamps

### Step 3: Install Dependencies (Already Installed)

**Backend:**
```bash
cd backend
npm install
# Dependencies already include: express, sequelize, http client, etc.
```

**Python Server:**
```bash
pip install httpx  # For HTTP logging to backend
```

### Step 4: Configure Network

**Find Your PC's IP Address:**
```powershell
ipconfig
```
Look for "IPv4 Address" on your WiFi adapter (e.g., `192.168.1.100`)

**Allow Firewall Access:**
- Windows Defender Firewall → Allow an app through firewall
- Add `python.exe` (for port 8000) and `node.exe` (for port 5000)
- Both ports need inbound rules

### Step 5: Start Services

**Terminal 1 - Express Backend:**
```bash
cd c:\COS30049-CTIP\backend
npm run dev
# Server runs on http://localhost:5000
```

**Terminal 2 - AI Inference Server:**
```bash
cd c:\COS30049-CTIP
uvicorn server:app --host 0.0.0.0 --port 8000 --reload
# Server runs on http://0.0.0.0:8000
```

**Terminal 3 - Mobile App (Expo):**
```bash
cd c:\COS30049-CTIP\frontend
npm start
# or
expo start
```

### Step 6: Test the Anomaly Detection Dashboard

1. **Verify Backend API is running:**
   ```
   http://localhost:5000/api/compliance-events
   ```
   Should return paginated compliance events with 10 items per page

2. **Navigate to Anomaly Detection Dashboard:**
   - Open mobile app
   - Go to Admin Stack → Anomaly Detection
   - Should see table with compliance events

3. **Test Features:**
   - ✅ **Sorting:** Click column headers (Event Type, Severity, Detected At) to sort
   - ✅ **Search:** Type in search box to filter by event type or description
   - ✅ **Pagination:** Use page buttons to navigate through events
   - ✅ **Map View:** Click on coordinates to open map modal with location pinned
   - ✅ **Error Handling:** If API fails, error message displays with retry button

### Step 7: Optional - Verify Inference Server Integration

**Run Streamlit Desktop:**
```bash
cd c:\COS30049-CTIP
streamlit run vision_model/streamlit/app-api.py
```

Configure WebSocket: `ws://localhost:8000/ws/detect?user_id=1`

Start streaming and verify:
- Compliance events are logged to database
- New events appear in Anomaly Detection dashboard after page refresh
- Coordinates are populated from AI inference metadata

---

## API Endpoints

### Get All Compliance Events (with Pagination)
```
GET /api/compliance-events?page=1&size=10&orderBy=created_at desc&filter=event_type&searchQuery=plucking
```

**Query Parameters:**
- `page` (default: 1) - Page number
- `size` (default: 10) - Items per page
- `orderBy` (default: "created_at desc") - Sort column and direction
- `filter` - Filter field (optional)
- `searchQuery` - Search term for filtering (optional)

**Response:**
```json
{
  "data": [
    {
      "id": 1,
      "user_id": 5,
      "event_type": "plucking_plants",
      "severity": "medium",
      "description": "Plant plucking detected - user attempted to pluck vegetation",
      "latitude": 1.3521,
      "longitude": 103.8198,
      "metadata": {
        "frame_number": 4521,
        "detection_confidence": 0.87,
        "pose_keypoints_detected": 15
      },
      "created_at": "2026-05-05T10:30:45.000Z",
      "updated_at": "2026-05-05T10:30:45.000Z"
    }
  ],
  "pagination": {
    "currentPage": 1,
    "totalPages": 3,
    "totalItems": 30,
    "itemsPerPage": 10
  }
}
```

### Create Compliance Event
```
POST /api/compliance-events
Content-Type: application/json

{
  "user_id": 1,
  "event_type": "plucking_plants",
  "severity": "medium",
  "description": "Plant plucking detected",
  "metadata": {
    "pluck_count": 5,
    "detection_confidence": 0.89
  },
  "latitude": 1.3521,
  "longitude": 103.8198
}
```

### Get User's Compliance Events
```
GET /api/compliance-events/user/:userId?page=1&size=10
```

### Get Compliance Statistics
```
GET /api/compliance-events/stats/:userId

Response:
{
  "user_id": 1,
  "total_events": 15,
  "by_type": {
    "plucking_plants": 5,
    "hitting_animal": 3,
    "extended_animal_touch": 7
  },
  "by_severity": {
    "low": 2,
    "medium": 10,
    "high": 3
  }
}
```

---

## Dashboard Features

### Anomaly Detection Table

**Columns:**
1. **ID** - Event identifier
2. **Event Type** - Type of compliance violation (with emoji icons in future)
3. **Severity** - Color-coded badge (Red: High, Orange: Medium, Green: Low)
4. **Coordinates** - Clickable latitude/longitude with MapPin icon
5. **Detected At** - Formatted timestamp
6. **User** - User ID who triggered the event

**Interactive Features:**
- **Sort by clicking headers** - Arrow indicators show sort direction (↑ ascending, ↓ descending)
- **Search box** - Real-time filtering by event type or coordinates
- **Reset button** - Clear all filters and sorting
- **Pagination** - First/Previous/Page Numbers/Next/Last buttons
- **Map modal** - Click coordinates to view location on embedded OpenStreetMap

### Error Handling
- Loading spinner while fetching data
- Error message with retry button if API fails
- Empty state message when no events exist
- All errors logged to browser console for debugging

---

## WebSocket Connection Flow (AI Server)

**Compliance Event Logging:**

When AI server detects a new compliance violation:

```python
# Old event types (deprecated)
event_type="plucking"           # → plucking_plants
event_type="animal_strike"      # → hitting_animal
event_type="extended_touch"     # → extended_animal_touch

# New system
event_type="plucking_plants"    # severity: medium
event_type="touching_plant"     # severity: low
event_type="hitting_animal"     # severity: medium
event_type="forest_fire"        # severity: high
```

Server automatically assigns severity based on event type and logs to backend:

```
POST http://localhost:5000/api/compliance-events
{
  "user_id": 1,
  "event_type": "plucking_plants",
  "severity": "medium",
  "description": "...",
  "latitude": 1.3521,
  "longitude": 103.8198,
  "metadata": {...}
}
```

---

## Database Schema

```sql
CREATE TABLE compliance_events (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  event_type ENUM(
    'touching_plant',
    'touching_animal',
    'plucking_plants',
    'hitting_animal',
    'extended_plant_touch',
    'extended_animal_touch',
    'forest_fire',
    'other'
  ),
  severity ENUM('low', 'medium', 'high'),
  description TEXT NOT NULL,
  metadata JSON,
  latitude FLOAT,
  longitude FLOAT,
  created_at DATETIME DEFAULT NOW(),
  updated_at DATETIME DEFAULT NOW(),
  deleted_at DATETIME NULL,
  
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
```

---

## Key Features

✅ **Real-time Compliance Monitoring** - Events detected and logged instantly  
✅ **Comprehensive Dashboard** - Admin view with sortable, searchable table  
✅ **Geolocation Tracking** - Latitude/longitude with interactive map display  
✅ **Severity Classification** - Automatic severity assignment per event type  
✅ **Multi-client Support** - Desktop (Streamlit) + Mobile (Expo) simultaneously  
✅ **Persistent Storage** - All events stored in SQLite/PostgreSQL/MySQL  
✅ **Pagination** - 10 items per page with navigation controls  
✅ **Search & Filtering** - Filter by event type and coordinates  
✅ **Async Logging** - Non-blocking event logging doesn't slow inference  
✅ **Error Recovery** - Retry mechanism for API failures  
✅ **Metadata Tracking** - Rich event context (confidence scores, pose data)  
✅ **User Isolation** - Events scoped per user_id for privacy

---

## Troubleshooting

### Dashboard shows blank white page
- Check browser console (F12) for JavaScript errors
- Verify backend is running: `npm run dev` in backend folder
- Verify API endpoint returns data: `http://localhost:5000/api/compliance-events`
- Try hard refresh (Ctrl+Shift+R) to clear cache

### No compliance events display
- Run seeder: `npx ts-node database/seeders/DevelopmentSeeder.ts`
- Verify migration ran: `npx sequelize-cli db:migrate`
- Check database has compliance_events table
- Verify API returns paginated response with data

### Map modal won't open when clicking coordinates
- Verify latitude/longitude values are present in database
- Check browser console for errors
- Ensure OpenStreetMap is accessible (not blocked by firewall)

### "Cannot connect to API" error
- Verify backend running on port 5000
- Check firewall allows port 5000
- Verify database is connected
- Check `/api/compliance-events` endpoint manually in browser

### WebSocket connection failed (inference server)
- Verify Python server running on port 8000: `uvicorn server:app --host 0.0.0.0 --port 8000`
- Check firewall allows port 8000
- Verify `user_id` is valid and exists in database
- Check browser console for connection errors

---

## File Structure

```
c:\COS30049-CTIP\
├── backend\
│   ├── src\
│   │   ├── controllers\
│   │   │   └── ComplianceEventController.ts (UPDATED - new event types)
│   │   ├── models\
│   │   │   └── ComplianceEvent.ts (UPDATED - new event types)
│   │   └── routes\
│   │       └── ComplianceEventRoute.ts
│   ├── database\
│   │   ├── factories\
│   │   │   └── ComplianceEventFactory.ts (UPDATED - severity mappings)
│   │   ├── seeders\
│   │   │   └── DevelopmentSeeder.ts (UPDATED - creates 30 events)
│   │   └── migrations\
│   │       ├── 20260504192751-create-compliance-events-table.js
│   │       └── 20260505000000-update-compliance-event-types.js (NEW)
│   └── package.json
├── frontend\
│   ├── src\
│   │   ├── screens\
│   │   │   └── AnomalyDetection.js (NEW - dashboard with map)
│   │   ├── hooks\
│   │   │   └── useAnomalyDetection.js (NEW - state management)
│   │   ├── services\
│   │   │   └── AnomalyService.js (NEW - API service)
│   │   ├── navigation\
│   │   │   └── AdminNavigator.js (UPDATED - added route)
│   │   └── components\
│   │       └── SideBar.js (UPDATED - added menu item)
│   └── package.json
├── server.py (UPDATED - new event type names)
└── IMPLEMENTATION_GUIDE.md (THIS FILE)
```

---

## Next Steps (Optional Enhancements)

- [ ] Add real-time WebSocket updates to dashboard (auto-refresh on new events)
- [ ] Implement event video playback/export
- [ ] Create compliance trend charts and analytics
- [ ] Add event filtering by date range
- [ ] Implement alert notifications (push/email)
- [ ] Add role-based access control for different admin views
- [ ] Create compliance reports and export to PDF
- [ ] Implement event tagging and custom labels
- [ ] Add geofencing for automatic zone monitoring
- [ ] Create heatmap visualization of compliance hotspots
