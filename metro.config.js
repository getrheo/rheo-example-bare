const { getDefaultConfig, mergeConfig } = require('@react-native/metro-config');
const { resolve } = require('metro-resolver');
const path = require('path');

const projectRoot = __dirname;
const monorepoRoot = path.resolve(projectRoot, '../..');

const reactNativeSdkRoots = [
  path.resolve(monorepoRoot, 'packages/sdks/react-native-bare'),
  path.resolve(monorepoRoot, 'packages/sdks/react-native-core'),
].map((root) => path.resolve(root, 'node_modules'));

const config = {
  watchFolders: [monorepoRoot],
  resolver: {
    extraNodeModules: {
      '@getrheo/react-native-core': path.resolve(monorepoRoot, 'packages/sdks/react-native-core'),
      '@getrheo/react-native-bare': path.resolve(monorepoRoot, 'packages/sdks/react-native-bare'),
      '@getrheo/contracts': path.resolve(monorepoRoot, 'packages/contracts'),
      '@getrheo/flow-runtime': path.resolve(monorepoRoot, 'packages/flow-runtime'),
      '@getrheo/flow-ui-state': path.resolve(monorepoRoot, 'packages/flow-ui-state'),
      '@getrheo/renderer-core': path.resolve(monorepoRoot, 'packages/renderer-core'),
      '@getrheo/attribution': path.resolve(monorepoRoot, 'packages/attribution'),
      '@superwall/react-native-superwall': path.resolve(
        monorepoRoot,
        'node_modules/@superwall/react-native-superwall',
      ),
    },
    nodeModulesPaths: [
      path.resolve(projectRoot, 'node_modules'),
      path.resolve(monorepoRoot, 'node_modules'),
      ...reactNativeSdkRoots,
    ],
    disableHierarchicalLookup: true,
    // Nested transitive deps (e.g. reanimated → semver@7) are invisible when
    // hierarchical lookup is off and the root hoists a different major.
    resolveRequest: (context, moduleName, platform) => {
      const { resolveRequest: _ignored, ...resolveContext } = context;
      try {
        return resolve(resolveContext, moduleName, platform);
      } catch (firstError) {
        if (!context.originModulePath || moduleName.startsWith('.') || moduleName.startsWith('/')) {
          throw firstError;
        }
        try {
          const filePath = require.resolve(moduleName, {
            paths: [path.dirname(context.originModulePath)],
          });
          return { type: 'sourceFile', filePath };
        } catch {
          throw firstError;
        }
      }
    },
  },
};

module.exports = mergeConfig(getDefaultConfig(projectRoot), config);
