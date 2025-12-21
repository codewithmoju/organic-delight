import {
    collection,
    doc,
    Timestamp,
    runTransaction
} from 'firebase/firestore';
import { db } from '../firebase';
import { POSReturn, ReturnItem, POSTransaction } from '../types';

/**
 * Process a full or partial return for a POS transaction
 */
export async function processPOSReturn(returnData: {
    original_transaction_id: string;
    items: ReturnItem[];
    total_refund: number;
    refund_method: 'cash' | 'store_credit';
    reason: string;
    created_by: string;
}): Promise<string> {
    const returnNumber = `RET${Date.now().toString().slice(-8)}`;

    return await runTransaction(db, async (transaction) => {
        // 1. Get original transaction
        const transactionRef = doc(db, 'pos_transactions', returnData.original_transaction_id);
        const transactionDoc = await transaction.get(transactionRef);

        if (!transactionDoc.exists()) {
            throw new Error('Original transaction not found');
        }

        const posTransaction = transactionDoc.data() as POSTransaction;

        // 2. Create the return record
        const returnRef = doc(collection(db, 'pos_returns'));
        const posReturn: Omit<POSReturn, 'id'> = {
            return_number: returnNumber,
            original_transaction_id: returnData.original_transaction_id,
            original_transaction_number: posTransaction.transaction_number,
            items: returnData.items,
            total_refund: returnData.total_refund,
            refund_method: returnData.refund_method,
            reason: returnData.reason,
            created_at: new Date(),
            created_by: returnData.created_by
        };

        transaction.set(returnRef, {
            ...posReturn,
            created_at: Timestamp.fromDate(new Date())
        });

        // 3. Update original transaction status if it's a full return
        // Check if all items are returned
        const returnedItemIds = returnData.items.map(i => i.item_id);
        const allItemsReturned = posTransaction.items.every(item => returnedItemIds.includes(item.item_id));

        if (allItemsReturned) {
            transaction.update(transactionRef, {
                status: 'returned',
                updated_at: Timestamp.fromDate(new Date())
            });
        }

        // 4. Update Inventory (restock returned items)
        for (const item of returnData.items) {
            const inventoryTransactionRef = doc(collection(db, 'transactions'));
            transaction.set(inventoryTransactionRef, {
                item_id: item.item_id,
                type: 'stock_in',
                quantity: item.quantity_to_return,
                unit_price: item.unit_price,
                total_value: item.refund_amount,
                transaction_date: Timestamp.fromDate(new Date()),
                supplier_customer: 'Customer Return',
                reference_number: returnNumber,
                notes: `Return from Transaction #${posTransaction.transaction_number}. Reason: ${returnData.reason}`,
                created_by: returnData.created_by,
                created_at: Timestamp.fromDate(new Date()),
                pos_return_id: returnRef.id,
                pos_transaction_id: returnData.original_transaction_id
            });
        }

        return returnRef.id;
    });
}

/**
 * Void a transaction entirely (similar to a full return but marked as voided)
 */
export async function voidTransaction(transactionId: string, reason: string, userId: string): Promise<void> {
    return await runTransaction(db, async (transaction) => {
        const transactionRef = doc(db, 'pos_transactions', transactionId);
        const transactionDoc = await transaction.get(transactionRef);

        if (!transactionDoc.exists()) {
            throw new Error('Transaction not found');
        }

        const posTransaction = transactionDoc.data() as POSTransaction;

        if (posTransaction.status === 'voided' || posTransaction.status === 'cancelled') {
            throw new Error('Transaction already voided/cancelled');
        }

        // 1. Update status
        transaction.update(transactionRef, {
            status: 'voided',
            void_reason: reason,
            voided_at: Timestamp.fromDate(new Date()),
            voided_by: userId
        });

        // 2. Reverse Inventory
        for (const item of posTransaction.items) {
            const inventoryTransactionRef = doc(collection(db, 'transactions'));
            transaction.set(inventoryTransactionRef, {
                item_id: item.item_id,
                type: 'stock_in',
                quantity: item.quantity,
                unit_price: item.unit_price,
                total_value: item.line_total,
                transaction_date: Timestamp.fromDate(new Date()),
                supplier_customer: 'Voided Transaction',
                reference_number: `VOID-${posTransaction.transaction_number}`,
                notes: `Voided Transaction #${posTransaction.transaction_number}. Reason: ${reason}`,
                created_by: userId,
                created_at: Timestamp.fromDate(new Date()),
                pos_transaction_id: transactionId
            });
        }
    });
}
