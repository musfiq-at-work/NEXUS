import ExcelJS from "exceljs";
import type { CiAndRealizationData, FactoryInvoiceData, PoWiseData } from "../../../api/routers/reports/commercialActivityReport";
import { generatePoWiseDataWorkSheet } from "./worksheets/poWiseDataWorkSheet";
import { generateCiAndRealizationWorkSheet } from "./worksheets/cIandRealizationWorkSheet";
import { generateFactoryPaymentWorkSheet } from "./worksheets/factoryPaymentWorkSheet";

export interface ActivityReportMeta {
    fromDate: string;
    toDate: string;
    generatedBy: string;
}

interface ActivityReportProps {
    poWiseData: PoWiseData[];
    ciAndRealizationData: CiAndRealizationData[];
    factoryInvoiceData: FactoryInvoiceData[];
    reportMeta: ActivityReportMeta
}

export const generateActivityReportExcel = async (props: ActivityReportProps) => {
    const { poWiseData, ciAndRealizationData, factoryInvoiceData, reportMeta } = props;

    const workbook = new ExcelJS.Workbook();

    // Set file metadata
    workbook.creator = "Nexus ERP";
    workbook.created = new Date();
    workbook.company = "Renaissance Designs Limited";
    workbook.subject = "Post-Exfactory Commercial Activity Report";
    workbook.title = "Post-Exfactory Commercial Activity Report";
    workbook.category = "Commercial Reports";
    workbook.manager = reportMeta.generatedBy;

    generatePoWiseDataWorkSheet({workbook, poWiseData, reportMeta});

    generateCiAndRealizationWorkSheet({workbook, ciAndRealizationData, reportMeta});

    generateFactoryPaymentWorkSheet({workbook, factoryInvoiceData, reportMeta});

    return await workbook.xlsx.writeBuffer();
}