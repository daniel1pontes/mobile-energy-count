import { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import { apiRequest } from '../src/api';
import { useAuth } from '../src/auth';

export default function SignInScreen() {
  const { signIn, signUp } = useAuth();
  const [isCreatingAccount, setIsCreatingAccount] = useState(false);
  const [isRecoveringPassword, setIsRecoveringPassword] = useState(false);
  const [hasRequestedResetCode, setHasRequestedResetCode] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirmation, setPasswordConfirmation] = useState('');
  const [resetCode, setResetCode] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    setError(null);
    setIsSubmitting(true);
    try {
      if (isRecoveringPassword) {
        if (!hasRequestedResetCode) {
          await apiRequest('/auth/password-reset/request', { method: 'POST', body: { email } });
          setHasRequestedResetCode(true);
          setError('Se houver uma conta com esse e-mail, enviamos um código. Consulte a caixa local do Mailpit.');
          return;
        }
        if (password !== passwordConfirmation) {
          throw new Error('A confirmação da nova senha não confere.');
        }
        await apiRequest('/auth/password-reset/confirm', { method: 'POST', body: { email, code: resetCode, nextPassword: password } });
        setIsRecoveringPassword(false);
        setResetCode('');
        setPassword('');
        setPasswordConfirmation('');
        setError('Senha redefinida. Entre com sua nova senha.');
        return;
      }
      if (isCreatingAccount) {
        if (password !== passwordConfirmation) {
          throw new Error('A confirmação da senha não confere.');
        }
        await signUp(name, email, password);
      } else {
        await signIn(email, password);
      }
      router.replace('/');
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Não foi possível continuar.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.content}>
        <View style={styles.brandMark}><Text style={styles.brandMarkText}>⚡</Text></View>
        <Text style={styles.title}>Energia em Dia</Text>
        <Text style={styles.subtitle}>
          {isCreatingAccount
            ? 'Crie sua conta para acompanhar o consumo da sua casa.'
            : 'Entre para acompanhar seu consumo de energia.'}
        </Text>

        <View style={styles.form}>
          {isCreatingAccount && (
            <TextInput
              accessibilityLabel="Seu nome"
              autoCapitalize="words"
              onChangeText={setName}
              placeholder="Seu nome"
              placeholderTextColor="#809087"
              style={styles.input}
              value={name}
            />
          )}
          <TextInput
            accessibilityLabel="E-mail"
            autoCapitalize="none"
            autoComplete="email"
            keyboardType="email-address"
            onChangeText={setEmail}
            placeholder="E-mail"
            placeholderTextColor="#809087"
            style={styles.input}
            value={email}
          />
          <TextInput
            accessibilityLabel={isRecoveringPassword ? 'Nova senha' : 'Senha'}
            autoComplete={isCreatingAccount || isRecoveringPassword ? 'new-password' : 'current-password'}
            onChangeText={setPassword}
            placeholder="Senha"
            placeholderTextColor="#809087"
            secureTextEntry
            style={styles.input}
            value={password}
          />
          {(isCreatingAccount || (isRecoveringPassword && hasRequestedResetCode)) && (
            <TextInput
              accessibilityLabel="Confirme a senha"
              autoComplete="new-password"
              onChangeText={setPasswordConfirmation}
              placeholder="Confirme a senha"
              placeholderTextColor="#809087"
              secureTextEntry
              style={styles.input}
              value={passwordConfirmation}
            />
          )}
          {isRecoveringPassword && hasRequestedResetCode && (
            <TextInput
              accessibilityLabel="Código recebido por e-mail"
              autoCapitalize="none"
              keyboardType="numeric"
              onChangeText={setResetCode}
              placeholder="Código recebido por e-mail"
              placeholderTextColor="#809087"
              style={styles.input}
              value={resetCode}
            />
          )}
          {error && <Text style={styles.error}>{error}</Text>}
          <Pressable disabled={isSubmitting} onPress={submit} style={[styles.button, isSubmitting && styles.buttonDisabled]}>
            {isSubmitting ? <ActivityIndicator color="#FFF" /> : <Text style={styles.buttonText}>{isRecoveringPassword ? (hasRequestedResetCode ? 'Redefinir senha' : 'Enviar código') : isCreatingAccount ? 'Criar conta' : 'Entrar'}</Text>}
          </Pressable>
        </View>

        {!isRecoveringPassword && <Pressable onPress={() => { setError(null); setIsCreatingAccount((value) => !value); setPasswordConfirmation(''); }}>
          <Text style={styles.switchText}>
            {isCreatingAccount ? 'Já possui uma conta? Entrar' : 'Ainda não tem uma conta? Criar agora'}
          </Text>
        </Pressable>}
        {!isCreatingAccount && <Pressable onPress={() => { setError(null); setIsRecoveringPassword((value) => !value); setHasRequestedResetCode(false); setPassword(''); setPasswordConfirmation(''); setResetCode(''); }}>
          <Text style={styles.recoveryText}>{isRecoveringPassword ? 'Voltar para entrar' : 'Esqueci minha senha'}</Text>
        </Pressable>}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F6F8F5' },
  content: { flex: 1, justifyContent: 'center', padding: 28 },
  brandMark: { alignItems: 'center', backgroundColor: '#D9F0E1', borderRadius: 22, height: 64, justifyContent: 'center', width: 64 },
  brandMarkText: { fontSize: 30 },
  title: { color: '#183B2B', fontSize: 30, fontWeight: '800', marginTop: 24 },
  subtitle: { color: '#637368', fontSize: 16, lineHeight: 23, marginTop: 8 },
  form: { gap: 12, marginTop: 34 },
  input: { backgroundColor: '#FFFFFF', borderColor: '#DFE8E1', borderRadius: 13, borderWidth: 1, color: '#183B2B', fontSize: 16, padding: 15 },
  button: { alignItems: 'center', backgroundColor: '#26734F', borderRadius: 13, marginTop: 6, minHeight: 52, justifyContent: 'center' },
  buttonDisabled: { opacity: 0.65 },
  buttonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '800' },
  error: { color: '#B9413B', fontSize: 13, lineHeight: 18 },
  switchText: { color: '#26734F', fontSize: 14, fontWeight: '700', marginTop: 25, textAlign: 'center' },
  recoveryText: { color: '#637368', fontSize: 14, fontWeight: '700', marginTop: 14, textAlign: 'center' },
});
