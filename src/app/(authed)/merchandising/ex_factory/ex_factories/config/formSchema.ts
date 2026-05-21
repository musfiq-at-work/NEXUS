import z from 'zod';

export const createExFactoryShipmentSchema = (tolerance: number) =>
  z.object({
    db_id: z.string().optional(),
    shipment_details_id: z.string().optional(),
    style_no: z.string().optional(),
    po_no: z.string().optional(),
    destination: z.string().optional(),
    colors: z.string().optional(),
    lot_quantity: z.string().optional(),
    previous_shipment_quantity: z.string().optional(),
    shipment_quantity: z.number().optional(),
    shipment_mode: z.string().optional(),
    delivery_close: z.boolean().optional(),
    po_close: z.boolean().optional(),
  }).superRefine((data, ctx) => {
    const lotQty = Number(data.lot_quantity || 0);
    const previousQuantity = Number(data.previous_shipment_quantity || 0);

    if (!lotQty || !data.shipment_quantity) return;

    const maxAllowed = lotQty * (1 + (tolerance / 100));

    if (data.shipment_quantity + previousQuantity > Math.floor(maxAllowed)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["shipment_quantity"],
        message: `Shipment Quantity cannot exceed ${Math.floor(maxAllowed)} (including ${tolerance}% tolerance)`,
      });
    }
});

export type ExFactoryShipmentValues = z.infer<
  ReturnType<typeof createExFactoryShipmentSchema>
>;

export const createExFactoryOrderSchema = (tolerance: number) =>
  z.object({
    db_id: z.string().optional(),
    order_id: z.string().optional(),
    shipments: z.array(
      createExFactoryShipmentSchema(tolerance)
    ).optional(),
});

export type ExFactoryOrdersValues = z.infer<
  ReturnType<typeof createExFactoryOrderSchema>
>;

// Define the form fields schema using Zod
export const createExFactoryFormSchema = (tolerance: number) => {
  return z.object({
    exfactory: z.object({
      db_id: z.string().optional(),
      exfactory_no: z.string().optional(),
      payment_type: z.string().min(1, "Payment Type is required"),
      factory_id: z.string().min(1, "Factory is required"),
      buyer_id: z.string().min(1, "Buyer is required"),
      exfactory_date: z.string().min(1, "Ex Factory Date is required"),
      remarks: z.string().optional(),
      orders: z.array(
        createExFactoryOrderSchema(tolerance)
      ).optional(),
    }),
  })
};

export type ExFactoryFormValues = z.infer<
  ReturnType<typeof createExFactoryFormSchema>
>;


      // exfactory_date: z.string().min(1, "Ex Factory Date is required").refine((val) => {
      //   if (!val) return true; // optional field
      //   const inputDate = new Date(val);
      //   const today = new Date();
      //   const threeDaysAgo = new Date();
      //   threeDaysAgo.setDate(today.getDate() - 3);
  
      //   return inputDate >= threeDaysAgo;
      // }, {
      //   message: "Exfactory date cannot be more than 3 days behind today",
      // }),