import { 
    dashboardIcon, sackDollarIcon, reportIcon, shirtIcon, bookIcon, accountsIcon, adminIcon, qualityIcon, complianceIcon,
} from "~/assets";

import type { StaticImageData } from "next/image";
import { m } from './moduleMap'

// Database ID to Icon mapping
export const icons: Record<string, StaticImageData> = {
    [m.DASHBOARD]: dashboardIcon,
    [m.LIBRARY]: bookIcon,
    [m.MERCHANDISING]: shirtIcon,
    [m.COMMERCIAL]: sackDollarIcon,
    [m.ACCOUNTING]: accountsIcon,
    [m.QUALITY]: qualityIcon,
    [m.COMPLIANCE]: complianceIcon,
    [m.ADMIN]: adminIcon,
    [m.REPORTS]: reportIcon,
};

// Database ID to URL mapping
const sideBarConfig: Record<number, {href: string;}> = {
    [m.DASHBOARD]: { href: "/dashboard" },

    // Library Module
    [m.LIBRARY]: { href: "/library" },
    [m.COMPANIES]: { href: "/library/companies" },
    [m.OVERSEAS_OFFICES]: { href: "/library/overseas_offices" },
    [m.BANKS]: { href: "/library/banks" },
    [m.BUYERS]: { href: "/library/buyers" },
    [m.PRODUCT_TYPES]: { href: "/library/product_types" },
    [m.PRODUCTS]: { href: "/library/products" },
    [m.FABRICS]: { href: "/library/fabrics" },
    [m.FABRIC_SUPPLIER]: { href: "/library/fabric_supplier" },
    [m.SEASON]: { href: "/library/season" },
    [m.COLORS]: { href: "/library/colors" },
    [m.FACTORIES]: { href: "/library/factories" },
    [m.DESTINATIONS]: { href: "/library/destinations" },
    [m.COURIERS]: { href: "/library/couriers" },
    [m.TNA_ACTIONS]: { href: "/library/tna_actions" },
    [m.COUNTRIES]: { href: "/library/countries" },
    [m.CURRENCIES]: { href: "/library/currencies" },
    [m.FOB_TYPES]: { href: "/library/fob_types" },
    [m.PAYMENT_TERMS]: { href: "/library/payment_terms" },
    [m.FREIGHT_TERMS]: { href: "/library/freight_terms" },
    [m.HANDOVER_DATES]: { href: "/library/handover_dates" },
    [m.TNA_BASE_ACTION]: { href: "/library/tna_base_action" },
    [m.SC_CONTACT_PERSON]: { href: "/library/sc_contact_person" },
    [m.SHIPMENT_TOLERANCE]: { href: "/library/shipment_tolerance" },

    // Merchandising Module
    [m.MERCHANDISING]: { href: "/merchandising" },
    [m.BUYER_ORDERS]: { href: "/merchandising/buyer_orders" },
    [m.FACTORY_ORDERS]: { href: "/merchandising/factory_orders" },
    [m.COMMISSION_DISTRIBUTION]: { href: "/merchandising/commission_distribution" },
    [m.TNA]: { href: "/merchandising/tna" },
    [m.TNA_TEMPLATES]: { href: "/merchandising/tna/tna_templates" },
    [m.TNA_PLANNING]: { href: "/merchandising/tna/tna_planning" },
    [m.TNA_EVENTS]: { href: "/merchandising/tna/tna_events" },
    [m.SALES_CONTRACT]: { href: "/merchandising/sales_contract" },
    [m.SALES_CONTRACTS]: { href: "/merchandising/sales_contract/sales_contracts" },
    [m.SALES_CONTRACT_AMENDMENTS]: { href: "/merchandising/sales_contract/sales_contract_amendments" },
    [m.LC]: { href: "/merchandising/lc" },
    [m.LC_MASTER]: { href: "/merchandising/lc/lc_master" },
    [m.LC_AMENDMENTS]: { href: "/merchandising/lc/lc_amendments" },
    [m.EX_FACTORY]: { href: "/merchandising/ex_factory" },
    [m.PENDING_EX_FACTORIES]: { href: "/merchandising/ex_factory/pending_ex_factories" },
    [m.EX_FACTORIES]: { href: "/merchandising/ex_factory/ex_factories" },

    // Admin Module
    [m.ADMIN]: { href: "/admin" },
    [m.USERS]: { href: "/admin/users" },
    [m.PERMISSIONS]: { href: "/admin/permissions" },
    [m.TEAMS]: { href: "/admin/teams" },
    [m.AUTHORIZATIONS]: { href: "/admin/authorizations" },
    [m.EV_PERMISSIONS]: { href: "/admin/ev_permissions" },

    // Commercial Module
    [m.COMMERCIAL]: { href: "/commercial" },
    [m.LC_TRANSFER]: { href: "/commercial/lc_transfer" },
    [m.FACTORY_INVOICE]: { href: "/commercial/factory_invoice" },
    [m.COMMERCIAL_TNA]: { href: "/commercial/tna" },
    [m.TNA_TEMPLATES_COMMERCIAL]: { href: "/commercial/tna/tna_templates" },
    [m.TNA_INVOICE_CLUBBING]: { href: "/commercial/tna/tna_invoice_clubbing" },
    [m.RDL_INVOICE]: { href: "/commercial/rdl_invoice" },
    [m.DOCUMENT_SUBMISSION]: { href: "/commercial/document_submission" },

    // Accounting Module
    [m.ACCOUNTING]: { href: "/accounting" },
    [m.COMMISSION_INVOICE]: { href: "/accounting/commission_invoice" },
    [m.PROCEED_REALIZATION]: { href: "/accounting/proceed_realization" },
    [m.FACTORY_PAYMENT]: { href: "/accounting/factory_payment" },
    [m.REGULAR_PAYMENT]: { href: "/accounting/factory_payment/regular_payment" },
    [m.CROSS_PAYMENT]: { href: "/accounting/factory_payment/cross_payment" },
    [m.DEBIT_NOTE]: { href: "/accounting/debit_note" },
    [m.COMMISSION_REALIZATION]: { href: "/accounting/commission_realization" },

    // Reports Module
    [m.REPORTS]: { href: "/reports" },
    
    // Merchandising Reports
    [m.SALES_REPORT]: { href: "/reports/mer_report/sales_report" },
    [m.EXPORT_REPORT]: { href: "/reports/mer_report/export_report" },
    [m.ORDER_SUMMARY_REPORT]: { href: "/reports/mer_report/order_summary_report" },

    // Commercial Reports
    [m.EXPORT_SUMMARY_LC_WISE]: { href: "/reports/com_report/export_summary_lc_wise" },
    [m.EXPORT_SUMMARY_SC_WISE]: { href: "/reports/com_report/export_summary_sc_wise" },
    [m.LC_SC_CLOSING]: { href: "/reports/com_report/lc_sc_closing" },
    [m.COMMERCIAL_ACTIVITY_REPORT]: { href: "/reports/com_report/activity_report" }
};

export default sideBarConfig;

