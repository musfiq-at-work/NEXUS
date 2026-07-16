import ExcelJS from "exceljs";
import type { OrderSummaryReportRow } from "../orderSummaryReport";
import { formatDate } from "~/utils/localDateString";
import { DOLLAR_SIGN_NUMBER_FORMAT, QUANTITY_NUMBER_FORMAT, TEXT_FORMAT } from "./config";
import type { CiAndRealizationData, FactoryInvoiceData, PoWiseData } from "../commercialActivityReport";

const TABLE_HEADER_ROW = 6;

const PO_WISE_TABLE_COLUMN_COUNT = 29;
const CI_AND_REALIZATION_TABLE_COLUMN_COUNT = 12;
const FACTORY_PAYMENT_TABLE_COLUMN_COUNT = 11;

const poWiseTableColumns = [
    'buyer_name',
    'factory_name',
    'buyer_po',
    'exfactory_nos',
    'exfactory_dates',
    'shipment_quantity',
    'factory_invoice',
    'factory_invoice_date',
    'factory_invoice_quantity',
    'factory_invoice_value',
    'lc_no',
    'sales_contract_no',
    'rdl_invoice',
    'rdl_invoice_date',
    'rdl_invoice_quantity',
    'rdl_invoice_value',
    'fdbc_no',
    'fdbc_date'
]

const ciAndRealizationTableColumns = [
    'buyer_name',
    'exfactory_dates',
    'rdl_invoice',
    'rdl_invoice_date',
    'rdl_invoice_quantity',
    'rdl_invoice_value',
    'fdbc_no',
    'document_submission_date',
    'ci_no',
    'ci_date',
    'realized_amount',
    'realized_date'
]

const factoryPaymentTableColumns = [
    'buyer_name',
    'exfactory_dates',
    'factory_name',
    'lc_no',
    'sales_contract_no',
    'factory_invoice',
    'factory_invoice_date',
    'factory_invoice_quantity',
    'factory_invoice_value',
    'fdbc_no',
    'factory_payment',
    'factory_payment_date'
]



const currentTime = new Date().toLocaleTimeString('en-US', {
  hour: '2-digit',
  minute: '2-digit',
  hour12: true
});

interface ReportMeta {
    fromDate: string;
    toDate: string;
    generatedBy: string;
}

interface ActivityReportProps {
    poWiseData: PoWiseData[];
    ciAndRealizationData: CiAndRealizationData[];
    factoryInvoiceData: FactoryInvoiceData[];
    reportMeta: ReportMeta
}

export const generateActivityReportExcel = async (props: ActivityReportProps) => {
    const workbook = new ExcelJS.Workbook();

    workbook.creator = "Nexus ERP";
    workbook.created = new Date();

    const worksheet = workbook.addWorksheet("Order Summary", {
        views: [
            {
                state: "frozen",
                ySplit: TABLE_HEADER_ROW,
            },
        ],
    });

    return await workbook.xlsx.writeBuffer();
}