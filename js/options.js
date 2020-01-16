const hourElement = document.getElementById('hour');
const minuteElement = document.getElementById('minute');
const checkboxElements = document.querySelectorAll('[type=checkbox]');

async function init() {
  const saveElements = document.querySelectorAll('select, input');

  const { timeLimiter = 0, showNavigation = [] } = await browser.storage.local.get(['timeLimiter', 'showNavigation']);
  const hour = Math.floor(timeLimiter / (60 * 60));
  const minute = Math.floor((timeLimiter - hour * 60 * 60) / 60);

  createOption(hourElement, 24, hour);
  createOption(minuteElement, 60, minute);

  checkboxElements.forEach(element => {
    const name = element.getAttribute('name');
    if (showNavigation.some(value => value === name)) {
      element.setAttribute('checked', true);
    }
  });

  saveElements.forEach(element => element.addEventListener('change', saveSettings));
}

function createOption(element, countOption, selected) {
  for (let i = 0; i < countOption; i++) {
    const select = document.createElement('option');
    select.textContent = i;
    select.setAttribute('value', i);
    if (selected === i) {
      select.setAttribute('selected', true);
    }
    element.appendChild(select);
  }
}

function saveSettings() {
  const showNavigation = [];

  checkboxElements.forEach(element => {
    if (element.checked) {
      showNavigation.push(element.getAttribute('name'));
    }
  });

  const timeLimiter = hourElement.value * 60 * 60 + minuteElement.value * 60;
  browser.storage.local.set({ timeLimiter, showNavigation });
}

init();
