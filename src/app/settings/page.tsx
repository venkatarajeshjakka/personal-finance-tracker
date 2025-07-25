'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { NSECompanyManager } from '@/components/settings/NSECompanyManager';

export default function SettingsPage() {
  return (
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
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="nse-companies">NSE Companies</TabsTrigger>
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

        <TabsContent value="preferences" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Application Preferences</CardTitle>
              <CardDescription>
                Configure your default settings and preferences
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-muted-foreground">
                Preferences settings will be implemented in a future update.
              </div>
            </CardContent>
          </Card>
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
                Configure external API integrations and settings
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-muted-foreground">
                API settings will be implemented in a future update.
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}