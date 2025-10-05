import * as React from 'react';
import { View, Text, ActivityIndicator, StatusBar } from 'react-native';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { useFonts } from 'expo-font';
const DISABLE_LAZY = process.env.EXPO_PUBLIC_DISABLE_LAZY === '1';
const HomeComp = DISABLE_LAZY
  ? require('./assets/components/HomeScreen').HomeScreen
  : React.lazy(() => import('./assets/components/HomeScreen').then(m => ({ default: m.HomeScreen })));
const SpideyComp = DISABLE_LAZY
  ? require('./assets/components/SpideyScreen').SpideyScreen
  : React.lazy(() => import('./assets/components/SpideyScreen').then(m => ({ default: m.SpideyScreen })));
const SettingComp = DISABLE_LAZY
  ? require('./assets/components/Setting').default
  : React.lazy(() => import('./assets/components/Setting').then(m => ({ default: m.default })));
const WebExploreComp = DISABLE_LAZY
  ? require('./assets/components/WebExplore').default
  : React.lazy(() => import('./assets/components/WebExplore'));

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
      <Tab.Screen name="Spidey">
        {(props) => (
          <React.Suspense fallback={<View style={{ flex:1, backgroundColor:'#000', alignItems:'center', justifyContent:'center' }}><ActivityIndicator color="#fff" /></View>}>
            <SpideyComp {...props} />
          </React.Suspense>
        )}
      </Tab.Screen>
      <Tab.Screen name="Settings">
        {(props) => (
          <React.Suspense fallback={<View style={{ flex:1, backgroundColor:'#000', alignItems:'center', justifyContent:'center' }}><ActivityIndicator color="#fff" /></View>}>
            <SettingComp {...props} />
          </React.Suspense>
        )}
      </Tab.Screen>
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
        <Stack.Screen name="Home">
          {(props) => (
            <React.Suspense fallback={<View style={{ flex:1, backgroundColor:'#000', alignItems:'center', justifyContent:'center' }}><ActivityIndicator color="#fff" /></View>}>
              <HomeComp {...props} />
            </React.Suspense>
          )}
        </Stack.Screen>
        
        <Stack.Screen name="Spidey">
          {(props) => (
            <React.Suspense fallback={<View style={{ flex:1, backgroundColor:'#000', alignItems:'center', justifyContent:'center' }}><ActivityIndicator color="#fff" /></View>}>
              <SpideyComp {...props} />
            </React.Suspense>
          )}
        </Stack.Screen>
        <Stack.Screen name="WebExplore">
          {(props) => (
            <React.Suspense fallback={
              <View style={{ flex: 1, backgroundColor: '#000', alignItems: 'center', justifyContent: 'center' }}>
                <ActivityIndicator color="#fff" />
                <Text style={{ color: '#fff', marginTop: 8 }}>Loading Explore…</Text>
              </View>
            }>
              <WebExploreComp {...props} />
            </React.Suspense>
          )}
        </Stack.Screen>

        {/* Optional page after splash */}
        <Stack.Screen name="Select" component={SelectScreen} />
        {/* Your main app with bottom tabs */}
        <Stack.Screen name="MainTabs" component={BottomTabs} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
