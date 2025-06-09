import dynamic from 'next/dynamic';
import { fluidDataService } from './FluidDataService';

interface PreloadConfig {
  preloadComponents: boolean;
  preloadData: boolean;
  preloadOnHover: boolean;
  preloadOnVisible: boolean;
}

interface ModuleManifest {
  component: () => Promise<any>;
  dependencies: string[];
  dataRequirements: string[];
  criticalData: string[];
}

/**
 * Route Preloader - Intelligent prefetching for seamless navigation
 * 
 * Features:
 * - Component preloading on route hints
 * - Data prefetching based on navigation patterns
 * - Hover-based preloading for instant navigation
 * - Visibility-based preloading for likely next routes
 */
export class RoutePreloader {
  private static instance: RoutePreloader;
  private preloadedComponents = new Set<string>();
  private preloadedData = new Set<string>();
  private config: PreloadConfig = {
    preloadComponents: true,
    preloadData: true,
    preloadOnHover: true,
    preloadOnVisible: true
  };

  private moduleManifest: Record<string, ModuleManifest> = {
    'mailbox': {
      component: () => import('@/modules/mailbox').then(m => m.MailboxPage),
      dependencies: ['@/modules/mailbox/hooks/useUnifiedMailbox'],
      dataRequirements: ['emails', 'folders'],
      criticalData: ['folders'] // Load folders first for mailbox structure
    },
    'crm': {
      component: () => import('@/modules/crm').then(m => m.CRMPage),
      dependencies: ['@/modules/crm/services/UnifiedCRMService'],
      dataRequirements: ['contacts', 'meetings', 'emails'],
      criticalData: ['contacts'] // Load contacts first for CRM
    },
    'campaigns': {
      component: () => import('@/modules/campaigns').then(m => m.EmailCampaignPage),
      dependencies: ['@/modules/campaigns/components/EmailSequenceBuilder'],
      dataRequirements: ['contacts'],
      criticalData: ['contacts'] // Campaigns need contacts for targeting
    },
    'ai-table': {
      component: () => import('@/components/layout/AppLayout').then(m => m.AppLayout),
      dependencies: [],
      dataRequirements: [], // AI table doesn't need Graph data
      criticalData: []
    }
  };

  private constructor() {}

  static getInstance(): RoutePreloader {
    if (!RoutePreloader.instance) {
      RoutePreloader.instance = new RoutePreloader();
    }
    return RoutePreloader.instance;
  }

  /**
   * Configure preloader behavior
   */
  configure(config: Partial<PreloadConfig>): void {
    this.config = { ...this.config, ...config };
    console.log('🎯 RoutePreloader: Configuration updated', this.config);
  }

  /**
   * Preload route component and data
   */
  async preloadRoute(routeKey: string, options: { priority?: 'high' | 'low', immediate?: boolean } = {}): Promise<void> {
    const { priority = 'low', immediate = false } = options;
    
    console.log(`🔮 RoutePreloader: Preloading route '${routeKey}' (priority: ${priority})`);

    const manifest = this.moduleManifest[routeKey];
    if (!manifest) {
      console.warn(`⚠️ RoutePreloader: No manifest found for route '${routeKey}'`);
      return;
    }

    const tasks: Promise<void>[] = [];

    // Preload component
    if (this.config.preloadComponents && !this.preloadedComponents.has(routeKey)) {
      tasks.push(this.preloadComponent(routeKey, manifest, priority));
    }

    // Preload data
    if (this.config.preloadData && !this.preloadedData.has(routeKey)) {
      tasks.push(this.preloadData(routeKey, manifest, immediate));
    }

    // Execute tasks based on priority
    if (priority === 'high' || immediate) {
      await Promise.allSettled(tasks);
    } else {
      // Low priority - don't block, execute in background
      Promise.allSettled(tasks).catch(console.error);
    }
  }

  /**
   * Preload component code
   */
  private async preloadComponent(routeKey: string, manifest: ModuleManifest, priority: string): Promise<void> {
    if (this.preloadedComponents.has(routeKey)) return;

    try {
      console.log(`📦 RoutePreloader: Preloading component for '${routeKey}'`);
      
      // Use requestIdleCallback for low priority preloading
      if (priority === 'low' && 'requestIdleCallback' in window) {
        await new Promise<void>((resolve) => {
          (window as any).requestIdleCallback(async () => {
            await manifest.component();
            resolve();
          });
        });
      } else {
        await manifest.component();
      }
      
      this.preloadedComponents.add(routeKey);
      console.log(`✅ RoutePreloader: Component '${routeKey}' preloaded`);
    } catch (error) {
      console.error(`❌ RoutePreloader: Failed to preload component '${routeKey}':`, error);
    }
  }

