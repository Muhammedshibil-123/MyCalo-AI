import React, { useState, useRef, useEffect } from 'react';
import { IoMdPlay, IoMdPause } from 'react-icons/io';

const CustomAudioPlayer = ({ src, isMe }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const audioRef = useRef(null);

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      const current = audioRef.current.currentTime;
      const total = audioRef.current.duration || 0;
      setProgress(total ? (current / total) * 100 : 0);
    }
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration);
    }
  };

  const handleEnded = () => {
    setIsPlaying(false);
    setProgress(0);
  };

  const handleSeek = (e) => {
    if (audioRef.current) {
      const newTime = (e.target.value / 100) * audioRef.current.duration;
      audioRef.current.currentTime = newTime;
      setProgress(e.target.value);
    }
  };

  const formatTime = (time) => {
    if (!time || isNaN(time)) return "0:00";
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className={`flex items-center gap-3 p-2 rounded-lg min-w-[220px] ${isMe ? 'text-white' : 'text-gray-800'}`}>
      <button 
        onClick={togglePlay}
        className={`w-10 h-10 flex items-center justify-center rounded-full transition-colors ${isMe ? 'bg-white/20 hover:bg-white/30 text-white' : 'bg-gray-200 hover:bg-gray-300 text-gray-600'}`}
      >
        {isPlaying ? <IoMdPause className="text-xl" /> : <IoMdPlay className="text-xl ml-1" />}
      </button>

      <div className="flex-1 flex flex-col justify-center gap-1">
        <input 
          type="range" 
          min="0" 
          max="100" 
          value={progress} 
          onChange={handleSeek}
          className={`w-full h-1 rounded-lg appearance-none cursor-pointer ${isMe ? 'bg-white/30 accent-white' : 'bg-gray-300 accent-blue-600'}`}
        />
        <div className={`text-[10px] font-medium flex justify-between ${isMe ? 'text-blue-100' : 'text-gray-500'}`}>
          <span>{formatTime(audioRef.current?.currentTime)}</span>
          <span>{formatTime(duration)}</span>
        </div>
      </div>

      <audio 
        ref={audioRef} 
        src={src} 
        onTimeUpdate={handleTimeUpdate} 
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={handleEnded}
        className="hidden" 
      />
    </div>
  );
};

export default CustomAudioPlayer;