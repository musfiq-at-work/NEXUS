'use client';

import { PDFViewer } from "@react-pdf/renderer";
import React from "react";
import SalesContractAmendmentPDF from "../SalesContractAmendmentPDF";
import { api } from "~/trpc/react";
import { skipToken } from "@tanstack/react-query";

type EditSalesContractAmendmentPdfProp = {
    params: Promise<{ id: string }>
}

const PDF = ({ params }: EditSalesContractAmendmentPdfProp) => {
    const { id } = React.use(params);

    const { data, isLoading } = api.salesContractAmendments.getPDFData.useQuery(!!id ? { id: id } : skipToken);

    if (isLoading || !data) {
        return <div className="text-center p-16">Loading...</div>;
    }

    return (
        <PDFViewer style={{ minHeight: "100vh", minWidth: "100vw" }} showToolbar={true}>
            <SalesContractAmendmentPDF data={data} />
        </PDFViewer>
    );
};

export default PDF;
