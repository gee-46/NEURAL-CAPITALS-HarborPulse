import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { db } from '../firebase';
import { doc, updateDoc, collection, addDoc, serverTimestamp, query, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { useDashboardMocks } from './dashboard_mocks';
import VesselTrafficManifest from './VesselTrafficManifest';

const VesselCard = ({ rank, name, imo, priorityScore, eta, length, isPrimary, onBump, isEmergency }) => {
  // Dynamic Background based on score
  const score = parseFloat(priorityScore);
  const statusColor = isEmergency || score > 90 
    ? 'border-error/40 bg-error/10' 
    : score >= 50 
      ? 'border-tertiary/40 bg-tertiary/10' 
      : 'border-primary/40 bg-primary/10';

  const statusText = isEmergency || score > 90 ? 'URGENT' : score >= 50 ? 'ALERT' : 'STABLE';
  const accentColor = isEmergency || score > 90 ? 'text-error' : score >= 50 ? 'text-tertiary' : 'text-primary';

  return (
    <div className={`glass-card p-6 rounded-xl border transition-all duration-500 group relative overflow-hidden hover:shadow-[0_0_25px_rgba(87,241,219,0.15)] hover:scale-[1.02] cursor-pointer ${statusColor}`}>
      {(isPrimary || isEmergency) && (
        <div className={`absolute top-0 right-0 w-24 h-24 -rotate-12 translate-x-8 -translate-y-8 pointer-events-none ${isEmergency ? 'bg-error/20' : 'bg-primary/5'}`}></div>
      )}
      <div className="flex justify-between items-start mb-6">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 flex items-center justify-center rounded-full border font-bold ${isEmergency ? 'bg-error/20 text-error border-error/50' : 'bg-surface-container-high text-on-surface border-outline'}`}>
            {rank}
          </div>
          <div>
            <h3 className="font-title-sm text-title-sm text-on-surface">{name}</h3>
            <p className="font-label-caps text-label-caps text-on-surface-variant opacity-60">IMO: {imo}</p>
          </div>
        </div>
        <div className="text-right">
          <span className={`font-label-caps text-[10px] font-bold block tracking-widest ${accentColor}`}>
            {statusText}
          </span>
          <span className={`font-data-mono text-2xl font-bold ${accentColor}`}>{priorityScore}/100</span>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3 mb-6">
        <div className="p-3 bg-black/20 rounded border border-outline-variant/30">
          <span className="block font-label-caps text-[9px] text-on-surface-variant mb-1">DISTANCE/ETA</span>
          <span className="font-data-mono text-on-surface text-sm">{eta}</span>
        </div>
        <div className="p-3 bg-black/20 rounded border border-outline-variant/30">
          <span className="block font-label-caps text-[9px] text-on-surface-variant mb-1">VESSEL CLASS</span>
          <span className="font-data-mono text-on-surface text-sm">{length}</span>
        </div>
      </div>
      <div className="flex gap-2 relative z-10">
        <button onClick={() => onBump({ rank, name, imo, priorityScore })} className={`flex-1 py-3 rounded-lg text-on-primary font-bold uppercase tracking-widest text-[10px] transition-all active:scale-95 ${isEmergency || score > 90 ? 'bg-error hover:bg-error/80' : 'bg-primary hover:opacity-80'}`}>
          {isEmergency ? 'Acknowledge' : 'Manual Bump'}
        </button>
        <Link 
          to={`/status/${imo}`}
          className="flex items-center justify-center px-4 rounded-lg border border-primary text-primary hover:bg-primary/10 transition-all active:scale-95"
          title="Track Live Status"
        >
          <span className="material-symbols-outlined text-sm">sensors</span>
        </Link>
      </div>
    </div>
  );
};

const SmsEntry = ({ time, source, message, isPrimary }) => (
  <div className={`p-3 border-l-4 pl-2 transition-all hover:bg-white/5 cursor-pointer ${isPrimary ? 'bg-surface-container border-primary' : 'bg-transparent border-outline-variant'}`}>
    <div className="flex justify-between mb-1 opacity-60">
      <span>{time}</span>
      <span>{source}</span>
    </div>
    <p className={isPrimary ? 'text-on-surface' : 'text-on-surface-variant'}>{message}</p>
  </div>
);

export default function HarborMasterDashboard({ 
  vessels = [
    { rank: 1, name: "MV Rajan", imo: "9845532", priorityScore: 98, eta: "14:30 UTC", length: "240m", isPrimary: true },
    { rank: 2, name: "The Sea Wolf", imo: "8221049", priorityScore: 89, eta: "15:15 UTC", length: "185m" },
    { rank: 3, name: "Blue Horizon", imo: "9114772", priorityScore: 76, eta: "16:45 UTC", length: "310m" }
  ] 
}) {
  const { wind, tide, activeAlerts, harborLoad, smsLog } = useDashboardMocks();
  const [activeTab, setActiveTab] = useState('queue');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedVessel, setSelectedVessel] = useState(null);
  const [overrideReason, setOverrideReason] = useState('');
  const [selectedRank, setSelectedRank] = useState(1);
  const [realVessels, setRealVessels] = useState([]);
  const [dispatchName, setDispatchName] = useState('');
  const [dispatchCargo, setDispatchCargo] = useState('');
  const [isDispatching, setIsDispatching] = useState(false);
  const [liveLogs, setLiveLogs] = useState([]);
  const [systemLogs, setSystemLogs] = useState([]);

  // Unified data source for the whole dashboard
  const activeVessels = realVessels.length > 0 ? realVessels : vessels;

  // Mock messages for simulation
  const mockMessages = [
    "SMS Received from +91XXXXXX04: 'IN TUNA 500'",
    "SMS Received from +91XXXXXX88: 'IN MACKEREL 200'",
    "System Alert: Priority Zone Breach - Vessel ID 4402",
    "SMS Received from +91XXXXXX12: 'IN PRAWNS 150'",
    "Harbor Master: Manual Priority assigned to 'MV Rescue'"
  ];

  const addLog = (msg) => {
    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    setSystemLogs(prev => [`[${time}] ${msg}`, ...prev].slice(0, 50));
  };

  useEffect(() => {
    // Simulate live traffic on load
    mockMessages.forEach((msg, i) => {
      setTimeout(() => addLog(msg), (i + 1) * 3000);
    });
  }, []);

  // Track vessel arrivals to log them
  useEffect(() => {
    if (realVessels.length > 0) {
      const latest = realVessels[0];
      // Only log if it's "new" (added in the last 10 seconds)
      const isNew = latest.last_ping_time && (Date.now() - latest.last_ping_time.toMillis() < 10000);
      if (isNew) {
        addLog(`Vessel Detected: ${latest.name} (${latest.cargo_type}) - Rank #${latest.current_rank}`);
      }
    }
  }, [realVessels]);

  useEffect(() => {
    const q = query(collection(db, 'audit_logs'), orderBy('timestamp', 'desc'), limit(5));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const logs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setLiveLogs(logs);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const fetchVessels = async () => {
      try {
        const res = await fetch('/api/vessels');
        const data = await res.json();
        if (Array.isArray(data)) {
           data.sort((a, b) => a.current_rank - b.current_rank);
           setRealVessels(data);
        }
      } catch (err) {
        console.error("Failed to fetch vessels", err);
      }
    };
    
    fetchVessels();
    const intId = setInterval(fetchVessels, 2000); // 2 second polling for live feel
    return () => clearInterval(intId);
  }, []);

  // Map distance (1km to 15km) to radial coordinates — ocean side only
  const getBoatPosition = (boat) => {
    const hash = boat.name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);

    // Ocean is on the RIGHT side of the satellite image.
    // Constrain angles to -100° → +80° (right arc = open water approach corridor).
    // This prevents dots from appearing over the land/port infrastructure on the left.
    const oceanSpread = 180;                        // total arc width in degrees
    const oceanCenter = 0;                          // 0° = right = open sea
    const rawAngle    = (hash * 137.5) % oceanSpread;  // 0 → 180
    const angleDeg    = rawAngle - (oceanSpread / 2) + oceanCenter; // -90° → +90°
    const angleRad    = angleDeg * (Math.PI / 180);

    // Distance mapped to radius (max 42% to keep inside the circle)
    const maxDistance  = 15;
    const radiusPercent = (Math.min(boat.distance || 5, maxDistance) / maxDistance) * 42;

    const left = 50 + radiusPercent * Math.cos(angleRad);
    const top  = 50 + radiusPercent * Math.sin(angleRad);

    return { left, top };
  };

  const handleBumpClick = (vessel) => {
    setSelectedVessel(vessel);
    setOverrideReason('');
    setIsModalOpen(true);
  };

  const submitOverride = async (reason) => {
    if (!selectedVessel || !reason) return;
    setIsModalOpen(false);
    try {
      console.log(`ATTEMPTING BUMP FOR: ${selectedVessel.name} (ID: ${selectedVessel.imo})`);

      // 1. Update the Vessel Document
      const vesselRef = doc(db, 'vessels', selectedVessel.imo);
      await updateDoc(vesselRef, {
        manual_override: true,
        priority_score: 100,
        override_reason: reason
      });

      // 2. Create Audit Log Entry
      await addDoc(collection(db, 'audit_logs'), {
        vessel_id: selectedVessel.imo,
        vessel_name: selectedVessel.name,
        timestamp: serverTimestamp(),
        action: "MANUAL_BUMP",
        reason: reason
      });

      console.log(`Manual bump successful for ${selectedVessel.name}`);
    } catch (error) {
      console.error("FIREBASE ERROR:", error);
      alert(`CRITICAL ERROR: Failed to reach Firebase.\n\nDetails: ${error.message}`);
    }
  };

  const handleManualDispatch = async (isEmergency = false) => {
    if (!dispatchName.trim() || !dispatchCargo.trim()) return;
    setIsDispatching(true);
    try {
      const response = await fetch('/api/manual', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          vessel_name: dispatchName,
          catch_type: dispatchCargo,
          is_emergency: isEmergency
        })
      });
      if (response.ok) {
        setDispatchName('');
        setDispatchCargo('');
      }
    } catch (error) {
      console.error("Failed to send manual dispatch", error);
    } finally {
      setIsDispatching(false);
    }
  };
  const getEconomicValuePreserved = () => {
    return realVessels.reduce((acc, boat) => {
      // Use the actual Perishability Index from the vessel document
      const pi = boat.perishability_index || 0;
      
      // If high perishability (Pi > 7) and it's being prioritized (Score > 50)
      if (pi > 7 && (boat.priority_score || 0) > 50) {
        // Deterministic random value based on vessel ID (so it doesn't flicker)
        const boatSeed = parseInt(boat.imo || '0') || 123;
        const impactValue = 1500 + ((boatSeed * 73) % 1500); 
        return acc + impactValue;
      }
      return acc;
    }, 0);
  };

  return (
    <div className="bg-background text-on-background font-body-md overflow-hidden dark h-screen w-full flex flex-col">
      {/* Top AppBar */}
      <header className="bg-surface border-b border-outline-variant docked full-width top-0 z-50 flex justify-between items-center w-full px-margin-desktop h-16 shrink-0">
        <div className="flex items-center gap-4">
          <span className="font-display-lg text-display-lg font-bold text-primary">Industrial Slate</span>
          <div className="h-6 w-px bg-outline-variant ml-2"></div>
          <div className="flex items-center gap-6 ml-4">
            <button className="text-primary border-b-2 border-primary pb-1 font-body-md transition-colors hover:bg-surface-container-highest">Dashboard</button>
            <button className="text-on-surface-variant font-body-md transition-colors hover:bg-surface-container-highest">Live Radar</button>
            <button className="text-on-surface-variant font-body-md transition-colors hover:bg-surface-container-highest">Manifests</button>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-on-surface-variant cursor-pointer hover:bg-surface-container-highest p-2 rounded-lg">warning</span>
            <span className="material-symbols-outlined text-on-surface-variant cursor-pointer hover:bg-surface-container-highest p-2 rounded-lg">cloud</span>
            <span className="material-symbols-outlined text-on-surface-variant cursor-pointer hover:bg-surface-container-highest p-2 rounded-lg">schedule</span>
          </div>
          <div className="w-8 h-8 rounded-full bg-secondary-container flex items-center justify-center border border-primary/30">
            <span className="material-symbols-outlined text-primary text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>person</span>
          </div>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Side Navigation */}
        <aside className="bg-surface-container border-r border-outline-variant docked h-full w-64 left-0 flex flex-col py-6 px-4 gap-4 shrink-0">
          <div className="mb-4">
            <h2 className="font-display-lg text-display-lg text-primary">Vessel Ops</h2>
            <p className="text-on-surface-variant text-body-sm opacity-70">Sector 7 Command</p>
          </div>
          <nav className="flex flex-col gap-2">
            <button 
              onClick={() => setActiveTab('queue')}
              className={`flex items-center gap-3 px-4 py-3 transition-all ${activeTab === 'queue' ? 'bg-secondary-container text-on-secondary-container rounded-lg font-bold scale-98' : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container-highest'}`}
            >
              <span className="material-symbols-outlined">assignment_late</span>
              <span>Priority Queue</span>
            </button>
            <button 
              onClick={() => setActiveTab('traffic')}
              className={`flex items-center gap-3 px-4 py-3 transition-all ${activeTab === 'traffic' ? 'bg-secondary-container text-on-secondary-container rounded-lg font-bold scale-98' : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container-highest'}`}
            >
              <span className="material-symbols-outlined">directions_boat</span>
              <span>Vessel Traffic</span>
            </button>
            <button 
              onClick={() => setActiveTab('maps')}
              className={`flex items-center gap-3 px-4 py-3 transition-all ${activeTab === 'maps' ? 'bg-secondary-container text-on-secondary-container rounded-lg font-bold scale-98' : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container-highest'}`}
            >
              <span className="material-symbols-outlined">map</span>
              <span>Port Maps</span>
            </button>
            <a className="text-on-surface-variant hover:text-on-surface hover:bg-surface-container-highest flex items-center gap-3 px-4 py-3 transition-all" href="#">
              <span className="material-symbols-outlined">settings</span>
              <span>Settings</span>
            </a>
          </nav>
          {/* Live System Log Section */}
          <div className="mt-auto flex flex-col min-h-[200px] gap-2">
            <p className="font-label-caps text-[10px] text-primary flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-primary rounded-full animate-pulse"></span>
              LIVE SYSTEM LOG
            </p>
            <div className="flex-1 bg-black/40 border border-outline-variant rounded-lg p-2 font-data-mono text-[10px] leading-relaxed overflow-y-auto max-h-[180px] custom-scrollbar text-primary/80">
              {systemLogs.length === 0 ? (
                <p className="opacity-40 italic">Initializing stream...</p>
              ) : (
                systemLogs.map((log, i) => (
                  <div key={i} className="mb-1 border-l border-primary/20 pl-2 animate-in fade-in slide-in-from-left-2 duration-500">
                    {log}
                  </div>
                ))
              )}
            </div>
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto p-margin-desktop custom-scrollbar bg-surface-dim flex flex-col">
          <div className="max-w-container-max mx-auto w-full flex-1 flex flex-col">
            <div className="flex justify-between items-end mb-8">
              <div>
                <h1 className="font-headline-md text-headline-md text-on-surface">
                  {activeTab === 'queue' && 'Live Priority Queue'}
                  {activeTab === 'traffic' && 'Vessel Traffic Manifest'}
                  {activeTab === 'maps' && 'Port Layout Maps'}
                </h1>
                <p className="text-on-surface-variant text-body-md">
                  {activeTab === 'queue' && 'Sector 7 Real-time Allocation'}
                  {activeTab === 'traffic' && 'Live AIS & Telemetry Data'}
                  {activeTab === 'maps' && 'Strategic Facilities Overview'}
                </p>
              </div>
              <div className="flex gap-4">
                {/* KEY IMPACT METRIC */}
                <div className="glass-card px-5 py-2 rounded-xl border border-primary/30 bg-primary/5 flex items-center gap-4 shadow-[0_0_15px_rgba(87,241,219,0.1)] transition-all hover:scale-105 duration-500">
                   <div className="relative">
                     <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center shrink-0 border border-primary/40">
                       <span className="material-symbols-outlined text-primary text-xl">payments</span>
                     </div>
                     {/* Pulsing Live indicator */}
                     <div className="absolute -top-1 -right-1 w-3 h-3 bg-primary rounded-full border-2 border-surface animate-pulse shadow-[0_0_8px_#57f1db]"></div>
                   </div>
                   <div className="flex flex-col items-start">
                     <div className="flex items-center gap-2">
                       <span className="font-label-caps text-[9px] text-primary tracking-[0.2em] font-bold">EST. LOSS PREVENTED</span>
                       <span className="text-[8px] font-bold text-primary bg-primary/20 px-1.5 py-0.5 rounded leading-none">LIVE</span>
                     </div>
                     <span className="font-data-mono text-2xl font-bold text-primary drop-shadow-[0_0_5px_rgba(87,241,219,0.5)]">
                        ₹{Math.round(getEconomicValuePreserved()).toLocaleString('en-IN')}
                     </span>
                   </div>
                </div>

                <div className="flex flex-col items-end justify-center ml-4">
                  <span className="font-label-caps text-label-caps text-tertiary">CURRENT HARBOR LOAD</span>
                  <span className={`font-data-mono text-data-mono ${harborLoad > 85 ? 'text-error animate-pulse' : 'text-primary'}`}>{harborLoad}% CAPACITY</span>
                </div>
              </div>
            </div>

            {/* HARBOR ALERT BANNER */}
            {realVessels.some(v => v.is_emergency) && (
              <div className="w-full bg-error/20 border-2 border-error rounded-lg p-4 mb-6 flex items-center justify-between animate-pulse shadow-[0_0_20px_rgba(255,84,73,0.3)]">
                <div className="flex items-center gap-4">
                  <span className="material-symbols-outlined text-error text-3xl">warning</span>
                  <div>
                    <h2 className="font-display-lg text-error text-xl uppercase tracking-widest">Harbor Alert: Emergency Declaration</h2>
                    <p className="text-error/80 font-data-mono text-sm">Critical vessel en route. Standard operations suspended. Clear main docks immediately.</p>
                  </div>
                </div>
              </div>
            )}

            {/* QUEUE TAB */}
            {activeTab === 'queue' && (
              <>
                <div className="grid grid-cols-1 xl:grid-cols-2 2xl:grid-cols-3 gap-gutter">
              {activeVessels.map((vessel) => (
                <VesselCard 
                   key={vessel.id || vessel.imo || vessel.name} 
                   rank={vessel.current_rank || vessel.rank}
                   name={vessel.name}
                   imo={vessel.id || vessel.imo || "N/A"}
                   priorityScore={(vessel.priority_score || 0).toFixed(1)}
                   eta={typeof vessel.eta === 'string' ? vessel.eta : `${(vessel.wait_time || 0).toFixed(1)} hrs`}
                   length={typeof vessel.length === 'string' ? vessel.length : `${vessel.cargo_capacity || 0} TEU`}
                   isPrimary={(vessel.priority_score || 0) > 90 || vessel.isPrimary}
                   isEmergency={vessel.is_emergency}
                   onBump={handleBumpClick} 
                />
              ))}
            </div>

            {/* Industrial Data Cluster Section */}
            <div className="mt-12 grid grid-cols-4 gap-gutter">
              <div className="bg-surface-container-low p-4 border border-outline-variant rounded">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-label-caps text-label-caps text-on-surface-variant">WIND VELOCITY</span>
                  <span className="material-symbols-outlined text-tertiary text-sm">air</span>
                </div>
                <p className="font-data-mono text-2xl text-on-surface">{wind} KTS</p>
              </div>
              <div className="bg-surface-container-low p-4 border border-outline-variant rounded">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-label-caps text-label-caps text-on-surface-variant">TIDAL OFFSET</span>
                  <span className="material-symbols-outlined text-tertiary text-sm">waves</span>
                </div>
                <p className="font-data-mono text-2xl text-on-surface">+{tide} M</p>
              </div>
              <div className="bg-surface-container-low p-4 border border-outline-variant rounded">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-label-caps text-label-caps text-on-surface-variant">BERTHS FREE</span>
                  <span className="material-symbols-outlined text-primary text-sm">dock</span>
                </div>
                <p className="font-data-mono text-2xl text-primary">02 / 12</p>
              </div>
              <div className={`bg-surface-container-low p-4 border rounded transition-colors duration-1000 ${activeAlerts === '02' ? 'border-error/50 bg-error/5' : 'border-outline-variant'}`}>
                <div className="flex items-center justify-between mb-2">
                  <span className="font-label-caps text-label-caps text-on-surface-variant">ACTIVE ALERTS</span>
                  <span className={`material-symbols-outlined text-sm ${activeAlerts === '02' ? 'text-error animate-pulse' : 'text-error'}`}>notification_important</span>
                </div>
                <div className="flex items-end justify-between">
                  <p className="font-data-mono text-2xl text-error">{activeAlerts}</p>
                  {activeAlerts === '02' && <span className="text-[10px] bg-error/20 text-error px-2 py-1 rounded font-bold animate-pulse shadow-[0_0_8px_rgba(255,180,171,0.4)]">CONGESTION DETECTED</span>}
                </div>
              </div>
            </div>

            {/* Strategic Map Area */}
            <div className="mt-8 h-80 w-full glass-card rounded-lg relative overflow-hidden bg-[#0A0E17]">
              <style>{`
                @keyframes radar-sweep {
                  from { transform: rotate(0deg); }
                  to { transform: rotate(360deg); }
                }
                .radar-scanner {
                  animation: radar-sweep 4s linear infinite;
                  transform-origin: bottom center;
                }
                .radar-grid {
                  background-image: linear-gradient(rgba(87,241,219,0.05) 1px, transparent 1px),
                  linear-gradient(90deg, rgba(87,241,219,0.05) 1px, transparent 1px);
                  background-size: 2rem 2rem;
                }
              `}</style>

              {/* Satellite Background Layer */}
              <div 
                className="absolute inset-0 w-full h-full mix-blend-screen pointer-events-none"
                style={{
                  backgroundImage: 'url(/satellite_port_view.png)',
                  backgroundSize: 'cover',
                  backgroundPosition: 'center center',
                  opacity: 0.4,
                  filter: 'contrast(1.3) grayscale(0.2)'
                }}
              />
              
              {/* Tactical Grid Overlay */}
              <div className="absolute inset-0 w-full h-full radar-grid pointer-events-none"></div>

              <div className="absolute inset-0 flex flex-col justify-center items-center pointer-events-none z-10">
                <div className="w-64 h-64 border border-primary/10 rounded-full flex items-center justify-center relative overflow-hidden">
                  
                  {/* 5KM PRIORITY ZONE RING */}
                  <div className="absolute inset-0 m-auto w-[85px] h-[85px] border border-orange-500/40 rounded-full z-0 flex items-start justify-center">
                    <span className="text-[8px] text-orange-500 font-bold bg-[#0A0E17] px-1 -translate-y-1">5KM ZONE</span>
                  </div>

                  {/* 10KM RANGE RING */}
                  <div className="absolute inset-0 m-auto w-[170px] h-[170px] border border-primary/20 rounded-full z-0 flex items-start justify-center">
                    <span className="text-[8px] text-primary/40 font-bold bg-[#0A0E17] px-1 -translate-y-1">10KM RANGE</span>
                  </div>

                  {/* Rotating Scanner Line */}
                  <div className="absolute top-0 left-[calc(50%-1px)] w-[2px] h-32 bg-gradient-to-b from-transparent to-primary radar-scanner z-0" style={{boxShadow: '-4px 0 10px rgba(87,241,219,0.5)'}}></div>

                  <div className="w-32 h-32 border border-primary/40 rounded-full flex items-center justify-center relative z-10">
                      <span className="material-symbols-outlined text-primary scale-150 relative z-10">radar</span>
                      {/* Central pulsing green dot */}
                      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-5 h-5 bg-primary/40 rounded-full animate-ping opacity-75"></div>
                      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 bg-primary rounded-full shadow-[0_0_10px_#57f1db]"></div>
                  </div>
                </div>
                <span className="mt-4 font-label-caps text-label-caps text-primary tracking-widest bg-surface-container-low/50 px-2 py-1 rounded">TACTICAL RADAR: 15KM RADIUS</span>
              </div>
              
              {/* Real-time Vessel Dots (Shared Source) */}
              {activeVessels.map(boat => {
                const pos = getBoatPosition(boat);
                const isHighPriority = (boat.priority_score || 0) > 90;
                return (
                  <div 
                    key={boat.id || boat.name}
                    className={`absolute w-3 h-3 rounded-full animate-pulse z-30 transition-all duration-1000 group ${
                       isHighPriority 
                         ? 'bg-orange-500 shadow-[0_0_16px_#f97316]' 
                         : 'bg-primary shadow-[0_0_12px_#57f1db]'
                    }`}
                    style={{
                      top: `${pos.top}%`,
                      left: `${pos.left}%`
                    }}
                  >
                     <span className={`absolute left-4 top-1/2 -translate-y-1/2 text-[10px] font-bold font-data-mono whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity ${isHighPriority ? 'text-orange-500' : 'text-primary'}`}>
                       {boat.name}
                     </span>
                  </div>
                );
              })}
            </div>
            </>
            )}

            {/* TRAFFIC TAB */}
            {activeTab === 'traffic' && (
              <VesselTrafficManifest vessels={activeVessels} />
            )}

            {/* MAPS TAB */}
            {activeTab === 'maps' && (
              <div className="flex-1 glass-card rounded-lg border border-outline-variant p-4 flex flex-col h-[600px] relative overflow-hidden animate-in fade-in duration-500">
                <img 
                  alt="Expanded Port Map" 
                  className="absolute inset-0 w-full h-full object-cover mix-blend-overlay opacity-80 contrast-125" 
                  src="/satellite_port_view.png" 
                />
                <div className="absolute top-4 left-4 bg-surface/80 backdrop-blur border border-outline-variant rounded p-4 z-10">
                   <h3 className="font-title-md text-primary mb-1">Sector 7 Deep Water Port</h3>
                   <p className="text-body-sm text-on-surface-variant">Active Berths: 10/12<br/>Tug availability: 4 Units</p>
                </div>
              </div>
            )}

          </div>
        </main>

        {/* Right Side Panel (Live Radio Dispatch) */}
        <aside className="bg-surface-container-low/40 backdrop-blur-xl border-l border-outline-variant docked h-full w-80 right-0 flex flex-col p-4 shadow-lg shrink-0">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h2 className="font-display-lg text-primary text-xl">Live Radio Dispatch</h2>
              <p className="font-data-mono text-xs text-on-surface-variant">Manual Entry</p>
            </div>
            <div className="flex gap-2">
              <span className="material-symbols-outlined text-primary animate-pulse">radio</span>
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto custom-scrollbar flex flex-col gap-4 font-data-mono text-xs">
            {liveLogs.length > 0 ? liveLogs.map((log) => (
              <div key={log.id} className="p-3 border-l-2 border-primary bg-white/5 animate-log">
                <div className="flex justify-between mb-1 opacity-50 text-[9px]">
                  <span>{log.timestamp?.toDate().toLocaleTimeString() || "NOW"}</span>
                  <span>{log.action}</span>
                </div>
                {log.action === 'MANUAL_BUMP' ? (
                  <p className="text-on-surface leading-relaxed">
                    <span className="text-error font-bold mr-2">[OVERRIDE]</span>
                    <span className="text-primary">{log.vessel_name}:</span> {log.reason}
                  </p>
                ) : log.action === 'TELEGRAM_PING' ? (
                  <p className="text-on-surface leading-relaxed">
                    <span className="text-tertiary font-bold mr-2">[PING]</span>
                    <span className="text-primary">{log.vessel_name}:</span> {log.reason}
                  </p>
                ) : (
                  <p className="text-on-surface-variant">{log.message || "Action recorded."}</p>
                )}
              </div>
            )) : smsLog.slice(0, 5).map((log) => (
              <SmsEntry key={log.id} time={log.time} source={log.source} message={log.message} isPrimary={log.isPrimary} />
            ))}
          </div>
          
          <div className="mt-4 pt-4 border-t border-outline-variant space-y-3">
            <input 
              className="w-full bg-surface-dim border-none border-b-2 border-outline focus:border-primary focus:ring-0 text-sm py-2 px-3 font-data-mono" 
              placeholder="Vessel Name..." 
              type="text" 
              value={dispatchName}
              onChange={(e) => setDispatchName(e.target.value)}
              disabled={isDispatching}
            />
            <div className="relative">
              <input 
                className="w-full bg-surface-dim border-none border-b-2 border-outline focus:border-primary focus:ring-0 text-sm py-2 px-3 font-data-mono pr-10" 
                placeholder="Cargo / Catch..." 
                type="text" 
                value={dispatchCargo}
                onChange={(e) => setDispatchCargo(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleManualDispatch()}
                disabled={isDispatching}
              />
              <button 
                onClick={() => handleManualDispatch(false)}
                disabled={isDispatching}
                className={`absolute right-2 top-1/2 -translate-y-1/2 material-symbols-outlined text-primary scale-75 transition-all ${isDispatching ? 'opacity-50 cursor-not-allowed animate-spin' : 'hover:scale-90 cursor-pointer'}`}
              >
                {isDispatching ? 'sync' : 'send'}
              </button>
            </div>
            <button 
              onClick={() => handleManualDispatch(true)}
              disabled={isDispatching}
              className="w-full mt-2 border border-error text-error hover:bg-error/10 py-2 font-bold font-label-caps tracking-widest uppercase transition-colors"
            >
              Signal Emergency
            </button>
          </div>
        </aside>
      </div>

      {/* ── OVERRIDE REASON MODAL ── */}
      {isModalOpen && selectedVessel && (
        <div
          className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-4"
          style={{ background: 'rgba(2, 6, 23, 0.92)' }}
          onClick={() => setIsModalOpen(false)}
        >
          <div
            className="glass-card w-full max-w-md rounded-2xl overflow-hidden shadow-[0_8px_40px_rgba(87,241,219,0.15)] animate-log"
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div className="bg-surface-container-high px-6 py-5 flex justify-between items-center border-b border-primary/20">
              <div>
                <p className="text-[10px] font-jetbrains text-on-surface-variant tracking-widest uppercase">Manual Override</p>
                <h2 className="text-primary font-bold text-lg tracking-tight">{selectedVessel.name}</h2>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="text-on-surface-variant hover:text-primary transition-colors p-2">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            {/* Reason Picker — large tap targets, icon + label */}
            <div className="p-5">
              <p className="text-center text-on-surface-variant text-sm mb-5 font-inter">Why is this vessel being prioritized?</p>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: 'Emergency',        icon: 'emergency',       color: 'border-error   text-error   hover:bg-error/10' },
                  { label: 'Spoilage Risk',     icon: 'nutrition',       color: 'border-primary text-primary hover:bg-primary/10' },
                  { label: 'Engine Failure',    icon: 'build',           color: 'border-[#ffb4ab] text-[#ffb4ab] hover:bg-[#ffb4ab]/10' },
                  { label: 'Weather Hazard',    icon: 'thunderstorm',    color: 'border-tertiary text-tertiary hover:bg-tertiary/10' },
                ].map(({ label, icon, color }) => (
                  <button
                    key={label}
                    onClick={() => submitOverride(label)}
                    className={`flex flex-col items-center justify-center gap-3 p-5 rounded-xl border-2 transition-all active:scale-95 ${color}`}
                  >
                    <span className="material-symbols-outlined text-4xl" style={{ fontVariationSettings: "'FILL' 1" }}>{icon}</span>
                    <span className="font-bold text-sm text-center leading-tight">{label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Footer note */}
            <div className="px-5 pb-5 text-center">
              <p className="text-[10px] text-on-surface-variant opacity-60 font-inter">
                This action is logged for safety and compliance.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
