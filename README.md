# HarborPulse 🚢⚡

## AI-Powered Smart Harbor Coordination & Dock Intelligence Platform

### Built for **TechVerse’26** by **Team Neural Capitals**
🏆 Developed during a **24-Hour National Level Hackathon**

---

# 🌍 Theme
## **Smart Infrastructure & Sustainable Coastal Logistics**
HarborPulse addresses critical challenges in maritime infrastructure by leveraging intelligent scheduling, real-time monitoring, and AI-assisted coordination to modernize harbor operations and reduce economic losses caused by congestion and delays.

---

# 📌 Overview
HarborPulse is an AI-driven harbor management platform designed to optimize dock scheduling, vessel coordination, unloading operations, and real-time harbor traffic management during peak landing hours.

The system transforms traditional harbor operations into a digitally coordinated ecosystem capable of handling high-volume maritime activity efficiently and sustainably.

---

# 🚨 Problem Statement
During peak fishing and cargo landing periods, harbors face:
* **Severe Dock Congestion:** Ships idling for hours wasting fuel.
* **Economic Losses:** Perishable cargo (Tuna, Prawns) spoiling in the sun due to "First-Come, First-Served" logic.
* **Manual Bottlenecks:** Harbor Masters relying on radio static and paper manifests.
* **Blind Operations:** Lack of real-time distance and priority visibility.

---

# 💡 Our Solution: The "Pulse Score"
HarborPulse introduces a centralized smart coordination platform powered by a dynamic **Priority Engine**. Unlike static systems, we calculate a real-time **Pulse Score** for every vessel:

> **Score = (Wait Time × 0.5) + (Perishability × 10) - (Distance × 2)**

*   **Dynamic Perishability:** Ensures high-value cargo reaches the dock while still fresh.
*   **Distance-Awareness:** Penalizes distant boats to keep docks constantly occupied and efficient.
*   **Tactical Radar:** A 15km real-time HUD with a dedicated **5km Priority Zone** for automated allocation.

---

# ✨ Core Features

### 🚤 Tactical Radar & 5KM Priority Zone
* Real-time GPS/AIS tracking of all vessels within a 15km radius.
* Visual **5KM "Action Zone"** where priority calculations become critical.
* Color-coded vessel statuses (High Priority = Pulse Glow).

### 🏗 Harbor Master Command Center
* **Live Priority Queue:** Automatically sorted by the Pulse Score.
* **Manual Override (Bump):** Allows human intervention for emergencies (Medical/Technical) with a full audit log.
* **Real-Time Telemetry:** Wind speed, tidal offset, and harbor capacity tracking.

### 🚤 Fisherman / Vessel Portal
* **SMS Pinging:** Low-tech integration allowing small boats to update cargo and distance via simple SMS commands.
* **Live Manifest:** Transparency for captains to see their rank and estimated dock time.

---

# 🏛 System Architecture
```text
                    ┌─────────────────────┐
                    │   Vessel Operators  │
                    │   (AIS / SMS Pings) │
                    └──────────┬──────────┘
                               │
                               ▼
                    ┌─────────────────────┐
                    │ React HUD Dashboard │
                    │ (Live Radar / HUD)  │
                    └──────────┬──────────┘
                               │
                               ▼
                    ┌─────────────────────┐
                    │   Flask API Layer   │
                    │ (Priority Engine)   │
                    └───────┬─────┬───────┘
                            │     │
              ┌─────────────┘     └─────────────┐
              ▼                                 ▼
   ┌──────────────────┐             ┌──────────────────┐
   │ Firebase Sync     │             │ Audit Logging    │
   │ (Real-time DB)    │             │ (Manual Bumps)   │
   └──────────────────┘             └──────────────────┘
```

---

# 🛠 Tech Stack

### Frontend
* **React.js (Vite)**
* **Tailwind CSS** (Industrial Slate Design System)
* **Glassmorphism UI** (Mission-critical HUD aesthetic)

### Backend
* **Python (Flask)**
* **Priority Engine:** Custom weighted algorithm for maritime logistics.

### Database & Infrastructure
* **Firebase Firestore:** Real-time state synchronization.
* **SMS Gateway Simulation:** Pattern-matching for legacy device ingestion.

---

# 🚀 Installation & Setup

### 1. Clone Repository
```bash
git clone https://github.com/gee-46/NEURAL-CAPITALS-HarborPulse.git
cd NEURAL-CAPITALS-HarborPulse
```

### 2. Backend Setup (Python)
```bash
# Install dependencies
pip install flask firebase-admin flask-cors

# Add your serviceAccountKey.json for Firebase in the root
python app.py
```

### 3. Frontend Setup (React)
```bash
npm install
npm run dev
```

---

# 📈 Impact Potential
* **30% Reduction** in port idling time for critical vessels.
* **Zero Spoilage:** Targeted docking for perishable high-value catch.
* **Operational Clarity:** One single source of truth for the Harbor Master and all Captains.

---

# 🏆 Hackathon Submission
## **TechVerse’26**
Built with innovation, rapid execution, and scalable infrastructure thinking by:
## **Team Neural Capitals**
*"Solving real-world infrastructure challenges using intelligent systems."*
