import { format, parse } from 'date-fns';
import { API_BASE_URL } from './apiConfig';
import { authService } from './authService';

export type PaymentType = 'simple' | 'subscription' | 'installment';

export type Category = {
  id: number;
  name: string;
  parentId: number | null;
};

export type Bank = {
  id: number;
  name: string;
};

type ApiRelation = {
  id: number;
  name: string;
};

type ApiExpense = {
  id: number;
  amount: number | string;
  description: string;
  date: string;
  type: PaymentType;
  categoryId: number;
  bankId: number;
  category?: ApiRelation | null;
  bank?: ApiRelation | null;
  occurrenceId?: number | null;
};

type CalendarProjectionItem = {
  id: number;
  kind: 'subscription' | 'installment';
  ownerId: number;
  ownerName: string;
  dueDate: string;
  paidDate: string | null;
  expenseId: number | null;
  status: 'pending' | 'paid' | 'skipped' | 'late';
  amount: number | string;
  categoryId: number | null;
  categoryName: string | null;
  bankId: number | null;
  bankName: string | null;
};

export type Expense = {
  id: string;
  amount: number;
  description: string;
  category: string;
  bank: string;
  date: Date;
  type: PaymentType;
  categoryId: number;
  bankId: number;
  occurrenceId?: number | null;
};

export type PaymentEvent = {
  id: string;
  date: string;
  amount: number;
  description: string;
  type: 'subscription' | 'installment';
  category: string;
  bank: string;
  status: CalendarProjectionItem['status'];
  ownerId: number;
  expenseId: number | null;
};

export type OccurrenceStatus = 'pending' | 'paid' | 'skipped' | 'late';

export type PaymentOccurrence = {
  id: number;
  dueDate: string;
  paidDate?: string | null;
  status: OccurrenceStatus;
  amount: number | string;
  expenseId?: number | null;
  occurrenceNumber?: number;
};

export type SubscriptionFrequency = 'weekly' | 'biweekly' | 'monthly' | 'quarterly' | 'yearly';

export type Subscription = {
  id: number;
  name: string;
  amount: number | string;
  frequency: SubscriptionFrequency;
  dayOfMonth: number | null;
  dayOfWeek: number | null;
  startDate: string;
  endDate: string | null;
  isActive: boolean;
  categoryId: number | null;
  bankId: number | null;
  category?: ApiRelation | null;
  bank?: ApiRelation | null;
  occurrences?: PaymentOccurrence[];
};

export type Installment = {
  id: number;
  name: string;
  totalAmount: number | string;
  numberOfPayments: number;
  startDate: string;
  nextPaymentDate: string | null;
  customPaymentDates?: string[] | null;
  isCompleted: boolean;
  categoryId: number | null;
  bankId: number | null;
  category?: ApiRelation | null;
  bank?: ApiRelation | null;
  occurrences?: PaymentOccurrence[];
};

export type CreateExpenseInput = {
  amount: number;
  description: string;
  date: Date;
  categoryId: number;
  bankId: number;
  type: PaymentType;
  frequency?: 'weekly' | 'monthly' | 'quarterly' | 'yearly';
  endDate?: Date | null;
  totalAmount?: number;
  numberOfPayments?: number;
  installmentDates?: Date[];
};

const toFrenchDate = (date: Date) => format(date, 'dd/MM/yyyy');
const toCalendarDate = (date: string) => format(parse(date, 'dd/MM/yyyy', new Date()), 'yyyy-MM-dd');

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = authService.getAccessToken();

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });

  if (!response.ok) {
    if (response.status === 401) {
      authService.logout();
    }

    const errorBody = await response.text();
    throw new Error(errorBody || `Erreur API ${response.status}`);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}

function mapExpense(expense: ApiExpense): Expense {
  return {
    id: String(expense.id),
    amount: Number(expense.amount),
    description: expense.description,
    category: expense.category?.name ?? `Catégorie #${expense.categoryId}`,
    bank: expense.bank?.name ?? `Banque #${expense.bankId}`,
    date: parse(expense.date, 'dd/MM/yyyy', new Date()),
    type: expense.type,
    categoryId: expense.categoryId,
    bankId: expense.bankId,
    occurrenceId: expense.occurrenceId,
  };
}

