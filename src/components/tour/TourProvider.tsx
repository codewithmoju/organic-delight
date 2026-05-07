import React, { createContext, useContext, useState, useCallback, useMemo, ReactNode } from 'react';

interface TourContextType {
  isTourActive: boolean;
  currentStep: number;
  startTour: () => void;
  endTour: () => void;
  nextStep: () => void;
  prevStep: () => void;
  goToStep: (step: number) => void;
}

const TourContext = createContext<TourContextType | undefined>(undefined);

export const useTour = () => {
  const context = useContext(TourContext);
  if (context === undefined) {
    throw new Error('useTour must be used within a TourProvider');
  }
  return context;
};

interface TourProviderProps {
  children: ReactNode;
}

export default function TourProvider({ children }: TourProviderProps) {
  const [isTourActive, setIsTourActive] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  const startTour = useCallback(() => {
    setIsTourActive(true);
    setCurrentStep(0);
  }, []);

  const endTour = useCallback(() => {
    setIsTourActive(false);
    setCurrentStep(0);
  }, []);

  const nextStep = useCallback(() => {
    setCurrentStep(prev => prev + 1);
  }, []);

  const prevStep = useCallback(() => {
    setCurrentStep(prev => Math.max(0, prev - 1));
  }, []);

  const goToStep = useCallback((step: number) => {
    setCurrentStep(step);
  }, []);

  const value = useMemo<TourContextType>(() => ({
    isTourActive,
    currentStep,
    startTour,
    endTour,
    nextStep,
    prevStep,
    goToStep,
  }), [isTourActive, currentStep, startTour, endTour, nextStep, prevStep, goToStep]);

  return (
    <TourContext.Provider value={value}>
      {children}
    </TourContext.Provider>
  );
}