import { Document, Page, Text, View } from "@react-pdf/renderer";
import { useDecodedUser } from "~/hooks";
import type { HeaderData } from "~/types/pdf";
import { HeaderPart, PrintByAndDate, RenaissanceLogo, ReportTitle } from "../components";
import { registerPdfFonts, styles } from "../components/pdfConfig";
import { formatPDFDate, wrapPDFText } from "../pp_meeting/pdfStyles";
import ChecklistSections from "./components/ChecklistSections";
import { checklistStyles } from "./pdfStyles";
import type { SampleChecklistPDFData, SampleChecklistPDFImages } from "./types";

type SampleChecklistPDFProps = { data: SampleChecklistPDFData; images: SampleChecklistPDFImages };

registerPdfFonts();

const SampleChecklistPDF = (props: SampleChecklistPDFProps) => {
    const { data, images } = props;
    const { user } = useDecodedUser();

    const headerData: HeaderData = [
        [
            { label: "Buyer", value: data.buyers.buyer_name },
            { label: "Factory", value: data.factories.name },
            { label: "Order Ref", value: data.order_styles.buyer_orders.ref_no },
            { label: "Style", value: data.order_styles.style },
            { label: "Color", value: data.colors.name },
        ],
        [
            { label: "Date", value: formatPDFDate(data.sample_check_date) },
            { label: "Sample Type", value: data.sample_types.name },
            { label: "Sample Size", value: (data.sample_size ?? "").trim() || "-" },
            { label: "Sample Quantity", value: data.sample_quantity?.toLocaleString("en-US") ?? "-" },
        ],
    ].map((column) => column.map((field) => ({ ...field, value: wrapPDFText(String(field.value), 28) })));

    return (
        <Document
            title={`Sample Checklist - ${data.order_styles.buyer_orders.ref_no} - ${data.order_styles.style}`}
            author="RDL Nexus"
            subject="Sample Checklist Report"
            keywords="Sample Checklist, Quality, PDF, RDL Nexus, ERP"
            creator={user ? `${user.first_name} ${user.last_name}` : "RDL Nexus"}
            producer="RDL Nexus"
            pageMode="useOutlines"
            creationDate={new Date()}
        >
            <Page orientation="portrait" size="A4" style={styles.body} wrap>
                <View style={checklistStyles.nonShrinkingBlock} fixed>
                    <RenaissanceLogo />
                </View>
                <View style={checklistStyles.nonShrinkingBlock} wrap={false}>
                    <PrintByAndDate />
                    <ReportTitle title="SAMPLE CHECKLIST" />
                    <HeaderPart data={headerData} variant="between" />
                </View>

                <ChecklistSections data={data} images={images} />
                <Text style={styles.pageNumber} render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`} fixed />
            </Page>
        </Document>
    );
};

export default SampleChecklistPDF;
