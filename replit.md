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
- **Full i18n support**: German, English, and Polish translations

### Dual-Mode Scoring System
The app supports two scoring modes controlled via Profile settings:

**DEMO Mode (default)**
- Uses Krakow market benchmarks (Uber PLN 55-62/hr, Bolt PLN 40-50/hr, FreeNow PLN 42-52/hr)
- Shows "Opportunity Score" based on demand/friction priors
- Active until user has minimum 5 logged records

**PERSONAL Mode**
- Requires minimum 5 earnings records for the selected zone
- Uses driver's logged earnings history with 30-day time-decay weighting
- Shows "Profitability" based on actual rev/hour (or per-trip if duration missing)
- Falls back to DEMO mode if insufficient data

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
- **Server Storage**: Currently uses in-memory storage; PostgreSQL schema defined but not yet connected
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