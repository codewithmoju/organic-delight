import { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { toast } from 'sonner';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from '../lib/firebase';

export default function Reports() {
  const [monthlyTransactions, setMonthlyTransactions] = useState<any[]>([]);
  const [topItems, setTopItems] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadReportData();
  }, []);

  async function loadReportData() {
    try {
      // Get transactions with items data
      const transactionsRef = collection(db, 'transactions');
      const transactionsQuery = query(transactionsRef, orderBy('createdAt', 'desc'));
      const transactionsSnapshot = await getDocs(transactionsQuery);
      
      const transactions = [];
      for (const doc of transactionsSnapshot.docs) {
        const transactionData = { id: doc.id, ...doc.data() };
        
        // Get item data if itemId exists
        if (transactionData.itemId) {
          const itemsRef = collection(db, 'items');
          const itemsSnapshot = await getDocs(itemsRef);
          const itemDoc = itemsSnapshot.docs.find(itemDoc => itemDoc.id === transactionData.itemId);
          if (itemDoc) {
            transactionData.items = { 
              name: itemDoc.data().name,
              unit_price: itemDoc.data().unitPrice 
            };
          }
        }
        
        transactions.push(transactionData);
      }

      // Process monthly transactions
      const monthlyData = transactions.reduce((acc: any, curr: any) => {
        const month = new Date(curr.createdAt.toDate()).toLocaleString('default', { month: 'short' });
        const value = curr.type === 'out' ? Math.abs(curr.quantityChanged) : 0;
        
        if (!acc[month]) {
          acc[month] = { name: month, value: 0 };
        }
        acc[month].value += value;
        return acc;
      }, {});

      // Process top items
      const itemsData = transactions.reduce((acc: any, curr: any) => {
        if (curr.type === 'out' && curr.items) {
          const { name } = curr.items;
          if (!acc[name]) {
            acc[name] = { name, quantity: 0 };
          }
          acc[name].quantity += Math.abs(curr.quantityChanged);
        }
        return acc;
      }, {});

      setMonthlyTransactions(Object.values(monthlyData));
      setTopItems(Object.values(itemsData).sort((a: any, b: any) => b.quantity - a.quantity).slice(0, 5));
    } catch (error) {
      toast.error('Failed to load report data');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  }

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-lg font-medium text-gray-900 mb-4">Monthly Transactions</h2>
        <div className="bg-white p-6 rounded-lg shadow h-[400px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={monthlyTransactions}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="value" fill="#6366f1" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div>
        <h2 className="text-lg font-medium text-gray-900 mb-4">Top Items by Quantity Sold</h2>
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Item Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Quantity Sold
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {topItems.map((item) => (
                <tr key={item.name}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {item.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {item.quantity}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}