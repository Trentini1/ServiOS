const { withDangerousMod } = require('expo/config-plugins');
const fs = require('fs');
const path = require('path');

const FIREBASE_BUILD_FIX = `
  installer.pods_project.targets.each do |target|
    target.build_configurations.each do |config|
      config.build_settings['CLANG_ALLOW_NON_MODULAR_INCLUDES_IN_FRAMEWORK_MODULES'] = 'YES'
    end
  end
`;

/**
 * Injects CLANG_ALLOW_NON_MODULAR_INCLUDES_IN_FRAMEWORK_MODULES=YES into the
 * existing post_install block. Required for @react-native-firebase v24+ with
 * useFrameworks: static on Xcode 15+.
 */
const withFirebaseFix = (config) =>
  withDangerousMod(config, [
    'ios',
    async (config) => {
      const podfilePath = path.join(config.modRequest.platformProjectRoot, 'Podfile');
      let contents = fs.readFileSync(podfilePath, 'utf-8');

      if (contents.includes('CLANG_ALLOW_NON_MODULAR_INCLUDES_IN_FRAMEWORK_MODULES')) {
        return config;
      }

      // Inject into existing post_install block if one exists
      if (contents.includes('post_install do |installer|')) {
        contents = contents.replace(
          'post_install do |installer|',
          `post_install do |installer|\n${FIREBASE_BUILD_FIX}`
        );
      } else {
        // Append a new post_install block if none exists
        contents += `\npost_install do |installer|\n${FIREBASE_BUILD_FIX}\nend\n`;
      }

      fs.writeFileSync(podfilePath, contents);
      return config;
    },
  ]);

module.exports = withFirebaseFix;
