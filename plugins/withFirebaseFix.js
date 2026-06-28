const { withDangerousMod } = require('expo/config-plugins');
const fs = require('fs');
const path = require('path');

/**
 * Fixes React Native Firebase v24 compilation with use_frameworks! :linkage => :static
 * on Xcode 15+/26+.
 *
 * Strategy:
 * 1. CLANG_ALLOW_NON_MODULAR_INCLUDES_IN_FRAMEWORK_MODULES=YES globally — allows pods to
 *    include React Core headers (e.g. RCTBridgeModule.h) without Clang errors.
 * 2. DEFINES_MODULE=NO specifically for RNFBApp — this ObjC-only pod includes React Core
 *    headers and when built as a Clang module it "absorbs" those types, causing downstream
 *    pods like RNFBFirestore to fail with "must be imported from module RNFBApp.X". By
 *    disabling the module for RNFBApp only (it has no Swift code so no bridging issues),
 *    React Core types stay in their own module space.
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
      if target.name == 'RNFBApp'
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
