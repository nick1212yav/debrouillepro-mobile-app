const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");

const config = getDefaultConfig(__dirname);

// Désactivation de Watchman pour s'affranchir des lenteurs d'indexation sous Windows
config.watcher = {
  ...config.watcher,
  useWatchman: false,
};

module.exports = withNativeWind(config, {
  input: "./global.css",
});
