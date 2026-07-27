import { Document, Page, Text, View } from "@react-pdf/renderer";
import { registerPdfFonts, styles, tableBorderColor } from "../components/pdfConfig";
import { PrintByAndDate, RenaissanceLogo, ReportTitle, Table, TableSummary } from "../components";
import { formatDate } from "~/utils/localDateString";

import type { inferRouterOutputs } from '@trpc/server';
import type { exportSummaryReportRouter } from '~/server/api/routers/reports/exportSummaryReport'
import { useDecodedUser } from "~/hooks";

type ExportSummaryReportOutput = inferRouterOutputs<typeof exportSummaryReportRouter>;

type GetPDFDataOutput = ExportSummaryReportOutput['getExportSummary'];

registerPdfFonts();

interface SalesReportPDFProps {
	data: GetPDFDataOutput;
	base?: string;
	fromDate: string;
	toDate: string;
}

const SalesReportPDF = ({ data, base, fromDate, toDate }: SalesReportPDFProps) => {
	const title = `${base === 'LC' ? 'L/C' : 'SALES CONTRACT'} EXPORT SUMMARY`;

	const {user} = useDecodedUser();

	const tableColumns = [
		{ key: 'buyer_name', label: 'Buyer Name', width: 80},
		{ key: 'lc_sc_no', label: `${base === 'LC' ? 'Master LC No' : 'SALES CONTRACT'}`, width: 100 },
		{ key: 'total_order_value', label: 'Total Master LC Value', width: 90 },
		{ key: 'latest_shipment_date', label: 'Last Ship Date', width: 80 },
		{ key: 'latest_exfactory_date', label: 'Last Ex-factory Date', width: 80 },
		{ key: 'expire_date', label: 'Expire Date', width: 80 },
		{ key: 'total_order_quantity', label: 'Total Order Quantity', width: 80 },
		{ key: 'total_shipped_quantity', label: 'Total Shipped Quantity', width: 80 },
		{ key: 'balance_quantity', label: 'Balance Quantity', width: 80 },
		{ key: 'total_ship_value', label: 'Ship Value', width: 90 },
		{ key: 'balance_value', label: 'Balance Shipment Value', width: 80 },
		{ key: 'proceed_amount', label: 'Proceed Amount', width: 80 },
		{ key: 'factory_fdd_value', label: 'Factory FDD Value', width: 80 },
	];

	const results = [
		{ label: "Total", value: 'Total', width: 180 },
		{ label: "Total Order Value", value: data.totals.total_order_value, width: 90 },
		{ label: "empty", value: '', width: 240 },
		{ label: "total_order_quantity", value: data.totals.total_order_quantity, width: 80 },
		{ label: "total_shipped_quantity", value: data.totals.total_shipped_quantity, width: 80 },
		{ label: "balance_quantity", value: data.totals.balance_quantity, width: 80 },
		{ label: "total_ship_value", value: data.totals.total_ship_value, width: 90 },
		{ label: "balance_value", value: data.totals.balance_value, width: 80 },
		{ label: "proceed_amount", value: data.totals.proceed_amount, width: 80 },
		{ label: "factory_fdd_value", value: data.totals.factory_fdd_value, width: 80 },
	];

	const colWidth = { width: `${1000 / tableColumns.length}` };

    return (
		<Document
            title={title}
            author="RDL Nexus"
            subject="Factory Invoice PDF"
            keywords="Factory, Invoice, PDF, RDL Nexus, ERP"
            creator={`${user?.first_name} ${user?.last_name}`}
            producer="RDL Nexus"
			pageMode='useOutlines'
			creationDate={new Date()}
        >
			<Page orientation="landscape" size="A4" style={styles.body} wrap>
				<RenaissanceLogo />
				<ReportTitle title={title} />
				<View style={{ marginTop: -10, marginBottom: 10 }}>
					<PrintByAndDate />
				</View>

				<Table columns={tableColumns} data={data.table}/>

				<TableSummary results={results}/>

				<Text
					style={styles.pageNumber}
					render={({ pageNumber, totalPages }) =>	`${pageNumber} / ${totalPages}`}
					fixed
				/>
			</Page>
		</Document>
    );
}

export default SalesReportPDF;