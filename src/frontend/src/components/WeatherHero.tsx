const rainStreaks = Array.from({ length: 30 }, (_, i) => ({
  id: i,
  left: `${(i * 3.4 + Math.sin(i) * 15) % 100}%`,
  height: `${60 + ((i * 17) % 80)}px`,
  delay: `${(i * 0.28) % 4}s`,
  duration: `${0.8 + ((i * 0.13) % 1.2)}s`,
  opacity: 0.3 + (i % 3) * 0.12,
}));

export default function WeatherHero() {
  return (
    <section
      className="relative min-h-[92vh] flex flex-col items-center justify-center overflow-hidden pt-16"
      style={{
        background:
          "linear-gradient(135deg, oklch(0.52 0.16 45) 0%, oklch(0.42 0.13 50) 25%, oklch(0.30 0.09 245) 65%, oklch(0.18 0.07 240) 100%)",
      }}
    >
      {/* Clouds - background shapes */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ opacity: 0.18 }}
      >
        <div
          className="absolute rounded-full"
          style={{
            width: 400,
            height: 180,
            background: "rgba(255,255,255,0.6)",
            filter: "blur(40px)",
            top: "18%",
            left: "8%",
          }}
        />
        <div
          className="absolute rounded-full"
          style={{
            width: 280,
            height: 120,
            background: "rgba(255,255,255,0.5)",
            filter: "blur(35px)",
            top: "28%",
            right: "10%",
          }}
        />
        <div
          className="absolute rounded-full"
          style={{
            width: 500,
            height: 200,
            background: "rgba(255,200,120,0.4)",
            filter: "blur(60px)",
            bottom: "30%",
            left: "15%",
          }}
        />
      </div>

      {/* Rain streaks */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {rainStreaks.map((streak) => (
          <div
            key={streak.id}
            className="rain-streak"
            style={{
              left: streak.left,
              height: streak.height,
              top: "-20%",
              animationDelay: streak.delay,
              animationDuration: streak.duration,
              opacity: streak.opacity,
            }}
          />
        ))}
      </div>

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center text-center px-4">
        <p className="text-blue-200 text-xs tracking-widest uppercase mb-3 opacity-80">
          40.7128° N, 74.0060° W
        </p>

        <h1
          className="font-bold uppercase tracking-wider mb-2"
          style={{
            fontSize: "clamp(2rem, 6vw, 3.5rem)",
            color: "white",
            textShadow: "0 2px 24px rgba(0,0,0,0.5)",
            letterSpacing: "0.08em",
          }}
        >
          NEW YORK, US
        </h1>

        <p className="text-blue-100 text-sm mb-8 opacity-80">
          18°C  ·  Thursday, Mar 18  ·  14:32 UTC
        </p>

        {/* Weather icon */}
        <div className="weather-icon-float mb-4">
          <svg
            width="110"
            height="80"
            viewBox="0 0 110 80"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            role="img"
            aria-label="Rain cloud weather icon"
          >
            <title>Rain cloud weather icon</title>
            <ellipse
              cx="55"
              cy="32"
              rx="38"
              ry="22"
              fill="rgba(255,255,255,0.25)"
              stroke="rgba(255,255,255,0.6)"
              strokeWidth="2"
            />
            <ellipse
              cx="38"
              cy="40"
              rx="24"
              ry="16"
              fill="rgba(255,255,255,0.2)"
              stroke="rgba(255,255,255,0.5)"
              strokeWidth="2"
            />
            <ellipse
              cx="70"
              cy="40"
              rx="20"
              ry="14"
              fill="rgba(255,255,255,0.2)"
              stroke="rgba(255,255,255,0.5)"
              strokeWidth="2"
            />
            <line
              x1="38"
              y1="56"
              x2="34"
              y2="68"
              stroke="rgba(174,214,241,0.9)"
              strokeWidth="2.5"
              strokeLinecap="round"
            />
            <line
              x1="50"
              y1="58"
              x2="46"
              y2="70"
              stroke="rgba(174,214,241,0.9)"
              strokeWidth="2.5"
              strokeLinecap="round"
            />
            <line
              x1="62"
              y1="56"
              x2="58"
              y2="68"
              stroke="rgba(174,214,241,0.9)"
              strokeWidth="2.5"
              strokeLinecap="round"
            />
            <line
              x1="74"
              y1="54"
              x2="70"
              y2="66"
              stroke="rgba(174,214,241,0.9)"
              strokeWidth="2.5"
              strokeLinecap="round"
            />
          </svg>
        </div>

        <p
          className="text-2xl font-semibold text-white mb-8"
          style={{ textShadow: "0 2px 12px rgba(0,0,0,0.4)" }}
        >
          Light Rain
        </p>

        {/* Stats row */}
        <div
          className="flex items-center gap-4 sm:gap-8 px-6 py-3 rounded-2xl text-sm text-blue-100"
          style={{
            background: "rgba(255,255,255,0.1)",
            backdropFilter: "blur(12px)",
            border: "1px solid rgba(255,255,255,0.2)",
          }}
        >
          <div className="flex flex-col items-center">
            <span className="text-xs text-blue-300 mb-0.5">Wind</span>
            <span className="font-semibold">12 km/h</span>
          </div>
          <div className="w-px h-8 bg-white/20" />
          <div className="flex flex-col items-center">
            <span className="text-xs text-blue-300 mb-0.5">Humidity</span>
            <span className="font-semibold">78%</span>
          </div>
          <div className="w-px h-8 bg-white/20" />
          <div className="flex flex-col items-center">
            <span className="text-xs text-blue-300 mb-0.5">Pressure</span>
            <span className="font-semibold">1013 hPa</span>
          </div>
        </div>
      </div>

      {/* Floating gear button */}
      <button
        type="button"
        className="absolute right-6 top-1/2 -translate-y-1/2 w-10 h-10 rounded-xl flex items-center justify-center"
        style={{
          background: "rgba(255,255,255,0.15)",
          backdropFilter: "blur(8px)",
          border: "1px solid rgba(255,255,255,0.25)",
        }}
        aria-label="Settings"
      >
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="rgba(255,255,255,0.8)"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          role="img"
          aria-label="Settings gear icon"
        >
          <title>Settings gear icon</title>
          <circle cx="12" cy="12" r="3" />
          <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
        </svg>
      </button>

      {/* Bottom wave separator */}
      <div className="absolute bottom-0 left-0 right-0">
        <svg
          viewBox="0 0 1440 60"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          preserveAspectRatio="none"
          role="presentation"
          aria-hidden="true"
        >
          <path
            d="M0 60V30C240 0 480 60 720 30C960 0 1200 60 1440 30V60H0Z"
            fill="white"
          />
        </svg>
      </div>
    </section>
  );
}
