import React from 'react';
import { 
  Plus,
  MoreHorizontal,
  Edit,
  Trash2,
  Eye,
  Calendar
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { graphCRMService } from '../services/GraphCRMService';
import { Deal } from '../types';
import { getStageColor } from '../utils/helpers';
import { crmCache } from '../services/crmCache';

export function DealsView() {
  const [deals, setDeals] = React.useState<Deal[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const loadDeals = async () => {
      // **OPTIMIZATION: Check in-memory cache first**
      const cachedDeals = crmCache.getDeals();
      if (cachedDeals && cachedDeals.length > 0) {
        console.log('⚡ Using CRM deals cache - instant load!');
        setDeals(cachedDeals);
        setLoading(false);
        
        // Load fresh data in background
        console.log('🔄 Starting background sync for deals...');
        loadDealsInBackground();
        return;
      }

      // No cache available, show loading and load fresh data
      try {
        setLoading(true);
        console.log('📥 No deals cache available, loading fresh data...');
        const dealsData = await graphCRMService.getDeals();
        setDeals(dealsData);
        
        // Update cache with fresh data
        crmCache.setDeals(dealsData);
      } catch (error) {
        console.error('Error loading deals:', error);
      } finally {
        setLoading(false);
      }
    };

    const loadDealsInBackground = async () => {
      try {
        console.log('🔄 Background deals sync started...');
        const dealsData = await graphCRMService.getDeals();
        
        // Update cache and state with fresh data
        crmCache.setDeals(dealsData);
        setDeals(dealsData);
        
        console.log('✅ Background deals sync completed');
      } catch (error) {
        console.error('❌ Background deals sync failed:', error);
      }
    };

    loadDeals();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Deals</h2>
          <p className="text-muted-foreground">Track your sales opportunities</p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          New Deal
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-8">
              <div className="animate-pulse space-y-4">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="flex space-x-4">
                    <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                    <div className="h-4 bg-gray-200 rounded w-1/6"></div>
                    <div className="h-4 bg-gray-200 rounded w-1/6"></div>
                    <div className="h-4 bg-gray-200 rounded w-1/6"></div>
                    <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                  </div>
                ))}
              </div>
            </div>
          ) : deals.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-muted-foreground">No deals found. Deals are automatically generated from your email and calendar interactions.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/30">
                    <th className="p-4 text-left font-medium">Deal</th>
                    <th className="p-4 text-left font-medium">Value</th>
                    <th className="p-4 text-left font-medium">Stage</th>
                    <th className="p-4 text-left font-medium">Probability</th>
                    <th className="p-4 text-left font-medium">Contact</th>
                    <th className="p-4 text-left font-medium">Close Date</th>
                    <th className="p-4 text-left font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {deals.map((deal: Deal) => (
                  <tr key={deal.id} className="border-b hover:bg-muted/30">
                    <td className="p-4">
                      <div>
                        <p className="font-medium">{deal.title}</p>
                        <p className="text-xs text-muted-foreground">{deal.company}</p>
                      </div>
                    </td>
                    <td className="p-4 font-medium">${deal.value.toLocaleString()}</td>
                    <td className="p-4">
                      <Badge className={getStageColor(deal.stage)}>
                        {deal.stage.replace('-', ' ')}
                      </Badge>
                    </td>
                    <td className="p-4">{deal.probability}%</td>
                    <td className="p-4">{deal.contact}</td>
                    <td className="p-4">
                      <div className="flex items-center space-x-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span>{new Date(deal.closeDate).toLocaleDateString()}</span>
                      </div>
                    </td>
                    <td className="p-4">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                          <DropdownMenuItem>
                            <Eye className="h-4 w-4 mr-2" />
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Edit className="h-4 w-4 mr-2" />
                            Edit Deal
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-red-600">
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                                    ))}
                  </tbody>
                </table>
              </div>
            )}
        </CardContent>
      </Card>
    </div>
  );
} 