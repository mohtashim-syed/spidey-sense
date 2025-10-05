
import * as React from 'react';
import { Text, View, Image, ActivityIndicator } from 'react-native';

export const ShadowTitle = ({ text }) => (
  <Text
    style={{
      color: '#fff',
      fontFamily: 'Baloo',  // must match the key below
      fontSize: 80,
      // Avoid fontWeight with many custom TTFs unless you have separate weight files.
      letterSpacing: 1,
      textShadowColor: "#A20021",
      textShadowRadius: 10,
      textShadowOffset: { width: 0, height: 6 },
      marginVertical: -20,
    }}
  >
    {text}
  </Text>
);