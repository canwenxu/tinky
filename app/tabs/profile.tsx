import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  StyleSheet, 
  Alert,
  Image,
  ScrollView,
  ActivityIndicator
} from 'react-native';
import { useAuth } from '../../contexts/AuthContext';
import * as ImagePicker from 'expo-image-picker';
import { supabase } from '../../lib/supabase';

// Type definitions
interface Film {
  id: string;
  title: string;
  description: string;
  cover_image_url: string;
}

interface Profile {
  id: string;
  profile_image_url: string | null;
}

export default function Profile() {
  const { user, signOut } = useAuth();
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [watchedFilms, setWatchedFilms] = useState<Film[]>([]);

  useEffect(() => {
    if (user) {
      loadProfile();
      loadWatchedFilms();
    }
  }, [user]);

  const loadProfile = async () => {
    try {
      // Load profile image if exists
      const { data, error } = await supabase
        .from('profiles')
        .select('profile_image_url')
        .eq('id', user?.id)
        .single();
      
      if (error) {
        console.log('Error loading profile:', error.message);
        return;
      }
      
      if (data?.profile_image_url) {
        setProfileImage(data.profile_image_url);
      }
    } catch (error) {
      console.log('Error loading profile:', error);
    }
  };

  const loadWatchedFilms = async () => {
    // This would load films that the user has been watching
    // You'll implement this later when you set up the films database
    try {
      // Placeholder for now - you can implement this later
      setWatchedFilms([]);
    } catch (error) {
      console.log('Error loading watched films:', error);
    }
  };

  const pickImage = async () => {
    // Request permission
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Required', 'Sorry, we need camera roll permissions to make this work!');
      return;
    }

    // Pick image
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1], // Square aspect ratio for circular crop
      quality: 0.8,
    });

    if (!result.canceled && result.assets && result.assets[0]) {
      uploadImage(result.assets[0]);
    }
  };

  const uploadImage = async (imageAsset: ImagePicker.ImagePickerAsset) => {
    if (!user) {
      Alert.alert('Error', 'User not authenticated');
      return;
    }

    setLoading(true);
    try {
      // Create the file name
      const fileName = `profile-${user.id}-${Date.now()}.jpg`;
      
      // Convert image to blob for upload
      const response = await fetch(imageAsset.uri);
      const blob = await response.blob();

      // Upload to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('profile-images')
        .upload(fileName, blob, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        throw uploadError;
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('profile-images')
        .getPublicUrl(fileName);

      // Update profile with image URL
      const { error: profileError } = await supabase
        .from('profiles')
        .upsert({ 
          id: user.id, 
          profile_image_url: publicUrl,
          updated_at: new Date().toISOString()
        });

      if (profileError) {
        throw profileError;
      }

      setProfileImage(publicUrl);
      Alert.alert('Success', 'Profile image updated!');
    } catch (error: any) {
      console.error('Upload error:', error);
      Alert.alert('Error', `Failed to upload image: ${error?.message || 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Sign Out', 
          style: 'destructive',
          onPress: async () => {
            const { error } = await signOut();
            if (error) {
              Alert.alert('Error', error.message || 'Failed to sign out');
            }
          }
        }
      ]
    );
  };

  if (!user) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>No user found</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={pickImage} style={styles.imageContainer}>
          {loading ? (
            <ActivityIndicator size="large" color="#e50914" />
          ) : profileImage ? (
            <Image source={{ uri: profileImage }} style={styles.profileImage} />
          ) : (
            <View style={styles.placeholderImage}>
              <Text style={styles.placeholderText}>Tap to add photo</Text>
            </View>
          )}
        </TouchableOpacity>
        
        <Text style={styles.username}>
          {user?.user_metadata?.username || 'User'}
        </Text>
        <Text style={styles.email}>{user?.email}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Watching History</Text>
        {watchedFilms.length === 0 ? (
          <Text style={styles.emptyText}>No films watched yet</Text>
        ) : (
          watchedFilms.map((film, index) => (
            <View key={film.id || index} style={styles.filmItem}>
              <Text style={styles.filmTitle}>{film.title}</Text>
            </View>
          ))
        )}
      </View>

      <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
        <Text style={styles.signOutText}>Sign Out</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  header: {
    alignItems: 'center',
    paddingTop: 60,
    paddingBottom: 30,
    paddingHorizontal: 20,
  },
  imageContainer: {
    marginBottom: 20,
  },
  profileImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 3,
    borderColor: '#e50914',
  },
  placeholderImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#1a1a1a',
    borderWidth: 2,
    borderColor: '#333',
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    color: '#666',
    fontSize: 12,
    textAlign: 'center',
  },
  username: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 5,
  },
  email: {
    fontSize: 16,
    color: '#999',
  },
  section: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 15,
  },
  emptyText: {
    color: '#666',
    fontSize: 16,
    textAlign: 'center',
    padding: 20,
  },
  filmItem: {
    padding: 15,
    backgroundColor: '#1a1a1a',
    borderRadius: 8,
    marginBottom: 10,
  },
  filmTitle: {
    color: '#fff',
    fontSize: 16,
  },
  signOutButton: {
    backgroundColor: '#333',
    margin: 20,
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  signOutText: {
    color: '#e50914',
    fontSize: 18,
    fontWeight: 'bold',
  },
  errorText: {
    color: '#fff',
    fontSize: 18,
    textAlign: 'center',
    marginTop: 50,
  },
});