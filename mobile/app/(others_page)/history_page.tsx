import { FontAwesome5, Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { FlatList, StatusBar, StyleSheet, Text, TouchableOpacity, View, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import api from "@/src/services/api";

// Componente para exibir os itens com a estilização
const DonationItem = ({ item }: { item: any }) => {
  // Formatação de data
  const dateObj = new Date(item.date);
  const dateStr = dateObj.toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric' });
  const timeStr = dateObj.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

  // Ícone e cor baseados no tipo (origem)
  const iconName = item.origin === 'donation' ? "tint" : "calendar-alt";
  const iconColor = item.origin === 'donation' ? "#d32f2f" : "#F57C00"; // Vermelho para doação, Laranja para agendamento

  return (
    <View style={styles.card}>
      <FontAwesome5 name={iconName} size={24} color={iconColor} style={styles.cardIcon} />
      <View style={styles.cardTextContainer}>
        <Text style={styles.cardDate}>{dateStr}</Text>
        <Text style={styles.cardTime}>{item.local}</Text>
        <Text style={styles.cardType}>{item.type} às {timeStr}</Text>
      </View>
    </View>
  );
};

export default function HistoryPage() {
  const router = useRouter();
  const [historyData, setHistoryData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/history');
      setHistoryData(response.data);
    } catch (error) {
      console.error("Erro ao carregar histórico", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.parent} edges={['bottom', 'left', 'right']}>
      <StatusBar barStyle="dark-content" />
      
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={28} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Histórico de Doações</Text>
      </View>

      {loading ? (
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
              <ActivityIndicator size="large" color="#d32f2f" />
          </View>
      ) : (
        <FlatList
            data={historyData}
            renderItem={({ item }) => <DonationItem item={item} />}
            keyExtractor={(item: any) => `${item.origin}-${item.id}`}
            contentContainerStyle={styles.listContainer}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
                <View style={{ padding: 20, alignItems: 'center' }}>
                    <Text style={{ color: '#666' }}>Nenhum histórico encontrado.</Text>
                </View>
            }
            ListFooterComponent={<View style={{ height: 20 }} />}
            onRefresh={loadHistory}
            refreshing={loading}
        />
      )}

      <View style={styles.footer}>
        <TouchableOpacity 
          style={styles.scheduleButton}
          onPress={() => router.push('/(others_page)/scheduling')} 
          activeOpacity={0.9}
        >
          <Text style={styles.scheduleButtonText}>Agendar Doação</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  parent: {
    flex: 1,
    backgroundColor: '#f9f9f9',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#e6e6e6',
    position: 'relative', 
  },
  backButton: {
    marginTop: "10%",
    position: 'absolute',
    left: 16,
    right: 0,
    justifyContent: 'center',
    paddingRight: 10,
  },
  headerTitle: {
    marginTop: "10%",
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    fontFamily: 'Roboto-Bold',
  },
  listContainer: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 5,
    elevation: 3,
  },
  cardIcon: {
    marginRight: 16,
  },
  cardTextContainer: {
    flex: 1,
  },
  cardDate: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
    fontFamily: 'Roboto-Bold',
  },
  cardTime: {
    fontSize: 14,
    color: '#666',
    fontFamily: 'Roboto-Regular',
  },
  cardType: {
      fontSize: 12,
      color: '#999',
      marginTop: 4
  },
  footer: {
    padding: 20,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#e6e6e6',
  },
  scheduleButton: {
    backgroundColor: '#d32f2f',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  scheduleButtonText: {
    color: '#fff',
    fontFamily: 'Roboto-Bold',
    fontWeight: '700',
    fontSize: 16,
  },
});