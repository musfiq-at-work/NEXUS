import { createCallerFactory, createTRPCRouter } from "~/server/api/trpc";

import { 
	levelRouter, userRouter, authRouter, departmentsRouter, permissionRouter, modulesRouter, 
	authorizationsRouter, countriesRouter, currenciesRouter, overseasOfficesRouter, 
	destinationsRouter, banksRouter, companiesRouter, termsRouter, paymentTermsRouter, 
	productTypeRouter, productsRouter, fabricsRouter, fabricsSuppliersRouter, colorsRouter, 
	fobTypesRouter, freightTermsRouter, courierRouter, tnaActionsRouter, factoryRouter, buyerRouter,
	seasonsRouter, teamsRouter, handoverDatesRouter, buyerOrdersRouter, factoryOrderRouter, 
	tnaBaseActionRouter, tnaTemplatesRouter, tnaPlanRouter, commissionDistributionRouter,
	scContactPersonRouter, salesContractsRouter, salesContractAmendmentRouter, lcMasterRouter, 
	lcAmendmentRouter, toleranceLevelRouter, exFactoryRouter, lcTransferRouter, factoryInvoiceRouter, 
	evPermissionRouter, rdlInvoiceRouter, documentSubmissionRouter, commissionInvoiceRouter,
	proceedRealizationRouter, factoryPaymentRouter, salesReportRouter, exportReportRouter,
	orderSummaryReportRouter, debitNotesRouter,
} from '.';

// All routers added in /api/routers should be manually added here.
export const appRouter = createTRPCRouter({
	// admin routers
	auth: authRouter,
	users: userRouter,
	levels: levelRouter,
	departments: departmentsRouter,
	permissions: permissionRouter,
	modules: modulesRouter,
	authorizations: authorizationsRouter,
	teams: teamsRouter,
	evPermissions: evPermissionRouter,

	// library routers
	countries: countriesRouter,
	currencies: currenciesRouter,
	overseasOffices: overseasOfficesRouter,
	destinations: destinationsRouter,
	banks: banksRouter,
	companies: companiesRouter,
	terms: termsRouter,
	paymentTerms: paymentTermsRouter,
	productType: productTypeRouter,
	products: productsRouter,
	fabrics: fabricsRouter,
	fabricSuppliers: fabricsSuppliersRouter,
	colors: colorsRouter,
	fobTypes: fobTypesRouter,
	freightTerms: freightTermsRouter,
	courier: courierRouter,
	tnaActions: tnaActionsRouter,
	factory: factoryRouter,
	buyers: buyerRouter,
	seasons: seasonsRouter,
	handoverDates: handoverDatesRouter,
	tnaBaseAction: tnaBaseActionRouter,
	scContactPerson: scContactPersonRouter,
	toleranceLevel: toleranceLevelRouter,

	// merchandising routers
	buyerOrders: buyerOrdersRouter,
	factoryOrder: factoryOrderRouter,
	tnaTemplates: tnaTemplatesRouter,
	tnaPlan: tnaPlanRouter,
	commissionDistribution: commissionDistributionRouter,
	salesContracts: salesContractsRouter,
	salesContractAmendments: salesContractAmendmentRouter,
	lcMaster: lcMasterRouter,
	lcAmendment: lcAmendmentRouter,
	exFactory: exFactoryRouter,

	// commercial routers
	lcTransfer: lcTransferRouter,
	factoryInvoice: factoryInvoiceRouter,
	rdlInvoice: rdlInvoiceRouter,
	documentSubmission: documentSubmissionRouter,

	// accounting routers
	commissionInvoice: commissionInvoiceRouter,
	proceedRealization: proceedRealizationRouter,
	factoryPayment: factoryPaymentRouter,
	debitNotes: debitNotesRouter,

	// reports routers
	salesReport: salesReportRouter,
	exportReport: exportReportRouter,
	orderSummaryReport: orderSummaryReportRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;

export const createCaller = createCallerFactory(appRouter);
