const DEFAULT_WHITE_NAVIGATION = ['l_aud'];

const nav = window.wrappedJSObject.nav || window.nav;
const vk = window.wrappedJSObject.vk || window.vk;

const whiteListModule = new Set(['im', 'audio']);
const whileListNavigation = new Set();

let isLimitOn = false;

async function init() {
  const { timeSpend = 0, timeLimiter = 0, timeIgnore = 0, showNavigation = [] } = await browser.storage.local.get();

  whileListNavigation.clear();
  whileListNavigation.add(...DEFAULT_WHITE_NAVIGATION);
  if (showNavigation.length) {
    whileListNavigation.add(...showNavigation);
  }

  if (timeSpend >= timeLimiter && getCurrentTime() >= timeIgnore) {
    hiddenNavigation();
  }

  if (!browser.runtime.onMessage.hasListener(onMessageFromBack)) {
    browser.runtime.onMessage.addListener(onMessageFromBack);
  }
}

function reset() {
  const navigation = document.querySelectorAll('#side_bar_inner ol li');
  navigation.forEach(node => {
    node.classList.remove('time-limiter');
  });

  const searchElement = document.querySelector('#ts_wrap');
  searchElement.classList.remove('time-limiter');
  isLimitOn = false;
  init();
}

function hiddenNavigation() {
  isLimitOn = true;
  changeLocation(window.wrappedJSObject.location.pathname);

  const navigation = document.querySelectorAll('#side_bar_inner ol li');
  navigation.forEach(node => {
    if (!whileListNavigation.has(node.id)) {
      node.classList.add('time-limiter');
      node.style.display = '';
    }
  });

  const searchElement = document.querySelector('#ts_wrap');
  searchElement.classList.add('time-limiter');
}

function changeLocation(url, replay = 20) {
  if (isLimitOn && url !== window.wrappedJSObject.location.pathname) {
    const currentModule = window.wrappedJSObject.currentModule();
    if (!currentModule && replay > 0) {
      setTimeout(() => changeLocation(url, replay - 1), 100);
      return false;
    }

    if (!whiteListModule.has(currentModule)) {
      nav.go('/audios' + vk.id);
    }
  }
}

function onMessageFromBack(event) {
  switch (event.type) {
    case 'reset':
      reset();
      break;
    case 'limitReached':
      hiddenNavigation();
      break;
    case 'changeLocation':
      changeLocation(event.url);
      break;
  }
}

function getCurrentTime() {
  return Number(
    new Date()
      .getTime()
      .toString()
      .slice(0, -3)
  );
}

init();
