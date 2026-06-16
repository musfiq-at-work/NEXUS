import type { inferRouterOutputs } from '@trpc/server';
import type { commissionInvoiceRouter } from "~/server/api";

// Commission Invoice types
type CommissionInvoiceRouterOutput = inferRouterOutputs<typeof commissionInvoiceRouter>;

export type GetCommissionInvoiceByIdTypes = CommissionInvoiceRouterOutput['getCommissionInvoiceById'];