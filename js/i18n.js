function translate() {
  const i18nElements = document.querySelectorAll('[data-i18n]');
  i18nElements.forEach(element => {
    const message = element.getAttribute('data-i18n');
    const text = browser.i18n.getMessage(message);
    if (text) {
      element.textContent = text;
    }
  });
}

window.addEventListener('DOMContentLoaded', translate, true);
