import { Platform } from 'react-native';

let didConfigure = false;
let didAttachDebugDelegate = false;

type SuperwallLoggingOptions = {
  level: string;
  scopes: string[];
};

type SuperwallModule = {
  default: {
    configure: (args: {
      apiKey: string;
      options?: { logging?: SuperwallLoggingOptions };
    }) => Promise<unknown>;
    shared: {
      identify: (args: { userId: string }) => Promise<void>;
      setDelegate: (delegate: unknown) => Promise<void>;
      setLogLevel?: (level: string) => Promise<void>;
    };
  };
  LogLevel?: { Debug: string };
  LogScope?: { All: string };
  SuperwallDelegate?: new () => Record<string, unknown>;
};

const PREFIX = '[rheo-example-bare][superwall]';

type EnvKey =
  | 'SUPERWALL_IOS_API_KEY'
  | 'SUPERWALL_ANDROID_API_KEY'
  | 'SUPERWALL_API_KEY'
  // Same names as the Expo example so a shared .env can be reused.
  | 'EXPO_PUBLIC_SUPERWALL_IOS_API_KEY'
  | 'EXPO_PUBLIC_SUPERWALL_ANDROID_API_KEY'
  | 'EXPO_PUBLIC_SUPERWALL_API_KEY';

const envTrim = (key: EnvKey): string =>
  (typeof process !== 'undefined' && process.env?.[key] ? String(process.env[key]) : '').trim();

const getApiKey = (): string => {
  if (Platform.OS === 'ios') {
    return (
      envTrim('SUPERWALL_IOS_API_KEY') ||
      envTrim('EXPO_PUBLIC_SUPERWALL_IOS_API_KEY') ||
      envTrim('SUPERWALL_API_KEY') ||
      envTrim('EXPO_PUBLIC_SUPERWALL_API_KEY')
    );
  }
  if (Platform.OS === 'android') {
    return (
      envTrim('SUPERWALL_ANDROID_API_KEY') ||
      envTrim('EXPO_PUBLIC_SUPERWALL_ANDROID_API_KEY') ||
      envTrim('SUPERWALL_API_KEY') ||
      envTrim('EXPO_PUBLIC_SUPERWALL_API_KEY')
    );
  }
  return '';
};

const maskApiKey = (apiKey: string): string => {
  if (apiKey.length <= 8) return '***';
  return `${apiKey.slice(0, 6)}…${apiKey.slice(-4)}`;
};

/** True when a Superwall public API key is present for the current native platform. */
export const hasSuperwallApiKey = (): boolean => getApiKey().length > 0;

/** Status row helper for the bare config screen. */
export const getSuperwallIntegrationDetected = (): { detected: boolean; hint: string } => {
  if (Platform.OS !== 'ios' && Platform.OS !== 'android') {
    return { detected: false, hint: 'Native iOS/Android only.' };
  }
  if (!hasSuperwallApiKey()) {
    return {
      detected: false,
      hint:
        Platform.OS === 'ios'
          ? 'Set SUPERWALL_IOS_API_KEY (or EXPO_PUBLIC_SUPERWALL_IOS_API_KEY) in .env.'
          : 'Set SUPERWALL_ANDROID_API_KEY (or EXPO_PUBLIC_SUPERWALL_ANDROID_API_KEY) in .env.',
    };
  }
  return {
    detected: true,
    hint: 'API key present for this platform. Rebuild native after adding @superwall/react-native-superwall.',
  };
};

