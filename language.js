// Native links also work offline and without JavaScript.
const languageLink = document.querySelector('.language-link');
function syncLanguageAnchor() {
  languageLink.hash = location.hash;
}
syncLanguageAnchor();
window.addEventListener('hashchange', syncLanguageAnchor);
