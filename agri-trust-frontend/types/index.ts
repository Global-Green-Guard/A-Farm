// types/index.ts

export interface Stat {
    id: string;
    title: string;
    value: string | number;
    icon?: string; // Optional: For an icon component
  }
  
  export type BatchStatus = 'Registered' | 'Verifying' | 'Certified' | 'Listed' | 'In Transit' | 'Sold' | 'Needs Attention';
  
  export interface Batch {
    id: string; // Unique Batch ID (e.g., uuid-batch-123)
    productId: string;
    productName: string;
    quantity: number;
    unit: string; // e.g., 'KG', 'Units'
    status: BatchStatus;
    imageUrl?: string; // Optional image URL (e.g., from IPFS)
    creationDate: string; // ISO Date string
    nftId?: string; // Optional: e.g., "0.0.xxxxx/1"
  }
  
  export interface Activity {
    id: string;
    timestamp: string; // ISO Date string
    description: string;
    batchId?: string; // Link to a specific batch if applicable
  }
  
  export interface PendingAction {
    id: string;
    description: string;
    batchId?: string; // Link to a specific batch
    actionLink?: string; // Link to the relevant page/action
  }