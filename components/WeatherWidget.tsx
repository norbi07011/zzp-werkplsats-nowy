import React, { useState, useEffect } from "react";

interface WeatherData {
  temp: number;
  feels_like: number;
  temp_min: number;
  temp_max: number;
  humidity: number;
  description: string;
  icon: string;
  wind_speed: number;
  sunrise: number;
  sunset: number;
}

const WeatherWidget: React.FC = () => {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());

  // Update clock every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Fetch weather data
  useEffect(() => {
    const fetchWeather = async () => {
      try {
        // Den Haag (The Hague) coordinates
        const lat = 52.0705;
        const lon = 4.3007;
        const apiKey = "YOUR_API_KEY"; // Replace with actual API key or use free service

        // Using OpenWeatherMap API (free tier)
        const response = await fetch(
          `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=metric&lang=nl&appid=${apiKey}`
        );

        if (!response.ok) {
          // Fallback to mock data if API fails
          throw new Error("API failed");
        }

        const data = await response.json();

        setWeather({
          temp: Math.round(data.main.temp),
          feels_like: Math.round(data.main.feels_like),
          temp_min: Math.round(data.main.temp_min),
          temp_max: Math.round(data.main.temp_max),
          humidity: data.main.humidity,
          description: data.weather[0].description,
          icon: data.weather[0].icon,
          wind_speed: Math.round(data.wind.speed * 3.6), // Convert m/s to km/h
          sunrise: data.sys.sunrise,
          sunset: data.sys.sunset,
        });
      } catch (error) {
        console.error("Weather fetch error:", error);
        // Mock data for Den Haag
        setWeather({
          temp: 12,
          feels_like: 10,
          temp_min: 9,
          temp_max: 15,
          humidity: 78,
          description: "bewolkt",
          icon: "03d",
          wind_speed: 18,
          sunrise: Date.now() / 1000 - 3600,
          sunset: Date.now() / 1000 + 7200,
        });
      } finally {
        setLoading(false);
      }
    };

    fetchWeather();
    // Refresh every 10 minutes
    const interval = setInterval(fetchWeather, 600000);
    return () => clearInterval(interval);
  }, []);

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString("nl-NL", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString("nl-NL", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const getWeatherIcon = () => {
    if (!weather) return null;

    const icon = weather.icon;
    const isDay = icon.includes("d");

    // Clear sky
    if (icon.startsWith("01")) {
      return (
        <svg
          className="w-16 h-16 text-yellow-400 transition-all duration-500 group-hover:text-yellow-500 group-hover:scale-110 group-hover:rotate-12"
          viewBox="0 0 64 64"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <circle
            cx={32}
            cy={32}
            r={10}
            fill="currentColor"
            className="drop-shadow-[0_0_12px_rgba(250,204,21,0.9)]"
          />
          <g className="transition-transform duration-500 group-hover:rotate-45">
            <line
              x1={32}
              y1={16}
              x2={32}
              y2={8}
              stroke="currentColor"
              strokeWidth={2}
              strokeLinecap="round"
            />
            <line
              x1={32}
              y1={56}
              x2={32}
              y2={48}
              stroke="currentColor"
              strokeWidth={2}
              strokeLinecap="round"
            />
            <line
              x1={16}
              y1={32}
              x2={8}
              y2={32}
              stroke="currentColor"
              strokeWidth={2}
              strokeLinecap="round"
            />
            <line
              x1={56}
              y1={32}
              x2={48}
              y2={32}
              stroke="currentColor"
              strokeWidth={2}
              strokeLinecap="round"
            />
            <line
              x1="20.93"
              y1="20.93"
              x2="15.51"
              y2="15.51"
              stroke="currentColor"
              strokeWidth={2}
              strokeLinecap="round"
            />
            <line
              x1="48.49"
              y1="48.49"
              x2="43.07"
              y2="43.07"
              stroke="currentColor"
              strokeWidth={2}
              strokeLinecap="round"
            />
            <line
              x1="20.93"
              y1="43.07"
              x2="15.51"
              y2="48.49"
              stroke="currentColor"
              strokeWidth={2}
              strokeLinecap="round"
            />
            <line
              x1="48.49"
              y1="15.51"
              x2="43.07"
              y2="20.93"
              stroke="currentColor"
              strokeWidth={2}
              strokeLinecap="round"
            />
          </g>
        </svg>
      );
    }

    // Partly cloudy
    if (icon.startsWith("02") || icon.startsWith("03")) {
      return (
        <svg
          className="w-16 h-16 transition-all duration-500 group-hover:scale-110"
          viewBox="0 0 64 64"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <circle
            cx={28}
            cy={24}
            r={8}
            fill="#FCD34D"
            className="drop-shadow-[0_0_8px_rgba(250,204,21,0.7)]"
          />
          <path
            d="M20 40a8 8 0 0 1 8-8h8a10 10 0 0 1 0 20H28a8 8 0 0 1-8-8z"
            fill="#E0E7FF"
            className="drop-shadow-md"
          />
          <path
            d="M24 44a6 6 0 0 1 6-6h6a8 8 0 0 1 0 16h-6a6 6 0 0 1-6-6z"
            fill="#C7D2FE"
          />
        </svg>
      );
    }

    // Cloudy
    if (icon.startsWith("04")) {
      return (
        <svg
          className="w-16 h-16 text-gray-300 transition-all duration-500 group-hover:scale-110 group-hover:text-gray-200"
          viewBox="0 0 64 64"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M16 36a10 10 0 0 1 10-10h12a12 12 0 0 1 0 24H26a10 10 0 0 1-10-10z"
            fill="currentColor"
            className="drop-shadow-lg"
          />
          <path
            d="M20 40a8 8 0 0 1 8-8h8a10 10 0 0 1 0 20h-8a8 8 0 0 1-8-8z"
            fill="#CBD5E1"
          />
        </svg>
      );
    }

    // Rain
    if (icon.startsWith("09") || icon.startsWith("10")) {
      return (
        <svg
          className="w-16 h-16 transition-all duration-500 group-hover:scale-110"
          viewBox="0 0 64 64"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M16 32a10 10 0 0 1 10-10h12a12 12 0 0 1 0 24H26a10 10 0 0 1-10-10z"
            fill="#94A3B8"
            className="drop-shadow-lg"
          />
          <g className="animate-pulse">
            <line
              x1={24}
              y1={48}
              x2={24}
              y2={54}
              stroke="#60A5FA"
              strokeWidth={2}
              strokeLinecap="round"
            />
            <line
              x1={32}
              y1={46}
              x2={32}
              y2={56}
              stroke="#60A5FA"
              strokeWidth={2}
              strokeLinecap="round"
            />
            <line
              x1={40}
              y1={48}
              x2={40}
              y2={54}
              stroke="#60A5FA"
              strokeWidth={2}
              strokeLinecap="round"
            />
          </g>
        </svg>
      );
    }

    // Default cloudy
    return (
      <svg
        className="w-16 h-16 text-gray-300 transition-all duration-500 group-hover:scale-110"
        viewBox="0 0 64 64"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M16 36a10 10 0 0 1 10-10h12a12 12 0 0 1 0 24H26a10 10 0 0 1-10-10z"
          fill="currentColor"
          className="drop-shadow-lg"
        />
      </svg>
    );
  };

  if (loading) {
    return (
      <div className="weather-widget max-w-sm w-full mx-auto bg-gradient-to-br from-gray-900 via-teal-950 to-black rounded-2xl p-6 shadow-xl border border-teal-800/50 animate-pulse">
        <div className="h-8 bg-teal-800/30 rounded mb-4"></div>
        <div className="h-20 bg-teal-800/30 rounded mb-6"></div>
        <div className="h-24 bg-teal-800/30 rounded"></div>
      </div>
    );
  }

  if (!weather) return null;

  return (
    <div className="weather-widget group relative max-w-sm w-full mx-auto bg-gradient-to-br from-gray-900 via-teal-950 to-black rounded-2xl p-6 shadow-xl shadow-teal-600/40 border border-teal-800/50 overflow-hidden transition-all duration-500 hover:shadow-2xl hover:shadow-teal-600/60 hover:scale-[1.02]">
      {/* Floating particles */}
      <div className="absolute inset-0 opacity-20 pointer-events-none">
        <div
          className="absolute w-3 h-3 bg-cyan-400 rounded-full blur-md transition-all duration-500 group-hover:scale-150 animate-float"
          style={{ left: "15%", top: "20%" }}
        />
        <div
          className="absolute w-4 h-4 bg-teal-300 rounded-full blur-lg transition-all duration-500 group-hover:scale-125 animate-float"
          style={{ right: "25%", bottom: "15%", animationDelay: "1s" }}
        />
        <div
          className="absolute w-2 h-2 bg-yellow-400 rounded-full blur transition-all duration-500 group-hover:scale-175 animate-float"
          style={{ left: "40%", top: "10%", animationDelay: "2s" }}
        />
      </div>

      {/* Animated border */}
      <div className="absolute inset-0 border-2 border-transparent rounded-2xl transition-all duration-500 group-hover:border-teal-500/40">
        <div className="absolute top-0 left-0 w-1/3 h-1 bg-gradient-to-r from-transparent via-teal-400 to-transparent transition-all duration-500 group-hover:w-full" />
      </div>

      {/* Location & Time */}
      <div className="text-center mb-4 relative z-10">
        <p className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-teal-300 to-emerald-400 transition-all duration-500 group-hover:drop-shadow-[0_0_8px_rgba(34,211,238,0.9)] mb-1">
          Den Haag 🇳🇱
        </p>
        <p className="text-xs text-gray-400 mb-2">{formatDate(currentTime)}</p>
        <div className="inline-flex items-center gap-2 bg-teal-900/30 px-4 py-2 rounded-full border border-teal-700/40 backdrop-blur-sm">
          <svg
            className="w-4 h-4 text-teal-300 animate-pulse"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <circle cx="12" cy="12" r="10" strokeWidth="2" />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M12 6v6l4 2"
            />
          </svg>
          <p className="text-lg font-mono font-bold text-teal-300 tabular-nums tracking-wider">
            {formatTime(currentTime)}
          </p>
        </div>
      </div>

      {/* Main Weather Display */}
      <div className="flex items-center justify-between mb-6 relative z-10">
        {getWeatherIcon()}

        <div className="text-right">
          <p className="text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-teal-300 to-emerald-400 transition-all duration-500 group-hover:text-6xl group-hover:drop-shadow-[0_0_12px_rgba(34,211,238,0.9)] leading-none mb-2">
            {weather.temp}°
          </p>
          <p className="text-sm text-gray-300 capitalize font-medium">
            {weather.description}
          </p>
          <p className="text-xs text-gray-400 mt-1">
            Voelt als {weather.feels_like}°
          </p>
        </div>
      </div>

      {/* Weather Details */}
      <div className="grid grid-cols-2 gap-4 bg-teal-900/20 rounded-lg p-4 backdrop-blur-sm border border-teal-700/40 relative z-10 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-teal-500/10 to-cyan-500/10 opacity-0 transition-all duration-500 group-hover:opacity-50 rounded-lg" />

        <div className="flex flex-col gap-3 relative z-10">
          <div className="flex items-center gap-2">
            <svg
              className="w-5 h-5 text-orange-400"
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path d="M12 2v10m0 0l-4-4m4 4l4-4" />
            </svg>
            <div>
              <p className="text-xs text-gray-400">Hoog</p>
              <p className="text-lg font-bold text-orange-400 transition-all duration-500 group-hover:text-orange-300">
                {weather.temp_max}°C
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <svg
              className="w-5 h-5 text-blue-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 14l-7 7m0 0l-7-7m7 7V3"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 3v10m-4-4h8"
              />
            </svg>
            <div>
              <p className="text-xs text-gray-400">Vochtigheid</p>
              <p className="text-lg font-bold text-blue-400 transition-all duration-500 group-hover:text-blue-300">
                {weather.humidity}%
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-3 relative z-10">
          <div className="flex items-center gap-2">
            <svg
              className="w-5 h-5 text-blue-300"
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path d="M12 2v10m0 0l-4-4m4 4l4-4" />
            </svg>
            <div>
              <p className="text-xs text-gray-400">Laag</p>
              <p className="text-lg font-bold text-blue-300 transition-all duration-500 group-hover:text-blue-200">
                {weather.temp_min}°C
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <svg
              className="w-5 h-5 text-teal-300 transition-all duration-500 group-hover:rotate-12"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M14 10h4.764a2 2 0 0 1 1.789 2.894l-3.5 7A2 2 0 0 1 15.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 0 0-2-2h-.095c-.5 0-.905.405-.905.905a3.61 3.61 0 0 1-.608 2.006L7 10m7-7V3m-7 7h10"
              />
            </svg>
            <div>
              <p className="text-xs text-gray-400">Wind</p>
              <p className="text-lg font-bold text-teal-300 transition-all duration-500 group-hover:text-teal-200">
                {weather.wind_speed} km/h
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Footer info */}
      <div className="mt-4 text-center relative z-10">
        <p className="text-xs text-gray-500">
          Laatste update:{" "}
          {new Date().toLocaleTimeString("nl-NL", {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </p>
      </div>
    </div>
  );
};

export default WeatherWidget;
