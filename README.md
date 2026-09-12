

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
* [Data Sources and Operating Modes](#-data-sources-and-operating-modes)
* [Project Architecture](#️-project-architecture)
* [Getting Started](#-getting-started)
* [City Scenarios](#-city-scenarios)
* [ML Model Details](#-ml-model-details)
* [IoT Hardware Setup](#-iot-hardware-setup-esp32)
* [Tech Stack](#️-tech-stack)
* [License](#-license)

---

## 📋 Overview

**Trivandrum City Pulse** is a React + TypeScript web application designed as a smart-city digital twin dashboard for **Thiruvananthapuram, Kerala**.

The platform combines interactive geospatial visualization, live weather information, optional ESP32 telemetry, machine-learning-based flood-risk prediction, simulated urban scenarios, and citizen-generated reports.

The system provides two interface modes:

* **Citizen View** — simplified public-facing city information, risk indicators, and advisories.
* **Control Room View** — detailed operational information, ML predictions, IoT telemetry, alerts, and city metrics.

The project is designed to demonstrate how multiple urban data sources can be brought together into a single digital-twin-style decision-support platform.

---

## ✨ Features

### 🗺️ Interactive City Map

* Leaflet-based interactive map centered on Thiruvananthapuram.
* Clickable city zones and location markers.
* Visualization of selected flood-prone waterways and drainage areas:

  * Killi River
  * Karamana River
  * Parvathy Puthanar Canal
  * Amayizhanchan Canal
  * Kannammoola Drain
* Citizen-reported incidents can be displayed as map markers.
  <img width="1633" height="617" alt="Screenshot 2026-09-11 212418" src="https://github.com/user-attachments/assets/d7bfb3dd-8281-4bfd-9289-93fa2ed41dde" />


### 🤖 ML Risk Prediction

* Uses a **10-tree Random Forest classifier** trained with city scenario data.
* Serialized model data is stored in `src/lib/trainedModelData.json`.
* Uses five risk-related input features:

  * Precipitation rate
  * Traffic density
  * Crowd footfall
  * Sustained rainfall duration
  * Low-lying zone elevation flag
* Produces:

  * **LOW**
  * **MEDIUM**
  * **HIGH**
* Displays prediction confidence, per-tree voting information, and feature importance.
* Feature importance values are derived from the trained scikit-learn model.
* Integrated into the Control Room View through the `MLRiskCard` component.

> **Important:** ML predictions are based on the available scenario/live input values. The model does not directly measure rainfall, traffic, or elevation using the ESP32 hardware.

### 📡 IoT Hardware Integration — ESP32

* Supports an ESP32 edge node connected through **Supabase Realtime**.
* Supports:

  * IR detection
  * Temperature
  * Humidity
  * LCD status
  * LED state
  * Buzzer state
* Supports **Live Mode** when connected to Supabase telemetry.
* Supports **Simulated Mode** when physical hardware or live credentials are unavailable.

The ESP32 provides edge telemetry for demonstration and monitoring. It does **not** directly measure city-wide traffic, rainfall, flood depth, or road conditions.

### 🌧️ Flood Risk Engine

The rule-based `FloodRiskContext` combines available signals including:

* Rainfall intensity
* Sustained rainfall duration
* Low-lying zone information
* Citizen waterlogging reports

Citizen reports can contribute additional evidence to the flood-risk signal.

Risk information is reflected through dashboard indicators, alerts, and IoT status outputs.

### ☁️ Live Weather

* Integrates the **Open-Meteo API** for current weather information in Thiruvananthapuram.
* Does not require an API key.
* Weather data is refreshed periodically.
* Displays:

  * Temperature
  * Wind speed
  * Rainfall
  * Weather description

> **Data distinction:** Weather values obtained from Open-Meteo are live external data. They are separate from ESP32 telemetry and from predefined simulation scenarios.

### 📈 Historical Trend Analysis

* Maintains a rolling 20-point data buffer.
* Updates trend information periodically when enabled.
* Visualizes:

  * City Health Score
  * Flood Score
* Uses trend analysis to estimate potential movement toward flood-risk thresholds.

### 🚨 SMS Alerts

* Express.js backend exposes `/api/send-sms`.
* Uses **Twilio** for real SMS delivery when configured.
* Can trigger a critical SMS when flood risk transitions from a non-HIGH state to HIGH.
* When Twilio credentials are unavailable, alert delivery is simulated/logged instead of sending a real SMS.

### 👁️ Dual View Modes

#### Citizen View

Provides:

* City condition overview
* Risk indicators
* Public-facing advisories
* Citizen-oriented information

#### Control Room View

Provides additional operational information:

* ML Risk Card
* IoT Sensor Panel
* Detailed city metrics
* Risk information
* Alerts
* System status

### 🌐 Bilingual Support

* Supports English and Malayalam.
* Uses `LanguageContext` and `src/data/translations.ts`.
* Language can be changed during runtime.

### 📢 Citizen Report System

Residents can submit geolocated reports for issues such as:

* Waterlogging
* Traffic congestion
* Other incidents

Citizen reports can appear in the advisory feed and map and can contribute to the flood-risk signal when waterlogging is reported.

### 🎬 Guided Demo Mode

* Cycles through predefined city scenarios.
* Provides step-by-step visual overlays.
* Designed for project demonstrations, presentations, and competition evaluation.

### 📴 Offline Status

* Detects network connectivity changes through `useOfflineStatus`.
* Displays an offline status indicator.
* Shows the last known data timestamp when connectivity is unavailable.

### 📲 Progressive Web App

* Configured as a Progressive Web App using `vite-plugin-pwa`.
* Supports installation on compatible desktop and mobile devices.
* Application name: **CityPulse**.

---

## 🔄 Data Sources and Operating Modes

The dashboard combines several types of information. Each source has a different role in the digital twin.

| Data Source             | Type                  | Purpose                                                |
| ----------------------- | --------------------- | ------------------------------------------------------ |
| **Open-Meteo**          | Live external data    | Weather and rainfall information                       |
| **ESP32 + IR Sensor**   | Live IoT telemetry    | Local movement/environment telemetry                   |
| **Scenario Simulator**  | Simulated data        | Demonstrates different city conditions                 |
| **Citizen Reports**     | User-generated data   | Reports incidents such as waterlogging and congestion  |
| **Zone Metadata**       | Static/reference data | Zone characteristics such as low-lying areas           |
| **Random Forest Model** | ML prediction         | Predicts LOW/MEDIUM/HIGH risk from available inputs    |
| **Flood Risk Engine**   | Rule-based analysis   | Combines selected signals into a flood-risk assessment |

### Operating Modes

#### 🟢 Live Mode

Uses available live data such as:

* Open-Meteo weather information
* ESP32 telemetry through Supabase Realtime
* Citizen reports

#### 🟡 Simulated Mode

Used when physical IoT hardware or live telemetry is unavailable.

The system generates predefined or simulated sensor/city conditions to demonstrate how the dashboard responds to different scenarios.

#### 🔵 Scenario Mode

Provides predefined conditions such as:

* Normal Day
* Heavy Monsoon Rain
* Evening Rush Hour

> **Note:** Simulated and scenario values are demonstration inputs. They should not be interpreted as real-time measurements of the entire city.

---

## 🏗️ Project Architecture

```text
project/
├── src/
│   ├── components/              # Dashboard and UI components
│   ├── hooks/                   # Weather, telemetry and application hooks
│   ├── context/                 # Risk, language and view-mode state
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

| Module                     | Purpose                                  |
| -------------------------- | ---------------------------------------- |
| `CityMap.tsx`              | Interactive city map and flood overlays  |
| `IoTSensorPanel.tsx`       | ESP32 telemetry display                  |
| `MLRiskCard.tsx`           | Random Forest risk prediction display    |
| `MetricCardView.tsx`       | City condition metrics                   |
| `AdvisoryPanel.tsx`        | Alerts and SMS status                    |
| `ScenarioSimulator.tsx`    | Scenario selection and simulation        |
| `ZoneDetail.tsx`           | Zone-level information                   |
| `HistoricalTrendChart.tsx` | Historical risk visualization            |
| `CitizenReportModal.tsx`   | Citizen incident reporting               |
| `FloodRiskContext.tsx`     | Rule-based flood-risk engine             |
| `useTelemetry.ts`          | Supabase Realtime telemetry subscription |
| `useWeather.ts`            | Open-Meteo weather integration           |
| `useFloodForecast.ts`      | Flood trend forecasting                  |

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

> **Simulated Mode:** If Supabase credentials are not configured, the dashboard can operate using simulated sensor values.

> **SMS Simulation:** If Twilio credentials are not configured, SMS alerts are logged/simulated instead of being sent through Twilio.

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

The Express backend runs at:

```text
http://localhost:3001
```

Both servers are required for complete SMS alert functionality.

### Available Scripts

```bash
npm run dev        # Start the development server
npm run build      # Create a production build
npm run preview    # Preview the production build
npm run lint       # Run ESLint
npm run typecheck  # Run TypeScript type checking
```

---

## 🌍 City Scenarios

The dashboard includes three predefined scenarios stored in:

```text
src/data/scenarios.ts
```

| Scenario               | Health Score | Description                                       |
| ---------------------- | -----------: | ------------------------------------------------- |
| **Normal Day**         |       85/100 | Baseline city conditions                          |
| **Heavy Monsoon Rain** |       48/100 | Sustained heavy rainfall and increased flood risk |
| **Evening Rush Hour**  |       62/100 | Increased traffic and pedestrian activity         |

Each scenario can configure demonstration inputs such as:

* Crowd density
* Traffic flow
* Weather conditions
* Simulated IoT values
* Advisory messages
* Flood-risk parameters

### Monitored Zones

* Statue / East Fort
* Thampanoor
* Kowdiar
* Palayam

> Scenario values are predefined demonstration conditions and are not claimed to represent live measurements of these locations.

---

## 🧠 ML Model Details

The project uses a **10-tree Random Forest classifier** trained with scikit-learn.

### Input Features

| Feature                        | Source                       |
| ------------------------------ | ---------------------------- |
| Precipitation Rate (mm/hr)     | Live weather / scenario data |
| Traffic Gridlock Density (%)   | Scenario or application data |
| Crowd Footfall Activity (%)    | Scenario or application data |
| Sustained Rain Duration (mins) | Scenario parameters          |
| Low-Lying Zone Elevation Flag  | Zone metadata                |

The training script is located at:

```text
scripts/train_rf_model.py
```

Serialized model information is stored at:

```text
src/lib/trainedModelData.json
```

The application uses the serialized model data for client-side inference.

### Model Output

The model produces:

* **LOW** risk
* **MEDIUM** risk
* **HIGH** risk
* Confidence percentage
* Per-tree voting information
* Feature importance information

> **Important:** The Random Forest model provides a prediction based on the supplied input features. It is a decision-support component and should not be interpreted as an official flood warning system.

---

## 📡 IoT Hardware Setup — ESP32

The project supports an ESP32 edge node that sends telemetry to a Supabase `iot_telemetry` table.

### Telemetry Schema

```sql
id             uuid PRIMARY KEY
ir_detected    boolean
temp           numeric
humidity       numeric
lcd_text       text
led_state      text   -- 'green' | 'red'
buzzer_active  boolean
node_id        text   -- 'esp32-node-01'
created_at     timestamptz
```

The dashboard subscribes to telemetry `INSERT` events using **Supabase Realtime**.

Example firmware:

```text
supabase/esp32_telemetry_example.ino
```

### ESP32 Telemetry

The hardware can provide:

* IR detection
* Temperature
* Humidity
* LCD status
* LED status
* Buzzer status

The ESP32 acts as a **local edge telemetry node**. Its measurements are not treated as city-wide measurements.

When the hardware is unavailable, the application can use simulated telemetry.

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
| IoT Platform        | ESP32                 |
| IoT Sensor          | IR Sensor             |
| SMS Alerts          | Twilio                |
| PWA                 | vite-plugin-pwa       |

---

## 📜 License

This project is currently not released under an open-source license.

**All rights reserved by the project authors.**
