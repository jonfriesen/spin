import { useState, useEffect, useRef, useMemo } from 'react';
import { useWakeLock } from './useWakeLock';

const segmentTypes = {
  warmup:   { label: 'WARM UP',   cue: 'Light spin, get loose',        color: '#22c55e', bgColor: 'rgba(34, 197, 94, 0.15)' },
  recover:  { label: 'RECOVER',   cue: 'Easy spin, catch your breath',  color: '#3b82f6', bgColor: 'rgba(59, 130, 246, 0.12)' },
  sprint:   { label: 'SPRINT!',   cue: 'All out \u2014 max effort',     color: '#ef4444', bgColor: 'rgba(239, 68, 68, 0.15)' },
  climb:    { label: 'CLIMB',     cue: 'Heavy resistance, grind it',    color: '#f97316', bgColor: 'rgba(249, 115, 22, 0.13)' },
  steady:   { label: 'STEADY',    cue: 'Moderate effort, hold pace',    color: '#8b5cf6', bgColor: 'rgba(139, 92, 246, 0.12)' },
  cooldown: { label: 'COOL DOWN', cue: 'Easy pace, bring it down',      color: '#06b6d4', bgColor: 'rgba(6, 182, 212, 0.12)' },
  stand:    { label: 'STAND!',    cue: 'Out of the saddle, push',       color: '#ec4899', bgColor: 'rgba(236, 72, 153, 0.13)' },
};

function generateWorkout(type, durationMins) {
  const segments = [];
  const totalSeconds = durationMins * 60;
  const warmupTime = Math.min(60, Math.floor(totalSeconds * 0.1));
  const cooldownTime = Math.min(60, Math.floor(totalSeconds * 0.1));
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
  
  // Absorb any remaining time into a final recovery segment
  const usedTime = segments.reduce((sum, s) => sum + s.duration, 0) + cooldownTime;
  const remainingTime = totalSeconds - usedTime;
  if (remainingTime > 0 && segments.length > 1) {
    segments[segments.length - 1].duration += remainingTime;
  }

  segments.push({ type: 'cooldown', duration: cooldownTime, resistance: 10, rpm: 70 });
  return segments;
}

function formatTime(seconds) {
  const total = Math.floor(seconds);
  const mins = Math.floor(total / 60);
  const secs = total % 60;
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
    <div className="bg-gray-900 text-white p-4 sm:p-6 flex flex-col relative" style={{ height: '100%', maxHeight: '100%', overflow: 'auto' }}>
      <h1 className="text-2xl sm:text-3xl font-bold text-center mb-6 sm:mb-8">Spin Workout</h1>
      
      <div className="mb-6 sm:mb-8">
        <h2 className="text-lg sm:text-xl mb-3 sm:mb-4 text-gray-400">Select Workout Type</h2>
        <div className="grid grid-cols-2 gap-3 sm:gap-4">
          {workoutTypes.map(t => (
            <button
              key={t.id}
              onClick={() => setSelectedType(t.id)}
              className={`p-3 sm:p-4 rounded-xl text-left transition-all ${
                selectedType === t.id 
                  ? 'bg-blue-600 ring-2 ring-blue-400' 
                  : 'bg-gray-800 hover:bg-gray-700'
              }`}
            >
              <div className="text-2xl sm:text-3xl mb-1 sm:mb-2">{t.icon}</div>
              <div className="font-semibold text-base sm:text-lg">{t.name}</div>
              <div className="text-xs sm:text-sm text-gray-400">{t.desc}</div>
            </button>
          ))}
        </div>
      </div>
      
      <div className="mb-6 sm:mb-8">
        <h2 className="text-lg sm:text-xl mb-3 sm:mb-4 text-gray-400">Select Duration</h2>
        <div className="grid grid-cols-4 gap-3 sm:gap-4">
          {durations.map(d => (
            <button
              key={d}
              onClick={() => setSelectedDuration(d)}
              className={`py-3 sm:py-4 rounded-xl text-base sm:text-xl font-bold transition-all text-center ${
                selectedDuration === d 
                  ? 'bg-blue-600 ring-2 ring-blue-400' 
                  : 'bg-gray-800 hover:bg-gray-700'
              }`}
            >
              {d}<span className="block text-xs sm:text-sm font-normal opacity-60">min</span>
            </button>
          ))}
        </div>
      </div>
      
      <button
        onClick={() => selectedType && selectedDuration && onStart(selectedType, selectedDuration)}
        disabled={!selectedType || !selectedDuration}
        className={`mt-auto py-4 sm:py-5 rounded-xl text-xl sm:text-2xl font-bold transition-all ${
          selectedType && selectedDuration
            ? 'bg-green-600 hover:bg-green-500'
            : 'bg-gray-700 text-gray-500 cursor-not-allowed'
        }`}
      >
        Start Workout
      </button>

      <div className="absolute top-2 right-3 text-xs text-gray-700 font-mono select-none">
        {__GIT_COMMIT_HASH__}
      </div>
    </div>
  );
}

