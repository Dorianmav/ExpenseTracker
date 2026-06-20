import React, { useMemo, useState } from 'react';
import { StyleSheet, FlatList, TouchableOpacity, View as NativeView } from 'react-native';
import { Text, View, useThemeColor } from '@/components/Themed';
import { Calendar, LocaleConfig } from 'react-native-calendars';
import type { DateData } from 'react-native-calendars';
import { addMonths, endOfMonth, format, parse, startOfMonth, subMonths } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useFocusEffect } from '@react-navigation/native';
import { router } from 'expo-router';
import { expenseService, PaymentEvent } from '@/services/expenseService';
import { useThemeMode } from '@/components/ThemeModeProvider';

type CalendarTheme = React.ComponentProps<typeof Calendar>['theme'] & Record<string, unknown>;

type MarkedDates = {
  [date: string]: {
    selected?: boolean;
    selectedColor?: string;
    dots?: {
      key?: string;
      color: string;
    }[];
  };
};

type CalendarDayProps = {
  date?: DateData;
  marking?: MarkedDates[string];
  state?: string;
  onPress?: (date?: DateData) => void;
};

const getProjectionRange = (month: string) => {
  const currentMonthDate = parse(`${month}-01`, 'yyyy-MM-dd', new Date());

  return {
    startDate: startOfMonth(subMonths(currentMonthDate, 1)),
    endDate: endOfMonth(addMonths(currentMonthDate, 1)),
  };
};

