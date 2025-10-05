
import * as React from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, Platform } from 'react-native';
import * as AuthSession from 'expo-auth-session';
import { useAutoDiscovery, useAuthRequest, exchangeCodeAsync } from 'expo-auth-session';
import * as SecureStore from 'expo-secure-store';
import Constants from 'expo-constants';
import { ShadowTitle } from './ShadowTitle';

const auth0Domain = `https://${Constants.expoConfig?.extra?.auth0Domain}`;
const clientId = Constants.expoConfig?.extra?.auth0ClientId;


  function button(text, onPress) {
    return (
      <View
        style={{
          borderRadius: 50,
          borderWidth: 4,
          margin: '2.5%',
        }}
      >
        <TouchableOpacity
          onPress={onPress}
          style={{
            borderRadius: 40,
            borderWidth: 8,
            borderColor: '#FFF',
            paddingVertical: 10,
            backgroundColor: 'rgba(0,0,0,0.4)',
          }}
        >
          <Text
            style={{
              fontFamily: 'Baloo',
              fontSize: 40,
              textAlign: 'center',
              color: '#FFF',
              paddingHorizontal: '10%',
            }}
          >
            {text}
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

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
        { 
        }
      );

      if (res.type === 'success') {

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
      <ShadowTitle text={"WELCOME"} />
      <View style={{marginVertical: 10}}/>
      {button("Continue with Google", () => doLogin('google-0auth2')) }

      {busy ? <ActivityIndicator color="#fff" style={{ marginTop: 20 }} /> : null}
    </View>
  );
}
