const fs = require('fs');
const path = require('path');

/** Load apps/example-bare/.env into process.env before Babel inlines known keys. */
const loadDotEnv = () => {
  const envPath = path.join(__dirname, '.env');
  if (!fs.existsSync(envPath)) return;
  for (const rawLine of fs.readFileSync(envPath, 'utf8').split('\n')) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) continue;
    const eq = line.indexOf('=');
    if (eq <= 0) continue;
    const key = line.slice(0, eq).trim();
    let value = line.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (process.env[key] === undefined) {
      process.env[key] = value;
    }
  }
};

loadDotEnv();

module.exports = {
  presets: ['module:@react-native/babel-preset'],
  plugins: [
    [
      'transform-inline-environment-variables',
      {
        include: [
          'SUPERWALL_IOS_API_KEY',
          'SUPERWALL_ANDROID_API_KEY',
          'SUPERWALL_API_KEY',
          'EXPO_PUBLIC_SUPERWALL_IOS_API_KEY',
          'EXPO_PUBLIC_SUPERWALL_ANDROID_API_KEY',
          'EXPO_PUBLIC_SUPERWALL_API_KEY',
        ],
      },
    ],
    'react-native-reanimated/plugin',
  ],
};
