import React from 'react';
import { useLocation, Navigate } from 'react-router-dom';
import MarketValidationQuestions from '../../components/MarketValidationQuestions';

interface LocationState {
  ideaId: string;
  ideaData: {
    title: string;
    description: string;
    target_market: string;
    solution_concept: string;
  };
}

export default function MarketValidation() {
  const location = useLocation();
  const state = location.state as LocationState | null;

  // Redirect if no idea data is present
  if (!state?.ideaId || !state?.ideaData) {
    return <Navigate to="/idea-hub/refinement" replace />;
  }

  return (
    <div className="py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <MarketValidationQuestions 
          ideaId={state.ideaId} 
          ideaData={state.ideaData} 
        />
      </div>
    </div>
  );
}