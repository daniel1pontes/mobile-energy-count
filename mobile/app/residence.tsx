import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import { apiRequest } from '../src/api';
import { useAuth } from '../src/auth';

type ResidenceResponse = {
  residence: {
    name: string;
    residents_count: number;
    city: string | null;
    state: string | null;
    energy_rate: string;
    goal_kwh: string | null;
    goal_amount: string | null;
  } | null;
};

export default function ResidenceScreen() {
  const { token } = useAuth();
  const [name, setName] = useState('Minha casa');
  const [residentsCount, setResidentsCount] = useState('1');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [energyRate, setEnergyRate] = useState('0,95');
  const [goalKwh, setGoalKwh] = useState('220');
  const [goalAmount, setGoalAmount] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadResidence() {
      if (!token) {
        setIsLoading(false);
        return;
      }
      try {
        const response = await apiRequest<ResidenceResponse>('/residence', { token });
        if (response.residence) {
          const residence = response.residence;
          setName(residence.name);
          setResidentsCount(String(residence.residents_count));
          setCity(residence.city ?? '');
          setState(residence.state ?? '');
          setEnergyRate(residence.energy_rate.replace('.', ','));
          setGoalKwh(residence.goal_kwh ?? '');
          setGoalAmount(residence.goal_amount ?? '');
        }
      } catch (requestError) {
        setError(requestError instanceof Error ? requestError.message : 'Não foi possível carregar os dados.');
      } finally {
        setIsLoading(false);
      }
    }

    void loadResidence();
  }, [token]);

  async function saveResidence() {
    if (!token) return;
    setError(null);
    setIsSaving(true);
    try {
      await apiRequest('/residence', {
        method: 'PUT',
        token,
        body: {
          name,
          residentsCount: Number(residentsCount),
          city,
          state,
          energyRate: Number(energyRate.replace(',', '.')),
          goalKwh: goalKwh ? Number(goalKwh.replace(',', '.')) : undefined,
          goalAmount: goalAmount ? Number(goalAmount.replace(',', '.')) : undefined,
        },
      });
      router.replace('/');
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Não foi possível salvar a residência.');
    } finally {
      setIsSaving(false);
    }
  }

  if (isLoading) {
    return <SafeAreaView style={styles.loading}><ActivityIndicator color="#26734F" size="large" /></SafeAreaView>;
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Pressable onPress={() => router.back()}><Text style={styles.back}>‹ Voltar</Text></Pressable>
        <Text style={styles.title}>Sua residência</Text>
        <Text style={styles.subtitle}>Essas informações tornam os cálculos de consumo mais úteis.</Text>

        <View style={styles.form}>
          <Field label="Nome da residência" value={name} onChangeText={setName} placeholder="Ex.: Minha casa" />
          <Field label="Quantidade de moradores" value={residentsCount} onChangeText={setResidentsCount} placeholder="Ex.: 3" keyboardType="numeric" />
          <Field label="Cidade" value={city} onChangeText={setCity} placeholder="Ex.: Fortaleza" />
          <Field label="UF" value={state} onChangeText={setState} placeholder="Ex.: CE" autoCapitalize="characters" />
          <Field label="Tarifa de energia (R$/kWh)" value={energyRate} onChangeText={setEnergyRate} placeholder="Ex.: 0,95" keyboardType="decimal-pad" />
          <Field label="Meta de consumo (kWh)" value={goalKwh} onChangeText={setGoalKwh} placeholder="Ex.: 220" keyboardType="decimal-pad" />
          <Field label="Meta de gasto (R$), opcional" value={goalAmount} onChangeText={setGoalAmount} placeholder="Ex.: 209,00" keyboardType="decimal-pad" />
          {error && <Text style={styles.error}>{error}</Text>}
          <Pressable disabled={isSaving} onPress={saveResidence} style={[styles.button, isSaving && styles.buttonDisabled]}>
            {isSaving ? <ActivityIndicator color="#FFF" /> : <Text style={styles.buttonText}>Salvar residência</Text>}
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function Field({ label, ...inputProps }: { label: string } & React.ComponentProps<typeof TextInput>) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <TextInput accessibilityLabel={label} placeholderTextColor="#809087" style={styles.input} {...inputProps} />
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F6F8F5' },
  loading: { alignItems: 'center', backgroundColor: '#F6F8F5', flex: 1, justifyContent: 'center' },
  content: { padding: 22, paddingBottom: 44 },
  back: { color: '#26734F', fontSize: 15, fontWeight: '800' },
  title: { color: '#183B2B', fontSize: 28, fontWeight: '800', marginTop: 24 },
  subtitle: { color: '#637368', fontSize: 15, lineHeight: 22, marginTop: 8 },
  form: { gap: 16, marginTop: 28 },
  field: { gap: 7 },
  label: { color: '#315A46', fontSize: 13, fontWeight: '800' },
  input: { backgroundColor: '#FFF', borderColor: '#DFE8E1', borderRadius: 13, borderWidth: 1, color: '#183B2B', fontSize: 16, padding: 15 },
  error: { color: '#B9413B', fontSize: 13, lineHeight: 18 },
  button: { alignItems: 'center', backgroundColor: '#26734F', borderRadius: 13, justifyContent: 'center', marginTop: 8, minHeight: 52 },
  buttonDisabled: { opacity: 0.65 },
  buttonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '800' },
});
