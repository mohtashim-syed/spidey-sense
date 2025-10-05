import React, { useState } from 'react';
import { View, Text, Image, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import LogoutButton from './LogoutButton';

const AVATARS = [
  require('./profilepic/gwen.jpeg'),
  require('./profilepic/Hobie.jpeg'),
  require('./profilepic/Miles.jpeg'),
  require('./profilepic/peterbpark.jpeg'),
];

const leaderboard = [
  { name: 'Gwen',  steps: 10400, weight: 175, height: 62 },
  { name: 'Miles', steps: 13200, weight: 138, height: 64 },
  { name: 'Punk',  steps: 13400, weight: 195, height: 65 },
  { name: 'Peter', steps: 14400, weight: 190, height: 67 },
  { name: 'Nina',  steps:  9100, weight: 140, height: 66 },
  { name: 'Leo',   steps: 12600, weight: 180, height: 70 },
  { name: 'Ava',   steps: 11300, weight: 172, height: 72 },
  { name: 'Riley', steps: 14300, weight: 140, height: 73 },
];

export default function Setting({setIsAuthed}) {
console.log('Setting got setIsAuthed:', typeof setIsAuthed);

  const [selected, setSelected] = React.useState(0);     // currently previewed
  const [savedIndex, setSavedIndex] = React.useState(0); // currently saved (confirmed)

  const goLeft = () => setSelected(prev => (prev === 0 ? AVATARS.length - 1 : prev - 1));
  const goRight = () => setSelected(prev => (prev === AVATARS.length - 1 ? 0 : prev + 1));

  const confirmAvatar = () => {
    setSavedIndex(selected);
    alert('Avatar Updated\nYour profile picture has been saved.');
  };

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
          fontSize: 35,
          fontWeight: '600',
          marginBottom: 30,
          fontFamily: 'Baloo',
          textShadowColor: '#A20021',
          textShadowRadius: 8,
          textShadowOffset: { width: 0, height: 1 },
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
          marginBottom: 30,
        }}
      >
        <Text style={{ color: '#000', fontWeight: '700' }}>PROFILE INFO</Text>
      </TouchableOpacity>

      <TouchableOpacity
        onPress={() => setFriendsOpen(!friendsOpen)}
        style={{
          backgroundColor: '#f2f2f2',
          borderRadius: 12,
          paddingVertical: 14,
          alignItems: 'center',
          borderWidth: 2,
          borderColor: '#000',
          width: '80%',
          marginBottom: friendsOpen ? 16 : 30,
        }}
      >
        <Text style={{ color: '#000', fontWeight: '700' }}>
          FRIENDS {friendsOpen ? '▲' : '▼'}
        </Text>
      </TouchableOpacity>

      {friendsOpen && (
        <View
          style={{
            width: '80%',
            backgroundColor: '#fff',
            borderRadius: 12,
            borderWidth: 2,
            borderColor: '#000',
            padding: 14,
            marginBottom: 24,
            gap: 10,
          }}
        >
          <Text style={{ color: '#000', fontWeight: '700', marginBottom: 8 }}>
            Leaderboard
          </Text>

          {leaderboard.map((p, i) => {
            const isLast = i === leaderboard.length - 1;
            return (
              <View key={p.name + i} style={{ marginBottom: 10 }}>
                <View
                  style={{
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    paddingVertical: 10,
                    paddingHorizontal: 12,
                    borderWidth: 2,
                    borderColor: '#000',
                    borderRadius: 10,
                  }}
                >
                  <Text style={{ color: '#000', fontWeight: '700', width: 32, textAlign: 'center' }}>{i + 1}</Text>
                  <Text style={{ color: '#000', flex: 1, marginLeft: 8 }}>{p.name}</Text>
                  <Text style={{ color: '#333', marginRight: 14 }}>{p.weight} lb · {p.height} in</Text>
                  <Text style={{ color: '#000', fontWeight: '800' }}>{p.steps.toLocaleString()} steps</Text>
                </View>

                {isLast && (
                  <TouchableOpacity
                    onPress={() => setShowChart(!showChart)}
                    style={{
                      alignSelf: 'flex-start',
                      marginTop: 6,
                      paddingVertical: 8,
                      paddingHorizontal: 12,
                      borderRadius: 8,
                      borderWidth: 2,
                      borderColor: '#000',
                      backgroundColor: '#f2f2f2',
                    }}
                  >
                    <Text style={{ color: '#000', fontWeight: '700' }}>
                      {showChart ? 'Hide graph' : 'See more'}
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            );
          })}

          {showChart && (
            <Image
              source={require('./profilepic/Chart-pic1/output.png')}
              style={{
                width: '100%',
                height: 220,
                borderRadius: 10,
                borderWidth: 2,
                borderColor: '#000',
                marginTop: 10,
              }}
              resizeMode="contain"
            />
          )}
        </View>
      )}

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
        <Text style={{ color: '#000', fontWeight: '700' }}>LOG OUT</Text>
      </TouchableOpacity> */}
    </ScrollView>
  );
}
