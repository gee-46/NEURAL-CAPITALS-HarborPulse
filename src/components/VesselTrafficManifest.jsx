import React, { useState, useMemo } from 'react';

const VesselTrafficManifest = ({ vessels = [] }) => {
  const [searchTerm, setSearchTerm] = useState('');

  // Add deterministic random speed based on vessel name and filter
  const processedVessels = useMemo(() => {
    return vessels
      .map(v => {
        const hash = v.name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
        return {
          ...v,
          // Speed 5-15 knots
          speed: 5 + (hash % 11)
        };
      })
      .filter(v => v.name.toLowerCase().includes(searchTerm.toLowerCase()));
  }, [vessels, searchTerm]);

  return (
    <div className="mt-8 glass-card rounded-lg border border-outline-variant p-6 bg-[#0B1120]/80 backdrop-blur-xl">
      <div className="flex justify-between items-end mb-6">
        <div>
          <h2 className="font-headline-md text-primary">Vessel Traffic Manifest</h2>
          <p className="text-on-surface-variant text-body-sm">Live AIS & Telemetry Data</p>
        </div>
        <div className="relative">
          <input 
            type="text" 
            placeholder="Search vessels..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="bg-surface-dim border border-outline focus:border-primary focus:ring-0 text-sm py-2 pl-10 pr-4 rounded-full font-data-mono text-on-surface placeholder:text-on-surface-variant/50 w-64 transition-all"
          />
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-sm">search</span>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-outline-variant/50 text-label-caps font-label-caps text-on-surface-variant">
              <th className="py-3 px-4 font-normal">Vessel Name</th>
              <th className="py-3 px-4 font-normal">Catch Type</th>
              <th className="py-3 px-4 font-normal">Speed</th>
              <th className="py-3 px-4 font-normal">Status</th>
              <th className="py-3 px-4 font-normal text-right">ETA (Wait Time)</th>
            </tr>
          </thead>
          <tbody className="font-data-mono text-sm">
            {processedVessels.map((vessel) => {
              const isBerthing = (vessel.distance || 5) < 2;
              return (
                <tr key={vessel.id} className="border-b border-outline-variant/20 hover:bg-surface-container/30 transition-colors">
                  <td className="py-4 px-4 font-bold text-on-surface">{vessel.name}</td>
                  <td className="py-4 px-4 text-tertiary tracking-widest text-[10px] uppercase">{vessel.cargo_type || "N/A"}</td>
                  <td className="py-4 px-4 text-on-surface-variant">{vessel.speed} KTS</td>
                  <td className="py-4 px-4">
                    <span className={`px-2 py-1 rounded text-[10px] font-bold tracking-wider ${isBerthing ? 'bg-[#57f1db]/20 text-[#57f1db]' : 'bg-primary/20 text-primary'}`}>
                      {isBerthing ? 'BERTHING' : 'INBOUND'}
                    </span>
                  </td>
                  <td className="py-4 px-4 text-right text-on-surface-variant">
                    {(vessel.wait_time || 0).toFixed(1)} HRS
                  </td>
                </tr>
              );
            })}
            {processedVessels.length === 0 && (
              <tr>
                <td colSpan="5" className="py-8 text-center text-on-surface-variant font-body-md italic">
                  No vessels matching query.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default VesselTrafficManifest;
