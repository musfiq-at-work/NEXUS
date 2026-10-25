import { api } from "~/trpc/react";
import type { PreProductionFormValues } from "./formSchema";
import type { BaseField } from "~/types/form";
import { skipToken } from "@tanstack/react-query";

export type Field<T extends keyof PreProductionFormValues> = BaseField<T>;

interface Props {
    factoryId: number | undefined;
    orderId: string | undefined;
    styleId: string | undefined;
}

export const useFormFields = (props: Props) => {
    const { factoryId, orderId, styleId } = props;

    const factoriesQuery = api.factory.getAllFactories.useQuery();
    const factories = factoriesQuery.data ?? [];

    const ordersQuery = api.ppMeeting.getOrdersForPPMeeting.useQuery(
        factoryId ? { factoryId } : skipToken
    );
    const orders = ordersQuery.data ?? [];
    const selectedOrder = orders.find((order) => order.id === orderId);
    
    const stylesQuery = api.ppMeeting.getStyleForPPMeeting.useQuery(
        selectedOrder ? { orderId: selectedOrder.id } : skipToken
    );
    const styles = stylesQuery.data ?? [];
    
    const selectedStyle = selectedOrder ? styles.find((style) => style.id === styleId) : undefined;
    const queryError = factoriesQuery.error ?? ordersQuery.error ?? stylesQuery.error;
    const isLoadingOptions = factoriesQuery.isFetching || ordersQuery.isFetching || stylesQuery.isFetching;

    const formFields: Field<keyof PreProductionFormValues>[] = [
        {
            name: "factory_id",
            label: "Factory",
            placeholder: "Select factory",
            type: "select",
            options: factories.map((f) => ({ label: f.name, value: f.id })),
            disabled: factoriesQuery.isFetching,
        },
        {
            name: "order_id",
            label: "Order Ref",
            placeholder: "Select Order",
            type: "select",
            options: orders.map((o) => ({ label: o.ref_no, value: o.id.toString() })),
        },
        {
            name: 'style_id',
            label: 'Style',
            placeholder: "Select Style",
            type: "select",
            options: styles.map((s) => ({ label: s.style, value: s.id })),
        },
        {
            name: "first_shipment_date",
            label: "First Shipment Date",
            placeholder: "First shipment date",
            type: "date",
            disabled: true,
            optional: true
        },
        {
            name: "item",
            label: "Item",
            placeholder: "Enter Item",
            optional: true,
            disabled: true
        },
        {
            name: "fabric_description",
            label: "Fabric Description",
            placeholder: "Enter Fabric Description",
            optional: true,
            disabled: true
        },
        {
            name: "required_gsm",
            label: "Fabric Required GSM",
            placeholder: "Fabric Required GSM",
            optional: true,
            disabled: true
        },
        {
            name: "order_quantity",
            label: "Order Quantity",
            placeholder: "Enter Order Quantity",
            optional: true,
            disabled: true
        },
        {
            name: "daily_production_plan",
            label: "Daily Production Plan (pcs)",
            placeholder: "Enter daily production quantity",
            type: "number",
        },
    ];

    return { formFields, selectedStyle, queryError, isLoadingOptions };
};
