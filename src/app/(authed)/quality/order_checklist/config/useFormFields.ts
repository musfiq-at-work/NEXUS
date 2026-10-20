import { api } from "~/trpc/react";
import type { OrderChecklistFormValues } from "./formSchema";
import type { BaseField } from "~/types/form";
import { skipToken } from "@tanstack/react-query";

export type Field<T extends keyof OrderChecklistFormValues> = BaseField<T>;

interface Props {
    buyerId: number | undefined,
    orderId: string | undefined,
    styleId: string | undefined,
}

export const useFormFields = ({buyerId, orderId, styleId}: Props): Field<keyof OrderChecklistFormValues>[] => {
    const buyers = api.buyers.getAllBuyersByTeam.useQuery().data ?? [];

    const orders = api.quality.getOrdersForChecklist.useQuery(
        !!buyerId ? { buyerId } : skipToken
    ).data || [];

    const styles = api.quality.getStyleForOrderChecklist.useQuery(
        !!orderId ? { orderId } : skipToken
    ).data || [];

    const po = api.quality.getShipmentForOrderChecklist.useQuery(
        !!styleId ? { styleId } : skipToken
    ).data || [];

    return [
        {
            name: "buyer_id",
            label: "Buyer",
            placeholder: "Select buyer",
            type: "select",
            options: buyers.map((b) => ({ label: b.buyer_name, value: b.id.toString() })),
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
            options: styles.map((s) => ({ label: s.style, value: s.id.toString() })),
        },
        {
            name: "po_id",
            label: "Season",
            placeholder: "Select season",
            type: "select",
            options: po.map((p) => ({ label: p.buyer_po, value: p.id.toString() })),
        },
        {
            name: "factory_name",
            label: "Remarks",
            placeholder: "Enter remarks",
            optional: true,
            disabled: true
        },
    ]
}