import * as React from 'react';
import { View, Image, Animated } from 'react-native';
import { ShadowTitle } from './ShadowTitle';

export function HomeScreen({ navigation }) {
  const imageSize = 484.71;

  // Fade for whole screen (start at 0 to fade IN)
  const fade = React.useRef(new Animated.Value(0)).current;
  // Progress for the loading bar width
  const progress = React.useRef(new Animated.Value(0)).current;
  const [showBar, setShowBar] = React.useState(true);

  React.useEffect(() => {
    // 1) Fade IN
    Animated.timing(fade, { toValue: 1, duration: 400, useNativeDriver: true }).start(() => {
      // 2) Fill the bar in 2s
      Animated.timing(progress, { toValue: 1, duration: 2000, useNativeDriver: false }).start(({ finished }) => {
        if (!finished) return;
        setShowBar(false);
        // 3) Fade OUT quickly
        Animated.timing(fade, { toValue: 0, duration: 300, useNativeDriver: true }).start(() => {
          // 4) Go straight to your tabs (tabs appear now)
          navigation.replace('MainTabs'); // or 'Select' if you want that in-between page
        });
      });
    });
  }, [fade, progress, navigation]);

  const barWidth = progress.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  return (
    <Animated.View style={{ flex: 1, backgroundColor: '#000', paddingTop: 48, alignItems: 'center', opacity: fade }}>
      <View style={{ marginTop: 50 }} />
      <ShadowTitle text="WELCOME" />

      <Image
        source={require('../../Background-pic/spidereye.png')}
        style={{
          width: imageSize,
          height: imageSize,
          marginVertical: -40,
          marginRight: 10,
          shadowColor: '#A20021',
          shadowOffset: { width: 0, height: 10 },
          shadowOpacity: 0.8,
          shadowRadius: 10,
        }}
        resizeMode="contain"
      />

      <ShadowTitle text="SPIDEY" />
      <ShadowTitle text="SENSERS" />

      {showBar && (
        <View
          style={{
            width: 280,
            height: 8,
            backgroundColor: '#171717',
            borderRadius: 999,
            overflow: 'hidden',
            marginTop: 16,
          }}
        >
          <Animated.View style={{ width: barWidth, height: '100%', backgroundColor: '#A20021' }} />
        </View>
      )}
    </Animated.View>
  );
}
