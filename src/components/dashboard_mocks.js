import { useState, useEffect } from 'react';

export function useDashboardMocks() {
  const [wind, setWind] = useState(12.4);
  const [tide, setTide] = useState(0.82);
  const [radarDots, setRadarDots] = useState([]);
  const [activeAlerts, setActiveAlerts] = useState('01');
  const [harborLoad, setHarborLoad] = useState(84);
  const [smsLog, setSmsLog] = useState([
    { id: 1, time: "14:28:45", source: "INC_PING_7", message: "PING: MV Rajan approaching Sector 7", isPrimary: true },
    { id: 2, time: "14:25:12", source: "VESS_ID_4423", message: "PING: Vessel ID 4423 holding at buoy" },
    { id: 3, time: "14:20:01", source: "SYS_WEATHER", message: "PING: Emergency update: Weather clear" },
    { id: 4, time: "14:15:33", source: "BERTH_MOD", message: "ACK: Berth 12 pre-clearance established" },
    { id: 5, time: "14:02:10", source: "PILOT_DISPATCH", message: "LOG: Pilot boat #4 engaged for Sea Wolf" },
    { id: 6, time: "13:55:45", source: "CMD_AUTH", message: "SYS: Sector 7 command override enabled" }
  ]);
  
  // Three orange dots starting positions
  const [orangeDots, setOrangeDots] = useState([
    { id: 'o1', top: 15, left: 20 },
    { id: 'o2', top: 80, left: 15 },
    { id: 'o3', top: 75, left: 80 }
  ]);

  useEffect(() => {
    // Escalate to 2 alerts after 15 seconds to simulate harbor congestion intelligence
    const alertTimer = setTimeout(() => {
      setActiveAlerts('02');
      setHarborLoad(87);
      
      const now = new Date();
      const timeStr = `${now.getHours()}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;
      
      setSmsLog(prev => [{
        id: Date.now(),
        time: timeStr,
        source: "SYS_ALERT",
        message: "SECTOR 7 PEAK LOAD DETECTED - REROUTING SUGGESTED",
        isPrimary: true
      }, ...prev]);
    }, 15000);

    // Start 60-second inward movement for orange dots immediately after mount
    const moveTimer = setTimeout(() => {
      setOrangeDots(prev => prev.map(dot => ({
        ...dot,
        top: dot.top > 50 ? dot.top - 20 : dot.top + 20,
        left: dot.left > 50 ? dot.left - 20 : dot.left + 20,
      })));
    }, 100);
    // Generate 10 random radar dots for the mock map
    const generateDots = () => {
      const dots = [];
      for (let i = 0; i < 10; i++) {
        dots.push({
          id: i,
          top: 20 + Math.random() * 60, // Keep them somewhat centered
          left: 20 + Math.random() * 60,
          opacity: 0.2 + Math.random() * 0.8
        });
      }
      setRadarDots(dots);
    };
    generateDots();

    const intervalId = setInterval(() => {
      // Wind: Randomize between 10.0 and 15.0
      const newWind = (10.0 + Math.random() * 5.0).toFixed(1);
      setWind(newWind);

      // Tide: Randomize between +0.80 and +0.95
      const newTide = (0.80 + Math.random() * 0.15).toFixed(2);
      setTide(newTide);
      
      // Animate the radar dots opacities to simulate a sweeping pulse
      setRadarDots(prev => prev.map(dot => ({
        ...dot,
        opacity: 0.2 + Math.random() * 0.8
      })));
    }, 5000);

    return () => {
      clearInterval(intervalId);
      clearTimeout(alertTimer);
      clearTimeout(moveTimer);
    };
  }, []);

  return { wind, tide, radarDots, activeAlerts, orangeDots, harborLoad, smsLog };
}
