// metro.config.js
const { getDefaultConfig } = require("expo/metro-config");
const path = require('path');
const { FileStore } = require('metro-cache');

const config = getDefaultConfig(__dirname);

// Use a stable on-disk store (shared across web/android)
const root = process.env.METRO_CACHE_ROOT || path.join(__dirname, '.metro-cache');
config.cacheStores = [
  new FileStore({ root: path.join(root, 'cache') }),
];

// Platform-specific resolver
const originalResolver = config.resolver.resolverMainFields;
config.resolver.resolverMainFields = ['react-native', 'browser', 'main'];

// Exclude react-native-maps on web platform
config.resolver.platforms = ['web', 'ios', 'android', 'native'];

// Add platform-specific extensions
config.resolver.sourceExts = [...config.resolver.sourceExts, 'web.js', 'web.ts', 'web.tsx'];

// Reduce the number of workers to decrease resource usage
config.maxWorkers = 2;

module.exports = config;
