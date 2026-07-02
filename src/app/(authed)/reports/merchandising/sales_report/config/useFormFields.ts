import { api } from "~/trpc/react";
import type { SalesReportFormValues } from "./formSchema";
import type { BaseField } from "~/types/form";
import { skipToken } from "@tanstack/react-query";

export type Field<T extends keyof SalesReportFormValues> = BaseField<T>;

interface PropsType {
    buyer_ids?: number[];
    brand_ids?: number[];
}

export const useFormFields = ({buyer_ids, brand_ids}: PropsType): Field<keyof SalesReportFormValues>[] => {
    const buyers = api.buyers.getAllBuyersByTeam.useQuery().data ?? [];

    const factories = api.factory.getAllFactories.useQuery().data ?? [];

    const brands = api.buyers.getBrandsByBuyers.useQuery(
        !!buyer_ids ? buyer_ids ?? [] : skipToken
    ).data ?? [];

    const teams = api.teams.getTeamsByBuyers.useQuery(
        !!buyer_ids ? buyer_ids ?? [] : skipToken
    ).data ?? [];

    const departments = api.buyers.getDepartmentsByBrands.useQuery(
        !!brand_ids ? brand_ids ?? [] : skipToken
    ).data ?? [];

    const productTypes = api.productType.getAll.useQuery().data ?? [];

    return [
        {
            name: "base",
            label: "Based On",
            type: "select",
            options: [
                {label: "Ex-Factory Date", value: "EXFACTORY"},
                {label: "ETD Date", value: "ETD"},
                {label: "Handover Date", value: "HANDOVER"}
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
            placeholder: "Select buyers, or leave blank for all",
            type: "multiselect",
            options: buyers.map((buyer) => ({ label: buyer.buyer_name, value: buyer.id })),
            optional: true,
        },
        {
            name: "factory_ids",
            label: "Select Factories",
            placeholder: "Select factories, or leave blank for all",
            type: "multiselect",
            options: factories.map((f) => ({ label: f.name, value: f.id.toString() })),
            optional: true,
        },
        {
            name: "brand_ids",
            label: "Select Brands",
            placeholder: "Select brands, or leave blank for all",
            type: "multiselect",
            options: brands.map((pt) => ({ label: pt.brand, value: pt.id.toString() })),
            optional: true,
        },
        {
            name: "department_ids",
            label: "Select Departments",
            placeholder: "Select departments, or leave blank for all",
            type: "multiselect",
            options: departments.map((dept) => ({ label: dept.departments, value: dept.id.toString() })),
            optional: true,
        },
        {
            name: "team_id",
            label: "Select Teams",
            placeholder: "Select teams, or leave blank for all",
            type: "multiselect",
            options: teams.map((team) => ({ label: team.team_name, value: team.id.toString() })),
            optional: true,
        },
        {
            name: "product_type_ids",
            label: "Select Product Types",
            placeholder: "Select product types, or leave blank for all",
            type: "multiselect",
            options: productTypes.map((pt) => ({ label: pt.name, value: pt.id.toString() })),
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