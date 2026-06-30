import { api } from "~/trpc/react";
import type { SalesReportFormValues } from "./formSchema";
import type { BaseField } from "~/types/form";

export type Field<T extends keyof SalesReportFormValues> = BaseField<T>;


interface PropsType {
    fdbcRdlInvoiceList: FdbcRdlInvoiceListItem[];
    companyBankList: CompanyBankListItem[];
}

export const useFormFields = ({lcScList, isEdit, fdbcRdlInvoiceList, companyBankList}: PropsType): Field<keyof SalesReportFormValues>[] => {
    const buyers = api.buyers.getAllBuyersByTeam.useQuery().data ?? [];
    const factories = api.factory.getAllFactories.useQuery().data ?? [];

    return [
        {
            name: "base",
            label: "Based On",
            type: "select",
            options: [
                {label: "Ex-Factory", value: "EXFACTORY"},
                {label: "ETD", value: "ETD"},
                {label: "Handover", value: "HANDOVER"}
            ],
        },
        {
            name: "from_date",
            label: "From Date",
            type: "date",
            optional: true
        },
        {
            name: "to_date",
            label: "To Date",
            type: "date",
            optional: true
        },
        {
            name: "buyer_ids",
            label: "Select Buyers",
            placeholder: "Select buyers",
            type: "multiselect",
            options: buyers.map((buyer) => ({ label: buyer.buyer_name, value: buyer.id })),
            disabled: true,
            optional: true,
        },
        {
            name: "factory_ids",
            label: "Select Factories",
            placeholder: "Select factories",
            type: "multiselect",
            options: factories.map((f) => ({ label: f.name, value: f.id.toString() })),
            disabled: true,
            optional: true,
        },
        {
            name: "lc_sc_id",
            label: "LC/Sales Contract No",
            type: "select",
            options: lcScList.map((lc) => ({ label: lc.sc_lc_no, value: lc.id })),
            disabled: isEdit,
            optional: isEdit
        },
        {
            name: "fdbc_rdl_invoice_id",
            label: "FDBC/RDL Invoice No",
            type: "select",
            options: fdbcRdlInvoiceList.map((invoice) => ({ label: invoice.fdbc_rdl_invoice_no, value: invoice.id })),
            disabled: isEdit,
            optional: isEdit
        },
        {
            name: 'company_bank_id',
            label: 'Company Bank',
            type: "select",
            options: companyBankList.map((bank) => ({ label: bank.bank_name, value: bank.id })),
            disabled: isEdit,
            optional: isEdit
        },
    ]
}