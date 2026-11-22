import { useEffect, useRef, useState } from 'react';
import { Search, MapPin, Droplets, Wind, Thermometer, CloudSun, LoaderCircle } from 'lucide-react';
import './App.css';

const descriptions = {
  0: ['Clear sky', '☀️'], 1: ['Mainly clear', '🌤️'], 2: ['Partly cloudy', '⛅'], 3: ['Overcast', '☁️'],
  45: ['Fog', '🌫️'], 48: ['Rime fog', '🌫️'], 51: ['Light drizzle', '🌦️'], 53: ['Drizzle', '🌦️'], 55: ['Heavy drizzle', '🌧️'],
  56: ['Freezing drizzle', '🌧️'], 57: ['Freezing drizzle', '🌧️'], 61: ['Light rain', '🌦️'], 63: ['Rain', '🌧️'], 65: ['Heavy rain', '🌧️'],
  66: ['Freezing rain', '🌧️'], 67: ['Freezing rain', '🌧️'], 71: ['Light snow', '🌨️'], 73: ['Snow', '❄️'], 75: ['Heavy snow', '❄️'],
  77: ['Snow grains', '❄️'], 80: ['Rain showers', '🌦️'], 81: ['Rain showers', '🌧️'], 82: ['Heavy showers', '🌧️'],
  85: ['Snow showers', '🌨️'], 86: ['Heavy snow showers', '🌨️'], 95: ['Thunderstorm', '⛈️'], 96: ['Thunderstorm with hail', '⛈️'], 99: ['Thunderstorm with hail', '⛈️']
};
const condition = (code) => descriptions[code] || ['Variable weather', '🌤️'];
const dateLabel = (date, options) => new Intl.DateTimeFormat('en', { timeZone: 'UTC', ...options }).format(new Date(`${date}T12:00:00Z`));

