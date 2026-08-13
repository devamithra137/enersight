# Enersight ⚡

**Enersight** is a full-stack energy optimization platform designed to help users monitor, analyze, and optimize their energy consumption. The platform provides an interactive dashboard for tracking energy usage, identifying consumption patterns, receiving optimization recommendations, and monitoring important energy-related alerts.

The application combines a modern web interface with a backend API to provide a centralized platform for energy monitoring and intelligent decision-making.

---

## Features

### Energy Dashboard

* Monitor overall energy consumption
* View key energy performance indicators
* Track consumption trends
* Visualize energy usage through interactive charts
* View peak usage information
* Get a quick overview of energy performance

### Energy Analysis

* Analyze historical energy consumption
* Identify usage patterns
* Compare energy usage across different periods
* Visualize consumption trends
* Generate meaningful insights from energy data

### Alerts & Notifications

* Monitor important energy-related events
* Display energy alerts through the dashboard
* Provide users with information about unusual or significant consumption
* Organize alerts for easier monitoring

### Energy Recommendations

* Provide energy-saving recommendations
* Identify potential areas for optimization
* Help users make better energy consumption decisions
* Present recommendations through a dedicated interface

### Trends & Insights

* View historical energy trends
* Identify changes in consumption
* Present energy-related insights visually
* Help users understand their consumption behavior

### Real-Time Data

* Support real-time energy data updates
* Maintain synchronized energy information
* Provide updated dashboard information without requiring constant manual refreshes

### Settings

* Dedicated settings interface
* Application configuration options
* User-oriented dashboard controls

### Responsive Interface

* Responsive dashboard design
* Reusable UI components
* Mobile-friendly layouts
* Consistent application styling

---

## Project Architecture

Enersight follows a full-stack architecture consisting of a frontend application and a backend API.

```text
                         ┌──────────────────────┐
                         │       Enersight      │
                         │   Energy Optimization│
                         └──────────┬───────────┘
                                    │
                    ┌───────────────┴───────────────┐
                    │                               │
             ┌──────▼──────┐                 ┌──────▼──────┐
             │   Frontend  │                 │   Backend   │
             │   Next.js   │◄────── API ────►│ Node.js /   │
             │ React / TS  │                 │  Express.js │
             └──────┬──────┘                 └──────┬──────┘
                    │                               │
                    │                               │
             ┌──────▼──────────┐            ┌───────▼────────┐
             │ Dashboard/UI    │            │ Controllers    │
             │ Components      │            │ Business Logic │
             │ Charts          │            │ APIs           │
             │ Alerts          │            │ Data Processing│
             └─────────────────┘            └────────────────┘
```

---

## Project Structure

```text
enersight/
│
├── backend/
│   │
│   ├── controllers/
│   │   ├── alertController.js
│   │   ├── analysisController.js
│   │   ├── energyController.js
│   │   └── recommendationController.js
│   │
│   ├── server.js
│   ├── package.json
│   ├── package-lock.json
│   └── README.md
│
├── frontend/
│   │
│   ├── app/
│   │   ├── (dashboard)/
│   │   │   ├── alerts/
│   │   │   ├── dashboard/
│   │   │   ├── insights/
│   │   │   ├── recommendations/
│   │   │   ├── settings/
│   │   │   └── trends/
│   │   │
│   │   ├── globals.css
│   │   ├── layout.tsx
│   │   └── page.tsx
│   │
│   ├── components/
│   │   ├── alerts/
│   │   ├── dashboard/
│   │   ├── layout/
│   │   ├── trends/
│   │   └── ui/
│   │
│   ├── hooks/
│   │   ├── use-energy-data.ts
│   │   ├── use-mobile.ts
│   │   └── use-socket.ts
│   │
│   ├── public/
│   ├── styles/
│   ├── package.json
│   ├── next.config.mjs
│   ├── tsconfig.json
│   └── components.json
│
├── .gitignore
└── README.md
```

---

# Technology Stack

## Frontend

| Technology       | Purpose                       |
| ---------------- | ----------------------------- |
| **Next.js**      | Frontend framework            |
| **React**        | Component-based UI            |
| **TypeScript**   | Type-safe development         |
| **Tailwind CSS** | Styling and responsive design |
| **CSS**          | Global application styling    |

The frontend contains the dashboard, analytics pages, alerts, recommendations, trends, settings, reusable UI components, and client-side data hooks.

---

## Backend

| Technology     | Purpose                        |
| -------------- | ------------------------------ |
| **Node.js**    | Backend runtime                |
| **Express.js** | REST API framework             |
| **JavaScript** | Backend development            |
| **REST API**   | Frontend-backend communication |

The backend is organized around controllers responsible for energy data, analysis, alerts, and recommendations.

---

# Main Modules

## 1. Dashboard

The dashboard acts as the central interface of Enersight.

It provides:

* Energy consumption overview
* KPI cards
* Usage summaries
* Energy trends
* Peak usage information
* Alerts
* Recommendations

---

## 2. Energy Management

