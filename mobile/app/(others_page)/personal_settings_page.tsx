import React from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  Platform,
  ScrollView,
} from 'react-native';
import { Feather, Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';

export default function PersonalSettingsPage() {
  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.replace('/(home_page)/profile_page')}>
          <Feather name="arrow-left" size={22} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Configurações Pessoais</Text>
        <View style={{ width: 28 }} />
      </View>

      <ScrollView style={styles.container}>
        <View style={styles.card}>
          <TouchableOpacity style={styles.settingsItem}>
            <View style={styles.settingsItemLeft}>
              <Ionicons
                name="person-outline"
                size={22}
                color="#555"
                style={styles.settingsIcon}
              />
              <Text style={styles.settingsText}>Editar Informações</Text>
            </View>
            <Ionicons name="chevron-forward" size={22} color="#999" />
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
              <Text style={styles.settingsText}>Alterar Senha</Text>
            </View>
            <Ionicons name="chevron-forward" size={22} color="#999" />
          </TouchableOpacity>
          <View style={styles.divider} />
          <TouchableOpacity style={styles.settingsItem}>
            <View style={styles.settingsItemLeft}>
              <Ionicons
                name="shield-outline"
                size={22}
                color="#555"
                style={styles.settingsIcon}
              />
              <Text style={styles.settingsText}>Privacidade da Conta</Text>
            </View>
            <Ionicons name="chevron-forward" size={22} color="#999" />
          </TouchableOpacity>
        </View>

        <View style={styles.card}>
          <TouchableOpacity style={styles.settingsItem}>
            <View style={styles.settingsItemLeft}>
              <Ionicons
                name="trash-outline"
                size={22}
                color="#CC3333"
                style={styles.settingsIcon}
              />
              <Text style={[styles.settingsText, { color: '#CC3333' }]}>
                Excluir Conta
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={22} color="#CC3333" />
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#fff',
  },
  container: {
    flex: 1,
    paddingTop: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'android' ? 16 : 0,
    paddingBottom: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginHorizontal: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.0,
    elevation: 2,
  },
  settingsItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  settingsItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  settingsIcon: {
    marginRight: 16,
  },
  settingsText: {
    fontSize: 16,
    color: '#333',
  },
  divider: {
    height: 1,
    backgroundColor: '#f0f0f0',
    marginHorizontal: 16,
  },
});