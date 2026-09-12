# 🌆 Trivandrum City Pulse — Digital Twin Dashboard

> *A smart-city digital twin dashboard for urban monitoring, scenario simulation, flood-risk prediction, and IoT-enabled decision support for Thiruvananthapuram, Kerala.*

![TypeScript](https://img.shields.io/badge/TypeScript-Frontend-blue)
![React](https://img.shields.io/badge/React-Framework-61DAFB)
![Leaflet](https://img.shields.io/badge/Leaflet-Maps-green)
![Supabase](https://img.shields.io/badge/Supabase-Database-3ECF8E)
![Python](https://img.shields.io/badge/Python-ML-3776AB)
![Random Forest](https://img.shields.io/badge/Random%20Forest-ML-orange)
![ESP32](https://img.shields.io/badge/ESP32-IoT-red)
![REST API](https://img.shields.io/badge/REST%20API-Live%20Data-purple)




---

## 📋 Table of Contents

* [Overview](#-overview)
* [Features](#-features)
* [Project Architecture](#️-project-architecture)
* [Getting Started](#-getting-started)
* [City Scenarios](#-city-scenarios)
* [ML Model Details](#-ml-model-details)
* [IoT Hardware Setup](#-iot-hardware-setup-esp32)
* [Tech Stack](#️-tech-stack)
* [Contributing](#-contributing)
* [License](#-license)

---

## 📋 Overview

**Trivandrum City Pulse** is a React + TypeScript single-page web application that acts as a smart-city digital twin dashboard.

The platform combines live weather information, optional ESP32 edge telemetry through Supabase Realtime, a trained Random Forest risk model, simulated urban scenarios, citizen reports, and interactive geospatial visualization.

The dashboard provides separate **Citizen View** and **Control Room View** interfaces for presenting city conditions, risk information, alerts, and decision-support data.

<!-- Add a screenshot or demo GIF here, e.g.: -->

<!-- ![City Pulse Dashboard](docs/screenshot.png) -->

---

## ✨ Features

### 🗺️ Interactive City Map

* Leaflet.js map centered on Thiruvananthapuram with clickable zone markers
* Visualization of flood-prone river basins and drainage areas, including:

  * Killi River
  * Karamana River
  * Parvathy Puthanar Canal
  * Amayizhanchan Canal
  * Kannammoola Drain
* Citizen-reported incident pins displayed on the map
* **OSRM-based route guidance** for alternative routing when high flood risk is detected in selected zones

### 🤖 ML Risk Prediction

* A **10-tree Random Forest classifier** trained using city scenario data
* Serialized model data stored in `src/lib/trainedModelData.json`
* Uses five input features:

  * Precipitation rate
  * Traffic density
  * Crowd footfall
  * Sustained rainfall duration
  * Low-lying zone elevation flag
* Produces **LOW / MEDIUM / HIGH** risk predictions
* Displays confidence percentage, per-tree voting information, and feature importances
* Feature importances are derived from the trained scikit-learn model
* Integrated into the **Control Room View** through the `MLRiskCard` component

### 📡 IoT Hardware Integration — ESP32

* Supports telemetry from a physical ESP32 edge node through **Supabase Realtime**
* Supports PIR motion detection, temperature, humidity, LCD status, LED state, and buzzer state
* Automatically falls back to simulated sensor values when live Supabase credentials are unavailable
* Supports switching between **Live Mode** and **Simulated Mode**

### 🌧️ Flood Risk Engine

* Rule-based `FloodRiskContext` calculates flood risk using:

  * Rainfall intensity
  * Sustained rainfall duration
  * Low-lying zone elevation
  * Citizen waterlogging reports
* Citizen waterlogging reports contribute to the risk signal through signal fusion
* Risk information is reflected in dashboard alerts and IoT indicator states

### ☁️ Live Weather

* Integrates the **Open-Meteo API** for live weather conditions in Thiruvananthapuram
* No API key is required
* Refreshes weather information periodically
* Displays:

  * Temperature
  * Wind speed
  * Rainfall
  * Weather description
* Weather information contributes to the dashboard's risk analysis

### 📈 Historical Trend Analysis

* Maintains a rolling 20-point data buffer
* Updates trend information every 3 seconds when enabled
* Visualizes:

  * City Health Score
  * Flood Score
* Uses linear regression on trend data to estimate when flood-risk thresholds may be reached

### 🚨 SMS Alerts

* Express.js backend exposes `/api/send-sms`
* Uses **Twilio** for SMS alert delivery
* Automatically triggers a critical SMS alert when flood risk transitions from a non-HIGH state to HIGH
* Falls back to simulated/logged alert dispatch when Twilio credentials are not configured

### 👁️ Dual View Modes

#### Citizen View

Provides simplified city information, risk indicators, and public-facing advisories.

#### Control Room View

Provides additional operational information, including:

* ML Risk Card
* IoT Sensor Panel
* Detailed city metrics
* Risk information
* Alerts and system status

### 🌐 Bilingual Support

* Full English and Malayalam interface support
* Uses `LanguageContext` and `src/data/translations.ts`
* Language can be switched at runtime

### 📢 Citizen Report System

* Residents can submit geolocated reports
* Supported issue types include:

  * Waterlogging
  * Traffic congestion
  * Other incidents
* Citizen reports are incorporated into the live advisory feed
* Waterlogging reports contribute to flood-risk signal fusion

### 🎬 Guided Demo Mode

* Automatically cycles through predefined city scenarios
* Provides step-by-step visual overlays
* Designed for presentations, demonstrations, and competition evaluation

### 📴 Offline Mode

* `useOfflineStatus` detects network connectivity changes
* Displays an offline status banner
* Shows the timestamp of the last known data when connectivity is unavailable

### 📲 PWA Support

* Configured as a Progressive Web App using `vite-plugin-pwa`
* Supports installation on compatible mobile and desktop devices
* Application name: **CityPulse**

---

## 🏗️ Project Architecture

```text
project/
├── src/
│   ├── components/              # Dashboard and UI components
│   ├── hooks/                   # Weather, telemetry, routing and application hooks
│   ├── context/                # Risk, language and view-mode state
│   ├── lib/                     # ML model and Supabase integration
│   └── data/                    # Scenarios and translations
│
├── scripts/
│   ├── train_rf_model.py        # Random Forest training script
│   └── train_rf_model.js        # Model training helper
│
├── supabase/
│   ├── config.toml
│   ├── functions/               # Supabase edge functions
│   ├── migrations/              # Database migrations
│   └── esp32_telemetry_example.ino
│
├── server.js                    # Express.js SMS backend
├── vite.config.ts               # Vite and PWA configuration
├── package.json
└── .env.example                 # Environment variable template
```

### Key Application Modules

| Module                     | Purpose                                                   |
| -------------------------- | --------------------------------------------------------- |
| `CityMap.tsx`              | Interactive map, zones, flood overlays and route guidance |
| `IoTSensorPanel.tsx`       | ESP32 telemetry display                                   |
| `MLRiskCard.tsx`           | Random Forest risk prediction display                     |
| `MetricCardView.tsx`       | City condition metrics                                    |
| `AdvisoryPanel.tsx`        | Alerts and SMS status                                     |
| `ScenarioSimulator.tsx`    | Scenario selection and simulation                         |
| `ZoneDetail.tsx`           | Zone-level information                                    |
| `HistoricalTrendChart.tsx` | Historical risk visualization                             |
| `CitizenReportModal.tsx`   | Citizen incident reporting                                |
| `FloodRiskContext.tsx`     | Rule-based flood risk engine                              |
| `useTelemetry.ts`          | Supabase Realtime telemetry subscription                  |
| `useWeather.ts`            | Open-Meteo weather integration                            |
| `useFloodForecast.ts`      | Flood trend forecasting                                   |
| `useRouteGuidance.ts`      | OSRM route guidance                                       |

---

## 🚀 Getting Started

### Prerequisites

* Node.js 18+
* npm
* Python 3 — only required if retraining the ML model

### Installation

```bash
git clone https://github.com/lekshmi-kr/City_Pulse.git
cd City_Pulse
npm install
```

### Environment Variables

Create a `.env` file in the project root:

```env
# Supabase — required for live IoT hardware mode
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key

# Twilio — required only for real SMS alerts
TWILIO_ACCOUNT_SID=your-account-sid
TWILIO_AUTH_TOKEN=your-auth-token
TWILIO_PHONE_NUMBER=your-twilio-number
TO_PHONE_NUMBER=your-recipient-number
```

> **Simulated Mode:** If Supabase credentials are not configured, the dashboard can run using simulated sensor values.
>
> **SMS Simulation:** If Twilio credentials are not configured, SMS alerts are simulated/logged rather than sent.

### Running the Application

#### Frontend

```bash
npm run dev
```

The Vite development server runs at:

```text
http://localhost:5173
```

#### SMS Backend

In a separate terminal:

```bash
node server.js
```

The Express.js backend runs at:

```text
http://localhost:3001
```

Both servers should be running for complete SMS alert functionality.

### Other Scripts

```bash
npm run build       # Create production build
npm run preview     # Preview production build
npm run lint        # Run ESLint
npm run typecheck   # Run TypeScript type checking
```

---

## 🌍 City Scenarios

The dashboard includes three predefined city scenarios stored in `src/data/scenarios.ts`.

| Scenario               | Health Score | Description                                       |
| ---------------------- | -----------: | ------------------------------------------------- |
| **Normal Day**         |       85/100 | Baseline city conditions                          |
| **Heavy Monsoon Rain** |       48/100 | Sustained heavy rainfall and increased flood risk |
| **Evening Rush Hour**  |       62/100 | Increased traffic and pedestrian activity         |

Each scenario configures city conditions such as:

* Crowd density
* Traffic flow
* Weather conditions
* IoT sensor simulation values
* Advisory messages
* Flood-risk parameters

The monitored zones include:

* Statue / East Fort
* Thampanoor
* Kowdiar
* Palayam

---

## 🧠 ML Model Details

The Random Forest classifier uses **five input features**:

| Feature                        | Source                       |
| ------------------------------ | ---------------------------- |
| Precipitation Rate (mm/hr)     | Scenario data / live weather |
| Traffic Gridlock Density (%)   | Scenario data                |
| Crowd Footfall Activity (%)    | Scenario data                |
| Sustained Rain Duration (mins) | Scenario parameters          |
| Low-Lying Zone Elevation Flag  | Zone metadata                |

The model is trained using **scikit-learn** through:

```text
scripts/train_rf_model.py
```

The trained model information is serialized to:

```text
src/lib/trainedModelData.json
```

The dashboard uses the serialized model data for client-side inference and displays:

* Predicted risk level
* Confidence percentage
* Per-tree voting information
* Feature importances

This provides an interpretable view of the model's risk prediction.

---

## 📡 IoT Hardware Setup (ESP32)

The dashboard supports an ESP32 edge node that pushes telemetry to a Supabase `iot_telemetry` table.

### Telemetry Schema

```sql
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

The dashboard subscribes to `INSERT` events on the telemetry table using **Supabase Realtime**.

An example ESP32 firmware sketch is available at:

```text
supabase/esp32_telemetry_example.ino
```

The hardware integration can provide:

* PIR motion detection
* Temperature
* Humidity
* LCD status
* LED status
* Buzzer status

The system can also operate in **Simulated Mode** when physical hardware is unavailable.

---

## 🛠️ Tech Stack

| Layer               | Technology            |
| ------------------- | --------------------- |
| Frontend            | React 18 + TypeScript |
| Build Tool          | Vite 5                |
| Styling             | Tailwind CSS 3        |
| Maps                | Leaflet.js            |
| Charts              | Recharts              |
| Icons               | Lucide React          |
| Backend             | Express.js 5          |
| Database / Realtime | Supabase              |
| Machine Learning    | Python + scikit-learn |
| ML Model            | Random Forest         |
| Weather API         | Open-Meteo            |
| Routing API         | OSRM Public Demo API  |
| IoT                 | ESP32                 |
| SMS Alerts          | Twilio                |
| PWA                 | vite-plugin-pwa       |

---

## 🤝 Contributing

This project was developed as a Digital Twin competition prototype. Contributions and improvements are welcome.

1. Fork the repository
2. Create a feature branch:

```bash
git checkout -b feature/your-feature
```

3. Commit your changes:

```bash
git commit -m "Add your feature"
```

4. Push the branch:

```bash
git push origin feature/your-feature
```

5. Open a Pull Request

Before submitting a Pull Request, please run:

```bash
npm run lint
npm run typecheck
```

---

## 📜 License

This project is currently not released under an open-source license.

All rights reserved by the project authors.

---
