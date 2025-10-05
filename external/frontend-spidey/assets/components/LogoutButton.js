import * as React from 'react';
import { TouchableOpacity, Text, ActivityIndicator, View } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import * as WebBrowser from 'expo-web-browser';
import Constants from 'expo-constants';

export default function LogoutButton({ onLoggedOut, label = 'Log out', useProxy = true }) 
{
  const [busy, setBusy] = React.useState(false);

  const auth0Domain = `https://${Constants.expoConfig?.extra?.auth0Domain}`;
  const clientId = Constants.expoConfig?.extra?.auth0ClientId;

  const returnTo = useProxy ? 'https://auth.expo.dev' : 'spideyapp://logout';

  const logoutUrl =
    `${auth0Domain}/v2/logout?client_id=${encodeURIComponent(clientId)}&returnTo=${encodeURIComponent(returnTo)}`;

 
 
    console.log('Auth0 domain:', auth0Domain);      // should be https://YOUR_TENANT.REGION.auth0.com
    console.log('clientId:', clientId);             // exact Client ID from Auth0 app
    console.log('returnTo:', returnTo);             // see below
    console.log('logoutUrl:', logoutUrl);           // full URL you open in WebBrowser

    const handleLogout = async () => {
    if (busy) return;
    setBusy(true);
    try {
      // 1) Clear local credentials
      await SecureStore.deleteItemAsync('access_token');
      await SecureStore.deleteItemAsync('id_token');

      // 2) (Optional but recommended) Clear Auth0 session cookie
      await WebBrowser.openAuthSessionAsync(logoutUrl, returnTo);
    } catch (e) {
      console.warn('Logout error:', e);
    } finally {
      setBusy(false);
      // 3) Return to unauthenticated UI
      onLoggedOut?.();
    }
  };

  return (
    <TouchableOpacity
      onPress={handleLogout}
      disabled={busy}
      style={{
        backgroundColor: '#fff',
        borderRadius: 10,
        paddingHorizontal: 24,
        paddingVertical: 12,
        width: '90%',
        alignItems: 'center',
        opacity: busy ? 0.7 : 1,
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        <Text style={{ fontSize: 18 }}>{label}</Text>
        {busy ? <ActivityIndicator /> : null}
      </View>
    </TouchableOpacity>
  );
}
