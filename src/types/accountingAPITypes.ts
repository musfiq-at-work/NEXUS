import type { inferRouterOutputs } from '@trpc/server';
import type { commissionInvoiceRouter, proceedRealizationRouter, factoryPaymentRouter } from "~/server/api";

// Commission Invoice types
type CommissionInvoiceRouterOutput = inferRouterOutputs<typeof commissionInvoiceRouter>;

export type GetCommissionInvoiceByIdTypes = CommissionInvoiceRouterOutput['getCommissionInvoiceById'];

// Proceed Realization types
type ProceedRealizationRouterOutput = inferRouterOutputs<typeof proceedRealizationRouter>;

export type GetProceedRealizationByIdTypes = ProceedRealizationRouterOutput['getProceedRealizationById'];

// Factory Payment types
type FactoryPaymentRouterOutput = inferRouterOutputs<typeof factoryPaymentRouter>;

export type GetFactoryPaymentByIdTypes = FactoryPaymentRouterOutput['getFactoryPaymentById'];