import React from 'react';
import { Skeleton } from "@/components/ui/skeleton";
import { ColumnDef, EnrichedExaResultItem } from '@/components/ResultsTable/types';

// Define all available columns
export const stableInitialAllAvailableColumns: ColumnDef[] = [
  { id: 'author', header: 'Name', accessorKey: (item: EnrichedExaResultItem) => (
    <div className="flex items-center space-x-2">
      {item.isFetchingProfileImage ? (
        <Skeleton className="h-8 w-8 rounded-full" />
      ) : item.profileImageUrl ? (
        <img src={item.profileImageUrl} alt={item.author || 'Profile'} className="h-8 w-8 rounded-full object-cover" />
      ) : (
        <div className="h-8 w-8 rounded-full bg-gray-300 flex items-center justify-center text-gray-600 text-xs">
          {item.author ? item.author.substring(0, 1).toUpperCase() : '?'}
        </div>
      )}
      <span>{item.author || 'N/A'}</span>
    </div>
  ), width: 'w-[12%]', currentWidth: 120, maxWidth: 150 },
  { id: 'url', header: 'LinkedIn Profile', accessorKey: (item: EnrichedExaResultItem) => (
    <div className="max-w-full overflow-hidden">
      <a
        href={item.url}
        target="_blank"
        rel="noopener noreferrer"
        className="text-blue-600 hover:text-blue-800 hover:underline truncate block"
        title={item.url}
      >
        {item.url}
      </a>
    </div>
  ), width: 'w-[20%]', currentWidth: 200, maxWidth: 250 },
  { 
    id: 'title', 
    header: 'Position', 
    accessorKey: (item: EnrichedExaResultItem) => {
      if (item.isFetchingRewrittenPosition) return "Rewriting...";
      if (item.rewrittenPosition) return item.rewrittenPosition;
      return item.title || 'N/A'; // Fallback to original title if not rewritten or error
    }, 
    width: 'w-[18%]', currentWidth: 180 
  },
  { id: 'location', header: 'Location', accessorKey: (item: EnrichedExaResultItem) => {
      if (item.isFetchingLocation) return "Loading...";
      return item.location || 'N/A';
    },
    width: 'w-[10%]', currentWidth: 100
  },
  { id: 'company', header: 'Company', accessorKey: (item: EnrichedExaResultItem) => {
      if (item.isFetchingCustomData && item.isFetchingCustomData['company']) return "Loading...";
      return (item.customData && item.customData['company']) || 'N/A';
    },
    width: 'w-[12%]', currentWidth: 120
  },
  { id: 'workEmail', header: 'Work Email', accessorKey: (item: EnrichedExaResultItem) => {
      if (item.isFetchingCustomData && item.isFetchingCustomData['workEmail']) return "Loading...";
      return (item.customData && item.customData['workEmail']) || 'N/A';
    },
    width: 'w-[15%]', currentWidth: 150
  },
  { id: 'totalExperience', header: 'Total Experience', accessorKey: (item: EnrichedExaResultItem) => {
      if (item.isFetchingCustomData && item.isFetchingCustomData['totalExperience']) return "Loading...";
      return (item.customData && item.customData['totalExperience']) || 'N/A';
    },
    width: 'w-[10%]', currentWidth: 100
  },
  { id: 'aiInsight', header: 'AI Insight', accessorKey: (item: EnrichedExaResultItem) => {
      if (item.isFetchingCustomData && item.isFetchingCustomData['aiInsight']) return "Loading...";
      return (item.customData && item.customData['aiInsight']) || 'N/A';
    },
    width: 'w-[18%]', currentWidth: 180
  },
]; 