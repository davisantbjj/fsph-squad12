import React, { useEffect, useState, useCallback } from "react";
import { 
  View, 
  Text, 
  StyleSheet, 
  Image, 
  TextInput, 
  TouchableOpacity, 
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useFocusEffect } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '@/src/services/api';

export default function PostPage() {
  const router = useRouter();
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [caption, setCaption] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [profile, setProfile] = useState<any>(null);

  // Abre a câmera automaticamente quando a tela ganha foco
  useFocusEffect(
    useCallback(() => {
      // Reseta o estado quando a tela ganha foco
      setImageUri(null);
      setCaption("");
      setIsUploading(false);
      setIsInitialized(false);
      
      // Pequeno delay para garantir que o estado foi resetado
      const timer = setTimeout(() => {
        openCamera();
      }, 100);

      return () => clearTimeout(timer);
    }, [])
  );

  // Load user profile for avatar/username
  useEffect(() => {
    let mounted = true
    const loadProfile = async () => {
      try {
        const res = await api.get('/api/users/me')
        if (!mounted) return
        setProfile(res.data)
      } catch (err) {
        console.log('Não foi possível carregar perfil no PostPage', err)
      }
    }
    loadProfile()
    return () => { mounted = false }
  }, [])

  const openCamera = async () => {
    // Evita abrir a câmera múltiplas vezes
    if (isInitialized) return;
    setIsInitialized(true);

    try {
      // Solicita permissão para usar a câmera
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert(
          'Permissão negada',
          'Precisamos de permissão para acessar a câmera.',
          [{ text: 'OK', onPress: () => router.back() }]
        );
        return;
      }

      // Abre a câmera
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setImageUri(result.assets[0].uri);
      } else {
        // Se o usuário cancelou, volta para o feed
        router.back();
      }
    } catch (error) {
      console.error('Erro ao abrir câmera:', error);
      Alert.alert('Erro', 'Não foi possível abrir a câmera.');
      router.back();
    }
  };

  const handleUpload = async () => {
    if (!imageUri) {
      Alert.alert('Erro', 'Nenhuma imagem selecionada.');
      return;
    }

    if (!caption.trim()) {
      Alert.alert('Atenção', 'Por favor, adicione uma legenda para a foto.');
      return;
    }

    setIsUploading(true);

    try {
      // Criar novo post
      const newPost = {
        id: Date.now().toString(),
        usuario: profile?.nome_completo || 'Usuário',
        avatar: profile?.foto_perfil || 'https://via.placeholder.com/40',
        imagem: imageUri,
        legenda: caption,
        likes: 0,
        liked: false,
        timestamp: Date.now(),
      };

      console.log('Novo post criado:', newPost);

      // Buscar posts existentes
      const storedPosts = await AsyncStorage.getItem('posts');
      const posts = storedPosts ? JSON.parse(storedPosts) : [];
      console.log('Posts existentes:', posts.length);

      // Adicionar novo post no início
      const updatedPosts = [newPost, ...posts];
      console.log('Total de posts após adicionar:', updatedPosts.length);

      // Salvar no AsyncStorage
      await AsyncStorage.setItem('posts', JSON.stringify(updatedPosts));
      console.log('Posts salvos no AsyncStorage com sucesso!');

      // Opcional: Enviar para o backend
      try {
        const formData = new FormData();
        const filename = imageUri.split('/').pop() || 'photo.jpg';
        const match = /\.(\w+)$/.exec(filename);
        const type = match ? `image/${match[1]}` : 'image/jpeg';

        formData.append('image', {
          uri: imageUri,
          name: filename,
          type: type,
        } as any);

        formData.append('legenda', caption);
        formData.append('usuario', 'rental_dogood');

        // Substitua pela URL real do seu backend
        // await fetch('http://SEU_BACKEND_URL/upload', {
        //   method: 'POST',
        //   body: formData,
        //   headers: {
        //     'Content-Type': 'multipart/form-data',
        //   },
        // });
      } catch (backendError) {
        console.log('Erro ao enviar para backend (opcional):', backendError);
      }

      // Limpar campos
      setImageUri(null);
      setCaption("");

      // Mostrar sucesso e navegar para o feed
      Alert.alert(
        'Sucesso!',
        'Foto publicada com sucesso!',
        [
          {
            text: 'OK',
            onPress: () => {
              // Navega para o feed (replace para evitar voltar para a tela de post)
              router.replace('/(home_page)/feed_page');
            },
          },
        ],
        { cancelable: false }
      );
    } catch (error) {
      console.error('Erro ao publicar:', error);
      Alert.alert('Erro', 'Não foi possível publicar a foto. Tente novamente.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleCancel = () => {
    Alert.alert(
      'Cancelar',
      'Deseja descartar esta foto?',
      [
        { text: 'Não', style: 'cancel' },
        {
          text: 'Sim',
          style: 'destructive',
          onPress: () => router.back(),
        },
      ]
    );
  };

  const retakePhoto = async () => {
    setImageUri(null);
    setCaption("");
    setIsInitialized(false);
    
    // Pequeno delay antes de abrir a câmera novamente
    setTimeout(() => {
      openCamera();
    }, 100);
  };

  // Se não há imagem, mostra loading
  if (!imageUri) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator size="large" color="#DC2626" />
        <Text style={styles.loadingText}>Abrindo câmera...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={handleCancel} style={styles.headerButton}>
              <Ionicons name="close" size={28} color="#333" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Nova Doação</Text>
            <View style={styles.headerButton} />
          </View>

          {/* Preview da Imagem */}
          <View style={styles.imageContainer}>
            <Image source={{ uri: imageUri }} style={styles.image} />
            <TouchableOpacity style={styles.retakeButton} onPress={retakePhoto}>
              <Ionicons name="camera-reverse" size={24} color="#FFF" />
              <Text style={styles.retakeText}>Tirar outra foto</Text>
            </TouchableOpacity>
          </View>

          {/* Campo de Legenda */}
          <View style={styles.captionContainer}>
            <TextInput
              style={styles.captionInput}
              placeholder="Adicione uma legenda..."
              placeholderTextColor="#999"
              value={caption}
              onChangeText={setCaption}
              multiline
              maxLength={500}
            />
            <Text style={styles.captionCount}>{caption.length}/500</Text>
          </View>

          {/* Botão de Publicar */}
          <TouchableOpacity
            style={[styles.publishButton, isUploading && styles.publishButtonDisabled]}
            onPress={handleUpload}
            disabled={isUploading}
          >
            {isUploading ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <>
                <Ionicons name="send" size={20} color="#FFF" />
                <Text style={styles.publishButtonText}>Publicar</Text>
              </>
            )}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F5F5",
    justifyContent: "center",
    alignItems: "center",
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: "#666",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    backgroundColor: "#FFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E5E5",
  },
  headerButton: {
    width: 40,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#333",
  },
  imageContainer: {
    position: "relative",
    width: "100%",
    aspectRatio: 4 / 3,
    backgroundColor: "#000",
  },
  image: {
    width: "100%",
    height: "100%",
    resizeMode: "contain",
  },
  retakeButton: {
    position: "absolute",
    bottom: 16,
    right: 16,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 24,
    gap: 8,
  },
  retakeText: {
    color: "#FFF",
    fontSize: 14,
    fontWeight: "600",
  },
  captionContainer: {
    backgroundColor: "#FFF",
    marginTop: 16,
    marginHorizontal: 16,
    borderRadius: 12,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  captionInput: {
    fontSize: 16,
    color: "#333",
    minHeight: 100,
    textAlignVertical: "top",
  },
  captionCount: {
    fontSize: 12,
    color: "#999",
    textAlign: "right",
    marginTop: 8,
  },
  publishButton: {
    backgroundColor: "#DC2626",
    marginHorizontal: 16,
    marginTop: 24,
    marginBottom: 32,
    paddingVertical: 16,
    borderRadius: 12,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
    shadowColor: "#DC2626",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  publishButtonDisabled: {
    backgroundColor: "#CCC",
  },
  publishButtonText: {
    color: "#FFF",
    fontSize: 18,
    fontWeight: "700",
  },
});