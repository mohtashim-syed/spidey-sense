import * as React from 'react';
import { View, Text, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ShadowTitle } from './ShadowTitle';
import { styles } from '../styles';

export function SpideyScreen({navigation}) {
  const openExplore = () => {
    const base = process.env.EXPO_PUBLIC_API_BASE;
    if (!base) {
      Alert.alert(
        'Backend URL missing',
        'Set EXPO_PUBLIC_API_BASE to your https tunnel origin before starting Expo, e.g.:\n\nEXPO_PUBLIC_API_BASE="https://<your-ngrok>.ngrok-free.dev" npx expo start -c --tunnel'
      );
      return;
    }
    // Prefer navigating on the parent stack from inside tabs
    const parent = navigation.getParent?.();
    if (parent?.navigate) parent.navigate('WebExplore');
    else navigation.navigate('WebExplore');
  };

  function button(text, onPress) {
    return (
      <TouchableOpacity 
        onPress={onPress}
        style={{
          borderRadius: 50,
          borderWidth: 10,
          borderColor: "#FFFFFF",
          marginTop: 24,
          paddingVertical: 12,
          paddingHorizontal: 30,
          backgroundColor: 'rgba(255, 255, 255, 0.12)'
        }}>
        <Text style={{
          fontFamily: 'Baloo',
          fontSize: 42,
          textAlign:'center',
          color: "#FFFFFF",
          paddingHorizontal: 12
        }}>
          {text}
        </Text>
      </TouchableOpacity>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { alignItems: 'center' }]}>
      <View style={{marginTop: 10}} />
      <ShadowTitle text="SELECT" />
      <View style={{marginVertical: -10}} />
      <ShadowTitle text="YOUR" />
  {button("EXPLORE", openExplore)}
      <ShadowTitle text="SPIDEY-" />
      <View style={{marginVertical: -10}} />
      <ShadowTitle text="SENSE" />
    </SafeAreaView>
  );
}
