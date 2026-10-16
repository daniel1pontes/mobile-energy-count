import { useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import { apiRequest, type User } from '../src/api';
import { useAuth } from '../src/auth';

export default function ProfileScreen() {
  const { signOut, token, updateUser, user } = useAuth();
  const [name, setName] = useState(user?.name ?? '');
  const [email, setEmail] = useState(user?.email ?? '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [nextPassword, setNextPassword] = useState('');
  const [profileMessage, setProfileMessage] = useState<string | null>(null);
  const [passwordMessage, setPasswordMessage] = useState<string | null>(null);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isSavingPassword, setIsSavingPassword] = useState(false);

  async function saveProfile() {
    if (!token) return;
    setProfileMessage(null);
    setIsSavingProfile(true);
    try {
      const response = await apiRequest<{ user: User }>('/me', { method: 'PUT', token, body: { name, email } });
      await updateUser(response.user);
      setProfileMessage('Perfil atualizado.');
    } catch (requestError) {
      setProfileMessage(requestError instanceof Error ? requestError.message : 'Não foi possível salvar o perfil.');
    } finally {
      setIsSavingProfile(false);
    }
  }

  async function savePassword() {
    if (!token) return;
    setPasswordMessage(null);
    setIsSavingPassword(true);
    try {
      await apiRequest('/me/password', { method: 'PUT', token, body: { currentPassword, nextPassword } });
      setCurrentPassword('');
      setNextPassword('');
      setPasswordMessage('Senha atualizada.');
    } catch (requestError) {
      setPasswordMessage(requestError instanceof Error ? requestError.message : 'Não foi possível atualizar a senha.');
    } finally {
      setIsSavingPassword(false);
    }
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Pressable onPress={() => router.back()}><Text style={styles.back}>‹ Voltar</Text></Pressable>
        <Text style={styles.title}>Perfil e configurações</Text>
        <Text style={styles.subtitle}>Atualize seus dados pessoais ou altere sua senha.</Text>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Dados pessoais</Text>
          <Field label="Nome" value={name} onChangeText={setName} autoCapitalize="words" />
          <Field label="E-mail" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" />
          {profileMessage && <Text style={styles.message}>{profileMessage}</Text>}
          <Pressable disabled={isSavingProfile} onPress={saveProfile} style={[styles.button, isSavingProfile && styles.disabled]}>
            {isSavingProfile ? <ActivityIndicator color="#FFF" /> : <Text style={styles.buttonText}>Salvar perfil</Text>}
          </Pressable>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Segurança</Text>
          <Field label="Senha atual" value={currentPassword} onChangeText={setCurrentPassword} secureTextEntry />
          <Field label="Nova senha" value={nextPassword} onChangeText={setNextPassword} secureTextEntry />
          {passwordMessage && <Text style={styles.message}>{passwordMessage}</Text>}
          <Pressable disabled={isSavingPassword} onPress={savePassword} style={[styles.button, isSavingPassword && styles.disabled]}>
            {isSavingPassword ? <ActivityIndicator color="#FFF" /> : <Text style={styles.buttonText}>Atualizar senha</Text>}
          </Pressable>
        </View>

        <Pressable onPress={() => void signOut()} style={styles.signOutButton}><Text style={styles.signOutText}>Sair da conta</Text></Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

function Field({ label, ...props }: { label: string } & React.ComponentProps<typeof TextInput>) {
  return <View style={styles.field}><Text style={styles.label}>{label}</Text><TextInput accessibilityLabel={label} placeholderTextColor="#809087" style={styles.input} {...props} /></View>;
}

const styles = StyleSheet.create({
  safeArea: { backgroundColor: '#F6F8F5', flex: 1 }, content: { padding: 22, paddingBottom: 44 }, back: { color: '#26734F', fontSize: 15, fontWeight: '800' },
  title: { color: '#183B2B', fontSize: 28, fontWeight: '800', marginTop: 24 }, subtitle: { color: '#637368', fontSize: 15, lineHeight: 22, marginTop: 8 },
  card: { backgroundColor: '#FFF', borderRadius: 18, gap: 14, marginTop: 25, padding: 17 }, cardTitle: { color: '#183B2B', fontSize: 17, fontWeight: '800' }, field: { gap: 6 },
  label: { color: '#315A46', fontSize: 12, fontWeight: '800' }, input: { backgroundColor: '#F6F8F5', borderColor: '#DFE8E1', borderRadius: 12, borderWidth: 1, color: '#183B2B', fontSize: 16, padding: 13 },
  button: { alignItems: 'center', backgroundColor: '#26734F', borderRadius: 12, justifyContent: 'center', minHeight: 50 }, disabled: { opacity: 0.65 }, buttonText: { color: '#FFF', fontSize: 15, fontWeight: '800' },
  message: { color: '#315A46', fontSize: 13, fontWeight: '700' }, signOutButton: { alignItems: 'center', borderColor: '#D88E88', borderRadius: 12, borderWidth: 1, marginTop: 24, padding: 14 }, signOutText: { color: '#B9413B', fontWeight: '800' },
});
