import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, FlatList, Image, ActivityIndicator, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { FontAwesome5, Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import api from "@/src/services/api";

const defaultAvatar = require('../../assets/images/default-avatar.png');

const RankingItem = ({ item, index }: { item: any, index: number }) => {
    // Destaque para os top 3
    let medalColor = null;
    if (index === 0) medalColor = "#FFD700"; // Gold
    else if (index === 1) medalColor = "#C0C0C0"; // Silver
    else if (index === 2) medalColor = "#CD7F32"; // Bronze

    return (
        <View style={styles.itemContainer}>
            <View style={styles.rankContainer}>
                {medalColor ? (
                    <FontAwesome5 name="medal" size={24} color={medalColor} />
                ) : (
                    <Text style={styles.rankText}>{index + 1}º</Text>
                )}
            </View>

            <Image
                source={item.foto_perfil ? { uri: item.foto_perfil } : defaultAvatar}
                style={styles.avatar}
            />

            <View style={styles.infoContainer}>
                <Text style={styles.name}>{item.nome}</Text>
                <Text style={styles.donations}>{item.total_doacoes} doações</Text>
                {/* Barra de progresso baseada em item.progress (0-100) */}
                <View style={styles.progressBarBackground}>
                    <View style={[styles.progressBarFill, { width: `${item.progress || 0}%` }]} />
                </View>
            </View>

            {index === 0 && (
                <Ionicons name="trophy" size={24} color="#FFD700" style={{ marginRight: 10 }}/>
            )}
        </View>
    );
};

export default function RankingPage() {
  const [ranking, setRanking] = useState([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
      loadRanking();
  }, []);

  const loadRanking = async () => {
      try {
          setLoading(true);
          const response = await api.get('/api/ranking');
          setRanking(response.data);
      } catch (error) {
          console.error("Erro ao carregar ranking", error);
      } finally {
          setLoading(false);
      }
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="chevron-back" size={28} color="#333" />
        </TouchableOpacity>
        <Text style={styles.title}>Ranking de Heróis</Text>
      </View>

      <View style={styles.banner}>
          <Text style={styles.bannerText}>
              Estes são os maiores salvadores de vidas da nossa comunidade!
          </Text>
      </View>

      {loading ? (
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
              <ActivityIndicator size="large" color="#d32f2f" />
          </View>
      ) : (
        <FlatList
            data={ranking}
            renderItem={({ item, index }) => <RankingItem item={item} index={index} />}
            keyExtractor={(item: any, index) => index.toString()}
            contentContainerStyle={styles.listContent}
            ListEmptyComponent={
                <View style={{ padding: 20, alignItems: 'center' }}>
                    <Text>Ninguém no ranking ainda. Seja o primeiro!</Text>
                </View>
            }
            onRefresh={loadRanking}
            refreshing={loading}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  backButton: {
    position: 'absolute',
    left: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#d32f2f",
  },
  banner: {
      backgroundColor: '#d32f2f',
      padding: 16,
      alignItems: 'center'
  },
  bannerText: {
      color: '#fff',
      fontWeight: '600',
      textAlign: 'center'
  },
  listContent: {
      padding: 16
  },
  itemContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: '#fff',
      padding: 12,
      borderRadius: 12,
      marginBottom: 10,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.1,
      shadowRadius: 2,
      elevation: 2,
  },
  rankContainer: {
      width: 40,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 10
  },
  rankText: {
      fontSize: 18,
      fontWeight: 'bold',
      color: '#555'
  },
  avatar: {
      width: 50,
      height: 50,
      borderRadius: 25,
      marginRight: 12,
      backgroundColor: '#eee'
  },
  infoContainer: {
      flex: 1
  },
  name: {
      fontSize: 16,
      fontWeight: 'bold',
      color: '#333'
  },
  donations: {
      fontSize: 14,
      color: '#666'
  }
  ,
  progressBarBackground: {
      height: 8,
      backgroundColor: '#eee',
      borderRadius: 6,
      overflow: 'hidden',
      marginTop: 8,
      width: '60%'
  },
  progressBarFill: {
      height: '100%',
      backgroundColor: '#d32f2f'
  }
});
