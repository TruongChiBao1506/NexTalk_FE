import React, { useRef, useState, useEffect } from 'react';
import { Play } from 'lucide-react';

interface VideoThumbnailProps {
  src: string;
  onClick: () => void;
  className?: string;
}

const formatDuration = (seconds: number) => {
  if (isNaN(seconds) || seconds === 0) return '00:00';
  const m = Math.floor(seconds / 60).toString().padStart(2, '0');
  const s = Math.floor(seconds % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
};

export const VideoThumbnail: React.FC<VideoThumbnailProps> = ({ src, onClick, className }) => {
  const [duration, setDuration] = useState<number>(0);
  const [isPlayingInline, setIsPlayingInline] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration);
    }
  };

  const handlePlayClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsPlayingInline(true);
  };

  return (
    <div 
      className={`relative bg-[#18202F] group flex items-center justify-center aspect-video overflow-hidden ${className || ''}`}
      onClick={onClick}
    >
      <video
        ref={videoRef}
        src={isPlayingInline ? src : `${src}#t=0.1`}
        preload="metadata"
        onLoadedMetadata={handleLoadedMetadata}
        className="w-full h-full object-contain"
        playsInline
        controls={isPlayingInline}
        autoPlay={isPlayingInline}
        muted={!isPlayingInline}
        onClick={(e) => isPlayingInline && e.stopPropagation()}
      />
      
      {!isPlayingInline && (
        <>
          {/* Dark overlay on hover */}
          <div 
            className="absolute inset-0 flex items-center justify-center bg-black/10 group-hover:bg-black/30 transition-colors cursor-pointer"
            onClick={(e) => {
              if (onClick) {
                e.stopPropagation();
                onClick();
              }
            }}
          >
            {/* Play Button */}
            <div 
              className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center backdrop-blur-md shadow-lg border border-white/30 group-hover:bg-white/30 transition-all group-hover:scale-105"
              onClick={handlePlayClick}
            >
              <Play className="w-6 h-6 text-white fill-white ml-1 drop-shadow-md" />
            </div>
          </div>
          
          {/* Duration Badge */}
          {duration > 0 && (
            <div className="absolute bottom-2 right-2 px-1.5 py-0.5 rounded-md bg-black/60 backdrop-blur-sm text-white text-[10px] font-medium tracking-wide pointer-events-none">
              {formatDuration(duration)}
            </div>
          )}
        </>
      )}
    </div>
  );
};
