import ExcelJS from "exceljs";
import { formatDate } from "~/utils/localDateString";
import { DOLLAR_SIGN_NUMBER_FORMAT, QUANTITY_NUMBER_FORMAT, TEXT_FORMAT } from "./config";
import type { CiAndRealizationData, FactoryInvoiceData, PoWiseData } from "../commercialActivityReport";

const TABLE_HEADER_ROW = 6;

const PO_WISE_TABLE_COLUMN_COUNT = 18;
const CI_AND_REALIZATION_TABLE_COLUMN_COUNT = 12;
const FACTORY_PAYMENT_TABLE_COLUMN_COUNT = 12;

const poWiseTableColumns = [
    { key: 'buyer_name', width: 25 },
    { key: 'factory_name', width: 25 },
    { key: 'buyer_po', width: 15 },
    { key: 'exfactory_nos', width: 15 },
    { key: 'exfactory_dates', width: 15 },
    { key: 'shipment_quantity', width: 15 },
    { key: 'factory_invoice', width: 25 },
    { key: 'factory_invoice_date', width: 15 },
    { key: 'factory_invoice_quantity', width: 15 },
    { key: 'factory_invoice_value', width: 20 },
    { key: 'lc_no', width: 25 },
    { key: 'sales_contract_no', width: 25 },
    { key: 'rdl_invoice', width: 25 },
    { key: 'rdl_invoice_date', width: 15 },
    { key: 'rdl_invoice_quantity', width: 15 },
    { key: 'rdl_invoice_value', width: 20 },
    { key: 'fdbc_no', width: 25 },
    { key: 'fdbc_date', width: 15 }
]

const poWiseTableHeader = [
    'Buyer Name',
    'Factory Name',
    'Buyer PO',
    'Exfactory Nos',
    'Exfactory Dates',
    'Shipment Quantity',
    'Factory Invoice',
    'Factory Invoice Date',
    'Factory Invoice Quantity',
    'Factory Invoice Value',
    'LC No',
    'Sales Contract No',
    'RDL Invoice',
    'RDL Invoice Date',
    'RDL Invoice Quantity',
    'RDL Invoice Value',
    'FDBC No',
    'FDBC Date'
]

const ciAndRealizationTableColumns = [
    { key: 'buyer_name', width: 25 },
    { key: 'exfactory_dates', width: 15 },
    { key: 'rdl_invoice', width: 25 },
    { key: 'rdl_invoice_date', width: 15 },
    { key: 'rdl_invoice_quantity', width: 15 },
    { key: 'rdl_invoice_value', width: 20 },
    { key: 'fdbc_no', width: 25 },
    { key: 'document_submission_date', width: 15 },
    { key: 'ci_no', width: 30 },
    { key: 'ci_date', width: 15 },
    { key: 'realized_amount', width: 20 },
    { key: 'realized_date', width: 15 },
]

const ciAndRealizationTableHeader = [
    'Buyer Name',
    'Exfactory Dates',
    'RDL Invoice',
    'RDL Invoice Date',
    'RDL Invoice Quantity',
    'RDL Invoice Value',
    'Document Submission',
    'Document Submission Date',
    'Commission Invoice',
    'Commission Invoice Date',
    'Realized Amount',
    'Realized Date'
]

const factoryPaymentTableColumns = [
    { key: 'buyer_name', width: 25 }, 
    { key: 'exfactory_dates', width: 15 }, 
    { key: 'factory_name', width: 25 }, 
    { key: 'lc_no', width: 25 }, 
    { key: 'sales_contract_no', width: 25 }, 
    { key: 'factory_invoice', width: 25 }, 
    { key: 'factory_invoice_date', width: 15 }, 
    { key: 'factory_invoice_quantity', width: 15 }, 
    { key: 'factory_invoice_value', width: 20 }, 
    { key: 'fdbc_no', width: 30 }, 
    { key: 'factory_payment', width: 25 }, 
    { key: 'factory_payment_date', width: 15 }, 
]

