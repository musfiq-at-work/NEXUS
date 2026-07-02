// SELECT 
// 	B.buyer_name,
// 	F.NAME AS FACTORY_NAME,
// 	T.TEAM_NAME AS TEAM_NAME,
// 	SUM(SID.quantity) AS QUANTITY,
// 	SUM(SID.quantity * SD.FOB_RATE) AS RDL_VALUE,
// 	SUM(SID.quantity * COALESCE(FSD.FACTORY_RATE, 1)) AS FACTORY_VALUE,
// 	SUM(SID.quantity * SD.FOB_RATE) - SUM(SID.quantity * COALESCE(FSD.FACTORY_RATE, 1)) AS COMMISSION_VALUE
// FROM BUYER_ORDERS AS BO
// 	INNER JOIN ORDER_STYLES AS OS ON OS.ORDER_ID = BO.ID
// 	INNER JOIN buyers AS B ON B.id = BO.buyer_id
// 	INNER JOIN factories AS F ON F.id = BO.factory_id
// 	INNER JOIN teams AS T ON T.id = BO.team_id
// 	INNER JOIN shipment_details AS SD ON SD.order_style_id = OS.id
// 	INNER JOIN shipment_item_details AS SID ON SID.shipment_detail_id = SD.id
// 	INNER JOIN factory_shipment_details AS FSD ON FSD.shipment_detail_id = SD.id
// -- WHERE FSD.exfactory_date BETWEEN '2025-01-01' AND '2025-12-31'
// WHERE SD.handover_date BETWEEN '2025-01-01' AND '2025-12-31'
// -- WHERE SD.etd_date BETWEEN '2025-01-01' AND '2025-12-31'
// 	AND B.ID IN (9, 3)
// 	AND F.ID IN (8, 1)
// 	AND OS.product_type_id IN (3, 2, 1)
// 	AND T.ID IN (11, 12, 20)
// 	AND BO.BRAND_ID IN (41, 43, 45)
// 	AND BO.DEPARTMENT_ID IN (67, 62, 59)
// GROUP BY B.ID, F.ID, T.ID
// ;