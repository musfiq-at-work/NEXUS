import { skipToken } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useWatch } from "react-hook-form";
import { api, type RouterOutputs } from "~/trpc/react";
import type { BaseField } from "~/types/form";
import { formatDateForInput } from "~/utils/localDateString";
import { sampleChecklistFormSchema, type SampleChecklistFormValues } from "./formSchema";

export type SampleChecklist = RouterOutputs["sampleChecklist"]["getSampleChecklistById"];

const getLabelStatus = (value: number | null | undefined) => {
    return value === 1 ? 1 : value === -1 ? -1 : 0;
};

export const useSampleChecklistForm = (checklist?: SampleChecklist) => {
    const methods = useForm<SampleChecklistFormValues>({
        resolver: zodResolver(sampleChecklistFormSchema),
        defaultValues: {
            sample_check_date: checklist?.sample_check_date ? checklist.sample_check_date.toISOString().slice(0, 10) : formatDateForInput(new Date()),
            buyer_id: checklist?.buyer_id ?? 0,
            factory_id: checklist?.factory_id ?? 0,
            order_id: checklist?.order_id ?? "",
            style_id: checklist?.style_id ?? "",
            color_id: checklist?.color_id ?? 0,
            sample_type: checklist?.sample_type ?? 0,
            sample_size: checklist?.sample_size ?? "",
            sample_quantity: checklist?.sample_quantity ?? null,
            fabric: checklist?.fabric ?? "",
            trims_accessories: checklist?.trims_accessories ?? "",
            workmanship: checklist?.workmanship ?? "",
            fitting: checklist?.fitting ?? "",
            measurement: checklist?.measurement ?? "",
            pattern: checklist?.pattern ?? "",
            print_emb: checklist?.print_emb ?? "",
            wash: checklist?.wash ?? "",
            main_label: getLabelStatus(checklist?.main_label),
            main_label_position: getLabelStatus(checklist?.main_label_position),
            size_label: getLabelStatus(checklist?.size_label),
            size_label_position: getLabelStatus(checklist?.size_label_position),
            care_label: getLabelStatus(checklist?.care_label),
            care_label_position: getLabelStatus(checklist?.care_label_position),
            risk_area: checklist?.risk_area ?? "",
        },
    });

    const { control, getValues, setValue } = methods;
    const [buyerId, factoryId, styleId] = useWatch({ control, name: ["buyer_id", "factory_id", "style_id"] });
    const buyersQuery = api.buyers.getAll.useQuery();
    const factoriesQuery = api.factory.getAllFactories.useQuery();
    const sampleTypesQuery = api.sampleTypes.getAllSampleType.useQuery();
    const stylesQuery = api.sampleChecklist.getStyles.useQuery(buyerId && factoryId ? { buyerId, factoryId } : skipToken);
    const selectedStyle = stylesQuery.data?.find((style) => style.id === styleId);
    const optionsQuery = api.sampleChecklist.getStyleOptions.useQuery(selectedStyle ? { styleId: selectedStyle.id } : skipToken);

    const queryError = buyersQuery.error ?? factoriesQuery.error ?? sampleTypesQuery.error ?? stylesQuery.error ?? optionsQuery.error;
    const isLoadingOptions = buyersQuery.isFetching ||
        factoriesQuery.isFetching ||
        sampleTypesQuery.isFetching ||
        stylesQuery.isFetching ||
        optionsQuery.isFetching;

    const headerFields: BaseField<keyof SampleChecklistFormValues>[] = [
        { name: "sample_check_date", label: "Date", type: "date" },
        {
            name: "buyer_id",
            label: "Buyer",
            type: "select",
            options: buyersQuery.data?.map((buyer) => ({ label: buyer.buyer_name, value: buyer.id })),
            disabled: buyersQuery.isFetching,
        },
        {
            name: "factory_id",
            label: "Factory",
            type: "select",
            options: factoriesQuery.data?.map((factory) => ({ label: factory.name, value: factory.id })),
            disabled: factoriesQuery.isFetching,
        },
        {
            name: "style_id",
            label: "Style",
            type: "select",
            options: stylesQuery.data?.map((style) => ({ label: `${style.style} (${style.buyer_orders.ref_no})`, value: style.id })),
            disabled: !buyerId || !factoryId || stylesQuery.isFetching,
        },
        {
            name: "order_id",
            label: "Order Ref",
            type: "select",
            options: selectedStyle ? [{ label: selectedStyle.buyer_orders.ref_no, value: selectedStyle.order_id }] : [],
            disabled: true,
        },
        {
            name: "color_id",
            label: "Color",
            type: "select",
            options: optionsQuery.data?.colors.map((color) => ({ label: color.name, value: color.id })),
            disabled: !selectedStyle || optionsQuery.isFetching,
        },
        {
            name: "sample_type",
            label: "Sample Type",
            type: "select",
            options: sampleTypesQuery.data?.map((sampleType) => ({ label: sampleType.name, value: sampleType.id })),
            disabled: sampleTypesQuery.isFetching,
        },
        {
            name: "sample_size",
            label: "Sample Size",
            type: "select",
            options: optionsQuery.data?.sizes.map((size) => ({ label: size, value: size })),
            disabled: !selectedStyle || optionsQuery.isFetching,
            optional: true,
        },
        { name: "sample_quantity", label: "Sample Quantity", type: "number", optional: true },
    ];

    const resetDependentFields = (name: keyof SampleChecklistFormValues) => {
        if (name === "buyer_id" || name === "factory_id") {
            setValue("order_id", "", { shouldDirty: true });
            setValue("style_id", "", { shouldDirty: true });
        }
        if (name === "style_id") {
            const style = stylesQuery.data?.find((style) => style.id === getValues("style_id"));
            setValue("order_id", style?.order_id ?? "", { shouldDirty: true, shouldValidate: true });
        }
        if (name === "buyer_id" || name === "factory_id" || name === "style_id") {
            setValue("color_id", 0, { shouldDirty: true });
            setValue("sample_size", "", { shouldDirty: true });
        }
    };

    return { methods, headerFields, resetDependentFields, queryError, isLoadingOptions, selectedStyle };
};
