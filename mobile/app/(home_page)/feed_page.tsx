import React, { useState, useEffect, useCallback } from "react";
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  Image, 
  TouchableOpacity,
  RefreshControl,
  Alert,
  Modal,
  Pressable,
  StatusBar
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from 'expo-router';
import { ThemedText } from "@/components/ThemedText";

interface Post {
  id: string;
  usuario: string;
  avatar: string;
  imagem: string;
  legenda: string;
  likes: number;
  liked: boolean;
  timestamp: number;
}

export default function FeedPage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [userInfo, setUserInfo] = React.useState<any>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null);
  const [showOptionsModal, setShowOptionsModal] = useState(false);

  // Recarrega os posts sempre que a tela ganha foco
  useFocusEffect(
    useCallback(() => {
      loadPosts();
    }, [])
  );

  const loadPosts = async () => {
    try {
      const storedPosts = await AsyncStorage.getItem('posts');
      console.log('Posts carregados do AsyncStorage:', storedPosts);
      if (storedPosts) {
        const parsedPosts = JSON.parse(storedPosts);
        console.log('Total de posts:', parsedPosts.length);
        setPosts(parsedPosts);
      } else {
        console.log('Nenhum post encontrado no AsyncStorage');
        setPosts([]);
      }
    } catch (error) {
      console.error('Erro ao carregar posts:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadPosts();
    setRefreshing(false);
  };

  const openOptionsMenu = (postId: string) => {
    setSelectedPostId(postId);
    setShowOptionsModal(true);
  };

  const closeOptionsMenu = () => {
    setSelectedPostId(null);
    setShowOptionsModal(false);
  };

  const deletePost = async () => {
    if (!selectedPostId) return;

    Alert.alert(
      'Excluir postagem',
      'Tem certeza que deseja excluir esta postagem?',
      [
        {
          text: 'Cancelar',
          style: 'cancel',
          onPress: closeOptionsMenu,
        },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: async () => {
            try {
              const updatedPosts = posts.filter(post => post.id !== selectedPostId);
              setPosts(updatedPosts);
              await AsyncStorage.setItem('posts', JSON.stringify(updatedPosts));
              closeOptionsMenu();
              Alert.alert('Sucesso', 'Postagem excluída com sucesso!');
            } catch (error) {
              console.error('Erro ao excluir post:', error);
              Alert.alert('Erro', 'Não foi possível excluir a postagem.');
            }
          },
        },
      ]
    );
  };

  const toggleLike = async (postId: string) => {
    const updatedPosts = posts.map(post => {
      if (post.id === postId) {
        return {
          ...post,
          liked: !post.liked,
          likes: post.liked ? post.likes - 1 : post.likes + 1
        };
      }
      return post;
    });
    
    setPosts(updatedPosts);
    
    try {
      await AsyncStorage.setItem('posts', JSON.stringify(updatedPosts));
    } catch (error) {
      console.error('Erro ao salvar like:', error);
    }
  };

  useFocusEffect(
      React.useCallback(() => {
        loadData();
      }, [])
    );
    
  const loadData = async () => {
    try {
      setLoading(true)
      // 1. Carregar dados do usuário
      // Tenta pegar do storage primeiro para ser mais rápido, mas idealmente valida token
      const token = await AsyncStorage.getItem("user_token")
      if (!token) {
        // Quando não houver token, redirecionar para splash para recarregar todo o app
        router.replace("/(login_page)/splash")
        return
      }

      // Busca perfil
      try {
        // Backend mount: app.use("/api/users", userRoutes); -> Rota: /me
        const profileRes = await api.get("/api/users/me")
        setUserInfo(profileRes.data)
      } catch (e) {
        console.log("Erro ao carregar perfil", e)
      }
    } catch (error) {
      console.error("Erro geral no loadData:", error)
    } finally {
      setLoading(false);
    }
  };

  const renderPost = (post: Post) => (
    <View key={post.id} style={styles.postCard}>
      {/* Header do Post */}
      <View style={styles.postHeader}>
        <View style={styles.userInfo}>
          <Image
            source={{ uri: post.avatar || "https://via.placeholder.com/40" }}
            style={styles.avatar}
          />
          <ThemedText style={styles.username}>
            {userInfo?.nome_completo || "Doador"}
          </ThemedText>
        </View>
        <TouchableOpacity onPress={() => openOptionsMenu(post.id)}>
          <Ionicons name="ellipsis-vertical" size={20} color="#666" />
        </TouchableOpacity>
      </View>

      {/* Imagem do Post */}
      <Image
        source={{ uri: post.imagem }}
        style={styles.postImage}
        resizeMode="cover"
      />

      {/* Ações (Like) */}
      <View style={styles.actionsContainer}>
        <TouchableOpacity
          onPress={() => toggleLike(post.id)}
          style={styles.actionButton}
        >
          <Ionicons
            name={post.liked ? "heart" : "heart-outline"}
            size={28}
            color={post.liked ? "#DC2626" : "#333"}
          />
        </TouchableOpacity>
      </View>

      {/* Legenda */}
      <View style={styles.captionContainer}>
        <Text style={styles.likesText}>{post.likes} curtidas</Text>
        <Text style={styles.caption}>
          <ThemedText style={styles.username}>
            {userInfo?.nome_completo || "Doador"} {" "}
          </ThemedText>
          {post.legenda}
        </Text>
      </View>
    </View>
  )

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Feed</Text>
        <TouchableOpacity>
          <Ionicons name="notifications-outline" size={28} color="#333" />
        </TouchableOpacity>
      </View>

      {/* Feed */}
      <ScrollView 
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {posts.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="images-outline" size={64} color="#CCC" />
            <Text style={styles.emptyText}>Nenhuma postagem ainda</Text>
            <Text style={styles.emptySubtext}>Compartilhe sua primeira doação!</Text>
          </View>
        ) : (
          posts.map(post => renderPost(post))
        )}
      </ScrollView>

      {/* Modal de Opções */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={showOptionsModal}
        onRequestClose={closeOptionsMenu}
      >
        <Pressable style={styles.modalOverlay} onPress={closeOptionsMenu}>
          <View style={styles.modalContent}>
            <TouchableOpacity 
              style={styles.modalOption}
              onPress={deletePost}
            >
              <Ionicons name="trash-outline" size={24} color="#DC2626" />
              <Text style={styles.modalOptionTextDanger}>Excluir postagem</Text>
            </TouchableOpacity>
            
            <View style={styles.modalDivider} />
            
            <TouchableOpacity 
              style={styles.modalOption}
              onPress={closeOptionsMenu}
            >
              <Ionicons name="close-outline" size={24} color="#666" />
              <Text style={styles.modalOptionText}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFF",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#FFF",
    borderBottomWidth: 1,
    borderBottomColor: "#fff",
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "#333",
  },
  scrollView: {
    flex: 1,
    backgroundColor: "#FFF",
  },
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 100,
    backgroundColor: "#FFF",
  },
  emptyText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#666",
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: "#999",
    marginTop: 8,
  },
  postCard: {
    backgroundColor: "#FFF",
    marginBottom: 16,
  },
  postHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  userInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#E5E5E5",
  },
  username: {
    fontSize: 14,
    fontWeight: "700",
    color: "#333",
  },
  postImage: {
    width: "100%",
    aspectRatio: 1,
    backgroundColor: "#E5E5E5",
  },
  actionsContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  actionButton: {
    padding: 4,
  },
  captionContainer: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 16,
  },
  likesText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#333",
    marginBottom: 4,
  },
  caption: {
    fontSize: 14,
    color: "#333",
    lineHeight: 20,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#FFF",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 34,
  },
  modalOption: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 18,
    paddingHorizontal: 24,
    gap: 16,
  },
  modalOptionText: {
    fontSize: 16,
    color: "#333",
    fontWeight: "600",
  },
  modalOptionTextDanger: {
    fontSize: 16,
    color: "#DC2626",
    fontWeight: "600",
  },
  modalDivider: {
    height: 1,
    backgroundColor: "#E5E5E5",
    marginHorizontal: 24,
  },
});

function setLoading(arg0: boolean) {
  throw new Error("Function not implemented.");
}
function setUserInfo(data: any) {
  throw new Error("Function not implemented.");
}

