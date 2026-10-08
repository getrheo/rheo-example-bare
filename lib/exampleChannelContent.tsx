import { Flow, RheoBanner, useChannel, type FlowProps } from '@getrheo/react-native-bare';
import { ActivityIndicator, Text, View } from 'react-native';

export type ExampleChannelContentProps = {
  channelId: string;
  flowProps: Omit<FlowProps, 'channelId'>;
};

const CodeChannelMessage = ({ variantKey }: { variantKey: string }) => (
  <View style={{ flex: 1, padding: 24, justifyContent: 'center', gap: 8 }}>
    <Text style={{ color: '#fafafa', fontSize: 16, fontWeight: '600' }}>Code channel</Text>
    <Text style={{ color: '#a1a1aa', fontSize: 14 }}>
      Variant <Text style={{ fontWeight: '700' }}>{variantKey}</Text>. The example app previews flows
      and banners only — read parameters with <Text style={{ fontWeight: '600' }}>useChannel</Text> in
      your host.
    </Text>
  </View>
);

export const ExampleChannelContent = ({ channelId, flowProps }: ExampleChannelContentProps) => {
  const trimmed = channelId.trim();
  const { loading, error, channel } = useChannel({ channelId: trimmed });

  if (!trimmed) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        <Text style={{ color: '#a1a1aa' }}>Channel id is required.</Text>
      </View>
    );
  }

  if (loading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator />
        <Text style={{ color: '#a1a1aa', marginTop: 12 }}>Resolving channel…</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={{ flex: 1, padding: 24, justifyContent: 'center' }}>
        <Text style={{ color: '#f87171' }} accessibilityRole="alert">{error.message}</Text>
      </View>
    );
  }

  if (!channel) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        <Text style={{ color: '#a1a1aa' }}>No content for this channel.</Text>
      </View>
    );
  }

  if (channel.kind === 'banner') {
    return (
      <View style={{ flex: 1, width: '100%', alignItems: 'center', padding: 16 }}>
        <RheoBanner channelId={trimmed} theme={flowProps.theme ?? 'light'} />
      </View>
    );
  }

  if (channel.kind === 'code') {
    return <CodeChannelMessage variantKey={channel.variantKey} />;
  }

  return <Flow channelId={trimmed} {...flowProps} />;
};
