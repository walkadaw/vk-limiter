const UPDATE_TIME = 60;
const urlMatches = browser.runtime.getManifest().content_scripts[0].matches;
const time = {
  passed: 0,
  limit: 0,
  ignore: 0
};
const days = {
  current: null,
  stats: []
};
let intervalId = null;
let sendMessageLimit = false;

async function init() {
  let { date, timeLimiter, timeSpend = 0, timeIgnore = 0, statsDays = [] } = await browser.storage.local.get();

  if (timeLimiter === undefined) {
    timeLimiter = 3600;
    browser.storage.local.set({ timeLimiter });
  }

  time.passed = timeSpend;
  time.limit = timeLimiter;
  time.ignore = timeIgnore;

  days.current = date;
  days.stats = statsDays;

  if (days.current !== getCurrentDate()) {
    updateDay();
  }

  browser.windows.onFocusChanged.addListener(onFocusChanged);
  browser.windows.onRemoved.addListener(stopTimer);
  browser.tabs.onActivated.addListener(onToggleTimer);
  browser.tabs.onUpdated.addListener(onUpdated, { urls: urlMatches });
  browser.storage.onChanged.addListener(updateStore);
}

function onToggleTimer() {
  browser.tabs
    .query({ active: true, currentWindow: true, url: urlMatches })
    .then(tabs => (tabs.length > 0 ? startTimer() : stopTimer()));
}

function onUpdated(tabsId, changeInfo) {
  if (tabsId && changeInfo.status === 'complete') {
    startTimer();
    browser.tabs.sendMessage(tabsId, {
      type: 'changeLocation',
      url: changeInfo.url
    });
  }
}

function onFocusChanged(focus) {
  if (focus === -1) {
    stopTimer();
  } else {
    onToggleTimer();
  }
}

function updateStore(event) {
  if (event.timeLimiter || event.timeIgnore) {
    time.ignore = (event.timeIgnore && event.timeIgnore.newValue) || time.ignore;
    time.limit = (event.timeLimiter && event.timeLimiter.newValue) || time.limit;
    sendMessageLimit = false;
    sendMessageToTabs('reset');
  }
}

function updateDay() {
  const today = new Date().toISOString().slice(0, 10);
  const newStatsDays = [];

  for (let i = 7; i > 1; i--) {
    let date = new Date();
    date.setDate(date.getDate() - i);
    date = date.toISOString().slice(0, 10);

    let day = days.stats.find(day => day && day.date === date);

    if (!day) {
      day = { date, time: 0 };
    }

    newStatsDays.push(day);
  }

  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  newStatsDays.push({
    date: yesterday.toISOString().slice(0, 10),
    time: time.passed
  });

  browser.storage.local.set({
    date: today,
    timeSpend: 0,
    timeIgnore: 0,
    statsDays: newStatsDays
  });

  time.passed = 0;
  time.ignore = 0;
}

function startTimer() {
  if (!intervalId) {
    intervalId = setInterval(() => {
      time.passed += 1;

      if (!sendMessageLimit && time.passed > time.limit && getCurrentTime() > time.ignore) {
        sendMessageLimit = true;
        sendMessageToTabs('limitReached');
      }

      if (!(time.passed % UPDATE_TIME)) {
        browser.storage.local.set({ timeSpend: time.passed });
      }
    }, 1000);
  }
}

function stopTimer() {
  if (intervalId) {
    clearInterval(intervalId);
    intervalId = null;

    browser.storage.local.set({ timeSpend: time.passed });
  }
}

function sendMessageToTabs(type) {
  browser.tabs.query({ url: urlMatches }).then(tabs => {
    tabs.forEach(tab => {
      browser.tabs.sendMessage(tab.id, {
        type
      });
    });
  });
}

function getTimeSpend() {
  return time.passed;
}

function getCurrentTime() {
  return Number(
    new Date()
      .getTime()
      .toString()
      .slice(0, -3)
  );
}

function getCurrentDate() {
  return new Date().toISOString().slice(0, 10);
}

init();
