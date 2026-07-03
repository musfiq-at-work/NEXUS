'use client';

import { PDFViewer } from "@react-pdf/renderer";
import React from "react";
import RDLInvoicePDF from "./RDLInvoicePDF";
import { api } from "~/trpc/react";
import { skipToken } from "@tanstack/react-query";
import { useSearchParams } from 'next/navigation';

const PDF = () => {
    const searchParams = useSearchParams();

    const buyerIds = searchParams.get("buyers")?.split(",").map(Number) ?? [];
    const factoryIds = searchParams.get("factories")?.split(",").map(Number) ?? [];
    const brandIds = searchParams.get("brands")?.split(",").map(Number) ?? [];
    const departmentIds = searchParams.get("departments")?.split(",").map(Number) ?? [];
    const productTypeIds = searchParams.get("product_types")?.split(",").map(Number) ?? [];
    const teamIds = searchParams.get("team_id")?.split(",").map(Number) ?? [];
    const quantity = searchParams.get("quantity") === "t";
    const rdlValue = searchParams.get("rdl_value") === "t";
    const factoryValue = searchParams.get("factory_value") === "t";
    const commissionValue = searchParams.get("commission_value") === "t";
    const base = searchParams.get("base") ?? "";
    const fromDate = searchParams.get("from_date") ?? "";
    const toDate = searchParams.get("to_date") ?? "";

    console.log("PDF Params:", {
        buyerIds,
        factoryIds,
        brandIds,
        departmentIds,
        productTypeIds,
        teamIds,
        quantity,
        rdlValue,
        factoryValue,
        commissionValue,
        base,
        fromDate,
        toDate,
    });

    const { data } = api.salesReport.getSalesReport.useQuery(
        {
            buyerIds: buyerIds.length > 0 ? buyerIds : undefined,
            factoryIds: factoryIds.length > 0 ? factoryIds : undefined,
            brandIds: brandIds.length > 0 ? brandIds : undefined,
            departmentIds: departmentIds.length > 0 ? departmentIds : undefined,
            productTypeIds: productTypeIds.length > 0 ? productTypeIds : undefined,
            teamIds: teamIds.length > 0 ? teamIds : undefined,
            quantity,
            rdlValue: rdlValue,
            factoryValue: factoryValue,
            commissionValue: commissionValue,
            base,
            fromDate: fromDate,
            toDate: toDate,
        },
        {
            enabled: !!fromDate && !!toDate,
        }
    );

    console.log("PDF Data:", data);

    return (
        // <PDFViewer style={{ minHeight: "100vh", minWidth: "100vw" }} showToolbar={true}>
        //     <RDLInvoicePDF data={data} />
        // </PDFViewer>
        <div>{JSON.stringify(data)}</div>
    );
};

export default PDF;
