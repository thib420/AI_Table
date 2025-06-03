import React, { useState, useEffect } from 'react';
import { usePersistentData } from '@/shared/hooks/usePersistentData';
import { unifiedCRMService } from '../services/UnifiedCRMService';
import { Contact, Deal, Company } from '../types';
import { StatsGrid } from './dashboard/StatsGrid';
import { ActivityChart } from './dashboard/ActivityChart';
import { RecentDeals } from './dashboard/RecentDeals';
import { TopContacts } from './dashboard/TopContacts';
import { LoadingSpinner } from '@/components/ui/loading';

export function DashboardView() {
  const persistentData = usePersistentData();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [deals, setDeals] = useState<Deal[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);

  React.useEffect(() => {
    let unsubscribe: (() => void) | null = null;

    const loadData = async () => {
      if (!persistentData.isInitialized) return;
      
      setLoading(true);
      
      // Subscribe to persistent data updates
      console.log('📊 DashboardView: Subscribing to persistent data service');
      console.log('📊 Persistent mode:', persistentData.isPersistentMode ? 'ENABLED' : 'DISABLED (fallback)');
      
      unsubscribe = persistentData.subscribe('dashboard', async (data) => {
        console.log('📊 DashboardView: Received data update', {
          contacts: data.contacts.length,
          emails: data.emails.length,
          meetings: data.meetings.length,
          isLoading: data.isLoading,
          persistentMode: persistentData.isPersistentMode
        });

        // If still loading, wait
        if (data.isLoading) {
          setLoading(true);
          return;
        }

        try {
          // Get all data from unified service
          const [contactsData, dealsData, companiesData] = await Promise.all([
            unifiedCRMService.getAllContacts(),
            unifiedCRMService.getDeals(),
            unifiedCRMService.getCompanies()
          ]);
          
          setContacts(contactsData);
          setDeals(dealsData);
          setCompanies(companiesData);
          setLoading(false);
          
          console.log('✅ Dashboard data loaded from persistent unified service');
        } catch (error) {
          console.error('❌ Failed to process unified data:', error);
          setLoading(false);
        }
      });

      // Trigger initial data load
      try {
        await persistentData.getData();
      } catch (error) {
        console.error('❌ Failed to load unified data:', error);
        setLoading(false);
      }
    };

    loadData();

    // Cleanup subscription on unmount
    return () => {
      if (unsubscribe) {
        console.log('📊 DashboardView: Unsubscribing from persistent data service');
        unsubscribe();
      }
    };
  }, [persistentData.isInitialized]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner message={
          persistentData.isPersistentMode 
            ? "Loading from persistent cache..." 
            : "Loading data..."
        } />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">CRM Dashboard</h1>
        <div className="text-sm text-muted-foreground">
          {persistentData.isPersistentMode ? (
            <span className="text-green-600">📈 Persistent Cache Active</span>
          ) : (
            <span className="text-orange-600">⚡ Fallback Mode</span>
          )}
        </div>
      </div>
      
      <StatsGrid contacts={contacts} deals={deals} companies={companies} />
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ActivityChart deals={deals} />
        <RecentDeals deals={deals} />
      </div>
      
      <TopContacts contacts={contacts} />
    </div>
  );
} 