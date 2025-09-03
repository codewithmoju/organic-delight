import { Item, Category, ImportResult } from '../types';
import { createItem } from '../api/items';
import { createCategory, getCategories } from '../api/categories';

export async function parseCSVFile(file: File): Promise<any[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const lines = text.split('\n').filter(line => line.trim());
        
        if (lines.length < 2) {
          reject(new Error('CSV file must contain at least a header row and one data row'));
          return;
        }

        const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
        const data = lines.slice(1).map(line => {
          const values = line.split(',').map(v => v.trim().replace(/"/g, ''));
          const row: any = {};
          headers.forEach((header, index) => {
            row[header] = values[index] || '';
          });
          return row;
        });

        resolve(data);
      } catch (error) {
        reject(error);
      }
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsText(file);
  });
}

export async function importItems(data: any[]): Promise<ImportResult> {
  const result: ImportResult = {
    success: 0,
    failed: 0,
    errors: []
  };

  // Get existing categories
  const categories = await getCategories();
  const categoryMap = new Map(categories.map(cat => [cat.name.toLowerCase(), cat.id]));

  for (const row of data) {
    try {
      // Validate required fields
      if (!row.name) {
        result.errors.push(`Row missing required field: name`);
        result.failed++;
        continue;
      }

      // Find or create category
      let categoryId = null;
      if (row.category) {
        const categoryName = row.category.toLowerCase();
        if (categoryMap.has(categoryName)) {
          categoryId = categoryMap.get(categoryName);
        } else {
          // Create new category
          const newCategory = await createCategory({
            name: row.category,
            description: `Auto-created during import`,
            created_by: 'import'
          });
          categoryId = newCategory.id;
          categoryMap.set(categoryName, categoryId);
        }
      }

      const item: Omit<Item, 'id'> = {
        name: row.name,
        description: row.description || null,
        category_id: categoryId,
        quantity: parseInt(row.quantity) || 0,
        unit: row.unit || 'units',
        currency: row.currency || 'USD',
        unit_price: parseFloat(row.unit_price) || 0,
        reorder_point: parseInt(row.reorder_point) || 10,
        sku: row.sku || null,
        supplier: row.supplier || null,
        location: row.location || null,
        created_by: 'import',
        created_at: new Date() as any,
        updated_at: new Date() as any
      };

      await createItem(item);
      result.success++;
    } catch (error: any) {
      result.errors.push(`Failed to import item "${row.name}": ${error.message}`);
      result.failed++;
    }
  }

  return result;
}

export function generateImportTemplate(): string {
  const headers = [
    'name',
    'description',
    'category',
    'quantity',
    'unit',
    'currency',
    'unit_price',
    'reorder_point',
    'sku',
    'supplier',
    'location'
  ];

  const sampleData = [
    'Sample Product,A sample product description,Electronics,100,units,USD,29.99,10,SKU001,Supplier Inc,Warehouse A'
  ];

  return [headers.join(','), ...sampleData].join('\n');
}