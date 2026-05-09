import React, { useState, useEffect } from 'react';
import { useDashboardMocks } from './dashboard_mocks';
import VesselTrafficManifest from './VesselTrafficManifest';

const VesselCard = ({ rank, name, imo, priorityScore, eta, length, isPrimary, onBump, isEmergency }) => (
  <div className={`glass-card p-6 rounded-lg relative overflow-hidden group ${isEmergency ? 'border-2 border-error bg-error/10 animate-pulse shadow-[0_0_20px_rgba(255,84,73,0.3)]' : ''}`}>
    {(isPrimary || isEmergency) && (
      <div className={`absolute top-0 right-0 w-24 h-24 -rotate-12 translate-x-8 -translate-y-8 pointer-events-none ${isEmergency ? 'bg-error/20' : 'bg-primary/5'}`}></div>
    )}
    <div className="flex justify-between items-start mb-6">
      <div className="flex items-center gap-3">
        <div className={`w-10 h-10 flex items-center justify-center rounded-full border font-bold ${isEmergency ? 'bg-error/20 text-error border-error/50' : (isPrimary ? 'bg-surface-container-high text-primary border-primary/20' : 'bg-surface-container-high text-on-surface-variant border-outline')}`}>
          {rank}
        </div>
        <div>
          <h3 className="font-title-sm text-title-sm text-on-surface">{name}</h3>
          <p className="font-label-caps text-label-caps text-on-surface-variant">IMO: {imo}</p>
        </div>
      </div>
      <div className="text-right">
        <span className={`font-label-caps text-label-caps block ${isEmergency ? 'text-error animate-pulse' : (isPrimary ? 'text-primary' : 'text-on-surface-variant')}`}>
          {isEmergency ? 'CRITICAL' : 'PRIORITY'}
        </span>
        <span className={`font-data-mono text-2xl font-bold ${isEmergency ? 'text-error' : (isPrimary ? 'text-primary' : 'text-on-surface')}`}>{priorityScore}/100</span>
      </div>
    </div>
    <div className="grid grid-cols-2 gap-4 mb-6">
      <div className="p-3 bg-surface-container rounded border border-outline-variant">
        <span className="block font-label-caps text-label-caps text-on-surface-variant">ETA</span>
        <span className="font-data-mono text-on-surface">{eta}</span>
      </div>
      <div className="p-3 bg-surface-container rounded border border-outline-variant">
        <span className="block font-label-caps text-label-caps text-on-surface-variant">LENGTH</span>
        <span className="font-data-mono text-on-surface">{length}</span>
      </div>
    </div>
    <button onClick={() => onBump({ rank, name, imo, priorityScore })} className={`w-full py-3 rounded text-on-primary font-bold uppercase tracking-wider text-body-sm transition-opacity active:scale-95 ${isEmergency ? 'bg-error hover:bg-error/80' : 'bg-primary hover:opacity-80'}`}>
      {isEmergency ? 'Acknowledge' : 'Manual Bump'}
    </button>
  </div>
);

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

  // Map distance (1km to 15km) to radial coordinates
  const getBoatPosition = (boat) => {
    // Generate pseudo-random angle based on boat name hash so it remains constant
    const hash = boat.name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const angleStr = ((hash * 137.5) % 360) * (Math.PI / 180); 
    
    // Distance mapped to radius (max 45% to keep inside the circle)
    const maxDistance = 15;
    const radiusPercent = (Math.min(boat.distance || 5, maxDistance) / maxDistance) * 42; 
    
    const left = 50 + radiusPercent * Math.cos(angleStr);
    const top = 50 + radiusPercent * Math.sin(angleStr);
    
    return { left, top };
  };

  const handleBumpClick = (vessel) => {
    setSelectedVessel(vessel);
    setSelectedRank(vessel.rank);
    setOverrideReason('');
    setIsModalOpen(true);
  };

  const submitOverride = async () => {
    try {
      const response = await fetch('/api/manual-override', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          boat_id: selectedVessel.imo,
          reason_code: overrideReason,
          new_rank: parseInt(selectedRank, 10)
        })
      });
      const data = await response.json();
      console.log('Override response:', data);
      setIsModalOpen(false);
    } catch (error) {
      console.error('Error overriding:', error);
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
      // P_i Lookup
      const pi = { 'Tuna': 10, 'Shrimp': 10, 'Prawns': 10, 'Crabs': 4 }[boat.cargo_type] || 0;
      // T_w Saved (Mocked via priority score if wait time isn't explicitly high yet)
      const tw_saved = boat.wait_time > 0 ? boat.wait_time : (boat.priority_score > 0 ? boat.priority_score / 2 : 0);
      // Constant
      const constant = 4500; 
      
      return acc + (tw_saved * pi * constant);
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
          <div className="mt-auto p-4 glass-card rounded-lg">
            <p className="font-label-caps text-label-caps text-primary mb-2">SYSTEM HEALTH</p>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-primary bloom-pip-teal"></div>
              <span className="text-body-sm">LINK STATUS: ACTIVE</span>
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
                {/* VALUE PRESERVED CARD */}
                <div className="glass-card px-4 py-2 rounded-lg border border-primary/40 flex items-center gap-3 animate-in fade-in slide-in-from-top-2">
                   <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                     <span className="material-symbols-outlined text-primary">currency_rupee</span>
                   </div>
                   <div className="flex flex-col items-start">
                     <span className="font-label-caps text-[10px] text-primary whitespace-nowrap">Est. Post-Harvest Loss Prevented</span>
                     <span className="font-data-mono text-xl font-bold text-primary tracking-wider">
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
              {realVessels.length > 0 ? realVessels.map((vessel) => (
                <VesselCard 
                   key={vessel.id || vessel.name} 
                   rank={vessel.current_rank}
                   name={vessel.name}
                   imo={vessel.id || "N/A"}
                   priorityScore={(vessel.priority_score || 0).toFixed(1)}
                   eta={`${(vessel.wait_time || 0).toFixed(1)} hrs`}
                   length={`${vessel.cargo_capacity || 0} TEU`}
                   isPrimary={(vessel.priority_score || 0) > 90}
                   isEmergency={vessel.is_emergency}
                   onBump={handleBumpClick} 
                />
              )) : vessels.map((vessel) => (
                <VesselCard key={vessel.imo} {...vessel} isEmergency={vessel.is_emergency} onBump={handleBumpClick} />
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
              
              {/* Real-time Firebase Vessel Dots */}
              {realVessels.map(boat => {
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
              <VesselTrafficManifest vessels={realVessels} />
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
          
          <div className="flex-1 overflow-y-auto custom-scrollbar flex flex-col gap-3 font-data-mono text-xs">
            {smsLog.map((log) => (
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

      {/* Modal Overlay */}
      {isModalOpen && selectedVessel && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6" style={{ background: 'rgba(2, 6, 23, 0.85)' }}>
          <div className="glass-card w-full max-w-lg shadow-[0_8px_32px_rgba(87,241,219,0.15)] overflow-hidden">
            {/* Modal Header */}
            <div className="bg-surface-container-high px-6 py-4 flex justify-between items-center border-b border-primary/30">
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-primary">swap_vert</span>
                <h2 className="font-headline-md text-headline-md text-on-surface tracking-tight">Manual Bump</h2>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="text-on-surface-variant hover:text-primary transition-colors">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            
            {/* Modal Body */}
            <div className="p-6 space-y-8">
              {/* Vessel Info Recap */}
              <div className="bg-surface-container-lowest/50 p-4 border border-outline-variant/50 rounded flex gap-4">
                <div className="w-12 h-12 bg-secondary-container rounded flex items-center justify-center">
                  <span className="material-symbols-outlined text-on-secondary-container">directions_boat</span>
                </div>
                <div>
                  <p className="text-body-sm text-on-surface-variant font-label-caps">TARGET VESSEL</p>
                  <p className="font-display-lg text-[20px] text-primary">{selectedVessel.name}</p>
                </div>
              </div>

              {/* Dropdown: Reason for Override */}
              <div className="space-y-2">
                <label className="font-label-caps text-on-surface-variant block">Reason for Override</label>
                <div className="relative">
                  <select 
                    value={overrideReason}
                    onChange={(e) => setOverrideReason(e.target.value)}
                    className="w-full bg-surface-container-lowest border border-outline-variant text-on-surface py-3 px-4 appearance-none focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all font-body-md"
                  >
                    <option disabled value="">Select priority justification...</option>
                    <option value="emergency">Emergency</option>
                    <option value="failure">Equipment Failure</option>
                    <option value="spoilage">Spoilage Risk</option>
                    <option value="weather">Weather</option>
                  </select>
                  <div className="absolute inset-y-0 right-0 flex items-center px-4 pointer-events-none text-primary">
                    <span className="material-symbols-outlined">expand_more</span>
                  </div>
                </div>
              </div>

              {/* Slider: Rank Selection */}
              <div className="space-y-4">
                <div className="flex justify-between items-end">
                  <label className="font-label-caps text-on-surface-variant block">Rank Selection</label>
                  <span className="font-data-mono text-primary text-display-lg">{selectedRank.toString().padStart(2, '0')}</span>
                </div>
                <div className="relative pt-2">
                  <input 
                    type="range" 
                    min="1" 
                    max="10" 
                    value={selectedRank}
                    onChange={(e) => setSelectedRank(e.target.value)}
                    className="w-full h-1 bg-surface-container-highest rounded-full appearance-none cursor-pointer accent-primary" 
                    style={{ WebkitAppearance: 'none' }}
                  />
                  <div className="flex justify-between mt-2 font-data-mono text-[10px] text-on-surface-variant">
                    <span>PRIORITY 01</span>
                    <span>PRIORITY 10</span>
                  </div>
                </div>
              </div>

              {/* Warning Text */}
              <div className="flex gap-3 items-start p-3 bg-error-container/20 border border-error/20 rounded">
                <span className="material-symbols-outlined text-error text-[20px]">report</span>
                <p className="text-body-sm text-error opacity-90 leading-tight">
                  Manual override will recalculate fuel efficiency estimates for all downstream vessels. This action is logged for harbor audit.
                </p>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="bg-surface-container-lowest p-6 flex gap-4">
              <button onClick={() => setIsModalOpen(false)} className="flex-1 py-3 border border-outline-variant text-on-surface-variant font-bold hover:bg-surface-container-highest transition-all active:scale-95">
                CANCEL
              </button>
              <button 
                onClick={submitOverride}
                disabled={!overrideReason}
                className={`flex-[2] py-3 bg-primary text-on-primary font-bold shadow-[0_4px_12px_rgba(87,241,219,0.3)] transition-all active:scale-95 flex items-center justify-center gap-2 ${!overrideReason ? 'opacity-50 cursor-not-allowed' : 'hover:brightness-110'}`}
              >
                <span>CONFIRM MOVE</span>
                <span className="material-symbols-outlined text-[18px]">keyboard_double_arrow_up</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
