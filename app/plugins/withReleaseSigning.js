// Signs release builds with YOUR upload key when the build provides one (build-aab.yml passes it as Gradle
// properties from GitHub secrets). Without those properties, release builds keep Expo's test signing.
const { withAppBuildGradle } = require('@expo/config-plugins');

const SIGNING = `
        release {
            if (project.hasProperty('RATNA_UPLOAD_STORE_FILE')) {
                storeFile file(RATNA_UPLOAD_STORE_FILE)
                storePassword RATNA_UPLOAD_STORE_PASSWORD
                keyAlias RATNA_UPLOAD_KEY_ALIAS
                keyPassword RATNA_UPLOAD_KEY_PASSWORD
            }
        }`;

module.exports = function withReleaseSigning(config) {
  return withAppBuildGradle(config, (cfg) => {
    let gradle = cfg.modResults.contents;
    if (!gradle.includes('RATNA_UPLOAD_STORE_FILE')) {
      // Add a "release" signing config next to Expo's "debug" one…
      gradle = gradle.replace(/signingConfigs\s*\{/, (m) => `${m}${SIGNING}`);
      // …and use it for release builds when the key is provided.
      gradle = gradle.replace(
        /(buildTypes\s*\{[\s\S]*?release\s*\{[\s\S]*?)signingConfig signingConfigs\.debug/,
        "$1signingConfig project.hasProperty('RATNA_UPLOAD_STORE_FILE') ? signingConfigs.release : signingConfigs.debug",
      );
      if (!gradle.includes("project.hasProperty('RATNA_UPLOAD_STORE_FILE') ? signingConfigs.release")) {
        throw new Error('withReleaseSigning: could not find the release signingConfig in android/app/build.gradle');
      }
    }
    cfg.modResults.contents = gradle;
    return cfg;
  });
};
