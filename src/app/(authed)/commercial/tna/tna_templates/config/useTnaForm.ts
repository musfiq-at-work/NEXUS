import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { formSchema } from "./formSchema";
import type { FormValues } from "./formSchema";
import { formFields } from "./formFields";
import type { GetTNATemplateByIdTypes } from "~/types/commercialAPITypes";

type TNAActions = NonNullable<GetTNATemplateByIdTypes>['actions'][number];

export const useTnaForm = (tnaData?: GetTNATemplateByIdTypes) => {
    // Form setup
    const methods = useForm<FormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: tnaData ? {
            db_id: tnaData.id ? tnaData.id.toString() : undefined,
            template_name: tnaData.template_name,
            buyer_id: tnaData.buyer_id?.toString() ?? "",
            term_id: tnaData.term_id?.toString() ?? "",
            actions: tnaData.actions?.map((action: TNAActions) => ({
                alert_before: action.alert_before ?? undefined,
                action_id: action.tna_action_id ? action.tna_action_id.toString() : undefined,
                days: action.days ?? undefined,
                db_id: action.id ? action.id.toString() : undefined,
            })) ?? [],
        } : {
            template_name: "",
            buyer_id: "",
            term_id: "",
        },
    });

    const { handleSubmit, formState: { errors: validationError }, setFocus, control } = methods;

    // Effect to reset form when tnaData changes
    useEffect(() => {
        if (tnaData) {
            methods.reset({
                ...tnaData,
                db_id: tnaData.id ? tnaData.id.toString() : undefined,
                buyer_id: tnaData.buyer_id ? tnaData.buyer_id.toString() : undefined,
                term_id: tnaData.term_id ? tnaData.term_id.toString() : undefined,
                actions: tnaData.actions?.map((action: TNAActions) => ({
                    db_id: action.id ? action.id.toString() : undefined,
                    alert_before: action.alert_before ?? undefined,
                    action_id: action.tna_action_id ? action.tna_action_id.toString() : undefined,
                    days: action.days ?? undefined,
                })) ?? [],
            });
        }
    }, [tnaData, methods]);

    // Focus the first errored field on validation error
    useEffect(() => {
        const firstError = Object.keys(validationError)[0];
        if (firstError) setFocus(firstError as keyof FormValues);
    }, [validationError, setFocus]);


    return { 
        methods, 
        handleSubmit, 
        formFields: formFields(), 
        validationError, 
        control 
    };
};