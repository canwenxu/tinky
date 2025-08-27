
/*
import { useEffect, useState } from 'react';
import { FlatList, Text, View } from 'react-native';
import { supabase } from '../lib/supabase'; // note: ../ because this file is inside /app

export default function LibraryScreen() {
  const [films, setFilms] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data, error } = await supabase
        .from('films')
        .select('id,title,description')
        .eq('is_published', true)
        .order('created_at', { ascending: false });

      if (error) console.error(error);
      setFilms(data ?? []);
      setLoading(false);
    })();
  }, []);

  if (loading) return <Text style={{ padding: 24 }}>Loading…</Text>;

  return (
    <FlatList
      data={films}
      keyExtractor={(f) => f.id}
      renderItem={({ item }) => (
        <View style={{ padding: 16 }}>
          <Text style={{ fontWeight: 'bold' }}>{item.title}</Text>
          <Text>{item.description}</Text>
        </View>
      )}
    />
  );
}
*/

// app/index.js
import { Video } from 'expo-av';
import { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { supabase } from '../lib/supabase'; // make sure this is lib/supabase.js

export default function WatchOnce() {
  const [url, setUrl] = useState(null);

  useEffect(() => {
    (async () => {
      // Use the film_id you inserted when seeding (example below)
      const FILM_ID = '00000000-0000-0000-0000-000000000123';
      const { data, error } = await supabase
        .from('clips')
        .select('hls_url')
        .eq('film_id', FILM_ID)
        .eq('idx', 0)
        .single();

      if (error) {
        console.error('Supabase error:', error);
      } else {
        setUrl(data?.hls_url ?? null);
      }
    })();
  }, []);

  if (!url) return <ActivityIndicator style={{ marginTop: 40 }} />;

  return (
    <View style={{ flex: 1 }}>
      <Video
        style={{ flex: 1 }}
        source={{ uri: url }}
        resizeMode="cover"
        shouldPlay
        useNativeControls
      />
    </View>
  );
}
