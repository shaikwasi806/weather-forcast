import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CloudRain, AlertCircle, Info, Wind, Droplets, Thermometer,
  MapPin, Search, Navigation, Settings, X, RefreshCw, Layers,
  Compass, Eye, Cloud, Sun, Zap, Satellite, Terminal
} from 'lucide-react';
import { cn } from './lib/utils';

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
  const [recentSearches, setRecentSearches] = useState(() => JSON.parse(localStorage.getItem('skycast_recent') || '[]'));

  const getThemeClass = useCallback(() => {
    if (!weatherData) return 'theme-default';
    const desc = weatherData.current.weather_descriptions[0].toLowerCase();
    if (desc.includes('sun') || desc.includes('clear')) return 'theme-sunny';
    if (desc.includes('cloud') || desc.includes('overcast')) return 'theme-cloudy';
    if (desc.includes('rain') || desc.includes('drizzle')) return 'theme-rainy';
    return 'theme-default';
  }, [weatherData]);

  const fetchWeather = useCallback(async (query) => {
    if (!query) return;
    setLoading(true);
    setError(null);

    let searchCity = query.trim().toLowerCase();
    if (searchCity === 'banglore') searchCity = 'bangalore';

    try {
      const endpoint = useHistorical && historicalDate ? 'historical' : 'current';
      const cleanKey = apiKey.trim();
      const url = `http://api.weatherstack.com/${endpoint}`;

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

      if (response.data.success === false) {
        const errorMsg = response.data.error.info || response.data.error.type || 'City not found or API error.';
        const errorCode = response.data.error.code;

        if (errorCode === 601 || errorCode === 602 || errorCode === 603 || errorCode === 604) {
          setError(`PREMIUM_RECOVERY: Historical logs unavailable on basic tier. Syncing live feed...`);
          setUseHistorical(false);
          setTimeout(() => fetchWeather(searchCity), 2000);
        } else {
          setError(`STATION_RESPONSE: ${errorMsg}`);
        }
        setWeatherData(null);
      } else {
        setWeatherData(response.data);
        setLastUpdated(new Date().toLocaleTimeString());
        const newRecent = [response.data.location.name, ...recentSearches.filter(c => c !== response.data.location.name)].slice(0, 5);
        setRecentSearches(newRecent);
        localStorage.setItem('skycast_recent', JSON.stringify(newRecent));
      }
    } catch (err) {
      if (err.response?.status === 401) setError(`ACCESS_DENIED: Invalid authentication key.`);
      else if (err.code === 'ERR_NETWORK') setError('PROTOCOL_ERROR: WeatherStack requires HTTP entry. Access denied over HTTPS.');
      else setError(`INTERFACE_ERROR: ${err.message}`);
      setWeatherData(null);
    } finally {
      setLoading(false);
    }
  }, [apiKey, useHistorical, historicalDate, recentSearches]);

  useEffect(() => {
    let interval;
    if (autoRefresh && weatherData) {
      interval = setInterval(() => fetchWeather(weatherData.location.name), 300000);
    }
    return () => clearInterval(interval);
  }, [autoRefresh, weatherData, fetchWeather]);

  const getUserLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => fetchWeather(`${pos.coords.latitude},${pos.coords.longitude}`),
        () => setError('Location protocol failed. Manual entry required.')
      );
    }
  };

  const getLogoClass = useCallback(() => {
    if (!weatherData) return '';
    const desc = weatherData.current.weather_descriptions[0].toLowerCase();
    if (desc.includes('sun') || desc.includes('clear')) return 'logo-glow-sunny';
    if (desc.includes('rain') || desc.includes('drizzle')) return 'logo-glow-rainy';
    if (desc.includes('cloud') || desc.includes('overcast')) return 'logo-glow-cloudy';
    return '';
  }, [weatherData]);

  return (
    <div className="relative min-h-screen text-white font-sans selection:bg-indigo-500/30 overflow-hidden bg-[#020617]">
      <div className={cn("mesh-bg transition-opacity duration-1000", getThemeClass())}>
        <div className="lava-orb orb-1" />
        <div className="lava-orb orb-2" />
      </div>

      <nav className="fixed top-0 left-0 right-0 z-50 px-6 py-4 flex justify-between items-center backdrop-blur-xl bg-black/20 border-b border-white/5">
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="flex items-center gap-3">
          <div className={cn("p-2 glass rounded-xl shadow-lg", getLogoClass())}>
            <Zap className="w-5 h-5 text-indigo-400" />
          </div>
          <span className="text-xl font-black tracking-tighter uppercase italic text-aurora">Aurora Night</span>
        </motion.div>

        <div className="flex items-center gap-4">
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-indigo-500/10 rounded-full border border-indigo-500/20 text-[9px] font-black tracking-widest text-indigo-300 uppercase">
            <Satellite size={10} className="animate-pulse" />
            Active Satellite Uplink
          </div>
          <motion.button whileHover={{ rotate: 90 }} onClick={() => setShowSettings(true)} className="p-2.5 glass rounded-xl text-indigo-200 border-white/10 hover:bg-white/10 transition-all">
            <Settings className="w-5 h-5" />
          </motion.button>
        </div>
      </nav>

      <main className="container mx-auto px-4 pt-32 pb-24 max-w-6xl relative z-10">
        <header className="flex flex-col items-center mb-16 text-center">
          <motion.h1
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="text-6xl md:text-8xl font-black tracking-tighter text-gradient leading-none mb-4"
          >
            SkyCast<span className="text-indigo-400">.</span>
          </motion.h1>
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }} className="text-indigo-200/50 text-[10px] font-black tracking-[0.6em] uppercase italic">
            Precision Atmospheric Matrix
          </motion.p>
        </header>

        <section className="max-w-4xl mx-auto mb-28 space-y-12">
          <div className="flex flex-wrap justify-center gap-4">
            <motion.button
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setUseHistorical(!useHistorical)}
              className={cn(
                "px-8 py-3 rounded-[2rem] text-[11px] font-black tracking-[0.2em] transition-all border flex items-center gap-3 uppercase",
                useHistorical ? "bg-indigo-600/30 border-indigo-400 text-indigo-100 shadow-[0_0_30px_rgba(99,102,241,0.3)]" : "bg-white/5 border-white/5 text-white/30"
              )}
            >
              <Terminal size={14} className={useHistorical ? "text-indigo-400" : "text-white/20"} />
              {useHistorical ? 'Archive Access Active' : 'Access Atmospheric Logs'}
            </motion.button>
            {recentSearches.map((c, i) => (
              <motion.button
                key={c}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 * i }}
                onClick={() => fetchWeather(c)}
                className="px-8 py-3 rounded-[2rem] text-[11px] font-black tracking-[0.2em] bg-white/5 hover:bg-indigo-500/10 border border-white/5 transition-all text-white/30 hover:text-indigo-200 uppercase"
              >
                {c}
              </motion.button>
            ))}
          </div>

          <div className="relative group input-glow transition-all duration-1000">
            <div className="absolute -inset-2 bg-gradient-to-r from-indigo-600/20 via-sky-400/10 to-indigo-600/20 rounded-[4rem] blur-[80px] opacity-0 group-hover:opacity-100 transition duration-1000"></div>
            <div className="relative flex flex-col md:flex-row items-center gap-3 p-3 glass rounded-[3.5rem]">
              <div className="flex-1 flex items-center px-8 gap-6 w-full">
                <Search className="text-indigo-400/40 w-8 h-8 shrink-0" />
                <input
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && fetchWeather(city)}
                  placeholder="Initiate atmospheric coordinate search..."
                  className="w-full bg-transparent border-none focus:ring-0 text-white placeholder-white/20 py-6 text-2xl outline-none font-bold tracking-tight"
                />
              </div>

              <div className="flex gap-3 w-full md:w-auto p-2">
                {useHistorical && (
                  <div className="flex items-center gap-4 px-8 py-5 bg-indigo-600/10 rounded-[2.5rem] border border-indigo-400/20 shrink-0">
                    <input type="date" value={historicalDate} onChange={(e) => setHistoricalDate(e.target.value)} className="bg-transparent text-white text-sm font-black outline-none [color-scheme:dark]" />
                  </div>
                )}
                <button onClick={getUserLocation} className="p-6 glass rounded-[2.5rem] hover:bg-indigo-500/10 transition-all text-indigo-300" title="Locate Coordinates">
                  <Navigation className="w-8 h-8" />
                </button>
                <button
                  onClick={() => fetchWeather(city)}
                  disabled={loading || (useHistorical && !historicalDate)}
                  className="flex-1 md:flex-none px-16 py-6 bg-gradient-to-r from-indigo-600 to-indigo-400 hover:from-indigo-500 hover:to-indigo-300 text-white font-black text-xl rounded-[2.5rem] transition-all shadow-2xl active:scale-95 disabled:opacity-50 flex items-center justify-center gap-5 uppercase tracking-tighter"
                >
                  {loading ? <RefreshCw className="animate-spin w-7 h-7" /> : <><RefreshCw className="w-6 h-6" /> Sync</>}
                </button>
              </div>
            </div>
          </div>
        </section>

        <AnimatePresence mode="wait">
          {error && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 30 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="max-w-2xl mx-auto p-12 glass border-red-500/20 bg-red-500/5 rounded-[3.5rem] flex items-start gap-10 text-red-100 mb-20 relative overflow-hidden group shadow-2xl"
            >
              <div className="p-6 bg-red-500/10 rounded-[2.5rem] text-red-400 shadow-inner">
                <AlertCircle className="w-12 h-12" />
              </div>
              <div className="space-y-3">
                <h4 className="font-black text-[11px] tracking-[0.4em] uppercase text-red-400/60 italic">Critical System Failure</h4>
                <p className="text-2xl font-bold leading-tight selection:bg-red-500/30">{error}</p>
              </div>
            </motion.div>
          )}

          {weatherData ? <WeatherDashboard data={weatherData} lastUpdated={lastUpdated} autoRefresh={autoRefresh} setAutoRefresh={setAutoRefresh} onRefresh={() => fetchWeather(weatherData.location.name)} isLoading={loading} /> : !loading && !error && <StationStandby />}
        </AnimatePresence>
      </main>

      <footer className="fixed bottom-0 left-0 right-0 p-12 flex justify-between items-center pointer-events-none">
        <div className="opacity-20 flex items-center gap-4 text-[10px] font-bold tracking-[0.6em] uppercase">
          <div className="w-12 h-[1px] bg-white" />
          V5.0 AURORA PROTOCOL
        </div>
        <div className="opacity-20 text-[10px] font-bold tracking-[0.6em] uppercase">
          LATENCY: {lastUpdated ? '0.04ms' : 'OFFLINE'}
        </div>
      </footer>

      <SettingsModal isOpen={showSettings} onClose={() => setShowSettings(false)} apiKey={apiKey} onSave={(key) => { setApiKey(key); localStorage.setItem('skycast_api_key', key); setShowSettings(false); }} />
    </div>
  );
}

