import React, { useEffect, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, TouchableOpacity, View as NativeView } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { format, parse } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Text, View, useThemeColor } from '@/components/Themed';
import {
  Expense,
  Installment,
  OccurrenceStatus,
  PaymentOccurrence,
  Subscription,
  expenseService,
} from '@/services/expenseService';

type DetailType = 'simple' | 'subscription' | 'installment';

const statusLabels: Record<string, string> = {
  pending: 'À venir',
  paid: 'Payé',
  late: 'En retard',
  skipped: 'Ignoré',
};

const frequencyLabels: Record<string, string> = {
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
  return date ? format(date, 'dd MMMM yyyy', { locale: fr }) : 'Non définie';
};

const sortOccurrences = (occurrences: PaymentOccurrence[] = []) =>
  [...occurrences].sort((left, right) => {
    const leftDate = parseApiDate(left.dueDate)?.getTime() ?? 0;
    const rightDate = parseApiDate(right.dueDate)?.getTime() ?? 0;
    return leftDate - rightDate;
  });

const getOpenOccurrences = (occurrences: PaymentOccurrence[] = []) =>
  sortOccurrences(occurrences).filter((occurrence) =>
    ['pending', 'late'].includes(occurrence.status),
  );

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

export default function PaymentDetailScreen() {
  const surfaceColor = useThemeColor({}, 'surface');
  const params = useLocalSearchParams<{ type?: DetailType; id?: string }>();
  const [expense, setExpense] = useState<Expense | null>(null);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [installment, setInstallment] = useState<Installment | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [updatingOccurrenceId, setUpdatingOccurrenceId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  useEffect(() => {
    let isActive = true;

    const loadDetail = async () => {
      if (!params.type || !params.id) {
        setError('Paiement introuvable');
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        if (params.type === 'simple') {
          const detail = await expenseService.getExpense(params.id);
          if (isActive) setExpense(detail);
        } else if (params.type === 'subscription') {
          const detail = await expenseService.getSubscription(params.id);
          if (isActive) setSubscription(detail);
        } else {
          const detail = await expenseService.getInstallment(params.id);
          if (isActive) setInstallment(detail);
        }
      } catch (loadError) {
        console.error(loadError);
        if (isActive) setError('Impossible de charger le détail du paiement');
      } finally {
        if (isActive) setIsLoading(false);
      }
    };

    loadDetail();

    return () => {
      isActive = false;
    };
  }, [params.id, params.type]);

  const occurrences = useMemo(() => {
    if (subscription) return sortOccurrences(subscription.occurrences);
    if (installment) return sortOccurrences(installment.occurrences);
    return [];
  }, [installment, subscription]);
  const openOccurrences = useMemo(() => getOpenOccurrences(occurrences), [occurrences]);

  const replaceLocalOccurrence = (nextOccurrence: PaymentOccurrence) => {
    if (params.type === 'subscription') {
      setSubscription((currentSubscription) =>
        currentSubscription
          ? {
              ...currentSubscription,
              occurrences: (currentSubscription.occurrences ?? []).map((occurrence) =>
                occurrence.id === nextOccurrence.id ? nextOccurrence : occurrence,
              ),
            }
          : currentSubscription,
      );
      return;
    }

    if (params.type === 'installment') {
      setInstallment((currentInstallment) =>
        currentInstallment
          ? {
              ...currentInstallment,
              occurrences: (currentInstallment.occurrences ?? []).map((occurrence) =>
                occurrence.id === nextOccurrence.id ? nextOccurrence : occurrence,
              ),
            }
          : currentInstallment,
      );
    }
  };

  const handleStatusChange = async (occurrenceId: number, status: OccurrenceStatus) => {
    if (params.type !== 'subscription' && params.type !== 'installment') {
      return;
    }

    const previousOccurrence = occurrences.find((occurrence) => occurrence.id === occurrenceId);

    if (!previousOccurrence) {
      return;
    }

    setUpdatingOccurrenceId(occurrenceId);
    setActionError(null);
    replaceLocalOccurrence({
      ...previousOccurrence,
      status,
      paidDate: status === 'paid' ? format(new Date(), 'dd/MM/yyyy') : null,
    });

    try {
      await expenseService.updateOccurrenceStatus(params.type, occurrenceId, status);
    } catch (statusError) {
      console.error(statusError);
      replaceLocalOccurrence(previousOccurrence);
      setActionError("Impossible de modifier l'état de cette échéance");
    } finally {
      setUpdatingOccurrenceId(null);
    }
  };

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <Text style={styles.muted}>Chargement...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  if (expense) {
    return (
      <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
        <Text style={styles.title}>{expense.description}</Text>
        <NativeView style={[styles.section, { backgroundColor: surfaceColor }]}>
          <InfoRow label="Montant" value={formatAmount(expense.amount)} />
          <InfoRow label="Date" value={format(expense.date, 'dd MMMM yyyy', { locale: fr })} />
          <InfoRow label="Catégorie" value={expense.category} />
          <InfoRow label="Banque" value={expense.bank} />
          <InfoRow label="Type" value="Paiement simple" />
          <InfoRow label="Statut" value="Payé" />
        </NativeView>
      </ScrollView>
    );
  }

  if (subscription) {
    const paidAmount = getPaidAmount(occurrences);
    const remainingAmount = subscription.endDate
      ? openOccurrences.reduce((sum, occurrence) => sum + toAmount(occurrence.amount), 0)
      : null;

    return (
      <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
        <Text style={styles.title}>{subscription.name}</Text>
        <NativeView style={[styles.section, { backgroundColor: surfaceColor }]}>
          <InfoRow label="Type" value="Abonnement" />
          <InfoRow label="Montant par échéance" value={formatAmount(subscription.amount)} />
          <InfoRow label="Fréquence" value={frequencyLabels[subscription.frequency]} />
          <InfoRow label="Coût mensuel estimé" value={formatAmount(getMonthlyEquivalent(subscription))} />
          <InfoRow label="Début" value={formatApiDate(subscription.startDate)} />
          <InfoRow label="Fin" value={formatApiDate(subscription.endDate)} />
          <InfoRow label="Catégorie" value={subscription.category?.name ?? 'Non définie'} />
          <InfoRow label="Banque" value={subscription.bank?.name ?? 'Non définie'} />
          <InfoRow label="Déjà payé" value={formatAmount(paidAmount)} />
          <InfoRow
            label="Reste à payer"
            value={remainingAmount === null ? 'Abonnement actif sans fin définie' : formatAmount(remainingAmount)}
          />
        </NativeView>
        <OccurrencesSection
          occurrences={occurrences}
          title="Échéances"
          error={actionError}
          updatingOccurrenceId={updatingOccurrenceId}
          onStatusChange={handleStatusChange}
        />
      </ScrollView>
    );
  }

  if (installment) {
    const paidAmount = getPaidAmount(occurrences);
    const totalAmount = toAmount(installment.totalAmount);
    const remainingAmount = Math.max(totalAmount - paidAmount, 0);

    return (
      <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
        <Text style={styles.title}>{installment.name}</Text>
        <NativeView style={[styles.section, { backgroundColor: surfaceColor }]}>
          <InfoRow label="Type" value="Paiement en plusieurs fois" />
          <InfoRow label="Montant total" value={formatAmount(totalAmount)} />
          <InfoRow label="Déjà payé" value={formatAmount(paidAmount)} />
          <InfoRow label="Reste à payer" value={formatAmount(remainingAmount)} />
          <InfoRow label="Échéances restantes" value={`${openOccurrences.length}/${installment.numberOfPayments}`} />
          <InfoRow label="Début" value={formatApiDate(installment.startDate)} />
          <InfoRow label="Prochaine échéance" value={formatApiDate(openOccurrences[0]?.dueDate)} />
          <InfoRow label="Catégorie" value={installment.category?.name ?? 'Non définie'} />
          <InfoRow label="Banque" value={installment.bank?.name ?? 'Non définie'} />
        </NativeView>
        <OccurrencesSection
          occurrences={occurrences}
          title="Échéances"
          error={actionError}
          updatingOccurrenceId={updatingOccurrenceId}
          onStatusChange={handleStatusChange}
        />
      </ScrollView>
    );
  }

  return null;
}

function InfoRow({ label, value }: { label: string; value: string }) {
  const mutedColor = useThemeColor({}, 'muted');

  return (
    <NativeView style={styles.infoRow}>
      <Text style={[styles.infoLabel, { color: mutedColor }]}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </NativeView>
  );
}

function OccurrencesSection({
  title,
  occurrences,
  error,
  updatingOccurrenceId,
  onStatusChange,
}: {
  title: string;
  occurrences: PaymentOccurrence[];
  error: string | null;
  updatingOccurrenceId: number | null;
  onStatusChange: (occurrenceId: number, status: OccurrenceStatus) => void;
}) {
  const surfaceColor = useThemeColor({}, 'surface');
  const mutedColor = useThemeColor({}, 'muted');

  return (
    <NativeView style={[styles.section, { backgroundColor: surfaceColor }]}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {error && <Text style={styles.inlineErrorText}>{error}</Text>}
      {occurrences.length > 0 ? (
        occurrences.slice(0, 12).map((occurrence) => (
          <NativeView
            key={occurrence.id}
            style={styles.occurrenceRow}
          >
            <NativeView style={styles.occurrenceContent}>
              <NativeView style={styles.occurrenceHeader}>
                <NativeView>
                  <Text style={styles.occurrenceDate}>{formatApiDate(occurrence.dueDate)}</Text>
                  <Text style={[styles.muted, { color: mutedColor }]}>{statusLabels[occurrence.status] ?? occurrence.status}</Text>
                </NativeView>
                <Text style={styles.occurrenceAmount}>{formatAmount(occurrence.amount)}</Text>
              </NativeView>
              <NativeView style={styles.statusActions}>
                <StatusButton
                  label="Payé"
                  active={occurrence.status === 'paid'}
                  disabled={updatingOccurrenceId === occurrence.id}
                  onPress={() => onStatusChange(occurrence.id, 'paid')}
                />
                <StatusButton
                  label="En retard"
                  active={occurrence.status === 'late'}
                  disabled={updatingOccurrenceId === occurrence.id}
                  onPress={() => onStatusChange(occurrence.id, 'late')}
                />
                <StatusButton
                  label="À venir"
                  active={occurrence.status === 'pending'}
                  disabled={updatingOccurrenceId === occurrence.id}
                  onPress={() => onStatusChange(occurrence.id, 'pending')}
                />
              </NativeView>
            </NativeView>
          </NativeView>
        ))
      ) : (
        <Text style={styles.muted}>Aucune échéance à venir</Text>
      )}
    </NativeView>
  );
}

function StatusButton({
  label,
  active,
  disabled,
  onPress,
}: {
  label: string;
  active: boolean;
  disabled: boolean;
  onPress: () => void;
}) {
  const primaryColor = useThemeColor({}, 'primary');
  const borderColor = useThemeColor({}, 'border');

  return (
    <TouchableOpacity
      style={[
        styles.statusButton,
        { borderColor },
        active && { backgroundColor: primaryColor, borderColor: primaryColor },
        disabled && styles.statusButtonDisabled,
      ]}
      onPress={onPress}
      disabled={disabled || active}
    >
      <Text style={active ? styles.statusButtonTextActive : styles.statusButtonText}>{label}</Text>
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
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  section: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.12,
    shadowRadius: 2,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 16,
    paddingVertical: 10,
  },
  infoLabel: {
    color: '#7f8c8d',
    flex: 1,
  },
  infoValue: {
    fontWeight: '600',
    flex: 1,
    textAlign: 'right',
  },
  occurrenceRow: {
    paddingVertical: 12,
  },
  occurrenceContent: {
    gap: 10,
  },
  occurrenceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
  },
  occurrenceDate: {
    fontWeight: '600',
  },
  occurrenceAmount: {
    fontSize: 16,
    fontWeight: '700',
    color: '#e74c3c',
  },
  statusActions: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  statusButton: {
    borderWidth: 1,
    borderColor: '#dfe6e9',
    borderRadius: 16,
    paddingVertical: 6,
    paddingHorizontal: 10,
  },
  statusButtonActive: {
    backgroundColor: '#3498db',
    borderColor: '#3498db',
  },
  statusButtonDisabled: {
    opacity: 0.6,
  },
  statusButtonText: {
    fontWeight: '600',
  },
  statusButtonTextActive: {
    color: '#fff',
    fontWeight: '700',
  },
  muted: {
    color: '#7f8c8d',
  },
  errorText: {
    color: '#e74c3c',
    textAlign: 'center',
  },
  inlineErrorText: {
    color: '#e74c3c',
    fontWeight: '600',
    marginBottom: 12,
  },
});
