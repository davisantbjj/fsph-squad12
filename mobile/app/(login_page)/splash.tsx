import React, { useEffect } from 'react';
import { StyleSheet, View, Image, SafeAreaView } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { setAuthToken } from '@/src/services/api';
import { useRouter } from 'expo-router';

export default function SplashScreen() {
  const router = useRouter();

  useEffect(() => {
    let mounted = true;
    const init = async () => {
      // tenta recuperar token para manter sessão
      try {
        const token = await AsyncStorage.getItem('user_token');
        if (!mounted) return;
        if (token) {
          // configura header e vai pra home
          setAuthToken(token);
          router.replace('/(home_page)/home_page');
          return;
        }
      } catch (e) {
        // ignore
      }

      const timer = setTimeout(() => {
        if (mounted) router.replace('/(login_page)/test');
      }, 1200);
      return () => clearTimeout(timer);
    };

    const cleanupPromise = init();
    return () => {
      mounted = false;
      if (cleanupPromise && typeof cleanupPromise.then === 'function') cleanupPromise.then(() => {});
    };
  }, [router]);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />
      
      {/* Logo Container */}
      <View style={styles.logoContainer}>
        <Image
          source={require('../../assets/images/81c182165fa853e424d84da89cf03a074c786cc3.png')}
          style={styles.logo}
          resizeMode="contain"
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#d32f2f',
  },
  logoContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logo: {
    width: 200,
    height: 200,
  },
});