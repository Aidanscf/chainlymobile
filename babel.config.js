module.exports = function (api) {
  api.cache(true);
  return {
    presets: [['babel-preset-expo', { unstable_transformImportMeta: true }]],
    // Must be last. Reanimated 4 / Worklets crash on Android without this
    // (JavaScriptContextHolder.get() on a null object reference).
    plugins: ['react-native-reanimated/plugin'],
  };
};
