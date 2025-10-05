import * as React from 'react';
import { View, ActivityIndicator, Text, TouchableOpacity } from 'react-native';
import { WebView } from 'react-native-webview';

export default function WebExplore() {
  const [ready, setReady] = React.useState(false);
  const [error, setError] = React.useState('');
  const base = process.env.EXPO_PUBLIC_API_BASE || '';
  const src = base ? base.replace(/\/$/, '') + '/index.html' : '';
  return (
    <View style={{ flex: 1, backgroundColor: '#000' }}>
      {(!ready && !error) && (
        <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator color="#fff" />
          <Text style={{ color: '#fff', marginTop: 8 }}>Loading…</Text>
        </View>
      )}
      {(!base || error) ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24 }}>
          <Text style={{ color: '#fff', textAlign: 'center', marginBottom: 14 }}>
            { !base
              ? 'Backend URL missing. Set EXPO_PUBLIC_API_BASE to your https tunnel origin before starting Expo.'
              : `Failed to load: ${error}` }
          </Text>
          <TouchableOpacity onPress={() => { setError(''); setReady(false); }} style={{ borderWidth: 1, borderColor: '#fff', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 10 }}>
            <Text style={{ color: '#fff' }}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <WebView
          source={{ uri: src }}
          style={{ flex: 1 }}
          onLoadEnd={() => setReady(true)}
          onError={syntheticEvent => {
            const { nativeEvent } = syntheticEvent;
            setError(nativeEvent?.description || 'Unknown WebView error');
          }}
          mediaPlaybackRequiresUserAction={false}
          allowsInlineMediaPlayback
          javaScriptEnabled
          domStorageEnabled
          originWhitelist={["*"]}
          allowsBackForwardNavigationGestures
        />
      )}
    </View>
  );
}
