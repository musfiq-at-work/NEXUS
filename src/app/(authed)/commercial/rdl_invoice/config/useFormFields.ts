import { api } from "~/trpc/react";
import type { RDLInvoiceFormValues } from "./formSchema";
import type { BaseField } from "~/types/form";
import { skipToken } from "@tanstack/react-query";

export type Field<T extends keyof RDLInvoiceFormValues> = BaseField<T>;

interface LCListItem {
    id: string;
    sc_lc_no: string;
}

interface PropsType {
    lcList: LCListItem[];
    isEdit: boolean;
    buyer_id: number;
}

export const useFormFields = ({lcList, isEdit, buyer_id}: PropsType): Field<keyof RDLInvoiceFormValues>[] => {
    const terms = api.terms.getAllTerms.useQuery().data ?? [];
    const buyers = api.buyers.getAllBuyersByTeam.useQuery().data ?? [];
    const { data: consignees } = api.buyers.getBuyerConsignees.useQuery(!!buyer_id ? buyer_id : skipToken);

    return [
        {
            name: 'buyer_id',
            label: 'Buyer',
            type: "select",
            options: buyers.map((buyer) => ({ label: buyer.buyer_name, value: buyer.id })),
            disabled: isEdit,
            optional: isEdit,
        },
        {
            name: "term_id",
            label: "Select Payment Term",
            placeholder: "Select payment term",
            type: "select",
            options: terms.map((term) => ({ label: term.name, value: term.id })),
            disabled: isEdit,
            optional: isEdit,
        },
        {
            name: "lc_sc_id",
            label: "Select LC/SC",
            type: "select",
            options: lcList.map((lc) => ({ label: lc.sc_lc_no, value: lc.id })),
            disabled: isEdit,
            optional: isEdit
        },
        {
            name: "invoice_no",
            label: "Invoice No (Auto)",
            type: "text",
            disabled: true,
            optional: true
        },
        {
            name: "invoice_date",
            label: "Invoice Date",
            type: "date",
            disabled: isEdit,
            optional: isEdit
        },
        {
            name: "invoice_type",
            label: "Invoice Type",
            type: "select",
            options: [
                { label: "Single", value: false },
                { label: "Club", value: true }
            ],
        },
        {
            name: "pi_no",
            label: "PI No",
            type: "text",
            optional: true,
        },
        {
            name: "container_no",
            label: "Container No",
            type: "text",
            optional: true,
        },
        {
            name: "freight_terms",
            label: "Freight Term (Auto)",
            placeholder: "Auto filled based on Factory Invoice",
            type: "text",
            disabled: true,
            optional: true,
        },
        {
            name: "port_of_loading",
            label: "Port of Loading (Auto)",
            placeholder: "Auto filled based on Factory Invoice",
            type: "text",
            disabled: true,
            optional: true,
        },
        {
            name: "invoice_quantity",
            label: "Shipment Quantity (Auto)",
            placeholder: "Auto calculated total quantity for the invoice",
            optional: true,
            disabled: true,
        },
        {
            name: "invoice_value",
            label: "Shipment Value (Auto)",
            placeholder: "Auto calculated total value for the invoice",
            optional: true,
            disabled: true,
        },
        {
            name: "discount",
            label: "Discount",
            type: "number",
            placeholder: "Enter discount amount",
            optional: true,
        },
        {
            name: "total_value",
            label: "Total Value (Auto)",
            placeholder: "Auto calculated total value after discount",
            optional: true,
            disabled: true,
        },
        {
            name: 'consignee_ids',
            label: 'Consignees (Auto)',
            type: 'multiselect',
            options: consignees ? consignees.map(consignee => ({
                label: consignee.consignee_name,
                value: consignee.id
            })) : [],
            placeholder: "Auto filled based on Factory Invoice",
            optional: true,
            disabled: true,
        },
        {
            name: 'notifyParties',
            label: 'Notify Parties (Auto)',
            type: 'multiselect',
            options: consignees ? consignees.map(consignee => ({
                label: consignee.consignee_name,
                value: consignee.id
            })) : [],
            placeholder: "Auto filled based on Factory Invoice",
            optional: true,
            disabled: true,
        },
        {
            name: "remarks",
            label: "Remarks",
            placeholder: "Enter remarks",
            optional: true,
        },
    ]
}