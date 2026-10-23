'use client';

import { Button, Form, Wrapper } from "~/components";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { api } from "~/trpc/react";
import { parseTRPCError } from "~/utils/parseTRPCError";
import { usePreProductionMeetingForm } from "../config/usePreProductionMeetingForm";

const NewPreProductionMeetingPage = () => {
    const router = useRouter();
    const utils = api.useUtils();
    const { methods, handleSubmit, formFields, validationError, control, queryError, isLoadingOptions, emptyMessage, selectedStyle } = usePreProductionMeetingForm();
    const [error, setError] = useState<string | null>(null);
    const addPPMeeting = api.ppMeeting.addPPMeeting.useMutation();
    const isSubmitting = methods.formState.isSubmitting || addPPMeeting.isPending;

    const onSubmit = handleSubmit(async (meeting) => {
        if (addPPMeeting.isPending) return;

        if (!selectedStyle || isLoadingOptions || queryError) {
            setError('Select an available factory, order, and style before adding the PP meeting.');
            return;
        }

        setError(null);

        try {
            await addPPMeeting.mutateAsync({
                factory_id: meeting.factory_id,
                style_id: meeting.style_id,
                daily_plan_quantity: meeting.daily_production_plan,
            });
        } catch (error) {
            const message = parseTRPCError(error);
            setError(message);
            toast.error(`Failed to add Pre Production Meeting: ${message}`);
            return;
        }

        toast.success('Pre Production Meeting added successfully!');
        void utils.ppMeeting.invalidate();
        router.push('/quality/pp_meeting');
    });

    return (
        <Wrapper heading="Add Pre Production Meeting">
            <Form
                fields={formFields}
                onSubmit={onSubmit}
                buttonLabel="Add Pre Production Meeting"
                register={methods.register}
                isLoading={isSubmitting}
                validationError={validationError}
                error={queryError?.message ?? error}
                control={control}
            />
        </Wrapper>
    );
};

export default NewPreProductionMeetingPage;
