import * as React from 'react';
import { View, Text, TouchableOpacity, Alert } from 'react-native';
import * as LocalAuthentication from 'expo-local-authentication';
import * as SecureStore from 'expo-secure-store';

export default function BiometricSetupScreen({ onDone }) {
  const [supported, setSupported] = React.useState(false);

  React.useEffect(() => {
    (async () => {
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      const enrolled = await LocalAuthentication.isEnrolledAsync();
      setSupported(hasHardware && enrolled);
    })();
  }, []);

  const enableBiometrics = async () => {
    if (!supported) {
      Alert.alert('Unavailable', 'Face ID / fingerprint not available or not enrolled.');
      return;
    }

    const res = await LocalAuthentication.authenticateAsync({ promptMessage: 'Enable biometric unlock' });
    if (!res.success) return;

    await SecureStore.setItemAsync('biometricEnabled', 'true');
    Alert.alert('Done', 'Biometric unlock enabled.');
    onDone?.();
  };

  return (
    <View style={{ flex: 1, backgroundColor: 'black', justifyContent: 'center', alignItems: 'center', padding: 24 }}>
      <Text style={{ color: 'white', fontSize: 24, marginBottom: 12 }}>Protect your account</Text>
      <Text style={{ color: 'white', opacity: 0.8, textAlign: 'center', marginBottom: 24 }}>
        Use Face ID / fingerprint to unlock your session on this device.
      </Text>

      <TouchableOpacity
        onPress={enableBiometrics}
        style={{ backgroundColor: 'white', borderRadius: 10, paddingHorizontal: 24, paddingVertical: 12, width: '90%', alignItems: 'center', marginBottom: 12 }}
      >
        <Text style={{ fontSize: 18 }}>Enable Face ID / Fingerprint</Text>
      </TouchableOpacity>

      <TouchableOpacity
        onPress={() => onDone?.()}
        style={{ backgroundColor: 'transparent', borderWidth: 1, borderColor: 'white', borderRadius: 10, paddingHorizontal: 24, paddingVertical: 12, width: '90%', alignItems: 'center' }}
      >
        <Text style={{ fontSize: 16, color: 'white' }}>Skip for now</Text>
      </TouchableOpacity>
    </View>
  );
}
