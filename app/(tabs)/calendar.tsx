import React, { useState, useEffect } from 'react';
import { StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { Text, View } from '@/components/Themed';
import { Calendar } from 'react-native-calendars';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useFocusEffect } from '@react-navigation/native';
import { expenseService, PaymentEvent } from '@/services/expenseService';

type MarkedDates = {
  [date: string]: {
    selected?: boolean;
    marked?: boolean;
    dotColor?: string;
    selectedColor?: string;
  };
};

export default function CalendarScreen() {
  const today = format(new Date(), 'yyyy-MM-dd');
  const [selectedDate, setSelectedDate] = useState(today);
  const [upcomingPayments, setUpcomingPayments] = useState<PaymentEvent[]>([]);
  const [currentMonth, setCurrentMonth] = useState(format(new Date(), 'yyyy-MM'));
  // Utiliser un état séparé pour forcer le calendrier à se mettre à jour
  const [calendarKey, setCalendarKey] = useState(0);
  
  const goToToday = () => {
    setSelectedDate(today);
    // Incrémenter la clé pour forcer le calendrier à se réinitialiser
    setCalendarKey(prevKey => prevKey + 1);
  };
  
  // Charger les paiements à chaque fois que l'écran est affiché
  useFocusEffect(
    React.useCallback(() => {
      const loadPayments = () => {
        const payments = expenseService.getAllUpcomingPayments();
        setUpcomingPayments(payments);
      };
      
      loadPayments();
      
      return () => {};
    }, [])
  );
  
  // Préparer les marqueurs pour le calendrier
  const markedDates: MarkedDates = upcomingPayments.reduce((acc: MarkedDates, payment) => {
    // Vérifier si cette date existe déjà dans l'accumulateur
    const existingDate = acc[payment.date];
    
    if (existingDate && existingDate.marked) {
      // Si la date existe déjà et est marquée, vérifions les types
      const existingType = existingDate.dotColor === '#3498db' ? 'subscription' : 'installment';
      
      // Si les types sont différents, utiliser la couleur pour "les deux"
      if (existingType !== payment.type) {
        return {
          ...acc,
          [payment.date]: { 
            marked: true, 
            dotColor: '#8e728c', // Couleur pour "les deux"
            selected: payment.date === selectedDate,
            selectedColor: payment.date === selectedDate ? '#2ecc71' : undefined
          }
        };
      }
    }
    
    // Sinon, ajouter normalement
    return {
      ...acc,
      [payment.date]: { 
        marked: true, 
        dotColor: payment.type === 'subscription' ? '#3498db' : '#e74c3c',
        selected: payment.date === selectedDate,
        selectedColor: payment.date === selectedDate ? '#2ecc71' : undefined
      }
    };
  }, {
    [selectedDate]: { selected: true, selectedColor: '#2ecc71' }
  });
  
  // Filtrer les paiements pour la date sélectionnée
  const paymentsForSelectedDate = upcomingPayments.filter(
    payment => payment.date === selectedDate
  );
  
  const renderPaymentItem = ({ item }: { item: PaymentEvent }) => (
    <TouchableOpacity style={styles.paymentItem}>
      <View style={styles.paymentHeader}>
        <Text style={styles.paymentDescription}>{item.description}</Text>
        <Text style={styles.paymentAmount}>{item.amount.toFixed(2)} €</Text>
      </View>
      <View style={styles.paymentDetails}>
        <Text style={styles.paymentCategory}>{item.category}</Text>
        <Text style={styles.paymentType}>
          {item.type === 'subscription' ? 'Abonnement' : 'Paiement échelonné'}
        </Text>
        <Text style={styles.paymentBank}>{item.bank}</Text>
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
        markedDates={markedDates}
        onDayPress={(day) => setSelectedDate(day.dateString)}
        onMonthChange={(month) => setCurrentMonth(month.dateString.substring(0, 7))}
        monthFormat={'MMMM yyyy'}
        hideExtraDays={true}
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
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: '#8e728c' }]} />
          <Text style={styles.legendText}>Les deux</Text>
        </View>
      </View>
      
      <Text style={styles.sectionTitle}>
        Paiements du {format(new Date(selectedDate), 'dd-MM-yyyy', { locale: fr })}
      </Text>
      
      {paymentsForSelectedDate.length > 0 ? (
        <FlatList
          data={paymentsForSelectedDate}
          renderItem={renderPaymentItem}
          keyExtractor={item => item.id}
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
  paymentCategory: {
    fontSize: 14,
    color: '#7f8c8d',
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
  },
});
