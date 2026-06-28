const { withDangerousMod } = require('expo/config-plugins');
const fs = require('fs');
const path = require('path');

/**
 * Fixes React Native Firebase v24 compilation with use_frameworks! :linkage => :static
 * on Xcode 15+/26+.
 *
 * Problem: RNFB pods include React Core headers (e.g. RCTBridgeModule.h) which, when
 * RNFB is built as a Clang framework module, causes those types to be "absorbed" into
 * the RNFB module space. Downstream RNFB pods (RNFBFirestore etc.) then fail with
 * "must be imported from module 'RNFBApp.RNFBAppModule'" because Clang sees the type
 * in the wrong module.
 *
 * Fix: Allow non-modular includes globally + disable DEFINES_MODULE for RNFB pods so
 * they don't create their own Clang module scope, leaving React Core types in the
 * React-Core module where they belong.
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

      const fixCode = `
  installer.pods_project.targets.each do |target|
    target.build_configurations.each do |config|
      config.build_settings['CLANG_ALLOW_NON_MODULAR_INCLUDES_IN_FRAMEWORK_MODULES'] = 'YES'
      if target.name.start_with?('RNFB')
        config.build_settings['DEFINES_MODULE'] = 'NO'
      end
    end
  end
`;

      if (contents.includes('post_install do |installer|')) {
        contents = contents.replace(
          'post_install do |installer|',
          `post_install do |installer|\n${fixCode}`
        );
      } else {
        contents += `\npost_install do |installer|\n${fixCode}\nend\n`;
      }

      fs.writeFileSync(podfilePath, contents);
      return config;
    },
  ]);

module.exports = withFirebaseFix;
