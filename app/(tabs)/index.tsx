import React, { useState } from 'react';
import { StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Text, View, useThemeColor } from '@/components/Themed';
import { format, parse } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useFocusEffect } from '@react-navigation/native';
import { router } from 'expo-router';
import { ExpenseListItem, ExpenseListItemData } from '@/components/ExpenseListItem';
import { expenseService, Expense, PaymentEvent } from '@/services/expenseService';

type TodayListItem = ExpenseListItemData;

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
  const mutedColor = useThemeColor({}, 'muted');
  const primaryColor = useThemeColor({}, 'primary');
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
          const todayExpenseIds = new Set(todayExpenses.map((expense: Expense) => Number(expense.id)));
          const plannedPayments = todayPayments
            .filter((payment) => !payment.expenseId || !todayExpenseIds.has(payment.expenseId))
            .map(mapPaymentEventToTodayItem);

          if (isActive) setExpenses([...todayExpenses, ...plannedPayments]);
        } catch (loadError) {
          console.error(loadError);
          if (isActive) setError('Impossible de charger les dépenses du jour');
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
    <ExpenseListItem item={item} onPress={() => openTodayItem(item)} />
  );

  return (
    <View style={styles.container}>
      <Text style={[styles.dateHeader, { color: mutedColor }]}>{today}</Text>
      <Text style={styles.title}>Dépenses du jour</Text>

      {isLoading ? (
        <View style={styles.emptyContainer}>
          <Text style={[styles.emptyText, { color: mutedColor }]}>Chargement...</Text>
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
          contentContainerStyle={styles.listContent}
        />
      ) : (
        <View style={styles.emptyContainer}>
          <Text style={[styles.emptyText, { color: mutedColor }]}>Aucune dépense aujourd'hui</Text>
        </View>
      )}

      <TouchableOpacity
        style={[styles.addButton, { backgroundColor: primaryColor }]}
        onPress={() => router.push('/add-expense')}
        activeOpacity={0.85}
      >
        <FontAwesome name="plus" size={24} color="#fff" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    paddingTop: 48,
    width: '100%',
  },
  dateHeader: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 10,
    marginBottom: 5,
    textTransform: 'capitalize',
  },
  title: {
    fontSize: 28,
    fontWeight: '900',
    marginBottom: 22,
  },
  list: {
    width: '100%',
  },
  listContent: {
    paddingBottom: 112,
  },
  addButton: {
    position: 'absolute',
    right: 20,
    bottom: 28,
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.22,
    shadowRadius: 14,
    elevation: 5,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 50,
  },
  emptyText: {
    fontSize: 16,
    textAlign: 'center',
  },
});
