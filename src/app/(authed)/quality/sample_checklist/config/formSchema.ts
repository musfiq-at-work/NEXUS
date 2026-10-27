import { z } from "zod";

const labelStatus = z.union([z.literal(0), z.literal(1), z.literal(-1)]);

export const sampleChecklistFormSchema = z.object({
    sample_check_date: z.string().date("Sample check date is required"),
    buyer_id: z.number().int().positive("Buyer is required"),
    factory_id: z.number().int().positive("Factory is required"),
    order_id: z.string().uuid("Order is required"),
    style_id: z.string().uuid("Style is required"),
    color_id: z.number().int().positive("Color is required"),
    sample_type: z.number().int().positive("Sample type is required"),
    sample_size: z.string().max(50),
    sample_quantity: z.number().int("Sample quantity must be a whole number").min(0).max(2147483647).nullable(),
    fabric: z.string(),
    trims_accessories: z.string(),
    workmanship: z.string(),
    fitting: z.string(),
    measurement: z.string(),
    pattern: z.string(),
    print_emb: z.string(),
    wash: z.string(),
    main_label: labelStatus,
    main_label_position: labelStatus,
    size_label: labelStatus,
    size_label_position: labelStatus,
    care_label: labelStatus,
    care_label_position: labelStatus,
    risk_area: z.string(),
});

export type SampleChecklistFormValues = z.infer<typeof sampleChecklistFormSchema>;
