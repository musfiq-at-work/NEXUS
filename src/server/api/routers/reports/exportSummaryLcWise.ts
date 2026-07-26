// SELECT * FROM buyer_orders;

// WITH ORDER_DETAILS AS (
// 	SELECT
// 		SD.ID AS SHIPMENT_ID,
// 		SUM(SID.QUANTITY) AS QUANTITY,
// 		SUM(SID.QUANTITY) * SD.FOB_RATE / BO.currency_rate AS RDL_VALUE
// 	FROM shipment_details AS SD 
// 		INNER JOIN shipment_item_details AS SID ON SID.shipment_detail_id = SD.id	
// 		INNER JOIN order_styles AS OS ON OS.id = SD.order_style_id
// 		INNER JOIN buyer_orders AS BO ON BO.id = OS.order_id
// 	GROUP BY SD.ID, BO.ID
// ),
// EXFACTORY_DETAILS AS (
// 	SELECT 
// 		*
// 	FROM exfactory_shipments AS ES 
		
// )
// SELECT 
// 	B.buyer_name AS BUYER_NAME,
// 	LC.LC_NO,
// 	SUM(OD.QUANTITY) AS TOTAL_ORDER_QUANTITY,
// 	SUM(OD.RDL_VALUE) AS TOTAL_ORDER_VALUE
// FROM lc_master AS LC
// 	INNER JOIN buyers AS B ON B.id = LC.buyer_id
// 	INNER JOIN lc_orders AS LCO ON LCO.lc_master_id = LC.id
// 	INNER JOIN lc_shipments AS LCS ON LCS.lc_order_id = LCO.id
// 	INNER JOIN ORDER_DETAILS AS OD ON OD.SHIPMENT_ID = LCS.shipment_details_id
// GROUP BY B.ID, LC.ID
// ;
