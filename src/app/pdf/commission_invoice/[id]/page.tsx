'use client';

import { PDFViewer } from "@react-pdf/renderer";
import React from "react";
import CommissionInvoicePDF from "../CommissionInvoicePDF";
import { api } from "~/trpc/react";
import { skipToken } from "@tanstack/react-query";

type EditBuyerOrderPdfProp = {
    params: Promise<{ id: string }>
}

const PDF = ({ params }: EditBuyerOrderPdfProp) => {
    const { id } = React.use(params);

    const { data } = api.commissionInvoice.getPDFData.useQuery(!!id ? { id } : skipToken);

    if (!data) {
        return <div className="text-center p-16">Loading...</div>;
    }

    return (
        <PDFViewer style={{ minHeight: "100vh", minWidth: "100vw" }} showToolbar={true}>
            <CommissionInvoicePDF data={data} />
        </PDFViewer>
    );
};

export default PDF;
