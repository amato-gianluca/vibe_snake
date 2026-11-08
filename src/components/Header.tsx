import React, { useState } from 'react';
import { audioEngine } from '../audio/synthEngine';
import { Track } from '../types';
import {
  Terminal,
  Activity,
  Volume2,
  VolumeX,
  X,
  Play,
  Pause,
  Cpu,
  Radio,
  FileCode,
} from 'lucide-react';

interface HeaderProps {
  currentTrack: Track;
  isPlaying: boolean;
}

export const Header: React.FC<HeaderProps> = ({ currentTrack, isPlaying }) => {
  const [showSysModal, setShowSysModal] = useState(false);
  const [isMuted, setIsMuted] = useState(audioEngine.getIsMuted());

  const toggleMute = () => {
    audioEngine.toggleMute();
    setIsMuted(audioEngine.getIsMuted());
  };

  const togglePlay = () => {
    audioEngine.togglePlay();
  };

  return (
    <>
      <header className="w-full bg-[#000000] border-b-2 border-[#00f0ff] sticky top-0 z-40 shadow-[0_4px_0px_#ff0055]">
        <div className="max-w-7xl mx-auto px-3 sm:px-5 py-2.5 flex items-center justify-between gap-3">
          {/* Machine Header Logo */}
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 sm:w-9 sm:h-9 bg-[#000000] border-2 border-[#ff0055] flex items-center justify-center shadow-[2px_2px_0px_#00f0ff]">
              <Terminal className="w-4 h-4 text-[#00f0ff]" />
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-pixel text-[11px] sm:text-xs font-bold tracking-tight text-[#00f0ff] text-shadow flex items-center gap-1.5 glitch-text-active">
                  <span>SYS//GLITCH</span>
                  <span className="text-[#ff0055]">::</span>
                  <span className="text-[#ff0055]">SNAKE_01</span>
                </h1>
                <span className="hidden md:inline-block px-1.5 py-0.5 text-[9px] font-pixel bg-[#ff0055] text-black font-bold">
                  v4.0_RAW
                </span>
              </div>
              <p className="text-[10px] font-silkscreen text-[#ff0055] tracking-widest uppercase hidden sm:block">
                PROTOCOL: RETRO_FUTURIST_MACHINE // SUB_SIGNAL_ONLINE
              </p>
            </div>
          </div>

          {/* Machine Status Ticker */}
          <div className="hidden lg:flex items-center gap-2 px-3 py-1 bg-black border border-[#00f0ff] text-[10px] font-pixel text-[#00f0ff]">
            <Radio className="w-3 h-3 text-[#ff0055] animate-ping" />
            <span className="text-white">STREAM:</span>
            <span className="text-[#00f0ff] truncate max-w-[170px] uppercase font-bold">
              {currentTrack.title}
            </span>
            <span className="text-[#ff0055]">[{currentTrack.bpm}BPM]</span>
          </div>

          {/* Brutalist Machine Controls */}
          <div className="flex items-center gap-2">
            <button
              onClick={togglePlay}
              className={`px-3 py-1.5 text-[10px] font-pixel border-2 uppercase transition-all ${
                isPlaying
                  ? 'bg-[#00f0ff] text-black border-[#ff0055] shadow-[3px_3px_0px_#ff0055]'
                  : 'bg-black text-[#00f0ff] border-[#00f0ff] hover:bg-[#ff0055] hover:text-black'
              }`}
              title="Toggle Audio Generator"
            >
              <div className="flex items-center gap-1.5">
                {isPlaying ? <Pause className="w-3 h-3 fill-current" /> : <Play className="w-3 h-3 fill-current" />}
                <span className="hidden sm:inline">{isPlaying ? 'HALT_SYNTH' : 'EXEC_SYNTH'}</span>
              </div>
            </button>

            <button
              onClick={toggleMute}
              className="p-1.5 bg-black border-2 border-[#00f0ff] text-[#00f0ff] hover:bg-[#ff0055] hover:text-black hover:border-[#00f0ff] transition-all shadow-[2px_2px_0px_#ff0055]"
              title="Toggle Audio Hardware"
            >
              {isMuted ? <VolumeX className="w-4 h-4 text-[#ff0055]" /> : <Volume2 className="w-4 h-4" />}
            </button>

            <button
              onClick={() => setShowSysModal(true)}
              className="p-1.5 bg-black border-2 border-[#ff0055] text-[#ff0055] hover:bg-[#00f0ff] hover:text-black hover:border-[#ff0055] transition-all shadow-[2px_2px_0px_#00f0ff]"
              title="Inspect System Directive"
            >
              <FileCode className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Cryptic Machine Directive Modal */}
      {showSysModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/90 backdrop-blur-sm animate-in fade-in duration-100">
          <div className="relative w-full max-w-lg bg-black border-2 border-[#00f0ff] p-5 shadow-[8px_8px_0px_#ff0055] glitch-tear-layer">
            <button
              onClick={() => setShowSysModal(false)}
              className="absolute top-3 right-3 p-1 bg-[#ff0055] text-black font-pixel text-xs hover:bg-[#00f0ff] border border-black"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-2 mb-4 border-b-2 border-[#ff0055] pb-2">
              <Cpu className="w-5 h-5 text-[#00f0ff]" />
              <h2 className="font-pixel text-xs text-[#00f0ff] tracking-wider uppercase">
                // SYSTEM_DIRECTIVE: 0x88F
              </h2>
            </div>

            <div className="space-y-3 font-silkscreen text-[11px] text-[#00f0ff]">
              <div className="bg-black border border-[#00f0ff] p-3 shadow-[3px_3px_0px_#ff0055]">
                <div className="font-pixel text-[10px] text-[#ff0055] uppercase mb-1">
                  [!] CORE SUB_ROUTINE: SNAKE_CYCLE
                </div>
                <p className="text-white leading-relaxed">
                  PROPEL VECTOR MATRIX WITH [WASD] OR [ARROWS]. INGEST ENERGY DISKS BEFORE BUFFER DECAY. IMPACT WITH PERIMETER WALLS RESULTS IN TERMINAL EXCEPTION.
                </p>
              </div>

              <div className="bg-black border border-[#ff0055] p-3 shadow-[3px_3px_0px_#00f0ff]">
                <div className="font-pixel text-[10px] text-[#00f0ff] uppercase mb-1">
                  [!] FREQUENCY TELEMETRY
                </div>
                <p className="text-slate-300 leading-relaxed">
                  3 PROCEDURAL HARDWARE STREAMS GENERATED REALTIME VIA WEB_AUDIO_API. LOW-END SUB_BASS COMPRESSION TRIGGERS PHYSICAL SCREEN RESISTANCE.
                </p>
              </div>
            </div>

            <button
              onClick={() => setShowSysModal(false)}
              className="mt-5 w-full py-2.5 bg-[#00f0ff] text-black font-pixel text-xs tracking-wider uppercase font-bold hover:bg-[#ff0055] border-2 border-black transition-all shadow-[4px_4px_0px_#ff0055]"
            >
              ACKNOWLEDGE // RESUME_CYCLE
            </button>
          </div>
        </div>
      )}
    </>
  );
};
