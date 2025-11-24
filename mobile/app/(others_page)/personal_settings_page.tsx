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
    Modal,
    Pressable
} from 'react-native';
import { Feather, Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import api from '@/src/services/api';

export default function PersonalSettingsPage() {
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Campos do formulário
  const [nome, setNome] = useState("");
  const [telefone, setTelefone] = useState("");
  const [cpf, setCpf] = useState("");
  const [dataNascimento, setDataNascimento] = useState("");
    const [tipoSanguineo, setTipoSanguineo] = useState("");
    const [showBloodPicker, setShowBloodPicker] = useState(false);

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
          setTipoSanguineo(user.tipo_sanguineo || "");
          // Formatar data se necessário (o back retorna ISO ou string formatada?)
          // Supondo ISO YYYY-MM-DD ou TIMESTAMP
          if (user.data_nascimento) {
              const d = new Date(user.data_nascimento);
              const formatted = d.toLocaleDateString('pt-BR'); // dd/mm/aaaa
              setDataNascimento(formatted !== 'Invalid Date' ? formatted : user.data_nascimento);
          }
          setEmail(user.email || "");
      } catch (error) {
          console.error("Erro ao carregar perfil", error);
      } finally {
          setLoading(false);
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

          // Remover formatação antes de enviar
          const cleanCpf = cpf ? cpf.replace(/\D/g, '') : undefined;
          const cleanTelefone = telefone ? telefone.replace(/\D/g, '') : undefined;

          const payload: any = {
              nome_completo: nome,
              telefone: cleanTelefone,
              cpf: cleanCpf
          };
          if (tipoSanguineo) payload.tipo_sanguineo = tipoSanguineo;
          if (dataNascISO) payload.data_nascimento = dataNascISO;

          await api.put('/api/users/me', payload);

          Alert.alert("Sucesso", "Perfil atualizado com sucesso!");
          setEditing(false);
      } catch (error) {
          console.error("Erro ao salvar perfil", error);
          // Mostrar mensagem do backend quando disponível
          const msg = (error as any)?.response?.data?.error || "Não foi possível atualizar o perfil.";
          Alert.alert("Erro", msg);
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
        {editing ? (
            <TouchableOpacity onPress={handleSave} disabled={saving}>
                {saving ? <ActivityIndicator color="#d32f2f"/> : <Feather name="check" size={24} color="#d32f2f" />}
            </TouchableOpacity>
        ) : (
             <TouchableOpacity onPress={() => setEditing(true)}>
                <Feather name="edit-2" size={22} color="#d32f2f" />
            </TouchableOpacity>
        )}
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
                        onChangeText={(t) => {
                            // Formatar telefone (apenas dígitos permitidos)
                            const digits = t.replace(/\D/g, '');
                            // Aplicar máscara simples: (xx) xxxxx-xxxx ou (xx) xxxx-xxxx
                            if (digits.length <= 2) setTelefone(digits);
                            else if (digits.length <= 6) setTelefone(`(${digits.slice(0,2)}) ${digits.slice(2)}`);
                            else if (digits.length <= 10) setTelefone(`(${digits.slice(0,2)}) ${digits.slice(2,6)}-${digits.slice(6)}`);
                            else setTelefone(`(${digits.slice(0,2)}) ${digits.slice(2,7)}-${digits.slice(7,11)}`);
                        }}
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
                        onChangeText={(t) => {
                            // Aceitar apenas dígitos e aplicar máscara 000.000.000-00
                            const digits = t.replace(/\D/g, '').slice(0,11);
                            let formatted = digits;
                            if (digits.length > 9) formatted = `${digits.slice(0,3)}.${digits.slice(3,6)}.${digits.slice(6,9)}-${digits.slice(9,11)}`;
                            else if (digits.length > 6) formatted = `${digits.slice(0,3)}.${digits.slice(3,6)}.${digits.slice(6)}`;
                            else if (digits.length > 3) formatted = `${digits.slice(0,3)}.${digits.slice(3)}`;
                            setCpf(formatted);
                        }}
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
                        onChangeText={(t) => {
                            // Apenas dígitos e barras, máscara dd/mm/aaaa
                            const digits = t.replace(/\D/g, '').slice(0,8);
                            let formatted = digits;
                            if (digits.length >= 5) formatted = `${digits.slice(0,2)}/${digits.slice(2,4)}/${digits.slice(4)}`;
                            else if (digits.length >= 3) formatted = `${digits.slice(0,2)}/${digits.slice(2)}`;
                            setDataNascimento(formatted);
                        }}
                        editable={editing}
                        placeholder="dd/mm/aaaa"
                    />
                </View>

                <View style={styles.inputGroup}>
                    <Text style={styles.label}>Tipo Sanguíneo</Text>
                    <TouchableOpacity
                        style={[styles.input, !editing && styles.inputDisabled, { justifyContent: 'center' }]}
                        onPress={() => editing && setShowBloodPicker(true)}
                    >
                        <Text>{tipoSanguineo || 'Selecione o tipo sanguíneo'}</Text>
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

            <View style={styles.divider} />

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
            )}

            {/* Modal simples para seleção do tipo sanguíneo */}
            <Modal visible={showBloodPicker} transparent animationType="fade">
                <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', padding: 20 }}>
                    <View style={{ backgroundColor: '#fff', borderRadius: 8, padding: 12 }}>
                        <Text style={{ fontWeight: '700', marginBottom: 8 }}>Selecione o tipo sanguíneo</Text>
                        {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map((t) => (
                            <Pressable key={t} onPress={() => { setTipoSanguineo(t); setShowBloodPicker(false); }} style={{ paddingVertical: 10 }}>
                                <Text>{t}</Text>
                            </Pressable>
                        ))}
                        <TouchableOpacity onPress={() => setShowBloodPicker(false)} style={{ marginTop: 8, alignSelf: 'flex-end' }}>
                            <Text style={{ color: '#d32f2f' }}>Fechar</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

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
    padding: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.0,
    elevation: 2,
  },
  sectionTitle: {
      fontSize: 16,
      fontWeight: 'bold',
      marginBottom: 16,
      color: '#333'
  },
  inputGroup: {
      marginBottom: 12
  },
  label: {
      fontSize: 12,
      color: '#666',
      marginBottom: 4
  },
  input: {
      borderWidth: 1,
      borderColor: '#ddd',
      borderRadius: 8,
      padding: 10,
      fontSize: 16,
      color: '#333'
  },
  inputDisabled: {
      backgroundColor: '#f9f9f9',
      color: '#888',
      borderColor: '#eee'
  },
  settingsItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
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
  },
});