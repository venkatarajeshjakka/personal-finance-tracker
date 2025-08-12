'use client';

import React, { useState } from 'react';
import { useAppDispatch } from '@/lib/redux/hooks';
import { savePortfolio } from '@/lib/redux/slices/portfoliosSlice';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Portfolio } from '@/types';
import { toast } from 'sonner';

interface CreatePortfolioDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: (portfolio: Portfolio) => void;
}

export function CreatePortfolioDialog({ open, onOpenChange, onSuccess }: CreatePortfolioDialogProps) {
  const dispatch = useAppDispatch();
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    initialCapital: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      toast.error('Portfolio name is required');
      return;
    }

    const initialCapital = parseFloat(formData.initialCapital) || 0;
    if (initialCapital < 0) {
      toast.error('Initial capital cannot be negative');
      return;
    }

    setIsSubmitting(true);

    try {
      const newPortfolio: Portfolio = {
        id: `portfolio_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        name: formData.name.trim(),
        description: formData.description.trim() || undefined,
        userId: 'default_user', // In a real app, this would come from authentication
        initialCapital,
        currentValue: initialCapital,
        totalReturn: 0,
        holdings: [],
        transactions: [],
        createdAt: new Date(),
        updatedAt: new Date()
      };

      await dispatch(savePortfolio(newPortfolio)).unwrap();
      
      toast.success(`Portfolio "${newPortfolio.name}" created successfully`);
      
      // Reset form
      setFormData({
        name: '',
        description: '',
        initialCapital: ''
      });
      
      onOpenChange(false);
      onSuccess?.(newPortfolio);
    } catch (error) {
      toast.error(`Failed to create portfolio: ${error}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (field: keyof typeof formData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleClose = () => {
    if (!isSubmitting) {
      setFormData({
        name: '',
        description: '',
        initialCapital: ''
      });
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Create New Portfolio</DialogTitle>
          <DialogDescription>
            Create a new investment portfolio to track your holdings and performance.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Portfolio Name *</Label>
            <Input
              id="name"
              placeholder="e.g., Growth Portfolio, Dividend Stocks"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              disabled={isSubmitting}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description (Optional)</Label>
            <Textarea
              id="description"
              placeholder="Brief description of your investment strategy or goals"
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              disabled={isSubmitting}
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="initialCapital">Initial Capital (₹)</Label>
            <Input
              id="initialCapital"
              type="number"
              placeholder="0"
              min="0"
              step="0.01"
              value={formData.initialCapital}
              onChange={(e) => handleInputChange('initialCapital', e.target.value)}
              disabled={isSubmitting}
            />
            <p className="text-xs text-muted-foreground">
              The starting amount you plan to invest. You can leave this as 0 and add investments later.
            </p>
          </div>

          <DialogFooter>
            <Button 
              type="button" 
              variant="outline" 
              onClick={handleClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Creating...' : 'Create Portfolio'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}