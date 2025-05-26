"use client";

import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Building2, 
  TrendingUp, 
  Target
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ContactDetailPage } from '@/modules/customer/components/ContactDetailPage';
import { DashboardView } from './DashboardView';
import { ContactsView } from './ContactsView';
import { DealsView } from './DealsView';
import { CompaniesView } from './CompaniesView';
import { CRMView, CRMPageProps } from '../types';

export function CRMPage({ selectedCustomerId, onCustomerBack }: CRMPageProps = {}) {
  const [currentView, setCurrentView] = useState<CRMView>('dashboard');
  const [selectedContactId, setSelectedContactId] = useState<string | null>(selectedCustomerId || null);

  // Update selectedContactId when prop changes
  useEffect(() => {
    if (selectedCustomerId) {
      setSelectedContactId(selectedCustomerId);
    }
  }, [selectedCustomerId]);

  const handleContactView = (contactId: string) => {
    setSelectedContactId(contactId);
  };

  const handleBackToCRM = () => {
    setSelectedContactId(null);
    if (onCustomerBack) {
      onCustomerBack();
    }
  };

  const renderView = () => {
    switch (currentView) {
      case 'dashboard':
        return <DashboardView />;
      case 'contacts':
        return <ContactsView onContactView={handleContactView} />;
      case 'deals':
        return <DealsView />;
      case 'companies':
        return <CompaniesView />;
      default:
        return <DashboardView />;
    }
  };

  if (selectedContactId) {
    return <ContactDetailPage contactId={selectedContactId} onBack={handleBackToCRM} />;
  }

  return (
    <div className="h-full flex flex-col">
      {/* Sub-navigation */}
      <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-40 flex-shrink-0">
        <div className="flex h-14 items-center px-6 space-x-6">
          <Button
            variant={currentView === 'dashboard' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setCurrentView('dashboard')}
          >
            <TrendingUp className="h-4 w-4 mr-2" />
            Dashboard
          </Button>
          <Button
            variant={currentView === 'contacts' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setCurrentView('contacts')}
          >
            <Users className="h-4 w-4 mr-2" />
            Contacts
          </Button>
          <Button
            variant={currentView === 'deals' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setCurrentView('deals')}
          >
            <Target className="h-4 w-4 mr-2" />
            Deals
          </Button>
          <Button
            variant={currentView === 'companies' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setCurrentView('companies')}
          >
            <Building2 className="h-4 w-4 mr-2" />
            Companies
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto p-6">
        {renderView()}
      </div>
    </div>
  );
} 