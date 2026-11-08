import React, { useState, useRef } from 'react';
import { audioEngine, TRACKS } from '../audio/synthEngine';
import { Track } from '../types';
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
  Upload,
  Cpu,
  Radio,
  Sliders,
  Volume1,
  FileDigit,
} from 'lucide-react';
import { AudioVisualizer } from './AudioVisualizer';

interface MusicPlayerProps {
  currentTrack: Track;
  isPlaying: boolean;
  onTrackChange?: () => void;
}

export const MusicPlayer: React.FC<MusicPlayerProps> = ({ currentTrack, isPlaying }) => {
  const [volume, setVolume] = useState(audioEngine.getVolume());
  const [isMuted, setIsMuted] = useState(audioEngine.getIsMuted());
  const [sfxEnabled, setSfxEnabled] = useState(audioEngine.getIsSfxEnabled());
  const [playbackTime, setPlaybackTime] = useState(audioEngine.getPlaybackTime());
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  React.useEffect(() => {
    const interval = setInterval(() => {
      setPlaybackTime(audioEngine.getPlaybackTime());
      setVolume(audioEngine.getVolume());
      setIsMuted(audioEngine.getIsMuted());
      setSfxEnabled(audioEngine.getIsSfxEnabled());
    }, 150);
    return () => clearInterval(interval);
  }, []);

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const handlePlayPause = () => {
    audioEngine.togglePlay();
  };

  const handleNext = () => {
    audioEngine.nextTrack();
  };

  const handlePrev = () => {
    audioEngine.prevTrack();
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setVolume(val);
    audioEngine.setVolume(val);
  };

  const handleMuteToggle = () => {
    audioEngine.toggleMute();
    setIsMuted(audioEngine.getIsMuted());
  };

  const handleSfxToggle = () => {
    audioEngine.toggleSfx();
    setSfxEnabled(audioEngine.getIsSfxEnabled());
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const targetTime = parseFloat(e.target.value);
    audioEngine.seekTo(targetTime);
    setPlaybackTime(targetTime);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      audioEngine.loadCustomAudioFile(file);
    }
  };

  const progressPercent = currentTrack.duration > 0
    ? Math.min(100, (playbackTime / currentTrack.duration) * 100)
    : 0;

  return (
    <div className="flex flex-col gap-4 w-full">
      {/* Glitch Machine Audio Deck */}
      <div className="relative bg-black border-2 border-[#00f0ff] p-3 sm:p-4 shadow-[6px_6px_0px_#ff0055]">
        {/* Header Bar */}
        <div className="flex items-center justify-between border-b-2 border-[#ff0055] pb-2 mb-3">
          <div className="flex items-center gap-2 font-pixel text-[10px] text-[#00f0ff]">
            <Radio className="w-3.5 h-3.5 text-[#ff0055] animate-ping" />
            <span>[ MACHINE_DECK // AUDIO_SYS ]</span>
          </div>

          <div className="flex items-center gap-2">
            <span className="px-1.5 py-0.5 text-[8px] font-pixel bg-[#ff0055] text-black font-bold">
              AI_PROCEDURAL
            </span>
            <span className="text-[10px] font-pixel text-[#00f0ff]">
              {currentTrack.bpm}BPM
            </span>
          </div>
        </div>

        {/* Current Track Info Display */}
        <div className="bg-black border border-[#00f0ff] p-3 mb-3 shadow-[3px_3px_0px_#00f0ff]">
          <div className="flex items-start justify-between gap-2 mb-1.5">
            <div className="min-w-0">
              <span className="text-[8px] font-pixel text-[#ff0055] uppercase block mb-1">
                SECTOR_GENRE: {currentTrack.genre}
              </span>
              <h3 className="font-pixel text-xs sm:text-sm text-[#00f0ff] truncate tracking-wider">
                {currentTrack.title}
              </h3>
              <p className="font-silkscreen text-[11px] text-[#ff0055] truncate mt-0.5">
                OPERATOR: {currentTrack.artist}
              </p>
            </div>

            <div className="flex-shrink-0 text-right font-pixel text-[9px] text-[#00f0ff]">
              <span className={`inline-block px-1.5 py-0.5 border ${
                isPlaying ? 'border-[#00f0ff] bg-[#00f0ff]/20 text-[#00f0ff]' : 'border-zinc-800 text-zinc-600'
              }`}>
                {isPlaying ? 'STREAM: LIVE' : 'STREAM: HALT'}
              </span>
            </div>
          </div>

          <div className="font-mono text-[10px] text-zinc-400 border-t border-zinc-900 pt-1.5 mt-2 uppercase tracking-wide">
            {currentTrack.description}
          </div>
        </div>

        {/* Scrubbing Bar (Raw Glitch Progress Bar) */}
        <div className="space-y-1 mb-3">
          <div className="relative w-full h-3 bg-black border border-[#00f0ff]">
            <div
              className="h-full bg-[#ff0055] transition-all duration-100"
              style={{ width: `${progressPercent}%` }}
            />
            <input
              type="range"
              min={0}
              max={currentTrack.duration}
              step={0.5}
              value={playbackTime}
              onChange={handleSeek}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              title="Seek audio track"
            />
          </div>

          <div className="flex justify-between items-center font-pixel text-[9px] text-[#00f0ff]">
            <span>{formatTime(playbackTime)}</span>
            <span className="text-[#ff0055]">// SIGNAL_POS //</span>
            <span>{formatTime(currentTrack.duration)}</span>
          </div>
        </div>

        {/* Machine Action Buttons */}
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-1.5">
            {/* Prev Track */}
            <button
              onClick={handlePrev}
              className="p-2 bg-black border-2 border-[#00f0ff] text-[#00f0ff] hover:bg-[#00f0ff] hover:text-black transition-all active:translate-y-0.5 shadow-[2px_2px_0px_#ff0055]"
              title="Prev Track"
            >
              <SkipBack className="w-3.5 h-3.5" />
            </button>

            {/* Play/Pause Button */}
            <button
              onClick={handlePlayPause}
              className={`px-4 py-2 font-pixel text-xs border-2 uppercase font-bold flex items-center gap-1.5 transition-all active:translate-y-0.5 ${
                isPlaying
                  ? 'bg-[#ff0055] text-black border-[#00f0ff] shadow-[4px_4px_0px_#00f0ff]'
                  : 'bg-[#00f0ff] text-black border-[#ff0055] shadow-[4px_4px_0px_#ff0055] hover:bg-[#ff0055]'
              }`}
              title={isPlaying ? 'Halt Audio' : 'Execute Audio'}
            >
              {isPlaying ? (
                <>
                  <Pause className="w-3.5 h-3.5 fill-current" />
                  <span>HALT</span>
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>PLAY</span>
                </>
              )}
            </button>

            {/* Next Track */}
            <button
              onClick={handleNext}
              className="p-2 bg-black border-2 border-[#00f0ff] text-[#00f0ff] hover:bg-[#00f0ff] hover:text-black transition-all active:translate-y-0.5 shadow-[2px_2px_0px_#ff0055]"
              title="Next Track"
            >
              <SkipForward className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Volume and SFX Hardware */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 bg-black border border-[#00f0ff] px-2 py-1">
              <button
                onClick={handleMuteToggle}
                className="text-[#00f0ff] hover:text-[#ff0055]"
                title={isMuted ? 'Unmute' : 'Mute'}
              >
                {isMuted || volume === 0 ? (
                  <VolumeX className="w-3.5 h-3.5 text-[#ff0055]" />
                ) : volume < 0.5 ? (
                  <Volume1 className="w-3.5 h-3.5" />
                ) : (
                  <Volume2 className="w-3.5 h-3.5" />
                )}
              </button>
              <input
                type="range"
                min={0}
                max={1}
                step={0.02}
                value={isMuted ? 0 : volume}
                onChange={handleVolumeChange}
                className="w-14 sm:w-16 h-1 bg-zinc-800 accent-[#ff0055] cursor-pointer"
                title="Hardware Gain"
              />
            </div>

            <button
              onClick={handleSfxToggle}
              className={`px-2 py-1 font-pixel text-[9px] border transition-all ${
                sfxEnabled
                  ? 'bg-[#00f0ff] text-black border-[#00f0ff] font-bold shadow-[2px_2px_0px_#ff0055]'
                  : 'bg-black text-zinc-600 border-zinc-800'
              }`}
              title={sfxEnabled ? 'Game SFX Enabled' : 'Game SFX Muted'}
            >
              SFX
            </button>
          </div>
        </div>

        {/* Realtime Spectral Visualizer */}
        <AudioVisualizer track={currentTrack} isPlaying={isPlaying} />

        {/* 3 AI Tracks List */}
        <div className="mt-3 pt-2.5 border-t-2 border-[#ff0055]">
          <div className="flex items-center justify-between mb-2">
            <span className="font-pixel text-[9px] text-[#00f0ff] uppercase flex items-center gap-1">
              <Cpu className="w-3 h-3 text-[#ff0055]" />
              AI_SYNAPSE_ARCHIVE
            </span>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="font-pixel text-[8px] text-[#ff0055] hover:text-[#00f0ff] flex items-center gap-1 transition-colors uppercase"
              title="Inject Custom Audio Stream"
            >
              <Upload className="w-2.5 h-2.5" />
              <span>INJECT_WAV</span>
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="audio/*"
              onChange={handleFileUpload}
              className="hidden"
            />
          </div>

          <div className="space-y-1.5">
            {TRACKS.map((t, idx) => {
              const isSelected = !audioEngine.getCurrentTrack().id.includes('custom') && audioEngine.getCurrentTrackIndex() === idx;
              return (
                <button
                  key={t.id}
                  onClick={() => audioEngine.selectTrack(idx)}
                  className={`w-full text-left p-2 border transition-all flex items-center justify-between ${
                    isSelected
                      ? 'bg-black border-2 border-[#00f0ff] shadow-[4px_4px_0px_#ff0055]'
                      : 'bg-black border border-zinc-800 hover:border-[#ff0055]'
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="font-pixel text-[8px] text-[#ff0055]">
                      0{idx + 1}
                    </span>
                    <div className="min-w-0">
                      <div className="font-pixel text-[10px] text-[#00f0ff] truncate">
                        {t.title}
                      </div>
                      <div className="font-silkscreen text-[9px] text-[#ff0055] truncate">
                        {t.genre}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 font-pixel text-[9px] text-zinc-400">
                    <span className="text-[#00f0ff]">{t.bpm}BPM</span>
                    <span className="text-zinc-600">//</span>
                    <span>{formatTime(t.duration)}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
