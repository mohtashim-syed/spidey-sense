import * as React from 'react';
import { View, Text, ActivityIndicator, StatusBar } from 'react-native';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { useFonts } from 'expo-font';
import { HomeScreen } from './assets/components/HomeScreen';
import { SpideyScreen } from './assets/components/SpideyScreen';
import Setting from './assets/components/Setting';
import WebExplore from './assets/components/WebExplore';

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

function SelectScreen() {
  return (
    <View style={{ flex: 1, backgroundColor: '#000', alignItems: 'center', justifyContent: 'center' }}>
      <Text style={{ color: '#fff', fontSize: 28 }}>Select Screen</Text>
    </View>
  );
}

function BottomTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ focused, color, size }) => {
          let icon;
          switch (route.name) {
            case 'Spidey':
              icon = focused ? 'radio' : 'radio-button-off';
              break;
            case 'Settings':
              icon = focused ? 'settings' : 'settings-outline';
              break;
            default:
              icon = focused ? 'help-circle' : 'help-circle-outline';
          }
          return <Ionicons name={icon} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#000000',
        tabBarInactiveTintColor: 'gray',
        tabBarStyle: { backgroundColor: '#FFF', borderTopColor: '#111' },
      })}
    >
      <Tab.Screen name="Spidey" component={SpideyScreen} />
      <Tab.Screen name="Settings" component={Setting} />
    </Tab.Navigator>
  );
}


export default function App() {
  const [fontsLoaded] = useFonts({
    Baloo: require('./assets/fonts/baloo.regular.ttf'),
  });

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
        screenOptions={{
          headerShown: false,
          animation: 'none',                 // no default push animation = no flicker
          contentStyle: { backgroundColor: '#000' },
        }}
      >
        {/* Splash / Welcome */}
        <Stack.Screen name="Home" component={HomeScreen} />
        
  <Stack.Screen name="Spidey" component={SpideyScreen} />
  <Stack.Screen name="WebExplore" component={WebExplore} />

        {/* Optional page after splash */}
        <Stack.Screen name="Select" component={SelectScreen} />
        {/* Your main app with bottom tabs */}
        <Stack.Screen name="MainTabs" component={BottomTabs} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
