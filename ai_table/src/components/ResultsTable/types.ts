import { ExaResultItem } from "@/types/exa"; // Adjusted path based on common project structure
import React from 'react';

// Define column type for better type safety
export type ColumnDef = {
  id: string;
  header: string;
  accessorKey: keyof EnrichedExaResultItem | ((item: EnrichedExaResultItem) => string | React.ReactNode);
  width: string; // Original percentage/tailwind width
  currentWidth?: number; // Actual pixel width, to be manipulated
  maxWidth?: number; // Maximum width in pixels
};

// Define an enriched item type that includes location and fetching status
export interface EnrichedExaResultItem extends ExaResultItem {
  location?: string;
  isFetchingLocation?: boolean;
  profileImageUrl?: string; // Added for profile picture
  isFetchingProfileImage?: boolean; // Added for profile picture fetching status
  customData?: { [columnId: string]: string | undefined };
  isFetchingCustomData?: { [columnId: string]: boolean | undefined };
  rewrittenPosition?: string; // For Gemini-processed position
  isFetchingRewrittenPosition?: boolean; // Status for fetching rewritten position
}

export interface ResultsTableProps {
  results: ExaResultItem[];
  isLoading: boolean;
} 