// App.js
import * as React from 'react';
import { View, Text, ActivityIndicator, StatusBar } from 'react-native';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { useFonts } from 'expo-font';
import * as WebBrowser from 'expo-web-browser';

import { HomeScreen } from './assets/components/HomeScreen';
import { SpideyScreen } from './assets/components/SpideyScreen';
import { CameraScreen } from './assets/components/CameraScreen';
import AuthScreen from './assets/components/AuthScreen'; // 👈 default import (fix)
import Setting from './assets/components/Setting';
import BiometricSetupScreen from './assets/components/BiometricSetupScreen'; // 👈 (new file in Step 3)


WebBrowser.maybeCompleteAuthSession();

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

const DarkTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: '#000',
    card: '#000',
    text: '#fff',
    border: '#000',
    primary: '#007AFF',
    notification: '#000',
  },
};

function BottomTabs( {setIsAuthed} ) {
  console.log("Is Authed", setIsAuthed)
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ focused, color, size }) => {
          let icon;
          switch (route.name) {
            case 'Spidey': icon = focused ? 'radio' : 'radio-button-off'; break;
            case 'Settings': icon = focused ? 'settings' : 'settings-outline'; break;
            default: icon = focused ? 'help-circle' : 'help-circle-outline';
          }
          return <Ionicons name={icon} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#000000',
        tabBarInactiveTintColor: 'gray',
        tabBarStyle: { backgroundColor: '#FFF', borderTopColor: '#111' },
      })}
    >
      <Tab.Screen name="Spidey" component={SpideyScreen} />
      <Tab.Screen name="Settings">
        {(props) => <Setting {...props} setIsAuthed={setIsAuthed} />}
      </Tab.Screen>    
      </Tab.Navigator>
  );
}

export default function App() {
  const [fontsLoaded] = useFonts({ Baloo: require('./assets/fonts/baloo.regular.ttf') });

  // 🔐 Top-level auth/biometric gating
  const [isAuthed, setIsAuthed] = React.useState(false);
  const [biometricDone, setBiometricDone] = React.useState(false);

  if (!fontsLoaded) {
    return (
      <View style={{ flex: 1, backgroundColor: '#000', alignItems: 'center', justifyContent: 'center' }}>
        <StatusBar barStyle="light-content" backgroundColor="#000" />
        <ActivityIndicator />
        <Text style={{ color: '#fff', marginTop: 8 }}>Loading font…</Text>
      </View>
    );
  }

  return (
    <NavigationContainer theme={DarkTheme}>
      <StatusBar barStyle="light-content" backgroundColor="#000" />
      <Stack.Navigator
        screenOptions={{ headerShown: false, animation: 'none', contentStyle: { backgroundColor: '#000' } }}
      >
        {!isAuthed ? (
          // 1) Auth first (no tabs)
          <Stack.Screen name="Auth">
            {(props) => <AuthScreen {...props} setIsAuthed={setIsAuthed} />}
          </Stack.Screen>
        ) : !biometricDone ? (
          // 2) Prompt Face ID / fingerprint
          <Stack.Screen name="BiometricSetup">
            {(props) => <BiometricSetupScreen {...props} onDone={() => setBiometricDone(true)} />}
          </Stack.Screen>
        ) : (
          // 3) Your app proper (tabs now visible)
          <>
            <Stack.Screen name="Home" component={HomeScreen} />
            <Stack.Screen name="Spidey" component={SpideyScreen} />
            <Stack.Screen name="CameraScreen" component={CameraScreen} />
            <Stack.Screen name="MainTabs">
              {(props) => <BottomTabs {...props} setIsAuthed={setIsAuthed} />}
            </Stack.Screen>

          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
