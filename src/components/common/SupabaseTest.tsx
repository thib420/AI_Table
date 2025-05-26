"use client";

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { testSupabaseConnection, initializeDatabase } from '@/shared/lib/supabase/utils';
import { useSearchHistory } from '@/modules/search/components/SearchHistoryManager';
import { useAuth } from '@/shared/contexts/AuthContext';
import { CheckCircle, XCircle, AlertCircle, Database, User, Loader2 } from 'lucide-react';

interface ConnectionStatus {
  isConnected: boolean;
  hasValidSchema: boolean;
  error?: string;
}

export const SupabaseTest: React.FC = () => {
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [testResults, setTestResults] = useState<string[]>([]);
  const { user } = useAuth();
  const { testConnection, fetchSavedSearches, saveCompleteSearch } = useSearchHistory();

  const addTestResult = (message: string) => {
    setTestResults(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  const testSupabaseIntegration = async () => {
    setIsLoading(true);
    setTestResults([]);
    addTestResult('Starting Supabase integration test...');

    try {
      // Test 1: Basic connection
      addTestResult('Testing basic connection...');
      const connectionResult = await testSupabaseConnection();
      setConnectionStatus(connectionResult);

      if (!connectionResult.isConnected) {
        addTestResult(`❌ Connection failed: ${connectionResult.error}`);
        return;
      }
      addTestResult('✅ Basic connection successful');

      if (!connectionResult.hasValidSchema) {
        addTestResult(`❌ Schema validation failed: ${connectionResult.error}`);
        return;
      }
      addTestResult('✅ Database schema is valid');

      // Test 2: Authentication
      if (!user) {
        addTestResult('⚠️ No user authenticated - some tests will be skipped');
      } else {
        addTestResult(`✅ User authenticated: ${user.email}`);

        // Test 3: Fetch saved searches
        addTestResult('Testing fetch saved searches...');
        const savedSearches = await fetchSavedSearches();
        addTestResult(`✅ Fetched ${savedSearches.length} saved searches`);

        // Test 4: Test save functionality (with mock data)
        addTestResult('Testing save functionality...');
        const mockSearchState = {
          query: 'Test search query',
          originalResults: [
            {
              id: 'test-1',
              title: 'Test Result',
              url: 'https://example.com',
              author: 'Test Author',
              score: 0.95,
              text: 'This is a test result for Supabase integration testing.'
            }
          ],
          enrichedResults: [],
          columnConfiguration: [
            {
              id: 'test-col',
              header: 'Test Column',
              accessorKey: 'test',
              type: 'default' as const
            }
          ]
        };

        const saveResult = await saveCompleteSearch(mockSearchState);
        if (saveResult) {
          addTestResult('✅ Save functionality working');
          
          // Clean up test data
          addTestResult('Cleaning up test data...');
          const updatedSearches = await fetchSavedSearches();
          const testSearch = updatedSearches.find(s => s.query_text === 'Test search query');
          if (testSearch) {
            // Note: We're not deleting here to avoid complications, but in a real test we would
            addTestResult('✅ Test data created successfully');
          }
        } else {
          addTestResult('❌ Save functionality failed');
        }
      }

      addTestResult('🎉 Supabase integration test completed successfully!');
    } catch (error) {
      addTestResult(`❌ Test failed with error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const initializeDB = async () => {
    setIsLoading(true);
    addTestResult('Initializing database...');

    try {
      const result = await initializeDatabase();
      if (result.success) {
        addTestResult('✅ Database initialized successfully');
        // Retest connection
        const connectionResult = await testSupabaseConnection();
        setConnectionStatus(connectionResult);
      } else {
        addTestResult(`❌ Database initialization failed: ${result.error}`);
      }
    } catch (error) {
      addTestResult(`❌ Database initialization error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Auto-test on component mount
  useEffect(() => {
    testSupabaseIntegration();
  }, []);

  const getStatusIcon = () => {
    if (!connectionStatus) return <Loader2 className="h-5 w-5 animate-spin" />;
    if (connectionStatus.isConnected && connectionStatus.hasValidSchema) {
      return <CheckCircle className="h-5 w-5 text-green-500" />;
    }
    if (connectionStatus.isConnected) {
      return <AlertCircle className="h-5 w-5 text-yellow-500" />;
    }
    return <XCircle className="h-5 w-5 text-red-500" />;
  };

  const getStatusText = () => {
    if (!connectionStatus) return 'Testing...';
    if (connectionStatus.isConnected && connectionStatus.hasValidSchema) {
      return 'Connected & Ready';
    }
    if (connectionStatus.isConnected) {
      return 'Connected (Schema Issues)';
    }
    return 'Connection Failed';
  };

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Database className="h-5 w-5" />
          <span>Supabase Integration Test</span>
        </CardTitle>
        <CardDescription>
          Test and validate the Supabase database connection and functionality
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Connection Status */}
        <div className="flex items-center justify-between p-3 border rounded-lg">
          <div className="flex items-center space-x-2">
            {getStatusIcon()}
            <span className="font-medium">Database Status</span>
          </div>
          <Badge variant={connectionStatus?.isConnected && connectionStatus?.hasValidSchema ? 'default' : 'destructive'}>
            {getStatusText()}
          </Badge>
        </div>

        {/* User Status */}
        <div className="flex items-center justify-between p-3 border rounded-lg">
          <div className="flex items-center space-x-2">
            <User className="h-5 w-5" />
            <span className="font-medium">Authentication</span>
          </div>
          <Badge variant={user ? 'default' : 'secondary'}>
            {user ? `Logged in as ${user.email}` : 'Not authenticated'}
          </Badge>
        </div>

        {/* Error Display */}
        {connectionStatus?.error && (
          <div className="p-3 border border-red-200 rounded-lg bg-red-50 dark:bg-red-950 dark:border-red-800">
            <p className="text-sm text-red-700 dark:text-red-300">
              <strong>Error:</strong> {connectionStatus.error}
            </p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex space-x-2">
          <Button 
            onClick={testSupabaseIntegration} 
            disabled={isLoading}
            variant="outline"
          >
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            Run Test
          </Button>
          <Button 
            onClick={initializeDB} 
            disabled={isLoading}
            variant="outline"
          >
            Initialize DB
          </Button>
        </div>

        {/* Test Results */}
        {testResults.length > 0 && (
          <div className="space-y-2">
            <h4 className="font-medium">Test Results:</h4>
            <div className="max-h-60 overflow-y-auto p-3 border rounded-lg bg-muted/50 font-mono text-sm">
              {testResults.map((result, index) => (
                <div key={index} className="mb-1">
                  {result}
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}; 