const factoryPaymentTableHeader = [
    'Buyer Name',
    'Exfactory Dates',
    'Factory Name',
    'LC No',
    'Sales Contract No',
    'Factory Invoice',
    'Factory Invoice Date',
    'Factory Invoice Quantity',
    'Factory Invoice Value',
    'Document Submission',
    'Factory Payment',
    'Payment Date'
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
    const { poWiseData, ciAndRealizationData, factoryInvoiceData, reportMeta } = props;

    const workbook = new ExcelJS.Workbook();

    workbook.creator = "Nexus ERP";
    workbook.created = new Date();
    workbook.company = "Renaissance Designs Limited";
    workbook.subject = "Post-Exfactory Commercial Activity Report";
    workbook.title = "Post-Exfactory Commercial Activity Report";
    workbook.category = "Commercial Reports";
    workbook.manager = reportMeta.generatedBy;

    const poWiseWorksheet = workbook.addWorksheet("Po Wise Data", {
        views: [
            {
                state: "frozen",
                ySplit: TABLE_HEADER_ROW,
            },
        ],
    });

    poWiseWorksheet.columns = poWiseTableColumns;

    poWiseWorksheet.mergeCells(1, 1, 1, 6);
    poWiseWorksheet.mergeCells(2, 1, 2, 2);
    poWiseWorksheet.mergeCells(3, 1, 3, 2);
    poWiseWorksheet.mergeCells(4, 1, 4, 2);

    poWiseWorksheet.getCell("A1").value = `Post-Exfactory Commercial Activity Report`;
    poWiseWorksheet.getCell("A2").value = `Date Range: ${formatDate(reportMeta.fromDate)} to ${formatDate(reportMeta.toDate)}`;
    poWiseWorksheet.getCell("A3").value = `Generated by: ${reportMeta.generatedBy}`;
    poWiseWorksheet.getCell("A4").value = `Generated on: ${formatDate(new Date())} at ${currentTime}`;

    poWiseWorksheet.getRow(1).font = {
        bold: true,
        size: 20,
        color: { argb: "FF1F1F1F" },
    };

    poWiseWorksheet.getRow(2).font = {
        size: 11,
        color: { argb: "FF4B4B4B" },
    };

    poWiseWorksheet.getRow(3).font = {
        size: 11,
        color: { argb: "FF4B4B4B" },
    };

    poWiseWorksheet.getRow(4).font = {
        size: 11,
        color: { argb: "FF4B4B4B" },
    };

    poWiseWorksheet.getRow(6).font = {
        bold: true,
        color: { argb: "FFFFFFFF" },
    };
 
    poWiseWorksheet.getRow(6).fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "1F4E78" },
    };

    poWiseWorksheet.getRow(TABLE_HEADER_ROW).values = [...poWiseTableHeader];

    poWiseWorksheet.autoFilter = {
        from: "A6",
        to: "AC6",
    };

    poWiseWorksheet.getRow(1).height = 22;
    poWiseWorksheet.getRow(2).height = 18;
    poWiseWorksheet.getRow(3).height = 18;
    poWiseWorksheet.getRow(6).height = 20;
    
    poWiseData.forEach((row) => poWiseWorksheet.addRow(row));

    // Remove borders from the first 4 rows and all columns
    for (let row = 1; row <= 5; row++) {
        for (let col = 1; col <= PO_WISE_TABLE_COLUMN_COUNT; col++) {
            const cell = poWiseWorksheet.getCell(row, col);
            cell.fill = {
                type: "pattern",
                pattern: "solid",
                fgColor: { argb: "FFFFFF" },
            };
        }
    }

    // Quantity columns
    ["F", "I", "O"].forEach((col) => {
        poWiseWorksheet.getColumn(col).numFmt = QUANTITY_NUMBER_FORMAT;
    });

    // Currency columns
    ["J", "P"].forEach((col) => {
        poWiseWorksheet.getColumn(col).numFmt = DOLLAR_SIGN_NUMBER_FORMAT;
    });

    ["A", "B", "C", "D", "E", "G", "H", "K", "L", "M", "N", "Q", "R"].forEach((col) => {
        poWiseWorksheet.getColumn(col).numFmt = TEXT_FORMAT;
    });

    const totalRow = poWiseWorksheet.addRow({
        buyer_name: "Total",
        shipment_quantity: { formula: `SUBTOTAL(109,F${TABLE_HEADER_ROW + 1}:F${poWiseWorksheet.rowCount})` },
        factory_invoice_quantity: { formula: `SUBTOTAL(109,I${TABLE_HEADER_ROW + 1}:I${poWiseWorksheet.rowCount})` },
        factory_invoice_value: { formula: `SUBTOTAL(109,J${TABLE_HEADER_ROW + 1}:J${poWiseWorksheet.rowCount})` },
        rdl_invoice_quantity: { formula: `SUBTOTAL(109,O${TABLE_HEADER_ROW + 1}:O${poWiseWorksheet.rowCount})` },
        rdl_invoice_value: { formula: `SUBTOTAL(109,P${TABLE_HEADER_ROW + 1}:P${poWiseWorksheet.rowCount})` },
    });

    totalRow.font = {
        bold: true,
    };

    poWiseWorksheet.eachRow((row) => {
        row.alignment = {
            vertical: "middle",
            wrapText: false,
        };
    });


    // CI and Realization Worksheet    
    const ciAndRealizationWorksheet = workbook.addWorksheet("CI & Realization", {
        views: [
            {
                state: "frozen",
                ySplit: TABLE_HEADER_ROW,
            },
        ],
    });

    ciAndRealizationWorksheet.columns = ciAndRealizationTableColumns;

    ciAndRealizationWorksheet.mergeCells(1, 1, 1, 6);
    ciAndRealizationWorksheet.mergeCells(2, 1, 2, 2);
    ciAndRealizationWorksheet.mergeCells(3, 1, 3, 2);
    ciAndRealizationWorksheet.mergeCells(4, 1, 4, 2);

    ciAndRealizationWorksheet.getCell("A1").value = `Post-Exfactory Commercial Activity Report`;
    ciAndRealizationWorksheet.getCell("A2").value = `Date Range: ${formatDate(reportMeta.fromDate)} to ${formatDate(reportMeta.toDate)}`;
    ciAndRealizationWorksheet.getCell("A3").value = `Generated by: ${reportMeta.generatedBy}`;
    ciAndRealizationWorksheet.getCell("A4").value = `Generated on: ${formatDate(new Date())} at ${currentTime}`;

    ciAndRealizationWorksheet.getRow(1).font = {
        bold: true,
        size: 20,
        color: { argb: "FF1F1F1F" },
    };

    ciAndRealizationWorksheet.getRow(2).font = {
        size: 11,
        color: { argb: "FF4B4B4B" },
    };

    ciAndRealizationWorksheet.getRow(3).font = {
        size: 11,
        color: { argb: "FF4B4B4B" },
    };

    ciAndRealizationWorksheet.getRow(4).font = {
        size: 11,
        color: { argb: "FF4B4B4B" },
    };

    ciAndRealizationWorksheet.getRow(6).font = {
        bold: true,
        color: { argb: "FFFFFFFF" },
    };
 
    ciAndRealizationWorksheet.getRow(6).fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "1F4E78" },
    };

    ciAndRealizationWorksheet.getRow(TABLE_HEADER_ROW).values = [...ciAndRealizationTableHeader];

    ciAndRealizationWorksheet.autoFilter = {
        from: "A6",
        to: "AC6",
    };

    ciAndRealizationWorksheet.getRow(1).height = 22;
    ciAndRealizationWorksheet.getRow(2).height = 18;
    ciAndRealizationWorksheet.getRow(3).height = 18;
    ciAndRealizationWorksheet.getRow(6).height = 20;
    
    ciAndRealizationData.forEach((row) => ciAndRealizationWorksheet.addRow(row));

    // Remove borders from the first 4 rows and all columns
    for (let row = 1; row <= 5; row++) {
        for (let col = 1; col <= CI_AND_REALIZATION_TABLE_COLUMN_COUNT; col++) {
            const cell = ciAndRealizationWorksheet.getCell(row, col);
            cell.fill = {
                type: "pattern",
                pattern: "solid",
                fgColor: { argb: "FFFFFF" },
            };
        }
    }

    // Quantity columns
    ["E"].forEach((col) => {
        ciAndRealizationWorksheet.getColumn(col).numFmt = QUANTITY_NUMBER_FORMAT;
    });

    // Currency columns
    ["F", "K"].forEach((col) => {
        ciAndRealizationWorksheet.getColumn(col).numFmt = DOLLAR_SIGN_NUMBER_FORMAT;
    });

    ["A", "B", "C", "D", "G", "H", "I", "J", "L"].forEach((col) => {
        ciAndRealizationWorksheet.getColumn(col).numFmt = TEXT_FORMAT;
    });

    const totalCiAndRealizationRow = ciAndRealizationWorksheet.addRow({
        buyer_name: "Total",
        rdl_invoice_quantity: { formula: `SUBTOTAL(109,E${TABLE_HEADER_ROW + 1}:E${ciAndRealizationWorksheet.rowCount})` },
        rdl_invoice_value: { formula: `SUBTOTAL(109,F${TABLE_HEADER_ROW + 1}:F${ciAndRealizationWorksheet.rowCount})` },
        realized_amount: { formula: `SUBTOTAL(109,K${TABLE_HEADER_ROW + 1}:K${ciAndRealizationWorksheet.rowCount})` },
    });

    totalCiAndRealizationRow.font = {
        bold: true,
    };

    ciAndRealizationWorksheet.eachRow((row) => {
        row.alignment = {
            vertical: "middle",
            wrapText: false,
        };
    });

    // Factory Payment Worksheet
    const factoryPaymentWorksheet = workbook.addWorksheet("Factory Payment", {
        views: [
            {
                state: "frozen",
                ySplit: TABLE_HEADER_ROW,
            },
        ],
    });

    factoryPaymentWorksheet.columns = factoryPaymentTableColumns;

    factoryPaymentWorksheet.mergeCells(1, 1, 1, 6);
    factoryPaymentWorksheet.mergeCells(2, 1, 2, 2);
    factoryPaymentWorksheet.mergeCells(3, 1, 3, 2);
    factoryPaymentWorksheet.mergeCells(4, 1, 4, 2);

    factoryPaymentWorksheet.getCell("A1").value = `Post-Exfactory Commercial Activity Report`;
    factoryPaymentWorksheet.getCell("A2").value = `Date Range: ${formatDate(reportMeta.fromDate)} to ${formatDate(reportMeta.toDate)}`;
    factoryPaymentWorksheet.getCell("A3").value = `Generated by: ${reportMeta.generatedBy}`;
    factoryPaymentWorksheet.getCell("A4").value = `Generated on: ${formatDate(new Date())} at ${currentTime}`;

    factoryPaymentWorksheet.getRow(1).font = {
        bold: true,
        size: 20,
        color: { argb: "FF1F1F1F" },
    };

    factoryPaymentWorksheet.getRow(2).font = {
        size: 11,
        color: { argb: "FF4B4B4B" },
    };

    factoryPaymentWorksheet.getRow(3).font = {
        size: 11,
        color: { argb: "FF4B4B4B" },
    };

    factoryPaymentWorksheet.getRow(4).font = {
        size: 11,
        color: { argb: "FF4B4B4B" },
    };

    factoryPaymentWorksheet.getRow(6).font = {
        bold: true,
        color: { argb: "FFFFFFFF" },
    };
 
    factoryPaymentWorksheet.getRow(6).fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "1F4E78" },
    };

    factoryPaymentWorksheet.getRow(TABLE_HEADER_ROW).values = [...factoryPaymentTableHeader];

    factoryPaymentWorksheet.autoFilter = {
        from: "A6",
        to: "AC6",
    };

    factoryPaymentWorksheet.getRow(1).height = 22;
    factoryPaymentWorksheet.getRow(2).height = 18;
    factoryPaymentWorksheet.getRow(3).height = 18;
    factoryPaymentWorksheet.getRow(6).height = 20;
    
    factoryInvoiceData.forEach((row) => factoryPaymentWorksheet.addRow(row));

    // Remove borders from the first 4 rows and all columns
    for (let row = 1; row <= 5; row++) {
        for (let col = 1; col <= FACTORY_PAYMENT_TABLE_COLUMN_COUNT; col++) {
            const cell = factoryPaymentWorksheet.getCell(row, col);
            cell.fill = {
                type: "pattern",
                pattern: "solid",
                fgColor: { argb: "FFFFFF" },
            };
        }
    }

    // Quantity columns
    ["H"].forEach((col) => {
        factoryPaymentWorksheet.getColumn(col).numFmt = QUANTITY_NUMBER_FORMAT;
    });

    // Currency columns
    ["I", "K"].forEach((col) => {
        factoryPaymentWorksheet.getColumn(col).numFmt = DOLLAR_SIGN_NUMBER_FORMAT;
    });

    ["A", "B", "C", "D", "E", "F", "G", "J", "L"].forEach((col) => {
        factoryPaymentWorksheet.getColumn(col).numFmt = TEXT_FORMAT;
    });

    const totalFactoryInvoiceRow = factoryPaymentWorksheet.addRow({
        buyer_name: "Total",
        factory_invoice_quantity: { formula: `SUBTOTAL(109,H${TABLE_HEADER_ROW + 1}:H${factoryPaymentWorksheet.rowCount})` },
        factory_invoice_value: { formula: `SUBTOTAL(109,I${TABLE_HEADER_ROW + 1}:I${factoryPaymentWorksheet.rowCount})` },
        factory_payment: { formula: `SUBTOTAL(109,K${TABLE_HEADER_ROW + 1}:K${factoryPaymentWorksheet.rowCount})` },
    });

    totalFactoryInvoiceRow.font = {
        bold: true,
    };

    factoryPaymentWorksheet.eachRow((row) => {
        row.alignment = {
            vertical: "middle",
            wrapText: false,
        };
    });

    return await workbook.xlsx.writeBuffer();
}