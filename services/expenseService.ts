import { format } from 'date-fns';

// Types
export type Expense = {
  id: string;
  amount: number;
  description: string;
  category: string;
  bank: string;
  date: Date;
  type: 'simple' | 'subscription' | 'installment';
  subscriptionId?: string;
  installmentId?: string;
};

export type PaymentEvent = {
  id: string;
  date: string; // Format: 'YYYY-MM-DD'
  amount: number;
  description: string;
  type: 'subscription' | 'installment';
  category: string;
  bank: string;
};

// Données temporaires pour les dépenses
let expenses: Expense[] = [
  { id: '1', amount: 15.99, description: 'Repas du midi', category: 'Alimentation', bank: 'BNP', date: new Date(), type: 'simple' },
  { id: '2', amount: 35.50, description: 'Essence', category: 'Transport', bank: 'Société Générale', date: new Date(), type: 'simple' },
  { id: '3', amount: 9.99, description: 'Abonnement Netflix', category: 'Loisirs', bank: 'Boursorama', date: new Date(), type: 'subscription' },
];

// Données temporaires pour les paiements à venir
let upcomingPayments: PaymentEvent[] = [
  { 
    id: '1', 
    date: '2025-09-20', 
    amount: 9.99, 
    description: 'Netflix', 
    type: 'subscription',
    category: 'Loisirs',
    bank: 'Boursorama'
  },
  { 
    id: '2', 
    date: '2025-09-25', 
    amount: 150.00, 
    description: 'Loyer', 
    type: 'subscription',
    category: 'Logement',
    bank: 'BNP'
  },
  { 
    id: '3', 
    date: '2025-09-30', 
    amount: 50.00, 
    description: 'Téléphone (2/12)', 
    type: 'installment',
    category: 'Tech',
    bank: 'Société Générale'
  },
  { 
    id: '4', 
    date: '2025-10-05', 
    amount: 19.99, 
    description: 'Salle de sport', 
    type: 'subscription',
    category: 'Sport',
    bank: 'BNP'
  },
];

// Service pour gérer les dépenses
export const expenseService = {
  // Récupérer toutes les dépenses
  getAllExpenses: (): Expense[] => {
    return [...expenses];
  },
  
  // Récupérer les dépenses du jour
  getTodayExpenses: (): Expense[] => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    return expenses.filter(expense => {
      const expenseDate = new Date(expense.date);
      expenseDate.setHours(0, 0, 0, 0);
      return expenseDate.getTime() === today.getTime();
    });
  },
  
  // Récupérer tous les paiements à venir
  getAllUpcomingPayments: (): PaymentEvent[] => {
    return [...upcomingPayments];
  },
  
  // Récupérer les paiements pour une date spécifique
  getPaymentsForDate: (date: string): PaymentEvent[] => {
    return upcomingPayments.filter(payment => payment.date === date);
  },
  
  // Ajouter une nouvelle dépense
  addExpense: (expense: Omit<Expense, 'id'>): Expense => {
    const newId = (expenses.length + 1).toString();
    const newExpense = { ...expense, id: newId };
    expenses = [newExpense, ...expenses];
    
    // Si c'est un abonnement ou un paiement en plusieurs fois, ajouter aux paiements à venir
    if (expense.type === 'subscription' || expense.type === 'installment') {
      expenseService.addUpcomingPayment(expense);
    }
    
    return newExpense;
  },
  
  // Ajouter un paiement à venir
  addUpcomingPayment: (expense: Omit<Expense, 'id'>) => {
    let newPayments: PaymentEvent[] = [];
    
    if (expense.type === 'subscription') {
      // Pour les abonnements, ajouter plusieurs paiements selon la fréquence
      const frequency = (expense as any).frequency || 'monthly';
      const startDate = expense.date;
      const endDate = (expense as any).endDate;
      
      // Déterminer combien de paiements générer (max 12 si pas de date de fin)
      const maxPayments = 12;
      let currentDate = new Date(startDate);
      let paymentCount = 0;
      
      while (paymentCount < maxPayments && (!endDate || currentDate <= endDate)) {
        const paymentId = (upcomingPayments.length + newPayments.length + 1).toString();
        const paymentDate = format(currentDate, 'yyyy-MM-dd');
        
        newPayments.push({
          id: paymentId,
          date: paymentDate,
          amount: expense.amount,
          description: expense.description,
          type: 'subscription',
          category: expense.category,
          bank: expense.bank
        });
        
        // Avancer à la prochaine date selon la fréquence
        if (frequency === 'monthly') {
          currentDate.setMonth(currentDate.getMonth() + 1);
        } else if (frequency === 'yearly') {
          currentDate.setFullYear(currentDate.getFullYear() + 1);
        } else if (frequency === 'weekly') {
          currentDate.setDate(currentDate.getDate() + 7);
        }
        
        paymentCount++;
      }
    } 
    else if (expense.type === 'installment') {
      // Pour les paiements en plusieurs fois, ajouter tous les paiements
      const numberOfPayments = (expense as any).numberOfPayments || 1;
      const installmentDates = (expense as any).installmentDates || [];
      
      // Si des dates spécifiques ont été fournies, les utiliser
      if (installmentDates && installmentDates.length > 0) {
        for (let i = 0; i < Math.min(numberOfPayments, installmentDates.length); i++) {
          const paymentId = (upcomingPayments.length + newPayments.length + 1).toString();
          const paymentDate = format(installmentDates[i], 'yyyy-MM-dd');
          
          newPayments.push({
            id: paymentId,
            date: paymentDate,
            amount: expense.amount,
            description: `${expense.description} (${i+1}/${numberOfPayments})`,
            type: 'installment',
            category: expense.category,
            bank: expense.bank
          });
        }
      } 
      // Sinon, générer des dates mensuelles par défaut
      else {
        const startDate = expense.date;
        
        for (let i = 0; i < numberOfPayments; i++) {
          const paymentId = (upcomingPayments.length + newPayments.length + 1).toString();
          const currentDate = new Date(startDate);
          currentDate.setMonth(currentDate.getMonth() + i);
          const paymentDate = format(currentDate, 'yyyy-MM-dd');
          
          newPayments.push({
            id: paymentId,
            date: paymentDate,
            amount: expense.amount,
            description: `${expense.description} (${i+1}/${numberOfPayments})`,
            type: 'installment',
            category: expense.category,
            bank: expense.bank
          });
        }
      }
    }
    
    // Ajouter tous les nouveaux paiements
    upcomingPayments = [...upcomingPayments, ...newPayments];
    return upcomingPayments;
  }
};
