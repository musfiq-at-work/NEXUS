import { api } from "~/trpc/react";
import type { SalesReportFormValues } from "./formSchema";
import type { BaseField } from "~/types/form";

export type Field<T extends keyof SalesReportFormValues> = BaseField<T>;


interface PropsType {
    buyer_ids?: number[];
}

export const useFormFields = ({buyer_ids}: PropsType): Field<keyof SalesReportFormValues>[] => {
    const buyers = api.buyers.getAllBuyersByTeam.useQuery().data ?? [];
    const factories = api.factory.getAllFactories.useQuery().data ?? [];
    const productTypes = api.buyers.getDepartmentByBuyer.useQuery(buyer_ids || []).data ?? [];
    const teams = api.teams.getTeamsByBuyers.useQuery(buyer_ids || []).data ?? [];

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
            name: "product_type_ids",
            label: "Select Product Types",
            placeholder: "Select product types",
            type: "multiselect",
            options: productTypes.map((pt) => ({ label: pt.departments, value: pt.id.toString() })),
            disabled: true,
            optional: true,
        },
        {
            name: "team_id",
            label: "Select Teams",
            placeholder: "Select teams",
            type: "multiselect",
            options: teams.map((team) => ({ label: team.team_name, value: team.id.toString() })),
            disabled: true,
            optional: true,
        },
        {
            name: 'quantity',
            label: 'Quantity',
            type: "checkbox",
            optional: true
        },
        {
            name: 'rdl_value',
            label: 'RDL Value',
            type: "checkbox",
            optional: true
        },
        {
            name: 'factory_value',
            label: 'Factory Value',
            type: "checkbox",
            optional: true
        },
        {
            name: 'commission_value',
            label: 'Commission Value',
            type: "checkbox",
            optional: true
        }
    ]
}