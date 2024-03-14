import React, { useState, useEffect, useRef } from 'react';
import { SafeAreaView, ScrollView, Text, View, TouchableOpacity, StyleSheet, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Speech from 'expo-speech';

const BismillahText = ({ style }) => (
  <Text style={[styles.verseText, styles.bismillahText, style]}>
    بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
  </Text>
);

const Verse = ({ verse }) => {
  const handleRead = async (verse) => {
    if (verse && verse.text && verse.text.arab) {
      try {
        const response = await fetch(`https://api.quran.com/api/v4/resources/recitations`, {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
          },
        });
        if (!response.ok) {
          throw new Error(`Failed to fetch audio: ${response.statusText}`);
        }
        const recitationsData = await response.json();
        
        const chosenRecitation = recitationsData.recitations.find(recitation => recitation.reciter_name === 'Abdur-Rahman as-Sudais');

        if (!chosenRecitation) {
          throw new Error('Chosen recitation not found');
        }

        const audioUrl = `https://api.quran.com/api/v4/chapter_recitations/${chosenRecitation.id}/${verse.chapter_number}`;
        
        await Speech.speak(verse.text.arab, { language: 'ar' }); 
        await Speech.speak(verse.text.translation, { language: 'en' }); 
        await Speech.playAsync({ uri: audioUrl }); 
      } catch (error) {
        console.error('Error reading verse:', error);
      }
    } else {
      console.log("Verse text not available for reading.");
    }
  };


  return (
    <View>
      {verse.number.inQuran !== '' ? (
        <Text style={styles.verseText}>
          <Text style={styles.verseNumber}>{verse.number.inQuran} ) </Text>
          {verse.text.arab}
        </Text>
      ) : (
        <BismillahText style={{
          fontSize: 22,
          color: 'darkslateblue',
        }} />
      )}
      <TouchableOpacity onPress={() => handleRead(verse)}>
        <Text style={styles.readButton}>Read</Text>
      </TouchableOpacity>
    </View>
  );
};

const SurahItem = ({ surah, onPress }) => (
  <TouchableOpacity onPress={() => onPress(surah.number)}>
    <Text style={styles.surahItem}>{surah.name}</Text>
  </TouchableOpacity>
);

const MainScreen = ({ onSelectSurah }) => {
  const [surahList, setSurahList] = useState([]);

  useEffect(() => {
    fetchSurahList();
  }, []);

  const fetchSurahList = () => {
    fetch('https://api.quran.gading.dev/surah')
      .then(response => response.json())
      .then(data => {
        if (data && data.data) {
          setSurahList(data.data);
        } else {
          console.log('Invalid data');
        }
      })
      .catch(error => {
        console.error('Error fetching surah list:', error);
      });
  };

  return (
    <ScrollView>
      <View style={styles.surahListContainer}>
        {surahList.map(surah => (
          <SurahItem key={surah.number} surah={surah} onPress={onSelectSurah} />
        ))}
      </View>
    </ScrollView>
  );
};

export default function App() {
  const [currentSurah, setCurrentSurah] = useState(1);
  const [verseData, setVerseData] = useState([]);
  const [surahName, setSurahName] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
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
  }, [currentSurah, currentPage]);

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

  const onSelectSurah = (surahNumber) => {
    setCurrentSurah(surahNumber);
  };

  const goToNextPage = () => {
    setCurrentPage(currentPage + 1);
  };

  const goToPrevPage = () => {
    setCurrentPage(currentPage - 1);
  };

  const renderVerses = () => {
    const startIndex = (currentPage - 1) * 10;
    const endIndex = currentPage * 10;
    return verseData.slice(startIndex, endIndex).map((verse, index) => (
      <Verse key={index} verse={verse} />
    ));
  };

  return (
    <SafeAreaView style={styles.container}>
      {currentSurah === -1 ? (
        <MainScreen onSelectSurah={onSelectSurah} />
      ) : (
        <>
          <Animated.View style={[styles.header, { opacity: fadeAnim }]}>
            <Text style={styles.headerText}>{surahName}</Text>
          </Animated.View>
          <ScrollView ref={scrollViewRef}>
            <View style={styles.verseContainer}>
              {verseData.length > 0 ? (
                renderVerses()
              ) : (
                <Text>Loading...</Text>
              )}
            </View>
          </ScrollView>
          <View style={styles.footer}>
            <TouchableOpacity onPress={() => setCurrentSurah(currentSurah === 1 ? 114 : currentSurah - 1)}>
              <Ionicons name="arrow-back-circle" size={32} color="black" />
            </TouchableOpacity>

            <TouchableOpacity onPress={goToPrevPage} disabled={currentPage === 1}>
              <Ionicons name="chevron-back" size={32} color={currentPage === 1 ? 'gray' : 'black'} />
            </TouchableOpacity>

            <View style={styles.pageNumberContainer}>
              <Text style={styles.pageNumber}>{currentPage}</Text>
            </View>

            <TouchableOpacity onPress={goToNextPage} disabled={verseData.length <= currentPage * 10}>
              <Ionicons name="chevron-forward" size={32} color={verseData.length <= currentPage * 10 ? 'gray' : 'black'} />
            </TouchableOpacity>

            <TouchableOpacity onPress={() => setCurrentSurah(currentSurah === 114 ? 1 : currentSurah + 1)}>
              <Ionicons name="arrow-forward-circle" size={32} color="black" />
            </TouchableOpacity>
          </View>
        </>
      )}
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
    marginBottom: 15,
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
    gap: 5,
  },
  verseText: {
    fontSize: 20,
    padding: 5,
    paddingHorizontal: 15,
    borderRadius: 10,
  },
  verseNumber: {
    fontSize: 18,
    color: 'slateblue',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-evenly'
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  pageNumberContainer: {
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 5,
  },
  pageNumber: {
    color: '#fff'
  },
  readButton: {
    color: 'blue',
    textAlign: 'left',
    fontSize: 16,
    fontWeight: 'bold',
    borderBottomColor: 'lightgray',
    borderBottomWidth: 1,
    paddingBottom: 10
  },
  surahListContainer: {
    padding: 10,
  },
  surahItem: {
    fontSize: 18,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'lightgray',
  },
});