export default function App() {
  const [query, setQuery] = useState('');
  const [forecastDays, setForecastDays] = useState(5);
  const [place, setPlace] = useState(null);
  const [weather, setWeather] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [suggestionLoading, setSuggestionLoading] = useState(false);
  const [selectedCity, setSelectedCity] = useState(null);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const searchId = useRef(0);

  useEffect(() => {
    const name = query.trim();
    const id = ++searchId.current;
    if (selectedCity || name.length < 2) { setSuggestions([]); setSuggestionLoading(false); return; }
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      setSuggestionLoading(true);
      try {
        const res = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(name)}&count=8&language=en&format=json`, { signal: controller.signal });
        if (!res.ok) throw new Error('City lookup unavailable. Please try again.');
        const data = await res.json();
        if (id === searchId.current) setSuggestions(data.results || []);
      } catch (err) {
        if (err.name !== 'AbortError' && id === searchId.current) setError(err.message);
      } finally { if (id === searchId.current) setSuggestionLoading(false); }
    }, 350);
    return () => { clearTimeout(timer); controller.abort(); };
  }, [query, selectedCity]);

  function chooseCity(city) {
    setSelectedCity(city);
    setQuery(`${city.name}, ${city.country}`);
    setSuggestions([]);
    setShowSuggestions(false);
    setError('');
    loadWeather(city);
  }

  async function loadWeather(location) {
    setLoading(true); setError('');
    try {
      const params = new URLSearchParams({ latitude: location.latitude, longitude: location.longitude, current: 'temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m', daily: 'weather_code,temperature_2m_max,temperature_2m_min', timezone: 'auto', forecast_days: '14' });
      const response = await fetch(`https://api.open-meteo.com/v1/forecast?${params}`);
      if (!response.ok) throw new Error('Weather service is unavailable. Please try again.');
      const result = await response.json();
      if (!result.current || !result.daily) throw new Error('Weather data is unavailable for this city.');
      setPlace(location); setWeather(result);
    } catch (err) { setError(err.message || 'Something went wrong.'); }
    finally { setLoading(false); }
  }

  async function search(city) {
    const name = city.trim();
    if (name.length < 2) { setError('Please enter at least two characters.'); return; }
    if (selectedCity) { await loadWeather(selectedCity); return; }
    setLoading(true); setError('');
    try {
      const response = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(name)}&count=8&language=en&format=json`);
      if (!response.ok) throw new Error('City lookup unavailable. Please try again.');
      const data = await response.json();
      const matches = data.results || [];
      if (!matches.length) { setError('No matching city found. Please check the spelling.'); setShowSuggestions(false); return; }
      if (matches.length === 1) { chooseCity(matches[0]); return; }
      setSuggestions(matches);
      setShowSuggestions(true);
      setError('Select a city from the suggestions to see its weather.');
    } catch (err) { setError(err.message || 'Something went wrong.'); }
    finally { setLoading(false); }
  }

  const current = weather?.current;
  return <div className="app-shell">
    <header className="header"><div className="brand"><CloudSun size={29}/><span>skyline<span className="brand-dot">.</span></span></div><span className="header-caption">YOUR DAILY WEATHER COMPANION</span></header>
    <main className="main">
      <div className="intro"><div className="eyebrow">THE WEATHER, SIMPLIFIED</div><h1>Every day is a <em>fresh forecast.</em></h1><p>Get current conditions and a look at the next fourteen days, anywhere in the world.</p></div>
      <div className="search-container"><form className="search" onSubmit={(e) => {e.preventDefault(); search(query);}}><Search size={20}/><input aria-label="City name" aria-autocomplete="list" aria-expanded={showSuggestions && query.trim().length >= 2 && !selectedCity && suggestions.length > 0} placeholder="Search for a city, e.g. Tokyo" value={query} onFocus={() => setShowSuggestions(true)} onChange={(e) => { setQuery(e.target.value); setSelectedCity(null); setShowSuggestions(e.target.value.trim().length >= 2); if (e.target.value.trim().length < 2) setSuggestions([]); setError(''); }}/><button disabled={loading} type="submit">{loading ? 'Searching...' : 'Search weather'} <span>→</span></button></form>
      {showSuggestions && query.trim().length >= 2 && !selectedCity && (suggestions.length > 0 || suggestionLoading) && <div className="city-suggestions" role="listbox" aria-label="Matching cities">{suggestionLoading && <div className="suggestion-status">Searching cities...</div>}{suggestions.map((city) => <button type="button" role="option" aria-selected="false" key={city.id} onClick={() => chooseCity(city)}><MapPin size={16}/><span>{city.name}{city.admin1 ? `, ${city.admin1}` : ''}, {city.country}</span></button>)}</div>}</div>
      {error && <p role="alert" className="error">{error}</p>}
      {loading && !weather && <div className="loading"><LoaderCircle className="spin"/> Loading weather...</div>}
      {weather && place && <><section className="today"><div className="today-top"><div className="location"><MapPin size={18}/><span>{place.name}{place.admin1 ? `, ${place.admin1}` : ''}, {place.country}</span></div><span className="live-pill"><span className="live-dot"/> CURRENT WEATHER</span></div><div className="today-main"><div><div className="temp">{Math.round(current.temperature_2m)}<span>°</span></div><div className="condition">{condition(current.weather_code)[0]}</div><div className="feels">Feels like {Math.round(current.apparent_temperature)}°C</div></div><div className="weather-emoji" role="img" aria-label={condition(current.weather_code)[0]}>{condition(current.weather_code)[1]}</div></div><div className="metrics"><div><Droplets size={21}/><div><span>Humidity</span><strong>{current.relative_humidity_2m}%</strong></div></div><div><Wind size={21}/><div><span>Wind speed</span><strong>{Math.round(current.wind_speed_10m)} km/h</strong></div></div><div><Thermometer size={21}/><div><span>Feels like</span><strong>{Math.round(current.apparent_temperature)}°C</strong></div></div></div></section>
      <section className="forecast"><div className="section-heading"><div><span className="eyebrow">PLAN AHEAD</span><h2>{forecastDays}-day forecast</h2></div><div className="forecast-actions"><span className="forecast-note">Daily high & low</span><div className="forecast-toggle" role="group" aria-label="Forecast length"><button type="button" className={forecastDays === 5 ? "active" : ""} aria-pressed={forecastDays === 5} onClick={() => setForecastDays(5)}>5 days</button><button type="button" className={forecastDays === 14 ? "active" : ""} aria-pressed={forecastDays === 14} onClick={() => setForecastDays(14)}>14 days</button></div></div></div><div className="forecast-grid">{weather.daily.time.slice(0, forecastDays).map((day, i) => <div className="forecast-day" key={day}><span className="day-name">{i === 0 ? 'Today' : dateLabel(day, { weekday: 'short' })}</span><span className="day-date">{dateLabel(day, { month: 'short', day: 'numeric' })}</span><span className="day-icon" role="img" aria-label={condition(weather.daily.weather_code[i])[0]}>{condition(weather.daily.weather_code[i])[1]}</span><span className="day-condition">{condition(weather.daily.weather_code[i])[0]}</span><div className="day-temps"><strong>{Math.round(weather.daily.temperature_2m_max[i])}°</strong><span>{Math.round(weather.daily.temperature_2m_min[i])}°</span></div></div>)}</div></section></>}
    </main><footer>Weather data by <a href="https://open-meteo.com/" target="_blank" rel="noreferrer">Open-Meteo</a> · Made for curious skies</footer>
  </div>;
}
