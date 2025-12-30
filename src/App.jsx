import { useState, useEffect, useRef } from 'react';
import { ComposedChart, Area, Line, XAxis, YAxis, CartesianGrid, ReferenceLine, ResponsiveContainer } from 'recharts';

const segmentTypes = {
  warmup: { label: 'WARM UP', color: '#22c55e', bgColor: 'rgba(34, 197, 94, 0.2)' },
  recover: { label: 'RECOVER', color: '#3b82f6', bgColor: 'rgba(59, 130, 246, 0.2)' },
  sprint: { label: 'SPRINT!', color: '#ef4444', bgColor: 'rgba(239, 68, 68, 0.2)' },
  climb: { label: 'CLIMB', color: '#f97316', bgColor: 'rgba(249, 115, 22, 0.2)' },
  steady: { label: 'STEADY', color: '#8b5cf6', bgColor: 'rgba(139, 92, 246, 0.2)' },
  cooldown: { label: 'COOL DOWN', color: '#06b6d4', bgColor: 'rgba(6, 182, 212, 0.2)' },
  stand: { label: 'STAND!', color: '#ec4899', bgColor: 'rgba(236, 72, 153, 0.2)' },
};

function generateWorkout(type, durationMins) {
  const segments = [];
  const totalSeconds = durationMins * 60;
  const warmupTime = Math.min(60, Math.floor(totalSeconds * 0.1));
  const cooldownTime = Math.floor(totalSeconds * 0.1);
  const mainTime = totalSeconds - warmupTime - cooldownTime;
  
  segments.push({ type: 'warmup', duration: warmupTime, resistance: 12, rpm: 80 });
  
  if (type === 'recovery') {
    const hillCount = Math.floor(mainTime / 180);
    for (let i = 0; i < hillCount; i++) {
      segments.push({ type: 'steady', duration: 120, resistance: 14 + (i % 3) * 2, rpm: 75 + (i % 2) * 5 });
      segments.push({ type: 'recover', duration: 60, resistance: 12, rpm: 70 });
    }
  } else if (type === 'hiit') {
    const intervalCount = Math.floor(mainTime / 60);
    for (let i = 0; i < intervalCount; i++) {
      if (i % 4 < 2) {
        segments.push({ type: 'sprint', duration: 30, resistance: 18, rpm: 100 });
        segments.push({ type: 'recover', duration: 30, resistance: 12, rpm: 70 });
      } else {
        segments.push({ type: 'sprint', duration: 20, resistance: 22, rpm: 95 });
        segments.push({ type: 'recover', duration: 40, resistance: 10, rpm: 65 });
      }
    }
  } else if (type === 'strength') {
    const climbCount = Math.floor(mainTime / 120);
    for (let i = 0; i < climbCount; i++) {
      const baseRes = 25 + (i % 4) * 5;
      segments.push({ type: 'climb', duration: 60, resistance: baseRes, rpm: 60 });
      if (i % 2 === 0) {
        segments.push({ type: 'stand', duration: 20, resistance: baseRes + 5, rpm: 55 });
        segments.push({ type: 'recover', duration: 40, resistance: 15, rpm: 75 });
      } else {
        segments.push({ type: 'recover', duration: 60, resistance: 15, rpm: 80 });
      }
    }
  } else if (type === 'endurance') {
    const blockCount = Math.floor(mainTime / 240);
    for (let i = 0; i < blockCount; i++) {
      segments.push({ type: 'steady', duration: 90, resistance: 18, rpm: 85 });
      segments.push({ type: 'steady', duration: 90, resistance: 22, rpm: 88 });
      segments.push({ type: 'recover', duration: 60, resistance: 14, rpm: 75 });
    }
  }
  
  segments.push({ type: 'cooldown', duration: cooldownTime, resistance: 10, rpm: 70 });
  return segments;
}

