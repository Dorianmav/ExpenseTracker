import React, { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, TouchableOpacity, View as NativeView } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { router } from 'expo-router';
import { format, parse } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Text, View, useThemeColor } from '@/components/Themed';
import {
  Installment,
  PaymentOccurrence,
  Subscription,
  SubscriptionFrequency,
  expenseService,
} from '@/services/expenseService';

type FrequencyFilter = 'all' | SubscriptionFrequency;
type HubView = 'subscriptions' | 'installments';

const frequencyFilters: { label: string; value: FrequencyFilter }[] = [
  { label: 'Tous', value: 'all' },
  { label: 'Semaine', value: 'weekly' },
  { label: '2 semaines', value: 'biweekly' },
  { label: 'Mois', value: 'monthly' },
  { label: 'Trimestre', value: 'quarterly' },
  { label: 'Année', value: 'yearly' },
];

const frequencyLabels: Record<SubscriptionFrequency, string> = {
  weekly: 'Hebdomadaire',
  biweekly: 'Toutes les deux semaines',
  monthly: 'Mensuel',
  quarterly: 'Trimestriel',
  yearly: 'Annuel',
};

const toAmount = (value: number | string) => Number(value);
const formatAmount = (value: number | string) => `${toAmount(value).toFixed(2)} €`;
const parseApiDate = (value?: string | null) => (value ? parse(value, 'dd/MM/yyyy', new Date()) : null);
const formatApiDate = (value?: string | null) => {
  const date = parseApiDate(value);
  return date ? format(date, 'dd MMM yyyy', { locale: fr }) : 'Non définie';
};

const getOpenOccurrences = (occurrences: PaymentOccurrence[] = []) =>
  [...occurrences]
    .filter((occurrence) => ['pending', 'late'].includes(occurrence.status))
    .sort((left, right) => {
      const leftDate = parseApiDate(left.dueDate)?.getTime() ?? 0;
      const rightDate = parseApiDate(right.dueDate)?.getTime() ?? 0;
      return leftDate - rightDate;
    });

const getPaidAmount = (occurrences: PaymentOccurrence[] = []) =>
  occurrences
    .filter((occurrence) => occurrence.status === 'paid')
    .reduce((sum, occurrence) => sum + toAmount(occurrence.amount), 0);

const getMonthlyEquivalent = (subscription: Subscription) => {
  const amount = toAmount(subscription.amount);

  switch (subscription.frequency) {
    case 'weekly':
      return (amount * 52) / 12;
    case 'biweekly':
      return (amount * 26) / 12;
    case 'quarterly':
      return amount / 3;
    case 'yearly':
      return amount / 12;
    default:
      return amount;
  }
};

