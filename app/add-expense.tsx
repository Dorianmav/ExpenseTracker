import React, { useEffect, useState } from 'react';
import { Alert, StyleSheet, TouchableOpacity, TextInput, ScrollView } from 'react-native';
import { Text, View, useThemeColor } from '@/components/Themed';
import { router } from 'expo-router';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import DateTimePicker from '@react-native-community/datetimepicker';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Bank, Category, expenseService, PaymentType } from '@/services/expenseService';

export default function AddExpenseScreen() {
  const cardColor = useThemeColor({}, 'card');
  const borderColor = useThemeColor({}, 'border');
  const textColor = useThemeColor({}, 'text');
  const mutedColor = useThemeColor({}, 'muted');
  const primaryColor = useThemeColor({}, 'primary');
  const successColor = useThemeColor({}, 'success');
  const inputStyle = [styles.input, { backgroundColor: cardColor, borderColor, color: textColor }];
  const dateButtonStyle = [styles.dateButton, { backgroundColor: cardColor, borderColor }];
  const inactivePillStyle = { backgroundColor: cardColor, borderColor };
  const activePrimaryPillStyle = { backgroundColor: primaryColor, borderColor: primaryColor };
  const activeSuccessPillStyle = { backgroundColor: successColor, borderColor: successColor };
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);

  const [categories, setCategories] = useState<Category[]>([]);
  const [banks, setBanks] = useState<Bank[]>([]);
  const [selectedMainCategory, setSelectedMainCategory] = useState<number | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [selectedBank, setSelectedBank] = useState<number | null>(null);
  const [paymentType, setPaymentType] = useState<PaymentType>('simple');

  const [frequency, setFrequency] = useState<'weekly' | 'monthly' | 'yearly'>('monthly');
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);

  const [totalAmount, setTotalAmount] = useState('');
  const [numberOfPayments, setNumberOfPayments] = useState('');
  const [installmentDates, setInstallmentDates] = useState<Date[]>([]);
  const [showInstallmentDatePicker, setShowInstallmentDatePicker] = useState(false);
  const [currentInstallmentIndex, setCurrentInstallmentIndex] = useState(0);

  const [isLoadingOptions, setIsLoadingOptions] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isActive = true;

    const loadOptions = async () => {
      setIsLoadingOptions(true);
      setError(null);

      try {
        const [apiCategories, apiBanks] = await Promise.all([
          expenseService.getCategories(),
          expenseService.getBanks(),
        ]);

        if (!isActive) return;

        setCategories(apiCategories);
        setBanks(apiBanks);

        const firstMainCategory = apiCategories.find((category) => category.parentId === null);
        setSelectedMainCategory(firstMainCategory?.id ?? apiCategories[0]?.id ?? null);
        setSelectedCategory(firstMainCategory?.id ?? apiCategories[0]?.id ?? null);
        setSelectedBank(apiBanks[0]?.id ?? null);
      } catch (loadError) {
        console.error(loadError);
        if (isActive) setError('Impossible de charger les catégories et banques');
      } finally {
        if (isActive) setIsLoadingOptions(false);
      }
    };

    loadOptions();

    return () => {
      isActive = false;
    };
  }, []);

  const handleSave = async () => {
    const parsedAmount = Number.parseFloat(amount.replace(',', '.'));
    const parsedTotalAmount = Number.parseFloat(totalAmount.replace(',', '.'));
    const parsedNumberOfPayments = Number.parseInt(numberOfPayments, 10);

    if (!selectedCategory || !selectedBank || !description.trim() || Number.isNaN(parsedAmount)) {
      Alert.alert('Champs manquants', 'Renseignez au moins un montant, une description, une catégorie et une banque.');
      return;
    }

    if (paymentType === 'installment' && (Number.isNaN(parsedNumberOfPayments) || parsedNumberOfPayments < 1)) {
      Alert.alert('Paiement échelonné', 'Renseignez un nombre de paiements valide.');
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      await expenseService.addExpense({
        amount: parsedAmount,
        description: description.trim(),
        date,
        categoryId: selectedCategory,
        bankId: selectedBank,
        type: paymentType,
        ...(paymentType === 'subscription' && {
          frequency,
          endDate,
        }),
        ...(paymentType === 'installment' && {
          totalAmount: Number.isNaN(parsedTotalAmount) ? parsedAmount : parsedTotalAmount,
          numberOfPayments: parsedNumberOfPayments,
          installmentDates,
        }),
      });

      router.back();
    } catch (saveError) {
      console.error(saveError);
      setError("Impossible d'enregistrer la dépense");
    } finally {
      setIsSaving(false);
    }
  };

  const onDateChange = (_event: unknown, selectedDate: Date | undefined) => {
    setShowDatePicker(false);
    setDate(selectedDate || date);
  };

  const onEndDateChange = (_event: unknown, selectedDate: Date | undefined) => {
    setShowEndDatePicker(false);
    setEndDate(selectedDate || endDate);
  };

  const onInstallmentDateChange = (_event: unknown, selectedDate: Date | undefined) => {
    const currentDate = selectedDate || new Date();
    setShowInstallmentDatePicker(false);

    const newDates = [...installmentDates];
    newDates[currentInstallmentIndex] = currentDate;
    setInstallmentDates(newDates);
  };

  const updateInstallmentDates = (count: string) => {
    const num = Number.parseInt(count, 10);

    if (Number.isNaN(num) || num <= 0) {
      setInstallmentDates([]);
      return;
    }

    const dates: Date[] = [];

    for (let i = 0; i < num; i += 1) {
      const nextDate = new Date(date);
      nextDate.setMonth(date.getMonth() + i);
      dates.push(nextDate);
    }

    setInstallmentDates(dates);
  };

  const mainCategories = categories.filter((category) => category.parentId === null);
  const subCategories = categories.filter((category) => category.parentId === selectedMainCategory);

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Ajouter une dépense</Text>

      {error && <Text style={styles.errorText}>{error}</Text>}
      {isLoadingOptions && <Text style={styles.loadingText}>Chargement...</Text>}

      <View style={styles.inputContainer}>
        <Text style={styles.label}>Montant</Text>
        <TextInput
          style={inputStyle}
          placeholderTextColor={mutedColor}
          value={amount}
          onChangeText={setAmount}
          placeholder="0.00"
          keyboardType="numeric"
        />
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.label}>Description</Text>
        <TextInput
          style={inputStyle}
          placeholderTextColor={mutedColor}
          value={description}
          onChangeText={setDescription}
          placeholder="Description de la dépense"
        />
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.label}>Date</Text>
        <TouchableOpacity style={dateButtonStyle} onPress={() => setShowDatePicker(true)}>
          <Text>{format(date, 'dd/MM/yyyy', { locale: fr })}</Text>
          <FontAwesome name="calendar" size={20} color={primaryColor} />
        </TouchableOpacity>
        {showDatePicker && (
          <DateTimePicker value={date} mode="date" display="default" onChange={onDateChange} />
        )}
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.label}>Type de paiement</Text>
        <View style={styles.paymentTypeContainer}>
          <TouchableOpacity
            style={[styles.paymentTypeButton, inactivePillStyle, paymentType === 'simple' && activePrimaryPillStyle]}
            onPress={() => setPaymentType('simple')}
          >
            <Text style={paymentType === 'simple' ? styles.paymentTypeTextActive : styles.paymentTypeText}>
              Simple
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.paymentTypeButton, inactivePillStyle, paymentType === 'subscription' && activePrimaryPillStyle]}
            onPress={() => setPaymentType('subscription')}
          >
            <Text style={paymentType === 'subscription' ? styles.paymentTypeTextActive : styles.paymentTypeText}>
              Abonnement
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.paymentTypeButton, inactivePillStyle, paymentType === 'installment' && activePrimaryPillStyle]}
            onPress={() => setPaymentType('installment')}
          >
            <Text style={paymentType === 'installment' ? styles.paymentTypeTextActive : styles.paymentTypeText}>
              Plusieurs fois
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {paymentType === 'subscription' && (
        <>
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Fréquence</Text>
            <View style={styles.paymentTypeContainer}>
              {[
                ['monthly', 'Mensuel'],
                ['yearly', 'Annuel'],
                ['weekly', 'Hebdo'],
              ].map(([value, label]) => (
                <TouchableOpacity
                  key={value}
                  style={[styles.frequencyButton, inactivePillStyle, frequency === value && activePrimaryPillStyle]}
                  onPress={() => setFrequency(value as typeof frequency)}
                >
                  <Text style={frequency === value ? styles.paymentTypeTextActive : styles.paymentTypeText}>
                    {label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Date de fin (optionnelle)</Text>
            <TouchableOpacity style={dateButtonStyle} onPress={() => setShowEndDatePicker(true)}>
              <Text>{endDate ? format(endDate, 'dd/MM/yyyy', { locale: fr }) : 'Non définie'}</Text>
              <FontAwesome name="calendar" size={20} color={primaryColor} />
            </TouchableOpacity>
            {showEndDatePicker && (
              <DateTimePicker
                value={endDate || new Date()}
                mode="date"
                display="default"
                onChange={onEndDateChange}
              />
            )}
          </View>
        </>
      )}

      {paymentType === 'installment' && (
        <>
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Montant total</Text>
            <TextInput
              style={inputStyle}
              placeholderTextColor={mutedColor}
              value={totalAmount}
              onChangeText={setTotalAmount}
              placeholder={amount || '0.00'}
              keyboardType="numeric"
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Nombre de paiements</Text>
            <TextInput
              style={inputStyle}
              placeholderTextColor={mutedColor}
              value={numberOfPayments}
              onChangeText={(value) => {
                setNumberOfPayments(value);
                updateInstallmentDates(value);
              }}
              placeholder="3"
              keyboardType="numeric"
            />
          </View>

          {installmentDates.length > 0 && (
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Dates des paiements</Text>
              {installmentDates.map((installmentDate, index) => (
                <TouchableOpacity
                  key={`${installmentDate.toISOString()}-${index}`}
                  style={dateButtonStyle}
                  onPress={() => {
                    setCurrentInstallmentIndex(index);
                    setShowInstallmentDatePicker(true);
                  }}
                >
                  <Text>
                    Paiement {index + 1}: {format(installmentDate, 'dd/MM/yyyy', { locale: fr })}
                  </Text>
                  <FontAwesome name="calendar" size={20} color={primaryColor} />
                </TouchableOpacity>
              ))}
              {showInstallmentDatePicker && (
                <DateTimePicker
                  value={installmentDates[currentInstallmentIndex] || new Date()}
                  mode="date"
                  display="default"
                  onChange={onInstallmentDateChange}
                />
              )}
            </View>
          )}
        </>
      )}

      <View style={styles.inputContainer}>
        <Text style={styles.label}>Catégorie</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoriesContainer}>
          {mainCategories.map((category) => (
            <TouchableOpacity
              key={category.id}
              style={[
                styles.categoryButton,
                inactivePillStyle,
                selectedMainCategory === category.id && activePrimaryPillStyle,
              ]}
              onPress={() => {
                setSelectedMainCategory(category.id);
                setSelectedCategory(category.id);
              }}
            >
              <Text style={selectedMainCategory === category.id ? styles.categoryTextActive : styles.categoryText}>
                {category.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {subCategories.length > 0 && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.subCategoriesContainer}>
            {subCategories.map((subCategory) => (
              <TouchableOpacity
                key={subCategory.id}
                style={[
                  styles.subCategoryButton,
                  inactivePillStyle,
                  selectedCategory === subCategory.id && activePrimaryPillStyle,
                ]}
                onPress={() => setSelectedCategory(subCategory.id)}
              >
                <Text style={selectedCategory === subCategory.id ? styles.categoryTextActive : styles.categoryText}>
                  {subCategory.name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.label}>Banque</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoriesContainer}>
          {banks.map((bank) => (
            <TouchableOpacity
              key={bank.id}
              style={[
                styles.bankButton,
                inactivePillStyle,
                selectedBank === bank.id && activeSuccessPillStyle,
              ]}
              onPress={() => setSelectedBank(bank.id)}
            >
              <Text style={selectedBank === bank.id ? styles.bankTextActive : styles.bankText}>{bank.name}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <TouchableOpacity
        style={[
          styles.saveButton,
          { backgroundColor: primaryColor },
          (isSaving || isLoadingOptions) && styles.saveButtonDisabled,
        ]}
        onPress={handleSave}
        disabled={isSaving || isLoadingOptions}
      >
        <Text style={styles.saveButtonText}>{isSaving ? 'Enregistrement...' : 'Enregistrer'}</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    paddingTop: 48,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  loadingText: {
    marginBottom: 12,
    color: '#7f8c8d',
  },
  errorText: {
    marginBottom: 12,
    color: '#e74c3c',
    fontWeight: '500',
  },
  inputContainer: {
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    marginBottom: 8,
    fontWeight: '500',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  dateButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  paymentTypeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  paymentTypeButton: {
    flex: 1,
    padding: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
    marginHorizontal: 4,
    borderRadius: 8,
  },
  paymentTypeButtonActive: {
    backgroundColor: '#3498db',
    borderColor: '#3498db',
  },
  paymentTypeText: {
  },
  paymentTypeTextActive: {
    color: 'white',
    fontWeight: 'bold',
  },
  frequencyButton: {
    flex: 1,
    padding: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
    marginHorizontal: 4,
    borderRadius: 8,
  },
  categoriesContainer: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  categoryButton: {
    padding: 10,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 20,
    marginRight: 8,
    minWidth: 80,
    alignItems: 'center',
  },
  categoryButtonActive: {
    backgroundColor: '#3498db',
    borderColor: '#3498db',
  },
  categoryText: {
  },
  categoryTextActive: {
    color: 'white',
    fontWeight: 'bold',
  },
  subCategoriesContainer: {
    flexDirection: 'row',
    marginTop: 8,
  },
  subCategoryButton: {
    padding: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 16,
    marginRight: 8,
    minWidth: 70,
    alignItems: 'center',
  },
  bankButton: {
    padding: 10,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 20,
    marginRight: 8,
    minWidth: 80,
    alignItems: 'center',
  },
  bankButtonActive: {
    backgroundColor: '#2ecc71',
    borderColor: '#2ecc71',
  },
  bankText: {
  },
  bankTextActive: {
    color: 'white',
    fontWeight: 'bold',
  },
  saveButton: {
    backgroundColor: '#3498db',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 40,
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
});
