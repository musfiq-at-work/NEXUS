import {
  defaultShouldDehydrateQuery,
  MutationCache,
  QueryCache,
  QueryClient,
} from "@tanstack/react-query";
import { TRPCClientError } from "@trpc/client";
import SuperJSON from "superjson";

export const createQueryClient = () => {
  const handleError = (error: unknown) => { 
    if ( error instanceof TRPCClientError && error.data?.code === "FORBIDDEN" ) { 
      window.location.replace("/unauthorized"); 
    } 
  }

  return new QueryClient({
  queryCache: new QueryCache({
    onError: handleError,
  }),
  mutationCache: new MutationCache({
    onError: handleError,
  }),
  defaultOptions: {
    queries: {
      staleTime: 300 * 1000,
      retry: (failureCount, error) => {
        if (
          error instanceof TRPCClientError &&
          error.data?.code === "FORBIDDEN"
        ) {
          return false;
        }

        return failureCount < 3;
      },
    },
    mutations: {
      retry: false,
    },
    dehydrate: {
      serializeData: SuperJSON.serialize,
      shouldDehydrateQuery: (query) =>
        defaultShouldDehydrateQuery(query) ||
        query.state.status === "pending",
    },
    hydrate: {
      deserializeData: SuperJSON.deserialize,
    },
  },
});
}