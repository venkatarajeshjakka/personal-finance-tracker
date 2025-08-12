'use client';

import React, { useState } from 'react';
import { Portfolio } from '@/types';
import { PortfolioList } from './PortfolioList';
import { PortfolioDetails } from './PortfolioDetails';
import { CreatePortfolioDialog } from './CreatePortfolioDialog';

export function PortfolioManager() {
  const [selectedPortfolioId, setSelectedPortfolioId] = useState<string | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);

  const handleViewPortfolio = (portfolio: Portfolio) => {
    setSelectedPortfolioId(portfolio.id);
  };

  const handleBackToList = () => {
    setSelectedPortfolioId(null);
  };

  const handleCreateNew = () => {
    setShowCreateDialog(true);
  };

  const handleCreateSuccess = (portfolio: Portfolio) => {
    // Optionally navigate to the new portfolio
    setSelectedPortfolioId(portfolio.id);
  };

  if (selectedPortfolioId) {
    return (
      <PortfolioDetails 
        portfolioId={selectedPortfolioId} 
        onBack={handleBackToList} 
      />
    );
  }

  return (
    <>
      <PortfolioList 
        onCreateNew={handleCreateNew}
        onViewPortfolio={handleViewPortfolio}
      />
      
      <CreatePortfolioDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        onSuccess={handleCreateSuccess}
      />
    </>
  );
}