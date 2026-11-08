import React, { useEffect, useState } from 'react';
import { audioEngine } from './audio/synthEngine';
import { Header } from './components/Header';
import { MusicPlayer } from './components/MusicPlayer';
import { SnakeGame } from './components/SnakeGame';
import {
  Terminal,
  Cpu,
  Radio,
  Sliders,
  Keyboard,
  ShieldAlert,
  Disc3,
  Flame,
} from 'lucide-react';

export default function App() {
  const [currentTrack, setCurrentTrack] = useState(() => audioEngine.getCurrentTrack());
  const [isPlaying, setIsPlaying] = useState(() => audioEngine.getIsPlaying());

  useEffect(() => {
    const handleAudioUpdate = () => {
      setCurrentTrack(audioEngine.getCurrentTrack());
      setIsPlaying(audioEngine.getIsPlaying());
    };

    audioEngine.subscribe(handleAudioUpdate);
    const timer = setInterval(handleAudioUpdate, 200);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="min-h-screen bg-black text-[#00f0ff] flex flex-col relative static-noise overflow-x-hidden selection:bg-[#ff0055] selection:text-black">
      {/* Background Static & Glitch Bar Scan */}
      <div className="fixed inset-0 pointer-events-none z-0 crt-grid opacity-30" />
      <div className="static-bar" />

      {/* Cryptic Glitch Header */}
      <Header currentTrack={currentTrack} isPlaying={isPlaying} />

      {/* Main Machine Command Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-3 sm:p-5 lg:p-6 z-10">
        {/* Machine Telemetry Banner */}
        <div className="mb-4 sm:mb-5 bg-black border-2 border-[#00f0ff] p-3 shadow-[4px_4px_0px_#ff0055] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 bg-black border-2 border-[#ff0055] flex items-center justify-center text-[#ff0055] font-pixel text-xs font-bold">
              !
            </div>
            <div>
              <div className="font-pixel text-[10px] sm:text-[11px] text-[#00f0ff] flex items-center gap-2">
                <span>SECTOR_CONSOLE // CORE_UNIT_01</span>
                <span className="text-[#ff0055] hidden md:inline">[STATUS: OPERATIONAL]</span>
              </div>
              <div className="font-silkscreen text-[10px] text-[#ff0055] uppercase tracking-wide">
                RETRO-FUTURIST HARDWARE // GLITCH ART AUDIO-REACTIVE TERMINAL
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap font-pixel text-[8px] sm:text-[9px]">
            <span className="px-2 py-1 bg-black border border-[#00f0ff] text-[#00f0ff] shadow-[2px_2px_0px_#00f0ff] flex items-center gap-1">
              <span className="w-1.5 h-1.5 bg-[#00f0ff] animate-ping" />
              ARENA_PULSE: ON
            </span>
            <span className="px-2 py-1 bg-black border border-[#ff0055] text-[#ff0055] shadow-[2px_2px_0px_#ff0055] flex items-center gap-1">
              <span className="w-1.5 h-1.5 bg-[#ff0055]" />
              AI_SYNTH: 3_TRACKS
            </span>
          </div>
        </div>

        {/* 2-Column Responsive Layout: Snake Machine & Synth Machine Deck */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
          {/* Left Column: Center Snake Game Arcade Terminal */}
          <div className="lg:col-span-7 xl:col-span-7 flex flex-col items-center">
            <SnakeGame
              isPlayingMusic={isPlaying}
              musicBpm={currentTrack.bpm}
              trackAccentColor={currentTrack.accentColor}
            />

            {/* Sub Command Directives */}
            <div className="mt-3 w-full max-w-xl bg-black border-2 border-[#00f0ff] p-2.5 font-pixel text-[9px] text-[#00f0ff] flex items-center justify-between shadow-[3px_3px_0px_#ff0055]">
              <div className="flex items-center gap-2">
                <Keyboard className="w-3.5 h-3.5 text-[#ff0055]" />
                <span>DIRECTIVE: WASD / ARROWS</span>
              </div>
              <div className="flex items-center gap-1.5 text-[#ff0055]">
                <span>SPACE::CYCLE_HALT</span>
              </div>
            </div>
          </div>

          {/* Right Column: Audio Synthesis Machine Console */}
          <div className="lg:col-span-5 xl:col-span-5 flex flex-col gap-4">
            <MusicPlayer
              currentTrack={currentTrack}
              isPlaying={isPlaying}
            />

            {/* Machine Hardware Specification Telemetry Card */}
            <div className="bg-black border-2 border-[#00f0ff] p-3 shadow-[5px_5px_0px_#ff0055]">
              <div className="flex items-center justify-between pb-1.5 mb-2.5 border-b-2 border-[#ff0055]">
                <div className="flex items-center gap-1.5 font-pixel text-[9px] text-[#00f0ff]">
                  <Sliders className="w-3.5 h-3.5 text-[#ff0055]" />
                  <span>CORE_HARDWARE_SPECS</span>
                </div>
                <span className="font-pixel text-[8px] text-[#ff0055]">
                  REV: 0x2099
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 font-pixel text-[8px]">
                <div className="bg-black border border-zinc-800 p-2">
                  <div className="text-[#ff0055] text-[7px]">SIGNAL_STATE</div>
                  <div className="text-[#00f0ff] font-bold truncate mt-0.5">{currentTrack.synths.mood}</div>
                </div>
                <div className="bg-black border border-zinc-800 p-2">
                  <div className="text-[#ff0055] text-[7px]">INTERNAL_CLOCK</div>
                  <div className="text-[#00f0ff] font-bold mt-0.5">{currentTrack.bpm}BPM // 16-STEP</div>
                </div>
                <div className="bg-black border border-zinc-800 p-2">
                  <div className="text-[#ff0055] text-[7px]">AUDIO_GENERATOR</div>
                  <div className="text-[#00f0ff] font-bold mt-0.5">SUB_ANALOG_OSC</div>
                </div>
                <div className="bg-black border border-zinc-800 p-2">
                  <div className="text-[#ff0055] text-[7px]">SCREEN_TEAR_SYNC</div>
                  <div className="text-[#00f0ff] font-bold mt-0.5">BASS_KICK_LOCK</div>
                </div>
              </div>

              <div className="mt-2.5 font-silkscreen text-[9px] text-zinc-400 leading-normal uppercase">
                ALL AUDIO STREAMS SYNTHESIZED PROCEDURALLY AT EXECUTION TIME. ZERO LATENCY. NO EXTERNAL NETWORK DEPENDENCY.
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Machine Footer */}
      <footer className="w-full bg-black border-t-2 border-[#00f0ff] py-2.5 px-3 text-center font-pixel text-[8px] text-zinc-400 z-10 shadow-[0_-3px_0px_#ff0055]">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-1.5">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 bg-[#00f0ff] animate-ping" />
            <span className="text-[#00f0ff]">RETRO-FUTURIST MACHINE INTERFACE</span>
            <span className="text-[#ff0055]">//</span>
            <span className="text-[#ff0055]">GLITCH_ART PROTOCOL</span>
          </div>
          <div className="text-zinc-500">
            [SYS_TIME: 2026.11 // CORE_CYCLE: SYNTH_SNAKE]
          </div>
        </div>
      </footer>
    </div>
  );
}
