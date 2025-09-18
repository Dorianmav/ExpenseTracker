import React, { useState } from 'react';
import { StyleSheet, TouchableOpacity, TextInput, ScrollView, Switch } from 'react-native';
import { Text, View } from '@/components/Themed';
import { router } from 'expo-router';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import DateTimePicker from '@react-native-community/datetimepicker';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { expenseService } from '@/services/expenseService';

// Types de paiement
type PaymentType = 'simple' | 'subscription' | 'installment';

// Données temporaires pour les catégories
const TEMP_CATEGORIES = [
  { id: '1', name: 'Alimentation', parentId: null },
  { id: '2', name: 'Transport', parentId: null },
  { id: '3', name: 'Loisirs', parentId: null },
  { id: '4', name: 'Restaurant', parentId: '1' },
  { id: '5', name: 'Fast Food', parentId: '1' },
  { id: '6', name: 'Train', parentId: '2' },
  { id: '7', name: 'Voiture', parentId: '2' },
  { id: '8', name: 'Sport', parentId: '3' },
  { id: '9', name: 'Manga', parentId: '3' },
  { id: '10', name: 'Soirée', parentId: '3' },
];

// Données temporaires pour les banques
const TEMP_BANKS = [
  { id: '1', name: 'BNP' },
  { id: '2', name: 'Société Générale' },
  { id: '3', name: 'Boursorama' },
];

