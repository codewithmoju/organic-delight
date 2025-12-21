import {
    collection,
    doc,
    getDocs,
    addDoc,
    updateDoc,
    deleteDoc,
    query,
    where,
    orderBy,
    Timestamp
} from 'firebase/firestore';
import { db } from '../firebase';
import { Expense, ExpenseCategory } from '../types';

// ============================================
// EXPENSE CRUD OPERATIONS
// ============================================

/**
 * Record a new expense
 */
export async function recordExpense(expenseData: {
    category: ExpenseCategory;
    description: string;
    amount: number;
    expense_date: Date;
    payment_method: 'cash' | 'bank_transfer' | 'digital';
    reference_number?: string;
    notes?: string;
    created_by: string;
}): Promise<Expense> {
    const expensesRef = collection(db, 'expenses');

    const newExpense = {
        ...expenseData,
        expense_date: Timestamp.fromDate(expenseData.expense_date),
        created_at: Timestamp.fromDate(new Date())
    };

    const docRef = await addDoc(expensesRef, newExpense);

    return {
        id: docRef.id,
        ...expenseData,
        created_at: new Date()
    };
}

/**
 * Get expenses for a date range
 */
export async function getExpenses(startDate?: Date, endDate?: Date): Promise<Expense[]> {
    const expensesRef = collection(db, 'expenses');
    const q = query(expensesRef, orderBy('expense_date', 'desc'));
    const snapshot = await getDocs(q);

    let expenses = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        expense_date: doc.data().expense_date?.toDate() || new Date(),
        created_at: doc.data().created_at?.toDate() || new Date()
    })) as Expense[];

    // Apply date filters
    if (startDate) {
        expenses = expenses.filter(e => e.expense_date >= startDate);
    }
    if (endDate) {
        expenses = expenses.filter(e => e.expense_date <= endDate);
    }

    return expenses;
}

/**
 * Get expenses by category
 */
export async function getExpensesByCategory(category: ExpenseCategory): Promise<Expense[]> {
    const expensesRef = collection(db, 'expenses');
    const q = query(
        expensesRef,
        where('category', '==', category),
        orderBy('expense_date', 'desc')
    );
    const snapshot = await getDocs(q);

    return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        expense_date: doc.data().expense_date?.toDate() || new Date(),
        created_at: doc.data().created_at?.toDate() || new Date()
    })) as Expense[];
}

/**
 * Get today's expenses
 */
export async function getTodayExpenses(): Promise<Expense[]> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    return getExpenses(today, tomorrow);
}

/**
 * Update an expense
 */
export async function updateExpense(
    expenseId: string,
    updates: Partial<Omit<Expense, 'id' | 'created_at' | 'created_by'>>
): Promise<void> {
    const expenseRef = doc(db, 'expenses', expenseId);

    const updateData: any = { ...updates };
    if (updates.expense_date) {
        updateData.expense_date = Timestamp.fromDate(updates.expense_date);
    }

    await updateDoc(expenseRef, updateData);
}

/**
 * Delete an expense
 */
export async function deleteExpense(expenseId: string): Promise<void> {
    const expenseRef = doc(db, 'expenses', expenseId);
    await deleteDoc(expenseRef);
}

/**
 * Get expense totals by category for a date range
 */
export async function getExpenseSummary(startDate: Date, endDate: Date) {
    const expenses = await getExpenses(startDate, endDate);

    const categoryTotals: { [key in ExpenseCategory]?: number } = {};
    let totalExpenses = 0;

    for (const expense of expenses) {
        totalExpenses += expense.amount;

        if (!categoryTotals[expense.category]) {
            categoryTotals[expense.category] = 0;
        }
        categoryTotals[expense.category]! += expense.amount;
    }

    return {
        totalExpenses,
        expenseCount: expenses.length,
        categoryBreakdown: Object.entries(categoryTotals).map(([category, amount]) => ({
            category: category as ExpenseCategory,
            amount: amount!
        })).sort((a, b) => b.amount - a.amount)
    };
}

/**
 * Get daily expense total
 */
export async function getDailyExpenseTotal(date: Date): Promise<number> {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const expenses = await getExpenses(startOfDay, endOfDay);
    return expenses.reduce((sum, e) => sum + e.amount, 0);
}

/**
 * Get cash expenses for a date (used in daily report)
 */
export async function getCashExpenses(date: Date): Promise<number> {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const expenses = await getExpenses(startOfDay, endOfDay);
    return expenses
        .filter(e => e.payment_method === 'cash')
        .reduce((sum, e) => sum + e.amount, 0);
}
