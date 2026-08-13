# EnerSight — Intelligent Energy Consumption Monitoring System

Real-time backend built with **Node.js · Express · MongoDB Atlas · Socket.IO**.
Every insight, alert, and recommendation is computed dynamically from stored data — zero hardcoded outputs.

---

## Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Configure environment
cp .env.example .env
# → Set MONGODB_URI to your Atlas connection string

# 3. Start the server
npm run dev          # nodemon (development)
npm start            # node   (production)
```

Server runs on **http://localhost:5000** by default.

---

## Environment Variables

| Variable | Default | Description |
|---|---|---|
| `MONGODB_URI` | — | **Required.** Atlas connection string |
| `PORT` | `5000` | HTTP / WS port |
| `COST_RATE` | `8` | ₹ per kWh |
| `CARBON_FACTOR` | `0.82` | kg CO₂ per kWh |
| `ANOMALY_STD_MULTIPLIER` | `2` | Std-dev multiplier for spike detection |
| `ANOMALY_CONSECUTIVE_THRESHOLD` | `3` | Consecutive spikes for "sustained" alert |
| `ENABLE_SIMULATOR` | `true` | Set `false` to disable background data generator |

---

## Project Structure

```
enersight/
├── server.js                     # Entry point
├── models/
│   └── EnergyData.js             # Mongoose schema + indexes
├── services/
│   ├── aggregationService.js     # Trends, peak, category, impact
│   ├── anomalyService.js         # Statistical anomaly detection
│   ├── insightService.js         # Week-over-week insights
│   └── recommendationService.js  # Peak-based savings recommendations
├── controllers/
│   └── energyController.js       # HTTP request handlers
├── routes/
│   └── energy.js                 # Express router
├── sockets/
│   └── socketHandler.js          # Socket.IO setup + emit helpers
└── utils/
    └── simulator.js              # Background real-time data generator
