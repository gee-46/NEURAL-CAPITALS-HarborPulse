# HarborPulse 🚢⚡
## AI-Powered Smart Harbor Coordination & Dock Intelligence Platform

### 🏆 Built for BIT Techverse’26 Hackathon
### 👨‍💻 Team: Neural Capitals

---

# 🏆 Achievements

- 🥇 Secured **Top 8 Position** in **BIT Techverse’26 Hackathon**
- 🚀 Selected among **140+ competing teams** from Round 1
- ⚡ Successfully designed and built a working MVP within **24 hours**
- 🧠 Recognized for:
  - Real-world problem analysis
  - Smart infrastructure innovation
  - AI-assisted coordination system
  - Feasible and scalable solution design
- 🌊 Developed an intelligent maritime logistics platform focused on:
  - Harbor congestion reduction
  - Dynamic dock scheduling
  - Real-time operational coordination
- 💡 Appreciated for combining:
  - Practicality
  - Innovation
  - Simplicity
  - User accessibility for low-tech operators

---

# 🌊 Overview

HarborPulse is an intelligent harbor coordination and dock scheduling platform designed to reduce congestion, optimize unloading operations, and improve coordination during peak fishing and cargo landing hours.

The platform addresses real-world maritime operational failures caused by static scheduling systems, poor coordination, unpredictable vessel arrivals, and lack of real-time adaptability.

Built during a 24-hour hackathon, HarborPulse introduces a dynamic AI-assisted coordination system capable of adapting to changing harbor conditions in real time.

---

# 🚨 Problem Statement

Traditional dock scheduling systems failed because they relied on rigid scheduling and lacked real-time adaptability.

### Key Challenges
- Severe harbor congestion during peak landing hours
- Long waiting periods before unloading
- Spoilage of perishable catch
- Poor coordination between harbor staff and vessels
- Informal/manual practices overriding digital systems
- Unpredictable weather and arrival timings
- Low adoption among small-scale operators

---

# ❌ Why Existing Systems Failed

## Static Scheduling
Arrival timings were highly unpredictable due to:
- Weather conditions
- Catch volume fluctuations
- Sea conditions

The system could not dynamically adapt.

---

## Lack of Coordination
No effective real-time communication existed between:
- Harbor staff
- Vessel operators
- Dock management

This caused scheduling conflicts and confusion.

---

## Poor Workflow Integration
The system ignored real harbor operational practices and workflows.

Many operators continued using informal/manual coordination methods.

---

## Low Flexibility
The platform could not handle:
- Delayed arrivals
- Emergency unloading
- Congestion spikes
- Dynamic dock reassignment

---

# 💡 Our Solution — HarborPulse

HarborPulse introduces a centralized smart coordination platform powered by a real-time **Pulse Score Engine** that dynamically prioritizes vessels instead of relying on static schedules.

The system continuously evaluates:
- Vessel distance
- Waiting time
- Cargo perishability
- Harbor capacity
- Real-time operational conditions

This enables:
✅ Faster unloading  
✅ Reduced congestion  
✅ Better dock utilization  
✅ Improved coordination  
✅ Lower spoilage risk  

---

# ⚡ Pulse Score Engine

The core innovation of HarborPulse is the dynamic **Pulse Score Algorithm**.

```text
Pulse Score =
(Wait Time × 0.5)
+ (Perishability × 10)
- (Distance × 2)
```

### Factors Considered
- ⏳ Waiting Duration
- 🐟 Cargo Perishability
- 📍 Vessel Distance
- 🌦 Environmental Conditions
- ⚓ Dock Availability

The score updates continuously to optimize dock allocation in real time.

---

# ✨ Core Features

## 🚤 Tactical Harbor Radar
- Real-time vessel tracking
- 15 KM monitoring radius
- 5 KM high-priority action zone
- Live harbor visualization
- Color-coded vessel priority indicators

---

## 🏗 Harbor Master Dashboard
- Live priority queue
- Dynamic dock allocation
- Manual emergency override
- Audit logging system
- Harbor traffic monitoring
- Real-time operational telemetry

---

## 📲 Fisherman / Vessel Portal
- Low-tech SMS support
- Queue visibility
- Estimated unloading time
- Cargo update notifications
- Lightweight and accessible interface

---

## 🔄 Real-Time Coordination
- Dynamic slot reassignment
- Adaptive scheduling
- Continuous harbor monitoring
- Live synchronization

---

# ✅ How HarborPulse Solves These Problems

| Existing Problem | HarborPulse Solution |
|---|---|
| Static schedules | Dynamic AI-assisted prioritization |
| Delayed arrivals | Real-time adaptive queue updates |
| Poor communication | Live dashboard + SMS updates |
| Manual coordination | Centralized operational control |
| Low-tech accessibility | SMS-based interaction support |
| Congestion | Intelligent dock allocation |

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
   │ Firebase Sync    │             │ Audit Logging    │
   │ (Real-time DB)   │             │ (Manual Bumps)   │
   └──────────────────┘             └──────────────────┘
```

---

# 🛠 Tech Stack

## Frontend
- React.js (Vite)
- Tailwind CSS
- Responsive Dashboard UI
- Real-Time Harbor HUD Interface

---

## Backend
- Python Flask
- REST APIs
- Custom Priority Engine

---

## Database & Services
- Firebase Firestore
- Real-time synchronization
- SMS Gateway Simulation

---

# 🚀 Installation & Setup

## 1️⃣ Clone Repository

```bash
git clone https://github.com/your-username/neural-capitals-harbor-sync.git
cd neural-capitals-harbor-sync
```

---

## 2️⃣ Backend Setup

```bash
pip install flask firebase-admin flask-cors
python app.py
```

---

## 3️⃣ Frontend Setup

```bash
npm install
npm run dev
```

---

# 📈 Impact Potential

HarborPulse helps achieve:

- 🚢 Reduced vessel waiting time
- 🐟 Lower spoilage of perishable goods
- ⚓ Improved harbor efficiency
- 📊 Better operational visibility
- 🌍 Scalable smart harbor infrastructure

---

# 🎯 Key Innovation

Unlike traditional harbor systems that rely on static scheduling, HarborPulse dynamically adapts to unpredictable maritime conditions using intelligent prioritization and real-time coordination.

### Major Innovations
- AI-assisted vessel prioritization
- Dynamic dock assignment
- SMS integration for low-tech users
- Real-time harbor intelligence dashboard
- Human + AI collaborative coordination

---

# 🔮 Future Scope

- AI-based predictive arrival estimation
- Weather-aware scheduling
- Multi-harbor coordination
- IoT sensor integration
- Mobile app for fishermen
- Predictive congestion analytics
- Automated operational recommendations

---

# 👨‍💻 Team Neural Capitals

Built with innovation, rapid execution, and scalable infrastructure thinking by:

- Gautam N Chipkar
- [Add Team Members]

---

# 📜 License

This project was developed for educational and hackathon purposes under BIT Techverse’26.

---

# 💬 Closing Statement

> “HarborPulse transforms traditional harbor operations into an intelligent, adaptive, and scalable maritime coordination ecosystem.”
