import type { inferRouterOutputs } from '@trpc/server';
import type { lcTransferRouter, factoryInvoiceRouter } from "~/server/api";

// LC Transfer types
type LcTransferRouterOutput = inferRouterOutputs<typeof lcTransferRouter>;

export type GetLCTransferByIdTypes = LcTransferRouterOutput['getLcTransferById'];

// Factory Invoice types
type FactoryInvoiceRouterOutput = inferRouterOutputs<typeof factoryInvoiceRouter>;

export type GetShipmentDetailsForTagShipmentsTypes = FactoryInvoiceRouterOutput['getShipmentDetailsForTagShipments'];

export type GetFactoryInvoiceByIdTypes = FactoryInvoiceRouterOutput['getFactoryInvoiceById'];