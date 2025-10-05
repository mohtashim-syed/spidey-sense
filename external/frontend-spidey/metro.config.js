const { getDefaultConfig } = require('@expo/metro-config');
const { resolve: metroResolve } = require('metro-resolver');
const path = require('path');

const projectRoot = __dirname;
const config = getDefaultConfig(projectRoot);

// Limit watch folders to the app and its node_modules to avoid leaking to repo root
config.watchFolders = [projectRoot, path.resolve(projectRoot, 'node_modules')];

// Alias react-native-fs to a local stub to avoid requiring native module in Expo Go
config.resolver = config.resolver || {};
config.resolver.extraNodeModules = {
  ...(config.resolver.extraNodeModules || {}),
  'react-native-fs': path.resolve(projectRoot, 'shims/react-native-fs.js'),
  '_': path.resolve(projectRoot, 'shims/empty.js'),
};

// Custom resolver to catch stray '_' imports and map them to our shim
const originalResolveRequest = config.resolver.resolveRequest;
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (moduleName === '_' || moduleName.endsWith('/metro-runtime/src/modules/empty-module.js')) {
    return {
      type: 'sourceFile',
      filePath: path.resolve(projectRoot, 'shims/empty.js'),
    };
  }
  if (originalResolveRequest) {
    return originalResolveRequest(context, moduleName, platform);
  }
  return metroResolve(context, moduleName, platform);
};

module.exports = config;