import React, { useState, useEffect, useRef } from 'react';
import { SafeAreaView, ScrollView, Text, View, Button, StyleSheet, Animated } from 'react-native';

const BismillahText = ({ style }) => (
  <Text style={[styles.verseText, styles.bismillahText, style]}>
    بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
  </Text>
);

export default function App() {
  const [currentSurah, setCurrentSurah] = useState(1);
  const [verseData, setVerseData] = useState([]);
  const [surahName, setSurahName] = useState('');
  const fadeAnim = new Animated.Value(0);
  const scrollViewRef = useRef(null);

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 1000,
      useNativeDriver: true,
    }).start();
    fetchSurahData();
  }, [currentSurah]);

  useEffect(() => {
    scrollViewRef.current.scrollTo({ y: 0 });
  }, [currentSurah]);

  const fetchSurahData = () => {
    fetch(`https://api.quran.gading.dev/surah/${currentSurah}`)
      .then(response => response.json())
      .then(data => {
        if (data && data.data && data.data.verses && data.data.name) {
          setSurahName(data.data.name.long);
          let verses = data.data.verses.map((verse, index) => ({
            ...verse,
            number: { inQuran: (index + 1).toLocaleString('ar') }
          }));
          if (currentSurah !== 1) {
            verses = [{
              number: { inQuran: '' },
              text: { arab: '' }
            }, ...verses];
          }
          setVerseData(verses);
        } else {
          console.log('Invalid');
        }
      })
      .catch(err => console.log(err));
  };

  const goToNextSurah = () => {
    setCurrentSurah(currentSurah === 114 ? 1 : currentSurah + 1);
  };

  const goToPrevtSurah = () => {
    setCurrentSurah(currentSurah === 1 ? 114 : currentSurah - 1);
  };

  return (
    <SafeAreaView style={styles.container}>
      <Animated.View style={[styles.header, { opacity: fadeAnim }]}>
        <Text style={styles.headerText}>{surahName}</Text>
      </Animated.View>
      <ScrollView ref={scrollViewRef}>
        <View style={styles.verseContainer}>
          {verseData.length > 0 ? (
            verseData.map((verse, index) => (
              <View key={index}>
                {verse.number.inQuran !== '' ? (
                  <Text style={styles.verseText}>
                    <Text style={styles.verseNumber}>{verse.number.inQuran}. </Text>
                    {verse.text.arab}
                  </Text>
                ) : (
                    <BismillahText style={ {
                      fontSize: 22,
                      color: 'darkslateblue',
                    } } />
                )}
              </View>
            ))
          ) : (
            <Text>Loading...</Text>
          )}
        </View>
      </ScrollView>
      <View style={styles.buttonContainer}>
        <Button title="Next Surah" onPress={goToNextSurah} />
        <Button title="Prev Surah" onPress={goToPrevtSurah} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 10,
    marginTop: 40
  },
  header: {
    marginBottom: 15
  },
  headerText: {
    fontSize: 25,
    fontWeight: 'bold',
    textAlign: 'center',
    color: 'slateblue'
  },
  verseContainer: {
    padding: 10,
    borderRadius: 10,
    justifyContent: 'center',
    marginBottom: 20,
    gap: 5
  },
  verseText: {
    fontSize: 20,
    padding: 10,
    paddingHorizontal: 15,
    borderRadius: 10
  },
  verseNumber: {
    fontSize: 18,
    color: 'slateblue',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-evenly'
  }
});
