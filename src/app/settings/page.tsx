'use client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { NSECompanyManager } from '@/components/settings/NSECompanyManager';
import { MarketCapSettings } from '@/components/settings/MarketCapSettings';
import PriceUpdateSettings from '@/components/settings/PriceUpdateSettings';

import { AppLayout } from '@/components/navigation';

export default function SettingsPage() {
  return (
    <AppLayout>
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
            <p className="text-muted-foreground">
              Manage your application preferences and data sources
            </p>
          </div>
        </div>

        <Tabs defaultValue="nse-companies" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="nse-companies">NSE Companies</TabsTrigger>
            <TabsTrigger value="price-updates">Price Updates</TabsTrigger>
            <TabsTrigger value="preferences">Preferences</TabsTrigger>
            <TabsTrigger value="data-management">Data Management</TabsTrigger>
            <TabsTrigger value="api-settings">API Settings</TabsTrigger>
          </TabsList>

          <TabsContent value="nse-companies" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>NSE Company List Management</CardTitle>
                <CardDescription>
                  Upload and manage the NSE company list for data validation and stock price integration
                </CardDescription>
              </CardHeader>
              <CardContent>
                <NSECompanyManager />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="price-updates" className="space-y-6">
            <PriceUpdateSettings />
          </TabsContent>

          <TabsContent value="preferences" className="space-y-6">
            <MarketCapSettings />
          </TabsContent>

          <TabsContent value="data-management" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Data Management</CardTitle>
                <CardDescription>
                  Import, export, and manage your application data
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-muted-foreground">
                  Data management features will be implemented in a future update.
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="api-settings" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>API Settings</CardTitle>
                <CardDescription>
                  External API configurations and integrations
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="rounded-lg border p-4">
                    <h3 className="font-medium mb-2">Technical Analysis</h3>
                    <p className="text-sm text-muted-foreground mb-3">
                      Technical analysis charts are now powered by Yahoo Finance data and work without any API key configuration.
                    </p>
                    <div className="flex items-center gap-2 text-sm text-green-600">
                      <div className="w-2 h-2 rounded-full bg-green-500"></div>
                      <span>Active - No configuration required</span>
                    </div>
                  </div>
                  
                  <div className="text-sm text-muted-foreground">
                    Future API integrations will be configured here.
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}