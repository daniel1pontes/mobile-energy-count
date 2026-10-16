import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Redirect, router, useFocusEffect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import { apiRequest, type Dashboard } from '../src/api';
import { useAuth } from '../src/auth';

const generalTips = [
  'Evite deixar aparelhos em modo de espera quando não estiverem em uso.',
  'Prefira o chuveiro na posição verão e reduza o tempo de banho.',
  'Use a luz natural sempre que possível e apague lâmpadas em ambientes vazios.',
];

export default function TipsScreen() {
  const { isLoading, token, user } = useAuth();
  const [dashboard, setDashboard] = useState<Dashboard | null>(null);
  const [isFetching, setIsFetching] = useState(true);

  const loadTips = useCallback(async () => {
    if (!token) return;
    setIsFetching(true);
    try {
      setDashboard(await apiRequest<Dashboard>('/dashboard', { token }));
    } finally {
      setIsFetching(false);
    }
  }, [token]);

  useEffect(() => { void loadTips(); }, [loadTips]);
  useFocusEffect(useCallback(() => { void loadTips(); }, [loadTips]));

  if (isLoading) return <SafeAreaView style={styles.loading}><ActivityIndicator color="#26734F" size="large" /></SafeAreaView>;
  if (!user || !token) return <Redirect href="/sign-in" />;

  const personalizedTips = dashboard?.tips ?? [];

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content}>
        <Pressable onPress={() => router.back()}><Text style={styles.back}>‹ Voltar</Text></Pressable>
        <Text style={styles.title}>Consumo consciente</Text>
        <Text style={styles.subtitle}>Sugestões baseadas nos dados da sua residência e em hábitos simples.</Text>

        <Text style={styles.sectionTitle}>Para você</Text>
        {isFetching ? <ActivityIndicator color="#26734F" style={styles.spinner} /> : personalizedTips.length > 0 ? personalizedTips.map((tip, index) => (
          <TipCard key={tip} index={index} tip={tip} highlight />
        )) : <Text style={styles.empty}>Cadastre contas e aparelhos para receber recomendações personalizadas.</Text>}

        <Text style={styles.sectionTitle}>Hábitos que ajudam</Text>
        {generalTips.map((tip, index) => <TipCard key={tip} index={index} tip={tip} />)}
      </ScrollView>
    </SafeAreaView>
  );
}

function TipCard({ tip, index, highlight = false }: { tip: string; index: number; highlight?: boolean }) {
  return (
    <View style={[styles.tipCard, highlight && styles.highlightCard]}>
      <Text style={styles.icon}>{['💡', '⚡', '🌿'][index % 3]}</Text>
      <Text style={styles.tipText}>{tip}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: { backgroundColor: '#F6F8F5', flex: 1 }, loading: { alignItems: 'center', backgroundColor: '#F6F8F5', flex: 1, justifyContent: 'center' },
  content: { padding: 22, paddingBottom: 44 }, back: { color: '#26734F', fontSize: 15, fontWeight: '800' },
  title: { color: '#183B2B', fontSize: 28, fontWeight: '800', marginTop: 24 }, subtitle: { color: '#637368', fontSize: 15, lineHeight: 22, marginTop: 8 },
  sectionTitle: { color: '#183B2B', fontSize: 18, fontWeight: '800', marginBottom: 12, marginTop: 28 }, spinner: { marginTop: 20 }, empty: { color: '#637368', fontSize: 14, lineHeight: 21 },
  tipCard: { alignItems: 'flex-start', backgroundColor: '#FFFFFF', borderRadius: 16, flexDirection: 'row', gap: 12, marginBottom: 10, padding: 16 }, highlightCard: { backgroundColor: '#FFF5D8' }, icon: { fontSize: 21 }, tipText: { color: '#45564B', flex: 1, fontSize: 14, lineHeight: 21 },
});
