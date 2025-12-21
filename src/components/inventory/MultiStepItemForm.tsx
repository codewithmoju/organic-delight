import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, ArrowRight, Check, Package, DollarSign, Hash, Layers, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { Category } from '../../lib/types';
import LoadingSpinner from '../ui/LoadingSpinner';
import { AlertCircle } from 'lucide-react';
import { useAuthStore } from '../../lib/store';

interface MultiStepItemFormProps {
  categories: Category[];
  onSubmit: (data: {
    name: string;
    description: string;
    category_id: string;
    unit_price: number;
    barcode?: string;
    sku?: string;
    supplier?: string;
    location?: string;
    reorder_point: number;
    created_by: string;
  }) => Promise<void>;
  onCancel: () => void;
}

interface ItemFormData {
  category_id: string;
  name: string;
  description: string;
  unit_price: number;
  product_id: string;
  total_stock: number;
  barcode: string;
  sku: string;
  supplier: string;
  location: string;
  reorder_point: number;
}

export default function MultiStepItemForm({ categories, onSubmit, onCancel }: MultiStepItemFormProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const profile = useAuthStore(state => state.profile);
  const isAdmin = profile?.role === 'admin';

  const [formData, setFormData] = useState<ItemFormData>({
    category_id: '',
    name: '',
    description: '',
    unit_price: 0,
    product_id: '',
    total_stock: 0,
    barcode: '',
    sku: '',
    supplier: '',
    location: '',
    reorder_point: 10
  });

  const updateFormData = (field: keyof ItemFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const generateProductId = () => {
    const timestamp = Date.now().toString().slice(-6);
    const random = Math.random().toString(36).substr(2, 4).toUpperCase();
    return `PROD-${timestamp}-${random}`;
  };

  const validateStep = (step: number): boolean => {
    const newErrors: { [key: string]: string } = {};

    switch (step) {
      case 1: // Category Selection
        if (!formData.category_id) {
          newErrors.category_id = 'Please select a category';
        }
        break;

      case 2: // Product Name
        if (!formData.name.trim()) {
          newErrors.name = 'Product name is required';
        } else if (formData.name.length < 2) {
          newErrors.name = 'Product name must be at least 2 characters';
        } else if (formData.name.length > 100) {
          newErrors.name = 'Product name must be 100 characters or less';
        }

        if (!formData.description.trim()) {
          newErrors.description = 'Product description is required';
        } else if (formData.description.length < 5) {
          newErrors.description = 'Description must be at least 5 characters';
        }
        break;

      case 3: // Product Price
        if (!formData.unit_price || formData.unit_price <= 0) {
          newErrors.unit_price = 'Product price must be greater than 0';
        }
        break;

      case 4: // Product ID
        if (!formData.product_id.trim()) {
          newErrors.product_id = 'Product ID is required';
        }
        break;

      case 5: // Stock Quantity
        if (!formData.total_stock || formData.total_stock < 0) {
          newErrors.total_stock = 'Stock quantity must be 0 or greater';
        }

        if (!formData.reorder_point || formData.reorder_point < 0) {
          newErrors.reorder_point = 'Reorder point must be 0 or greater';
        }
        break;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const nextStep = () => {
    if (validateStep(currentStep)) {
      if (currentStep === 3 && !formData.product_id) {
        // Auto-generate product ID after price step
        updateFormData('product_id', generateProductId());
      }
      setCurrentStep(prev => Math.min(prev + 1, 6));
    }
  };

  const prevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const handleSubmit = async () => {
    if (!validateStep(5)) return;

    setIsSubmitting(true);
    try {
      await onSubmit({
        name: formData.name.trim(),
        description: formData.description.trim(),
        category_id: formData.category_id,
        unit_price: formData.unit_price,
        barcode: formData.barcode.trim() || undefined,
        sku: formData.sku.trim() || formData.product_id,
        supplier: formData.supplier.trim() || undefined,
        location: formData.location.trim() || undefined,
        reorder_point: formData.reorder_point,
        created_by: 'current-user'
      });

      toast.success('Product created successfully');
    } catch (error: any) {
      toast.error('Failed to create product');
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedCategory = categories.find(cat => cat.id === formData.category_id);

  return (
    <div className="max-w-2xl mx-auto">
      {/* Progress Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gradient mb-4">Add New Product</h1>

        {/* Progress Bar */}
        <div className="flex justify-between items-center mb-4">
          {[1, 2, 3, 4, 5].map((step) => (
            <div
              key={step}
              className={`flex items-center justify-center w-10 h-10 rounded-full border-2 transition-all duration-300 ${step <= currentStep
                  ? 'border-primary-500 bg-primary-500 text-white'
                  : 'border-gray-600 text-gray-400'
                }`}
            >
              {step < currentStep ? <Check className="w-5 h-5" /> : step}
            </div>
          ))}
        </div>
        <div className="w-full bg-gray-700 rounded-full h-2">
          <motion.div
            className="bg-gradient-to-r from-primary-500 to-accent-500 h-2 rounded-full"
            initial={{ width: '20%' }}
            animate={{ width: `${(currentStep / 5) * 100}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>

        <div className="mt-4 text-center">
          <p className="text-gray-400">
            Step {currentStep} of 5: {
              currentStep === 1 ? 'Select Category' :
                currentStep === 2 ? 'Product Information' :
                  currentStep === 3 ? 'Set Price' :
                    currentStep === 4 ? 'Product ID' :
                      'Stock & Attributes'
            }
          </p>
        </div>
      </div>

      <div className="card-dark p-8">
        <AnimatePresence mode="wait">
          {/* Step 1: Category Selection */}
          {currentStep === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <div className="text-center mb-6">
                <Package className="w-16 h-16 text-primary-400 mx-auto mb-4" />
                <h3 className="text-2xl font-semibold text-white mb-2">Select Product Category</h3>
                <p className="text-gray-400">Choose the category that best describes your product</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {categories.map((category) => (
                  <motion.button
                    key={category.id}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => updateFormData('category_id', category.id)}
                    className={`p-6 rounded-xl border-2 transition-all duration-200 text-left ${formData.category_id === category.id
                        ? 'border-primary-500 bg-primary-500/10 text-primary-400'
                        : 'border-dark-600 bg-dark-700/30 text-gray-400 hover:border-primary-500/50'
                      }`}
                  >
                    <h4 className="font-semibold text-lg mb-2">{category.name}</h4>
                    <p className="text-sm opacity-75">{category.description}</p>
                  </motion.button>
                ))}
              </div>

              {errors.category_id && (
                <div className="flex items-center text-sm text-error-400 justify-center">
                  <AlertCircle className="h-4 w-4 mr-1" />
                  {errors.category_id}
                </div>
              )}
            </motion.div>
          )}

          {/* Step 2: Product Name & Description */}
          {currentStep === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <div className="text-center mb-6">
                <Package className="w-16 h-16 text-accent-400 mx-auto mb-4" />
                <h3 className="text-2xl font-semibold text-white mb-2">Product Information</h3>
                <p className="text-gray-400">Enter the basic product details</p>
                {selectedCategory && (
                  <div className="mt-4 inline-flex items-center px-4 py-2 bg-primary-500/10 border border-primary-500/20 rounded-lg">
                    <span className="text-primary-400 font-medium">Category: {selectedCategory.name}</span>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-base font-medium text-gray-300 mb-3">
                  Product Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => updateFormData('name', e.target.value)}
                  className={`w-full input-dark input-large ${errors.name ? 'ring-error-500 border-error-500' : ''
                    }`}
                  placeholder="Enter product name (e.g., iPhone 15 Pro, Nike Air Max)"
                  maxLength={100}
                />
                {errors.name && (
                  <div className="mt-2 flex items-center text-sm text-error-400">
                    <AlertCircle className="h-4 w-4 mr-1" />
                    {errors.name}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-base font-medium text-gray-300 mb-3">
                  Product Description *
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => updateFormData('description', e.target.value)}
                  rows={4}
                  className={`w-full input-dark input-large resize-none ${errors.description ? 'ring-error-500 border-error-500' : ''
                    }`}
                  placeholder="Describe the product features, specifications, or any relevant details..."
                  maxLength={500}
                />
                {errors.description && (
                  <div className="mt-2 flex items-center text-sm text-error-400">
                    <AlertCircle className="h-4 w-4 mr-1" />
                    {errors.description}
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* Step 3: Product Price */}
          {currentStep === 3 && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <div className="text-center mb-6">
                <DollarSign className="w-16 h-16 text-success-400 mx-auto mb-4" />
                <h3 className="text-2xl font-semibold text-white mb-2">Set Product Price</h3>
                <p className="text-gray-400">This price will be used for all POS transactions</p>
              </div>

              <div className="max-w-md mx-auto">
                <label className="block text-base font-medium text-gray-300 mb-3 text-center">
                  Unit Price *
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 flex items-center pl-4">
                    <span className="text-gray-400 text-xl">$</span>
                  </div>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    disabled={!isAdmin}
                    value={formData.unit_price || ''}
                    onChange={(e) => updateFormData('unit_price', parseFloat(e.target.value) || 0)}
                    className={`w-full input-dark input-large pl-12 text-center text-2xl font-bold ${errors.unit_price ? 'ring-error-500 border-error-500' : ''
                      } ${!isAdmin ? 'opacity-50 cursor-not-allowed' : ''}`}
                    placeholder="0.00"
                  />
                  {!isAdmin && (
                    <div className="mt-2 text-xs text-warning-400 text-center">
                      Admin privileges required to edit unit price
                    </div>
                  )}
                </div>
                {errors.unit_price && (
                  <div className="mt-2 flex items-center text-sm text-error-400 justify-center">
                    <AlertCircle className="h-4 w-4 mr-1" />
                    {errors.unit_price}
                  </div>
                )}

                {formData.unit_price > 0 && (
                  <div className="mt-4 text-center">
                    <div className="text-success-400 font-semibold text-lg">
                      ${formData.unit_price.toFixed(2)}
                    </div>
                    <div className="text-gray-400 text-sm">per unit</div>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* Step 4: Product ID Assignment */}
          {currentStep === 4 && (
            <motion.div
              key="step4"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <div className="text-center mb-6">
                <Hash className="w-16 h-16 text-warning-400 mx-auto mb-4" />
                <h3 className="text-2xl font-semibold text-white mb-2">Product ID Assignment</h3>
                <p className="text-gray-400">Assign a unique identifier for this product</p>
              </div>

              <div className="max-w-md mx-auto space-y-4">
                <div>
                  <label className="block text-base font-medium text-gray-300 mb-3 text-center">
                    Product ID *
                  </label>
                  <div className="flex gap-3">
                    <input
                      type="text"
                      value={formData.product_id}
                      onChange={(e) => updateFormData('product_id', e.target.value)}
                      className={`flex-1 input-dark input-large text-center font-mono ${errors.product_id ? 'ring-error-500 border-error-500' : ''
                        }`}
                      placeholder="Enter or generate ID"
                    />
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      type="button"
                      onClick={() => updateFormData('product_id', generateProductId())}
                      className="btn-secondary px-4"
                    >
                      Generate
                    </motion.button>
                  </div>
                  {errors.product_id && (
                    <div className="mt-2 flex items-center text-sm text-error-400 justify-center">
                      <AlertCircle className="h-4 w-4 mr-1" />
                      {errors.product_id}
                    </div>
                  )}
                </div>

                {formData.product_id && (
                  <div className="bg-dark-800/50 rounded-lg p-4 border border-primary-500/20">
                    <div className="text-center">
                      <div className="text-primary-400 font-mono text-lg font-bold">
                        {formData.product_id}
                      </div>
                      <div className="text-gray-400 text-sm mt-1">
                        This ID will be used for inventory tracking
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* Step 5: Stock Quantity & Additional Attributes */}
          {currentStep === 5 && (
            <motion.div
              key="step5"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <div className="text-center mb-6">
                <Layers className="w-16 h-16 text-primary-400 mx-auto mb-4" />
                <h3 className="text-2xl font-semibold text-white mb-2">Stock & Additional Details</h3>
                <p className="text-gray-400">Set initial stock quantity and optional attributes</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-base font-medium text-gray-300 mb-3">
                    Initial Stock Quantity *
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={formData.total_stock || ''}
                    onChange={(e) => updateFormData('total_stock', parseInt(e.target.value) || 0)}
                    className={`w-full input-dark input-large ${errors.total_stock ? 'ring-error-500 border-error-500' : ''
                      }`}
                    placeholder="Enter initial stock quantity"
                  />
                  {errors.total_stock && (
                    <div className="mt-2 flex items-center text-sm text-error-400">
                      <AlertCircle className="h-4 w-4 mr-1" />
                      {errors.total_stock}
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-base font-medium text-gray-300 mb-3">
                    Reorder Point *
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={formData.reorder_point || ''}
                    onChange={(e) => updateFormData('reorder_point', parseInt(e.target.value) || 0)}
                    className={`w-full input-dark input-large ${errors.reorder_point ? 'ring-error-500 border-error-500' : ''
                      }`}
                    placeholder="Minimum stock level"
                  />
                  {errors.reorder_point && (
                    <div className="mt-2 flex items-center text-sm text-error-400">
                      <AlertCircle className="h-4 w-4 mr-1" />
                      {errors.reorder_point}
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-base font-medium text-gray-300 mb-3">
                    Barcode (Optional)
                  </label>
                  <input
                    type="text"
                    value={formData.barcode}
                    onChange={(e) => updateFormData('barcode', e.target.value)}
                    className="w-full input-dark input-large"
                    placeholder="Enter product barcode"
                  />
                </div>

                <div>
                  <label className="block text-base font-medium text-gray-300 mb-3">
                    Supplier (Optional)
                  </label>
                  <input
                    type="text"
                    value={formData.supplier}
                    onChange={(e) => updateFormData('supplier', e.target.value)}
                    className="w-full input-dark input-large"
                    placeholder="Enter supplier name"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-base font-medium text-gray-300 mb-3">
                    Storage Location (Optional)
                  </label>
                  <input
                    type="text"
                    value={formData.location}
                    onChange={(e) => updateFormData('location', e.target.value)}
                    className="w-full input-dark input-large"
                    placeholder="Enter storage location (e.g., Warehouse A, Shelf B-3)"
                  />
                </div>
              </div>

              {/* Summary */}
              <div className="bg-dark-800/50 rounded-xl p-6 border border-primary-500/20">
                <h4 className="text-white font-semibold mb-4">Product Summary</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-400">Category:</span>
                    <span className="text-white font-medium ml-2">{selectedCategory?.name}</span>
                  </div>
                  <div>
                    <span className="text-gray-400">Name:</span>
                    <span className="text-white font-medium ml-2">{formData.name}</span>
                  </div>
                  <div>
                    <span className="text-gray-400">Price:</span>
                    <span className="text-success-400 font-bold ml-2">${formData.unit_price.toFixed(2)}</span>
                  </div>
                  <div>
                    <span className="text-gray-400">Product ID:</span>
                    <span className="text-primary-400 font-mono ml-2">{formData.product_id}</span>
                  </div>
                  <div>
                    <span className="text-gray-400">Initial Stock:</span>
                    <span className="text-white font-medium ml-2">{formData.total_stock} units</span>
                  </div>
                  <div>
                    <span className="text-gray-400">Total Value:</span>
                    <span className="text-accent-400 font-bold ml-2">
                      ${(formData.total_stock * formData.unit_price).toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Navigation Buttons */}
        <div className="flex justify-between mt-8 pt-6 border-t border-dark-700/50">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            type="button"
            onClick={prevStep}
            disabled={currentStep === 1}
            className={`btn-secondary flex items-center gap-2 ${currentStep === 1 ? 'opacity-50 cursor-not-allowed' : ''
              }`}
          >
            <ArrowLeft className="w-4 h-4" />
            Previous
          </motion.button>

          {currentStep < 5 ? (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              type="button"
              onClick={nextStep}
              className="btn-primary flex items-center gap-2"
            >
              Next
              <ArrowRight className="w-4 h-4" />
            </motion.button>
          ) : (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              type="button"
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="btn-primary flex items-center gap-2 min-w-[160px]"
            >
              {isSubmitting ? (
                <>
                  <LoadingSpinner size="sm" color="white" />
                  Creating Product...
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4" />
                  Create Product
                </>
              )}
            </motion.button>
          )}
        </div>
      </div>
    </div>
  );
}