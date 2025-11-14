/**
 * Hook for managing travel plan state
 */

import { useState, useCallback } from 'react';
import type { TravelPlan } from '../types/plan';

export function usePlan() {
  const [plan, setPlan] = useState<TravelPlan | null>(null);

  /**
   * Update the current plan
   */
  const updatePlan = useCallback((newPlan: TravelPlan | null) => {
    setPlan(newPlan);
  }, []);

  /**
   * Clear the current plan
   */
  const clearPlan = useCallback(() => {
    setPlan(null);
  }, []);

  return {
    plan,
    updatePlan,
    clearPlan,
  };
}