export default function AddExpenseScreen() {
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedBank, setSelectedBank] = useState('');
  const [paymentType, setPaymentType] = useState<PaymentType>('simple');
  
  // États spécifiques aux abonnements
  const [frequency, setFrequency] = useState('monthly');
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);
  
  // États spécifiques aux paiements en plusieurs fois
  const [totalAmount, setTotalAmount] = useState('');
  const [numberOfPayments, setNumberOfPayments] = useState('');
  const [installmentDates, setInstallmentDates] = useState<Date[]>([]);
  const [showInstallmentDatePicker, setShowInstallmentDatePicker] = useState(false);
  const [currentInstallmentIndex, setCurrentInstallmentIndex] = useState(0);
  
  const handleSave = () => {
    // Trouver la catégorie et la banque sélectionnées
    const selectedCategoryObj = TEMP_CATEGORIES.find(cat => cat.id === selectedCategory);
    const selectedBankObj = TEMP_BANKS.find(bank => bank.id === selectedBank);
    
    if (!selectedCategoryObj || !selectedBankObj || !amount) {
      // Normalement, on afficherait une erreur à l'utilisateur
      console.error('Veuillez remplir tous les champs obligatoires');
      return;
    }
    
    // Créer l'objet dépense
    const newExpense = {
      amount: parseFloat(amount),
      description,
      date,
      category: selectedCategoryObj.name,
      bank: selectedBankObj.name,
      type: paymentType,
      // Données spécifiques selon le type
      ...(paymentType === 'subscription' && {
        frequency,
        endDate,
      }),
      ...(paymentType === 'installment' && {
        totalAmount: parseFloat(totalAmount || '0'),
        numberOfPayments: parseInt(numberOfPayments || '0'),
        installmentDates: installmentDates,
      }),
    };
    
    // Ajouter la dépense via le service
    expenseService.addExpense(newExpense);
    
    console.log('Dépense ajoutée:', newExpense);
    
    // Retourner à l'écran précédent
    router.back();
  };
  
  const onDateChange = (_event: any, selectedDate: Date | undefined) => {
    const currentDate = selectedDate || date;
    setShowDatePicker(false);
    setDate(currentDate);
  };
  
  const onEndDateChange = (_event: any, selectedDate: Date | undefined) => {
    const currentDate = selectedDate || endDate;
    setShowEndDatePicker(false);
    setEndDate(currentDate);
  };
  
  const onInstallmentDateChange = (_event: any, selectedDate: Date | undefined) => {
    const currentDate = selectedDate || new Date();
    setShowInstallmentDatePicker(false);
    
    // Mettre à jour la date du paiement échelonné actuel
    const newDates = [...installmentDates];
    newDates[currentInstallmentIndex] = currentDate;
    setInstallmentDates(newDates);
  };
  
  // Générer les champs de dates pour les paiements échelonnés
  const updateInstallmentDates = (count: string) => {
    const num = parseInt(count);
    if (isNaN(num) || num <= 0) {
      setInstallmentDates([]);
      return;
    }
    
    // Créer un tableau avec le nombre de dates nécessaires
    const dates: Date[] = [];
    const today = new Date();
    
    // Première date = aujourd'hui
    dates.push(today);
    
    // Générer des dates par défaut pour les autres paiements (mensuels)
    for (let i = 1; i < num; i++) {
      const nextDate = new Date(today);
      nextDate.setMonth(today.getMonth() + i);
      dates.push(nextDate);
    }
    
    setInstallmentDates(dates);
  };
  
  // Filtrer les catégories principales (sans parent)
  const mainCategories = TEMP_CATEGORIES.filter(cat => cat.parentId === null);
  
  // Filtrer les sous-catégories si une catégorie principale est sélectionnée
  const subCategories = TEMP_CATEGORIES.filter(cat => cat.parentId === selectedCategory);

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Ajouter une dépense</Text>
      
      {/* Montant */}
      <View style={styles.inputContainer}>
        <Text style={styles.label}>Montant</Text>
        <TextInput
          style={styles.input}
          value={amount}
          onChangeText={setAmount}
          placeholder="0.00"
          keyboardType="numeric"
        />
      </View>
      
      {/* Description */}
      <View style={styles.inputContainer}>
        <Text style={styles.label}>Description</Text>
        <TextInput
          style={styles.input}
          value={description}
          onChangeText={setDescription}
          placeholder="Description de la dépense"
        />
      </View>
      
      {/* Date */}
      <View style={styles.inputContainer}>
        <Text style={styles.label}>Date</Text>
        <TouchableOpacity 
          style={styles.dateButton}
          onPress={() => setShowDatePicker(true)}
        >
          <Text>{format(date, 'dd/MM/yyyy', { locale: fr })}</Text>
          <FontAwesome name="calendar" size={20} color="#3498db" />
        </TouchableOpacity>
        {showDatePicker && (
          <DateTimePicker
            value={date}
            mode="date"
            display="default"
            onChange={onDateChange}
          />
        )}
      </View>
      
      {/* Type de paiement */}
      <View style={styles.inputContainer}>
        <Text style={styles.label}>Type de paiement</Text>
        <View style={styles.paymentTypeContainer}>
          <TouchableOpacity
            style={[
              styles.paymentTypeButton,
              paymentType === 'simple' && styles.paymentTypeButtonActive
            ]}
            onPress={() => setPaymentType('simple')}
          >
            <Text style={paymentType === 'simple' ? styles.paymentTypeTextActive : styles.paymentTypeText}>
              Simple
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[
              styles.paymentTypeButton,
              paymentType === 'subscription' && styles.paymentTypeButtonActive
            ]}
            onPress={() => setPaymentType('subscription')}
          >
            <Text style={paymentType === 'subscription' ? styles.paymentTypeTextActive : styles.paymentTypeText}>
              Abonnement
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[
              styles.paymentTypeButton,
              paymentType === 'installment' && styles.paymentTypeButtonActive
            ]}
            onPress={() => setPaymentType('installment')}
          >
            <Text style={paymentType === 'installment' ? styles.paymentTypeTextActive : styles.paymentTypeText}>
              Plusieurs fois
            </Text>
          </TouchableOpacity>
        </View>
      </View>
      
      {/* Champs spécifiques aux abonnements */}
      {paymentType === 'subscription' && (
        <>
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Fréquence</Text>
            <View style={styles.paymentTypeContainer}>
              <TouchableOpacity
                style={[
                  styles.frequencyButton,
                  frequency === 'monthly' && styles.paymentTypeButtonActive
                ]}
                onPress={() => setFrequency('monthly')}
              >
                <Text style={frequency === 'monthly' ? styles.paymentTypeTextActive : styles.paymentTypeText}>
                  Mensuel
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[
                  styles.frequencyButton,
                  frequency === 'yearly' && styles.paymentTypeButtonActive
                ]}
                onPress={() => setFrequency('yearly')}
              >
                <Text style={frequency === 'yearly' ? styles.paymentTypeTextActive : styles.paymentTypeText}>
                  Annuel
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[
                  styles.frequencyButton,
                  frequency === 'weekly' && styles.paymentTypeButtonActive
                ]}
                onPress={() => setFrequency('weekly')}
              >
                <Text style={frequency === 'weekly' ? styles.paymentTypeTextActive : styles.paymentTypeText}>
                  Hebdo
                </Text>
              </TouchableOpacity>
            </View>
          </View>
          
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Date de fin (optionnelle)</Text>
            <TouchableOpacity 
              style={styles.dateButton}
              onPress={() => setShowEndDatePicker(true)}
            >
              <Text>{endDate ? format(endDate, 'dd/MM/yyyy', { locale: fr }) : 'Non définie'}</Text>
              <FontAwesome name="calendar" size={20} color="#3498db" />
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
      
      {/* Champs spécifiques aux paiements en plusieurs fois */}
      {paymentType === 'installment' && (
        <>
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Montant total</Text>
            <TextInput
              style={styles.input}
              value={totalAmount}
              onChangeText={setTotalAmount}
              placeholder="0.00"
              keyboardType="numeric"
            />
          </View>
          
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Nombre de paiements</Text>
            <TextInput
              style={styles.input}
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
              {installmentDates.map((date, index) => (
                <TouchableOpacity 
                  key={index}
                  style={styles.dateButton}
                  onPress={() => {
                    setCurrentInstallmentIndex(index);
                    setShowInstallmentDatePicker(true);
                  }}
                >
                  <Text>Paiement {index + 1}: {format(date, 'dd/MM/yyyy', { locale: fr })}</Text>
                  <FontAwesome name="calendar" size={20} color="#3498db" />
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
      
      {/* Catégorie */}
      <View style={styles.inputContainer}>
        <Text style={styles.label}>Catégorie</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoriesContainer}>
          {mainCategories.map(category => (
            <TouchableOpacity
              key={category.id}
              style={[
                styles.categoryButton,
                selectedCategory === category.id && styles.categoryButtonActive
              ]}
              onPress={() => setSelectedCategory(category.id)}
            >
              <Text style={selectedCategory === category.id ? styles.categoryTextActive : styles.categoryText}>
                {category.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
        
        {/* Sous-catégories */}
        {subCategories.length > 0 && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.subCategoriesContainer}>
            {subCategories.map(subCategory => (
              <TouchableOpacity
                key={subCategory.id}
                style={[
                  styles.subCategoryButton,
                  selectedCategory === subCategory.id && styles.categoryButtonActive
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
      
      {/* Banque */}
      <View style={styles.inputContainer}>
        <Text style={styles.label}>Banque</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoriesContainer}>
          {TEMP_BANKS.map(bank => (
            <TouchableOpacity
              key={bank.id}
              style={[
                styles.bankButton,
                selectedBank === bank.id && styles.bankButtonActive
              ]}
              onPress={() => setSelectedBank(bank.id)}
            >
              <Text style={selectedBank === bank.id ? styles.bankTextActive : styles.bankText}>
                {bank.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
      
      {/* Bouton de sauvegarde */}
      <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
        <Text style={styles.saveButtonText}>Enregistrer</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
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
    color: '#333',
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
    color: '#333',
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
    color: '#333',
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
  saveButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
});
