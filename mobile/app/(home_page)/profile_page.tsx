import { EvilIcons, Feather, Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import {
  Alert,
  Image,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import api from '@/src/services/api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { setAuthToken } from '@/src/services/api';

const defaultAvatar = require('../../assets/images/default-avatar.png');
const appLogo = require('../../assets/images/logo.png');

export default function ProfilePage() {
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [darkModeEnabled, setDarkModeEnabled] = useState(false);
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [userInfo, setUserInfo] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);

  // Use o useRouter do Expo Router
  const router = useRouter();

  useFocusEffect(
    React.useCallback(() => {
      loadProfile();
    }, [])
  );

  const loadProfile = async () => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem('user_token');
      if (!token) {
        router.replace('/(login_page)/splash');
        return;
      }

      // Ensure axios in-memory header is set from stored token to avoid race conditions
      try { setAuthToken(token); } catch (e) { /* ignore */ }

      // Primeiro tenta mostrar dados em cache para a UX ser mais rápida
      try {
        const cached = await AsyncStorage.getItem('user_data');
        if (cached) {
          const parsed = JSON.parse(cached);
          setUserInfo(parsed);
          if (parsed.foto_perfil) setImageUri(parsed.foto_perfil);
        }
      } catch (e) {
        // ignore cache errors
      }

      // Depois busca a versão atualizada no servidor
      const response = await api.get('/api/users/me');
      setUserInfo(response.data);
      if (response.data.foto_perfil) {
        setImageUri(response.data.foto_perfil);
      }
    } catch (error) {
      console.error("Erro ao carregar perfil", error);
      const status = (error as any)?.response?.status;
      const data = (error as any)?.response?.data;
      console.warn('Erro detalhes:', { status, data });
      if (status === 401) {
        // Não desloga automaticamente ao abrir o perfil.
        // Pergunta ao usuário se deseja tentar novamente ou sair.
        Alert.alert(
          'Sessão expirada',
          'Sua sessão expirou ou o token é inválido. Deseja tentar novamente ou encerrar a sessão?',
          [
            { text: 'Tentar novamente', onPress: () => { loadProfile(); } },
            { text: 'Sair', style: 'destructive', onPress: async () => {
              try { await AsyncStorage.removeItem('user_token'); } catch (e) {}
              setAuthToken(null);
              router.replace('/(login_page)/splash');
            } }
          ],
          { cancelable: true }
        );
        return;
      }
    } finally {
      setLoading(false);
    }
  }
  const handlePickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        'Permissão necessária',
        'Precisamos da sua permissão para acessar a galeria.'
      );
      return;
    }

    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    });

    if (!result.canceled) {
      setImageUri(result.assets[0].uri);
    }
  };

  const handleLogout = async () => {
    try {
      await AsyncStorage.removeItem('user_token');
      setAuthToken(null);
      router.replace('/(login_page)/splash');
    } catch (e) {
      console.error("Erro ao fazer logout", e);
    }
  };
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffff" />
      <ScrollView
        style={styles.container}
        contentContainerStyle={{ paddingBottom: 30 }}
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Feather name="arrow-left" size={22} color="#333" />
          </TouchableOpacity>
          <Image source={appLogo} style={styles.headerLogo} />
        </View>

        <View style={styles.profileSection}>
          <TouchableOpacity onPress={handlePickImage}>
            <Image
              source={imageUri ? { uri: imageUri } : defaultAvatar}
              style={styles.avatar}
            />
          </TouchableOpacity>
          <Text style={styles.profileName}>Juliana Santos</Text>
          <TouchableOpacity onPress={handlePickImage}>
            <Text style={styles.editProfileText}>Editar Perfil</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.card}>
          {/* Nova opção: Cartão do Doador */}
          <TouchableOpacity
            style={styles.settingsItem}
            onPress={() => router.push("/card_page")}
          >
            <View style={styles.settingsItemLeft}>
              <Feather
                name="credit-card"
                size={22}
                color="#555"
                style={styles.settingsIcon}
              />
              <Text style={styles.settingsText}>Cartão do Doador</Text>
            </View>
            <EvilIcons name="chevron-right" size={30} color="#999" />
          </TouchableOpacity>

          <View style={styles.divider} />

          <View style={styles.settingsItem}>
            <View style={styles.settingsItemLeft}>
              <Ionicons
                name="notifications-outline"
                size={22}
                color="#555"
                style={styles.settingsIcon}
              />
              <Text style={styles.settingsText}>Ativar notificações</Text>
            </View>
            <Switch
              trackColor={{ false: "#767577", true: "#81b0ff" }}
              thumbColor={notificationsEnabled ? "#f4f3f4" : "#f4f3f4"}
              onValueChange={() => setNotificationsEnabled((prev) => !prev)}
              value={notificationsEnabled}
            />
          </View>
          <View style={styles.divider} />
          <TouchableOpacity
            style={styles.settingsItem}
            // Navega para /app/(home_page)/personal_settings_page.tsx
            onPress={() => router.push("/(others_page)/personal_settings_page")}
          >
            <View style={styles.settingsItemLeft}>
              <Ionicons
                name="settings-outline"
                size={22}
                color="#555"
                style={styles.settingsIcon}
              />
              <Text style={styles.settingsText}>Configurações gerais</Text>
            </View>
            <EvilIcons name="chevron-right" size={30} color="#999" />
          </TouchableOpacity>
        </View>

        <View style={styles.card}>
          <View style={styles.settingsItem}>
            <View style={styles.settingsItemLeft}>
              <Ionicons
                name="moon-outline"
                size={22}
                color="#555"
                style={styles.settingsIcon}
              />
              <Text style={styles.settingsText}>Modo escuro</Text>
            </View>
            <Switch
              trackColor={{ false: "#767577", true: "#81b0ff" }}
              thumbColor={darkModeEnabled ? "#f4f3f4" : "#f4f3f4"}
              onValueChange={() => setDarkModeEnabled((prev) => !prev)}
              value={darkModeEnabled}
            />
          </View>
          <View style={styles.divider} />
          <TouchableOpacity
            style={styles.settingsItem}
            // Navega para /app/(home_page)/suggestions_page.tsx
            onPress={() => router.push("/(others_page)/suggestions_page")}
          >
            <View style={styles.settingsItemLeft}>
              <Ionicons
                name="bulb-outline"
                size={22}
                color="#555"
                style={styles.settingsIcon}
              />
              <Text style={styles.settingsText}>Enviar sugestão</Text>
            </View>
            <EvilIcons name="chevron-right" size={30} color="#999" />
          </TouchableOpacity>
        </View>

        <View style={styles.card}>
          <TouchableOpacity style={styles.settingsItem}>
            <View style={styles.settingsItemLeft}>
              <Ionicons
                name="help-circle-outline"
                size={22}
                color="#555"
                style={styles.settingsIcon}
              />
              <Text style={styles.settingsText}>Perguntas frequentes</Text>
            </View>
            <EvilIcons name="chevron-right" size={30} color="#999" />
          </TouchableOpacity>
          <View style={styles.divider} />
          <TouchableOpacity style={styles.settingsItem}>
            <View style={styles.settingsItemLeft}>
              <Ionicons
                name="document-text-outline"
                size={22}
                color="#555"
                style={styles.settingsIcon}
              />
              <Text style={styles.settingsText}>Termos de uso</Text>
            </View>
            <EvilIcons name="chevron-right" size={30} color="#999" />
          </TouchableOpacity>
          <View style={styles.divider} />
          <TouchableOpacity style={styles.settingsItem}>
            <View style={styles.settingsItemLeft}>
              <Ionicons
                name="lock-closed-outline"
                size={22}
                color="#555"
                style={styles.settingsIcon}
              />
              <Text style={styles.settingsText}>Políticas de privacidade</Text>
            </View>
            <EvilIcons name="chevron-right" size={30} color="#999" />
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={styles.logoutButton}
          onPress={() => router.replace("/")}
        >
          <Ionicons name="log-out-outline" size={22} color="#FFFFFF" />
          <Text style={styles.logoutButtonText}>Sair do aplicativo</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#fff",
  },
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: Platform.OS === "android" ? 16 : 0,
    paddingBottom: 8,
  },
  headerLogo: {
    width: 36,
    height: 36,
    resizeMode: "contain",
  },
  profileSection: {
    alignItems: "center",
    marginVertical: 20,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 12,
    borderWidth: 3,
    borderColor: "#fff",
  },
  profileName: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#333",
  },
  editProfileText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#007AFF",
    marginTop: 6,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    marginHorizontal: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.0,
    elevation: 2,
  },
  settingsItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  settingsItemLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  settingsIcon: {
    marginRight: 16,
  },
  settingsText: {
    fontSize: 16,
    color: "#333",
  },
  divider: {
    height: 1,
    backgroundColor: "#f0f0f0",
    marginHorizontal: 16,
  },
  logoutButton: {
    backgroundColor: "#CC3333",
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 16,
    marginTop: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  logoutButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
    marginLeft: 10,
  },
})