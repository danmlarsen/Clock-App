//
// State
//
let state = {
    quote: null,
    ipTime: null,
    location: null,
    timeOfDay: '',
    detailsActive: false,
};

//
// Element selections
//
const appEl = document.querySelector('.app');
const quoteEl = document.querySelector('.quote');
const quoteContentEl = document.querySelector('.quote__content');
const quoteAuthorEl = document.querySelector('.quote__author');
const quoteRefreshBtn = document.querySelector('.quote__refresh');
const detailsBtn = document.querySelector('.btn');
const clockTimeEl = document.querySelector('.clock__time');
const clockLocationEl = document.querySelector('.clock__location');
const clockGreetingEl = document.querySelector('.clock__greeting');
const clockAbbEl = document.querySelector('.clock__abbreviation');
const detailsEl = document.querySelector('.details');
const loadingEl = document.querySelector('.loading-screen');

//
// API Query functions
//
const fetchQuote = () =>
    new Promise(async (resolve, reject) => {
        try {
            const res = await fetch(`https://api.quotable.io/random`);
            if (!res.ok) throw new Error('Error loading Quote..');
            const data = await res.json();

            state.quote = data;
            resolve();
        } catch (err) {
            reject(err);
        }
    });

const fetchTime = async function () {
    return new Promise(async (resolve, reject) => {
        try {
            // Proxy for fetching time based on IP over https
            const res = await fetch(
                `https://ancient-woodland-98023.herokuapp.com`
            );
            // const res = await fetch(`http://worldtimeapi.org/api/ip`);
            if (!res.ok) throw new Error('Error loading IP Time..');
            const data = await res.json();

            state.ipTime = data;
            resolve();
        } catch (err) {
            reject(err);
        }
    });
};

const fetchLocation = async function () {
    return new Promise(async (resolve, reject) => {
        try {
            const res = await fetch(`https://ipapi.co/json`);
            // const res = await fetch(`http://freegeoip.app/json`);
            if (!res.ok) throw new Error('Error loading location.');
            const data = await res.json();

            state.location = data;
            resolve();
        } catch (err) {
            reject(err);
        }
    });
};

//
// Render functions
//
const renderQuote = function (data) {
    const { content, author } = data;

    quoteContentEl.textContent = content;
    quoteAuthorEl.textContent = author;
};

const renderClock = function (utcTime) {
    const date = new Date(utcTime);

    // Format the clock hh:mm (24h)
    const intlDate = new Intl.DateTimeFormat(navigator.locale, {
        timeZone: state.ipTime.timezone,
        timeStyle: 'short',
        hour12: false,
    });
    const clock = intlDate.format(date);

    const markup = clock;
    if (clockTimeEl.textContent !== markup) clockTimeEl.textContent = markup;
};

const renderAbbreviation = function (abbr) {
    clockAbbEl.textContent = abbr;
};

const renderBackground = function () {
    const timeOfDay = state.timeOfDay;

    if (timeOfDay === 'evening') {
        appEl.classList.add('app--night');
        detailsEl.classList.add('details--night');
    } else {
        appEl.classList.remove('app--night');
        detailsEl.classList.remove('details--night');
    }
};

const renderGreeting = function () {
    const greeting = `Good ${state.timeOfDay}`;

    if (clockGreetingEl.textContent !== greeting) {
        clockGreetingEl.addEventListener(
            'transitionend',
            () => {
                clockGreetingEl.textContent = greeting;

                if (state.timeOfDay === 'evening')
                    clockGreetingEl.classList.add('clock__greeting--night');
                else clockGreetingEl.classList.remove('clock__greeting--night');

                clockGreetingEl.style.opacity = '1';
            },
            { once: true }
        );
        clockGreetingEl.style.opacity = '0';
    }
};

const renderLocation = function (location) {
    const { city, country_name: country } = location;

    const markup = `in ${city ? `${city}, ` : ''}${country}`;

    clockLocationEl.textContent = markup;
};

