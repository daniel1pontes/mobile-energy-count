import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import { apiRequest } from '../src/api';
import { useAuth } from '../src/auth';

type Appliance = {
  id: string;
  name: string;
  power_watts: string;
  quantity: number;
  daily_usage_hours: string;
  monthly_usage_days: number;
  estimated_kwh: string;
  estimated_amount: string;
};

export default function AppliancesScreen() {
  const { token } = useAuth();
  const [appliances, setAppliances] = useState<Appliance[]>([]);
  const [name, setName] = useState('');
  const [powerWatts, setPowerWatts] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [hours, setHours] = useState('');
  const [days, setDays] = useState('30');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadAppliances = useCallback(async () => {
    if (!token) return;
    setIsLoading(true);
    try {
      const response = await apiRequest<{ appliances: Appliance[] }>('/appliances', { token });
      setAppliances(response.appliances);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Não foi possível carregar os aparelhos.');
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  useEffect(() => { void loadAppliances(); }, [loadAppliances]);
  useFocusEffect(useCallback(() => { void loadAppliances(); }, [loadAppliances]));

  async function saveAppliance() {
    if (!token) return;
    setError(null);
    setIsSaving(true);
    try {
      await apiRequest(editingId ? `/appliances/${editingId}` : '/appliances', {
        method: editingId ? 'PUT' : 'POST', token,
        body: {
          name,
          powerWatts: Number(powerWatts.replace(',', '.')),
          quantity: Number(quantity),
          dailyUsageHours: Number(hours.replace(',', '.')),
          monthlyUsageDays: Number(days),
        },
      });
      setName(''); setPowerWatts(''); setHours('');
      setEditingId(null);
      await loadAppliances();
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Não foi possível salvar o aparelho.');
    } finally {
      setIsSaving(false);
    }
  }

  function confirmDelete(id: string) {
    Alert.alert('Excluir aparelho?', 'Essa ação não poderá ser desfeita.', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Excluir', style: 'destructive', onPress: () => void apiRequest(`/appliances/${id}`, { method: 'DELETE', token: token ?? undefined }).then(loadAppliances).catch((requestError) => setError(requestError.message)) },
    ]);
  }

  function editAppliance(appliance: Appliance) {
    setEditingId(appliance.id);
    setName(appliance.name);
    setPowerWatts(appliance.power_watts);
    setQuantity(String(appliance.quantity));
    setHours(appliance.daily_usage_hours);
    setDays(String(appliance.monthly_usage_days));
    setError(null);
  }

  function cancelEdit() {
    setEditingId(null);
    setName(''); setPowerWatts(''); setQuantity('1'); setHours(''); setDays('30');
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Pressable onPress={() => router.back()}><Text style={styles.back}>‹ Voltar</Text></Pressable>
        <Text style={styles.title}>Meus aparelhos</Text>
        <Text style={styles.subtitle}>Estime o consumo mensal dos equipamentos da sua residência.</Text>
        <View style={styles.formCard}>
          <Text style={styles.formTitle}>{editingId ? 'Editar aparelho' : 'Adicionar aparelho'}</Text>
          <Input label="Nome" value={name} onChangeText={setName} placeholder="Ex.: Ar-condicionado" />
          <View style={styles.row}>
            <Input label="Potência (W)" value={powerWatts} onChangeText={setPowerWatts} keyboardType="decimal-pad" />
            <Input label="Quantidade" value={quantity} onChangeText={setQuantity} keyboardType="numeric" />
          </View>
          <View style={styles.row}>
            <Input label="Horas por dia" value={hours} onChangeText={setHours} keyboardType="decimal-pad" />
            <Input label="Dias por mês" value={days} onChangeText={setDays} keyboardType="numeric" />
          </View>
          {error && <Text style={styles.error}>{error}</Text>}
          <Pressable disabled={isSaving} onPress={saveAppliance} style={[styles.button, isSaving && styles.buttonDisabled]}>
            {isSaving ? <ActivityIndicator color="#FFF" /> : <Text style={styles.buttonText}>{editingId ? 'Atualizar aparelho' : 'Salvar aparelho'}</Text>}
          </Pressable>
          {editingId && <Pressable onPress={cancelEdit}><Text style={styles.cancel}>Cancelar edição</Text></Pressable>}
        </View>
        <Text style={styles.historyTitle}>Consumo estimado</Text>
        {isLoading ? <ActivityIndicator color="#26734F" style={styles.loading} /> : appliances.length === 0 ? <Text style={styles.empty}>Ainda não há aparelhos cadastrados.</Text> : appliances.map((appliance) => (
          <Pressable key={appliance.id} onPress={() => editAppliance(appliance)} style={styles.applianceCard}>
            <View><Text style={styles.applianceName}>{appliance.name}</Text><Text style={styles.applianceDetails}>{appliance.quantity} un. · {appliance.daily_usage_hours}h/dia</Text></View>
            <View style={styles.applianceRight}>
              <Text style={styles.applianceKwh}>{Number(appliance.estimated_kwh).toFixed(1)} kWh</Text>
              <Text style={styles.applianceCost}>~ R$ {Number(appliance.estimated_amount).toFixed(2).replace('.', ',')}/mês</Text>
              <Pressable onPress={() => confirmDelete(appliance.id)}><Text style={styles.delete}>Excluir</Text></Pressable>
            </View>
          </Pressable>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

function Input({ label, ...props }: { label: string } & React.ComponentProps<typeof TextInput>) {
  return <View style={styles.field}><Text style={styles.label}>{label}</Text><TextInput accessibilityLabel={label} placeholderTextColor="#809087" style={styles.input} {...props} /></View>;
}

const styles = StyleSheet.create({
  safeArea: { backgroundColor: '#F6F8F5', flex: 1 }, content: { padding: 22, paddingBottom: 44 }, back: { color: '#26734F', fontSize: 15, fontWeight: '800' },
  title: { color: '#183B2B', fontSize: 28, fontWeight: '800', marginTop: 24 }, subtitle: { color: '#637368', fontSize: 15, lineHeight: 22, marginTop: 8 },
  formCard: { backgroundColor: '#FFF', borderRadius: 18, gap: 14, marginTop: 25, padding: 17 }, formTitle: { color: '#183B2B', fontSize: 17, fontWeight: '800' }, row: { flexDirection: 'row', gap: 12 },
  field: { flex: 1, gap: 6 }, label: { color: '#315A46', fontSize: 12, fontWeight: '800' }, input: { backgroundColor: '#F6F8F5', borderColor: '#DFE8E1', borderRadius: 12, borderWidth: 1, color: '#183B2B', fontSize: 16, padding: 13 },
  button: { alignItems: 'center', backgroundColor: '#26734F', borderRadius: 12, justifyContent: 'center', minHeight: 50 }, buttonDisabled: { opacity: 0.65 }, buttonText: { color: '#FFF', fontSize: 15, fontWeight: '800' }, error: { color: '#B9413B', fontSize: 13 },
  cancel: { color: '#637368', fontSize: 13, fontWeight: '800', textAlign: 'center' },
  historyTitle: { color: '#183B2B', fontSize: 19, fontWeight: '800', marginBottom: 12, marginTop: 28 }, loading: { marginTop: 18 }, empty: { color: '#637368', fontSize: 15 },
  applianceCard: { alignItems: 'center', backgroundColor: '#FFF', borderRadius: 15, flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10, padding: 16 }, applianceName: { color: '#183B2B', fontSize: 15, fontWeight: '800' }, applianceDetails: { color: '#637368', fontSize: 13, marginTop: 4 }, applianceRight: { alignItems: 'flex-end', gap: 5 }, applianceKwh: { color: '#26734F', fontSize: 15, fontWeight: '800' }, applianceCost: { color: '#637368', fontSize: 12 }, delete: { color: '#B9413B', fontSize: 12, fontWeight: '800' },
});
