import type { RheoConfig } from '@getrheo/react-native-bare';
import { RHEO_DEFAULT_SDK_API_BASE_URL } from '@getrheo/contracts/sdk';

export const EXAMPLE_CONFIG_STORAGE_KEY = 'rheo.exampleConfig.v1';

export const DEFAULT_API_URL = RHEO_DEFAULT_SDK_API_BASE_URL;

export type SavedConfig = {
  publishableKey: string;
  channelId: string;
  apiBaseUrl: string;
  userId: string;
  hideFlowNavigationBar?: boolean;
};

export const canStartExampleConfig = (config: SavedConfig): boolean =>
  config.publishableKey.trim().length > 0 &&
  config.channelId.trim().length > 0 &&
  config.apiBaseUrl.trim().length > 0;

export const buildExampleRheoConfig = (config: SavedConfig): RheoConfig => ({
  publishableKey: config.publishableKey.trim(),
  apiBaseUrl: config.apiBaseUrl.trim() || DEFAULT_API_URL,
  userId: config.userId.trim() || 'example-user',
  locale: 'en',
});
