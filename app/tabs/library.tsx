import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert,
  SafeAreaView,
  Dimensions,
} from 'react-native';
import { useAuth } from '@/contexts/AuthContext';
import { router } from 'expo-router';
import { clipsService, Film } from '@/lib/clipsService';

const { width: screenWidth } = Dimensions.get('window');
const ITEM_WIDTH = (screenWidth - 60) / 2; // 2 columns with 20px margins

interface FilmCardProps {
  film: Film;
  onPress: (film: Film) => void;
}

const FilmCard: React.FC<FilmCardProps> = ({ film, onPress }) => {
  return (
    <TouchableOpacity
      style={styles.filmCard}
      onPress={() => onPress(film)}
      activeOpacity={0.8}
    >
      <View style={styles.filmImageContainer}>
        <Image 
          source={{ uri: film.coverImageUrl }} 
          style={styles.filmImage}
          resizeMode="cover"
        />
        
        {/* Premium badge */}
        {film.isPremium && (
          <View style={styles.premiumBadge}>
            <Text style={styles.premiumText}>PREMIUM</Text>
          </View>
        )}
        
        {/* Free clips indicator */}
        {!film.isPremium && (
          <View style={styles.freeClipsBadge}>
            <Text style={styles.freeClipsText}>
              {film.freeClipLimit} FREE
            </Text>
          </View>
        )}
      </View>
      
      <View style={styles.filmInfo}>
        <Text style={styles.filmTitle} numberOfLines={2}>
          {film.title}
        </Text>
        <Text style={styles.filmDescription} numberOfLines={2}>
          {film.description}
        </Text>
        <Text style={styles.clipCount}>
          {film.totalClips} clips
        </Text>
      </View>
    </TouchableOpacity>
  );
};

export default function Library() {
  const { user } = useAuth();
  const [films, setFilms] = useState<Film[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadFilms();
  }, []);

  const loadFilms = async () => {
    try {
      setLoading(true);
      const allFilms = await clipsService.getAllFilms();
      setFilms(allFilms);
    } catch (error) {
      console.error('Error loading films:', error);
      Alert.alert('Error', 'Failed to load films');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadFilms();
    setRefreshing(false);
  };

  const handleFilmPress = (film: Film) => {
    // Navigate to watch screen with film ID
    router.push(`/tabs/watch?filmId=${film.id}`);
  };

  const renderFilmItem = ({ item }: { item: Film }) => {
    return (
      <FilmCard
        film={item}
        onPress={handleFilmPress}
      />
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyText}>No films available</Text>
      <Text style={styles.emptySubtext}>Check back later for new content!</Text>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#e50914" />
        <Text style={styles.loadingText}>Loading films...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Film Library</Text>
        <Text style={styles.headerSubtitle}>
          Choose a film to start watching
        </Text>
      </View>

      <FlatList
        data={films}
        renderItem={renderFilmItem}
        keyExtractor={(item) => item.id}
        numColumns={2}
        columnWrapperStyle={styles.row}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        onRefresh={handleRefresh}
        refreshing={refreshing}
        ListEmptyComponent={renderEmptyState}
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
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
  },
  loadingText: {
    color: '#fff',
    fontSize: 18,
    marginTop: 10,
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  headerTitle: {
    color: '#fff',
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  headerSubtitle: {
    color: '#999',
    fontSize: 16,
  },
  listContainer: {
    padding: 20,
    paddingBottom: 100, // Extra padding for tab bar
  },
  row: {
    justifyContent: 'space-between',
  },
  filmCard: {
    width: ITEM_WIDTH,
    marginBottom: 20,
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    overflow: 'hidden',
  },
  filmImageContainer: {
    position: 'relative',
    width: '100%',
    height: ITEM_WIDTH * 1.5, // 3:2 aspect ratio
  },
  filmImage: {
    width: '100%',
    height: '100%',
    backgroundColor: '#333',
  },
  premiumBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#e50914',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  premiumText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  freeClipsBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  freeClipsText: {
    color: '#4CAF50',
    fontSize: 10,
    fontWeight: 'bold',
  },
  filmInfo: {
    padding: 12,
  },
  filmTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  filmDescription: {
    color: '#999',
    fontSize: 14,
    lineHeight: 18,
    marginBottom: 8,
  },
  clipCount: {
    color: '#e50914',
    fontSize: 12,
    fontWeight: 'bold',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  emptySubtext: {
    color: '#999',
    fontSize: 16,
  },
});