import React from 'react';
import { View, Text, Image, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import LogoutButton from './LogoutButton';

const AVATARS = [
  require('./profilepic/gwen.jpeg'),
  require('./profilepic/Hobie.jpeg'),
  require('./profilepic/Miles.jpeg'),
  require('./profilepic/peterbpark.jpeg'),
];

export default function Setting({setIsAuthed}) {
console.log('Setting got setIsAuthed:', typeof setIsAuthed);

  const [selected, setSelected] = React.useState(0);     // currently previewed
  const [savedIndex, setSavedIndex] = React.useState(0); // currently saved (confirmed)

  const goLeft = () => setSelected(prev => (prev === 0 ? AVATARS.length - 1 : prev - 1));
  const goRight = () => setSelected(prev => (prev === AVATARS.length - 1 ? 0 : prev + 1));
  const confirmAvatar = () => { setSavedIndex(selected); Alert.alert('Avatar Updated', 'Your profile picture has been saved.'); };
  const isSaved = selected === savedIndex;

  return (
    <ScrollView
      contentContainerStyle={{
        padding: 20,
        paddingTop: 100,
        backgroundColor: '#fff',
        flexGrow: 1,
        alignItems: 'center',
      }}
    >
      <Text
        style={{
          color: '#000',
          fontSize: 24,
          fontWeight: '600',
          marginBottom: 30,
          fontFamily: 'Baloo',
          textShadowColor: '#A20021',
          textShadowRadius: 10,
          textShadowOffset: { width: 0, height: 6 },
        }}
      >
        SETTING MODE
      </Text>

      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
        <TouchableOpacity onPress={goLeft} style={{ padding: 10 }}>
          <Ionicons name="arrow-back-circle" size={36} color="#000" />
        </TouchableOpacity>

        <View style={{ marginHorizontal: 10 }}>
          <Image
            source={AVATARS[selected]}
            style={{
              width: 120,
              height: 120,
              borderRadius: 999,
              borderWidth: 3,
              borderColor: '#000',
            }}
          />
        </View>

        <TouchableOpacity onPress={goRight} style={{ padding: 10 }}>
          <Ionicons name="arrow-forward-circle" size={36} color="#000" />
        </TouchableOpacity>
      </View>

      <Text style={{ color: '#444', marginBottom: 12 }}>
        Avatar {selected + 1} of {AVATARS.length} {isSaved ? '(current)' : '(preview)'}
      </Text>

      <TouchableOpacity
        disabled={isSaved}
        onPress={confirmAvatar}
        style={{
          opacity: isSaved ? 0.5 : 1,
          backgroundColor: '#f2f2f2',
          borderRadius: 12,
          paddingVertical: 12,
          paddingHorizontal: 18,
          borderWidth: 1,
          borderColor: '#000',
          alignItems: 'center',
          marginBottom: 28,
        }}
      >
        <Text style={{ color: '#000', fontWeight: '700', fontFamily: 'Baloo' }}>
          {isSaved ? 'CONFIRMED' : 'CONFIRM'}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={{
          backgroundColor: '#f2f2f2',
          borderRadius: 12,
          paddingVertical: 14,
          alignItems: 'center',
          borderWidth: 2,
          borderColor: '#000',
          width: '80%',
          marginBottom: 58,
          marginTop: 33,
        }}
      >
        <Text style={{ color: '#000', fontWeight: '700' }}>PROFILE INFO</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={{
          backgroundColor: '#f2f2f2',
          borderRadius: 12,
          paddingVertical: 14,
          alignItems: 'center',
          borderWidth: 2,
          borderColor: '#000',
          width: '80%',
          marginBottom: 50,
        }}
      >
        <Text style={{ color: '#000', fontWeight: '700' }}>SOUND EFFECT</Text>
      </TouchableOpacity>

  <LogoutButton
    useProxy={true}                 // dev: true, prod: false
    onLoggedOut={() => setIsAuthed(false)}
  />
      {/* <TouchableOpacity
        style={{
          backgroundColor: '#f2f2f2',
          borderRadius: 12,
          paddingVertical: 14,
          alignItems: 'center',
          borderWidth: 2,
          borderColor: '#000',
          width: '80%',
          marginTop: 10,
        }}
      >
        <Text style={{ color: '#fff', fontWeight: '700' }}>LOG OUT</Text>
      </TouchableOpacity> */}
    </ScrollView>
  );
}