  /**
   * Preload route data
   */
  private async preloadData(routeKey: string, manifest: ModuleManifest, immediate: boolean): Promise<void> {
    if (this.preloadedData.has(routeKey) || manifest.dataRequirements.length === 0) return;

    try {
      console.log(`📊 RoutePreloader: Preloading data for '${routeKey}'`, manifest.dataRequirements);
      
      if (immediate) {
        // High priority - preload critical data first
        for (const dataType of manifest.criticalData) {
          await this.preloadDataType(dataType);
        }
        
        // Then preload remaining data
        const remainingData = manifest.dataRequirements.filter(d => !manifest.criticalData.includes(d));
        await Promise.allSettled(remainingData.map(d => this.preloadDataType(d)));
      } else {
        // Low priority - prefetch in background
        fluidDataService.prefetchForModule(routeKey);
      }
      
      this.preloadedData.add(routeKey);
      console.log(`✅ RoutePreloader: Data for '${routeKey}' preloaded`);
    } catch (error) {
      console.error(`❌ RoutePreloader: Failed to preload data for '${routeKey}':`, error);
    }
  }

  /**
   * Preload specific data type
   */
  private async preloadDataType(dataType: string): Promise<void> {
    switch (dataType) {
      case 'emails':
        await fluidDataService.getEmails();
        break;
      case 'contacts':
        await fluidDataService.getContacts();
        break;
      case 'meetings':
        await fluidDataService.getMeetings();
        break;
      case 'folders':
        await fluidDataService.getFolders();
        break;
      default:
        console.warn(`⚠️ RoutePreloader: Unknown data type '${dataType}'`);
    }
  }

  /**
   * Preload on hover (for navigation links)
   */
  preloadOnHover(routeKey: string): void {
    if (!this.config.preloadOnHover) return;
    
    // Delay slightly to avoid preloading on accidental hovers
    setTimeout(() => {
      this.preloadRoute(routeKey, { priority: 'low' });
    }, 100);
  }

  /**
   * Preload when element becomes visible
   */
  preloadOnVisible(routeKey: string, element: Element): void {
    if (!this.config.preloadOnVisible || !('IntersectionObserver' in window)) return;

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          this.preloadRoute(routeKey, { priority: 'low' });
          observer.unobserve(element);
        }
      });
    }, { 
      threshold: 0.1,
      rootMargin: '50px' // Start preloading 50px before element is visible
    });

    observer.observe(element);
  }

  /**
   * Intelligent preloading based on navigation patterns
   */
  preloadBasedOnPattern(currentRoute: string, navigationHistory: string[]): void {
    const patterns = this.analyzeNavigationPatterns(currentRoute, navigationHistory);
    
    patterns.forEach(({ route, probability }) => {
      if (probability > 0.5) {
        this.preloadRoute(route, { priority: 'low' });
      }
    });
  }

  /**
   * Analyze navigation patterns to predict next routes
   */
  private analyzeNavigationPatterns(currentRoute: string, history: string[]): Array<{ route: string, probability: number }> {
    const predictions: Array<{ route: string, probability: number }> = [];
    
    // Common navigation patterns
    const patterns = {
      'ai-table': ['crm', 'mailbox'], // Search often leads to CRM or email
      'mailbox': ['crm'], // Email often leads to customer view
      'crm': ['campaigns', 'mailbox'], // CRM often leads to campaigns or back to email
      'campaigns': ['crm'] // Campaigns often lead back to CRM
    };

    const likelyNext = patterns[currentRoute as keyof typeof patterns] || [];
    
    likelyNext.forEach(route => {
      // Calculate probability based on recent history
      const recentVisits = history.slice(-5);
      const hasVisitedRecently = recentVisits.includes(route);
      const probability = hasVisitedRecently ? 0.7 : 0.4;
      
      predictions.push({ route, probability });
    });

    return predictions;
  }

  /**
   * Warm up all critical routes
   */
  async warmUp(): Promise<void> {
    console.log('🔥 RoutePreloader: Warming up critical routes...');
    
    const criticalRoutes = ['mailbox', 'crm']; // Most commonly used routes
    
    await Promise.allSettled(
      criticalRoutes.map(route => 
        this.preloadRoute(route, { priority: 'low' })
      )
    );
    
    console.log('✅ RoutePreloader: Warm up completed');
  }

  /**
   * Clear preload cache
   */
  clearCache(): void {
    this.preloadedComponents.clear();
    this.preloadedData.clear();
    console.log('🧹 RoutePreloader: Cache cleared');
  }

  /**
   * Get preload status for debugging
   */
  getStatus(): { components: string[], data: string[] } {
    return {
      components: Array.from(this.preloadedComponents),
      data: Array.from(this.preloadedData)
    };
  }
}

export const routePreloader = RoutePreloader.getInstance();