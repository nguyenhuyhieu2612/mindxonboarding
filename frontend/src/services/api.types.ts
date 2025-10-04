export interface QueueItem {
  resolve: (value: string | undefined) => void;
  reject: (reason?: any) => void;
}

export type ApiResponse<T = null> = {
  success: boolean;
  message: string;
  data?: T;
  meta?: {
    totalItems: number;
    totalPages: number;
    currentPage: number;
    limit: number;
  };
};
