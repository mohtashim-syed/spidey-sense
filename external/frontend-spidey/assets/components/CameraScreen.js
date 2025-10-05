import * as React from 'react';
import { View, TouchableOpacity, Text, ActivityIndicator } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { SafeAreaView } from 'react-native-safe-area-context';

export function CameraScreen({ navigation }) {
  const [permission, requestPermission] = useCameraPermissions();
  const [facing, setFacing] = React.useState('back'); // 'back' | 'front'
  const cameraRef = React.useRef(null);

  // Waiting on permission object to load
  if (!permission) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'black' }}>
        <ActivityIndicator size="large" color="#fff" />
      </View>
    );
  }

  // Not granted yet
  if (!permission.granted) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'black' }}>
        {console.error("ERROR has occurred")}
      </View>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: 'black' }}>
      <CameraView style={{ flex: 1 }} facing={facing} ref={cameraRef} />

      <View style={{ position: 'absolute', bottom: 50, width: '100%', alignItems: 'center' }}>
        <TouchableOpacity
          onPress={() => setFacing(prev => (prev === 'back' ? 'front' : 'back'))}
          style={{ backgroundColor: '#fff', borderRadius: 50, paddingHorizontal: 20, paddingVertical: 8, marginBottom: 10 }}
        >
          <Text style={{ fontSize: 18 }}>Flip Camera</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={{ backgroundColor: '#fff', borderRadius: 50, paddingHorizontal: 30, paddingVertical: 10 }}
        >
          <Text style={{ fontSize: 20, fontWeight: 'bold' }}>Go Back</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
