import { QueryClient } from "@tanstack/react-query";

const makeQueryClient = () => {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60 * 1000,
        retry: (failureCount, error: any) => {
          // Don't retry on 401 (authentication errors)
          if (error?.status === 401) {
            return false;
          }
          // Retry up to 3 times for other errors
          return failureCount < 3;
        },
        queryFn: async ({ queryKey, signal }) => {
          const [url] = queryKey as [string];
          const res = await fetch(url, { signal });

          if (!res.ok) {
            const error = new Error(`HTTP ${res.status}: ${res.statusText}`) as any;
            error.status = res.status;
            throw error;
          }

          return res.json();
        },
      },
    },
  });
};

let browserQueryClient: QueryClient | undefined = undefined;

const getQueryClient = () => {
  if (typeof window === "undefined") {
    return makeQueryClient();
  } else {
    if (!browserQueryClient) browserQueryClient = makeQueryClient();
    return browserQueryClient;
  }
};

export const queryClient = getQueryClient();