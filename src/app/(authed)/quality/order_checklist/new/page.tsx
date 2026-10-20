'use client';

import { Button, Form, Wrapper } from "~/components";
import React, { useState } from "react";
import { api } from "~/trpc/react";
import { toast } from "sonner";
import { parseTRPCError } from "~/utils/parseTRPCError";
import { useOrderChecklistForm } from "../config/useOrderChecklistForm";
import { useRouter } from "next/navigation";
import ListDetails from "../components/shipmentDetails";

const NewOrderChecklistPage = () => {
    const router = useRouter();

    // Form setup
    const { methods, handleSubmit, formFields, validationError, control } = useOrderChecklistForm();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // TRPC utils    
    const utils = api.useUtils();

    // const addEarlySettlement = api.earlySettlement.addEarlySettlement.useMutation({
    //     onSuccess: async () => {
    //         setError(null);
    //         toast.success("Order Checklist added successfully!");
    //         await Promise.all([
    //             utils.earlySettlement.getEarlySettlements.invalidate(),
    //             utils.earlySettlement.searchEarlySettlements.invalidate(),
    //             utils.earlySettlement.getPoDetails.invalidate(),
    //             utils.earlySettlement.getOrderForEarlySettlement.invalidate(),
    //         ]);
    //     }
    // });

    // // Handle form submission for all fields
    // const onSubmitAll =  handleSubmit(async (earlySettlement) => {
    //     try {
    //         setIsLoading(true);
    //         const payload = {
    //             order_id: earlySettlement.order_id,
    //             remarks: earlySettlement.remarks,
    //             buyer_id: earlySettlement.buyer_id
    //         };

    //         const newId = await addEarlySettlement.mutateAsync(payload);
    //         router.push(`/quality/order_checklist/edit/${newId}`);
    //     }
    //     catch (error) {
    //         const message = parseTRPCError(error);
    //         toast.error(`Failed to add Order Checklist: ${message}`);
    //     }
    //     finally {
    //         setIsLoading(false);
    //     }
    // });

    return (
        <Wrapper heading='Add Order Checklist' >
            <Form 
                fields={formFields} 
                buttonLabel="Add Order Checklist" 
                register={methods.register}
                isLoading={isLoading}
                validationError={validationError ?? {}}
                error={error}
                control={control}
            />

            <ListDetails 
                methods={methods} 
                validationError={validationError.details ?? {}}
            />

            {/* <div className="w-full flex flex-row justify-end">
                <Button type="button" 
                    onClick={() => onSubmitAll()}
                    label={"Add Order Checklist"} 
                    className="text-lg tracking-wide mt-6 max-w-80 m-8"
                    disabled={isLoading}
                />
            </div> */}
        </Wrapper>
    );
};

export default NewOrderChecklistPage;