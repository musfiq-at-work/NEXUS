"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Controller } from "react-hook-form";
import { toast } from "sonner";
import { printingWhiteIcon } from "~/assets";
import { Button, FormSelect, TextField, Wrapper } from "~/components";
import { useModulePermissions } from "~/hooks";
import { api } from "~/trpc/react";
import { parseTRPCError } from "~/utils/parseTRPCError";
import { sampleChecklistLabelFields, sampleChecklistLabelOptions, sampleChecklistSections } from "~/utils/sampleChecklist";
import { useSampleChecklistForm, type SampleChecklist } from "../config/useSampleChecklistForm";
import PhotoSection from "./PhotoSection";

type SampleChecklistEditorProps = { checklist?: SampleChecklist };

const SampleChecklistEditor = (props: SampleChecklistEditorProps) => {
    const { checklist } = props;

    const router = useRouter();
    const utils = api.useUtils();
    const { can_add, can_update, can_view } = useModulePermissions();
    const { methods, headerFields, resetDependentFields, queryError, isLoadingOptions, selectedStyle } = useSampleChecklistForm(checklist);
    const [error, setError] = useState<string | null>(null);
    const saveChecklist = api.sampleChecklist.saveSampleChecklist.useMutation();
    const {
        control,
        register,
        formState: { errors, isSubmitting },
    } = methods;
    const canSave = checklist ? !!can_update : !!can_add;
    const isSaving = isSubmitting || saveChecklist.isPending;
    const disabled = !canSave || isSaving;
    const errorMessage = queryError?.message ?? error;

    const onSubmit = methods.handleSubmit(async (values) => {
        if (!canSave || saveChecklist.isPending) return;
        if (!selectedStyle || isLoadingOptions || queryError) {
            setError("Select an available buyer, factory, order, and style before saving the checklist.");
            return;
        }
        setError(null);

        try {
            const id = await saveChecklist.mutateAsync({ ...values, id: checklist?.id });
            toast.success(`Sample Checklist ${checklist ? "updated" : "added"} successfully!`);
            methods.reset(values);
            void utils.sampleChecklist.invalidate();
            if (!checklist) router.push(`/quality/sample_checklist/edit/${id}`);
        } catch (error) {
            const message = parseTRPCError(error);
            setError(message);
            toast.error(`Failed to save Sample Checklist: ${message}`);
        }
    });

    return (
        <Wrapper
            heading={checklist ? (canSave ? "Update Sample Checklist" : "View Sample Checklist") : "Add Sample Checklist"}
            subSectionRight={
                checklist && can_view ? (
                    <div className="mb-3 w-50">
                        <Button
                            variant="secondary"
                            label="Print Report"
                            leftIcon={printingWhiteIcon}
                            disabled={isSaving}
                            onClick={() => window.open(`/pdf/sample_checklist/${checklist.id}`, "_blank")}
                        />
                    </div>
                ) : null
            }
        >
            <form onSubmit={onSubmit} className="flex w-full flex-col gap-6 p-4 md:p-8">
                {errorMessage && (
                    <p role="alert" className="rounded border border-red-400 bg-red-100 p-4 text-red-700">
                        {errorMessage}
                    </p>
                )}

                <div className="grid w-full grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                    {headerFields.map((header) =>
                        header.type === "select" ? (
                            <Controller
                                key={header.name}
                                name={header.name}
                                control={control}
                                render={({ field }) => (
                                    <FormSelect
                                        name={header.name}
                                        label={header.label}
                                        options={header.options}
                                        value={field.value}
                                        onChange={(value) => {
                                            if (value === field.value) return;
                                            field.onChange(value ?? (typeof field.value === "number" ? 0 : ""));
                                            resetDependentFields(header.name);
                                        }}
                                        error={errors[header.name]?.message}
                                        optional={header.optional}
                                        disabled={disabled || header.disabled}
                                    />
                                )}
                            />
                        ) : header.name === "sample_quantity" ? (
                            <Controller
                                key={header.name}
                                name="sample_quantity"
                                control={control}
                                render={({ field }) => (
                                    <TextField
                                        {...field}
                                        label={header.label}
                                        type="number"
                                        min={0}
                                        max={2147483647}
                                        step={1}
                                        value={field.value ?? ""}
                                        onChange={(event) => field.onChange(event.target.value === "" ? null : event.target.valueAsNumber)}
                                        error={errors.sample_quantity?.message}
                                        optional
                                        disabled={disabled}
                                    />
                                )}
                            />
                        ) : (
                            <TextField
                                key={header.name}
                                {...register(header.name)}
                                label={header.label}
                                type={header.type}
                                error={errors[header.name]?.message}
                                disabled={disabled}
                            />
                        ),
                    )}
                </div>

                {checklist ? (
                    sampleChecklistSections.map((section) => (
                        <section key={section.name} className="rounded-md border border-dashed border-gray-400 p-4 shadow-sm">
                            <h3 className="mb-3 text-xl font-semibold text-gray-700">{section.label}</h3>
                            {section.name === "labels" ? (
                                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                    {sampleChecklistLabelFields.map((label) => (
                                        <Controller
                                            key={label.name}
                                            name={label.name}
                                            control={control}
                                            render={({ field }) => (
                                                <FormSelect
                                                    name={label.name}
                                                    label={label.label}
                                                    value={field.value}
                                                    options={sampleChecklistLabelOptions}
                                                    onChange={(value) => field.onChange(value ?? 0)}
                                                    error={errors[label.name]?.message}
                                                    disabled={disabled}
                                                />
                                            )}
                                        />
                                    ))}
                                </div>
                            ) : section.name !== "other" ? (
                                <>
                                    <label htmlFor={section.name} className="mb-2 block text-sm text-gray-600">
                                        {section.label} Comments
                                    </label>
                                    <textarea
                                        id={section.name}
                                        {...register(section.name)}
                                        rows={4}
                                        disabled={disabled}
                                        className="focus:border-secondary w-full resize-y rounded-md border border-gray-300 p-3 text-sm outline-none disabled:bg-gray-100"
                                        placeholder={`Enter ${section.label.toLowerCase()} comments`}
                                    />
                                    {errors[section.name] && (
                                        <p role="alert" className="text-sm text-red-600">
                                            {errors[section.name]?.message}
                                        </p>
                                    )}
                                </>
                            ) : null}
                            <PhotoSection
                                checklistId={checklist.id}
                                section={section.name}
                                title={section.label}
                                images={checklist[section.relation]}
                                disabled={disabled}
                            />
                        </section>
                    ))
                ) : (
                    <p className="text-sm text-gray-600">Create the checklist to add section comments, label checks, and photos.</p>
                )}

                {canSave && (
                    <div className="flex justify-end">
                        <Button
                            type="submit"
                            label={isSaving ? "Saving..." : checklist ? "Save Sample Checklist" : "Create Sample Checklist"}
                            disabled={isSaving || isLoadingOptions || !!queryError}
                            className="max-w-80"
                        />
                    </div>
                )}
            </form>
        </Wrapper>
    );
};

export default SampleChecklistEditor;