const renderDetails = function (date) {
    const {
        day_of_week: dayOfWeek,
        day_of_year: dayOfYear,
        timezone,
        week_number: weekNumber,
    } = date;

    const markup = `
    <li class="details__list-item">
        <h6>Current timezone</h6>
        <h2>${timezone}</h2>
    </li>
    <li class="details__list-item">
        <h6>Day of the year</h6>
        <h2>${dayOfYear}</h2>
    </li>
    <li class="details__list-item">
        <h6>Day of the week</h6>
        <h2>${dayOfWeek}</h2>
    </li>
    <li class="details__list-item">
        <h6>Week number</h6>
        <h2>${weekNumber}</h2>
    </li>
    `;

    detailsEl.querySelector('.details__list').innerHTML = markup;
};

//
// Handlers
//
const handleQuoteRefresh = async function () {
    quoteContentEl.style.opacity = 0;
    quoteAuthorEl.style.opacity = 0;
    quoteRefreshBtn.classList.add('quote__refresh--active');

    await fetchQuote();

    const handleAnimation = () => {
        quoteRefreshBtn.classList.remove('quote__refresh--active');
        quoteContentEl.style.opacity = 1;
        quoteAuthorEl.style.opacity = 1;
        renderQuote(state.quote);
    };
    quoteRefreshBtn.addEventListener('animationiteration', handleAnimation, {
        once: true,
    });
};

const handleDetailsOpen = function (e) {
    e.preventDefault();
    state.detailsActive = !state.detailsActive;

    if (state.detailsActive) {
        quoteEl.classList.add('quote--hidden');
        detailsEl.classList.remove('details--hidden');

        detailsBtn.classList.add('btn--active');
    } else {
        detailsEl.classList.add('details--hidden');
        quoteEl.classList.remove('quote--hidden');

        detailsBtn.classList.remove('btn--active');
    }

    detailsBtn.firstChild.textContent = state.detailsActive ? 'Less' : 'More';
};

const handleTimeOfDay = function (utcTime) {
    // Gets current hour for the timezone
    const hours = new Date(utcTime).toLocaleString('en-US', {
        hour: 'numeric',
        hour12: false,
        timeZone: state.ipTime.timezone,
    });

    // Check the time of day
    let newTimeOfDay = state.timeOfDay;
    if (hours >= 5 && hours < 12) {
        newTimeOfDay = 'morning';
    } else if (hours >= 12 && hours < 18) {
        newTimeOfDay = 'afternoon';
    } else if (hours >= 18 || hours < 5) {
        newTimeOfDay = 'evening';
    }

    // Re-render if time of day changed
    if (newTimeOfDay !== state.timeOfDay) {
        state.timeOfDay = newTimeOfDay;
        renderBackground();
        renderGreeting();
    }
};

const clockTick = function () {
    const now = Date.now();
    handleTimeOfDay(now);
    renderClock(now);
};

//
// Event listeners
//
quoteRefreshBtn.addEventListener('click', handleQuoteRefresh);
detailsBtn.addEventListener('click', handleDetailsOpen);

const init = async function () {
    try {
        // Run all API queries simultaneously
        await Promise.all([fetchTime(), fetchLocation(), fetchQuote()]);

        // Set time of day and render correct background/greeting
        handleTimeOfDay(state.ipTime.datetime);

        // Render all data
        renderClock(state.ipTime.datetime);
        renderAbbreviation(state.ipTime.abbreviation);
        renderDetails(state.ipTime);
        renderQuote(state.quote);
        renderLocation(state.location);

        // When loading transition ends, show the rendered app
        loadingEl.addEventListener(
            'transitionend',
            () => {
                appEl.classList.remove('app--loading');
                loadingEl.remove();
            },
            { once: true }
        );

        // Stop (hide) the loading animation
        loadingEl.classList.add('loading-screen--hidden');

        // Start interval for updating time
        setInterval(clockTick, 500);
    } catch (err) {
        const markup = `
            <div class="error-screen">
                <h2>Error</h2>
                <p>${err}</p> 
                <p>Reload to try again..</p>
            </div>
        `;
        document.body.insertAdjacentHTML('afterbegin', markup);
        appEl.remove();
        loadingEl.remove();
    }
};

init();
