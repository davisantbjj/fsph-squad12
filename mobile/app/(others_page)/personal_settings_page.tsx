import React, { useState, useEffect } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  Platform,
  ScrollView,
  TextInput,
  Alert,
  ActivityIndicator,
  Image
} from 'react-native';
import { Feather, Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import api from '@/src/services/api';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function PersonalSettingsPage() {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Campos do formulário
  const [nome, setNome] = useState("");
  const [telefone, setTelefone] = useState("");
  const [cpf, setCpf] = useState("");
  const [dataNascimento, setDataNascimento] = useState("");
  const [localImageUri, setLocalImageUri] = useState<string | null>(null);

  // Campos que não vamos editar aqui mas mostramos
  const [email, setEmail] = useState("");

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/users/me');
      const user = response.data;
      setNome(user.nome_completo || "");
      setTelefone(user.telefone || "");
      setCpf(user.cpf || "");
      // Formatar data se necessário (o back retorna ISO ou string formatada?)
      // Supondo ISO YYYY-MM-DD ou TIMESTAMP
      if (user.data_nascimento) {
        const d = new Date(user.data_nascimento);
        const formatted = d.toLocaleDateString('pt-BR'); // dd/mm/aaaa
        setDataNascimento(formatted !== 'Invalid Date' ? formatted : user.data_nascimento);
      }
      setEmail(user.email || "");
      if (user.foto_perfil) setLocalImageUri(user.foto_perfil);
    } catch (error) {
      console.error("Erro ao carregar perfil", error);
    } finally {
      setLoading(false);
    }
  }

  const handlePickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permissão necessária', 'Precisamos da sua permissão para acessar a galeria.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.8,
    });

    if (!result.canceled) {
      const uri = result.assets[0].uri;
      setLocalImageUri(uri);
      // opcional: subir imediatamente
    }
  }

  const handleUploadPhoto = async () => {
    if (!localImageUri) {
      Alert.alert('Nenhuma imagem', 'Selecione uma imagem antes de enviar.');
      return;
    }

    try {
      setSaving(true);
      const form = new FormData();
      const filename = localImageUri.split('/').pop() || `photo_${Date.now()}.jpg`;
      // extrair tipo aproximado
      const match = /\.(\w+)$/.exec(filename);
      const type = match ? `image/${match[1]}` : 'image/jpeg';

      // @ts-ignore
      form.append('photo', {
        uri: localImageUri,
        name: filename,
        type,
      });

      const res = await api.post('/api/profile/photo', form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      if (res.status === 200 && res.data.user) {
        // salva cache e navega de volta
        await AsyncStorage.setItem('user_data', JSON.stringify(res.data.user));
        Alert.alert('Sucesso', 'Foto enviada com sucesso!');
        router.replace('/(home_page)/profile_page');
      } else {
        Alert.alert('Erro', 'Falha ao enviar foto.');
      }
    } catch (error) {
      console.error('Erro ao enviar foto:', error);
      Alert.alert('Erro', 'Não foi possível enviar a foto.');
    } finally {
      setSaving(false);
    }
  }

  const handleSave = async () => {
    try {
      setSaving(true);
      // Converter data de dd/mm/aaaa para YYYY-MM-DD se necessário pelo backend
      // Mas o backend pode ser flexível. Vamos mandar como string por enquanto.
      // Cuidado com formatação de data. Idealmente usar biblioteca de data.

      let dataNascISO = null;
      if (dataNascimento.includes('/')) {
        const [dia, mes, ano] = dataNascimento.split('/');
        dataNascISO = `${ano}-${mes}-${dia}`;
      }

      const payload: any = {
        nome_completo: nome,
        telefone,
        cpf
      };
      if (dataNascISO) payload.data_nascimento = dataNascISO;

      const res = await api.put('/api/users/me', payload);

      // Se o backend retornar o usuário atualizado, atualiza o cache local
      if (res?.data) {
        try {
          await AsyncStorage.setItem('user_data', JSON.stringify(res.data));
        } catch (e) {
          console.warn('Não foi possível salvar user_data localmente', e);
        }
      }

      Alert.alert("Sucesso", "Perfil atualizado com sucesso!");
      setEditing(false);
      // volta para a tela de perfil e força reload
      router.replace('/(home_page)/profile_page');
    } catch (error) {
      console.error("Erro ao salvar perfil", error);
      Alert.alert("Erro", "Não foi possível atualizar o perfil.");
    } finally {
      setSaving(false);
    }
  }

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

      {loading ? (
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
              <ActivityIndicator size="large" color="#d32f2f" />
          </View>
      ) : (
        <ScrollView style={styles.container}>
            <View style={styles.card}>
                <Text style={styles.sectionTitle}>Informações Básicas</Text>

                <View style={styles.inputGroup}>
                    <Text style={styles.label}>Nome Completo</Text>
                    <TextInput
                        style={[styles.input, !editing && styles.inputDisabled]}
                        value={nome}
                        onChangeText={setNome}
                        editable={editing}
                    />
                </View>

                <View style={styles.inputGroup}>
                    <Text style={styles.label}>E-mail (não editável)</Text>
                    <TextInput
                        style={[styles.input, styles.inputDisabled]}
                        value={email}
                        editable={false}
                    />
                </View>

                <View style={styles.inputGroup}>
                    <Text style={styles.label}>Telefone</Text>
                    <TextInput
                        style={[styles.input, !editing && styles.inputDisabled]}
                        value={telefone}
                        onChangeText={setTelefone}
                        editable={editing}
                        keyboardType="phone-pad"
                        placeholder="(xx) xxxxx-xxxx"
                    />
                </View>

                <View style={styles.inputGroup}>
                    <Text style={styles.label}>CPF</Text>
                    <TextInput
                        style={[styles.input, !editing && styles.inputDisabled]}
                        value={cpf}
                        onChangeText={setCpf}
                        editable={editing}
                        keyboardType="numeric"
                        placeholder="000.000.000-00"
                    />
                </View>

                <View style={styles.inputGroup}>
                    <Text style={styles.label}>Data de Nascimento</Text>
                    <TextInput
                        style={[styles.input, !editing && styles.inputDisabled]}
                        value={dataNascimento}
                        onChangeText={setDataNascimento}
                        editable={editing}
                        placeholder="dd/mm/aaaa"
                    />
                </View>
                  <View style={[styles.inputGroup, { alignItems: 'center' }]}>
                      <Text style={styles.label}>Foto de Perfil</Text>
                      {localImageUri ? (
                          <Image source={{ uri: localImageUri }} style={{ width: 100, height: 100, borderRadius: 50, marginVertical: 8 }} />
                      ) : (
                          <View style={{ width: 100, height: 100, borderRadius: 50, backgroundColor: '#eee', marginVertical: 8 }} />
                      )}
                      <View style={{ flexDirection: 'row', gap: 8 }}>
                          <TouchableOpacity onPress={handlePickImage} style={[styles.createAccountButton, { paddingVertical: 8, paddingHorizontal: 12, marginRight: 8 }]}> 
                              <Text style={{ color: '#fff' }}>Selecionar</Text>
                          </TouchableOpacity>
                          <TouchableOpacity onPress={handleUploadPhoto} disabled={!localImageUri || saving} style={[styles.createAccountButton, { paddingVertical: 8, paddingHorizontal: 12 }]}>
                              <Text style={{ color: '#fff' }}>{saving ? 'Enviando...' : 'Enviar'}</Text>
                          </TouchableOpacity>
                      </View>
                  </View>

                <View style={{ height: 12 }} />
                <View style={{ flexDirection: 'row', gap: 8, paddingHorizontal: 16 }}>
                    <TouchableOpacity onPress={() => setEditing(true)} style={[styles.createAccountButton, { flex: 1, paddingVertical: 12 }]}>
                        <Text style={{ color: '#fff', textAlign: 'center' }}>Editar</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={handleSave} disabled={saving} style={[styles.createAccountButton, { flex: 1, paddingVertical: 12, backgroundColor: '#4caf50' }]}>
                        <Text style={{ color: '#fff', textAlign: 'center' }}>{saving ? 'Salvando...' : 'Salvar'}</Text>
                    </TouchableOpacity>
                </View>
            </View>

            <View style={styles.card}>
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
            </View>

            <View style={styles.card}>
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
                  <Text style={[styles.settingsText, { color: '#CC3333' }]}>Excluir Conta</Text>
                </View>
                <Ionicons name="chevron-forward" size={22} color="#CC3333" />
              </TouchableOpacity>
            </View>
        </ScrollView>
      )}
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
    padding: 16,
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
  inputGroup: {
    marginBottom: 12,
  },
  label: {
    color: '#666',
    marginBottom: 6,
  },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#eee',
    borderRadius: 8,
    padding: 10,
  },
  inputDisabled: {
    backgroundColor: '#f5f5f5',
  },
  createAccountButton: {
    backgroundColor: '#d32f2f',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
  }
});
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    StatusBar,
    Platform,
    ScrollView,
    TextInput,
    Alert,
    ActivityIndicator,
    Image
} from 'react-native';
import { Feather, Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import api from '@/src/services/api';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function PersonalSettingsPage() {
    const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Campos do formulário
  const [nome, setNome] = useState("");
  const [telefone, setTelefone] = useState("");
  const [cpf, setCpf] = useState("");
  const [dataNascimento, setDataNascimento] = useState("");
    const [localImageUri, setLocalImageUri] = useState<string | null>(null);

  // Campos que não vamos editar aqui mas mostramos
  const [email, setEmail] = useState("");

  useEffect(() => {
      loadProfile();
  }, []);

  const loadProfile = async () => {
      try {
          setLoading(true);
          const response = await api.get('/api/users/me');
          const user = response.data;
          setNome(user.nome_completo || "");
          setTelefone(user.telefone || "");
          setCpf(user.cpf || "");
          // Formatar data se necessário (o back retorna ISO ou string formatada?)
          // Supondo ISO YYYY-MM-DD ou TIMESTAMP
          if (user.data_nascimento) {
              const d = new Date(user.data_nascimento);
              const formatted = d.toLocaleDateString('pt-BR'); // dd/mm/aaaa
              setDataNascimento(formatted !== 'Invalid Date' ? formatted : user.data_nascimento);
          }
          setEmail(user.email || "");
                    if (user.foto_perfil) setLocalImageUri(user.foto_perfil);
      } catch (error) {
          console.error("Erro ao carregar perfil", error);
      } finally {
          setLoading(false);
      }
  }

    const handlePickImage = async () => {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert('Permissão necessária', 'Precisamos da sua permissão para acessar a galeria.');
            return;
        }

        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            quality: 0.8,
        });

        if (!result.canceled) {
            const uri = result.assets[0].uri;
            setLocalImageUri(uri);
            // opcional: subir imediatamente
        }
    }

    const handleUploadPhoto = async () => {
        if (!localImageUri) {
            Alert.alert('Nenhuma imagem', 'Selecione uma imagem antes de enviar.');
            return;
        }

        try {
            setSaving(true);
            const form = new FormData();
            const filename = localImageUri.split('/').pop() || `photo_${Date.now()}.jpg`;
            // extrair tipo aproximado
            const match = /\.(\w+)$/.exec(filename);
            const type = match ? `image/${match[1]}` : 'image/jpeg';

            // @ts-ignore
            form.append('photo', {
                uri: localImageUri,
                name: filename,
                type,
            });

            const res = await api.post('/api/profile/photo', form, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });

            if (res.status === 200 && res.data.user) {
                // salva cache e navega de volta
                await AsyncStorage.setItem('user_data', JSON.stringify(res.data.user));
                Alert.alert('Sucesso', 'Foto enviada com sucesso!');
                router.replace('/(home_page)/profile_page');
            } else {
                Alert.alert('Erro', 'Falha ao enviar foto.');
            }
        } catch (error) {
            console.error('Erro ao enviar foto:', error);
            Alert.alert('Erro', 'Não foi possível enviar a foto.');
        } finally {
            setSaving(false);
        }
    }

  const handleSave = async () => {
      try {
          setSaving(true);
          // Converter data de dd/mm/aaaa para YYYY-MM-DD se necessário pelo backend
          // Mas o backend pode ser flexível. Vamos mandar como string por enquanto.
          // Cuidado com formatação de data. Idealmente usar biblioteca de data.

          let dataNascISO = null;
          if (dataNascimento.includes('/')) {
              const [dia, mes, ano] = dataNascimento.split('/');
              dataNascISO = `${ano}-${mes}-${dia}`;
          }

          const payload: any = {
              nome_completo: nome,
              telefone,
              cpf
          };
          if (dataNascISO) payload.data_nascimento = dataNascISO;

          const res = await api.put('/api/users/me', payload);

          // Se o backend retornar o usuário atualizado, atualiza o cache local
          if (res?.data) {
              try {
                  await AsyncStorage.setItem('user_data', JSON.stringify(res.data));
              } catch (e) {
                  console.warn('Não foi possível salvar user_data localmente', e);
              }
          }

          Alert.alert("Sucesso", "Perfil atualizado com sucesso!");
          setEditing(false);
          // volta para a tela de perfil e força reload
          router.replace('/(home_page)/profile_page');
      } catch (error) {
          console.error("Erro ao salvar perfil", error);
          Alert.alert("Erro", "Não foi possível atualizar o perfil.");
        } finally {
            setSaving(false);
          }
        }

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

          {loading ? (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
              <ActivityIndicator size="large" color="#d32f2f" />
            </View>
          ) : (
          <ScrollView style={styles.container}>
            <View style={styles.card}>
              <Text style={styles.sectionTitle}>Informações Básicas</Text>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Nome Completo</Text>
                <TextInput
                  style={[styles.input, !editing && styles.inputDisabled]}
                  value={nome}
                  onChangeText={setNome}
                  editable={editing}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>E-mail (não editável)</Text>
                <TextInput
                  style={[styles.input, styles.inputDisabled]}
                  value={email}
                  editable={false}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Telefone</Text>
                <TextInput
                  style={[styles.input, !editing && styles.inputDisabled]}
                  value={telefone}
                  onChangeText={setTelefone}
                  editable={editing}
                  keyboardType="phone-pad"
                  placeholder="(xx) xxxxx-xxxx"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>CPF</Text>
                <TextInput
                  style={[styles.input, !editing && styles.inputDisabled]}
                  value={cpf}
                  onChangeText={setCpf}
                  editable={editing}
                  keyboardType="numeric"
                  placeholder="000.000.000-00"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Data de Nascimento</Text>
                <TextInput
                  style={[styles.input, !editing && styles.inputDisabled]}
                  value={dataNascimento}
                  onChangeText={setDataNascimento}
                  editable={editing}
                  placeholder="dd/mm/aaaa"
                />
              </View>
                <View style={[styles.inputGroup, { alignItems: 'center' }]}>
                  <Text style={styles.label}>Foto de Perfil</Text>
                  {localImageUri ? (
                    <Image source={{ uri: localImageUri }} style={{ width: 100, height: 100, borderRadius: 50, marginVertical: 8 }} />
                  ) : (
                    <View style={{ width: 100, height: 100, borderRadius: 50, backgroundColor: '#eee', marginVertical: 8 }} />
                  )}
                  <View style={{ flexDirection: 'row', gap: 8 }}>
                    <TouchableOpacity onPress={handlePickImage} style={[styles.createAccountButton, { paddingVertical: 8, paddingHorizontal: 12, marginRight: 8 }]}> 
                      <Text style={{ color: '#fff' }}>Selecionar</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={handleUploadPhoto} disabled={!localImageUri || saving} style={[styles.createAccountButton, { paddingVertical: 8, paddingHorizontal: 12 }]}>
                      <Text style={{ color: '#fff' }}>{saving ? 'Enviando...' : 'Enviar'}</Text>
                    </TouchableOpacity>
                  </View>
                </View>
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