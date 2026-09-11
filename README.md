# 🌆 Trivandrum City Pulse — Digital Twin Dashboard

> **A real-time city intelligence and flood risk management platform for Trivandrum (Thiruvananthapuram), Kerala.**
> Built as a Digital Twin competition submission, coexisting simulated scenarios with live APIs and hardware edge sensors.

---

## 📋 Overview

**Trivandrum City Pulse** is a React + TypeScript single-page web application that acts as a smart city digital twin dashboard. It integrates live weather data, an IoT hardware layer (ESP32 sensors via Supabase), a trained Random Forest ML model for city risk prediction, and a citizen crowdsourcing module — all visualised on an interactive Leaflet map of Trivandrum.

---

## ✨ Features

### 🗺️ Interactive City Map
- Leaflet.js map centred on Trivandrum with clickable zone markers
- Real-time overlay of flood-prone river basins (Killi River, Karamana River, Parvathy Puthanar Canal, Amayizhanchan Canal, Kannammoola Drain)
- Citizen-reported incident pins rendered on the map
- **OSRM-powered live route guidance** — automatically fetches a detour polyline around Thampanoor / East Fort low-lying zones when flood risk is HIGH

### 🤖 ML Risk Prediction (Random Forest)
- A **10-tree Random Forest classifier** trained on city scenarios, serialised to `src/lib/trainedModelData.json`
- Feature vector: Precipitation rate, traffic density, crowd footfall, sustained rainfall duration, low-lying zone flag
- Outputs: **LOW / MEDIUM / HIGH** risk level with confidence %, per-tree votes, feature importances (from real scikit-learn importances)
- Visible in **Control Room View** via the `MLRiskCard` component

### 📡 IoT Hardware Integration (ESP32 via Supabase Realtime)
- Connects to a physical ESP32 edge node (`esp32-node-01`) via **Supabase Realtime** subscriptions
- Reads: PIR motion sensor, DHT22 temperature & humidity, LCD display text, LED state (green/red), buzzer state
- Falls back gracefully to simulated sensor values when Supabase credentials are not configured
- Toggle between **Live Mode** (real hardware) and **Simulated Mode** at runtime

### 🌧️ Flood Risk Engine
- Rule-based `FloodRiskContext` computes a risk score from:
  - Rainfall intensity (mm/hr thresholds)
  - Sustained duration (minutes)
  - Low-lying zone elevation flag
  - **Signal Fusion**: Citizen waterlogging report count boosts the risk score (+1 when >= 2 reports exist)
- Drives reactive IoT LED/buzzer state in the dashboard

### ☁️ Live Weather (Open-Meteo API)
- Fetches real-time conditions for Trivandrum (lat: 8.5241, lng: 76.9366) from **Open-Meteo** (free, no API key required)
- Refreshes every 5 minutes
- Data: temperature (°C), wind speed (km/h), rain mm/hr, weather description
- Feeds directly into the ML risk model and Weather metric card

### 📈 Historical Trend Chart
- Rolling 20-point buffer updated every 3 seconds (toggleable in the header)
- Plots **City Health Score** and **Flood Score** over time using Recharts
- **Flood Forecast**: Linear regression on the trend buffer predicts how many minutes until MEDIUM/HIGH flood risk threshold is reached

### 🚨 SMS Alert (Twilio)
- Express.js backend (`server.js`) on port **3001** exposes `/api/send-sms`
- Automatically dispatches a critical SMS alert via **Twilio** when flood risk transitions from non-HIGH to HIGH
- Graceful fallback: simulates alert dispatch if Twilio credentials are absent

### 👁️ Dual View Modes
- **Citizen View** — simplified metrics and advisories for the public
- **Control Room View** — exposes ML Risk Card and IoT Sensor Panel for operators

### 🌐 Bilingual Support (English / Malayalam)
- Full i18n via `LanguageContext` and `src/data/translations.ts`
- Toggle between English and Malayalam (മലയാളം) at runtime

### 📢 Citizen Report System
- Residents can submit geolocated reports via `CitizenReportModal`
- Issue types: Waterlogging, Traffic congestion, Other
- Reports are merged into the live advisories feed and influence flood risk signal fusion

### 🎬 Guided Demo Mode
- Auto-cycles through city scenarios with step-by-step overlays
- Useful for presentations and live demonstrations

### 📴 Offline Mode
- `useOfflineStatus` hook detects connectivity loss
- Renders a banner with last-known data timestamp when offline

### 📲 PWA Support
- Configured as a Progressive Web App via `vite-plugin-pwa`
- Installable on mobile devices with `short_name: CityPulse`

---

## 🏗️ Project Architecture

