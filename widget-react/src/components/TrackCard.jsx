import React, { useEffect, useMemo, useRef, useState } from "react";

function clamp(n, min, max) {
  return Math.min(max, Math.max(min, n));
}

function formatTime(secs) {
  const s = typeof secs === "number" && isFinite(secs) ? Math.max(0, secs) : 0;
  const whole = Math.floor(s);
  const m = Math.floor(whole / 60);
  const ss = String(whole % 60).padStart(2, "0");
  return `${m}:${ss}`;
}

export default function TrackCard({ assetBase }) {
  const url = useMemo(() => `${assetBase}/demo-track.mp3`, [assetBase]);
  const audioRef = useRef(null);
  const rafRef = useRef(0);

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  const icons = useMemo(
    () => ({
      play: `${assetBase}/svgs/play.svg`,
      pause: `${assetBase}/svgs/pause.svg`,
      prev: `${assetBase}/svgs/previousTrack.svg`,
      next: `${assetBase}/svgs/nextTrack.svg`,
      trackPlayer: `${assetBase}/svgs/trackPlayer.svg`,
      auraWord: `${assetBase}/svgs/Aura.svg`,
      auraMark: `${assetBase}/svgs/smallAuraLogo.svg`,
    }),
    [assetBase]
  );

  useEffect(() => {
    const a = new Audio(url);
    a.preload = "metadata";
    audioRef.current = a;

    const onEnded = () => setIsPlaying(false);
    const onLoaded = () => {
      setDuration(Number.isFinite(a.duration) ? a.duration : 0);
    };
    const onTimeUpdate = () => setCurrentTime(a.currentTime || 0);

    a.addEventListener("ended", onEnded);
    a.addEventListener("loadedmetadata", onLoaded);
    a.addEventListener("timeupdate", onTimeUpdate);

    return () => {
      cancelAnimationFrame(rafRef.current);
      try {
        a.pause();
      } catch {}
      a.removeEventListener("ended", onEnded);
      a.removeEventListener("loadedmetadata", onLoaded);
      a.removeEventListener("timeupdate", onTimeUpdate);
    };
  }, [url]);

  const tickWhilePlaying = () => {
    const a = audioRef.current;
    if (!a) return;
    setCurrentTime(a.currentTime || 0);
    if (!a.paused) rafRef.current = requestAnimationFrame(tickWhilePlaying);
  };

  const togglePlay = async () => {
    const a = audioRef.current;
    if (!a) return;
    try {
      if (a.paused) {
        await a.play();
        setIsPlaying(true);
        rafRef.current = requestAnimationFrame(tickWhilePlaying);
      } else {
        a.pause();
        setIsPlaying(false);
      }
    } catch {
      setIsPlaying(false);
    }
  };

  const seekBy = (delta) => {
    const a = audioRef.current;
    if (!a) return;
    const d = Number.isFinite(a.duration) ? a.duration : 0;
    a.currentTime = clamp((a.currentTime || 0) + delta, 0, d || Infinity);
    setCurrentTime(a.currentTime || 0);
  };

  const progress = duration > 0 ? clamp(currentTime / duration, 0, 1) : 0;

  return (
    <div
      className="relative mx-auto group rounded-[24px] w-full"
      style={{
        boxShadow:
          "0 -4px 8px 0 rgba(255, 255, 255, 0.25) inset, 0 4px 8px 0 rgba(255, 255, 255, 0.25) inset",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
      }}
    >
      <div
        className="transition-all duration-300 ease-in-out group-hover:blur-sm"
        onMouseDown={(e) => e.preventDefault()}
      >
        <div
          className="w-full flex flex-col items-end justify-center relative overflow-hidden rounded-[24px] p-4 cursor-pointer border-t border-b border-t-[rgba(255,255,255,0.7)] border-b-[rgba(255,255,255,0.7)]"
          style={{
            background: "rgba(255, 255, 255, 0.40)",
            WebkitTapHighlightColor: "transparent",
            userSelect: "none",
          }}
          onClick={togglePlay}
        >
          <div className="flex items-center w-full gap-[22px]">
            <div className="w-[55px] h-[55px] shrink-0 relative">
              <img
                src={icons.trackPlayer}
                alt="track"
                className="w-full h-full"
                draggable={false}
              />
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
                <img
                  src={icons.auraMark}
                  alt="Aura"
                  className="flex-shrink-0"
                  style={{ width: "22.936px", height: "22.667px" }}
                  draggable={false}
                />
                <img
                  src={icons.auraWord}
                  alt="AURA"
                  className="w-[36px] h-[7px]"
                  draggable={false}
                />
              </div>
            </div>

            <div className="flex flex-1 flex-col items-start min-w-0 pt-1 gap-[2px]">
              <div className="flex items-start justify-between w-full">
                <p
                  className="uppercase"
                  style={{
                    overflow: "hidden",
                    color: "#1C1B1F",
                    textOverflow: "ellipsis",
                    fontFamily: "Inter, sans-serif",
                    fontSize: "10px",
                    fontWeight: 500,
                    lineHeight: "120%",
                    letterSpacing: "0.5px",
                  }}
                >
                  GROUNDING
                </p>
                <p
                  className="text-[#1C1B1F] text-[10px] font-medium leading-[120%] tracking-[0.5px] uppercase text-center"
                  style={{ fontFamily: "Inter, sans-serif" }}
                >
                  {formatTime(duration)}
                </p>
              </div>

              <div className="flex items-end justify-between w-full flex-1 gap-[4px]">
                <div className="flex flex-1 flex-col items-start justify-end min-w-0">
                  <p
                    className="text-[#1C1B1F] font-light overflow-hidden text-ellipsis line-clamp-1 w-full text-[18px] leading-[148%]"
                    style={{
                      fontFamily:
                        '"Test Martina Plantijn", "Times New Roman", serif',
                    }}
                  >
                    Reset (demo track)
                  </p>
                  <p
                    className="text-[#1C1B1F] font-medium overflow-hidden text-ellipsis line-clamp-1 w-full text-[14px]"
                    style={{ fontFamily: "Inter, sans-serif" }}
                  >
                    Aura
                  </p>
                </div>

                <div
                  className="flex-shrink-0"
                  style={{ width: "24px", height: "24px", opacity: 0.6 }}
                >
                  <span className="text-[#1C1B1F] text-[18px] leading-none select-none">
                    ›
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-3 w-full">
            <div className="relative min-h-[2px] w-full bg-[#1c1b1f26] rounded-full">
              <div
                className="absolute left-0 top-0 h-full bg-black rounded-full"
                style={{ width: `${progress * 100}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 ease-in-out pointer-events-none group-hover:bg-[#ffffff8a] rounded-[24px]">
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center gap-[14px] pointer-events-auto">
          <button
            type="button"
            className="w-[16px] shrink-0 cursor-pointer"
            aria-label="Rewind 30 seconds"
            onClick={() => seekBy(-30)}
          >
            <img src={icons.prev} alt="rewind-30" className="w-full h-full" />
          </button>

          <button
            type="button"
            aria-label={isPlaying ? "pause" : "play"}
            className="w-[40px] h-[40px] rounded-full bg-white/60 flex items-center justify-center"
            onClick={togglePlay}
          >
            <img
              src={isPlaying ? icons.pause : icons.play}
              alt={isPlaying ? "pause" : "play"}
              className="w-[17px] h-[17px]"
            />
          </button>

          <button
            type="button"
            className="w-[16px] shrink-0 cursor-pointer"
            aria-label="Forward 30 seconds"
            onClick={() => seekBy(30)}
          >
            <img src={icons.next} alt="forward-30" className="w-full h-full" />
          </button>
        </div>
      </div>
    </div>
  );
}


