import { Document, Page, Text, View } from "@react-pdf/renderer";
import { registerPdfFonts, styles, tableBorderColor } from "../components/pdfConfig";
import { HeaderPart, PrintByAndDate, RenaissanceLogo, ReportTitle, Table, TableSummary } from "../components";
import { useDecodedUser } from "~/hooks";
import type { inferRouterOutputs } from '@trpc/server';
import type { lcScClosingRouter } from '~/server/api/routers/reports/lcScClosing'
import type { HeaderData } from "~/types/pdf";
import { formatDate } from "~/utils/localDateString";
import SettlementType from "./_components/Settlement";

type LcScClosingReportOutput = inferRouterOutputs<typeof lcScClosingRouter>;
type GetPDFDataOutput = LcScClosingReportOutput['getPDFData'];

registerPdfFonts();

interface SalesReportPDFProps {
	data: GetPDFDataOutput;
	base?: string;
	isPartial?: boolean;
}

const LcScClosingPDF = ({ data, base, isPartial }: SalesReportPDFProps) => {
	const title = `STATEMENT OF ${base === 'LC' ? 'LC' : 'SC'} CLOSING`;

	const {user} = useDecodedUser();

	const closingReportHeader: HeaderData = [
		[
			{ label: "Date", value: formatDate(new Date())?? '' },
			{ label: "Buyer Name", value: data.header?.buyer_name ?? '' },
			{ label: "Order Quantity", value: data.header?.quantity ?? '' },
			{ label: "Settlement", value: isPartial ? 'Partial' : 'Full' },
		],
		[
			{ label: "LC/SC Number", value: data.header?.lc_no ?? '' },
			{ label: "LC Value in primary currency", value: data.header?.value ?? '' },
			...(data.header?.secondary_value
				? [{ label: "LC Value in secondary currency", value: data.header?.secondary_value ?? '' }]: []
			),
		]
	];

	const hasInvoiceValueColumn = Array.isArray(data.table)
		&& data.table.length > 0
		&& 'invoice_value' in data.table[0]
		&& data.table[0]?.invoice_value != null;

	const tableColumns = [
		{ key: 'invoice_period', label: 'RDL Export Invoice Period', width: 90.9},
		{ key: 'export_invoice_quantity', label: 'Export Invoice Quantity', width: 90.9 },
		...(hasInvoiceValueColumn
			? [{ key: 'invoice_value', label: 'RDL Export Invoice Value in Primary Currency', width: 90.9 }]
			: []),
		{ key: 'invoice_value_usd', label: 'RDL Export Invoice value in Primary Currency', width: 90.9 },
		{ key: 'factory_export_value', label: 'Factory Export Invoice Value in Primary Currency', width: 90.9 },
		{ key: 'calculated_commission', label: 'Calculated Commission', width: 90.9 },
		{ key: 'calculated_commission_percentage', label: 'Calculated Commission Percentage', width: 90.9 },
		{ key: 'proceed', label: 'Proceed', width: 90.9 },
		{ key: 'factory_payment', label: 'Factory Payment Value', width: 90.9 },
		{ key: 'commission_realized', label: 'Commission Realized', width: 90.9 },
		{ key: 'commission_realized_percentage', label: 'Commission Realized Percentage', width: 90.9 },
	];

	const debitNoteWidth = hasInvoiceValueColumn ? 454.5 : 363.6;

	const results: Array<{ label: string; value: string; width: number }> = [
		{ label: "Total", value: 'Calculated Commission Through debit note', width: debitNoteWidth },
		{ label: "Total Quantity", value: String(data.table?.debit_note ?? ''), width: 90.9 },
		{ label: "Total", value: 'Calculated Commission Through debit note', width: 272.7 },
		{ label: "Total FOB Value", value: String(data.table?.debit_note ?? ''), width: 90.9 },
		{ label: "empty", value: '', width: 90.9 },
	];

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
				<View style={{ marginTop: -15, marginBottom: 10 }}>
					<PrintByAndDate />
				</View>

				<HeaderPart data={closingReportHeader}/>

				<SettlementType isPartial={!!isPartial} />

				<Table columns={tableColumns} data={data.table ? [data.table] : []} />

				<View
					wrap={false}
					style={{
						flexDirection: "row",
						width: "100%",
						borderBottom:  `0.5px solid ${tableBorderColor}`,
						borderRight:  `0.5px solid ${tableBorderColor}`,
					}}
				>
					{results.map((field, index) => (
						<View
							key={index}
							style={{
								width: `${field.width ?? 100 / length}%`,
								borderLeft: `0.5px solid ${tableBorderColor}`,
								padding: "4px",
								fontSize: 7, 
								textAlign: 'right', 
							}}
						>
							<Text>{field.value}</Text>
						</View>
					))}
				</View>

				<Text
					style={styles.pageNumber}
					render={({ pageNumber, totalPages }) =>	`${pageNumber} / ${totalPages}`}
					fixed
				/>
			</Page>
		</Document>
    );
}

export default LcScClosingPDF;