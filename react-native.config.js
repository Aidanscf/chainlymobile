// Keep React Native CLI / autolinking aligned with the real Android applicationId.
// Without this, generated files like `ReactNativeApplicationEntryPoint.java` can keep
// referencing a stale package name from older templates.
module.exports = {
  project: {
    android: {
      sourceDir: "./android",
      packageName: "com.chainly.app",
    },
  },
};
