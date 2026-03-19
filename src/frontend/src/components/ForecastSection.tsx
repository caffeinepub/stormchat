const forecast = [
  { day: "Mon", icon: "⛈️", high: "16°", low: "11°", desc: "Thunderstorm" },
  { day: "Tue", icon: "🌤️", high: "21°", low: "14°", desc: "Partly Cloudy" },
  { day: "Wed", icon: "☀️", high: "24°", low: "16°", desc: "Sunny" },
  { day: "Thu", icon: "🌧️", high: "18°", low: "13°", desc: "Light Rain" },
  { day: "Fri", icon: "🌫️", high: "15°", low: "10°", desc: "Foggy" },
];

export default function ForecastSection() {
  return (
    <section
      className="py-16 px-4"
      style={{
        background:
          "linear-gradient(180deg, oklch(0.13 0.10 240) 0%, oklch(0.10 0.06 230) 100%)",
      }}
    >
      <div className="max-w-5xl mx-auto">
        <h2
          className="text-xl font-semibold mb-8"
          style={{
            color: "rgba(255,255,255,0.95)",
            textShadow: "0 0 20px rgba(100,180,255,0.35)",
          }}
        >
          5-Day Forecast
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
          {forecast.map((item, idx) => (
            <div
              key={item.day}
              data-ocid={`forecast.item.${idx + 1}`}
              className="forecast-card rounded-2xl p-4 flex flex-col items-center gap-2 cursor-default"
              style={{
                background: "rgba(255,255,255,0.07)",
                backdropFilter: "blur(16px)",
                WebkitBackdropFilter: "blur(16px)",
                border: "1px solid rgba(100,180,255,0.2)",
              }}
            >
              <span
                className="text-xs font-bold tracking-wider uppercase"
                style={{ color: "rgba(147,197,253,0.9)" }}
              >
                {item.day}
              </span>
              <span
                className="text-4xl"
                style={{
                  filter: "drop-shadow(0 2px 8px rgba(100,180,255,0.4))",
                }}
              >
                {item.icon}
              </span>
              <div className="flex items-baseline gap-1">
                <span
                  className="text-lg font-bold"
                  style={{ color: "rgba(255,255,255,0.95)" }}
                >
                  {item.high}
                </span>
                <span
                  className="text-xs"
                  style={{ color: "rgba(100,150,220,0.8)" }}
                >
                  {item.low}
                </span>
              </div>
              <span
                className="text-xs text-center"
                style={{ color: "rgba(147,197,253,0.7)" }}
              >
                {item.desc}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
