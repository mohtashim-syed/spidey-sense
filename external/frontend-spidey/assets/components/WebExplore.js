import * as React from 'react';
import { View, ActivityIndicator, Text } from 'react-native';
import { WebView } from 'react-native-webview';

export default function WebExplore() {
  const [ready, setReady] = React.useState(false);
  const base = process.env.EXPO_PUBLIC_API_BASE || '';
  const src = base.replace(/\/$/, '') + '/index.html';
  return (
    <View style={{ flex: 1, backgroundColor: '#000' }}>
      {!ready && (
        <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator color="#fff" />
          <Text style={{ color: '#fff', marginTop: 8 }}>Loading…</Text>
        </View>
      )}
      <WebView
        source={{ uri: src }}
        style={{ flex: 1 }}
        onLoadEnd={() => setReady(true)}
        mediaPlaybackRequiresUserAction={false}
        allowsInlineMediaPlayback
        javaScriptEnabled
        domStorageEnabled
        originWhitelist={["*"]}
        allowsBackForwardNavigationGestures
      />
    </View>
  );
}
