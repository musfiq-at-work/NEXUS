import { Document, Page, Text, View } from "@react-pdf/renderer";
import { registerPdfFonts, styles, tableBorderColor } from "../components/pdfConfig";
import { PrintByAndDate, RenaissanceLogo, ReportTitle, HeaderPart, Table, TableSummary, Signature } from "../components";
import { formatDate } from "~/utils/localDateString";

import type { HeaderData } from "~/types/pdf";
import type { inferRouterOutputs } from '@trpc/server';
import type { debitNotesRouter } from "~/server/api";
import { useDecodedUser } from "~/hooks";

type RouterOutput = inferRouterOutputs<typeof debitNotesRouter>;

type GetPDFDataOutput = RouterOutput['getPDFData'];

type DebitNoteTableRow = GetPDFDataOutput['formattedTable'][number];

registerPdfFonts();

const DebitNotes = ({ data }: { data: GetPDFDataOutput }) => {
	const tableColumns: { key: keyof DebitNoteTableRow; label: string; width: number }[] = [
		{ key: 'buyer_po', label: 'Style and Invoice Number', width: 300},
		{ key: 'quantity', label: 'Quantity (PCS)', width: 140 },
		{ key: 'factory_rate', label: 'LC Transfer Unit Price (USD)', width: 140 },
		{ key: 'transfer_rate', label: 'F. Agreed Unit Price (USD)', width: 140 },
		{ key: 'margin', label: 'Margin Per Unit', width: 140 },
		{ key: 'excess_value', label: 'Total Excess', width: 140 },
	];

	const results = [
		{ label: "Discount", value: 'Discount', width: 858 },
		{ label: "Total Quantity", value: data.totals.lessValue, width: 142 },
	];

	const {user} = useDecodedUser();

	const colWidth = { width: `${1000 / tableColumns.length}` };

    return (
		<Document
            title={`Commission Distribution - ${data.headerData[0]?.debit_note_ref}`}
            author="RDL Nexus"
            subject="Commission Distribution PDF"
            keywords="Commission, Distribution, PDF, RDL Nexus, ERP"
            creator={`${user?.first_name} ${user?.last_name}`}
            producer="RDL Nexus"
			pageMode='useOutlines'
			creationDate={new Date()}
        >
			<Page orientation="portrait" size="A4" style={styles.body} wrap>
				<RenaissanceLogo />
				<PrintByAndDate />
				<ReportTitle title="DEBIT NOTE" />

				<Text style={{fontWeight: 'bold', fontSize: 9, letterSpacing: 0.3}}>To</Text>
				<View style={{...styles.doubleColumnContainer, marginBottom: 15}}>
					<View style={{fontSize: 9, letterSpacing: 0.3}}>
						<Text style={{fontWeight: 'bold'}}>{data.headerData[0]?.factory_name}</Text>
						<Text>{data.headerData[0]?.factory_address}</Text>
					</View>
					<View style={{fontSize: 9, letterSpacing: 0.3}}>
						<View style={{flexDirection: 'row', gap: 5}}>
							<Text style={{fontWeight: 'bold'}}>Ref No:</Text>
							<Text>{data.headerData[0]?.debit_note_ref}</Text>
						</View>
						<View style={{flexDirection: 'row', gap: 5}}>
							<Text style={{fontWeight: 'bold'}}>Date: </Text>
							<Text>{data.headerData[0]?.debit_note_date ? formatDate(data.headerData[0].debit_note_date) : ''}</Text>
						</View>
					</View>
				</View>

				<View style={styles.tableContainer}>
					<View style={styles.headerRow} fixed>
						{tableColumns.map((column, index) => (
							<Text key={`h-${index}`} 
								style={[styles.headerCell, column.width ? { width: `${column.width}px` } : colWidth]}
							>
								{column.label}
							</Text>
						))}
					</View>

					{/* Body Rows */}
					<View style={{borderBottomWidth: 0.75, borderBottomColor: tableBorderColor}}>
						{data.formattedTable.map((row, rowIndex) => (
							<View key={rowIndex} style={{
								flexDirection: 'row', 
								borderLeftWidth: 0.75,
								borderLeftColor: tableBorderColor,
								
							}} wrap={false}>
								{tableColumns.map((column, colIndex) => (
									<View wrap={true}
										key={`${rowIndex}-${colIndex}`} 
										style={[styles.cell, column.width ? { width: `${column.width}px` } : colWidth]} 
									>
										<Text hyphenationCallback={
											(word) => word.split('/').flatMap((part, i, arr) => i < arr.length - 1 ? [part, '/'] : [part])
										}>
											{String(row[column.key] ?? '')}
										</Text>
									</View>
								))}
							</View>
						))}
					</View>
				</View>

            	<View
					wrap={false}
					style={{
						flexDirection: "row",
						width: "100%",
						borderLeft:  `0.75px solid ${tableBorderColor}`,
						borderBottom:  `0.75px solid ${tableBorderColor}`,
					}}
				>
					<View
						style={{
							width: 860,
							borderRight: `0.75px solid ${tableBorderColor}`,
							padding: "4px",
							fontSize: 6, 
							textAlign: 'right', 
							fontWeight: 'semibold'
						}}
					>
						<Text>Discount</Text>
					</View>
					<View
						style={{
							width: 140,
							borderRight: `0.75px solid ${tableBorderColor}`,
							padding: "4px",
							fontSize: 6, 
							textAlign: 'center', 
							fontWeight: 'semibold'
						}}
					>
						<Text>{data.totals.lessValue}</Text>
					</View>
				</View>

				<Signature signatures={[
					"Receiver's\nSignature", 
					"Created By", 
					"Commercial\nChecked By", 
					'Accounts\nChecked By', 
					"Authorized\nSignature"
				]}/>

				<Text style={styles.pageNumber}
					render={({ pageNumber, totalPages }) =>
						`${pageNumber} / ${totalPages}`
					}
					fixed
				/>
			</Page>
		</Document>
    );
}

export default DebitNotes;