const createDebugDelegate = (DelegateBase: new () => Record<string, unknown>): Record<string, unknown> => {
  // SuperwallDelegate is abstract; instantiate via prototype assignment when the ctor allows it.
  const delegate = Object.create(DelegateBase.prototype) as Record<string, (...args: unknown[]) => void>;

  const log = (label: string, ...args: unknown[]) => {
    console.log(`${PREFIX} ${label}`, ...args);
  };

  delegate.handleLog = (level, scope, message, info, error) => {
    const payload = {
      scope,
      message: message ?? '',
      ...(info ? { info } : {}),
      ...(error ? { error } : {}),
    };
    if (level === 'error') {
      console.warn(`${PREFIX} native[${String(level)}]`, payload);
      return;
    }
    console.log(`${PREFIX} native[${String(level)}]`, payload);
  };
  delegate.handleSuperwallEvent = (eventInfo) => {
    log('event', eventInfo);
  };
  delegate.willPresentPaywall = (paywallInfo) => log('willPresentPaywall', paywallInfo);
  delegate.didPresentPaywall = (paywallInfo) => log('didPresentPaywall', paywallInfo);
  delegate.willDismissPaywall = (paywallInfo) => log('willDismissPaywall', paywallInfo);
  delegate.didDismissPaywall = (paywallInfo) => log('didDismissPaywall', paywallInfo);
  delegate.handleCustomPaywallAction = (name) => log('customPaywallAction', name);
  delegate.subscriptionStatusDidChange = (from, to) => log('subscriptionStatusDidChange', { from, to });
  delegate.willRedeemLink = () => log('willRedeemLink');
  delegate.didRedeemLink = (result) => log('didRedeemLink', result);
  delegate.paywallWillOpenURL = (url) => log('paywallWillOpenURL', url);
  delegate.paywallWillOpenDeepLink = (url) => log('paywallWillOpenDeepLink', url);

  return delegate;
};

/**
 * Configure `@superwall/react-native-superwall` and identify the Rheo
 * `identity.appUserId` before `<Flow />` can hit a Superwall Integration Node.
 * Safe no-op when env keys are unset.
 *
 * Matches what `@getrheo/react-native-core`'s `presentSuperwallPaywall` expects
 * (`Superwall.shared.register`). Rheo never configures Superwall for you.
 */
export const prepareSuperwallForFlow = async (userId: string): Promise<void> => {
  const apiKey = getApiKey();
  if (!apiKey) {
    console.warn(
      `${PREFIX} set SUPERWALL_IOS_API_KEY / SUPERWALL_ANDROID_API_KEY (or SUPERWALL_API_KEY / EXPO_PUBLIC_SUPERWALL_*) in .env to exercise Superwall paywalls.`,
    );
    return;
  }

  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const mod = require('@superwall/react-native-superwall') as SuperwallModule;
    const Superwall = mod.default;
    const debugLogging = typeof __DEV__ !== 'undefined' && __DEV__;

    if (!didConfigure) {
      console.log(`${PREFIX} configuring`, {
        platform: Platform.OS,
        apiKey: maskApiKey(apiKey),
        debugLogging,
      });

      await Superwall.configure({
        apiKey,
        ...(debugLogging && mod.LogLevel && mod.LogScope
          ? {
              options: {
                logging: {
                  level: mod.LogLevel.Debug,
                  scopes: [mod.LogScope.All],
                },
              },
            }
          : {}),
      });
      didConfigure = true;
      console.log(`${PREFIX} configure complete`);
    }

    if (debugLogging && !didAttachDebugDelegate && mod.SuperwallDelegate) {
      try {
        const delegate = createDebugDelegate(mod.SuperwallDelegate);
        await Superwall.shared.setDelegate(delegate);
        if (typeof Superwall.shared.setLogLevel === 'function' && mod.LogLevel) {
          await Superwall.shared.setLogLevel(mod.LogLevel.Debug);
        }
        didAttachDebugDelegate = true;
        console.log(`${PREFIX} debug delegate attached`);
      } catch (err) {
        console.warn(`${PREFIX} debug delegate skipped:`, err);
      }
    }

    const uid = userId.trim() || 'example-user';
    console.log(`${PREFIX} identify`, { userId: uid });
    await Superwall.shared.identify({ userId: uid });
    console.log(`${PREFIX} identify complete`);
  } catch (err) {
    console.warn(`${PREFIX} bootstrap failed:`, err);
  }
};