function StationStandby() {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-40">
      <div className="w-48 h-48 bg-indigo-600/5 rounded-[5rem] flex items-center justify-center mx-auto mb-16 border border-indigo-500/10 shadow-2xl relative animate-float">
        <div className="absolute inset-0 bg-indigo-500/5 blur-[100px] rounded-full" />
        <Satellite className="text-indigo-400/20 w-24 h-24" />
      </div>
      <h3 className="text-6xl font-black mb-8 tracking-tighter text-gradient">System Idle</h3>
      <p className="text-indigo-200/30 text-2xl font-bold max-w-xl mx-auto leading-relaxed italic">The atmospheric matrix is awaiting a manual handshake. Connect to the global satellite network to establish a neural downlink.</p>
    </motion.div>
  );
}

function WeatherDashboard({ data, lastUpdated, autoRefresh, setAutoRefresh, onRefresh, isLoading }) {
  const { location, current, historical } = data;
  const isHistorical = !!historical;
  const targetData = isHistorical ? Object.values(historical)[0] : current;

  return (
    <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} className="space-y-16">
      <div className="flex flex-col lg:flex-row gap-16">
        <div className="flex-1 glass p-10 md:p-14 rounded-[3rem] relative overflow-hidden group shadow-[0_30px_60px_-15px_rgba(0,0,0,0.5)] border-white/10">
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-500/10 blur-[150px] -mr-48 -mt-48" />

          <div className="relative z-10">
            <div className="flex flex-col lg:flex-row justify-between items-start gap-10 mb-12">
              <div className="space-y-6 flex-1 max-w-full">
                <div className="inline-flex items-center gap-3 px-5 py-2 glass rounded-full text-indigo-300 border border-indigo-400/30">
                  <MapPin size={18} className="animate-bounce" />
                  <span className="text-sm font-black uppercase tracking-[0.4em] italic">{location.region || location.country}</span>
                </div>

                <div className="flex flex-col gap-2">
                  <h2 className={cn(
                    "font-black tracking-tighter leading-none text-aurora break-words",
                    location.name.length > 15 ? "text-5xl md:text-6xl" : "text-7xl md:text-8xl"
                  )}>{location.name}</h2>

                  <div className="flex items-center gap-6 mt-4 md:mt-0">
                    <div className="text-[6rem] md:text-[8rem] font-black tracking-tighter leading-none text-gradient flex items-start drop-shadow-2xl">
                      {targetData.temperature}
                      <span className="text-4xl md:text-6xl mt-4 font-light text-indigo-300/40 ml-2">°</span>
                    </div>
                    <div className="border-l-2 border-indigo-500/20 pl-6 self-center">
                      <p className="text-2xl md:text-4xl font-black text-indigo-100 uppercase tracking-tight italic">
                        {targetData.weather_descriptions?.[0]}
                      </p>
                      <p className="text-[10px] font-black text-indigo-300/40 uppercase tracking-[0.4em] mt-2">
                        {isHistorical ? `Atmospheric Log: ${Object.keys(historical)[0]}` : `Uplink Sync: ${location.localtime}`}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
              <Metric label=" थर्मल (Thermal)" value={`${targetData.feelslike || targetData.temperature}°`} icon={<Thermometer />} />
              <Metric label=" नमी (Humidity)" value={`${targetData.humidity}%`} icon={<Droplets />} />
              <Metric label=" हवा (Wind)" value={targetData.wind_speed} unit="KM/H" icon={<Wind />} />
              <Metric label=" दबाव (Pressure)" value={targetData.pressure} unit="MB" icon={<Layers />} />
            </div>
          </div>
        </div>

        <div className="w-full lg:w-[400px] space-y-8">
          <AIAdvice data={targetData} />

          <div className="glass p-10 rounded-[3rem] relative overflow-hidden border-white/10">
            <h4 className="text-[9px] font-black mb-10 flex items-center gap-4 italic tracking-[0.5em] uppercase text-indigo-300">
              <Compass size={16} className="text-indigo-400 animate-spin-slow" />
              Satellite Telemetry
            </h4>
            <div className="space-y-3">
              <TelemetryRow label="Wind Dir" value={targetData.wind_dir || '---'} />
              <TelemetryRow label="UV Index" value={`${targetData.uv_index || 0} UV`} />
              <TelemetryRow label="Visibility" value={`${targetData.visibility || 0} KM`} />
              <TelemetryRow label="Cloud Cover" value={`${targetData.cloudcover || 0}%`} />
              <TelemetryRow label="Precip" value={`${targetData.precip || 0} MM`} />
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function AIAdvice({ data }) {
  const getAdvice = () => {
    if (data.temperature > 32) return "CORE ALERT: Critical thermal surge detected. Solar intensity at peak thresholds. Seek climate-shielded environments immediately.";
    if (data.temperature < 10) return "THERMAL WARNING: Environment cooling rapidly. Kinetic output will be reduced. Initiate progressive thermal insulation protocols.";
    if (data.wind_speed > 30) return "KINETIC NOTICE: High-velocity atmospheric currents active. Secure all external structural elements. Flight paths restricted.";
    if (data.humidity > 80) return "SATURATION ALERT: Extreme moisture density. Interface precision may be compromised by heavy oxidation.";
    return "STABILITY ACHIEVED: Atmospheric equilibrium established. Nominal conditions for prolonged external deployment and primary operations.";
  };

  return (
    <motion.div
      whileHover={{ scale: 1.02, y: -5 }}
      className="glass-light p-10 rounded-[3rem] relative overflow-hidden group shadow-2xl border-white/20"
    >
      <div className="absolute top-0 right-0 p-6 text-indigo-900/10 transition-transform group-hover:scale-110"><Zap size={48} /></div>
      <div className="flex items-center gap-4 mb-8">
        <div className="p-2.5 bg-indigo-600 rounded-xl text-white shadow-xl">
          <Eye size={16} />
        </div>
        <span className="text-[10px] font-black uppercase tracking-[0.4em] text-indigo-600 font-mono">Neural Interface</span>
      </div>
      <p className="text-2xl font-bold text-slate-900 leading-snug italic font-serif">
        "{getAdvice()}"
      </p>
      <div className="mt-8 h-1.5 bg-indigo-100/50 rounded-full overflow-hidden">
        <motion.div initial={{ x: '-100%' }} animate={{ x: '100%' }} transition={{ repeat: Infinity, duration: 4, ease: "linear" }} className="w-1/3 h-full bg-indigo-600" />
      </div>
    </motion.div>
  );
}

function Metric({ label, value, unit, icon }) {
  return (
    <div className="p-6 metric-card rounded-3xl border border-white/10 relative overflow-hidden group text-left bg-indigo-500/10 backdrop-blur-3xl">
      <div className="text-indigo-300 mb-5 group-hover:scale-110 transition-transform duration-500">
        {React.cloneElement(icon, { size: 28 })}
      </div>
      <p className="text-[9px] font-black text-indigo-100/60 uppercase tracking-[0.3em] mb-3">{label}</p>
      <p className="text-4xl font-black tracking-tight text-white drop-shadow-lg">
        {value}
        {unit && <span className="text-[10px] font-black text-indigo-300/40 ml-2 tracking-widest font-mono">{unit}</span>}
      </p>
    </div>
  );
}

function TelemetryRow({ label, value }) {
  return (
    <div className="telemetry-row group">
      <span className="text-white/10 text-[10px] font-bold uppercase tracking-[0.3em] group-hover:text-indigo-400 transition-colors">{label}</span>
      <span className="font-black text-2xl text-white italic tracking-tighter group-hover:text-indigo-200">{value}</span>
    </div>
  );
}

function SettingsModal({ isOpen, onClose, apiKey, onSave }) {
  const [val, setVal] = useState(apiKey);
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/95 backdrop-blur-2xl">
      <motion.div initial={{ opacity: 0, scale: 0.9, y: 50 }} animate={{ opacity: 1, scale: 1, y: 0 }} className="glass p-20 max-w-2xl w-full border border-indigo-500/20 shadow-[0_0_150px_-20px_rgba(99,102,241,0.2)] rounded-[5rem] relative overflow-hidden">
        <div className="absolute -top-20 -right-20 w-80 h-80 bg-indigo-500/10 blur-[120px] rounded-full" />
        <div className="flex justify-between items-center mb-20">
          <h2 className="text-4xl font-black italic tracking-tighter uppercase text-gradient">Handshake Protocol</h2>
          <button onClick={onClose} className="p-4 hover:bg-white/5 rounded-3xl transition-all border border-white/5"><X size={24} /></button>
        </div>
        <div className="space-y-16">
          <div className="space-y-8">
            <label className="block text-indigo-200/40 font-black uppercase tracking-[0.6em] text-[11px] mb-2 pl-6">Neural Identity Key</label>
            <div className="flex gap-6 p-3 glass-morphism rounded-[3rem] border border-white/10 input-glow transition-all">
              <input type="text" value={val} onChange={(e) => setVal(e.target.value)} className="flex-1 bg-transparent px-8 py-6 text-2xl outline-none text-white font-mono tracking-widest" placeholder="CORE_ID_ACCESS" />
              <button onClick={() => onSave(val)} className="px-14 py-6 bg-indigo-600 hover:bg-indigo-500 rounded-[2.5rem] font-black text-sm uppercase tracking-[0.4em] transition-all shadow-2xl">Authenticate</button>
            </div>
          </div>
          <p className="text-indigo-200/20 text-sm italic font-medium leading-relaxed bg-white/5 p-8 rounded-[2.5rem] border border-white/5">Establish a secure satellite handshake using a valid WeatherStack API key. Default access keys are shared across the public matrix. Tier restrictions apply for temporal log requests.</p>
        </div>
      </motion.div>
    </div>
  );
}

export default App;
