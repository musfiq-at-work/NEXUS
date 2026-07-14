// SELECT
//     B.buyer_name AS buyer_name,
//     F.name AS factory_name,
//     SD.buyer_po,
//     STRING_AGG(DISTINCT E.exfactory_no, ', ') AS exfactory_nos,
//     STRING_AGG(DISTINCT E.exfactory_date::TEXT, ', ') AS exfactory_dates,
//     SUM(ES.delivery_quantity) AS shipment_quantity,
//     COALESCE(FI_AGG.invoice_no, '-') AS factory_invoice,
//     COALESCE(FI_AGG.invoice_date, '-') AS factory_invoice_date,
//     CASE
//         WHEN FI_AGG.invoice_no IS NULL 
//              THEN '-'
//         WHEN COALESCE(FSD.transfer_rate, 0) > 0
//             THEN (SUM(ES.delivery_quantity) * FSD.transfer_rate)::NUMERIC(18,2)::TEXT
//         ELSE (SUM(ES.delivery_quantity) * FSD.factory_rate)::NUMERIC(18,2)::TEXT
//     END AS factory_invoice_value,
//     COALESCE(LC.lc_no, '-') AS lc_no,
//     COALESCE(SC.sales_contract_no, '-') AS sales_contract_no,
//     COALESCE(RI_AGG.invoice_no, '-') AS rdl_invoice,
//     COALESCE(RI_AGG.invoice_date, '-') AS rdl_invoice_date,
//     COALESCE(RI_AGG.invoice_quantity::TEXT, '-') AS rdl_invoice_quantity,
//     COALESCE((RI_AGG.invoice_quantity * SD.fob_rate)::NUMERIC(18,2)::TEXT, '-') AS rdl_invoice_value,
//     COALESCE(DS_AGG.fdbc_no, '-') AS fdbc_no,
//     COALESCE(DS_AGG.fdbc_date, '-') AS fdbc_date
// FROM buyer_orders BO
// INNER JOIN order_styles OS ON OS.order_id = BO.id
// INNER JOIN shipment_details SD ON SD.order_style_id = OS.id
// INNER JOIN factory_shipment_details FSD ON FSD.shipment_detail_id = SD.id
// INNER JOIN buyers B ON B.id = BO.buyer_id
// INNER JOIN factories F ON F.id = BO.factory_id
// LEFT JOIN lc_shipments LCS ON LCS.shipment_details_id = SD.id
// LEFT JOIN lc_orders LCO ON LCO.id = LCS.lc_order_id
// LEFT JOIN lc_master LC ON LC.id = LCO.lc_master_id
// LEFT JOIN sales_contract_details SCD ON SCD.order_id = BO.id
// LEFT JOIN sales_contracts SC ON SC.id = SCD.sales_contract_id
// INNER JOIN exfactory_shipments ES ON ES.shipment_details_id = SD.id
// INNER JOIN exfactory_orders EO ON EO.id = ES.exfactory_orders_id
// INNER JOIN exfactory E ON E.id = EO.exfactory_id
// LEFT JOIN (
//     SELECT
//         FID.exfactory_shipment_id,
//         STRING_AGG(DISTINCT FI.invoice_no, ', ') AS invoice_no,
//         STRING_AGG(DISTINCT FI.invoice_date::TEXT, ', ') AS invoice_date
//     FROM factory_invoice_details FID
//     INNER JOIN factory_invoice FI ON FI.id = FID.factory_invoice_id
//     GROUP BY FID.exfactory_shipment_id
// ) FI_AGG ON FI_AGG.exfactory_shipment_id = ES.id
// LEFT JOIN (
//     SELECT
//         RISD.shipment_details_id,
//         STRING_AGG(DISTINCT RI.invoice_no, ', ') AS invoice_no,
//         STRING_AGG(DISTINCT RI.invoice_date::TEXT, ', ') AS invoice_date,
//         SUM(RISD.invoice_quantity) AS invoice_quantity
//     FROM rdl_invoice_shipment_details RISD
//     INNER JOIN rdl_invoice_details RID ON RID.id = RISD.rdl_invoice_details_id
//     INNER JOIN rdl_invoice RI ON RI.id = RID.rdl_invoice_id
//     GROUP BY RISD.shipment_details_id
// ) RI_AGG ON RI_AGG.shipment_details_id = SD.id
// LEFT JOIN (
//     SELECT
//         RISD.shipment_details_id,
//         STRING_AGG(DISTINCT DS.fdbc_no, ', ') AS fdbc_no,
//         STRING_AGG(DISTINCT DS.fdbc_date::TEXT, ', ') AS fdbc_date
//     FROM rdl_invoice_shipment_details RISD
//     INNER JOIN rdl_invoice_details RID  ON RID.id = RISD.rdl_invoice_details_id
//     INNER JOIN document_submissions_details DSD ON DSD.rdl_invoice_id = RID.rdl_invoice_id
//     INNER JOIN document_submissions DS ON DS.id = DSD.document_submissions_id
//     GROUP BY RISD.shipment_details_id
// ) DS_AGG ON DS_AGG.shipment_details_id = SD.id
// WHERE E.exfactory_date BETWEEN '2026-01-01' AND '2026-06-30'
//     AND COALESCE(ES.delivery_quantity, 0) > 0
// GROUP BY
//     SD.id,
//     FSD.id,
//     BO.id,
//     OS.id,
//     B.id,
//     F.id,
//     LC.id,
//     SC.id,
//     FI_AGG.invoice_no,
//     FI_AGG.invoice_date,
//     RI_AGG.invoice_no,
//     RI_AGG.invoice_date,
//     RI_AGG.invoice_quantity,
//     DS_AGG.fdbc_no,
//     DS_AGG.fdbc_date;