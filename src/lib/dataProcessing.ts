import { EnrichedExaResultItem } from '@/features/search/services/ai-column-generator';
import { ColumnFilter } from '@/features/search/components/ColumnFilter';
import { ColumnSort, sortData } from '@/features/search/components/ColumnSort';

export class DataProcessingUtils {
  static applyFilters(data: EnrichedExaResultItem[], filters: ColumnFilter[]): EnrichedExaResultItem[] {
    if (filters.length === 0) return data;

    return data.filter(item => {
      return filters.every(filter => {
        const value = item[filter.columnId as keyof EnrichedExaResultItem];
        const stringValue = value ? value.toString().toLowerCase() : '';
        
        if (Array.isArray(filter.value)) {
          // Select filter type
          return filter.value.some(filterVal => 
            stringValue.includes(filterVal.toLowerCase())
          );
        } else {
          const filterValue = filter.value.toLowerCase();
          
          switch (filter.type) {
            case 'contains':
              return stringValue.includes(filterValue);
            case 'text':
              return stringValue === filterValue;
            case 'startsWith':
              return stringValue.startsWith(filterValue);
            case 'endsWith':
              return stringValue.endsWith(filterValue);
            default:
              return stringValue.includes(filterValue);
          }
        }
      });
    });
  }

  static sortResults(
    data: EnrichedExaResultItem[], 
    sort: ColumnSort | null
  ): EnrichedExaResultItem[] {
    return sortData(data, sort, (item, colId) => item[colId as keyof EnrichedExaResultItem]);
  }

  static processAndSort(
    data: EnrichedExaResultItem[], 
    filters: ColumnFilter[], 
    sort: ColumnSort | null
  ): EnrichedExaResultItem[] {
    const filteredData = this.applyFilters(data, filters);
    return this.sortResults(filteredData, sort);
  }
} 