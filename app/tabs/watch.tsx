import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Alert,
  ActivityIndicator,
  SafeAreaView,
} from 'react-native';
import { useAuth } from '@/contexts/AuthContext';
import { useLocalSearchParams } from 'expo-router';
import VerticalVideoPlayer from '../../components/VerticalVideoPlayer';
import { clipsService, Film, WatchProgress } from '@/lib/clipsService';

export default function Watch() {
  const { user } = useAuth();
  const { filmId } = useLocalSearchParams<{ filmId?: string }>();
  const [film, setFilm] = useState<Film | null>(null);
  const [currentClipIndex, setCurrentClipIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [watchProgress, setWatchProgress] = useState<WatchProgress | null>(null);

  // Use filmId from params, or fall back to the first available film
  useEffect(() => {
    loadFilmAndProgress();
  }, [user, filmId]);

  const loadFilmAndProgress = async () => {
    try {
      setLoading(true);

      let selectedFilmId = filmId;
      
      // If no filmId provided, get the first available film
      if (!selectedFilmId) {
        const allFilms = await clipsService.getAllFilms();
        if (allFilms.length === 0) {
          Alert.alert('No Films', 'No films available to watch');
          return;
        }
        selectedFilmId = allFilms[0].id;
      }

      // Load film data
      const filmData = await clipsService.getFilm(selectedFilmId);
      if (!filmData) {
        Alert.alert('Error', 'Film not found');
        return;
      }

      // Load watch progress
      const progress = await clipsService.getWatchProgress(
        user?.id || null, 
        selectedFilmId
      );

      const clipIndex = progress?.currentClipIndex || 0;

      setFilm(filmData);
      setCurrentClipIndex(clipIndex);
      setWatchProgress(progress);
    } catch (error) {
      console.error('Error loading film:', error);
      Alert.alert('Error', 'Failed to load film');
    } finally {
      setLoading(false);
    }
  };

  const saveProgress = async (clipIndex: number, currentTime: number = 0) => {
    if (!film) return;

    const progress: WatchProgress = {
      filmId: film.id,
      currentClipIndex: clipIndex,
      currentTime,
      lastWatchedAt: new Date().toISOString(),
      userId: user?.id || '',
    };

    try {
      await clipsService.saveWatchProgress(progress);
      setWatchProgress(progress);
    } catch (error) {
      console.error('Error saving progress:', error);
    }
  };

  const handleClipChange = async (clipIndex: number) => {
    if (!film) return;

    // Check if user can access this clip
    const canAccess = clipsService.canAccessClip(film, clipIndex, false); // TODO: Check actual premium status
    
    if (!canAccess) {
      Alert.alert(
        'Premium Content',
        `This clip requires payment. You can watch the first ${film.freeClipLimit} clips for free.`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Upgrade', onPress: () => {
            // TODO: Navigate to payment/upgrade screen
            console.log('Navigate to payment screen');
          }}
        ]
      );
      return;
    }

    setCurrentClipIndex(clipIndex);
    await saveProgress(clipIndex, 0);
  };

  const handleProgress = async (clipIndex: number, currentTime: number, duration: number) => {
    // Save progress every 10 seconds
    if (Math.floor(currentTime) % 10 === 0) {
      await saveProgress(clipIndex, currentTime);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#e50914" />
        <Text style={styles.loadingText}>Loading film...</Text>
      </View>
    );
  }

  if (!film || !film.clips || film.clips.length === 0) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>No clips available</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <VerticalVideoPlayer
        clips={film.clips}
        initialClipIndex={currentClipIndex}
        onClipChange={handleClipChange}
        onProgress={handleProgress}
        filmTitle={film.title}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#fff',
    fontSize: 18,
    marginTop: 10,
  },
  errorContainer: {
    flex: 1,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    color: '#fff',
    fontSize: 18,
  },
});