function mapPaymentEvent(item: CalendarProjectionItem): PaymentEvent {
  return {
    id: `${item.kind}-${item.id}`,
    date: toCalendarDate(item.dueDate),
    amount: Number(item.amount),
    description: item.ownerName,
    type: item.kind,
    category: item.categoryName ?? (item.categoryId ? `Catégorie #${item.categoryId}` : ''),
    bank: item.bankName ?? (item.bankId ? `Banque #${item.bankId}` : ''),
    status: item.status,
    ownerId: item.ownerId,
    expenseId: item.expenseId,
  };
}

export const expenseService = {
  getAllExpenses: async (): Promise<Expense[]> => {
    const expenses = await request<ApiExpense[]>('/expenses');
    return expenses.map(mapExpense);
  },

  getTodayExpenses: async (): Promise<Expense[]> => {
    const expenses = await request<ApiExpense[]>('/expenses/today');
    return expenses.map(mapExpense);
  },

  getExpense: async (id: string | number): Promise<Expense> => {
    const expense = await request<ApiExpense>(`/expenses/${id}`);
    return mapExpense(expense);
  },

  getCategories: (): Promise<Category[]> => request<Category[]>('/categories'),

  getBanks: (): Promise<Bank[]> => request<Bank[]>('/banks'),

  getActiveSubscriptions: (): Promise<Subscription[]> => request<Subscription[]>('/subscriptions/active'),

  getSubscription: (id: string | number): Promise<Subscription> =>
    request<Subscription>(`/subscriptions/${id}`),

  getActiveInstallments: (): Promise<Installment[]> => request<Installment[]>('/installments/active'),

  getInstallment: (id: string | number): Promise<Installment> =>
    request<Installment>(`/installments/${id}`),

  updateOccurrenceStatus: (
    type: 'subscription' | 'installment',
    occurrenceId: number,
    status: OccurrenceStatus,
  ): Promise<{ status: OccurrenceStatus }> =>
    request<{ status: OccurrenceStatus }>(`/calendar/occurrences/${type}/${occurrenceId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    }),

  getAllUpcomingPayments: async (startDate?: Date, endDate?: Date): Promise<PaymentEvent[]> => {
    const params = new URLSearchParams();

    if (startDate) params.set('startDate', toFrenchDate(startDate));
    if (endDate) params.set('endDate', toFrenchDate(endDate));

    const queryString = params.toString();
    const projection = await request<CalendarProjectionItem[]>(
      `/calendar/projection${queryString ? `?${queryString}` : ''}`,
    );

    return projection.map(mapPaymentEvent);
  },

  getPaymentsForDate: async (date: string): Promise<PaymentEvent[]> => {
    const selectedDate = parse(date, 'yyyy-MM-dd', new Date());
    const payments = await expenseService.getAllUpcomingPayments(selectedDate, selectedDate);
    return payments.filter((payment) => payment.date === date);
  },

  addExpense: async (expense: CreateExpenseInput): Promise<Expense | unknown> => {
    if (expense.type === 'subscription') {
      return request('/subscriptions', {
        method: 'POST',
        body: JSON.stringify({
          name: expense.description,
          amount: expense.amount,
          frequency: expense.frequency ?? 'monthly',
          dayOfMonth: expense.date.getDate(),
          dayOfWeek: expense.date.getDay(),
          startDate: toFrenchDate(expense.date),
          endDate: expense.endDate ? toFrenchDate(expense.endDate) : undefined,
          isActive: true,
          categoryId: expense.categoryId,
          bankId: expense.bankId,
        }),
      });
    }

    if (expense.type === 'installment') {
      return request('/installments', {
        method: 'POST',
        body: JSON.stringify({
          name: expense.description,
          totalAmount: expense.totalAmount ?? expense.amount,
          numberOfPayments: expense.numberOfPayments ?? 1,
          startDate: toFrenchDate(expense.date),
          nextPaymentDate: toFrenchDate(expense.date),
          customPaymentDates: expense.installmentDates?.map(toFrenchDate),
          isCompleted: false,
          categoryId: expense.categoryId,
          bankId: expense.bankId,
        }),
      });
    }

    const createdExpense = await request<ApiExpense>('/expenses', {
      method: 'POST',
      body: JSON.stringify({
        amount: expense.amount,
        description: expense.description,
        date: toFrenchDate(expense.date),
        type: 'simple',
        source: 'manual',
        categoryId: expense.categoryId,
        bankId: expense.bankId,
      }),
    });

    return mapExpense(createdExpense);
  },
};
