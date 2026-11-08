import React, { useEffect, useRef, useState } from 'react';
import { audioEngine } from '../audio/synthEngine';
import { Track } from '../types';
import { Activity, BarChart2, Radio, Terminal } from 'lucide-react';

interface AudioVisualizerProps {
  track: Track;
  isPlaying: boolean;
}

export const AudioVisualizer: React.FC<AudioVisualizerProps> = ({ track, isPlaying }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [visualizerMode, setVisualizerMode] = useState<'bars' | 'wave' | 'ring'>('bars');
  const animFrameRef = useRef<number | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const bufferLength = 48;
    const freqData = new Uint8Array(bufferLength);
    const timeData = new Uint8Array(bufferLength);

    const render = () => {
      const width = canvas.width;
      const height = canvas.height;

      // Pitch black clear
      ctx.fillStyle = '#000000';
      ctx.fillRect(0, 0, width, height);

      audioEngine.getFrequencyData(freqData);
      audioEngine.getTimeDomainData(timeData);

      // Raw Pixelated Glitch Visualizer
      if (visualizerMode === 'bars') {
        const barWidth = Math.floor(width / bufferLength);

        for (let i = 0; i < bufferLength; i++) {
          const val = isPlaying ? freqData[i] : 8 + Math.floor(Math.sin(Date.now() * 0.005 + i) * 6);
          const rawHeight = Math.floor((val / 255) * (height - 6));
          // Stepped / quantized pixel steps
          const steppedHeight = Math.floor(rawHeight / 4) * 4;

          const x = i * barWidth;
          const y = height - steppedHeight;

          // Jarring Cyan vs Magenta alternating blocks
          const isMagenta = i % 2 === 1;
          ctx.fillStyle = isMagenta ? '#ff0055' : '#00f0ff';
          ctx.fillRect(x, y, barWidth - 2, steppedHeight);

          // Top pixel pip
          if (isPlaying && steppedHeight > 12) {
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(x, y - 3, barWidth - 2, 2);
          }
        }
      } else if (visualizerMode === 'wave') {
        // Jagged Raw CRT Oscilloscope
        ctx.lineWidth = 2;
        ctx.strokeStyle = '#00f0ff';
        ctx.beginPath();

        const sliceWidth = width / bufferLength;
        let x = 0;

        for (let i = 0; i < bufferLength; i++) {
          const v = isPlaying ? timeData[i] / 128.0 : 1 + (Math.random() * 0.1 - 0.05);
          const y = Math.floor((v * height) / 2);

          if (i === 0) {
            ctx.moveTo(x, y);
          } else {
            // Stepped orthogonal / retro digital lines
            ctx.lineTo(x, y);
          }
          x += sliceWidth;
        }

        ctx.stroke();

        // Magenta Chromatic Glitch Ghost
        ctx.lineWidth = 1;
        ctx.strokeStyle = '#ff0055';
        ctx.beginPath();
        x = 0;
        for (let i = 0; i < bufferLength; i++) {
          const v = isPlaying ? timeData[i] / 128.0 : 1 + (Math.random() * 0.1 - 0.05);
          const y = Math.floor((v * height) / 2) + 3;
          if (i === 0) ctx.moveTo(x - 2, y);
          else ctx.lineTo(x - 2, y);
          x += sliceWidth;
        }
        ctx.stroke();
      } else if (visualizerMode === 'ring') {
        // Angular Hexagonal Machine Radar
        const cx = width / 2;
        const cy = height / 2;
        const baseRadius = Math.min(width, height) * 0.28;

        ctx.strokeStyle = '#00f0ff';
        ctx.lineWidth = 2;
        ctx.beginPath();

        for (let i = 0; i < bufferLength; i++) {
          const angle = (i / bufferLength) * Math.PI * 2;
          const val = isPlaying ? freqData[i] : 10 + (Math.random() * 8);
          const r = baseRadius + Math.floor((val / 255) * baseRadius * 0.8);

          const px = cx + Math.cos(angle) * r;
          const py = cy + Math.sin(angle) * r;

          if (i === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }
        ctx.closePath();
        ctx.stroke();

        // Inner Magenta Core
        ctx.strokeStyle = '#ff0055';
        ctx.lineWidth = 1.5;
        ctx.strokeRect(cx - 10, cy - 10, 20, 20);
      }

      // Horizontal CRT scanline overlay drawn directly onto canvas
      ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
      for (let y = 0; y < height; y += 3) {
        ctx.fillRect(0, y, width, 1);
      }

      animFrameRef.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, [track, isPlaying, visualizerMode]);

  return (
    <div className="relative border-2 border-[#00f0ff] bg-black p-2.5 shadow-[4px_4px_0px_#ff0055]">
      {/* Top Header */}
      <div className="flex items-center justify-between pb-1.5 mb-2 border-b border-[#00f0ff]/40">
        <div className="flex items-center gap-1.5 font-pixel text-[9px] text-[#00f0ff]">
          <Terminal className="w-3 h-3 text-[#ff0055]" />
          <span>SPECTRAL_TELEMETRY::FFT</span>
        </div>

        {/* Mode Switcher */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => setVisualizerMode('bars')}
            className={`px-1.5 py-0.5 text-[8px] font-pixel border transition-all ${
              visualizerMode === 'bars'
                ? 'bg-[#00f0ff] text-black border-[#00f0ff] font-bold'
                : 'bg-black text-[#00f0ff] border-zinc-800 hover:border-[#00f0ff]'
            }`}
          >
            BARS
          </button>
          <button
            onClick={() => setVisualizerMode('wave')}
            className={`px-1.5 py-0.5 text-[8px] font-pixel border transition-all ${
              visualizerMode === 'wave'
                ? 'bg-[#ff0055] text-black border-[#ff0055] font-bold'
                : 'bg-black text-[#ff0055] border-zinc-800 hover:border-[#ff0055]'
            }`}
          >
            OSC
          </button>
          <button
            onClick={() => setVisualizerMode('ring')}
            className={`px-1.5 py-0.5 text-[8px] font-pixel border transition-all ${
              visualizerMode === 'ring'
                ? 'bg-[#00f0ff] text-black border-[#00f0ff] font-bold'
                : 'bg-black text-[#00f0ff] border-zinc-800 hover:border-[#00f0ff]'
            }`}
          >
            RADAR
          </button>
        </div>
      </div>

      {/* Screen Area */}
      <div className="relative w-full h-24 overflow-hidden bg-black border border-zinc-800">
        <canvas
          ref={canvasRef}
          width={360}
          height={96}
          className="w-full h-full block"
        />

        {/* Static Tear Line Overlay */}
        <div className="static-bar" />

        <div className="absolute top-1 left-1.5 font-pixel text-[8px] text-[#00f0ff] select-none pointer-events-none">
          CH_01: {track.bpm}BPM // {isPlaying ? 'STREAM_LIVE' : 'IDLE_STATIC'}
        </div>
        <div className="absolute bottom-1 right-2 font-pixel text-[8px] text-[#ff0055] select-none pointer-events-none">
          {isPlaying ? 'SAMPLE_RATE: 44.1kHz' : 'CORE_STANDBY'}
        </div>
      </div>
    </div>
  );
};