```

---

## REST API Reference

### POST `/api/energy`
Ingest a single energy reading.

**Request body:**
```json
{
  "units": 1.25,
  "category": "AC",
  "deviceId": "dev-001",
  "timestamp": "2024-06-01T14:00:00Z"
}
```

**Response `201`:**
```json
{
  "success": true,
  "data": {
    "_id": "665c...",
    "timestamp": "2024-06-01T14:00:00.000Z",
    "units": 1.25,
    "category": "AC",
    "deviceId": "dev-001"
  }
}
```

---

### GET `/api/energy/trends?range=daily|weekly|monthly`

**Response:**
```json
{
  "success": true,
  "range": "weekly",
  "groupedBy": "day",
  "data": [
    { "period": "2024-05-26", "totalUnits": 48.32, "readingCount": 120 },
    { "period": "2024-05-27", "totalUnits": 51.07, "readingCount": 134 }
  ]
}
```

---

### GET `/api/energy/peak`

**Response:**
```json
{
  "success": true,
  "data": {
    "peakHour": { "start": "14:00", "end": "15:00", "hourIndex": 14 },
    "peakUnits": 92.451,
    "percentageOfTotal": 18.34,
    "grandTotalUnits": 504.12,
    "allHourlyBreakdown": [
      { "hour": "14:00", "totalUnits": 92.451, "percentage": 18.34 },
      { "hour": "13:00", "totalUnits": 78.102, "percentage": 15.49 }
    ]
  }
}
```

---

### GET `/api/energy/category`

**Response:**
```json
{
  "success": true,
  "data": {
    "grandTotal": 504.12,
    "categories": [
      { "category": "AC",         "totalUnits": 189.3,  "percentageShare": 37.55, "readingCount": 410 },
      { "category": "HVAC",       "totalUnits": 142.8,  "percentageShare": 28.32, "readingCount": 390 },
      { "category": "Appliances", "totalUnits": 96.4,   "percentageShare": 19.12, "readingCount": 380 }
    ]
  }
}
```

---

### GET `/api/energy/impact`

**Response:**
```json
{
  "success": true,
  "data": {
    "summary": {
      "totalUnits": 504.12,
      "totalCost": 4032.96,
      "totalCarbonKg": 413.38,
      "costRate": 8,
      "carbonFactor": 0.82
    },
    "perDayBreakdown": [
      { "date": "2024-05-26", "units": 48.32, "cost": 386.56, "carbonKg": 39.62 },
      { "date": "2024-05-27", "units": 51.07, "cost": 408.56, "carbonKg": 41.88 }
    ]
  }
}
```

---

### GET `/api/energy/alerts`

**Response:**
```json
{
  "success": true,
  "data": {
    "alerts": [
      {
        "type": "spike",
        "severity": "warning",
        "message": "Unusual spike detected: 4.812 kWh recorded (threshold: 2.341 kWh)",
        "reading": {
          "timestamp": "2024-06-01T14:32:00.000Z",
          "units": 4.812,
          "category": "AC"
        },
        "deviationsAboveMean": 2.84
      },
      {
        "type": "sustained",
        "severity": "critical",
        "message": "Continuous high usage detected: 3 consecutive readings above threshold",
        "streakStartedAt": "2024-06-01T14:30:00.000Z",
        "streakEndedAt": "2024-06-01T14:32:00.000Z",
        "streakLength": 3,
        "averageUnitsInStreak": 4.203
      }
    ],
    "totalAnomalies": 5,
    "sustainedEvents": 1,
    "stats": {
      "mean": 0.3812,
      "stddev": 0.4821,
      "threshold": 1.3454,
      "stdMultiplierUsed": 2,
      "totalReadingsAnalysed": 1240
    }
  }
}
```

---

### GET `/api/energy/insights`

**Response:**
```json
{
  "success": true,
  "data": {
    "insights": [
      {
        "type": "increase",
        "value": 18.4,
        "unit": "%",
        "message": "Energy usage increased by 18.4% compared to the previous week",
        "metadata": {
          "currentWeekUnits": 312.5,
          "previousWeekUnits": 263.9,
          "currentWeekReadings": 840
        }
      },
      {
        "type": "top_category",
        "value": 37.2,
        "unit": "%",
        "message": "AC is the highest consuming category, accounting for 37.2% of this week's usage",
        "metadata": { "category": "AC", "units": 116.25, "weeklyShare": 37.2 }
      },
      {
        "type": "peak_contribution",
        "value": 19.1,
        "unit": "%",
        "message": "Peak hour (14:00–15:00) contributes 19.1% of weekly energy usage",
        "metadata": { "peakHour": 14, "peakUnits": 59.69, "weeklyShare": 19.1 }
      },
      {
        "type": "average_daily",
        "value": 44.64,
        "unit": "kWh",
        "message": "Average daily energy consumption this week is 44.64 kWh across 7 day(s)",
        "metadata": { "avgDailyUnits": 44.64, "daysWithData": 7 }
      }
    ],
    "generatedAt": "2024-06-01T18:00:00.000Z"
  }
}
```

---

### GET `/api/energy/recommendations`

**Response:**
```json
{
  "success": true,
  "data": {
    "recommendations": [
      {
        "id": "shift_peak_load",
        "priority": "high",
        "title": "Shift high-demand appliances away from peak hours",
        "recommendation": "Usage peaks between 14:00–15:00. Consider scheduling high-draw appliances to off-peak hours.",
        "reasoning": "This hour contributes 19.1% of total consumption. Shifting 30% of peak load could save ₹241.34 monthly.",
        "estimatedMonthlySavings": { "units": 27.81, "cost": 241.34, "currency": "INR" },
        "dataContext": {
          "peakHour": "14:00–15:00",
          "peakUnitsLast30Days": 92.71,
          "peakCostLast30Days": 804.48,
          "avgDailyPeakUnits": 3.09
        }
      }
    ],
    "basedOn": {
      "peakHour": "14:00–15:00",
      "peakPercentOfTotal": 19.1,
      "dataWindowDays": 30
    },
    "generatedAt": "2024-06-01T18:00:00.000Z"
  }
}
```

---

## WebSocket Events

Connect via any Socket.IO client to `ws://localhost:5000`.

| Event | Direction | Payload |
|---|---|---|
| `connected` | Server → Client | `{ message, socketId, timestamp }` |
| `energy:update` | Server → Client | `{ event, data: EnergyData, timestamp }` |
| `energy:alert` | Server → Client | `{ event, type, severity, message, reading, stats, timestamp }` |
| `subscribe:device` | Client → Server | `deviceId` (string) |
| `request:anomaly_scan` | Client → Server | — |
| `anomaly:scan_result` | Server → Client | Full anomaly detection result |

### Example client (browser)
```javascript
import { io } from "socket.io-client";

const socket = io("http://localhost:5000");

socket.on("energy:update", ({ data }) => {
  console.log(`New reading: ${data.units} kWh (${data.category})`);
});

socket.on("energy:alert", (alert) => {
  console.warn(`ALERT [${alert.severity}]: ${alert.message}`);
});

// Subscribe to a specific device
socket.emit("subscribe:device", "dev-001");
```

---

## MongoDB Indexes

| Collection | Index | Purpose |
|---|---|---|
| `energydatas` | `{ timestamp: -1 }` | Fast time-range queries |
| `energydatas` | `{ category: 1, timestamp: -1 }` | Category + time filters |
| `energydatas` | `{ deviceId: 1, timestamp: -1 }` | Per-device queries |
