const rainStreaks = Array.from({ length: 40 }, (_, i) => ({
  id: i,
  left: `${(i * 2.6 + Math.sin(i) * 15) % 100}%`,
  height: `${60 + ((i * 17) % 80)}px`,
  delay: `${(i * 0.22) % 4}s`,
  duration: `${0.7 + ((i * 0.13) % 1.2)}s`,
  opacity: 0.25 + (i % 4) * 0.1,
}));

export default function WeatherHero() {
  return (
    <section
      className="relative min-h-[92vh] flex flex-col items-center justify-center overflow-hidden pt-16"
      style={{
        background:
          "linear-gradient(160deg, oklch(0.18 0.18 280) 0%, oklch(0.20 0.16 260) 30%, oklch(0.22 0.15 240) 60%, oklch(0.12 0.08 200) 100%)",
      }}
    >
      {/* Aurora orb — top-left */}
      <div
        className="aurora-orb absolute pointer-events-none"
        style={{
          width: 600,
          height: 600,
          borderRadius: "50%",
          background:
            "radial-gradient(ellipse at center, rgba(80,100,220,0.22) 0%, rgba(60,80,200,0.10) 45%, transparent 70%)",
          top: "-120px",
          left: "-150px",
          filter: "blur(30px)",
        }}
      />

      {/* Cloud glow backdrop */}
      <div
        className="absolute pointer-events-none"
        style={{
          width: 340,
          height: 160,
          background:
            "radial-gradient(ellipse at center, rgba(130,170,255,0.18) 0%, transparent 70%)",
          top: "calc(50% - 180px)",
          left: "50%",
          transform: "translateX(-50%)",
          filter: "blur(24px)",
        }}
      />

      {/* Lightning bolt SVG */}
      <div
        className="lightning-bolt absolute pointer-events-none"
        style={{ top: "12%", right: "18%", opacity: 0 }}
      >
        <svg
          width="42"
          height="120"
          viewBox="0 0 42 120"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          role="presentation"
          aria-hidden="true"
        >
          <polyline
            points="28,0 14,50 24,50 6,120 34,44 20,44"
            fill="rgba(200,230,255,0.9)"
            stroke="rgba(180,220,255,0.7)"
            strokeWidth="1"
            strokeLinejoin="round"
          />
        </svg>
      </div>

      {/* Background cloud blobs */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ opacity: 0.14 }}
      >
        <div
          className="absolute rounded-full"
          style={{
            width: 460,
            height: 180,
            background: "rgba(255,255,255,0.7)",
            filter: "blur(50px)",
            top: "15%",
            left: "5%",
          }}
        />
        <div
          className="absolute rounded-full"
          style={{
            width: 300,
            height: 130,
            background: "rgba(255,255,255,0.55)",
            filter: "blur(40px)",
            top: "24%",
            right: "8%",
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
        <p
          className="text-blue-300 text-xs tracking-widest uppercase mb-3"
          style={{ opacity: 0.7 }}
        >
          40.7128° N, 74.0060° W
        </p>

        <h1
          className="font-bold uppercase tracking-wider mb-2"
          style={{
            fontSize: "clamp(2rem, 6vw, 3.5rem)",
            color: "white",
            textShadow:
              "0 2px 32px rgba(80,130,255,0.45), 0 2px 8px rgba(0,0,0,0.6)",
            letterSpacing: "0.08em",
          }}
        >
          NEW YORK, US
        </h1>

        <p className="text-blue-200 text-sm mb-6" style={{ opacity: 0.75 }}>
          18°C · Thursday, Mar 18 · 14:32 UTC
        </p>

        {/* Big glowing temperature */}
        <div
          className="font-bold text-white mb-4 leading-none"
          style={{
            fontSize: "clamp(5rem, 18vw, 10rem)",
            textShadow:
              "0 0 60px rgba(100,180,255,0.5), 0 0 120px rgba(80,140,255,0.3), 0 4px 24px rgba(0,0,0,0.5)",
            letterSpacing: "-0.03em",
          }}
        >
          18°
        </div>

        {/* Weather icon with glow */}
        <div className="weather-icon-float mb-3 relative">
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background:
                "radial-gradient(ellipse at center, rgba(130,180,255,0.22) 0%, transparent 70%)",
              filter: "blur(16px)",
              transform: "scale(1.5)",
            }}
          />
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
              fill="rgba(255,255,255,0.22)"
              stroke="rgba(255,255,255,0.55)"
              strokeWidth="2"
            />
            <ellipse
              cx="38"
              cy="40"
              rx="24"
              ry="16"
              fill="rgba(255,255,255,0.18)"
              stroke="rgba(255,255,255,0.45)"
              strokeWidth="2"
            />
            <ellipse
              cx="70"
              cy="40"
              rx="20"
              ry="14"
              fill="rgba(255,255,255,0.18)"
              stroke="rgba(255,255,255,0.45)"
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
          style={{ textShadow: "0 2px 16px rgba(100,180,255,0.4)" }}
        >
          Light Rain
        </p>

        {/* Stats bar — glassmorphism */}
        <div
          className="flex items-center gap-4 sm:gap-8 px-6 py-3 rounded-2xl text-sm text-blue-100"
          style={{
            background: "rgba(255,255,255,0.08)",
            backdropFilter: "blur(20px)",
            WebkitBackdropFilter: "blur(20px)",
            border: "1px solid rgba(100,180,255,0.3)",
            boxShadow: "0 4px 30px rgba(60,100,200,0.15)",
          }}
        >
          <div className="flex flex-col items-center">
            <span className="text-xs text-blue-300 mb-0.5">Wind</span>
            <span className="font-semibold">12 km/h</span>
          </div>
          <div
            className="w-px h-8"
            style={{ background: "rgba(100,180,255,0.2)" }}
          />
          <div className="flex flex-col items-center">
            <span className="text-xs text-blue-300 mb-0.5">Humidity</span>
            <span className="font-semibold">78%</span>
          </div>
          <div
            className="w-px h-8"
            style={{ background: "rgba(100,180,255,0.2)" }}
          />
          <div className="flex flex-col items-center">
            <span className="text-xs text-blue-300 mb-0.5">Pressure</span>
            <span className="font-semibold">1013 hPa</span>
          </div>
        </div>
      </div>

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
            fill="oklch(0.13 0.10 240)"
          />
        </svg>
      </div>
    </section>
  );
}
