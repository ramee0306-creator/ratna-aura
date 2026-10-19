// Blocks screenshots and screen recording on Android (FLAG_SECURE): captures come out black, and the app's
// preview in the "recent apps" list is hidden. Set on the main window as soon as the app starts.
// To make Play Store screenshots, build once with ALLOW_SCREENSHOTS=1 (that build only allows them).
const { withMainActivity } = require('@expo/config-plugins');

const FLAG = 'android.view.WindowManager.LayoutParams.FLAG_SECURE';
const LINE = `\n    window.setFlags(${FLAG}, ${FLAG})`;

module.exports = function withSecureScreen(config) {
  if (process.env.ALLOW_SCREENSHOTS === '1') return config;
  return withMainActivity(config, (cfg) => {
    let source = cfg.modResults.contents;
    if (!source.includes('FLAG_SECURE')) {
      source = source.replace(/super\.onCreate\([^)]*\)/, (m) => `${m}${LINE}`);
      if (!source.includes('FLAG_SECURE')) {
        throw new Error('withSecureScreen: could not find super.onCreate in MainActivity');
      }
    }
    cfg.modResults.contents = source;
    return cfg;
  });
};
