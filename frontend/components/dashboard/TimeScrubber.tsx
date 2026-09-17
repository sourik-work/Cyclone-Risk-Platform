'use client';

import React, { useEffect, useState } from 'react';
import { CycloneTrack } from '../map/types';
import { Play, Pause, SkipBack, SkipForward } from 'lucide-react';

interface TimeScrubberProps {
  track: CycloneTrack;
  activePointIndex: number;
  onSelectIndex: (index: number) => void;
}

export const TimeScrubber: React.FC<TimeScrubberProps> = ({
  track,
  activePointIndex,
  onSelectIndex,
}) => {
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const totalPoints = track.track_points.length;
  const currentPoint = track.track_points[activePointIndex] || track.track_points[0];

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isPlaying) {
      timer = setInterval(() => {
        if (activePointIndex >= totalPoints - 1) {
          setIsPlaying(false);
        } else {
          onSelectIndex(activePointIndex + 1);
        }
      }, 1500);
    }
    return () => clearInterval(timer);
  }, [isPlaying, totalPoints, activePointIndex, onSelectIndex]);

  const formatDate = (isoString: string) => {
    try {
      const date = new Date(isoString);
      return date.toLocaleString('en-IN', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        timeZone: 'Asia/Kolkata',
      }) + ' IST';
    } catch {
      return isoString;
    }
  };

  return (
    <div className="w-full bg-slate-900/90 backdrop-blur-md border border-slate-800 rounded-xl p-3 shadow-xl flex flex-col md:flex-row items-center justify-between gap-4 select-none">
      {/* Playback Controls */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => onSelectIndex(0)}
          disabled={activePointIndex === 0}
          title="Jump to Genesis"
          className="p-2 rounded-lg bg-slate-950 border border-slate-800 text-slate-400 hover:text-slate-200 disabled:opacity-30 transition-colors"
        >
          <SkipBack className="w-4 h-4" />
        </button>

        <button
          onClick={() => setIsPlaying(!isPlaying)}
          title={isPlaying ? 'Pause Simulation' : 'Play Trajectory'}
          className="px-3 py-2 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-semibold flex items-center gap-1.5 transition-colors shadow-lg shadow-cyan-500/20 text-xs"
        >
          {isPlaying ? (
            <>
              <Pause className="w-4 h-4 fill-current" />
              Pause
            </>
          ) : (
            <>
              <Play className="w-4 h-4 fill-current" />
              Play Track
            </>
          )}
        </button>

        <button
          onClick={() => onSelectIndex(Math.min(totalPoints - 1, activePointIndex + 1))}
          disabled={activePointIndex >= totalPoints - 1}
          title="Step Forward"
          className="p-2 rounded-lg bg-slate-950 border border-slate-800 text-slate-400 hover:text-slate-200 disabled:opacity-30 transition-colors"
        >
          <SkipForward className="w-4 h-4" />
        </button>
      </div>

      {/* Scrubber Timeline Slider */}
      <div className="flex-1 w-full flex flex-col gap-1">
        <div className="flex items-center justify-between text-[11px] font-mono">
          <span className="text-slate-400">
            Genesis: {formatDate(track.genesis_time)}
          </span>
          <span className="font-bold text-cyan-300">
            Current: {formatDate(currentPoint.timestamp)}
            {currentPoint.is_forecast && (
              <span className="ml-2 text-amber-400 font-normal">
                (Forecast +{currentPoint.forecast_lead_hours}h)
              </span>
            )}
          </span>
          <span className="text-slate-400">
            Step {activePointIndex + 1} of {totalPoints}
          </span>
        </div>

        <input
          type="range"
          min="0"
          max={totalPoints - 1}
          value={activePointIndex}
          onChange={(e) => onSelectIndex(parseInt(e.target.value, 10))}
          className="w-full accent-cyan-400 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
        />
      </div>
    </div>
  );
};
