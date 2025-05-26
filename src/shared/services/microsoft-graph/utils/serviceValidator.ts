/**
 * Service Validator - Ensures Microsoft Graph services are properly configured
 */

export interface ServiceValidationResult {
  isValid: boolean;
  service: string;
  issues: string[];
  recommendations: string[];
}

export interface ValidationReport {
  overall: 'pass' | 'warning' | 'fail';
  services: ServiceValidationResult[];
  summary: {
    total: number;
    passed: number;
    warnings: number;
    failed: number;
  };
}

export class ServiceValidator {
  /**
   * Validate Microsoft Graph service configuration
   */
  static async validateConfiguration(): Promise<ValidationReport> {
    const results: ServiceValidationResult[] = [];

    // Validate environment variables
    results.push(this.validateEnvironment());

    // Validate service availability
    results.push(await this.validateServiceAvailability());

    // Validate authentication configuration
    results.push(this.validateAuthConfiguration());

    // Generate summary
    const summary = {
      total: results.length,
      passed: results.filter(r => r.isValid && r.issues.length === 0).length,
      warnings: results.filter(r => r.isValid && r.issues.length > 0).length,
      failed: results.filter(r => !r.isValid).length
    };

    const overall = summary.failed > 0 ? 'fail' : 
                   summary.warnings > 0 ? 'warning' : 'pass';

    return {
      overall,
      services: results,
      summary
    };
  }

  private static validateEnvironment(): ServiceValidationResult {
    const issues: string[] = [];
    const recommendations: string[] = [];

    // Check required environment variables
    const clientId = process.env.NEXT_PUBLIC_MICROSOFT_CLIENT_ID;
    if (!clientId) {
      issues.push('NEXT_PUBLIC_MICROSOFT_CLIENT_ID is not set');
      recommendations.push('Set NEXT_PUBLIC_MICROSOFT_CLIENT_ID in your .env.local file');
    } else if (clientId === '60b4dc1e-3b6a-4f78-a84c-d02984c1ba7c') {
      recommendations.push('Using default client ID - consider using your own Azure app registration');
    }

    // Check for development vs production settings
    if (process.env.NODE_ENV === 'production') {
      if (!process.env.MICROSOFT_CLIENT_SECRET) {
        recommendations.push('Consider setting MICROSOFT_CLIENT_SECRET for production');
      }
    }

    return {
      isValid: issues.length === 0,
      service: 'Environment Configuration',
      issues,
      recommendations
    };
  }

  private static async validateServiceAvailability(): Promise<ServiceValidationResult> {
    const issues: string[] = [];
    const recommendations: string[] = [];

    try {
      // Check if we're in a browser environment
      if (typeof window === 'undefined') {
        recommendations.push('Service validation should be run in browser environment');
        return {
          isValid: true,
          service: 'Service Availability',
          issues,
          recommendations
        };
      }

      // Try to import and check services
      const { graphServiceManager } = await import('../GraphServiceManager');
      
      if (!graphServiceManager) {
        issues.push('GraphServiceManager is not available');
      }

      // Check if services are properly initialized
      if (graphServiceManager && !graphServiceManager.isInitialized()) {
        recommendations.push('Services are not yet initialized - call graphServiceManager.initialize()');
      }

    } catch (error) {
      issues.push(`Failed to load services: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    return {
      isValid: issues.length === 0,
      service: 'Service Availability',
      issues,
      recommendations
    };
  }

  private static validateAuthConfiguration(): ServiceValidationResult {
    const issues: string[] = [];
    const recommendations: string[] = [];

    // Check redirect URI configuration
    if (typeof window !== 'undefined') {
      const currentOrigin = window.location.origin;
      const expectedRedirectUri = `${currentOrigin}/auth/callback`;
      
      recommendations.push(`Ensure your Azure app registration includes redirect URI: ${expectedRedirectUri}`);
    }

    // Check required scopes
    const requiredScopes = [
      'User.Read',
      'Mail.Read',
      'Contacts.Read',
      'People.Read'
    ];

    recommendations.push(`Ensure your Azure app has permissions for: ${requiredScopes.join(', ')}`);

    return {
      isValid: issues.length === 0,
      service: 'Authentication Configuration',
      issues,
      recommendations
    };
  }

  /**
   * Generate a human-readable validation report
   */
  static formatValidationReport(report: ValidationReport): string {
    let output = '\n🔍 Microsoft Graph Services Validation Report\n';
    output += '='.repeat(50) + '\n\n';

    // Overall status
    const statusEmoji = report.overall === 'pass' ? '✅' : 
                       report.overall === 'warning' ? '⚠️' : '❌';
    output += `${statusEmoji} Overall Status: ${report.overall.toUpperCase()}\n\n`;

    // Summary
    output += `📊 Summary:\n`;
    output += `   Total Services: ${report.summary.total}\n`;
    output += `   ✅ Passed: ${report.summary.passed}\n`;
    output += `   ⚠️ Warnings: ${report.summary.warnings}\n`;
    output += `   ❌ Failed: ${report.summary.failed}\n\n`;

    // Detailed results
    output += `📋 Detailed Results:\n`;
    report.services.forEach((service, index) => {
      const serviceEmoji = service.isValid ? 
        (service.issues.length > 0 ? '⚠️' : '✅') : '❌';
      
      output += `\n${index + 1}. ${serviceEmoji} ${service.service}\n`;
      
      if (service.issues.length > 0) {
        output += `   Issues:\n`;
        service.issues.forEach(issue => {
          output += `   • ${issue}\n`;
        });
      }
      
      if (service.recommendations.length > 0) {
        output += `   Recommendations:\n`;
        service.recommendations.forEach(rec => {
          output += `   • ${rec}\n`;
        });
      }
    });

    output += '\n' + '='.repeat(50) + '\n';
    return output;
  }

  /**
   * Quick health check for runtime validation
   */
  static async quickHealthCheck(): Promise<{
    status: 'healthy' | 'degraded' | 'unhealthy';
    message: string;
  }> {
    try {
      if (typeof window === 'undefined') {
        return {
          status: 'healthy',
          message: 'Server-side environment - services available'
        };
      }

      const { graphServiceManager } = await import('../GraphServiceManager');
      const health = await graphServiceManager.healthCheck();
      
      return {
        status: health.status,
        message: `Services: ${Object.keys(health.services).length}, Errors: ${health.errors?.length || 0}`
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        message: `Health check failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }
}

// Export convenience functions
export const validateServices = ServiceValidator.validateConfiguration;
export const quickHealthCheck = ServiceValidator.quickHealthCheck;
export const formatReport = ServiceValidator.formatValidationReport; 