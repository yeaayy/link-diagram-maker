import './assets/main.css'

import { createApp, ref, watch, watchEffect } from 'vue'
import App from './App.vue'
import router from './router'
import { Key, Settings } from './utils/Settings'
import { ShortcutManager, ShortcutManagerKey } from './utils/ShortcutManager'
import createTitleDirective from './utils/TitleDirective'

const THEME = new Key('auto', 'theme');
const AUTOSAVE_DELAY = new Key(parseInt(import.meta.env.VITE_DEFAULT_AUTOSAVE_DELAY), 'autosave-delay');
const UNDO_LIMIT = new Key(parseInt(import.meta.env.VITE_DEFAULT_UNDO_LIMIT), 'undo-limit');

const settings = new Settings(import.meta.env.VITE_STORAGE_KEY);
const theme = ref(settings.get(THEME));
const matchMedia = window.matchMedia('(prefers-color-scheme: dark)');
const systemTheme = ref(matchMedia.matches ? 'dark' : 'light');
const autosaveDelay = ref(settings.get(AUTOSAVE_DELAY));
const undoLimit = ref(settings.get(UNDO_LIMIT));
const shortcutManager = new ShortcutManager(settings);

matchMedia.addEventListener('change', event => {
  systemTheme.value = event.matches ? "dark" : "light";
});

watchEffect(() => {
  const usedTheme = theme.value == 'auto' ? systemTheme.value : theme.value;

  const classList = document.body.classList;
  classList.remove('theme-light', 'theme-dark');
  classList.add(`theme-${usedTheme}`);
});

watch(theme, theme => {
  settings.set(THEME, theme);
});

watch(autosaveDelay, autosaveDelay => {
  settings.set(AUTOSAVE_DELAY, autosaveDelay);
});

const app = createApp(App)

app.directive('title', createTitleDirective(title => {
  const appName = import.meta.env.VITE_APP_NAME;
  return title ? `${title} | ${appName}` : appName
}));

app.use(router)
app.provide('theme', theme);
app.provide('autosave-delay', autosaveDelay);
app.provide('undo-limit', undoLimit);
app.provide(ShortcutManagerKey, shortcutManager);
app.mount('#app')
