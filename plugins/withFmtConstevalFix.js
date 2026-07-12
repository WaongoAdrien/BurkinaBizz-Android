const { withDangerousMod } = require('expo/config-plugins');
const fs = require('fs');
const path = require('path');

// Xcode 26's stricter Clang rejects the fmt version React Native vendors
// (consteval format-string checks). Pin the fmt pod to C++17 until RN
// bumps fmt upstream. See facebook/react-native#55601.
const FMT_FIX_SNIPPET = `
    installer.pods_project.targets.each do |target|
      if target.name == 'fmt'
        target.build_configurations.each do |config|
          config.build_settings['CLANG_CXX_LANGUAGE_STANDARD'] = 'c++17'
        end
      end
    end
`;

module.exports = function withFmtConstevalFix(config) {
  return withDangerousMod(config, [
    'ios',
    async (config) => {
      const podfilePath = path.join(config.modRequest.platformProjectRoot, 'Podfile');
      let contents = fs.readFileSync(podfilePath, 'utf8');

      if (!contents.includes("target.name == 'fmt'")) {
        // Must run *after* react_native_post_install, which resets
        // CLANG_CXX_LANGUAGE_STANDARD to c++20 on every pod target.
        const updated = contents.replace(
          /(react_native_post_install\(\s*[\s\S]*?\n\s*\)\n)/,
          `$1${FMT_FIX_SNIPPET}`
        );
        if (updated === contents) {
          throw new Error(
            'withFmtConstevalFix: could not find react_native_post_install(...) call in Podfile to patch'
          );
        }
        fs.writeFileSync(podfilePath, updated);
      }

      return config;
    },
  ]);
};
