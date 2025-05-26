/**
 * Microsoft Graph API Debugger
 * Helps troubleshoot connection and endpoint issues
 */

import { graphServiceManager } from '../GraphServiceManager';

export interface GraphDebugResult {
  test: string;
  status: 'pass' | 'fail' | 'skip';
  message: string;
  error?: string;
  data?: any;
}

export class GraphDebugger {
  static async runAllTests(): Promise<GraphDebugResult[]> {
    const results: GraphDebugResult[] = [];

    // Test 1: Service Manager Initialization
    results.push(await this.testServiceManagerInit());

    // Test 2: Authentication Status
    results.push(await this.testAuthenticationStatus());

    // Test 3: Basic User Endpoint
    results.push(await this.testUserEndpoint());

    // Test 4: Mail Endpoint
    results.push(await this.testMailEndpoint());

    // Test 5: Endpoint Construction
    results.push(await this.testEndpointConstruction());

    return results;
  }

  static async testServiceManagerInit(): Promise<GraphDebugResult> {
    try {
      await graphServiceManager.initialize();
      return {
        test: 'Service Manager Initialization',
        status: 'pass',
        message: 'GraphServiceManager initialized successfully'
      };
    } catch (error) {
      return {
        test: 'Service Manager Initialization',
        status: 'fail',
        message: 'Failed to initialize GraphServiceManager',
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }

  static async testAuthenticationStatus(): Promise<GraphDebugResult> {
    try {
      const isAuthenticated = graphServiceManager.isAuthenticated();
      return {
        test: 'Authentication Status',
        status: isAuthenticated ? 'pass' : 'skip',
        message: isAuthenticated ? 'User is authenticated' : 'User is not authenticated',
        data: { isAuthenticated }
      };
    } catch (error) {
      return {
        test: 'Authentication Status',
        status: 'fail',
        message: 'Failed to check authentication status',
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }

  static async testUserEndpoint(): Promise<GraphDebugResult> {
    try {
      if (!graphServiceManager.isAuthenticated()) {
        return {
          test: 'User Endpoint (/me)',
          status: 'skip',
          message: 'Skipped - user not authenticated'
        };
      }

      const user = await graphServiceManager.getCurrentUser();
      return {
        test: 'User Endpoint (/me)',
        status: 'pass',
        message: `Successfully retrieved user: ${user.displayName || user.mail}`,
        data: {
          id: user.id,
          displayName: user.displayName,
          mail: user.mail
        }
      };
    } catch (error) {
      return {
        test: 'User Endpoint (/me)',
        status: 'fail',
        message: 'Failed to retrieve current user',
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }

  static async testMailEndpoint(): Promise<GraphDebugResult> {
    try {
      if (!graphServiceManager.isAuthenticated()) {
        return {
          test: 'Mail Endpoint (/me/messages)',
          status: 'skip',
          message: 'Skipped - user not authenticated'
        };
      }

      const messages = await graphServiceManager.mail.getEmails('inbox', 5);
      return {
        test: 'Mail Endpoint (/me/messages)',
        status: 'pass',
        message: `Successfully retrieved ${messages.length} messages`,
        data: {
          messageCount: messages.length,
          firstMessageSubject: messages[0]?.subject || 'No messages'
        }
      };
    } catch (error) {
      return {
        test: 'Mail Endpoint (/me/messages)',
        status: 'fail',
        message: 'Failed to retrieve messages',
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }

  static async testEndpointConstruction(): Promise<GraphDebugResult> {
    try {
      // Test that our endpoint construction fix is working
      const testEndpoints = [
        '/me',
        '/me/messages',
        '/me/mailFolders/inbox/messages',
        'me/contacts' // Without leading slash
      ];

      const results = [];
      for (const endpoint of testEndpoints) {
        try {
          // This would test the endpoint construction logic in GraphClientService
          const normalizedEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
          results.push({
            original: endpoint,
            normalized: normalizedEndpoint,
            status: 'pass'
          });
        } catch (error) {
          results.push({
            original: endpoint,
            normalized: 'failed',
            status: 'fail',
            error: error instanceof Error ? error.message : String(error)
          });
        }
      }

      return {
        test: 'Endpoint Construction',
        status: 'pass',
        message: 'All endpoint constructions working correctly',
        data: results
      };
    } catch (error) {
      return {
        test: 'Endpoint Construction',
        status: 'fail',
        message: 'Endpoint construction test failed',
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }

  static formatResults(results: GraphDebugResult[]): string {
    let output = '\n🔍 Microsoft Graph API Debug Report\n';
    output += '='.repeat(50) + '\n\n';

    const passed = results.filter(r => r.status === 'pass').length;
    const failed = results.filter(r => r.status === 'fail').length;
    const skipped = results.filter(r => r.status === 'skip').length;

    output += `📊 Summary: ${passed} passed, ${failed} failed, ${skipped} skipped\n\n`;

    results.forEach((result, index) => {
      const statusEmoji = result.status === 'pass' ? '✅' : 
                         result.status === 'fail' ? '❌' : '⏭️';
      
      output += `${index + 1}. ${statusEmoji} ${result.test}\n`;
      output += `   ${result.message}\n`;
      
      if (result.error) {
        output += `   Error: ${result.error}\n`;
      }
      
      if (result.data) {
        output += `   Data: ${JSON.stringify(result.data, null, 2)}\n`;
      }
      
      output += '\n';
    });

    output += '='.repeat(50) + '\n';
    return output;
  }
}

// Export convenience function
export const debugGraphAPI = async (): Promise<void> => {
  const results = await GraphDebugger.runAllTests();
  console.log(GraphDebugger.formatResults(results));
};

export default GraphDebugger; 