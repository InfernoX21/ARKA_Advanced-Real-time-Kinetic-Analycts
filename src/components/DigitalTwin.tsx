import React, { useState } from 'react';
import { 
  TrendingDown, 
  Clock, 
  Cpu, 
  CheckCircle, 
  ChevronRight,
  TrendingUp,
  Sliders,
  ShieldCheck
} from 'lucide-react';

export default function DigitalTwin() {
  const [forecastTime, setForecastTime] = useState<0 | 30 | 60 | 120>(30);

  // Future state predictions datasets based on forecast time frame
  const predictionData = {
    0: {
      averageDensity: '64%',
      congestionColor: 'text-amber-400',
      corridorQueue: 32,
      standardQueue: 34,
      flowSpeed: '32 km/h',
      statusMsg: 'Emergency corridor request received. Initializing 5G signals ahead of route J1.',
      efficiencyGain: '+0%'
    },
    30: {
      averageDensity: '48%',
      congestionColor: 'text-emerald-400',
      corridorQueue: 18,
      standardQueue: 36,
      flowSpeed: '48 km/h',
      statusMsg: 'Queue clearing phase active. Junctions A & B fully evacuated. Cross-traffic throttled.',
      efficiencyGain: '+42%'
    },
    60: {
      averageDensity: '35%',
      congestionColor: 'text-emerald-400',
      corridorQueue: 6,
      standardQueue: 41,
      flowSpeed: '58 km/h',
      statusMsg: 'Ambulance crossing Junction B. Junctions C & D clearing ahead of arrival segment.',
      efficiencyGain: '+78%'
    },
    120: {
      averageDensity: '21%',
      congestionColor: 'text-emerald-400',
      corridorQueue: 0,
      standardQueue: 48,
      flowSpeed: '72 km/h',
      statusMsg: 'Corridor triumphantly completed. Normal flow released back into Central Plaza.',
      efficiencyGain: '+142%'
    }
  };

  const currentPrediction = predictionData[forecastTime];

  return (
    <div className="bg-[#0F1115] border border-[#1F242E] p-5 rounded-xl flex flex-col gap-4 select-none h-full">
      
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <Cpu className="w-4 h-4 text-[#D9EF92]" />
          <h3 className="font-sans font-bold text-sm text-white uppercase tracking-wider">
            AI Digital Twin Simulation Predictor
          </h3>
        </div>
        
        {/* Toggle Timeline Buttons */}
        <div className="flex items-center gap-1 bg-[#10141D] border border-[#1F242E] p-1 rounded-lg">
          {(['0', '30', '60', '120'] as const).map((timeStr) => {
            const val = parseInt(timeStr) as 0 | 30 | 60 | 120;
            return (
              <button
                key={timeStr}
                onClick={() => setForecastTime(val)}
                className={`px-2.5 py-1 text-[9px] font-mono rounded-lg cursor-pointer transition-all ${
                  forecastTime === val 
                    ? 'bg-[#D9EF92] text-black font-semibold' 
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                {val === 0 ? 'CURRENT' : `+${val}s`}
              </button>
            );
          })}
        </div>
      </div>

      <p className="text-xs text-gray-400">
        Simulate future-state traffic dispersal to assess routing safety, wave coordination effectiveness, and alternate corridor efficiency.
      </p>

      {/* Comparative View Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 mt-1">
        
        {/* Metric Details Panel (Left Column) */}
        <div className="lg:col-span-4 bg-[#0A0C11] border border-[#1F242E] p-4 rounded-xl flex flex-col gap-3 justify-between">
          <div className="flex flex-col gap-1">
            <span className="text-[10px] font-mono text-gray-500 uppercase tracking-wider">PROJECTED INTEL SUMMARY</span>
            <div className="h-0.5 bg-[#1F242E] w-12 rounded mt-1 mb-2" />
          </div>

          <div className="flex flex-col gap-2.5 text-xs font-mono">
            <div className="flex justify-between border-b border-[#1F242E]/50 pb-1.5">
              <span className="text-gray-400">Network Density:</span>
              <span className="text-white font-bold">{currentPrediction.averageDensity}</span>
            </div>
            
            <div className="flex justify-between border-b border-[#1F242E]/50 pb-1.5">
              <span className="text-gray-400">Ambulance Speed:</span>
              <span className="text-[#D9EF92] font-bold">{currentPrediction.flowSpeed}</span>
            </div>

            <div className="flex justify-between border-b border-[#1F242E]/50 pb-1.5">
              <span className="text-gray-400">Travel Saved:</span>
              <span className="text-emerald-400 font-bold">{currentPrediction.efficiencyGain} More Saved</span>
            </div>
          </div>

          <div className="bg-[#121622] rounded-lg p-2.5 border border-[#1F242E]">
            <p className="text-[10px] font-sans text-gray-300 leading-relaxed italic">
              " {currentPrediction.statusMsg} "
            </p>
          </div>
        </div>

        {/* Dynamic Comparative Graph (Right Column) */}
        <div className="lg:col-span-8 bg-[#0A0C11] border border-[#1F242E] p-4 rounded-xl flex flex-col gap-4">
          <div className="flex items-center justify-between text-[10px] font-mono">
            <span className="text-gray-500 uppercase">Standard Dispatch vs. ARKA 5G Corridor Queue Count</span>
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-500" /> Standard</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[#D9EF92]" /> ARKA 5G</span>
            </div>
          </div>

          {/* Simple Highly Polished Canvas SVG Chart bars to prevent Recharts library crash issues */}
          <div className="flex flex-col gap-4 mt-1">
            {/* Standard Queue bar */}
            <div className="flex flex-col gap-1">
              <div className="flex justify-between text-[10px] font-mono">
                <span className="text-gray-400">Standard Emergency Dispatch Queue</span>
                <span className="text-red-400 font-bold">{currentPrediction.standardQueue} Cars Delayed</span>
              </div>
              <div className="h-6 bg-[#160D12] border border-red-950 rounded-lg overflow-hidden relative flex items-center pr-2">
                <div 
                  className="h-full bg-gradient-to-r from-red-600/30 to-red-500/80 transition-all duration-500" 
                  style={{ width: `${(currentPrediction.standardQueue / 50) * 100}%` }}
                />
                <span className="absolute left-3 text-[10px] font-mono text-white font-bold select-none">
                  Average Delay: +{currentPrediction.standardQueue * 3}s
                </span>
                <span className="ml-auto text-[10px] font-mono text-red-400 font-bold">
                  {currentPrediction.standardQueue}
                </span>
              </div>
            </div>

            {/* ARKA 5G Queue bar */}
            <div className="flex flex-col gap-1">
              <div className="flex justify-between text-[10px] font-mono">
                <span className="text-gray-400">ARKA 5G green corridor active</span>
                <span className="text-[#D9EF92] font-bold">
                  {currentPrediction.corridorQueue === 0 ? 'Queue Cleared' : `${currentPrediction.corridorQueue} Cars Queue`}
                </span>
              </div>
              <div className="h-6 bg-[#0E1515] border border-[#D9EF92]/20 rounded-lg overflow-hidden relative flex items-center pr-2">
                <div 
                  className="h-full bg-gradient-to-r from-[#D9EF92]/20 to-[#D9EF92]/90 transition-all duration-500" 
                  style={{ width: `${(currentPrediction.corridorQueue / 50) * 100}%` }}
                />
                <span className="absolute left-3 text-[10px] font-mono text-black font-extrabold select-none">
                  {currentPrediction.corridorQueue === 0 ? '⚡ OPTIMAL FREE-FLOW SEGMENT ACTIVE' : `Evacuating Ahead: ~${currentPrediction.corridorQueue * 1.5}s remaining`}
                </span>
                <span className="ml-auto text-[10px] font-mono text-[#D9EF92] font-bold">
                  {currentPrediction.corridorQueue}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1.5 text-[10px] font-mono text-gray-500 border-t border-[#1F242E]/70 pt-2.5">
            <CheckCircle className="w-3.5 h-3.5 text-[#D9EF92]" />
            <span>Digital Twin forecasts suggest alternative routing if density surpasses 92% on Junction C.</span>
          </div>

        </div>

      </div>

    </div>
  );
}
