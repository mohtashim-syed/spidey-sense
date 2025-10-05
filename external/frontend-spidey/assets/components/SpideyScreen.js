import * as React from 'react';
import { View, Text, TouchableOpacity, Alert, ImageBackground } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Camera } from 'expo-camera';
import { ShadowTitle } from './ShadowTitle';
import { styles } from '../styles';

export function SpideyScreen({ navigation }) {
  const bgImage = require('../../assets/anthony2.png');

  const requestPermissions = async () => {
    try {
      const { status: camStatus } = await Camera.requestCameraPermissionsAsync();

      if (camStatus === 'granted') {
        Alert.alert('All Set!', 'You can now use your Spidey-Sense camera!');
        navigation.navigate('CameraScreen');
      } else {
        Alert.alert('Uh-Oh!', 'Spidey-Sense has not been activated.\nPlease enable camera and mic in settings.');
      }
    } catch (err) {
      console.error(err);
    }
  };

  function button(text, onPress) {
    return (
      <View
        style={{
          borderRadius: 50,
          borderWidth: 5,         // black outer border
          borderColor: '#000',
          margin: '3%',
        }}
      >
        <TouchableOpacity
          onPress={onPress}
          style={{
            borderRadius: 40,
            borderWidth: 8,       // white inner border
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

  return (
    <ImageBackground source={bgImage} style={{ flex: 1 }} resizeMode="cover">
      <SafeAreaView style={[styles.container, { alignItems: 'center' }]}>
        <View style={{ marginTop: 10 }} />
        <ShadowTitle text="SELECT" />
        <View style={{ marginVertical: -10 }} />
        <ShadowTitle text="YOUR" />
        {button('EXPLORE', requestPermissions)}
        {button('FOCUS', requestPermissions)}
        {button('CALM', requestPermissions)}
        <View style={{ marginVertical: 10 }} />
        <ShadowTitle text="SPIDEY-" />
        <View style={{ marginVertical: -10 }} />
        <ShadowTitle text="SENSE" />
      </SafeAreaView>
    </ImageBackground>
  );
}
