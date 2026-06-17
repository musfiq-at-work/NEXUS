import { api } from "~/trpc/react";
import type { CommissionInvoiceFormValues } from "./formSchema";
import type { BaseField } from "~/types/form";

export type Field<T extends keyof CommissionInvoiceFormValues> = BaseField<T>;

interface LCListItem {
    id: string;
    sc_lc_no: string;
}

interface PropsType {
    lcScList: LCListItem[];
    isEdit: boolean;
}

export const useFormFields = ({lcScList, isEdit}: PropsType): Field<keyof CommissionInvoiceFormValues>[] => {
    const terms = api.terms.getAllTerms.useQuery().data ?? [];
    const buyers = api.buyers.getAllBuyersByTeam.useQuery().data ?? [];
    const couriers = api.courier.getAllCouriers.useQuery().data ?? [];

    return [
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
            name: 'buyer_id',
            label: 'Buyer',
            type: "select",
            options: buyers.map((buyer) => ({ label: buyer.buyer_name, value: buyer.id })),
            disabled: isEdit,
            optional: isEdit,
        },
        {
            name: "invoice_date",
            label: "Invoice Date",
            type: "date",
            disabled: isEdit,
            optional: isEdit
        },
        {
            name: "ref_no",
            label: "Reference No",
            type: "text",
            optional: isEdit,
            disabled: isEdit
        },
        {
            name: "lc_sc_id",
            label: "LC/Sales Contract No",
            type: "number",
            optional: true,
        },
        {
            name: "fdbc_rdl_invoice_no",
            label: "FDBC/Sales Contract No",
            type: "date",
        },
        {
            name: "lc_sc_id",
            label: "Select LC/SC",
            type: "select",
            options: lcScList.map((lc) => ({ label: lc.sc_lc_no, value: lc.id })),
            disabled: isEdit,
            optional: isEdit
        },
        {
            name: 'company_bank_id',
            label: 'Company Bank',
            type: "select",
            options: couriers.map((courier) => ({ label: courier.name, value: courier.id })),
            optional: true,
        },
    ]
}