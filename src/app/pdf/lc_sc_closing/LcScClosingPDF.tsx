import { Document, Page, Text, View } from "@react-pdf/renderer";
import { registerPdfFonts, styles } from "../components/pdfConfig";
import { PrintByAndDate, RenaissanceLogo, ReportTitle, Table, TableSummary } from "../components";
import { useDecodedUser } from "~/hooks";
import type { inferRouterOutputs } from '@trpc/server';
import type { lcScClosingRouter } from '~/server/api/routers/reports/lcScClosing'

type LcScClosingReportOutput = inferRouterOutputs<typeof lcScClosingRouter>;
type GetPDFDataOutput = LcScClosingReportOutput['getPDFData'];

registerPdfFonts();

interface SalesReportPDFProps {
	data: GetPDFDataOutput;
	base?: string;
}

const LcScClosingPDF = ({ data, base }: SalesReportPDFProps) => {
	const title = `STATEMENT OF ${base === 'LC' ? 'LC' : 'SC'} CLOSING`;

	const {user} = useDecodedUser();

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

				{/* <Table columns={tableColumns} data={data.table}/> */}


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