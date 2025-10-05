import * as React from 'react';
import { View, Text, TouchableOpacity, Alert, ImageBackground, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Camera } from 'expo-camera';
import { Asset } from 'expo-asset';
import { ShadowTitle } from './ShadowTitle';
import { styles } from '../styles';

export function SpideyScreen({ navigation }) {
  const [bgLoaded, setBgLoaded] = React.useState(false);
  const bgImage = require('../../Background-pic/anthony2.png');

  React.useEffect(() => {
    async function loadBackground() {
      await Asset.loadAsync([bgImage]);
      setBgLoaded(true);
    }
    loadBackground();
  }, []);

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

  if (!bgLoaded) {
    return (
      <View style={{ flex: 1, backgroundColor: '#000', alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="large" color="#fff" />
        <Text style={{ color: '#fff', marginTop: 10 }}>Loading...</Text>
      </View>
    );
  }

  return (
    <ImageBackground source={bgImage} style={{ flex: 1 }} resizeMode="cover">
      <SafeAreaView
        style={[
          styles.container,
          { alignItems: 'center', justifyContent: 'space-between', paddingVertical: 100 },
        ]}
      >
        <View style={{ alignItems: 'center' }}>
          <ShadowTitle text="SELECT" />
          <View style={{ marginVertical: -8 }} />
          <ShadowTitle text="YOUR" />
        </View>

        <TouchableOpacity
          onPress={requestPermissions}
          style={{
            borderRadius: 50,
            borderWidth: 4,
            borderColor: '#000',
          }}
        >
          <View
            style={{
              borderRadius: 40,
              borderWidth: 8,
              borderColor: '#FFF',
              paddingVertical: 10,
              paddingHorizontal: 40,
              backgroundColor: 'rgba(0,0,0,0.4)',
            }}
          >
            <Text
              style={{
                fontFamily: 'Baloo',
                fontSize: 40,
                textAlign: 'center',
                color: '#FFF',
              }}
            >
              EXPLORE
            </Text>
          </View>
        </TouchableOpacity>

        <View style={{ alignItems: 'center'}}>
          <ShadowTitle text="SPIDEY-" />
          <View style={{ marginVertical: -4 }} />
          <ShadowTitle text="SENSE" />
        </View>
      </SafeAreaView>
    </ImageBackground>
  );
}
