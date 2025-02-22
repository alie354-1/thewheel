import React from 'react';
import { useLocation } from 'react-router-dom';
import MarketValidationQuestions from '../../components/MarketValidationQuestions';

export default function MarketValidation() {
  const location = useLocation();
  const ideaId = location.state?.ideaId;

  return (
    <div className="py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <MarketValidationQuestions />
      </div>
    </div>
  );
}