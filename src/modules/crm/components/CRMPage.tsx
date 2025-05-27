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
import { Customer360View } from './Customer360View';
import { DashboardView } from './DashboardView';
import { ContactsView } from './ContactsView';
import { DealsView } from './DealsView';
import { CompaniesView } from './CompaniesView';
import { CRMView, CRMPageProps } from '../types';

export function CRMPage({ selectedCustomerId, onCustomerBack }: CRMPageProps = {}) {
  const [currentView, setCurrentView] = useState<CRMView>('dashboard');
  const [selectedContactId, setSelectedContactId] = useState<string | null>(selectedCustomerId || null);
  const [customerEmail, setCustomerEmail] = useState<string | null>(null);

  // Update selectedContactId when prop changes
  useEffect(() => {
    console.log('🏢 CRMPage: selectedCustomerId changed to:', selectedCustomerId);
    
    if (selectedCustomerId) {
      // Check if it's an email (proper email validation) or a contact ID
      const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(selectedCustomerId);
      
      if (isEmail) {
        console.log('🏢 CRMPage: Detected email, setting customer-360 view');
        // Reset contact ID state when switching to email view
        setSelectedContactId(null);
        setCustomerEmail(selectedCustomerId);
        setCurrentView('customer-360');
      } else {
        console.log('🏢 CRMPage: Detected contact ID, setting contact view');
        // Reset email state when switching to contact view
        setCustomerEmail(null);
        setSelectedContactId(selectedCustomerId);
        setCurrentView('dashboard'); // Reset to dashboard, then contact view will be handled below
      }
    } else {
      console.log('🏢 CRMPage: No selectedCustomerId, staying on dashboard');
      // Reset both states
      setSelectedContactId(null);
      setCustomerEmail(null);
      setCurrentView('dashboard');
    }
  }, [selectedCustomerId]);

  const handleContactView = (contactId: string) => {
    setSelectedContactId(contactId);
  };

  const handleCustomer360View = (email: string) => {
    setCustomerEmail(email);
    setCurrentView('customer-360');
  };

  const handleBackToCRM = () => {
    setSelectedContactId(null);
    setCustomerEmail(null);
    setCurrentView('dashboard');
    if (onCustomerBack) {
      onCustomerBack();
    }
  };

  const renderView = () => {
    console.log('🏢 CRMPage: renderView called with currentView:', currentView, 'customerEmail:', customerEmail);
    switch (currentView) {
      case 'dashboard':
        console.log('🏢 CRMPage: Rendering DashboardView');
        return <DashboardView />;
      case 'contacts':
        console.log('🏢 CRMPage: Rendering ContactsView');
        return <ContactsView onContactView={handleContactView} />;
      case 'deals':
        console.log('🏢 CRMPage: Rendering DealsView');
        return <DealsView />;
      case 'companies':
        console.log('🏢 CRMPage: Rendering CompaniesView');
        return <CompaniesView />;
      case 'customer-360':
        console.log('🏢 CRMPage: Rendering Customer360View with email:', customerEmail);
        return customerEmail ? (
          <Customer360View 
            customerEmail={customerEmail} 
            onBack={handleBackToCRM} 
          />
        ) : (
          <DashboardView />
        );
      default:
        console.log('🏢 CRMPage: Rendering default DashboardView');
        return <DashboardView />;
    }
  };

  // Handle Customer 360 view first (highest priority)
  if (currentView === 'customer-360' && customerEmail) {
    console.log('🏢 CRMPage: Rendering Customer360View with email:', customerEmail);
    console.log('🏢 CRMPage: Current state:', { currentView, customerEmail, selectedContactId });
    return <Customer360View customerEmail={customerEmail} onBack={handleBackToCRM} />;
  }

  // Handle contact detail view
  if (selectedContactId && currentView !== 'customer-360') {
    // Double-check that selectedContactId is not an email address
    const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(selectedContactId);
    if (isEmail) {
      console.log('🏢 CRMPage: Email address detected in contact detail view, redirecting to Customer360View');
      // Safeguard: redirect email addresses to Customer360 instead of ContactDetailPage
      setCustomerEmail(selectedContactId);
      setSelectedContactId(null);
      setCurrentView('customer-360');
      return <Customer360View customerEmail={selectedContactId} onBack={handleBackToCRM} />;
    }
    
    console.log('🏢 CRMPage: Rendering ContactDetailPage with ID:', selectedContactId);
    return <ContactDetailPage contactId={selectedContactId} onBack={handleBackToCRM} />;
  }

  return (
    <div className="h-full flex flex-col">
      {/* Sub-navigation - only show when not in Customer360View */}
      {currentView !== 'customer-360' && (
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
      )}

      {/* Main Content */}
      <div className={`flex-1 overflow-y-auto ${currentView !== 'customer-360' ? 'p-6' : ''}`}>
        {renderView()}
      </div>
    </div>
  );
} 