export default function PaymentsHubScreen() {
  const surfaceColor = useThemeColor({}, 'surface');
  const borderColor = useThemeColor({}, 'border');
  const mutedColor = useThemeColor({}, 'muted');
  const primaryColor = useThemeColor({}, 'primary');
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [installments, setInstallments] = useState<Installment[]>([]);
  const [activeView, setActiveView] = useState<HubView>('subscriptions');
  const [frequencyFilter, setFrequencyFilter] = useState<FrequencyFilter>('all');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useFocusEffect(
    React.useCallback(() => {
      let isActive = true;

      const loadPayments = async () => {
        setIsLoading(true);
        setError(null);

        try {
          const [activeSubscriptions, activeInstallments] = await Promise.all([
            expenseService.getActiveSubscriptions(),
            expenseService.getActiveInstallments(),
          ]);

          if (isActive) {
            setSubscriptions(activeSubscriptions);
            setInstallments(activeInstallments);
          }
        } catch (loadError) {
          console.error(loadError);
          if (isActive) setError('Impossible de charger le hub des paiements');
        } finally {
          if (isActive) setIsLoading(false);
        }
      };

      loadPayments();

      return () => {
        isActive = false;
      };
    }, []),
  );

  const filteredSubscriptions = useMemo(
    () =>
      frequencyFilter === 'all'
        ? subscriptions
        : subscriptions.filter((subscription) => subscription.frequency === frequencyFilter),
    [frequencyFilter, subscriptions],
  );

  const monthlySubscriptionsTotal = subscriptions.reduce(
    (sum, subscription) => sum + getMonthlyEquivalent(subscription),
    0,
  );
  const subscriptionsSpentTotal = subscriptions.reduce(
    (sum, subscription) => sum + getPaidAmount(subscription.occurrences),
    0,
  );
  const installmentsRemainingTotal = installments.reduce((sum, installment) => {
    const paidAmount = getPaidAmount(installment.occurrences);
    return sum + Math.max(toAmount(installment.totalAmount) - paidAmount, 0);
  }, 0);
  const installmentsPaidTotal = installments.reduce(
    (sum, installment) => sum + getPaidAmount(installment.occurrences),
    0,
  );
  const installmentsInitialTotal = installments.reduce(
    (sum, installment) => sum + toAmount(installment.totalAmount),
    0,
  );

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      <Text style={styles.title}>Paiements récurrents</Text>

      <View style={[styles.switchContainer, { backgroundColor: surfaceColor, borderColor }]}>
        <TouchableOpacity
          style={[
            styles.switchButton,
            activeView === 'subscriptions' && { backgroundColor: primaryColor },
          ]}
          onPress={() => setActiveView('subscriptions')}
        >
          <Text
            style={[
              styles.switchText,
              { color: activeView === 'subscriptions' ? '#fff' : mutedColor },
            ]}
          >
            Abonnements
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.switchButton,
            activeView === 'installments' && { backgroundColor: primaryColor },
          ]}
          onPress={() => setActiveView('installments')}
        >
          <Text
            style={[
              styles.switchText,
              { color: activeView === 'installments' ? '#fff' : mutedColor },
            ]}
          >
            Plusieurs fois
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.summaryGrid}>
        {activeView === 'subscriptions' ? (
          <>
            <SummaryTile label="Abonnements" value={String(subscriptions.length)} />
            <SummaryTile label="Mensuel estimé" value={formatAmount(monthlySubscriptionsTotal)} />
            <SummaryTile label="Déjà dépensé" value={formatAmount(subscriptionsSpentTotal)} />
            <SummaryTile
              label="Filtre actif"
              value={frequencyFilters.find((filter) => filter.value === frequencyFilter)?.label ?? 'Tous'}
            />
          </>
        ) : (
          <>
            <SummaryTile label="Échéanciers" value={String(installments.length)} />
            <SummaryTile label="Reste à payer" value={formatAmount(installmentsRemainingTotal)} />
            <SummaryTile label="Déjà payé" value={formatAmount(installmentsPaidTotal)} />
            <SummaryTile label="Total initial" value={formatAmount(installmentsInitialTotal)} />
          </>
        )}
      </View>

      {isLoading && <Text style={[styles.muted, { color: mutedColor }]}>Chargement...</Text>}
      {error && <Text style={styles.errorText}>{error}</Text>}

      {activeView === 'subscriptions' ? (
        <>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Abonnements</Text>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filters}>
            {frequencyFilters.map((filter) => (
              <TouchableOpacity
                key={filter.value}
                style={[
                  styles.filterButton,
                  { backgroundColor: surfaceColor, borderColor },
                  frequencyFilter === filter.value && { backgroundColor: primaryColor, borderColor: primaryColor },
                ]}
                onPress={() => setFrequencyFilter(filter.value)}
              >
                <Text style={frequencyFilter === filter.value ? styles.filterTextActive : styles.filterText}>
                  {filter.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {filteredSubscriptions.length > 0 ? (
            filteredSubscriptions.map((subscription) => (
              <SubscriptionCard key={subscription.id} subscription={subscription} />
            ))
          ) : (
            <Text style={styles.emptyText}>Aucun abonnement dans ce filtre</Text>
          )}
        </>
      ) : (
        <>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Paiements en plusieurs fois</Text>
          </View>
          {installments.length > 0 ? (
            installments.map((installment) => (
              <InstallmentCard key={installment.id} installment={installment} />
            ))
          ) : (
            <Text style={styles.emptyText}>Aucun paiement en plusieurs fois en cours</Text>
          )}
        </>
      )}
    </ScrollView>
  );
}

function SummaryTile({ label, value }: { label: string; value: string }) {
  const surfaceColor = useThemeColor({}, 'surface');
  const mutedColor = useThemeColor({}, 'muted');

  return (
    <View style={[styles.summaryTile, { backgroundColor: surfaceColor }]}>
      <Text style={styles.summaryValue}>{value}</Text>
      <Text style={[styles.summaryLabel, { color: mutedColor }]}>{label}</Text>
    </View>
  );
}

function SubscriptionCard({ subscription }: { subscription: Subscription }) {
  const surfaceColor = useThemeColor({}, 'surface');
  const borderColor = useThemeColor({}, 'border');
  const mutedColor = useThemeColor({}, 'muted');
  const nextOccurrence = getOpenOccurrences(subscription.occurrences)[0];
  const spentAmount = getPaidAmount(subscription.occurrences);

  return (
    <TouchableOpacity
      style={[styles.card, { backgroundColor: surfaceColor }]}
      onPress={() =>
        router.push({
          pathname: '/payment-detail',
          params: { type: 'subscription', id: String(subscription.id) },
        })
      }
    >
      <NativeView style={styles.cardHeader}>
        <Text style={styles.cardTitle}>{subscription.name}</Text>
        <Text style={styles.cardAmount}>{formatAmount(subscription.amount)}</Text>
      </NativeView>
      <Text style={[styles.muted, { color: mutedColor }]}>{frequencyLabels[subscription.frequency]}</Text>
      <Text style={styles.cardProgress}>Dépensé jusqu'ici: {formatAmount(spentAmount)}</Text>
      <NativeView style={[styles.cardFooter, { borderTopColor: borderColor }]}>
        <Text style={[styles.cardMeta, { color: mutedColor }]}>{subscription.category?.name ?? 'Catégorie non définie'}</Text>
        <Text style={[styles.cardMeta, { color: mutedColor }]}>Prochaine: {formatApiDate(nextOccurrence?.dueDate)}</Text>
      </NativeView>
    </TouchableOpacity>
  );
}

function InstallmentCard({ installment }: { installment: Installment }) {
  const surfaceColor = useThemeColor({}, 'surface');
  const borderColor = useThemeColor({}, 'border');
  const mutedColor = useThemeColor({}, 'muted');
  const openOccurrences = getOpenOccurrences(installment.occurrences);
  const paidAmount = getPaidAmount(installment.occurrences);
  const remainingAmount = Math.max(toAmount(installment.totalAmount) - paidAmount, 0);

  return (
    <TouchableOpacity
      style={[styles.card, { backgroundColor: surfaceColor }]}
      onPress={() =>
        router.push({
          pathname: '/payment-detail',
          params: { type: 'installment', id: String(installment.id) },
        })
      }
    >
      <NativeView style={styles.cardHeader}>
        <Text style={styles.cardTitle}>{installment.name}</Text>
        <Text style={styles.cardAmount}>{formatAmount(installment.totalAmount)}</Text>
      </NativeView>
      <NativeView style={styles.installmentProgressRow}>
        <Text style={[styles.muted, styles.installmentProgressText, { color: mutedColor }]}>
          {openOccurrences.length} échéance(s) restante(s) sur {installment.numberOfPayments}
        </Text>
        <Text style={[styles.remainingAmount, { color: mutedColor }]}>
          Reste: {formatAmount(remainingAmount)}
        </Text>
      </NativeView>
      <NativeView style={[styles.cardFooter, { borderTopColor: borderColor }]}>
        <Text style={[styles.cardMeta, { color: mutedColor }]}>{installment.bank?.name ?? 'Banque non définie'}</Text>
        <Text style={[styles.cardMeta, { color: mutedColor }]}>Prochaine: {formatApiDate(openOccurrences[0]?.dueDate)}</Text>
      </NativeView>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    paddingTop: 48,
  },
  scrollContent: {
    paddingBottom: 112,
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  switchContainer: {
    flexDirection: 'row',
    backgroundColor: '#ecf0f1',
    borderRadius: 8,
    borderWidth: 1,
    padding: 4,
    marginBottom: 16,
  },
  switchButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 10,
    borderRadius: 6,
  },
  switchButtonActive: {
    backgroundColor: '#3498db',
  },
  switchText: {
    fontWeight: '700',
  },
  summaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 20,
  },
  summaryTile: {
    width: '48%',
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.12,
    shadowRadius: 2,
    elevation: 2,
  },
  summaryValue: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  summaryLabel: {
    color: '#7f8c8d',
    marginTop: 4,
  },
  sectionHeader: {
    marginTop: 8,
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  filters: {
    marginBottom: 12,
  },
  filterButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#dfe6e9',
    marginRight: 8,
    backgroundColor: '#fff',
  },
  filterButtonActive: {
    backgroundColor: '#3498db',
    borderColor: '#3498db',
  },
  filterText: {
    fontWeight: '500',
  },
  filterTextActive: {
    color: '#fff',
    fontWeight: '700',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.12,
    shadowRadius: 2,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
    marginBottom: 6,
  },
  cardTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: '700',
  },
  cardAmount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#e74c3c',
  },
  cardProgress: {
    fontWeight: '600',
    marginTop: 8,
  },
  installmentProgressRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 12,
  },
  installmentProgressText: {
    flex: 1,
  },
  remainingAmount: {
    fontWeight: '700',
    textAlign: 'right',
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
  },
  cardMeta: {
    color: '#7f8c8d',
    flex: 1,
  },
  muted: {
    color: '#7f8c8d',
  },
  emptyText: {
    color: '#95a5a6',
    marginBottom: 16,
  },
  errorText: {
    color: '#e74c3c',
    marginBottom: 12,
  },
});
