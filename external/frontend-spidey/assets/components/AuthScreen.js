
import * as React from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, Platform } from 'react-native';
import * as AuthSession from 'expo-auth-session';
import { useAutoDiscovery, useAuthRequest, exchangeCodeAsync } from 'expo-auth-session';
import * as SecureStore from 'expo-secure-store';
import Constants from 'expo-constants';

const auth0Domain = `https://${Constants.expoConfig?.extra?.auth0Domain}`;
const clientId = Constants.expoConfig?.extra?.auth0ClientId;

// NOTE: In production, useProxy will not work.
const useProxy = true;
const redirectUri = AuthSession.makeRedirectUri({
  scheme: 'spideyapp',
  path: 'redirect',
  useProxy,
});
console.log("Redirect URI:", redirectUri)

export default function AuthScreen({ setIsAuthed }) {
  const discovery = useAutoDiscovery(auth0Domain);

  const [request, , promptAsync] = useAuthRequest(
    {
      clientId,
      redirectUri,
      scopes: ['openid', 'profile', 'email'],
      usePKCE: true,
      responseType: AuthSession.ResponseType.Code,
    },
    discovery
  );

  const [busy, setBusy] = React.useState(false);

  const doLogin = async (connection) => {
    if (!request || !discovery) return;
    setBusy(true);
    try {
      const res = await promptAsync(
        { useProxy, preferEphemeralSession: Platform.OS === 'ios' },
        { // AuthRequestPromptOptions second arg is deprecated; we can pass extraParams in first arg now:
        }
      );
      // Tip: to force a provider (Google/GitHub), pass extraParams with prompt
      // Newer expo-auth-session supports extraParams in prompt:
      // const res = await promptAsync({ useProxy, extraParams: { connection } });

      if (res.type === 'success') {
        // If your Auth0 Universal Login has ONLY Google & GitHub enabled
        // you don’t need to pass connection. If you want to force it per-button:
        // re-run promptAsync with `extraParams: { connection }` (see note above).

        const { code } = res.params;
        const tokenRes = await exchangeCodeAsync(
          {
            clientId,
            code,
            extraParams: { code_verifier: request.codeVerifier },
            redirectUri,
          },
          discovery
        );

        // Save tokens securely (optional: also save id_token)
        await SecureStore.setItemAsync('access_token', tokenRes.accessToken || tokenRes.access_token);
        if (tokenRes.idToken || tokenRes.id_token) {
          await SecureStore.setItemAsync('id_token', tokenRes.idToken || tokenRes.id_token);
        }

        setIsAuthed(true);
      }
    } catch (e) {
      console.warn('Auth error', e);
    } finally {
      setBusy(false);
    }
  };

  if (!discovery) {
    return (
      <View style={{ flex: 1, backgroundColor: 'black', justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator color="#fff" size="large" />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: 'black', justifyContent: 'center', alignItems: 'center', padding: 24 }}>
      <Text style={{ color: 'white', fontSize: 28, marginBottom: 24 }}>Welcome</Text>

      <TouchableOpacity
        disabled={!request || busy}
        onPress={() => doLogin('google-oauth2')}
        style={{ backgroundColor: 'white', borderRadius: 10, paddingHorizontal: 24, paddingVertical: 12, marginBottom: 12, width: '90%', alignItems: 'center' }}
      >
        <Text style={{ fontSize: 18 }}>Continue with Google</Text>
      </TouchableOpacity>

      {busy ? <ActivityIndicator color="#fff" style={{ marginTop: 20 }} /> : null}
    </View>
  );
}
