import * as React from 'react';
import { View, Text, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Camera } from 'expo-camera';
import { ShadowTitle } from './ShadowTitle';
import { styles } from '../styles';

export function SpideyScreen({navigation}) {

  const requestPermissions = async () => {
    try {
      const { status: camStatus } = await Camera.requestCameraPermissionsAsync();

      if (camStatus === 'granted') {
        Alert.alert("All Set!", "You can now use your Spidey-Sense camera!");
        // 👉 you could now navigate to a camera screen
        navigation.navigate('CameraScreen');
      } else {
        Alert.alert("Uh-Oh!", "Spidey-Sense has not been activated.\n Please enable camera and mic in settings.");
      }
    } catch (err) {
      console.error(err);
    }
  };

  function button(text, onPress) {
    return (
      <TouchableOpacity 
        onPress={onPress}
        style={{
          borderRadius: 40,
          borderWidth: 10,
          borderColor: "#FFF",
          margin: "2.5%",
          paddingVertical: 10,
        }}>
        <Text style={{
          fontFamily: 'Baloo',
          fontSize: 40,
          textAlign:'center',
          color: "#FFF",
          paddingHorizontal: "10%"
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
      {button("Explore", requestPermissions)}
      {button("Focus", requestPermissions)}
      {button("Calm", requestPermissions)}
      <ShadowTitle text="SPIDEY-" />
      <View style={{marginVertical: -10}} />
      <ShadowTitle text="SENSE" />
    </SafeAreaView>
  );
}