```
project/
├── src/
│   ├── App.tsx                    # Root component, state orchestration
│   ├── components/
│   │   ├── CityMap.tsx            # Leaflet map, zone markers, flood overlays, route guidance
│   │   ├── IoTSensorPanel.tsx     # ESP32 sensor status display
│   │   ├── MLRiskCard.tsx         # Random Forest prediction display
│   │   ├── MetricCardView.tsx     # Crowd / Traffic / Weather / Safety cards
│   │   ├── AdvisoryPanel.tsx      # Live alerts + SMS dispatch status
│   │   ├── ScenarioSimulator.tsx  # Scenario switcher UI
│   │   ├── ZoneDetail.tsx         # Selected zone drill-down
│   │   ├── HistoricalTrendChart.tsx # Recharts trend visualisation
│   │   ├── CitizenReportModal.tsx # Citizen incident submission form
│   │   └── DemoModeOverlay.tsx    # Guided demo overlay
│   ├── hooks/
│   │   ├── useTelemetry.ts        # Supabase Realtime IoT subscription
│   │   ├── useWeather.ts          # Open-Meteo API polling
│   │   ├── useFloodForecast.ts    # Linear regression flood trend forecasting
│   │   ├── useRouteGuidance.ts    # OSRM live detour routing
│   │   ├── useGuidedDemo.ts       # Demo mode controller
│   │   └── useOfflineStatus.ts    # Network connectivity detection
│   ├── context/
│   │   ├── FloodRiskContext.tsx   # Rule-based flood risk engine + signal fusion
│   │   ├── LanguageContext.tsx    # EN / ML bilingual i18n
│   │   └── ViewModeContext.tsx    # Citizen vs Control Room view toggle
│   ├── lib/
│   │   ├── mlRiskModel.ts         # Random Forest inference engine
│   │   ├── trainedModelData.json  # Serialised trained model (10 trees, feature importances)
│   │   └── supabase.ts            # Supabase client + IoT state types
│   └── data/
│       ├── scenarios.ts           # City scenario definitions (Normal, Rush Hour, Monsoon, etc.)
│       └── translations.ts        # English / Malayalam string map
├── server.js                      # Express.js Twilio SMS backend (port 3001)
├── supabase/
│   └── migrations/
│       └── 20260904065044_create_iot_telemetry.sql  # IoT telemetry table schema
├── vite.config.ts                 # Vite + PWA configuration
└── .env                           # Environment variables (Supabase, Twilio)
```

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- npm

### Installation

```bash
git clone <repo-url>
cd project
npm install
```

### Environment Variables

Create or update `.env` in the project root:

```env
# Supabase (required for live IoT hardware mode)
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key

# Twilio SMS (required for real SMS alerts — optional, falls back to simulation)
TWILIO_ACCOUNT_SID=your-account-sid
TWILIO_AUTH_TOKEN=your-auth-token
TWILIO_PHONE_NUMBER=+1XXXXXXXXXX
TO_PHONE_NUMBER=+91XXXXXXXXXX
```

> **Without Supabase credentials**, the dashboard runs fully in **Simulated Mode** with no live IoT data.
> **Without Twilio credentials**, SMS alerts are simulated (logged but not sent).

### Running the App

**Frontend (Vite dev server):**
```bash
npm run dev
# Runs at http://localhost:5173
```

**Backend (Twilio SMS server):**
```bash
node server.js
# Runs at http://localhost:3001
```

Both servers need to be running simultaneously for full functionality.

---

## 🌍 City Scenarios

The dashboard ships with four pre-built city scenarios:

| Scenario | Health Score | Description |
|---|---|---|
| **Normal** | 85/100 | Baseline — city operating normally |
| **Rush Hour** | 68/100 | Peak traffic congestion on MG Road corridor |
| **Monsoon Flood** | 42/100 | Heavy rainfall, Killi River basin flooding |
| **Major Event** | 55/100 | Large public gathering near East Fort |

Each scenario configures: crowd density, traffic flow, weather conditions, road safety index, IoT sensor simulation values, advisory messages, and flood risk parameters.

---

## 🧠 ML Model Details

The Random Forest classifier uses **5 input features**:

| Feature | Source |
|---|---|
| Precipitation Rate (mm/hr) | Scenario / Live weather API |
| Traffic Gridlock Density (%) | Scenario data |
| Crowd Footfall Activity (%) | Scenario data |
| Sustained Rain Duration (mins) | Scenario parameter |
| Low-Lying Zone Elevation Flag | Zone metadata |

The model was trained with scikit-learn and serialised to JSON. Feature importances are preserved from the trained model for explainability display in the UI.

---

## 📡 IoT Hardware Setup (ESP32)

The dashboard expects an ESP32 node pushing telemetry rows to a Supabase `iot_telemetry` table with the schema:

```sql
-- See supabase/migrations/20260904065044_create_iot_telemetry.sql
id             uuid PRIMARY KEY
pir_detected   boolean
temp           numeric
humidity       numeric
lcd_text       text
led_state      text   -- 'green' | 'red'
buzzer_active  boolean
node_id        text   -- 'esp32-node-01'
created_at     timestamptz
```

The dashboard subscribes to `INSERT` events on this table via **Supabase Realtime**.

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Frontend framework | React 18 + TypeScript |
| Build tool | Vite 5 |
| Styling | Tailwind CSS 3 |
| Map | Leaflet.js |
| Charts | Recharts |
| Icons | Lucide React |
| Backend DB / Realtime | Supabase |
| Weather API | Open-Meteo (free, no key) |
| Routing API | OSRM Public Demo API |
| SMS Alerts | Twilio |
| Backend server | Express.js 5 |
| PWA | vite-plugin-pwa |

---

## 📜 License

This project is a competition submission. All rights reserved.

---

*Trivandrum City Pulse · Digital Twin Competition Submission · Data coexists with Live APIs & Hardware Edge Sensors*
