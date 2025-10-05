import * as React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ShadowTitle } from './ShadowTitle';
import { styles } from '../styles';

export function SpideyScreen({navigation}) {
  const openExplore = () => navigation.navigate('WebExplore');

  function button(text, onPress) {
    return (
      <TouchableOpacity 
        onPress={onPress}
        style={{
          borderRadius: 50,
          borderWidth: 10,
          borderColor: "#34D399",
          marginTop: 24,
          paddingVertical: 12,
          paddingHorizontal: 30,
          backgroundColor: 'rgba(52, 211, 153, 0.12)'
        }}>
        <Text style={{
          fontFamily: 'Baloo',
          fontSize: 42,
          textAlign:'center',
          color: "#34D399",
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
