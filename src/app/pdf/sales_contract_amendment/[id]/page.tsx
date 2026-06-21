'use client';

import { PDFViewer } from "@react-pdf/renderer";
import React from "react";
import SalesContractAmendmentPDF from "../SalesContractAmendmentPDF";
import { api } from "~/trpc/react";
import { skipToken } from "@tanstack/react-query";
import type { ParamsProp } from "~/types/params";

const PDF = ({ params }: ParamsProp) => {
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