The energy module handles energy-related data and provides the information required by the dashboard and analysis features.

The system can be extended to support:

* Daily consumption
* Weekly consumption
* Monthly consumption
* Peak demand
* Energy efficiency metrics
* Historical usage

---

## 3. Analysis

The analysis module processes energy information to identify meaningful consumption patterns.

It can be used to determine:

* High-consumption periods
* Usage trends
* Consumption changes
* Potential optimization opportunities

---

## 4. Alerts

The alert module provides users with important energy-related notifications.

Examples include:

* Unusual energy consumption
* High usage periods
* Threshold-based warnings
* Energy efficiency alerts

---

## 5. Recommendations

The recommendation module provides suggestions intended to help reduce unnecessary energy consumption.

Recommendations can be based on:

* Consumption patterns
* Peak usage
* Historical data
* Energy efficiency indicators

---

## 6. Trends

The trends module presents energy consumption over time.

Users can use the visualizations to understand:

* Increasing consumption
* Decreasing consumption
* Repeated usage patterns
* Peak periods
* Historical changes

---

# 🔄 Application Flow

```text
User
  │
  ▼
Enersight Dashboard
  │
  ├──────────────► Energy Data
  │
  ├──────────────► Analysis
  │
  ├──────────────► Trends
  │
  ├──────────────► Alerts
  │
  └──────────────► Recommendations
                         │
                         ▼
                  Optimization
                    Decisions
```

---

# ⚙️ Getting Started

## Prerequisites

Make sure the following are installed:

* Node.js
* npm
* Git

You can verify Node.js and npm using:

```bash
node --version
npm --version
```

---

# 📥 Installation

Clone the repository:

```bash
git clone https://github.com/devamithra137/enersight.git
```

Navigate into the project:

```bash
cd enersight
```

---

# 🔧 Backend Setup

Navigate to the backend:

```bash
cd backend
```

Install dependencies:

```bash
npm install
```

Create your environment configuration if required:

```text
.env
```

Add the required environment variables according to the backend configuration.

Start the backend:

```bash
npm start
```

---

# 🎨 Frontend Setup

Open another terminal and navigate to the frontend:

```bash
cd frontend
```

Install dependencies:

```bash
npm install
```

Start the development server:

```bash
npm run dev
```

The frontend can then be accessed through the local development URL displayed by Next.js.

---

# 🔐 Environment Variables

Environment variables should **never be committed to GitHub**.

Store sensitive configuration in `.env` files.

Typical configuration may include:

```env
API_URL=your_api_url
DATABASE_URL=your_database_url
```

> The exact environment variables depend on the current backend configuration.

---

# 🧪 Development

During development, the project can be run using two terminals.

### Terminal 1 — Backend

```bash
cd backend
npm install
npm start
```

### Terminal 2 — Frontend

```bash
cd frontend
npm install
npm run dev
```

---

# 📡 API Architecture

The backend follows a controller-based architecture.

```text
Frontend
   │
   ▼
API Request
   │
   ▼
Express Server
   │
   ▼
Controller
   │
   ├── Energy Controller
   ├── Analysis Controller
   ├── Alert Controller
   └── Recommendation Controller
   │
   ▼
Response
   │
   ▼
Frontend Dashboard
```

This structure keeps API responsibilities separated and makes the backend easier to maintain and extend.

---

# 🧩 Reusable Components

The frontend uses reusable components to maintain consistency across the application.

Major component groups include:

* Dashboard components
* Alert components
* Trend components
* Layout components
* UI components
* Navigation components
* Charts
* Cards
* Forms
* Tables
* Dialogs
* Notifications

This component-based structure makes it easier to add new features without duplicating UI logic.

---

# 📈 Future Improvements

Potential future enhancements include:

* Machine-learning-based energy consumption prediction
* Automated energy optimization
* Advanced anomaly detection
* Smart device integration
* IoT-based energy monitoring
* Real-time energy meter integration
* Advanced analytics
* Personalized energy-saving recommendations
* Role-based authentication
* Historical data export
* Energy cost prediction
* Carbon-emission tracking
* Cloud deployment
* Automated testing
* CI/CD integration

---

# 🔒 Security Considerations

The application should follow standard security practices, including:

* Keeping API keys and credentials outside source control
* Using environment variables for sensitive configuration
* Validating API input
* Handling authentication securely
* Protecting backend endpoints
* Avoiding sensitive information in logs

---

# 🤝 Contributing

Contributions and improvements are welcome.

To contribute:

```bash
git checkout -b feature/your-feature
```

Make your changes, test them, and commit:

```bash
git add .
git commit -m "Add your feature"
```

Push your branch:

```bash
git push origin feature/your-feature
```

Then open a Pull Request.

---

# License

This project is currently maintained as a software development project for educational and demonstration purposes.

---

# Project

**Enersight — Energy Optimization Platform**

A full-stack application focused on helping users monitor energy consumption, understand usage patterns, identify optimization opportunities, and make more energy-efficient decisions.
