import React from 'react';
import { 
  Plus,
  MoreHorizontal,
  Edit,
  Trash2,
  Eye,
  Building2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Separator } from '@/components/ui/separator';
import { graphCRMService } from '../services/GraphCRMService';
import { Company } from '../types';
import { getStatusColor } from '../utils/helpers';

export function CompaniesView() {
  const [companies, setCompanies] = React.useState<Company[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const loadCompanies = async () => {
      try {
        setLoading(true);
        const companiesData = await graphCRMService.getCompanies();
        setCompanies(companiesData);
      } catch (error) {
        console.error('Error loading companies:', error);
      } finally {
        setLoading(false);
      }
    };

    loadCompanies();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Companies</h2>
          <p className="text-muted-foreground">Manage your business accounts</p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Add Company
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          // Loading skeleton
          [...Array(6)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="animate-pulse">
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="h-12 w-12 bg-gray-200 rounded"></div>
                    <div>
                      <div className="h-4 bg-gray-200 rounded w-24 mb-2"></div>
                      <div className="h-3 bg-gray-200 rounded w-16"></div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="h-3 bg-gray-200 rounded w-full"></div>
                    <div className="h-3 bg-gray-200 rounded w-3/4"></div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        ) : companies.length === 0 ? (
          <div className="col-span-full text-center py-8">
            <p className="text-muted-foreground">No companies found. Companies are automatically extracted from your contacts.</p>
          </div>
        ) : (
          companies.map((company: Company) => (
          <Card key={company.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                    <Building2 className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold">{company.name}</h3>
                    <p className="text-sm text-muted-foreground">{company.industry}</p>
                  </div>
                </div>
                <Badge className={getStatusColor(company.status)}>
                  {company.status}
                </Badge>
              </div>

              <div className="space-y-2 mb-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Size</span>
                  <span>{company.size} employees</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Location</span>
                  <span>{company.location}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Contacts</span>
                  <span>{company.contactCount}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Deal Value</span>
                  <span className="font-medium">${company.dealValue.toLocaleString()}</span>
                </div>
              </div>

              <Separator className="my-4" />

              <div className="flex items-center justify-between">
                <a 
                  href={`https://${company.website}`} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-800 text-sm"
                >
                  {company.website}
                </a>
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
                      Edit Company
                    </DropdownMenuItem>
                    <DropdownMenuItem className="text-red-600">
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </CardContent>
          </Card>
          ))
        )}
      </div>
    </div>
  );
} 