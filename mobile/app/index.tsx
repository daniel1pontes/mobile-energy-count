import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Redirect, router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import { apiRequest, type Dashboard } from '../src/api';
import { useAuth } from '../src/auth';

type ApiStatus = 'checking' | 'online' | 'offline';

export default function DashboardScreen() {
  const { isLoading, token, user } = useAuth();
  const [apiStatus, setApiStatus] = useState<ApiStatus>('checking');
  const [dashboard, setDashboard] = useState<Dashboard | null>(null);

  useEffect(() => {
    const activeToken = token;
    if (!activeToken) {
      return;
    }

    const controller = new AbortController();

    async function loadDashboard() {
      try {
        const data = await apiRequest<Dashboard>('/dashboard', {
          signal: controller.signal,
          token: activeToken ?? undefined,
        });
        setDashboard(data);
        setApiStatus('online');
      } catch {
        setApiStatus('offline');
      }
    }

    void loadDashboard();
    return () => controller.abort();
  }, [token]);

  if (isLoading) {
    return (
      <SafeAreaView style={styles.loadingScreen}>
        <ActivityIndicator color="#26734F" size="large" />
      </SafeAreaView>
    );
  }

  if (!user || !token) {
    return <Redirect href="/sign-in" />;
  }

  const currentKwh = Number(dashboard?.currentBill?.consumption_kwh ?? 0);
  const currentAmount = Number(dashboard?.currentBill?.total_amount ?? 0);
  const goalKwh = Number(dashboard?.residence?.goal_kwh ?? 0);
  const goalAmount = Number(dashboard?.residence?.goal_amount ?? 0);
  const delta = dashboard?.previousBill
    ? Math.round(((currentKwh - Number(dashboard.previousBill.consumption_kwh)) / Number(dashboard.previousBill.consumption_kwh)) * 100)
    : null;
  const progress = goalKwh > 0 ? `${Math.min((currentKwh / goalKwh) * 100, 100)}%` : '0%';
  const goalRatio = goalKwh > 0 ? currentKwh / goalKwh : 0;
  const goalStyle = goalRatio > 1 ? styles.progressExceeded : goalRatio >= 0.8 ? styles.progressWarning : styles.progressValue;
  const tip = dashboard?.tips[0] ?? 'Cadastre a residência e a primeira conta para receber recomendações.';
  const history = dashboard?.history ?? [];
  const historyMaximum = Math.max(...history.map((entry) => Number(entry.consumption_kwh)), 1);

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Olá, {user.name.split(' ')[0]}! 👋</Text>
            <Text style={styles.heading}>Energia em Dia</Text>
          </View>
          <View
            accessibilityLabel={`API ${apiStatus}`}
            style={[
              styles.status,
              apiStatus === 'online' ? styles.statusOnline : styles.statusOffline,
            ]}
          >
            {apiStatus === 'checking' ? (
              <ActivityIndicator color="#315A46" size="small" />
            ) : (
              <View style={styles.statusDot} />
            )}
            <Text style={styles.statusText}>
              {apiStatus === 'checking'
                ? 'Conectando'
                : apiStatus === 'online'
                  ? 'API conectada'
                  : 'Modo local'}
            </Text>
          </View>
        </View>

        <View style={styles.heroCard}>
          <Text style={styles.cardEyebrow}>CONSUMO DESTE MÊS</Text>
          <View style={styles.heroValueRow}>
          <Text style={styles.heroValue}>{currentKwh || '--'}</Text>
            <Text style={styles.heroUnit}>kWh</Text>
          </View>
          <Text style={styles.heroCaption}>
            {goalKwh > 0
              ? currentKwh > goalKwh
                ? `${Math.round(currentKwh - goalKwh)} kWh acima da sua meta mensal`
                : `${Math.round(goalKwh - currentKwh)} kWh restantes para a meta`
              : 'Defina uma meta para acompanhar sua evolução'}
          </Text>
          <View style={styles.progressTrack}>
            <View style={[goalStyle, { width: progress }]} />
          </View>
          <View style={styles.progressLabels}>
            <Text style={styles.progressLabel}>0 kWh</Text>
            <Text style={styles.progressLabel}>{goalKwh > 0 ? `Meta: ${goalKwh} kWh` : 'Sem meta definida'}</Text>
          </View>
        </View>

        <View style={styles.metrics}>
          <MetricCard label="Conta registrada" value={currentAmount ? `R$ ${currentAmount.toFixed(2).replace('.', ',')}` : '--'} detail="Mês atual" />
          <MetricCard label="Variação" value={delta === null ? '--' : `${delta > 0 ? '+' : ''}${delta}%`} detail="vs. mês anterior" warning={(delta ?? 0) > 0} />
        </View>
        {goalAmount > 0 && <Text style={styles.goalAmount}>Meta de gasto: R$ {goalAmount.toFixed(2).replace('.', ',')} · {currentAmount > goalAmount ? 'ultrapassada' : 'dentro do planejado'}</Text>}

        <View style={styles.shortcuts}>
          <Pressable onPress={() => router.push('/bills')} style={styles.shortcut}>
            <Text style={styles.shortcutIcon}>▣</Text>
            <Text style={styles.shortcutText}>Contas</Text>
          </Pressable>
          <Pressable onPress={() => router.push('/appliances')} style={styles.shortcut}>
            <Text style={styles.shortcutIcon}>⌁</Text>
            <Text style={styles.shortcutText}>Aparelhos</Text>
          </Pressable>
          <Pressable onPress={() => router.push('/residence')} style={styles.shortcut}>
            <Text style={styles.shortcutIcon}>⌂</Text>
            <Text style={styles.shortcutText}>Residência</Text>
          </Pressable>
        </View>

        {history.length > 0 && (
          <View style={styles.historyCard}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Últimos consumos</Text>
              <Pressable onPress={() => router.push('/bills')}><Text style={styles.sectionAction}>Ver contas</Text></Pressable>
            </View>
            <View style={styles.chart}>
              {history.slice().reverse().map((entry) => {
                const height = Math.max((Number(entry.consumption_kwh) / historyMaximum) * 96, 12);
                return (
                  <View key={`${entry.reference_year}-${entry.reference_month}`} style={styles.chartColumn}>
                    <Text style={styles.chartValue}>{Math.round(Number(entry.consumption_kwh))}</Text>
                    <View style={styles.chartTrack}><View style={[styles.chartBar, { height }]} /></View>
                    <Text style={styles.chartLabel}>{String(entry.reference_month).padStart(2, '0')}/{String(entry.reference_year).slice(-2)}</Text>
                  </View>
                );
              })}
            </View>
          </View>
        )}

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Resumo</Text>
          <Pressable onPress={() => router.push('/residence')}><Text style={styles.sectionAction}>Configurar</Text></Pressable>
        </View>

        <View style={styles.summaryCard}>
          <Text style={styles.summaryText}>
            {tip}
          </Text>
          <Pressable onPress={() => router.push('/residence')} style={styles.primaryButton}>
            <Text style={styles.primaryButtonText}>{dashboard?.residence ? 'Atualizar residência' : 'Cadastrar residência'}</Text>
          </Pressable>
        </View>

        <View style={styles.tipCard}>
          <Text style={styles.tipEmoji}>💡</Text>
          <View style={styles.tipContent}>
          <Pressable onPress={() => router.push('/tips')}><Text style={styles.tipTitle}>Dica de economia</Text></Pressable>
            <Text style={styles.tipText}>
              {dashboard?.applianceEstimateKwh
                ? `Os aparelhos cadastrados consomem aproximadamente ${dashboard.applianceEstimateKwh.toFixed(1)} kWh por mês.`
                : 'Cadastre aparelhos para entender quais hábitos têm maior impacto no consumo.'}
            </Text>
          </View>
        </View>
        <Pressable onPress={() => router.push('/profile')}><Text style={styles.signOut}>Perfil e configurações</Text></Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

function MetricCard({
  label,
  value,
  detail,
  warning = false,
}: {
  label: string;
  value: string;
  detail: string;
  warning?: boolean;
}) {
  return (
    <View style={styles.metricCard}>
      <Text style={styles.metricLabel}>{label}</Text>
      <Text style={[styles.metricValue, warning && styles.warningValue]}>{value}</Text>
      <Text style={styles.metricDetail}>{detail}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  loadingScreen: { alignItems: 'center', backgroundColor: '#F6F8F5', flex: 1, justifyContent: 'center' },
  safeArea: { flex: 1, backgroundColor: '#F6F8F5' },
  content: { padding: 20, paddingBottom: 36, gap: 18 },
  header: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  greeting: { color: '#537061', fontSize: 15, fontWeight: '600' },
  heading: { color: '#183B2B', fontSize: 28, fontWeight: '800', marginTop: 2 },
  status: {
    alignItems: 'center',
    borderRadius: 999,
    flexDirection: 'row',
    gap: 6,
    marginTop: 8,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  statusOnline: { backgroundColor: '#E0F4E8' },
  statusOffline: { backgroundColor: '#F0F1EF' },
  statusDot: { backgroundColor: '#3D9864', borderRadius: 4, height: 8, width: 8 },
  statusText: { color: '#315A46', fontSize: 12, fontWeight: '700' },
  heroCard: { backgroundColor: '#1D5A42', borderRadius: 24, padding: 22 },
  cardEyebrow: { color: '#B9D8C6', fontSize: 12, fontWeight: '800', letterSpacing: 1 },
  heroValueRow: { alignItems: 'baseline', flexDirection: 'row', gap: 7, marginTop: 10 },
  heroValue: { color: '#FFFFFF', fontSize: 54, fontWeight: '800', letterSpacing: -2 },
  heroUnit: { color: '#D7E9DE', fontSize: 17, fontWeight: '700' },
  heroCaption: { color: '#D7E9DE', fontSize: 14, marginTop: 4 },
  progressTrack: { backgroundColor: '#437A64', borderRadius: 5, height: 10, marginTop: 22, overflow: 'hidden' },
  progressValue: { backgroundColor: '#62B783', borderRadius: 5, height: '100%' },
  progressWarning: { backgroundColor: '#F3C969', borderRadius: 5, height: '100%' },
  progressExceeded: { backgroundColor: '#E07169', borderRadius: 5, height: '100%' },
  progressLabels: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 7 },
  progressLabel: { color: '#B9D8C6', fontSize: 12 },
  metrics: { flexDirection: 'row', gap: 12 },
  goalAmount: { color: '#637368', fontSize: 13, fontWeight: '700', textAlign: 'center' },
  metricCard: { backgroundColor: '#FFFFFF', borderRadius: 18, flex: 1, padding: 16 },
  metricLabel: { color: '#637368', fontSize: 12, fontWeight: '700' },
  metricValue: { color: '#183B2B', fontSize: 21, fontWeight: '800', marginTop: 9 },
  warningValue: { color: '#BF6C23' },
  metricDetail: { color: '#809087', fontSize: 12, marginTop: 5 },
  shortcuts: { flexDirection: 'row', gap: 10 },
  shortcut: { alignItems: 'center', backgroundColor: '#E8F1EA', borderRadius: 15, flex: 1, gap: 5, paddingVertical: 12 },
  shortcutIcon: { color: '#26734F', fontSize: 20, fontWeight: '800' },
  shortcutText: { color: '#315A46', fontSize: 12, fontWeight: '800' },
  historyCard: { backgroundColor: '#FFFFFF', borderRadius: 18, padding: 17 },
  chart: { alignItems: 'flex-end', flexDirection: 'row', gap: 8, height: 140, marginTop: 14 },
  chartColumn: { alignItems: 'center', flex: 1, gap: 5, height: '100%', justifyContent: 'flex-end' },
  chartValue: { color: '#537061', fontSize: 10, fontWeight: '700' },
  chartTrack: { backgroundColor: '#EAF1EC', borderRadius: 8, height: 98, justifyContent: 'flex-end', overflow: 'hidden', width: '100%' },
  chartBar: { backgroundColor: '#3F8A64', borderRadius: 8, width: '100%' },
  chartLabel: { color: '#809087', fontSize: 10 },
  sectionHeader: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', marginTop: 5 },
  sectionTitle: { color: '#183B2B', fontSize: 19, fontWeight: '800' },
  sectionAction: { color: '#3D7B5A', fontSize: 13, fontWeight: '700' },
  summaryCard: { backgroundColor: '#FFFFFF', borderRadius: 18, gap: 16, padding: 18 },
  summaryText: { color: '#45564B', fontSize: 15, lineHeight: 22 },
  primaryButton: { alignItems: 'center', backgroundColor: '#26734F', borderRadius: 12, paddingVertical: 14 },
  primaryButtonText: { color: '#FFFFFF', fontSize: 15, fontWeight: '800' },
  tipCard: { alignItems: 'flex-start', backgroundColor: '#FFF5D8', borderRadius: 18, flexDirection: 'row', gap: 12, padding: 17 },
  tipEmoji: { fontSize: 22 },
  tipContent: { flex: 1, gap: 5 },
  tipTitle: { color: '#745513', fontSize: 14, fontWeight: '800' },
  tipText: { color: '#745513', fontSize: 13, lineHeight: 19 },
  signOut: { color: '#809087', fontSize: 13, fontWeight: '700', textAlign: 'center' },
});
