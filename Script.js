//  CONFIG 
const API_KEY = "5ef907ae01479acc59fd08dbbcc83a2d"; 
const BASE = "https://api.openweathermap.org/data/2.5";

//  SÉLECTEURS DOM 
const app = document.getElementById('app');
const searchForm = document.getElementById('searchForm');
const cityInput = document.getElementById('cityInput');
const geoBtn = document.getElementById('geoBtn');
const errorBox = document.getElementById('errorBox');
const currentContent = document.getElementById('currentContent');
const forecastEl = document.getElementById('forecast');
const citiesEl = document.getElementById('cities');
const refreshCitiesBtn = document.getElementById('refreshCities');

// Grandes villes à afficher
const POPULAR_CITIES = ['Dakar', 'Abidjan', 'Casablanca', 'Paris', 'New York', 'Tokyo', 'London', 'Dubai'];

// 

// Convertit le temps UTC en heure locale lisible
function formatLocalTime(timezoneSeconds){
    const nowUTC = new Date();
    const local = new Date(nowUTC.getTime() + timezoneSeconds*1000 + nowUTC.getTimezoneOffset()*60000);
    return new Intl.DateTimeFormat('fr-FR',{weekday:'long',hour:'2-digit',minute:'2-digit'}).format(local);
}

// Affiche un message d'erreur temporaire
function showError(message){
    errorBox.style.display = 'block';
    errorBox.textContent = message;
    setTimeout(()=>{ errorBox.style.display='none'; },5000);
}

// Applique un thème dynamique selon la météo
function applyThemeByWeather(main, isNight=false){
    app.classList.remove('theme-clear','theme-clouds','theme-rain','theme-thunder','theme-snow','theme-mist','theme-night');
    if(isNight){ app.classList.add('theme-night'); return; }
    const map = {
        Clear:'theme-clear',
        Clouds:'theme-clouds',
        Rain:'theme-rain',
        Drizzle:'theme-rain',
        Thunderstorm:'theme-thunder',
        Snow:'theme-snow',
        Mist:'theme-mist',
        Smoke:'theme-mist',
        Haze:'theme-mist',
        Dust:'theme-mist',
        Fog:'theme-mist',
        Sand:'theme-mist',
        Ash:'theme-mist',
        Squall:'theme-mist',
        Tornado:'theme-mist'
    };
    app.classList.add(map[main] || 'theme-clear');
}

// URL de l'icône OpenWeather
const iconUrl = icon => `https://openweathermap.org/img/wn/${icon}@2x.png`;



// Météo actuelle par ville
async function fetchCurrentByCity(city){
    const url = `${BASE}/weather?q=${encodeURIComponent(city)}&appid=${API_KEY}&units=metric&lang=fr`;
    const res = await fetch(url);
    if(!res.ok) throw new Error("Ville introuvable ou erreur API");
    return res.json();
}

// Prévisions par ville
async function fetchForecastByCity(city){
    const url = `${BASE}/forecast?q=${encodeURIComponent(city)}&appid=${API_KEY}&units=metric&lang=fr`;
    const res = await fetch(url);
    if(!res.ok) throw new Error("Erreur API prévisions");
    return res.json();
}

// Météo actuelle par coordonnées
async function fetchCurrentByCoords(lat, lon){
    const url = `${BASE}/weather?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric&lang=fr`;
    const res = await fetch(url);
    if(!res.ok) throw new Error("Erreur API météo actuelle par coordonnées");
    return res.json();
}

// Prévisions par coordonnées
async function fetchForecastByCoords(lat, lon){
    const url = `${BASE}/forecast?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric&lang=fr`;
    const res = await fetch(url);
    if(!res.ok) throw new Error("Erreur API prévisions par coordonnées");
    return res.json();
}

//  DOM 

// Affiche la météo actuelle
function renderCurrent(data){
    const {name, sys, weather, main, wind, timezone} = data;
    const w = weather[0];
    const isNight = w.icon.endsWith('n');
    applyThemeByWeather(w.main, isNight);
    currentContent.innerHTML = `
        <img class="icon" src="${iconUrl(w.icon)}" alt="${w.description}">
        <div>
            <h2>${name}, ${sys?.country||''}</h2>
            <div class="temp">${Math.round(main.temp)}°C</div>
            <div class="meta">Ressenti ${Math.round(main.feels_like)}° • ${w.description}</div>
            <div class="meta">💨 Vent ${Math.round(wind.speed)} m/s • 🕒 ${formatLocalTime(timezone)}</div>
        </div>
    `;
}

// Affiche les prévisions 5 jours
function renderForecast(list){
    forecastEl.innerHTML = '';
    list.forEach(item=>{
        const date = new Date(item.dt*1000);
        const dayName = new Intl.DateTimeFormat('fr-FR',{weekday:'short'}).format(date);
        const temp = Math.round(item.main.temp);
        const icon = iconUrl(item.weather[0].icon);
        forecastEl.innerHTML += `
            <div class="day">
                <div class="d-label">${dayName}</div>
                <img src="${icon}" alt="${item.weather[0].description}">
                <div class="d-temp">${temp}°C</div>
            </div>
        `;
    });
}

// Regroupe les prévisions pour afficher un seul élément par jour
function groupForecastDaily(list){
    const byDay = {};
    list.forEach(item=>{
        const key = new Date(item.dt*1000).toISOString().slice(0,10);
        if(!byDay[key]) byDay[key] = [];
        byDay[key].push(item);
    });
    return Object.keys(byDay).slice(0,5).map(key=>{
        const slots = byDay[key];
        let pick = slots.find(s=>s.dt_txt.includes('12:00:00')) || slots[Math.floor(slots.length/2)];
        return pick;
    });
}

// Affiche les grandes villes
async function renderCities(){
    citiesEl.innerHTML = '';
    for(const city of POPULAR_CITIES){
        try{
            const data = await fetchCurrentByCity(city);
            const icon = iconUrl(data.weather[0].icon);
            citiesEl.innerHTML += `
                <div class="city-card">
                    <div class="name">${city}</div>
                    <img src="${icon}" alt="${data.weather[0].description}">
                    <div class="c-temp">${Math.round(data.main.temp)}°C</div>
                </div>
            `;
        }catch(e){ console.log(e); }
    }
}

//  EVENTS 

// Recherche par formulaire
searchForm.addEventListener('submit', async e=>{
    e.preventDefault();
    const city = cityInput.value.trim();
    if(!city) return;
    try{
        const current = await fetchCurrentByCity(city);
        renderCurrent(current);
        const forecast = await fetchForecastByCity(city);
        renderForecast(groupForecastDaily(forecast.list));
    }catch(e){ showError(e.message); }
});

// Recherche par géolocalisation
geoBtn.addEventListener('click', ()=>{
    if(navigator.geolocation){
        navigator.geolocation.getCurrentPosition(async pos=>{
            try{
                const {latitude, longitude} = pos.coords;
                const current = await fetchCurrentByCoords(latitude, longitude);
                renderCurrent(current);
                const forecast = await fetchForecastByCoords(latitude, longitude);
                renderForecast(groupForecastDaily(forecast.list));
            }catch(e){ showError(e.message); }
        }, ()=>showError("Impossible d'obtenir la géolocalisation"));
    }else showError("Géolocalisation non supportée");
});

// Actualiser les grandes villes
refreshCitiesBtn.addEventListener('click', renderCities);

// =================== INIT ===================
renderCities();