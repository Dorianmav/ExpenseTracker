import React, { useState } from 'react';
import { StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { Text, View } from '@/components/Themed';
import { format, parse } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useFocusEffect } from '@react-navigation/native';
import { router } from 'expo-router';
import { expenseService, Expense, PaymentEvent } from '@/services/expenseService';

type TodayListItem = Expense | (Omit<PaymentEvent, 'date'> & { date: Date; occurrenceId: number });

const getPaymentTypeLabel = (type: PaymentEvent['type']) =>
  type === 'subscription' ? 'Abonnement' : 'Paiement échelonné';

const mapPaymentEventToTodayItem = (payment: PaymentEvent): TodayListItem => ({
  ...payment,
  date: parse(payment.date, 'yyyy-MM-dd', new Date()),
  occurrenceId: Number(payment.id.split('-')[1]),
});

const openTodayItem = (item: TodayListItem) => {
  const isPlannedPayment = 'ownerId' in item;

  router.push({
    pathname: '/payment-detail',
    params: {
      type: isPlannedPayment ? item.type : 'simple',
      id: isPlannedPayment ? String(item.ownerId) : item.id,
    },
  });
};

export default function HomeScreen() {
  const [expenses, setExpenses] = useState<TodayListItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const today = format(new Date(), 'EEEE d MMMM yyyy', { locale: fr });

  useFocusEffect(
    React.useCallback(() => {
      let isActive = true;

      const loadExpenses = async () => {
        setIsLoading(true);
        setError(null);

        try {
          const calendarDate = format(new Date(), 'yyyy-MM-dd');
          const [todayExpenses, todayPayments] = await Promise.all([
            expenseService.getTodayExpenses(),
            expenseService.getPaymentsForDate(calendarDate),
          ]);
          const todayExpenseIds = new Set(todayExpenses.map((expense) => Number(expense.id)));
          const plannedPayments = todayPayments
            .filter((payment) => !payment.expenseId || !todayExpenseIds.has(payment.expenseId))
            .map(mapPaymentEventToTodayItem);

          if (isActive) setExpenses([...todayExpenses, ...plannedPayments]);
        } catch (loadError) {
          console.error(loadError);
          if (isActive) setError("Impossible de charger les dépenses du jour");
        } finally {
          if (isActive) setIsLoading(false);
        }
      };

      loadExpenses();

      return () => {
        isActive = false;
      };
    }, []),
  );

  const renderExpenseItem = ({ item }: { item: TodayListItem }) => (
    <TouchableOpacity style={styles.expenseItem} onPress={() => openTodayItem(item)}>
      <View style={styles.expenseHeader}>
        <Text style={styles.expenseDescription}>{item.description}</Text>
        <Text style={styles.expenseAmount}>{item.amount.toFixed(2)} €</Text>
      </View>
      <View style={styles.expenseDetails}>
        <Text style={styles.expenseCategory}>{item.category}</Text>
        <Text style={styles.expenseBank}>
          {item.type === 'simple' ? item.bank : getPaymentTypeLabel(item.type)}
        </Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.dateHeader}>{today}</Text>
      <Text style={styles.title}>Dépenses du jour</Text>

      {isLoading ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>Chargement...</Text>
        </View>
      ) : error ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>{error}</Text>
        </View>
      ) : expenses.length > 0 ? (
        <FlatList
          data={expenses}
          renderItem={renderExpenseItem}
          keyExtractor={(item) => item.id}
          style={styles.list}
        />
      ) : (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>Aucune dépense aujourd'hui</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    width: '100%',
  },
  dateHeader: {
    fontSize: 18,
    fontWeight: '500',
    marginTop: 10,
    marginBottom: 5,
    textTransform: 'capitalize',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  list: {
    width: '100%',
  },
  expenseItem: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  expenseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  expenseDescription: {
    fontSize: 16,
    fontWeight: '500',
  },
  expenseAmount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#e74c3c',
  },
  expenseDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  expenseCategory: {
    fontSize: 14,
    color: '#7f8c8d',
  },
  expenseBank: {
    fontSize: 14,
    color: '#7f8c8d',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 50,
  },
  emptyText: {
    fontSize: 16,
    color: '#95a5a6',
    textAlign: 'center',
  },
});