function formatTime(seconds) {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

function speak(text) {
  if ('speechSynthesis' in window) {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.1;
    utterance.volume = 1;
    speechSynthesis.speak(utterance);
  }
}

function WorkoutSelect({ onStart }) {
  const [selectedType, setSelectedType] = useState(null);
  const [selectedDuration, setSelectedDuration] = useState(null);
  
  const workoutTypes = [
    { id: 'recovery', name: 'Recovery Ride', desc: 'Easy pace, gentle rolling hills', icon: '🌊' },
    { id: 'hiit', name: 'High Intensity', desc: 'Sprint intervals, max effort', icon: '⚡' },
    { id: 'strength', name: 'Strength', desc: 'Heavy climbs, build power', icon: '🏔️' },
    { id: 'endurance', name: 'Endurance', desc: 'Sustained effort, build stamina', icon: '🎯' },
  ];
  
  const durations = [20, 30, 45, 60];
  
  return (
    <div className="min-h-screen bg-gray-900 text-white p-6 flex flex-col">
      <h1 className="text-3xl font-bold text-center mb-8">Spin Workout</h1>
      
      <div className="mb-8">
        <h2 className="text-xl mb-4 text-gray-400">Select Workout Type</h2>
        <div className="grid grid-cols-2 gap-4">
          {workoutTypes.map(t => (
            <button
              key={t.id}
              onClick={() => setSelectedType(t.id)}
              className={`p-4 rounded-xl text-left transition-all ${
                selectedType === t.id 
                  ? 'bg-blue-600 ring-2 ring-blue-400' 
                  : 'bg-gray-800 hover:bg-gray-700'
              }`}
            >
              <div className="text-3xl mb-2">{t.icon}</div>
              <div className="font-semibold text-lg">{t.name}</div>
              <div className="text-sm text-gray-400">{t.desc}</div>
            </button>
          ))}
        </div>
      </div>
      
      <div className="mb-8">
        <h2 className="text-xl mb-4 text-gray-400">Select Duration</h2>
        <div className="flex gap-4">
          {durations.map(d => (
            <button
              key={d}
              onClick={() => setSelectedDuration(d)}
              className={`flex-1 py-4 rounded-xl text-xl font-bold transition-all ${
                selectedDuration === d 
                  ? 'bg-blue-600 ring-2 ring-blue-400' 
                  : 'bg-gray-800 hover:bg-gray-700'
              }`}
            >
              {d} min
            </button>
          ))}
        </div>
      </div>
      
      <button
        onClick={() => selectedType && selectedDuration && onStart(selectedType, selectedDuration)}
        disabled={!selectedType || !selectedDuration}
        className={`mt-auto py-5 rounded-xl text-2xl font-bold transition-all ${
          selectedType && selectedDuration
            ? 'bg-green-600 hover:bg-green-500'
            : 'bg-gray-700 text-gray-500 cursor-not-allowed'
        }`}
      >
        Start Workout
      </button>
    </div>
  );
}

function ActiveWorkout({ workoutType, duration, onEnd }) {
  const [segments] = useState(() => generateWorkout(workoutType, duration));
  const [elapsed, setElapsed] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const lastSegmentRef = useRef(-1);
  
  const segmentTimes = segments.reduce((acc, seg, i) => {
    const start = i === 0 ? 0 : acc[i - 1].end;
    acc.push({ start, end: start + seg.duration });
    return acc;
  }, []);
  
  const totalDuration = segmentTimes[segmentTimes.length - 1].end;
  
  const currentSegmentIndex = segmentTimes.findIndex(t => elapsed >= t.start && elapsed < t.end);
  const currentSegment = segments[currentSegmentIndex] || segments[segments.length - 1];
  const currentTimes = segmentTimes[currentSegmentIndex] || segmentTimes[segmentTimes.length - 1];
  const timeLeftInSegment = currentTimes.end - elapsed;
  const timeLeft = totalDuration - elapsed;
  
  // Build chart data
  const allChartData = segments.map((seg, i) => ({
    index: i,
    name: formatTime(segmentTimes[i].start),
    resistance: seg.resistance,
    rpm: seg.rpm,
    type: seg.type,
    isCurrent: i === currentSegmentIndex,
  }));
  
  // Sliding window: show max 12 transitions, centered around current position
  const maxVisible = 12;
  const windowStart = Math.max(0, Math.min(
    currentSegmentIndex - Math.floor(maxVisible / 4),
    segments.length - maxVisible
  ));
  const windowEnd = Math.min(segments.length, windowStart + maxVisible);
  const chartData = allChartData.slice(windowStart, windowEnd);
  
  // Calculate dynamic axis ranges based on visible window
  const visibleSegments = segments.slice(windowStart, windowEnd);
  const resistances = visibleSegments.map(s => s.resistance);
  const rpms = visibleSegments.map(s => s.rpm);
  const minRes = Math.max(0, Math.floor(Math.min(...resistances) / 5) * 5);
  const maxRes = Math.ceil((Math.max(...resistances) + 5) / 5) * 5;
  const minRpm = Math.max(0, Math.floor((Math.min(...rpms) - 5) / 10) * 10);
  const maxRpm = Math.ceil((Math.max(...rpms) + 10) / 10) * 10;
  
  useEffect(() => {
    if (isPaused || elapsed >= totalDuration) return;
    const interval = setInterval(() => setElapsed(e => e + 1), 1000);
    return () => clearInterval(interval);
  }, [isPaused, elapsed, totalDuration]);
  
  useEffect(() => {
    if (currentSegmentIndex !== lastSegmentRef.current && currentSegmentIndex >= 0) {
      lastSegmentRef.current = currentSegmentIndex;
      if (!isMuted) {
        const seg = segments[currentSegmentIndex];
        const typeInfo = segmentTypes[seg.type];
        speak(typeInfo.label);
      }
    }
  }, [currentSegmentIndex, segments, isMuted]);
  
  if (elapsed >= totalDuration) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center justify-center p-6">
        <div className="text-6xl mb-4">🎉</div>
        <h1 className="text-4xl font-bold mb-4">Workout Complete!</h1>
        <p className="text-xl text-gray-400 mb-8">{duration} minute {workoutType} ride finished</p>
        <button onClick={onEnd} className="px-8 py-4 bg-blue-600 rounded-xl text-xl font-bold">
          Done
        </button>
      </div>
    );
  }
  
  const typeInfo = segmentTypes[currentSegment.type];
  
  return (
    <div className="h-screen bg-gray-900 text-white flex overflow-hidden">
      {/* Left Panel */}
      <div className="w-80 bg-gray-800 p-4 flex flex-col shrink-0 h-full overflow-hidden">
        <div className="bg-gray-700/50 rounded-lg p-3 mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-400 text-xs uppercase tracking-widest">{workoutType}</span>
            <span className="text-gray-500 text-xs">{duration} min</span>
          </div>
          <div className="text-6xl font-mono font-bold tracking-tight">{formatTime(timeLeft)}</div>
        </div>
        
        <div className="flex gap-4 mb-6">
          <div className="flex-1 bg-gray-700/30 rounded-lg p-3 text-center">
            <div className="text-gray-500 text-xs uppercase tracking-wide mb-1">res</div>
            <div className="text-4xl font-bold">{currentSegment.resistance}</div>
          </div>
          <div className="flex-1 bg-gray-700/30 rounded-lg p-3 text-center">
            <div className="text-gray-500 text-xs uppercase tracking-wide mb-1">rpm</div>
            <div className="text-4xl font-bold">{currentSegment.rpm}</div>
          </div>
        </div>
        
        <div className="text-gray-400 text-sm mb-2">transitions</div>
        <div className="flex-1 overflow-auto space-y-2 min-h-0 pr-1" style={{ scrollbarWidth: 'thin', scrollbarColor: '#4b5563 transparent' }}>
          {segments.map((seg, i) => {
            const times = segmentTimes[i];
            const isCurrent = i === currentSegmentIndex;
            const isPast = elapsed >= times.end;
            const info = segmentTypes[seg.type];
            
            return (
              <div
                key={i}
                onClick={() => setElapsed(times.start)}
                className={`p-3 rounded-lg flex items-center gap-3 transition-all cursor-pointer hover:brightness-125 ${isPast ? 'opacity-40' : ''}`}
                style={{ 
                  backgroundColor: isCurrent ? info.bgColor : 'rgba(55, 65, 81, 0.5)',
                  borderLeft: isCurrent ? `4px solid ${info.color}` : '4px solid transparent'
                }}
              >
                <div className="flex-1">
                  <div className="text-xs text-gray-400">{formatTime(times.start)}</div>
                  <div className="font-bold" style={{ color: info.color }}>{info.label}</div>
                </div>
                <div className="text-right text-sm">
                  <div className="font-bold" style={{ color: isCurrent ? '#fbbf24' : '#9ca3af' }}>
                    {isCurrent ? formatTime(timeLeftInSegment) : formatTime(seg.duration)}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        
        <div className="flex gap-2 mt-4">
          <button onClick={() => setIsPaused(!isPaused)} className="flex-1 py-3 rounded-lg bg-gray-700 font-bold">
            {isPaused ? '▶ Resume' : '⏸ Pause'}
          </button>
          <button onClick={() => setIsMuted(!isMuted)} className={`px-4 py-3 rounded-lg ${isMuted ? 'bg-red-600' : 'bg-gray-700'}`}>
            {isMuted ? '🔇' : '🔊'}
          </button>
          <button onClick={onEnd} className="px-4 py-3 rounded-lg bg-gray-700">✕</button>
        </div>
      </div>
      
      {/* Right Panel - Chart */}
      <div className="flex-1 px-1 py-2 flex flex-col min-w-0">
        <div 
          className="text-center py-2 px-4 rounded-lg mb-2 text-xl font-bold shrink-0"
          style={{ backgroundColor: typeInfo.bgColor, color: typeInfo.color, borderLeft: `4px solid ${typeInfo.color}` }}
        >
          {typeInfo.label} — {currentSegment.resistance} res @ {currentSegment.rpm} rpm
        </div>
        
        <div className="flex-1 min-h-0">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={chartData} margin={{ top: 10, right: 35, bottom: 10, left: 0 }}>
              <defs>
                <linearGradient id="resistanceGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#f97316" stopOpacity={0.25}/>
                  <stop offset="100%" stopColor="#f97316" stopOpacity={0.05}/>
                </linearGradient>
              </defs>
              <CartesianGrid 
                strokeDasharray="3 3" 
                stroke="#ffffff" 
                strokeOpacity={0.08}
                vertical={false}
              />
              <XAxis 
                dataKey="name" 
                tick={{ fill: '#6b7280', fontSize: 10 }} 
                axisLine={{ stroke: '#374151' }}
                tickLine={false}
                interval={Math.max(0, Math.floor(chartData.length / 6) - 1)}
              />
              <YAxis 
                yAxisId="resistance" 
                domain={[minRes, maxRes]} 
                tick={{ fill: '#fb923c', fontSize: 11 }} 
                axisLine={false}
                tickLine={false}
                width={30}
              />
              <YAxis 
                yAxisId="rpm" 
                orientation="right" 
                domain={[minRpm, maxRpm]} 
                tick={{ fill: '#a78bfa', fontSize: 11 }} 
                axisLine={false}
                tickLine={false}
                width={30}
              />
              <Area
                yAxisId="resistance"
                type="stepAfter"
                dataKey="resistance"
                stroke="none"
                fill="url(#resistanceGradient)"
                isAnimationActive={true}
                animationDuration={500}
                animationEasing="ease-in-out"
              />
              <Line 
                yAxisId="rpm" 
                type="monotone" 
                dataKey="rpm" 
                stroke="#a78bfa" 
                strokeWidth={2}
                dot={false}
                isAnimationActive={true}
                animationDuration={500}
                animationEasing="ease-in-out"
              />
              {currentSegmentIndex >= windowStart && currentSegmentIndex < windowEnd && (
                <ReferenceLine
                  yAxisId="resistance"
                  x={chartData[currentSegmentIndex - windowStart]?.name}
                  stroke="#22c55e"
                  strokeWidth={2}
                  strokeOpacity={0.7}
                />
              )}
            </ComposedChart>
          </ResponsiveContainer>
        </div>
        
        <div className="flex justify-center gap-6 text-xs py-1 shrink-0">
          <span className="text-orange-400/70">resistance</span>
          <span className="text-purple-400">rpm</span>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  const [screen, setScreen] = useState('select');
  const [workoutConfig, setWorkoutConfig] = useState(null);
  
  const handleStart = (type, duration) => {
    setWorkoutConfig({ type, duration });
    setScreen('workout');
  };
  
  const handleEnd = () => {
    setScreen('select');
    setWorkoutConfig(null);
  };
  
  if (screen === 'workout' && workoutConfig) {
    return <ActiveWorkout workoutType={workoutConfig.type} duration={workoutConfig.duration} onEnd={handleEnd} />;
  }
  
  return <WorkoutSelect onStart={handleStart} />;
}
