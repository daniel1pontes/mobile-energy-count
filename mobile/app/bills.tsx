import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import { apiRequest } from '../src/api';
import { useAuth } from '../src/auth';

type Bill = {
  id: string;
  reference_month: number;
  reference_year: number;
  consumption_kwh: string;
  total_amount: string;
  due_date: string | null;
  notes: string | null;
};

const months = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];

export default function BillsScreen() {
  const { token } = useAuth();
  const now = new Date();
  const [bills, setBills] = useState<Bill[]>([]);
  const [month, setMonth] = useState(String(now.getMonth() + 1));
  const [year, setYear] = useState(String(now.getFullYear()));
  const [consumption, setConsumption] = useState('');
  const [amount, setAmount] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [notes, setNotes] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadBills = useCallback(async () => {
    if (!token) return;
    setIsLoading(true);
    try {
      const response = await apiRequest<{ bills: Bill[] }>('/bills', { token });
      setBills(response.bills);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Não foi possível carregar as contas.');
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  useEffect(() => { void loadBills(); }, [loadBills]);
  useFocusEffect(useCallback(() => { void loadBills(); }, [loadBills]));

  async function saveBill() {
    if (!token) return;
    setError(null);
    setIsSaving(true);
    try {
      await apiRequest(editingId ? `/bills/${editingId}` : '/bills', {
        method: editingId ? 'PUT' : 'POST',
        token,
        body: {
          referenceMonth: Number(month),
          referenceYear: Number(year),
          consumptionKwh: Number(consumption.replace(',', '.')),
          totalAmount: Number(amount.replace(',', '.')),
          dueDate,
          notes,
        },
      });
      setConsumption('');
      setAmount('');
      setDueDate('');
      setNotes('');
      setEditingId(null);
      await loadBills();
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Não foi possível salvar a conta.');
    } finally {
      setIsSaving(false);
    }
  }

  function confirmDelete(id: string) {
    Alert.alert('Excluir conta?', 'Essa ação não poderá ser desfeita.', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Excluir',
        style: 'destructive',
        onPress: () => void apiRequest(`/bills/${id}`, { method: 'DELETE', token: token ?? undefined }).then(loadBills).catch((requestError) => setError(requestError.message)),
      },
    ]);
  }

  function editBill(bill: Bill) {
    setEditingId(bill.id);
    setMonth(String(bill.reference_month));
    setYear(String(bill.reference_year));
    setConsumption(bill.consumption_kwh);
    setAmount(bill.total_amount);
    setDueDate(bill.due_date ?? '');
    setNotes(bill.notes ?? '');
    setError(null);
  }

  function cancelEdit() {
    setEditingId(null);
    setConsumption('');
    setAmount('');
    setDueDate('');
    setNotes('');
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Pressable onPress={() => router.back()}><Text style={styles.back}>‹ Voltar</Text></Pressable>
        <Text style={styles.title}>Contas de energia</Text>
        <Text style={styles.subtitle}>Registre as informações da sua fatura mensal.</Text>

        <View style={styles.formCard}>
          <Text style={styles.formTitle}>{editingId ? 'Editar conta' : 'Adicionar conta'}</Text>
          <View style={styles.row}>
            <Input label="Mês" value={month} onChangeText={setMonth} keyboardType="numeric" />
            <Input label="Ano" value={year} onChangeText={setYear} keyboardType="numeric" />
          </View>
          <Input label="Consumo (kWh)" value={consumption} onChangeText={setConsumption} keyboardType="decimal-pad" />
          <Input label="Valor total (R$)" value={amount} onChangeText={setAmount} keyboardType="decimal-pad" />
          <Input label="Vencimento (AAAA-MM-DD), opcional" value={dueDate} onChangeText={setDueDate} placeholder="Ex.: 2026-10-15" autoCapitalize="none" />
          <Input label="Observação, opcional" value={notes} onChangeText={setNotes} placeholder="Ex.: leitura estimada" multiline />
          {error && <Text style={styles.error}>{error}</Text>}
          <Pressable disabled={isSaving} onPress={saveBill} style={[styles.button, isSaving && styles.buttonDisabled]}>
            {isSaving ? <ActivityIndicator color="#FFF" /> : <Text style={styles.buttonText}>{editingId ? 'Atualizar conta' : 'Salvar conta'}</Text>}
          </Pressable>
          {editingId && <Pressable onPress={cancelEdit}><Text style={styles.cancel}>Cancelar edição</Text></Pressable>}
        </View>

        <Text style={styles.historyTitle}>Histórico</Text>
        {isLoading ? <ActivityIndicator color="#26734F" style={styles.loading} /> : bills.length === 0 ? (
          <Text style={styles.empty}>Ainda não há contas cadastradas.</Text>
        ) : bills.map((bill) => (
          <Pressable key={bill.id} onPress={() => editBill(bill)} style={styles.billCard}>
            <View>
              <Text style={styles.billMonth}>{months[bill.reference_month - 1]} de {bill.reference_year}</Text>
              <Text style={styles.billConsumption}>{Number(bill.consumption_kwh).toFixed(0)} kWh</Text>
              {bill.due_date && <Text style={styles.billExtra}>Vence em {bill.due_date}</Text>}
              {bill.notes && <Text style={styles.billExtra}>{bill.notes}</Text>}
            </View>
            <View style={styles.billRight}>
              <Text style={styles.billAmount}>R$ {Number(bill.total_amount).toFixed(2).replace('.', ',')}</Text>
              <Pressable onPress={() => confirmDelete(bill.id)}><Text style={styles.delete}>Excluir</Text></Pressable>
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
  safeArea: { backgroundColor: '#F6F8F5', flex: 1 },
  content: { padding: 22, paddingBottom: 44 },
  back: { color: '#26734F', fontSize: 15, fontWeight: '800' },
  title: { color: '#183B2B', fontSize: 28, fontWeight: '800', marginTop: 24 },
  subtitle: { color: '#637368', fontSize: 15, lineHeight: 22, marginTop: 8 },
  formCard: { backgroundColor: '#FFF', borderRadius: 18, gap: 14, marginTop: 25, padding: 17 },
  formTitle: { color: '#183B2B', fontSize: 17, fontWeight: '800' },
  row: { flexDirection: 'row', gap: 12 },
  field: { flex: 1, gap: 6 },
  label: { color: '#315A46', fontSize: 12, fontWeight: '800' },
  input: { backgroundColor: '#F6F8F5', borderColor: '#DFE8E1', borderRadius: 12, borderWidth: 1, color: '#183B2B', fontSize: 16, padding: 13 },
  button: { alignItems: 'center', backgroundColor: '#26734F', borderRadius: 12, justifyContent: 'center', minHeight: 50 },
  buttonDisabled: { opacity: 0.65 },
  buttonText: { color: '#FFF', fontSize: 15, fontWeight: '800' },
  error: { color: '#B9413B', fontSize: 13 },
  cancel: { color: '#637368', fontSize: 13, fontWeight: '800', textAlign: 'center' },
  historyTitle: { color: '#183B2B', fontSize: 19, fontWeight: '800', marginBottom: 12, marginTop: 28 },
  loading: { marginTop: 18 },
  empty: { color: '#637368', fontSize: 15 },
  billCard: { alignItems: 'center', backgroundColor: '#FFF', borderRadius: 15, flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10, padding: 16 },
  billMonth: { color: '#183B2B', fontSize: 15, fontWeight: '800', textTransform: 'capitalize' },
  billConsumption: { color: '#637368', fontSize: 13, marginTop: 4 },
  billExtra: { color: '#637368', fontSize: 12, marginTop: 3 },
  billRight: { alignItems: 'flex-end', gap: 7 },
  billAmount: { color: '#183B2B', fontSize: 15, fontWeight: '800' },
  delete: { color: '#B9413B', fontSize: 12, fontWeight: '800' },
});
