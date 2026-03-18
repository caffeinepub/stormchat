const forecast = [
  {
    day: "Mon",
    icon: "⛈️",
    high: "16°",
    low: "11°",
    desc: "Thunderstorm",
    gradient: "linear-gradient(135deg, #e0f2fe 0%, #bae6fd 100%)",
  },
  {
    day: "Tue",
    icon: "🌤️",
    high: "21°",
    low: "14°",
    desc: "Partly Cloudy",
    gradient: "linear-gradient(135deg, #fef9c3 0%, #fde68a 100%)",
  },
  {
    day: "Wed",
    icon: "☀️",
    high: "24°",
    low: "16°",
    desc: "Sunny",
    gradient: "linear-gradient(135deg, #fef3c7 0%, #fbbf24 60%, #f97316 100%)",
  },
  {
    day: "Thu",
    icon: "🌧️",
    high: "18°",
    low: "13°",
    desc: "Light Rain",
    gradient: "linear-gradient(135deg, #ede9fe 0%, #c4b5fd 100%)",
  },
  {
    day: "Fri",
    icon: "🌫️",
    high: "15°",
    low: "10°",
    desc: "Foggy",
    gradient: "linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%)",
  },
];

export default function ForecastSection() {
  return (
    <section className="bg-white py-16 px-4">
      <div className="max-w-5xl mx-auto">
        <h2 className="text-xl font-semibold text-gray-800 mb-8">
          5-Day Forecast
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
          {forecast.map((item, idx) => (
            <div
              key={item.day}
              data-ocid={`forecast.item.${idx + 1}`}
              className="forecast-card rounded-2xl p-4 flex flex-col items-center gap-2 shadow-card cursor-default"
              style={{ background: item.gradient }}
            >
              <span className="text-xs font-bold text-gray-600 tracking-wider uppercase">
                {item.day}
              </span>
              <span className="text-4xl">{item.icon}</span>
              <div className="flex items-baseline gap-1">
                <span className="text-lg font-bold text-gray-800">
                  {item.high}
                </span>
                <span className="text-xs text-gray-500">{item.low}</span>
              </div>
              <span className="text-xs text-gray-500 text-center">
                {item.desc}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
