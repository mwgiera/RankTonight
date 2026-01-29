# DriveRadar

## Overview

DriveRadar is a mobile application designed to help multi-platform rideshare drivers make data-driven decisions about which platform (Bolt, Uber, FreeNow) to drive for at any given moment to maximize earnings. The app functions as a real-time earnings radar, providing platform rankings based on zone, time of day, and contextual factors.

The app follows a dashboard/cockpit aesthetic - bold, utilitarian, and confidence-inspiring. It's a professional tool for working drivers with clear hierarchy and decisive recommendations.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React Native with Expo SDK 54
- **Navigation**: React Navigation v7 with bottom tabs and native stack navigators
- **State Management**: TanStack React Query for server state, local React state for UI
- **Animations**: React Native Reanimated for smooth, performant animations
- **Styling**: StyleSheet-based with a centralized theme system in `client/constants/theme.ts`

### App Structure
- **5-tab navigation**: Now (recommendations), Zones (zone insights), Log (earnings input), Receipts (receipt parsing), Profile (settings)
- **No authentication required**: Single-user utility app with local storage for preferences
- **Dark theme only**: Dashboard aesthetic with deep navy-black backgrounds
- **Full i18n support**: German, English, Polish, and Ukrainian translations

### Admin Geolocation Tracking
Hidden admin system for collecting and viewing visitor location data:
- **Location Tracking**: Client sends GPS coordinates every 60 seconds to `/api/location`
- **Admin Access**: Tap version number 5 times in Profile screen to open admin login
- **Admin Password**: "driveradar2026" (or ADMIN_PASSWORD env var)
- **Dashboard**: Shows active visitors, total locations (24h), zone distribution, recent locations
- **Database Tables**: `visitor_locations` (id, visitor_id, lat/lng, zone, timestamp), `admin_sessions` (token, expiry)

### Dual-Mode Scoring System
The app supports two scoring modes controlled via Profile settings:

**PILOT Mode (default)**
- Uses Kraków market benchmarks (Uber PLN 55-62/hr, Bolt PLN 40-50/hr, FreeNow PLN 42-52/hr)
- Shows "Opportunity Score" based on demand/friction priors
- Active until user has minimum 5 logged records

**PERSONAL Mode**
- Requires minimum 5 earnings records for the selected zone
- Uses driver's logged earnings history with 30-day time-decay weighting
- Shows "Profitability" based on actual rev/hour (or per-trip if duration missing)
- Falls back to PILOT mode if insufficient data
- Confidence level based on sample count: <5 samples = max 35%, 5-15 samples = 35-65%, >15 samples = up to 85%

### Time Regimes (5 Coarse Blocks)
- morning-rush: 05:00-09:00
- midday: 09:00-15:00
- evening-rush: 15:00-19:00
- late-night: 19:00-01:00
- overnight: 01:00-05:00

Weekend mode activates on Saturday, Sunday, and Friday after 20:00.

### Polish Cost Model Defaults
- Operating cost: 0.70 PLN/km
- Target hourly rate: 90 PLN/h
- Tolerance threshold: 0.10 (10%)
- Minimum hourly threshold: 81 PLN/h
- Estimated speed: 0.45 km/minute

### Receipt Parser
The app can parse trip receipts from email text:
- Supports Uber, Bolt, and FreeNow receipt formats
- Auto-detects platform from email content
- Extracts: date/time, amount, duration (when available)
- Shows parse confidence (high/medium/low)
- Allows import to earnings log

### Ranking Model
The core logic lives in `client/lib/ranking-model.ts` and the dual-mode scorer in `client/lib/dual-scorer.ts`:
```
Demo Score = Base Rev/Hour × Zone Affinity × Time Multiplier × Congestion Factor
Personal Score = Time-Decayed Avg Rev/Hour (or Earnings/Trip if duration missing)
```
- Considers time of day (time regimes: morning-rush, midday, late-night, etc.)
- Considers day type (weekday vs weekend)
- Considers zone category (airport, center, residential)
- Outputs ranked platforms with confidence levels (Strong/Medium/Weak)

### Backend Architecture
- **Runtime**: Express.js with TypeScript (tsx for development)
- **API Pattern**: RESTful endpoints prefixed with `/api`
- **Storage**: In-memory storage by default (`server/storage.ts`), with Drizzle ORM schema ready for PostgreSQL

### Data Layer
- **Client Storage**: AsyncStorage for earnings logs, selected zone, user preferences, scoring mode, and parsed receipts
- **Server Storage**: PostgreSQL database with Drizzle ORM for admin location tracking
- **Schema**: Drizzle ORM with PostgreSQL dialect (`shared/schema.ts`)
- **CSV Export**: Full trip history can be exported as CSV via the Receipts tab

### Build System
- Development: Expo dev server with Metro bundler
- Production: Custom build script (`scripts/build.js`) for static export
- Server build: esbuild for bundling server code

## External Dependencies

### Core Framework
- **Expo SDK 54**: Cross-platform React Native framework
- **React 19.1**: UI library
- **React Native 0.81.5**: Mobile runtime

### Database (Prepared but not active)
- **PostgreSQL**: Database engine (via `pg` package)
- **Drizzle ORM**: Type-safe SQL query builder
- **drizzle-zod**: Schema validation integration

### UI/UX Libraries
- **React Navigation**: Navigation system (bottom-tabs, native-stack)
- **React Native Reanimated**: Animation library
- **React Native Gesture Handler**: Touch handling
- **Expo Haptics**: Tactile feedback
- **Expo Blur**: iOS blur effects for tab bar

### Data Management
- **TanStack React Query**: Server state management
- **AsyncStorage**: Local persistence for client data
- **Zod**: Runtime type validation

### Server
- **Express 5**: HTTP server framework
- **http-proxy-middleware**: Development proxy for Expo
- **ws**: WebSocket support