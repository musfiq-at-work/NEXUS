import { useMemo } from "react";
import { Document, Image, Page, Text, View } from "@react-pdf/renderer";
import { registerPdfFonts, styles, tableBorderColor } from "../components/pdfConfig";
import { PrintByAndDate, RenaissanceLogo, ReportTitle } from "../components";
import { formatDate } from "~/utils/localDateString";
import { authorized } from '~/assets'
import type { inferRouterOutputs } from '@trpc/server';
import type { salesContractsRouter } from "~/server/api";

type RouterOutput = inferRouterOutputs<typeof salesContractsRouter>;

type GetPDFDataOutput = RouterOutput['getSalesContractCommissionPDFData'];

type FlatRow =
    | { type: "ref"; ref_no: string }
    | { type: "shipment"; data: any }
    | { type: "subtotal"; results: any };

registerPdfFonts();

const rowStyle = {
    ...styles.row,
    borderRight: 0.75,
    borderRightColor: tableBorderColor,
};

const SalesContractPDF = ({ data }: { data: GetPDFDataOutput }) => {
    const tableColumns = useMemo(() => [
        { key: 'style', label: 'Style', width: 123.3 },
        { key: 'buyer_po', label: 'PO', width: 123.3 },
        { key: 'quantity', label: 'Qty/Unit', width: 83.3 },
        { key: 'fob_rate', label: 'RDL FOB', width: 40.9 },
        { key: 'rdl_value', label: 'RDL Value', width: 83.3 },
        { key: 'factory_rate', label: 'Fac FOB', width: 40.9 },
        { key: 'factory_value', label: 'Factory Value', width: 83.3 },
        { key: 'commissionValue', label: 'Commission Value', width: 83.3 },
        { key: 'commissionPercentage', label: 'Commission Percentage', width: 83.3 },
        { key: 'overseasCommission', label: 'Overseas Commission', width: 83.3 },
        { key: 'othersCommission', label: 'Other Commission', width: 83.3 },
        { key: 'dhakaCommission', label: 'RDL Commission', width: 83.3 },
    ], []);

    const useColumnStyles = (columns: any[]) => {
        return useMemo (
            () =>
            columns.map((col) => ({
                ...styles.cell,
                width: col.width,
            })
        ), [columns]);
    };

    const headerStyles = useMemo(() =>
        tableColumns.map((col) => ({
            ...styles.headerCell,
            width: col.width,
            fontFamily: "Amasis",
            fontSize: 9,
        })
    ),[tableColumns]);

    const useFlattenedRows = (orderData: GetPDFDataOutput['data']) => {
        return useMemo(() => {
            const rows: FlatRow[] = [];

            for (const order of orderData ?? []) {
            // Reference row
                rows.push({
                    type: "ref",
                    ref_no: order.ref_no ?? '',
                });

                // Shipment rows
                for (const shipment of order.shipment_details ?? []) {
                    rows.push({
                        type: "shipment",
                        data: {
                            ...shipment,
                            style: String(shipment.style ?? ""),
                            buyer_po: String(shipment.buyer_po ?? ""),
                            quantity: String(shipment.quantity ?? ""),
                            fob_rate: String(shipment.fob_rate ?? ""),
                            rdl_value: String(shipment.rdl_value ?? ""),
                            factory_rate: String(shipment.factory_rate ?? ""),
                            factory_value: String(shipment.factory_value ?? ""),
                            commissionValue: String(shipment.commissionValue ?? ""),
                            commissionPercentage: String(shipment.commissionPercentage ?? ""),
                            overseasCommission: String(shipment.overseasCommission ?? ""),
                            othersCommission: String(shipment.othersCommission ?? ""),
                            dhakaCommission: String(shipment.dhakaCommission ?? ""),
                        },
                    });
                }

                // Subtotal row
                rows.push({
                    type: "subtotal",
                    results: order.results,
                });
            }

            return rows;
        }, [orderData]);
    };

    const columnStyles = useColumnStyles(tableColumns);
    const flattenedRows = useFlattenedRows(data.data);

    return (
        <Document
            title={data.pdfHeader?.sales_contract_no}
            author="RDL Nexus"
            subject="Sales Contract PDF"
            keywords="Sales, Contract, PDF, RDL Nexus, ERP"
            creator="RDL Nexus"
            producer="RDL Nexus"
            pageMode='useOutlines'
			creationDate={new Date()}
        >
            <Page orientation="landscape" size="A4" style={styles.body}>
				<RenaissanceLogo />
				<PrintByAndDate />
				<ReportTitle title="SALES CONTRACT COMMISSION" />

                {/* Sales Contract ref and date */}
                <View style={{marginTop: 15}}>
                    <View style={styles.doubleColumnContainer}>
                        <Text style={{...styles.textBold, flex: 3}}>
                            SALES CONTRACT NO: {data.pdfHeader?.sales_contract_no}
                        </Text>
                        <View style={{flex: 2, display: 'flex', flexDirection: 'row'}}>
                            <Text style={styles.textBold}>SC Date:</Text>
                            <Text style={styles.textAmasis}> {" "}
                                {data.pdfHeader?.sales_contract_date 
                                    ? formatDate(new Date(data.pdfHeader.sales_contract_date)) 
                                    : ""
                                }
                            </Text>
                        </View>
                    </View>
                    <Text style={{...styles.textBold, flex: 3}}>
                        BUYER NAME: {data.pdfHeader?.buyers.buyer_name}
                    </Text>
                </View>

                <View style={{...styles.tableContainer, marginTop: 20}}>
                    <View style={styles.headerRow} fixed>
                        {tableColumns.map((column, i) => (
                            <Text
                                key={column.key}
                                style={headerStyles[i]}
                            >
                                {column.label}
                            </Text>
                        ))}
                    </View>
                        {flattenedRows.map((row, index) => {
                            // REF ROW
                            if (row.type === "ref") {
                                return (
                                    <View key={`ref-${index}`} style={rowStyle} wrap={false}>
                                        <Text style={styles.salesContractOrderRefs}
                                            {...({ bookmark: row.ref_no } as any)} // Types are outdates in @react-pdf/renderer, so we have to cast it as any
                                        >
                                            {row.ref_no}
                                        </Text>
                                    </View>
                                );
                            }

                            // SHIPMENT ROW
                            if (row.type === "shipment") {
                                return (
                                    <View key={`ship-${index}`} style={styles.row} wrap={false}>
                                    {tableColumns.map((column, i) => (
                                        <View key={column.key} style={{...columnStyles[i], flexWrap: "wrap"}}>
                                            {/* <Text>{row.data[column.key]}</Text> */}
                                            {row.data[column.key]?.split("").map((s: string, idx: number) => {
                                                return <Text key={idx}>{s}</Text>
                                            })}
                                        </View>
                                    ))}
                                    </View>
                                );
                            }

                            // SUBTOTAL ROW
                            if (row.type === "subtotal") {
                                return (
                                    <View
                                        key={`sub-${index}`}
                                        style={[styles.row, { fontWeight: "bold", fontFamily: "Amasis" }]}
                                        wrap={false}
                                    >
                                        <View style={{ ...styles.cell, padding: 4, width: 246.6 }}>
                                            <Text>SUB TOTAL</Text>
                                        </View>

                                        <View style={{ ...styles.cell, padding: 4, width: 83.3 }}>
                                            <Text>{row.results.totalQuantity}</Text>
                                        </View>

                                        <View style={{ ...styles.cell, padding: 4, width: 40.9 }}>
                                            <Text />
                                        </View>

                                        <View style={{ ...styles.cell, padding: 4, width: 83.3 }}>
                                            <Text>{row.results.totalRdlValue}</Text>
                                        </View>

                                        <View style={{ ...styles.cell, padding: 4, width: 40.9 }}>
                                            <Text />
                                        </View>

                                        <View style={{ ...styles.cell, padding: 4, width: 83.3 }}>
                                            <Text>{row.results.totalFactoryValue}</Text>
                                        </View>

                                        <View style={{ ...styles.cell, padding: 4, width: 83.3 }}>
                                            <Text>{row.results.totalCommissionValue}</Text>
                                        </View>

                                        <View style={{ ...styles.cell, padding: 4, width: 83.3 }}>
                                            <Text>{row.results.commissionPercentage}</Text>
                                        </View>

                                        <View style={{ ...styles.cell, padding: 4, width: 83.3 }}>
                                            <Text>{`${row.results.totalOverseasCommission} (${row.results.totalOverseasCommissionPercentage})`}</Text>
                                        </View>

                                        <View style={{ ...styles.cell, padding: 4, width: 83.3 }}>
                                            <Text>{`${row.results.totalOthersCommission} (${row.results.totalOthersCommissionPercentage})`}</Text>
                                        </View>

                                        <View style={{ ...styles.cell, padding: 4, width: 83.3 }}>
                                            <Text>{`${row.results.totalDhakaCommission} (${row.results.totalDhakaCommissionPercentage})`}</Text>
                                        </View>
                                    </View>
                                );
                            }

                            return null;
                        })}
                </View>


                <Text style={styles.pageNumber}
                    render={({ pageNumber, totalPages }) =>
                        `${pageNumber} / ${totalPages}`
                    }
                    fixed
                />
			</Page>
        </Document>
    )
}


export default SalesContractPDF;