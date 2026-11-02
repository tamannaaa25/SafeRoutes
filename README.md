# SafeRoutes – Chandigarh Road Safety Analytics Platform

**SafeRoutes** is a clean, modern, professional analytics platform designed to monitor traffic crash patterns, hazardous blackspots, weather risks, and casualty severity across **Chandigarh, India**.

---

## 🌟 Modern Platform Architecture & Redesign

### 1. Dark-Neutral Left Sidebar Navigation
- **Branding & Logo**: SafeRoutes shield logo and platform subtitle.
- **Workspace Switcher**: Tagged with **"Chandigarh Road Safety"** (UT Jurisdiction).
- **Navigation Items**:
  - **Overview** (`LayoutDashboard`)
  - **Analytics** (`BarChart2`)
  - **Blackspots** (`AlertTriangle`)
  - **Crash Records** (`FileSpreadsheet`)
- **Status Indicator**: Live baseline status pill at the bottom.
- **Mobile Responsive**: Smooth off-canvas drawer overlay on screens < 1024px.

### 2. Compact Header / Action Bar
- **Left Side**:
  - Page title: **"Road Safety Overview"**
  - Subtitle: **"Chandigarh Accident Analytics"**
  - Live filtered record counter badge (`X of Y records`).
- **Right Side**:
  - **Severity Filter**: Dropdown filter (*All, Minor, Moderate, Severe, Fatal*).
  - **Reset Filters**: One-click reset when filters are active.
  - **Export CSV Button**: Instantly compiles and downloads currently filtered accident records as a `.csv` file.

### 3. Dashboard Layout
- **Dataset Controls Bar**: Current dataset indicator, custom CSV uploader (PapaParse), and template download.
- **4 Overview KPI Cards**:
  - Total Accidents
  - Total Injuries
  - Total Fatalities
  - Top Accident Blackspot (*Hallomajra Light Point*)
- **Accident Analytics Grid (Recharts)**:
  - Accidents by Month (Bar Chart)
  - Accidents by Day of Week (Bar Chart)
  - Accidents by Weather Condition (Donut Chart)
  - Accident Severity Distribution (Donut Chart)
- **Priority Blackspots Section**: Dedicated ranking cards displaying Chandigarh's top 5 accident blackspots with casualty ratios and MoRTH risk tags.
- **Accident Records Log**: Searchable and paginated table with environmental and severity badges.
- **About Section**: Mission overview, CTP blackspots, and data integrity note.

---

## 🛠️ Technology Stack

- **React.js (v18)**: Component-based UI and reactive hooks.
- **Vite**: High-performance local development and build tooling.
- **Recharts**: Responsive SVG bar charts and donut charts.
- **PapaParse**: Client-side CSV parser and exporter (`Papa.unparse`).
- **Lucide React**: Clean vector iconography.
- **Custom CSS**: Dark-neutral sidebar (`#0f172a`), light dashboard background (`#f8fafc`), and blue accents (`#2563eb`).

---

## 📁 Project Structure

```
SafeRoutes/
├── public/
│   ├── sample_accidents.csv             # Baseline Chandigarh crash records template
│   └── shield.svg                       # Branding favicon
├── src/
│   ├── components/
│   │   ├── Sidebar.jsx                  # Dark-neutral sidebar with workspace switcher
│   │   ├── HeaderActionBar.jsx          # Action bar with date picker, filters & exports
│   │   ├── StatCards.jsx                # 4 KPI cards
│   │   ├── ChartsSection.jsx            # 4 Recharts visual plots
│   │   ├── BlackspotsSection.jsx        # Dedicated priority blackspot ranking cards
│   │   ├── AccidentTable.jsx            # Searchable & paginated records table
│   │   ├── CsvUploader.jsx              # Dataset status & PapaParse file uploader
│   │   └── AboutSection.jsx             # Platform mission & data integrity note
│   ├── data/
│   │   └── sampleAccidents.js           # Baseline Chandigarh demonstration dataset
│   ├── utils/
│   │   └── analytics.js                 # Pure JS metrics & CSV normalization engine
│   ├── App.jsx                          # Main layout, filter state & export handlers
│   ├── main.jsx                         # React entry point
│   └── index.css                        # Complete modern design system & print styles
├── index.html
├── package.json
└── vite.config.js
```

---

## 🚀 Getting Started

```bash
# 1. Install dependencies
npm install

# 2. Run local development server
npm run dev

# 3. Create production build
npm run build
```
