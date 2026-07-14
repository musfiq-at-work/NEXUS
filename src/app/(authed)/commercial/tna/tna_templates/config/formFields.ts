import { api } from "~/trpc/react";
import type { FormValues } from "./formSchema";
import type { BaseField } from "~/types/form";
import { skipToken } from "@tanstack/react-query";

export type Field<T extends keyof FormValues> = BaseField<T>;


export const formFields = (): Field<keyof FormValues>[] => {
    const buyers = api.buyers.getAllBuyersByTeam.useQuery();
    const terms = api.terms.getAllTerms.useQuery().data ?? [];

    return [
        {
            name: "template_name",
            label: "Template Name",
            type: "text",
            placeholder: "Enter template name",
        },
        {   
            name: "buyer_id",
            label: "Buyer",
            type: "select",
            options: buyers.data?.map(buyer => ({ 
                value: buyer.id.toString(), 
                label: buyer.buyer_name 
            })) ?? [],
            placeholder: "Select Buyer",
        },
        {
            name: "term_id",
            label: "Term",
            type: "select",
            options: terms.map(term => ({ 
                value: term.id.toString(), 
                label: term.name 
            })) ?? [],
            placeholder: "Select Term",
        }
    ];
};