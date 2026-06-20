import React from 'react';
import { StyleSheet, TouchableOpacity } from 'react-native';
import { Text, View, useThemeColor } from '@/components/Themed';
import { Expense, PaymentEvent } from '@/services/expenseService';

export type ExpenseListItemData =
  | Expense
  | (Omit<PaymentEvent, 'date'> & { date: Date; occurrenceId: number });

type ExpenseListItemProps = {
  item: ExpenseListItemData;
  onPress: () => void;
};

const getPaymentTypeLabel = (type: ExpenseListItemData['type']) => {
  if (type === 'subscription') return 'Abonnement';
  if (type === 'installment') return 'Paiement échelonné';
  return 'Paiement simple';
};

export function ExpenseListItem({ item, onPress }: ExpenseListItemProps) {
  const cardColor = useThemeColor({}, 'card');
  const borderColor = useThemeColor({}, 'border');
  const mutedColor = useThemeColor({}, 'muted');
  const dangerColor = useThemeColor({}, 'danger');

  return (
    <TouchableOpacity
      activeOpacity={0.82}
      style={[styles.card, { backgroundColor: cardColor, borderColor }]}
      onPress={onPress}
    >
      <View style={styles.header} lightColor={cardColor} darkColor={cardColor}>
        <View style={styles.titleGroup} lightColor={cardColor} darkColor={cardColor}>
          <Text numberOfLines={1} style={styles.description}>
            {item.description}
          </Text>
          <Text numberOfLines={1} style={[styles.meta, { color: mutedColor }]}>
            {item.category || getPaymentTypeLabel(item.type)}
          </Text>
        </View>
        <Text style={[styles.amount, { color: dangerColor }]}>{item.amount.toFixed(2)} €</Text>
      </View>

      <View
        style={[styles.footer, { borderTopColor: borderColor }]}
        lightColor={cardColor}
        darkColor={cardColor}
      >
        <Text numberOfLines={1} style={[styles.footerText, { color: mutedColor }]}>
          {getPaymentTypeLabel(item.type)}
        </Text>
        <Text numberOfLines={1} style={[styles.footerText, styles.footerTextRight, { color: mutedColor }]}>
          {item.type === 'simple' ? item.bank : 'ownerId' in item ? item.bank || 'Paiement planifié' : item.bank}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderRadius: 20,
    padding: 16,
    marginBottom: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  titleGroup: {
    flex: 1,
    minWidth: 0,
  },
  description: {
    fontSize: 17,
    fontWeight: '800',
    lineHeight: 22,
  },
  meta: {
    marginTop: 5,
    fontSize: 14,
    fontWeight: '600',
  },
  amount: {
    fontSize: 18,
    fontWeight: '900',
  },
  footer: {
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  footerText: {
    flex: 1,
    fontSize: 13,
    fontWeight: '700',
  },
  footerTextRight: {
    textAlign: 'right',
  },
});
