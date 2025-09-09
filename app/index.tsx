import { useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { useAuth } from '@/contexts/AuthContext';
import { navigate } from '@/lib/navigation';

export default function Index() {
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading) {
      // Add a small delay to ensure the navigation system is ready
      const timer = setTimeout(() => {
        if (user) {
          // User is authenticated, redirect to main app
          navigate.toWatch();
        } else {
          // User is not authenticated, redirect to login
          navigate.toLogin();
        }
      }, 100); // 100ms delay

      return () => clearTimeout(timer);
    }
  }, [user, loading]);

  // Show loading screen while checking auth status
  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color="#e50914" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
  },
});