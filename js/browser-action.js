const timerElement = document.getElementById('timer');
const limitElement = document.getElementById('time-limit');
const statsDayElement = document.getElementById('stats-day');
const ignoreElement = document.getElementById('ignore');
const settingsElement = document.getElementById('options');

const urlMatches = browser.runtime.getManifest().content_scripts[0].matches;
let intervalId = null;
let time = 0;
const setting = {
  timeLimiter: null,
  timeIgnore: null,
  ignoreListener: false
};

function init(background) {
  time = background.getTimeSpend();

  browser.storage.local.get().then(store => {
    setting.timeLimiter = store.timeLimiter || 0;
    setting.timeIgnore = store.timeIgnore || 0;

    createChartTimeSpend(store.statsDays || []);
    updateTimer(time);

    limitElement.textContent = secondToTime(store.timeLimiter);
  });

  browser.tabs
    .query({ active: true, currentWindow: true, url: urlMatches })
    .then(tabs => (tabs.length > 0 ? startTimer() : stopTimer()));

  settingsElement.addEventListener('click', () => browser.runtime.openOptionsPage());
}

function startTimer() {
  if (!intervalId) {
    intervalId = setInterval(() => updateTimer(++time), 1000);
  }
}

function stopTimer() {
  if (intervalId) {
    clearInterval(intervalId);
    intervalId = null;
  }
}

function createChartTimeSpend(statsDays) {
  let maxTime = statsDays.reduce((max, day) => (day.time > max ? day.time : max), 0);

  statsDays.forEach(day => {
    const height = Math.floor((day.time * 100) / maxTime) || 0;
    const timeSpendFormat = secondToText(day.time);
    const weekDay = getWeekDay(new Date(day.date));

    const dayInfoElement = create('div', { class: 'day-info' });
    const infoElement = create('div', { class: 'info' });
    const timeElement = create('strong', null, timeSpendFormat);
    const fillElement = create('div', {
      class: 'fill',
      style: `height: ${height}%`
    });
    const dateElement = create('div', { class: 'date' }, weekDay);

    infoElement.appendChild(timeElement);
    infoElement.appendChild(fillElement);

    dayInfoElement.appendChild(infoElement);
    dayInfoElement.appendChild(dateElement);

    statsDayElement.appendChild(dayInfoElement);
  });
}

function updateTimer(time) {
  if (!setting.ignoreListener && time >= setting.timeLimiter && getCurrentTime() >= setting.timeIgnore) {
    setting.ignoreListener = true;
    ignoreElement.classList.add('show');
    ignoreElement.addEventListener('click', ignore);
  }

  timerElement.textContent = secondToTime(time);
}

function secondToText(second) {
  const h = Math.floor(second / (60 * 60));
  const m = Math.floor((second - h * 60 * 60) / 60);
  let text = '';

  if (h > 0) {
    text = `${h} ${browser.i18n.getMessage('hour_short')} `;
  }

  text = `${text}${m} ${browser.i18n.getMessage('min_short')}`;

  return text;
}

function getWeekDay(date) {
  const days = browser.i18n.getMessage('days_week').split(',');

  return days[date.getDay()];
}

function ignore(event) {
  const time = event.target.getAttribute('data-ignore-time');

  if (time) {
    const timeIgnore = getCurrentTime() + time * 60;
    browser.storage.local.set({ timeIgnore });
    setting.timeIgnore = timeIgnore;
    ignoreElement.classList.remove('show');

    ignoreElement.removeEventListener('click', ignore);
    setting.ignoreListener = false;
  }
}

function secondToTime(secondTime) {
  const h = Math.floor(secondTime / (60 * 60)) || 0;
  const m = Math.floor((secondTime - h * 60 * 60) / 60) || 0;
  const s = secondTime - (h * 60 * 60 + m * 60) || 0;

  const hour = h < 10 ? '0' + h : h;
  const minute = m < 10 ? '0' + m : m;
  const second = s < 10 ? '0' + s : s;

  return hour + ':' + minute + ':' + second;
}

function create(tagName, attrs, content) {
  const el = document.createElement(tagName);
  if (attrs) {
    Object.keys(attrs).forEach(n => {
      el.setAttribute(n, attrs[n]);
    });
  }
  if (content) el.textContent = content;
  return el;
}

function getCurrentTime() {
  return Number(
    new Date()
      .getTime()
      .toString()
      .slice(0, -3)
  );
}

browser.runtime.getBackgroundPage().then(init);