LocaleConfig.locales.fr = {
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
  const { colorScheme, paletteName } = useThemeMode();
  const primaryColor = useThemeColor({}, 'primary');
  const secondaryColor = useThemeColor({}, 'secondary');
  const cardColor = useThemeColor({}, 'card');
  const calendarBackground = useThemeColor({}, 'calendarBackground');
  const borderColor = useThemeColor({}, 'border');
  const mutedColor = useThemeColor({}, 'muted');
  const textColor = useThemeColor({}, 'text');
  const dangerColor = useThemeColor({}, 'danger');
  const today = format(new Date(), 'yyyy-MM-dd');
  const [selectedDate, setSelectedDate] = useState(today);
  const [upcomingPayments, setUpcomingPayments] = useState<PaymentEvent[]>([]);
  const [currentMonth, setCurrentMonth] = useState(format(new Date(), 'yyyy-MM'));
  const [calendarKey, setCalendarKey] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const paymentTypeColors = useMemo(
    () => ({
      subscription: secondaryColor,
      installment: dangerColor,
    }),
    [dangerColor, secondaryColor],
  );
  const calendarTheme = useMemo<CalendarTheme>(
    () => ({
      calendarBackground,
      monthTextColor: textColor,
      dayTextColor: textColor,
      textDisabledColor: mutedColor,
      textSectionTitleColor: mutedColor,
      selectedDayBackgroundColor: primaryColor,
      selectedDayTextColor: '#fff',
      todayTextColor: secondaryColor,
      arrowColor: primaryColor,
      dotColor: primaryColor,
      textMonthFontWeight: '800',
      textDayFontWeight: '600',
      'stylesheet.calendar.main': {
        calendarContainer: {
          backgroundColor: calendarBackground,
        },
        week: {
          backgroundColor: calendarBackground,
          marginTop: 3,
          marginBottom: 3,
          flexDirection: 'row',
          justifyContent: 'space-around',
        },
      },
      'stylesheet.calendar.header': {
        header: {
          backgroundColor: calendarBackground,
          flexDirection: 'row',
          justifyContent: 'space-between',
          paddingLeft: 10,
          paddingRight: 10,
          marginTop: 2,
          alignItems: 'center',
        },
        monthText: {
          color: textColor,
          fontSize: 18,
          fontWeight: '800',
          margin: 6,
        },
      },
      'stylesheet.day.basic': {
        base: {
          width: 32,
          height: 30,
          alignItems: 'center',
        },
        selected: {
          backgroundColor: primaryColor,
          borderRadius: 6,
        },
        today: {
          borderRadius: 6,
        },
      },
      stylesheet: {
        calendar: {
          main: {
            calendarContainer: {
              backgroundColor: calendarBackground,
            },
            week: {
              backgroundColor: calendarBackground,
              marginTop: 3,
              marginBottom: 3,
              flexDirection: 'row',
              justifyContent: 'space-around',
            },
          },
        },
        'stylesheet.calendar.main': {
          calendarContainer: {
            backgroundColor: calendarBackground,
          },
          week: {
            backgroundColor: calendarBackground,
            marginTop: 3,
            marginBottom: 3,
            flexDirection: 'row',
            justifyContent: 'space-around',
          },
        },
        day: {
          basic: {
            base: {
              backgroundColor: calendarBackground,
            },
          },
        },
        'calendar.header': {
          header: {
            backgroundColor: calendarBackground,
            flexDirection: 'row',
            justifyContent: 'space-between',
            paddingLeft: 10,
            paddingRight: 10,
            marginTop: 2,
            alignItems: 'center',
          },
          monthText: {
            color: textColor,
            fontSize: 18,
            fontWeight: '800',
            margin: 6,
          },
        },
        'stylesheet.calendar.header': {
          header: {
            backgroundColor: calendarBackground,
            flexDirection: 'row',
            justifyContent: 'space-between',
            paddingLeft: 10,
            paddingRight: 10,
            marginTop: 2,
            alignItems: 'center',
          },
          monthText: {
            color: textColor,
            fontSize: 18,
            fontWeight: '800',
            margin: 6,
          },
        },
        'stylesheet.day.basic': {
          base: {
            width: 32,
            height: 30,
            alignItems: 'center',
          },
          selected: {
            backgroundColor: primaryColor,
            borderRadius: 6,
          },
          today: {
            borderRadius: 6,
          },
        },
      },
    }),
    [calendarBackground, mutedColor, primaryColor, secondaryColor, textColor],
  );

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
      const dotKey = payment.type;

      return {
        ...acc,
        [payment.date]: {
          ...currentDate,
          dots: existingDots.some((dot) => dot.key === dotKey)
            ? existingDots
            : [
                ...existingDots,
                {
                  key: dotKey,
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
        selectedColor: primaryColor,
      },
    };
  }, [paymentTypeColors, selectedDate, upcomingPayments]);

  const paymentsForSelectedDate = upcomingPayments.filter((payment) => payment.date === selectedDate);

  const renderCalendarDay = React.useCallback(
    ({ date, marking, state, onPress }: CalendarDayProps) => {
      if (!date) return null;

      const isSelected = Boolean(marking?.selected);
      const isDisabled = state === 'disabled';
      const isToday = date.dateString === today;
      const dots = marking?.dots ?? [];

      return (
        <TouchableOpacity
          activeOpacity={0.75}
          style={[
            styles.dayCell,
            isSelected && { backgroundColor: primaryColor },
          ]}
          onPress={() => onPress?.(date)}
          disabled={isDisabled}
        >
          <Text
            style={[
              styles.dayText,
              { color: isDisabled ? mutedColor : textColor },
              isToday && !isSelected && { color: secondaryColor },
              isSelected && styles.selectedDayText,
            ]}
          >
            {date.day}
          </Text>
          {dots.length > 0 && (
            <NativeView style={styles.dayDots}>
              {dots.slice(0, 2).map((dot) => (
                <NativeView
              key={dot.key ?? dot.color}
                  style={[
                    styles.dayDot,
                    {
                      backgroundColor: dot.color,
                      borderColor: isSelected ? '#fff' : calendarBackground,
                    },
                  ]}
                />
              ))}
            </NativeView>
          )}
        </TouchableOpacity>
      );
    },
    [calendarBackground, mutedColor, primaryColor, secondaryColor, textColor, today],
  );

  const renderPaymentItem = ({ item }: { item: PaymentEvent }) => (
    <TouchableOpacity
      style={[styles.paymentItem, { backgroundColor: cardColor, borderColor }]}
      onPress={() =>
        router.push({
          pathname: '/payment-detail',
          params: { type: item.type, id: String(item.ownerId) },
        })
      }
    >
      <View style={styles.paymentHeader} lightColor={cardColor} darkColor={cardColor}>
        <Text style={styles.paymentDescription}>{item.description}</Text>
        <Text style={[styles.paymentAmount, { color: dangerColor }]}>{item.amount.toFixed(2)} €</Text>
      </View>
      <View style={styles.paymentDetails} lightColor={cardColor} darkColor={cardColor}>
        <Text style={[styles.paymentType, { color: mutedColor }]}>
          {item.type === 'subscription' ? 'Abonnement' : 'Paiement échelonné'}
        </Text>
        <Text style={[styles.paymentBank, { color: mutedColor }]}>
          {item.status === 'paid' ? 'Payé' : item.status === 'late' ? 'En retard' : 'À venir'}
        </Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.headerContainer}>
        <Text style={styles.title}>Calendrier des paiements</Text>
        <TouchableOpacity style={[styles.todayButton, { backgroundColor: primaryColor }]} onPress={goToToday}>
          <Text style={styles.todayButtonText}>Aujourd'hui</Text>
        </TouchableOpacity>
      </View>

      <Calendar
        key={`${calendarKey}-${paletteName}-${colorScheme}`}
        style={[styles.calendar, { backgroundColor: calendarBackground, borderColor }]}
        theme={calendarTheme}
        markedDates={markedDates}
        dayComponent={renderCalendarDay}
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
          <View style={[styles.legendDot, { backgroundColor: primaryColor }]} />
          <Text style={[styles.legendText, { color: mutedColor }]}>Abonnements</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: dangerColor }]} />
          <Text style={[styles.legendText, { color: mutedColor }]}>Paiements échelonnés</Text>
        </View>
      </View>

      <Text style={styles.sectionTitle}>
        Paiements du {format(parse(selectedDate, 'yyyy-MM-dd', new Date()), 'dd/MM/yyyy', { locale: fr })}
      </Text>

      {isLoading ? (
        <View style={styles.emptyContainer}>
          <Text style={[styles.emptyText, { color: mutedColor }]}>Chargement...</Text>
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
          contentContainerStyle={styles.listContent}
        />
      ) : (
        <View style={styles.emptyContainer}>
          <Text style={[styles.emptyText, { color: mutedColor }]}>Aucun paiement prévu pour cette date</Text>
        </View>
      )}
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
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
    marginBottom: 20,
  },
  title: {
    fontSize: 26,
    fontWeight: '900',
    flex: 1,
  },
  todayButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 24,
  },
  todayButtonText: {
    color: 'white',
    fontWeight: '800',
  },
  dayCell: {
    width: 32,
    height: 32,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  dayText: {
    fontSize: 16,
    fontWeight: '700',
    lineHeight: 22,
  },
  selectedDayText: {
    color: '#fff',
  },
  dayDots: {
    position: 'absolute',
    bottom: 3,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 3,
  },
  dayDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    borderWidth: 1,
  },
  calendar: {
    borderWidth: 1,
    borderRadius: 20,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 18,
    marginBottom: 14,
    paddingBottom: 2,
  },
  legendContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 28,
    marginBottom: 14,
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
    marginRight: 8,
  },
  legendText: {
    fontSize: 14,
    fontWeight: '700',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 12,
    textTransform: 'capitalize',
  },
  list: {
    width: '100%',
  },
  listContent: {
    paddingBottom: 24,
  },
  paymentItem: {
    borderWidth: 1,
    borderRadius: 20,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 3,
  },
  paymentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 10,
  },
  paymentDescription: {
    fontSize: 17,
    fontWeight: '800',
    flex: 1,
  },
  paymentAmount: {
    fontSize: 18,
    fontWeight: '900',
  },
  paymentDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  paymentType: {
    flex: 1,
    fontSize: 14,
    fontWeight: '700',
  },
  paymentBank: {
    flex: 1,
    fontSize: 14,
    fontWeight: '700',
    textAlign: 'right',
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
