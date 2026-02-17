import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { CloudRain, AlertCircle, Info, Wind, Droplets, Thermometer, MapPin, Search, Navigation, Settings, X, RefreshCw, Layers } from 'lucide-react';
import { cn } from './lib/utils';

// Original key provided by user (401 error observed)
const DEFAULT_API_KEY = '34492e3cb3c0a2e5f567c98c1f89551f';

function App() {
  const [weatherData, setWeatherData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [city, setCity] = useState('');
  const [apiKey, setApiKey] = useState(() => localStorage.getItem('skycast_api_key') || DEFAULT_API_KEY);
  const [showSettings, setShowSettings] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [historicalDate, setHistoricalDate] = useState('');
  const [useHistorical, setUseHistorical] = useState(false);

  const fetchWeather = useCallback(async (query) => {
    if (!query) return;
    setLoading(true);
    setError(null);

    // Auto-fix common spelling in the query
    let searchCity = query.trim().toLowerCase();
    if (searchCity === 'banglore') searchCity = 'bangalore';

    try {
      const endpoint = useHistorical && historicalDate ? 'historical' : 'current';
      const cleanKey = apiKey.trim();
      const url = `http://api.weatherstack.com/${endpoint}`;

      console.log(`[SKYCAST_DEBUG] Dialing atmospheric station: ${url}`);
      console.log(`[SKYCAST_DEBUG] Query: ${searchCity}`);

      const response = await axios.get(url, {
        params: {
          access_key: cleanKey,
          query: searchCity,
          ...(useHistorical && historicalDate ? {
            historical_date: historicalDate,
            hourly: 1,
            interval: 3
          } : {})
        }
      });

      console.log('[SKYCAST_DEBUG] Link Establish Success:', response.data);

      if (response.data.success === false) {
        const errorMsg = response.data.error.info || response.data.error.type || 'City not found or API error.';
        setError(`STATION_RESPONSE: ${errorMsg}`);
        setWeatherData(null);
      } else {
        setWeatherData(response.data);
        setLastUpdated(new Date().toLocaleTimeString());
      }
    } catch (err) {
      console.error('[SKYCAST_DEBUG] Critical Link Failure:', err);
      const serverMsg = err.response?.data?.error?.info || err.response?.data?.error?.type;

      if (err.response?.status === 401) {
        setError(`DENIED (401): API key is invalid/expired. Check your WeatherStack account.`);
      } else if (err.response?.status === 400) {
        setError(`MALFORMED (400): The server rejected the request structure. Ensure the API key is active.`);
      } else if (err.code === 'ERR_NETWORK') {
        setError('UPSTREAM_FAILURE: WeatherStack Free only supports HTTP. Ensure you are visiting http://localhost:5173 (not https).');
      } else {
        setError(`INTERFACE_ERROR: ${serverMsg || err.message}`);
      }
      setWeatherData(null);
    } finally {
      setLoading(false);
    }
  }, [apiKey, useHistorical, historicalDate]);

  // Handle Auto-Refresh
  useEffect(() => {
    let interval;
    if (autoRefresh && weatherData) {
      interval = setInterval(() => {
        const query = weatherData.location.name;
        fetchWeather(query);
      }, 300000); // 5 minutes
    }
    return () => clearInterval(interval);
  }, [autoRefresh, weatherData, fetchWeather]);

  const getUserLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          fetchWeather(`${position.coords.latitude},${position.coords.longitude}`);
        },
        () => setError('Location access denied. Please enter city manually.')
      );
    }
  };

  const saveApiKey = (newKey) => {
    setApiKey(newKey);
    localStorage.setItem('skycast_api_key', newKey);
    setShowSettings(false);
    setError(null);
  };

  return (
    <div className="relative min-h-screen text-white font-sans selection:bg-blue-500/30 overflow-hidden">
      <div className="mesh-bg" />

      <main className="container mx-auto px-4 pt-12 pb-24 max-w-6xl relative z-10">
        {/* Top Actions */}
        <div className="absolute top-0 right-0 p-8 flex gap-4">
          <button
            onClick={() => setShowSettings(true)}
            className="p-3 glass rounded-2xl hover:bg-white/10 transition-all text-blue-200"
            title="API Settings"
          >
            <Settings className="w-6 h-6" />
          </button>
        </div>

        {/* Header */}
        <header className="flex flex-col items-center mb-16">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex items-center gap-5 mb-6"
          >
            <div className="p-5 glass shadow-2xl animate-float bg-blue-500/10">
              <CloudRain className="w-14 h-14 text-blue-400" />
            </div>
            <h1 className="text-7xl font-black tracking-tighter text-gradient pb-2">
              SkyCast
            </h1>
          </motion.div>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-blue-200/50 text-xl font-medium"
          >
            Professional real-time atmospheric insights.
          </motion.p>
        </header>

        {/* Search Section */}
        <section className="max-w-3xl mx-auto mb-16 space-y-4">
          <div className="flex justify-center gap-4 mb-2">
            <button
              onClick={() => setUseHistorical(!useHistorical)}
              className={cn(
                "px-6 py-2 rounded-2xl text-xs font-black tracking-[0.2em] transition-all border flex items-center gap-2",
                useHistorical
                  ? "bg-blue-500/20 border-blue-500 text-blue-300 shadow-[0_0_20px_rgba(59,130,246,0.2)]"
                  : "bg-white/5 border-white/10 text-white/30"
              )}
            >
              <div className={cn("w-2 h-2 rounded-full", useHistorical ? "bg-blue-400 animate-pulse" : "bg-white/20")} />
              HISTORICAL_MODE: {useHistorical ? 'ACTIVE' : 'OFF'}
            </button>
          </div>

          <div className="relative group input-focus-glow transition-all duration-500 rounded-[2rem]">
            <div className="absolute -inset-1 bg-gradient-to-r from-blue-600/30 to-cyan-500/30 rounded-[2rem] blur-xl opacity-0 group-hover:opacity-100 transition duration-1000"></div>
            <div className="relative flex flex-col md:flex-row items-center gap-3 p-3 glass rounded-[1.8rem]">
              <div className="flex-1 flex items-center px-5 gap-4 w-full">
                <Search className="text-white/20 w-6 h-6 shrink-0" />
                <input
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && fetchWeather(city)}
                  placeholder="Search city... (e.g. London)"
                  className="w-full bg-transparent border-none focus:ring-0 text-white placeholder-white/20 py-4 text-xl outline-none"
                />
              </div>

              {useHistorical && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex items-center gap-3 px-4 py-2 bg-blue-500/10 rounded-2xl border border-blue-500/20"
                >
                  <label className="text-[10px] font-black text-blue-400 uppercase tracking-widest shrink-0">Target Date</label>
                  <input
                    type="date"
                    value={historicalDate}
                    onChange={(e) => setHistoricalDate(e.target.value)}
                    className="bg-transparent text-white text-sm font-bold outline-none [color-scheme:dark]"
                  />
                </motion.div>
              )}

              <div className="flex gap-2 mr-2 w-full md:w-auto">
                <button
                  onClick={getUserLocation}
                  className="p-4 glass rounded-2xl hover:bg-white/10 transition-colors text-blue-300"
                  title="Current location"
                >
                  <Navigation className="w-6 h-6" />
                </button>
                <button
                  onClick={() => fetchWeather(city)}
                  disabled={loading || (useHistorical && !historicalDate)}
                  className="flex-1 md:flex-none px-10 py-4 bg-blue-600 hover:bg-blue-500 text-white font-black text-lg rounded-2xl transition-all shadow-xl active:scale-95 disabled:opacity-50 flex items-center justify-center gap-3"
                >
                  {loading ? <RefreshCw className="w-6 h-6 animate-spin" /> : 'EXPLORE'}
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Content Section */}
        <AnimatePresence mode="wait">
          {error && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="max-w-xl mx-auto p-8 glass border-red-500/30 bg-red-500/5 rounded-[2.5rem] flex items-center gap-6 text-red-100 mb-12"
            >
              <div className="p-4 bg-red-500/10 rounded-3xl text-red-400">
                <AlertCircle className="w-8 h-8" />
              </div>
              <div>
                <h4 className="font-black text-xl mb-1 italic">SYSTEM ERROR</h4>
                <p className="text-lg opacity-70 leading-tight">{error}</p>
                {error.includes('Key') && (
                  <button
                    onClick={() => setShowSettings(true)}
                    className="mt-3 text-sm font-bold border-b border-red-400/50 hover:border-red-400 transition-colors"
                  >
                    UPDATE API KEY
                  </button>
                )}
              </div>
            </motion.div>
          )}

          {weatherData ? (
            <WeatherDashboard
              data={weatherData}
              lastUpdated={lastUpdated}
              autoRefresh={autoRefresh}
              setAutoRefresh={setAutoRefresh}
              onRefresh={() => fetchWeather(weatherData.location.name)}
              isLoading={loading}
            />
          ) : !loading && !error && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-24"
            >
              <div className="w-32 h-32 bg-blue-600/5 rounded-[2.5rem] flex items-center justify-center mx-auto mb-10 border border-white/5 shadow-inner">
                <Layers className="text-blue-400/40 w-16 h-16" />
              </div>
              <h3 className="text-4xl font-black mb-4 tracking-tight">STATION STANDBY</h3>
              <p className="text-blue-100/30 text-xl font-medium max-w-md mx-auto">Enter global coordinates or city name to establish atmospheric connection.</p>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Settings Modal */}
      <AnimatePresence>
        {showSettings && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/60 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="glass p-10 max-w-2xl w-full border-blue-500/20 shadow-[0_0_100px_rgba(30,58,138,0.5)]"
            >
              <div className="flex justify-between items-center mb-8">
                <h2 className="text-3xl font-black italic tracking-tighter">API CONFIGURATION</h2>
                <button onClick={() => setShowSettings(false)} className="p-2 hover:bg-white/5 rounded-xl transition-colors">
                  <X />
                </button>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="block text-blue-200/50 font-bold uppercase tracking-widest text-sm mb-3">WeatherStack Access Key</label>
                  <div className="flex gap-3">
                    <input
                      type="text"
                      defaultValue={apiKey}
                      id="key-input"
                      className="flex-1 bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-lg outline-none focus:border-blue-500/50 transition-colors"
                      placeholder="Paste your API key here..."
                    />
                    <button
                      onClick={() => saveApiKey(document.getElementById('key-input').value)}
                      className="px-8 py-4 bg-blue-600 hover:bg-blue-500 rounded-2xl font-black text-sm uppercase tracking-widest transition-all"
                    >
                      SAVE
                    </button>
                  </div>
                  <p className="mt-4 text-white/30 text-sm leading-relaxed">
                    Get your key at <a href="https://weatherstack.com" target="_blank" className="text-blue-400 underline italic">weatherstack.com</a>. Free keys only work over HTTP.
                  </p>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <footer className="fixed bottom-8 w-full text-center pointer-events-none opacity-20 hover:opacity-100 transition-opacity">
        <p className="text-white text-[10px] font-mono uppercase tracking-[0.6em]">
          DATA_FEED: WEATHERSTACK &bull; CORE_SYSTEM: SKYCAST_v4.2.1
        </p>
      </footer>
    </div>
  );
}

