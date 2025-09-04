import React, { createContext, useContext, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ArrowLeft, ArrowRight, Play, SkipForward, CheckCircle } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';

interface TourStep {
  id: string;
  title: string;
  content: string;
  target?: string;
  route?: string;
  position?: 'top' | 'bottom' | 'left' | 'right' | 'center';
  action?: 'click' | 'hover' | 'scroll' | 'wait';
  actionTarget?: string;
  spotlight?: boolean;
  interactive?: boolean;
  interactiveContent?: React.ReactNode;
}

interface TourContextType {
  isActive: boolean;
  currentStep: number;
  totalSteps: number;
  startTour: () => void;
  endTour: () => void;
  nextStep: () => void;
  prevStep: () => void;
  skipTour: () => void;
  currentStepData: TourStep | null;
}

const TourContext = createContext<TourContextType | null>(null);

export const useTour = () => {
  const context = useContext(TourContext);
  if (!context) {
    throw new Error('useTour must be used within a TourProvider');
  }
  return context;
};

interface TourProviderProps {
  children: React.ReactNode;
}

export default function TourProvider({ children }: TourProviderProps) {
  const { t } = useTranslation();
  
  // Generate tour steps with translations
  const tourSteps: TourStep[] = [
    {
      id: 'welcome',
      title: t('tour.welcome.title'),
      content: t('tour.welcome.content'),
      position: 'center',
      spotlight: false,
    },
    {
      id: 'dashboard',
      title: t('tour.dashboard.title'),
      content: t('tour.dashboard.content'),
      route: '/',
      target: '[data-tour="dashboard-stats"]',
      position: 'bottom',
      spotlight: true,
    },
    {
      id: 'sidebar',
      title: t('tour.sidebar.title'),
      content: t('tour.sidebar.content'),
      target: '[data-tour="sidebar"]',
      position: 'right',
      spotlight: true,
    },
    {
      id: 'categories',
      title: t('tour.categories.title'),
      content: t('tour.categories.content'),
      route: '/inventory/categories',
      target: '[data-tour="categories-grid"]',
      position: 'top',
      spotlight: true,
    },
    {
      id: 'items',
      title: t('tour.items.title'),
      content: t('tour.items.content'),
      route: '/inventory/items',
      target: '[data-tour="items-grid"]',
      position: 'top',
      spotlight: true,
    },
    {
      id: 'transactions',
      title: t('tour.transactions.title'),
      content: t('tour.transactions.content'),
      route: '/transactions',
      target: '[data-tour="transactions-list"]',
      position: 'top',
      spotlight: true,
      interactive: true,
    },
    {
      id: 'stock-levels',
      title: t('tour.stockLevels.title'),
      content: t('tour.stockLevels.content'),
      route: '/stock-levels',
      target: '[data-tour="stock-levels-grid"]',
      position: 'top',
      spotlight: true,
    },
    {
      id: 'reports',
      title: t('tour.reports.title'),
      content: t('tour.reports.content'),
      route: '/reports',
      target: '[data-tour="reports-charts"]',
      position: 'top',
      spotlight: true,
    },
    {
      id: 'settings',
      title: t('tour.settings.title'),
      content: t('tour.settings.content'),
      route: '/settings',
      target: '[data-tour="settings-tabs"]',
      position: 'bottom',
      spotlight: true,
    },
    {
      id: 'completion',
      title: t('tour.completion.title'),
      content: t('tour.completion.content'),
      position: 'center',
      spotlight: false,
    },
  ];

  const [isActive, setIsActive] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [isNavigating, setIsNavigating] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const currentStepData = tourSteps[currentStep] || null;
  const totalSteps = tourSteps.length;

  // Check if user has completed tour before
  useEffect(() => {
    const hasCompletedTour = localStorage.getItem('stocksuite-tour-completed');
    const isFirstVisit = !hasCompletedTour && location.pathname === '/';
    
    if (isFirstVisit) {
      // Auto-start tour for first-time users after a short delay
      setTimeout(() => {
        setIsActive(true);
      }, 1500);
    }
  }, [location.pathname]);

  // Handle route navigation during tour
  useEffect(() => {
    if (isActive && currentStepData?.route && location.pathname !== currentStepData.route) {
      setIsNavigating(true);
      navigate(currentStepData.route);
      
      // Wait for navigation to complete
      setTimeout(() => {
        setIsNavigating(false);
      }, 500);
    }
  }, [currentStep, isActive, currentStepData, navigate, location.pathname]);

  const startTour = () => {
    setCurrentStep(0);
    setIsActive(true);
    // Navigate to dashboard to start tour
    if (location.pathname !== '/') {
      navigate('/');
    }
  };

  const endTour = () => {
    setIsActive(false);
    setCurrentStep(0);
    localStorage.setItem('stocksuite-tour-completed', 'true');
    toast.success(t('tour.messages.completed'));
  };

  const nextStep = () => {
    if (currentStep < totalSteps - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      endTour();
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const skipTour = () => {
    setIsActive(false);
    setCurrentStep(0);
    localStorage.setItem('stocksuite-tour-completed', 'true');
    toast.info(t('tour.messages.skipped'));
  };

  const getTooltipPosition = (target: string, position: string) => {
    const element = document.querySelector(target);
    if (!element) return { top: '50%', left: '50%', transform: 'translate(-50%, -50%)' };

    const rect = element.getBoundingClientRect();
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    const scrollLeft = window.pageXOffset || document.documentElement.scrollLeft;

    switch (position) {
      case 'top':
        return {
          top: rect.top + scrollTop - 20,
          left: rect.left + scrollLeft + rect.width / 2,
          transform: 'translate(-50%, -100%)',
        };
      case 'bottom':
        return {
          top: rect.bottom + scrollTop + 20,
          left: rect.left + scrollLeft + rect.width / 2,
          transform: 'translate(-50%, 0)',
        };
      case 'left':
        return {
          top: rect.top + scrollTop + rect.height / 2,
          left: rect.left + scrollLeft - 20,
          transform: 'translate(-100%, -50%)',
        };
      case 'right':
        return {
          top: rect.top + scrollTop + rect.height / 2,
          left: rect.right + scrollLeft + 20,
          transform: 'translate(0, -50%)',
        };
      default:
        return {
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
        };
    }
  };

  const contextValue: TourContextType = {
    isActive,
    currentStep,
    totalSteps,
    startTour,
    endTour,
    nextStep,
    prevStep,
    skipTour,
    currentStepData,
  };

  return (
    <TourContext.Provider value={contextValue}>
      {children}
      
      <AnimatePresence>
        {isActive && currentStepData && !isNavigating && (
          <>
            {/* Overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 z-[9998]"
              style={{ pointerEvents: currentStepData.spotlight ? 'auto' : 'none' }}
            />

            {/* Spotlight Effect */}
            {currentStepData.spotlight && currentStepData.target && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="fixed z-[9999] pointer-events-none"
                style={{
                  ...(() => {
                    const element = document.querySelector(currentStepData.target!);
                    if (!element) return {};
                    
                    const rect = element.getBoundingClientRect();
                    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
                    const scrollLeft = window.pageXOffset || document.documentElement.scrollLeft;
                    
                    return {
                      top: rect.top + scrollTop - 8,
                      left: rect.left + scrollLeft - 8,
                      width: rect.width + 16,
                      height: rect.height + 16,
                    };
                  })(),
                }}
              >
                <div className="w-full h-full rounded-lg border-2 border-primary-500 shadow-lg shadow-primary-500/50 bg-primary-500/10" />
              </motion.div>
            )}

            {/* Tour Tooltip */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.8, y: 20 }}
              className="fixed z-[10000] max-w-sm bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 p-6"
              style={
                currentStepData.target && currentStepData.position !== 'center'
                  ? getTooltipPosition(currentStepData.target, currentStepData.position!)
                  : {
                      top: '50%',
                      left: '50%',
                      transform: 'translate(-50%, -50%)',
                    }
              }
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    {currentStepData.title}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
                    {currentStepData.content}
                  </p>
                </div>
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={skipTour}
                  className="ml-4 p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                >
                  <X className="w-4 h-4" />
                </motion.button>
              </div>

              {/* Interactive Content */}
              {currentStepData.interactive && currentStepData.interactiveContent && (
                <div className="mb-4 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  {currentStepData.interactiveContent}
                </div>
              )}

              {/* Progress Bar */}
              <div className="mb-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {t('tour.progress', { current: currentStep + 1, total: totalSteps })}
                  </span>
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {Math.round(((currentStep + 1) / totalSteps) * 100)}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${((currentStep + 1) / totalSteps) * 100}%` }}
                    className="bg-primary-500 h-2 rounded-full transition-all duration-300"
                  />
                </div>
              </div>

              {/* Controls */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {currentStep > 0 && (
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={prevStep}
                      className="btn-secondary flex items-center gap-2 px-3 py-2 text-sm"
                    >
                      <ArrowLeft className="w-4 h-4" />
                      {t('tour.controls.back')}
                    </motion.button>
                  )}
                  
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={skipTour}
                    className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 px-3 py-2"
                  >
                    {t('tour.controls.skip')}
                  </motion.button>
                </div>

                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={nextStep}
                  className="btn-primary flex items-center gap-2 px-4 py-2 text-sm"
                >
                  {currentStep === totalSteps - 1 ? (
                    <>
                      <CheckCircle className="w-4 h-4" />
                      {t('tour.controls.finish')}
                    </>
                  ) : (
                    <>
                      {t('tour.controls.next')}
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </motion.button>
              </div>

              {/* Arrow Pointer */}
              {currentStepData.target && currentStepData.position !== 'center' && (
                <div
                  className={`absolute w-0 h-0 ${
                    currentStepData.position === 'top'
                      ? 'border-l-8 border-r-8 border-t-8 border-l-transparent border-r-transparent border-t-primary-500/30 top-full left-1/2 transform -translate-x-1/2'
                      : currentStepData.position === 'bottom'
                      ? 'border-l-8 border-r-8 border-b-8 border-l-transparent border-r-transparent border-b-primary-500/30 bottom-full left-1/2 transform -translate-x-1/2'
                      : currentStepData.position === 'left'
                      ? 'border-t-8 border-b-8 border-l-8 border-t-transparent border-b-transparent border-l-primary-500/30 right-full top-1/2 transform -translate-y-1/2'
                      : 'border-t-8 border-b-8 border-r-8 border-t-transparent border-b-transparent border-r-primary-500/30 left-full top-1/2 transform -translate-y-1/2'
                  }`}
                />
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </TourContext.Provider>
  );
}