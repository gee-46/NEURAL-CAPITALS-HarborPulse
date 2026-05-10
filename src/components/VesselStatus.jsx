import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';

const VesselStatus = () => {
  const { vesselId } = useParams();
  const [vesselData, setVesselData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000); // Update clock every minute
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!vesselId) return;

    // Use a real-time listener to track the vessel
    const docRef = doc(db, 'vessels', vesselId);
    const unsubscribe = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        setVesselData(docSnap.data());
      } else {
        console.error("Vessel not found");
      }
      setLoading(false);
    }, (error) => {
      console.error("Firebase listener error:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [vesselId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-surface flex flex-col items-center justify-center p-6">
        <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4 shadow-[0_0_15px_rgba(87,241,219,0.3)]"></div>
        <p className="text-primary font-data-mono animate-pulse uppercase tracking-widest">Establishing Secure Link...</p>
      </div>
    );
  }

  if (!vesselData) {
    return (
      <div className="min-h-screen bg-surface flex flex-col items-center justify-center p-6 text-center">
        <span className="material-symbols-outlined text-error text-6xl mb-4">error</span>
        <h2 className="text-on-surface font-headline-md mb-2">Vessel Link Lost</h2>
        <p className="text-on-surface-variant text-body-md">Unable to synchronize with Vessel ID: {vesselId}</p>
      </div>
    );
  }

  const { current_rank = 0, priority_score = 0, distance = 0, status = 'unknown', name = 'Vessel' } = vesselData;
  const rank = current_rank;

  // Calculate ETA: current time + 15 minutes per rank position
  const calculateETA = (rankPos) => {
    if (!rankPos || rankPos <= 0) return "--:--";
    const etaDate = new Date(currentTime.getTime() + rankPos * 15 * 60000);
    return etaDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }) + " UTC";
  };

  // Stage Logic
  // Stage 1: Pulse Zone (Active when distance < 15km)
  // Stage 2: Queued (Active when rank is assigned)
  // Stage 3: Docking Authorized (Active when rank is #1 and distance < 1km)
  const isStage1Active = distance < 15;
  const isStage2Active = rank > 0;
  const isStage3Active = rank === 1 && distance < 1;

  return (
    <div className="min-h-screen bg-[#0b1326] text-[#dae2fd] font-inter flex flex-col p-6 safe-top overflow-x-hidden dark relative">
      {/* HUD Background elements */}
      <div className="fixed inset-0 pointer-events-none opacity-10">
        <div className="absolute top-0 left-0 w-full h-full bg-[linear-gradient(rgba(87,241,219,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(87,241,219,0.05)_1px,transparent_1px)] bg-[size:40px_40px]"></div>
      </div>

      {/* Header */}
      <header className="flex justify-between items-start mb-12 relative z-10">
        <div>
          <h1 className="text-[#57f1db] font-jetbrains font-bold text-lg tracking-tight uppercase">{name}</h1>
          <p className="text-[#bacac5] font-jetbrains text-[10px] tracking-widest opacity-70">ID: {vesselId.substring(0, 8)}...</p>
        </div>
        <div className="bg-[#171f33] border border-[#3c4a46] px-3 py-1 rounded-full flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-[#57f1db] animate-pulse shadow-[0_0_8px_#57f1db]"></div>
          <span className="text-[#57f1db] font-jetbrains text-[10px] font-bold tracking-widest">LIVE SYNC</span>
        </div>
      </header>

      {/* Massive Rank Display */}
      <main className="flex-1 flex flex-col items-center justify-center text-center py-8 relative z-10">
        <div className="relative mb-4">
           {/* Outer Glow Ring */}
          <div className="absolute inset-0 m-auto w-48 h-48 bg-[#57f1db]/5 rounded-full blur-3xl animate-pulse"></div>
          
          <h2 className="text-[#bacac5] font-jetbrains font-bold text-[12px] tracking-[0.2em] mb-4 uppercase opacity-80">
            YOUR CURRENT QUEUE POSITION
          </h2>
          
          <div className="relative inline-block">
            <span className="text-[120px] leading-none font-jetbrains font-bold text-[#57f1db] drop-shadow-[0_0_30px_rgba(87,241,219,0.5)]">
              {rank > 0 ? rank.toString().padStart(2, '0') : '--'}
            </span>
            <div className="absolute -bottom-2 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[#57f1db] to-transparent opacity-50"></div>
          </div>
        </div>

        {/* ETA Section */}
        <div className="mt-12 bg-[#131b2e]/80 backdrop-blur-md border border-[#3c4a46] rounded-xl p-6 w-full max-w-sm shadow-xl">
          <p className="text-[#bacac5] font-jetbrains text-[10px] tracking-widest uppercase mb-2">ESTIMATED DOCKING TIME</p>
          <div className="flex items-center justify-center gap-4">
             <span className="material-symbols-outlined text-[#ffb4ab]">schedule</span>
             <span className="text-3xl font-jetbrains font-bold text-white tracking-wider">
               {calculateETA(rank)}
             </span>
          </div>
          <div className="mt-4 pt-4 border-t border-[#3c4a46]/30 grid grid-cols-2 gap-4">
            <div>
              <p className="text-[#bacac5] text-[9px] uppercase tracking-widest mb-1">DISTANCE</p>
              <p className="text-white font-jetbrains font-bold">{distance.toFixed(1)} KM</p>
            </div>
            <div>
              <p className="text-[#bacac5] text-[9px] uppercase tracking-widest mb-1">PRIORITY</p>
              <p className="text-[#57f1db] font-jetbrains font-bold">{priority_score.toFixed(1)}</p>
            </div>
          </div>
        </div>
      </main>

      {/* Progress Tracker (Journey Bar) */}
      <footer className="mt-auto py-8 relative z-10">
        <div className="w-full">
          <div className="flex justify-between mb-4 px-2">
             <div className={`flex flex-col items-center gap-1 ${isStage1Active ? 'opacity-100' : 'opacity-30'}`}>
                <span className={`material-symbols-outlined text-sm ${isStage1Active ? 'text-[#57f1db]' : ''}`}>radar</span>
                <span className="text-[8px] font-jetbrains font-bold tracking-tighter uppercase">Pulse Zone</span>
             </div>
             <div className={`flex flex-col items-center gap-1 ${isStage2Active ? 'opacity-100' : 'opacity-30'}`}>
                <span className={`material-symbols-outlined text-sm ${isStage2Active ? 'text-[#57f1db]' : ''}`}>assignment</span>
                <span className="text-[8px] font-jetbrains font-bold tracking-tighter uppercase">Queued</span>
             </div>
             <div className={`flex flex-col items-center gap-1 ${isStage3Active ? 'opacity-100' : 'opacity-30'}`}>
                <span className={`material-symbols-outlined text-sm ${isStage3Active ? 'text-[#ffb4ab]' : ''}`}>anchor</span>
                <span className="text-[8px] font-jetbrains font-bold tracking-tighter uppercase">Authorized</span>
             </div>
          </div>

          <div className="relative h-2 bg-[#171f33] rounded-full overflow-hidden border border-[#3c4a46]/50">
            {/* Stage 1 Progress */}
            <div 
              className={`absolute left-0 h-full transition-all duration-1000 bg-gradient-to-r from-transparent to-[#57f1db] ${isStage1Active ? 'w-1/3 shadow-[0_0_10px_#57f1db]' : 'w-0'}`}
            ></div>
            {/* Stage 2 Progress */}
            <div 
              className={`absolute left-1/3 h-full transition-all duration-1000 bg-gradient-to-r from-[#57f1db] to-[#57f1db] ${isStage2Active ? 'w-1/3 shadow-[0_0_10px_#57f1db]' : 'w-0'}`}
            ></div>
            {/* Stage 3 Progress */}
            <div 
              className={`absolute left-2/3 h-full transition-all duration-1000 bg-gradient-to-r from-[#57f1db] to-[#ffb4ab] ${isStage3Active ? 'w-1/3 shadow-[0_0_10px_#ffb4ab]' : 'w-0'}`}
            ></div>
          </div>
          
          <div className="flex justify-between mt-2 text-[8px] font-jetbrains text-[#bacac5] opacity-50 px-1">
            <span>15KM</span>
            <span>ASSIGNED</span>
            <span>{"< 1KM"}</span>
          </div>
        </div>

        {/* Emergency Alert Context */}
        {vesselData.is_emergency && (
          <div className="mt-8 bg-[#93000a]/20 border border-[#ffb4ab]/50 p-4 rounded-lg flex items-center gap-4 animate-pulse">
            <span className="material-symbols-outlined text-[#ffb4ab] text-2xl">warning</span>
            <div>
              <p className="text-[#ffb4ab] font-jetbrains font-bold text-xs uppercase tracking-widest">Emergency Protocol Active</p>
              <p className="text-[#ffb4ab]/80 text-[10px]">Priority override confirmed by Harbor Master. Maintain standard approach speed.</p>
            </div>
          </div>
        )}
      </footer>
    </div>
  );
};

export default VesselStatus;
