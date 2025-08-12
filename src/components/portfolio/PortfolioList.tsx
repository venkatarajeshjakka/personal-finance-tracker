'use client';

import React, { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '@/lib/redux/hooks';
import { loadPortfolios, deletePortfolio, setSelectedPortfolio } from '@/lib/redux/slices/portfoliosSlice';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { MoreHorizontal, Plus, TrendingUp, TrendingDown, DollarSign } from 'lucide-react';
import { Portfolio, calculatePortfolioReturnPercentage } from '@/types';
import { toast } from 'sonner';

interface PortfolioListProps {
  onCreateNew: () => void;
  onViewPortfolio: (portfolio: Portfolio) => void;
}

export function PortfolioList({ onCreateNew, onViewPortfolio }: PortfolioListProps) {
  const dispatch = useAppDispatch();
  const { data: portfolios, loading, error } = useAppSelector(state => state.portfolios);

  useEffect(() => {
    dispatch(loadPortfolios());
  }, [dispatch]);

  const handleDeletePortfolio = async (portfolioId: string, portfolioName: string) => {
    if (window.confirm(`Are you sure you want to delete "${portfolioName}"? This action cannot be undone.`)) {
      try {
        await dispatch(deletePortfolio(portfolioId)).unwrap();
        toast.success(`Portfolio "${portfolioName}" deleted successfully`);
      } catch (error) {
        toast.error(`Failed to delete portfolio: ${error}`);
      }
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatPercentage = (value: number) => {
    return `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`;
  };

  const calculateReturnPercentage = (portfolio: Portfolio) => {
    return calculatePortfolioReturnPercentage(portfolio);
  };

  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {[...Array(3)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader>
              <div className="h-4 bg-muted rounded w-3/4"></div>
              <div className="h-3 bg-muted rounded w-1/2"></div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="h-3 bg-muted rounded"></div>
                <div className="h-3 bg-muted rounded w-2/3"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center text-muted-foreground">
            <p>Error loading portfolios: {error}</p>
            <Button 
              variant="outline" 
              onClick={() => dispatch(loadPortfolios())}
              className="mt-2"
            >
              Retry
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (portfolios.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center">
            <DollarSign className="mx-auto h-12 w-12 text-muted-foreground" />
            <h3 className="mt-4 text-lg font-semibold">No portfolios yet</h3>
            <p className="text-muted-foreground">
              Create your first portfolio to start tracking your investments.
            </p>
            <Button onClick={onCreateNew} className="mt-4">
              <Plus className="mr-2 h-4 w-4" />
              Create Portfolio
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Your Portfolios</h2>
        <Button onClick={onCreateNew}>
          <Plus className="mr-2 h-4 w-4" />
          Create Portfolio
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {portfolios.map((portfolio) => {
          const returnPercentage = calculateReturnPercentage(portfolio);
          const isPositive = portfolio.totalReturn >= 0;

          return (
            <Card key={portfolio.id} className="cursor-pointer hover:shadow-md transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div className="flex-1" onClick={() => onViewPortfolio(portfolio)}>
                  <CardTitle className="text-lg">{portfolio.name}</CardTitle>
                  {portfolio.description && (
                    <CardDescription className="mt-1">
                      {portfolio.description}
                    </CardDescription>
                  )}
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="h-8 w-8 p-0">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => onViewPortfolio(portfolio)}>
                      View Details
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      onClick={() => handleDeletePortfolio(portfolio.id, portfolio.name)}
                      className="text-destructive"
                    >
                      Delete Portfolio
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </CardHeader>
              <CardContent onClick={() => onViewPortfolio(portfolio)}>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Current Value</span>
                    <span className="font-semibold">{formatCurrency(portfolio.currentValue)}</span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Total Return</span>
                    <div className="flex items-center space-x-1">
                      {isPositive ? (
                        <TrendingUp className="h-4 w-4 text-green-600" />
                      ) : (
                        <TrendingDown className="h-4 w-4 text-red-600" />
                      )}
                      <span className={`font-semibold ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
                        {formatCurrency(portfolio.totalReturn)}
                      </span>
                    </div>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Return %</span>
                    <Badge variant={isPositive ? "default" : "destructive"}>
                      {formatPercentage(returnPercentage)}
                    </Badge>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Holdings</span>
                    <span className="text-sm">{portfolio.holdings.length} stocks</span>
                  </div>

                  <div className="text-xs text-muted-foreground">
                    Created: {new Date(portfolio.createdAt).toLocaleDateString()}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}