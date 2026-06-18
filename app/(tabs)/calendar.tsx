import React, { useMemo, useState } from 'react';
import { StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { Text, View } from '@/components/Themed';
import { Calendar, LocaleConfig } from 'react-native-calendars';
import { addMonths, endOfMonth, format, parse, startOfMonth, subMonths } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useFocusEffect } from '@react-navigation/native';
import { router } from 'expo-router';
import { expenseService, PaymentEvent } from '@/services/expenseService';

type MarkedDates = {
  [date: string]: {
    selected?: boolean;
    selectedColor?: string;
    dots?: {
      key: string;
      color: string;
    }[];
  };
};

const paymentTypeColors = {
  subscription: '#3498db',
  installment: '#e74c3c',
} as const;

const getProjectionRange = (month: string) => {
  const currentMonthDate = parse(`${month}-01`, 'yyyy-MM-dd', new Date());

  return {
    startDate: startOfMonth(subMonths(currentMonthDate, 1)),
    endDate: endOfMonth(addMonths(currentMonthDate, 1)),
  };
};

LocaleConfig.locales['fr'] = {
  monthNames: [
    'Janvier',
    'Février',
    'Mars',
    'Avril',
    'Mai',
    'Juin',
    'Juillet',
    'Août',
    'Septembre',
    'Octobre',
    'Novembre',
    'Décembre',
  ],
  monthNamesShort: ['Janv.', 'Févr.', 'Mars', 'Avril', 'Mai', 'Juin', 'Juil.', 'Août', 'Sept.', 'Oct.', 'Nov.', 'Déc.'],
  dayNames: ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'],
  dayNamesShort: ['Dim.', 'Lun.', 'Mar.', 'Mer.', 'Jeu.', 'Ven.', 'Sam.'],
  today: "Aujourd'hui",
};
LocaleConfig.defaultLocale = 'fr';


export default function CalendarScreen() {
  const today = format(new Date(), 'yyyy-MM-dd');
  const [selectedDate, setSelectedDate] = useState(today);
  const [upcomingPayments, setUpcomingPayments] = useState<PaymentEvent[]>([]);
  const [currentMonth, setCurrentMonth] = useState(format(new Date(), 'yyyy-MM'));
  const [calendarKey, setCalendarKey] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadPayments = React.useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const { startDate, endDate } = getProjectionRange(currentMonth);
      const payments = await expenseService.getAllUpcomingPayments(startDate, endDate);
      setUpcomingPayments(payments);
    } catch (loadError) {
      console.error(loadError);
      setError('Impossible de charger le calendrier');
    } finally {
      setIsLoading(false);
    }
  }, [currentMonth]);

  const goToToday = () => {
    setSelectedDate(today);
    setCurrentMonth(format(new Date(), 'yyyy-MM'));
    setCalendarKey((prevKey) => prevKey + 1);
  };

  useFocusEffect(
    React.useCallback(() => {
      loadPayments();
    }, [loadPayments]),
  );

  const markedDates = useMemo(() => {
    const dates = upcomingPayments.reduce((acc: MarkedDates, payment) => {
      const currentDate = acc[payment.date] ?? {};
      const existingDots = currentDate.dots ?? [];

      return {
        ...acc,
        [payment.date]: {
          ...currentDate,
          dots: [
            ...existingDots,
            {
              key: payment.id,
              color: paymentTypeColors[payment.type],
            },
          ],
        },
      };
    }, {} as MarkedDates);

    return {
      ...dates,
      [selectedDate]: {
        ...dates[selectedDate],
        selected: true,
        selectedColor: '#2ecc71',
      },
    };
  }, [selectedDate, upcomingPayments]);

  const paymentsForSelectedDate = upcomingPayments.filter((payment) => payment.date === selectedDate);

  const renderPaymentItem = ({ item }: { item: PaymentEvent }) => (
    <TouchableOpacity
      style={styles.paymentItem}
      onPress={() =>
        router.push({
          pathname: '/payment-detail',
          params: { type: item.type, id: String(item.ownerId) },
        })
      }
    >
      <View style={styles.paymentHeader}>
        <Text style={styles.paymentDescription}>{item.description}</Text>
        <Text style={styles.paymentAmount}>{item.amount.toFixed(2)} €</Text>
      </View>
      <View style={styles.paymentDetails}>
        <Text style={styles.paymentType}>
          {item.type === 'subscription' ? 'Abonnement' : 'Paiement échelonné'}
        </Text>
        <Text style={styles.paymentBank}>{item.status === 'paid' ? 'Payé' : 'À venir'}</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.headerContainer}>
        <Text style={styles.title}>Calendrier des paiements</Text>
        <TouchableOpacity style={styles.todayButton} onPress={goToToday}>
          <Text style={styles.todayButtonText}>Aujourd'hui</Text>
        </TouchableOpacity>
      </View>

      <Calendar
        key={calendarKey}
        style={styles.calendar}
        theme={{
          todayTextColor: '#2ecc71',
          arrowColor: '#3498db',
        }}
        markingType={'multi-dot'}
        markedDates={markedDates}
        onDayPress={(day) => setSelectedDate(day.dateString)}
        onMonthChange={(month) => setCurrentMonth(month.dateString.substring(0, 7))}
        monthFormat="MMMM yyyy"
        firstDay={1}
        enableSwipeMonths
        hideExtraDays
        current={selectedDate}
        initialDate={selectedDate}
      />

      <View style={styles.legendContainer}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: '#3498db' }]} />
          <Text style={styles.legendText}>Abonnements</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: '#e74c3c' }]} />
          <Text style={styles.legendText}>Paiements échelonnés</Text>
        </View>
      </View>

      <Text style={styles.sectionTitle}>
        Paiements du {format(parse(selectedDate, 'yyyy-MM-dd', new Date()), 'dd/MM/yyyy', { locale: fr })}
      </Text>

      {isLoading ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>Chargement...</Text>
        </View>
      ) : error ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>{error}</Text>
        </View>
      ) : paymentsForSelectedDate.length > 0 ? (
        <FlatList
          data={paymentsForSelectedDate}
          renderItem={renderPaymentItem}
          keyExtractor={(item) => item.id}
          style={styles.list}
        />
      ) : (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>Aucun paiement prévu pour cette date</Text>
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
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    flex: 1,
  },
  todayButton: {
    backgroundColor: '#3498db',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
  },
  todayButtonText: {
    color: 'white',
    fontWeight: '500',
  },
  calendar: {
    borderRadius: 10,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    marginBottom: 20,
  },
  legendContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
    paddingHorizontal: 10,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 6,
  },
  legendText: {
    fontSize: 14,
    color: '#7f8c8d',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '500',
    marginBottom: 10,
    textTransform: 'capitalize',
  },
  list: {
    width: '100%',
  },
  paymentItem: {
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
  paymentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  paymentDescription: {
    fontSize: 16,
    fontWeight: '500',
    flex: 1,
    marginRight: 12,
  },
  paymentAmount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#e74c3c',
  },
  paymentDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  paymentType: {
    fontSize: 14,
    color: '#7f8c8d',
    fontStyle: 'italic',
  },
  paymentBank: {
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
