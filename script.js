// Глобальная переменная API ключа
const API_KEY = '960dc4e3-9eae-4072-8f0c-98a5ed6c0d2a';

document.addEventListener('DOMContentLoaded', () => {
    initRegion();
    handleCookies();
    loadRecommendedByInterests();
    loadTrendingMovies();
    loadSeasonalPicks();
    setupSearch();
});

async function initRegion() {
    try {
        const res = await fetch('https://ipapi.co/json/');
        const data = await res.json();
        const country = data.country_name;
        const regionDiv = document.getElementById('regionBadge');
        if(regionDiv) regionDiv.innerText = `📍 ${country || 'World'}`;
        if(country === 'Russia') console.log('Доступ к РФ контенту');
    } catch(e) { console.warn(e); }
}

function handleCookies() {
    const consent = localStorage.getItem('oink_cookie_consent');
    const banner = document.getElementById('cookieConsent');
    if(consent === 'accepted' && banner) banner.style.display = 'none';
    document.getElementById('acceptCookies')?.addEventListener('click', () => {
        localStorage.setItem('oink_cookie_consent', 'accepted');
        banner.style.display = 'none';
        trackUserInterest();
    });
}

function trackUserInterest() {
    // имитация: если пользователь согласился, собираем историю из localStorage
    let interests = JSON.parse(localStorage.getItem('oink_interests') || '[]');
    if(interests.length === 0) interests = ['комедия', 'боевик', 'драма'];
    localStorage.setItem('oink_interests', JSON.stringify(interests));
}

async function loadRecommendedByInterests() {
    const grid = document.getElementById('recommendedGrid');
    grid.innerHTML = 'Подбираем рекомендации...';
    let interests = JSON.parse(localStorage.getItem('oink_interests') || '["фантастика","триллер"]');
    const keyword = interests[0] || 'фильм';
    try {
        const url = `https://kinopoiskapiunofficial.tech/api/v2.1/films/search-by-keyword?keyword=${keyword}&page=1`;
        const resp = await fetch(url, { headers: { 'X-API-KEY': API_KEY } });
        const data = await resp.json();
        const films = data.films || [];
        renderMovies(films.slice(0,8), grid);
    } catch(e) { grid.innerHTML = 'Не удалось загрузить рекомендации'; }
}

async function loadTrendingMovies() {
    const grid = document.getElementById('trendingGrid');
    grid.innerHTML = 'Загрузка популярного...';
    try {
        const url = 'https://kinopoiskapiunofficial.tech/api/v2.2/films/top?type=TOP_100_POPULAR_FILMS&page=1';
        const resp = await fetch(url, { headers: { 'X-API-KEY': API_KEY } });
        const data = await resp.json();
        const films = data.films || [];
        renderMovies(films.slice(0,12), grid);
    } catch(e) { grid.innerHTML = 'Ошибка трендов'; }
}

async function loadSeasonalPicks() {
    const grid = document.getElementById('seasonalGrid');
    const month = new Date().getMonth();
    let seasonKeyword = '';
    if(month >= 2 && month <= 4) seasonKeyword = 'весна';
    else if(month >=5 && month <=7) seasonKeyword = 'лето';
    else if(month >=8 && month <=10) seasonKeyword = 'осень';
    else seasonKeyword = 'зима';
    const seasonHeader = document.querySelector('#seasons h2');
    if(seasonHeader) seasonHeader.innerText = `🍂 Что посмотреть этой ${seasonKeyword}? (Новинки сезона)`;
    try {
        const url = `https://kinopoiskapiunofficial.tech/api/v2.1/films/search-by-keyword?keyword=${seasonKeyword}%20премьера&page=1`;
        const resp = await fetch(url, { headers: { 'X-API-KEY': API_KEY } });
        const data = await resp.json();
        renderMovies((data.films || []).slice(0,8), grid);
    } catch(e) { grid.innerHTML = 'Новинки сезона временно недоступны'; }
}

function renderMovies(movies, container) {
    if(!movies.length) { container.innerHTML = '<p>Ничего не найдено</p>'; return; }
    container.innerHTML = movies.map(m => `
        <div class="movie-card" data-kp="${m.kinopoiskId || m.filmId}" ondblclick="window.open('details.html?id=${m.kinopoiskId || m.filmId}', '_blank')" onclick="location.href='player.html?kp_id=${m.kinopoiskId || m.filmId}'">
            <img src="${m.posterUrlPreview || m.posterUrl || 'https://via.placeholder.com/300x450'}" alt="${m.nameRu || m.nameEn}">
            <h3>${m.nameRu || m.nameEn}</h3>
            <div class="rating">⭐ ${m.ratingKinopoisk || m.rating || '?'}</div>
        </div>
    `).join('');
}

function setupSearch() {
    const searchBtn = document.getElementById('searchBtn');
    const searchInput = document.getElementById('searchInput');
    async function doSearch() {
        const query = searchInput.value.trim();
        if(!query) return;
        const url = `https://kinopoiskapiunofficial.tech/api/v2.1/films/search-by-keyword?keyword=${encodeURIComponent(query)}&page=1`;
        try {
            const resp = await fetch(url, { headers: { 'X-API-KEY': API_KEY } });
            const data = await resp.json();
            const trendingGrid = document.getElementById('trendingGrid');
            trendingGrid.scrollIntoView({ behavior: 'smooth' });
            renderMovies(data.films || [], trendingGrid);
        } catch(e) { alert('Ошибка поиска'); }
    }
    searchBtn.addEventListener('click', doSearch);
    searchInput.addEventListener('keypress', (e) => { if(e.key === 'Enter') doSearch(); });
}

window.attachCardClick = function() {}; // вспомогательная функция уже в рендере
