'use client';

import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Eye, 
  EyeOff, 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  RefreshCw,
  ExternalLink,
  Info
} from 'lucide-react';
import { toast } from 'sonner';

import { 
  loadAIConfig,
  saveAIConfig,
  validateAPIKey,
  selectAIConfig,
  selectIsAIConfigured,
  clearAllErrors
} from '@/lib/redux/slices/aiAnalysisSlice';
import type { AppDispatch, RootState } from '@/types';
import type { GeminiAIConfig } from '@/types/gemini';

export function GeminiAISettings() {
  const dispatch = useDispatch<AppDispatch>();
  
  // Redux state
  const config = useSelector(selectAIConfig);
  const isConfigured = useSelector(selectIsAIConfigured);
  const loading = useSelector((state: RootState) => state.aiAnalysis.loading);
  const error = useSelector((state: RootState) => state.aiAnalysis.error);

  // Local state
  const [apiKey, setApiKey] = useState('');
  const [showApiKey, setShowApiKey] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [validationResult, setValidationResult] = useState<{
    isValid: boolean;
    message: string;
  } | null>(null);

  // Load configuration on mount
  useEffect(() => {
    dispatch(loadAIConfig());
  }, [dispatch]);

  // Update local state when config changes
  useEffect(() => {
    if (config.apiKey) {
      setApiKey(config.apiKey);
    }
  }, [config.apiKey]);

  // Clear validation result when API key changes
  useEffect(() => {
    setValidationResult(null);
    dispatch(clearAllErrors());
  }, [apiKey, dispatch]);

  const handleValidateKey = async () => {
    if (!apiKey.trim()) {
      toast.error('Please enter an API key to validate');
      return;
    }

    setIsValidating(true);
    setValidationResult(null);

    try {
      const result = await dispatch(validateAPIKey(apiKey.trim())).unwrap();
      
      if (result.isValid) {
        setValidationResult({
          isValid: true,
          message: 'API key is valid and ready to use'
        });
        toast.success('API key validated successfully');
      } else {
        setValidationResult({
          isValid: false,
          message: 'API key is invalid or expired'
        });
        toast.error('Invalid API key');
      }
    } catch (error) {
      setValidationResult({
        isValid: false,
        message: error instanceof Error ? error.message : 'Validation failed'
      });
      toast.error('Failed to validate API key');
    } finally {
      setIsValidating(false);
    }
  };

  const handleSaveConfig = async () => {
    if (!apiKey.trim()) {
      toast.error('Please enter an API key');
      return;
    }

    const newConfig: GeminiAIConfig = {
      ...config,
      apiKey: apiKey.trim()
    };

    try {
      await dispatch(saveAIConfig(newConfig)).unwrap();
      toast.success('Gemini AI configuration saved successfully');
      setValidationResult(null);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to save configuration');
    }
  };

  const handleClearConfig = () => {
    setApiKey('');
    setValidationResult(null);
    
    const clearedConfig: GeminiAIConfig = {
      ...config,
      apiKey: ''
    };

    dispatch(saveAIConfig(clearedConfig));
    toast.success('Gemini AI configuration cleared');
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                Gemini AI Configuration
                {isConfigured && (
                  <Badge variant="secondary" className="text-green-600">
                    <CheckCircle className="w-3 h-3 mr-1" />
                    Configured
                  </Badge>
                )}
              </CardTitle>
              <CardDescription>
                Configure Google Gemini AI for advanced chart analysis and trading insights
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* API Key Configuration */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="gemini-api-key">Gemini AI API Key</Label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Input
                    id="gemini-api-key"
                    type={showApiKey ? 'text' : 'password'}
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    placeholder="Enter your Gemini AI API key"
                    className="pr-10"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowApiKey(!showApiKey)}
                  >
                    {showApiKey ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                <Button
                  onClick={handleValidateKey}
                  disabled={!apiKey.trim() || isValidating}
                  variant="outline"
                >
                  {isValidating ? (
                    <RefreshCw className="w-4 h-4 animate-spin mr-2" />
                  ) : null}
                  Validate
                </Button>
              </div>
            </div>

            {/* Validation Result */}
            {validationResult && (
              <Alert variant={validationResult.isValid ? "default" : "destructive"}>
                {validationResult.isValid ? (
                  <CheckCircle className="h-4 w-4" />
                ) : (
                  <XCircle className="h-4 w-4" />
                )}
                <AlertDescription>{validationResult.message}</AlertDescription>
              </Alert>
            )}

            {/* Error Display */}
            {error.config && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>{error.config.message}</AlertDescription>
              </Alert>
            )}

            {/* Action Buttons */}
            <div className="flex gap-2">
              <Button
                onClick={handleSaveConfig}
                disabled={!apiKey.trim() || loading.config}
              >
                {loading.config ? (
                  <RefreshCw className="w-4 h-4 animate-spin mr-2" />
                ) : null}
                Save Configuration
              </Button>
              
              {isConfigured && (
                <Button
                  variant="outline"
                  onClick={handleClearConfig}
                  disabled={loading.config}
                >
                  Clear Configuration
                </Button>
              )}
            </div>
          </div>

          <Separator />

          {/* API Key Instructions */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium">How to get your Gemini AI API Key</h3>
            <div className="space-y-3 text-sm text-muted-foreground">
              <div className="flex items-start gap-2">
                <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-xs font-medium">1</span>
                </div>
                <div>
                  Visit the{' '}
                  <a
                    href="https://makersuite.google.com/app/apikey"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline inline-flex items-center gap-1"
                  >
                    Google AI Studio
                    <ExternalLink className="w-3 h-3" />
                  </a>{' '}
                  to create your API key
                </div>
              </div>
              
              <div className="flex items-start gap-2">
                <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-xs font-medium">2</span>
                </div>
                <div>Sign in with your Google account and click "Create API Key"</div>
              </div>
              
              <div className="flex items-start gap-2">
                <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-xs font-medium">3</span>
                </div>
                <div>Copy the generated API key and paste it above</div>
              </div>
              
              <div className="flex items-start gap-2">
                <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-xs font-medium">4</span>
                </div>
                <div>Click "Validate" to test the key, then "Save Configuration"</div>
              </div>
            </div>
          </div>

          <Separator />

          {/* Features Information */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium">AI Analysis Features</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-primary">Technical Analysis</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Chart pattern recognition</li>
                  <li>• Support and resistance levels</li>
                  <li>• Trend analysis and strength</li>
                  <li>• Technical indicator insights</li>
                </ul>
              </div>
              
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-primary">Trading Insights</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Price targets and probabilities</li>
                  <li>• Risk assessment and management</li>
                  <li>• Entry and exit recommendations</li>
                  <li>• Position sizing guidance</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Privacy Notice */}
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              <strong>Privacy Notice:</strong> Chart images are sent to Google's Gemini AI service for analysis. 
              No personal information or account details are shared. Only chart visual data is processed.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    </div>
  );
}