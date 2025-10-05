import * as React from 'react';
import { View, Text, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Camera } from 'expo-camera';
import { ShadowTitle } from './ShadowTitle';
import { styles } from '../styles';

export function SpideyScreen() {

  const requestPermissions = async () => {
    try {
      const { status: camStatus } = await Camera.requestCameraPermissionsAsync();

      if (camStatus === 'granted') {
        Alert.alert("✅ All Set!", "You can now use your Spidey-Sense camera!");
        // 👉 you could now navigate to a camera screen
        navigation.navigate('CameraScreen');
      } else {
        Alert.alert("⚠️ Permission Denied", "Please enable camera and mic in settings.");
      }
    } catch (err) {
      console.error(err);
    }
  };


  return (
    <SafeAreaView style={[styles.container, { alignItems: 'center' }]}>
        <ShadowTitle text={"Uh-Oh"}/>
    </SafeAreaView>
  );
}