function ActiveWorkout({ workoutType, duration, onEnd }) {
  const [segments] = useState(() => generateWorkout(workoutType, duration));
  const [elapsed, setElapsed] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const lastSegmentRef = useRef(-1);
  const lastFrameTime = useRef(null);
  const isMutedRef = useRef(isMuted);
  isMutedRef.current = isMuted;

  const segmentTimes = useMemo(() => segments.reduce((acc, seg, i) => {
    const start = i === 0 ? 0 : acc[i - 1].end;
    acc.push({ start, end: start + seg.duration });
    return acc;
  }, []), [segments]);

  const totalDuration = segmentTimes[segmentTimes.length - 1].end;
  const isComplete = elapsed >= totalDuration;

  // Keep screen awake during workout (when not paused and not complete)
  useWakeLock(!isPaused && !isComplete);

  const currentSegmentIndex = segmentTimes.findIndex(t => elapsed >= t.start && elapsed < t.end);
  const currentSegment = segments[currentSegmentIndex] || segments[segments.length - 1];
  const currentTimes = segmentTimes[currentSegmentIndex] || segmentTimes[segmentTimes.length - 1];
  const timeLeftInSegment = Math.max(0, currentTimes.end - elapsed);
  const timeLeft = Math.max(0, totalDuration - elapsed);
  
  // Segment progress as percentage
  const segmentProgress = currentSegmentIndex >= 0
    ? (elapsed - currentTimes.start) / Math.max(1, currentTimes.end - currentTimes.start)
    : 0;

  // Upcoming segments for the "coming up" panel
  const upcomingSegments = segments.slice(currentSegmentIndex + 1, currentSegmentIndex + 5);
  const upcomingTimes = segmentTimes.slice(currentSegmentIndex + 1, currentSegmentIndex + 5);

  
  useEffect(() => {
    if (isPaused || isComplete) return;
    lastFrameTime.current = null;
    let raf;
    const tick = (now) => {
      if (lastFrameTime.current != null) {
        const dt = (now - lastFrameTime.current) / 1000;
        setElapsed(e => Math.min(e + dt, totalDuration));
      }
      lastFrameTime.current = now;
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [isPaused, isComplete]);
  
  useEffect(() => {
    if (currentSegmentIndex !== lastSegmentRef.current && currentSegmentIndex >= 0) {
      lastSegmentRef.current = currentSegmentIndex;
      if (!isMutedRef.current) {
        const seg = segments[currentSegmentIndex];
        const typeInfo = segmentTypes[seg.type];
        speak(typeInfo.label);
      }
    }
  }, [currentSegmentIndex, segments]);
  
  // Sync <html> background with segment color so safe-area padding matches
  useEffect(() => {
    const color = isComplete ? '#111827' : segmentTypes[currentSegment.type].bgColor;
    document.documentElement.style.backgroundColor = color;
    document.documentElement.style.transition = 'background-color 500ms';
    return () => { document.documentElement.style.backgroundColor = ''; document.documentElement.style.transition = ''; };
  }, [currentSegment.type, isComplete]);

  if (isComplete) {
    return (
      <div className="bg-gray-900 text-white flex flex-col items-center justify-center p-6" style={{ height: '100%', maxHeight: '100%' }}>
        <div className="text-5xl sm:text-6xl mb-4">🎉</div>
        <h1 className="text-3xl sm:text-4xl font-bold mb-4 text-center">Workout Complete!</h1>
        <p className="text-lg sm:text-xl text-gray-400 mb-8 text-center">{duration} minute {workoutType} ride finished</p>
        <button onClick={onEnd} className="px-8 py-4 bg-blue-600 rounded-xl text-lg sm:text-xl font-bold">
          Done
        </button>
      </div>
    );
  }
  
  const typeInfo = segmentTypes[currentSegment.type];
  
  return (
    <div
      className="text-white flex flex-col overflow-hidden transition-colors duration-500"
      style={{ height: '100%', maxHeight: '100%', backgroundColor: typeInfo.bgColor }}
    >
      {/* Top bar */}
      <div className="flex justify-between items-center px-4 sm:px-6 py-2 sm:py-3 shrink-0" style={{ background: 'rgba(0,0,0,0.3)' }}>
        <div>
          <div className="text-xs uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.4)' }}>
            {workoutType} · {duration} min
          </div>
          <div className="text-base sm:text-lg font-mono" style={{ color: 'rgba(255,255,255,0.6)' }}>
            {formatTime(timeLeft)} remaining
          </div>
        </div>
        <div className="flex gap-2 sm:gap-3">
          <button
            onClick={() => setIsPaused(!isPaused)}
            className="w-10 h-10 rounded-lg text-lg" style={{ background: 'rgba(255,255,255,0.1)' }}
          >
            {isPaused ? '▶' : '⏸'}
          </button>
          <button
            onClick={() => { if (!isMuted) speechSynthesis?.cancel(); setIsMuted(!isMuted); }}
            className="w-10 h-10 rounded-lg text-lg" style={{ background: isMuted ? 'rgba(239,68,68,0.4)' : 'rgba(255,255,255,0.1)' }}
          >
            {isMuted ? '🔇' : '🔊'}
          </button>
          <button
            onClick={onEnd}
            className="w-10 h-10 rounded-lg text-lg" style={{ background: 'rgba(255,255,255,0.1)' }}
          >
            ✕
          </button>
        </div>
      </div>

      {/* Main content — horizontal on landscape, vertical on portrait */}
      <div className="flex-1 flex flex-col landscape:flex-row min-h-0">
        {/* Center hero */}
        <div className="flex-1 flex flex-col items-center justify-center relative px-4 sm:px-10">
          <div
            className="font-black tracking-wide mb-1 sm:mb-2 text-center"
            style={{ fontSize: 'clamp(2rem, 10vw, 5rem)', color: typeInfo.color, textShadow: '0 0 60px rgba(255,255,255,0.2)' }}
          >
            {typeInfo.label}
          </div>
          <div className="text-sm sm:text-xl mb-4 sm:mb-8 text-center" style={{ color: 'rgba(255,255,255,0.5)', letterSpacing: '0.05em' }}>
            {typeInfo.cue}
          </div>

          {/* Res / Timer / RPM row */}
          <div className="flex items-baseline gap-4 sm:gap-12">
            <div className="flex flex-col items-center">
              <div className="text-3xl sm:text-6xl font-extrabold font-mono">{currentSegment.resistance}</div>
              <div className="text-xs uppercase tracking-widest mt-1" style={{ color: 'rgba(255,255,255,0.35)' }}>res</div>
            </div>
            <div className="font-mono font-bold" style={{ fontSize: 'clamp(3rem, 15vw, 8rem)', lineHeight: 1, letterSpacing: '-0.02em' }}>
              {formatTime(timeLeftInSegment)}
            </div>
            <div className="flex flex-col items-center">
              <div className="text-3xl sm:text-6xl font-extrabold font-mono">{currentSegment.rpm}</div>
              <div className="text-xs uppercase tracking-widest mt-1" style={{ color: 'rgba(255,255,255,0.35)' }}>rpm</div>
            </div>
          </div>

          {/* Segment progress bar */}
          <div className="w-4/5 max-w-lg h-1.5 rounded-full mt-4 sm:mt-8 overflow-hidden" style={{ background: 'rgba(255,255,255,0.15)' }}>
            <div
              className="h-full rounded-full"
              style={{ width: `${segmentProgress * 100}%`, backgroundColor: 'rgba(255,255,255,0.7)' }}
            />
          </div>

          {/* Countdown overlay */}
          {timeLeftInSegment <= 5 && timeLeftInSegment > 0 && currentSegmentIndex < segments.length - 1 && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div
                key={Math.ceil(timeLeftInSegment)}
                className="countdown-number text-white font-black select-none"
                style={{ fontSize: 'clamp(8rem, 40vw, 20rem)', lineHeight: 1, textShadow: '0 0 120px rgba(255,255,255,0.4)' }}
              >
                {Math.ceil(timeLeftInSegment)}
              </div>
            </div>
          )}
        </div>

        {/* Coming up panel — side on landscape, bottom on portrait */}
        {upcomingSegments.length > 0 && (
          <div
            className="shrink-0 landscape:w-72 landscape:flex-col landscape:justify-center portrait:flex-row portrait:overflow-x-auto px-3 sm:px-5 py-2 sm:py-6 gap-2 sm:gap-3 flex"
            style={{ background: 'rgba(0,0,0,0.2)' }}
          >
            <div className="text-xs uppercase tracking-widest mb-1 hidden landscape:block" style={{ color: 'rgba(255,255,255,0.35)' }}>Coming up</div>
            {upcomingSegments.map((seg, i) => {
              const info = segmentTypes[seg.type];
              return (
                <div
                  key={currentSegmentIndex + 1 + i}
                  onClick={() => setElapsed(upcomingTimes[i].start)}
                  className="flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2 sm:py-3 rounded-xl cursor-pointer hover:brightness-125 transition-all portrait:shrink-0 portrait:min-w-[140px]"
                  style={{ background: i === 0 ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.06)' }}
                >
                  <div className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full shrink-0" style={{ backgroundColor: info.color }} />
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-xs sm:text-sm" style={{ color: info.color }}>{info.label}</div>
                    <div className="text-xs hidden landscape:block" style={{ color: 'rgba(255,255,255,0.4)' }}>{info.cue}</div>
                  </div>
                  <div className="font-mono text-xs sm:text-sm" style={{ color: 'rgba(255,255,255,0.5)' }}>
                    {formatTime(seg.duration)}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Overall progress */}
      <div className="px-4 sm:px-6 pb-3 sm:pb-4 shrink-0">
        <div className="w-full h-1 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.08)' }}>
          <div
            className="h-full rounded-full"
            style={{ width: `${(elapsed / totalDuration) * 100}%`, background: 'rgba(255,255,255,0.3)' }}
          />
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