function WeatherDashboard({ data, lastUpdated, autoRefresh, setAutoRefresh, onRefresh, isLoading }) {
  const { location, current } = data;

  return (
    <div className="space-y-8">
      {/* Dynamic Header Tooltip */}
      <div className="flex justify-between items-center px-4">
        <div className="flex items-center gap-3 text-blue-400/60 font-mono text-sm">
          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          SYSTEM_SYNC: ACTIVE &bull; UPDATED: {lastUpdated}
        </div>
        <div className="flex gap-4">
          <button
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={cn(
              "px-4 py-2 rounded-xl text-xs font-black transition-all border",
              autoRefresh ? "bg-blue-500/20 border-blue-500 text-blue-300" : "bg-white/5 border-white/10 text-white/40"
            )}
          >
            AUTO_REFRESH: {autoRefresh ? 'ON' : 'OFF'}
          </button>
          <button
            onClick={onRefresh}
            disabled={isLoading}
            className="p-2 glass rounded-xl hover:bg-white/10 transition-all disabled:opacity-50"
          >
            <RefreshCw size={18} className={cn(isLoading && "animate-spin")} />
          </button>
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="grid grid-cols-1 lg:grid-cols-4 gap-8"
      >
        {/* Main Status Block */}
        <div className="lg:col-span-3 glass p-12 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-blue-500/10 blur-[120px] -mr-48 -mt-48 transition-all duration-1000 group-hover:bg-blue-500/20" />

          <div className="relative z-10">
            <div className="flex flex-col md:flex-row md:items-start justify-between gap-10 mb-16">
              <div>
                <div className="flex items-center gap-3 text-blue-400 mb-4">
                  <MapPin size={24} className="animate-bounce" />
                  <span className="text-lg font-black uppercase tracking-[0.3em] italic">{location.region || location.country}</span>
                </div>
                <h2 className="text-8xl md:text-9xl font-black mb-2 tracking-tighter leading-none">{location.name}</h2>
                <p className="text-2xl text-blue-100/30 font-bold italic">LOCAL_OBSERVATION: {location.localtime}</p>
              </div>

              <div className="flex items-center gap-10">
                <div className="text-right">
                  <div className="text-[10rem] md:text-[12rem] font-black tracking-tighter flex leading-none text-gradient drop-shadow-2xl">
                    {current.temperature}
                    <span className="text-5xl md:text-6xl mt-8 font-light text-blue-400 opacity-50">°</span>
                  </div>
                  <p className="text-3xl font-black text-blue-200 uppercase tracking-[0.2em] italic -mt-6">{current.weather_descriptions[0]}</p>
                </div>
                <div className="relative">
                  <div className="absolute inset-0 bg-blue-400/20 blur-3xl rounded-full" />
                  <img
                    src={current.weather_icons[0]}
                    className="w-48 h-48 rounded-[3rem] border-8 border-white/5 shadow-2xl animate-float relative z-10"
                    alt="weather icon"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
              <Metric label="Apparent" value={`${current.feelslike}°`} icon={<Thermometer />} />
              <Metric label="Saturation" value={`${current.humidity}%`} icon={<Droplets />} />
              <Metric label="Velocity" value={`${current.wind_speed}`} unit="km/h" icon={<Wind />} />
              <Metric label="Barometer" value={`${current.pressure}`} unit="mb" icon={<Layers />} />
            </div>
          </div>
        </div>

        {/* Secondary Telemetry */}
        <div className="flex flex-col gap-8">
          <div className="glass p-10 flex-1 border-white/5 relative bg-gradient-to-b from-white/5 to-transparent">
            <h4 className="text-xl font-black mb-8 flex items-center gap-3 italic tracking-tight">
              <span className="w-1.5 h-6 bg-blue-500 rounded-full" />
              ANALYTICS
            </h4>
            <div className="space-y-6">
              <TelemetryRow label="Wind Heading" value={current.wind_dir} />
              <TelemetryRow label="Radiation" value={`${current.uv_index} UV`} />
              <TelemetryRow label="Visibility Range" value={`${current.visibility} km`} />
              <TelemetryRow label="Fallout Ratio" value={`${current.precip} mm`} />
              <TelemetryRow label="Solar Flux" value={current.observation_time} />
            </div>
          </div>

          <motion.div
            whileHover={{ scale: 1.02 }}
            className="glass-morphism p-10 bg-gradient-to-br from-blue-600/30 via-blue-800/10 to-transparent border-blue-400/20 shadow-lg"
          >
            <p className="text-xs font-black mb-4 uppercase tracking-[0.3em] text-blue-400 flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-blue-400" />
              Intelligent Advice
            </p>
            <p className="text-xl font-bold text-blue-50 leading-tight italic">
              {current.temperature > 25 ? "Thermal levels elevated. Optimize hydration and seek cooling station." :
                current.temperature < 15 ? "Cooler atmospheric shift detected. External thermal layering advised." :
                  "Optimal equilibrium maintained. External conditions are favorable."}
            </p>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
}

function Metric({ label, value, unit, icon }) {
  return (
    <div className="p-8 glass-morphism rounded-[2rem] hover:bg-white/10 transition-all border-white/5 group relative overflow-hidden">
      <div className="text-blue-400/40 mb-5 scale-125 transition-transform group-hover:scale-150 group-hover:text-blue-400">{icon}</div>
      <p className="text-xs font-black text-white/20 uppercase tracking-[0.2em] mb-2">{label}</p>
      <p className="text-4xl font-black tracking-tighter">
        {value}
        {unit && <span className="text-sm font-bold text-white/30 ml-2 italic">{unit}</span>}
      </p>
      <div className="absolute -bottom-2 -right-2 w-12 h-12 bg-blue-500/5 blur-xl group-hover:bg-blue-500/20 transition-all" />
    </div>
  );
}

function TelemetryRow({ label, value }) {
  return (
    <div className="flex justify-between items-center py-3 border-b border-white/5 hover:border-blue-500/30 transition-colors group">
      <span className="text-white/30 text-xs font-bold uppercase tracking-widest group-hover:text-white/60">{label}</span>
      <span className="font-black text-lg text-blue-100 italic">{value}</span>
    </div>
  );
}

export default App;
