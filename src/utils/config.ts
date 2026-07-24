// TNA action ids
export const ETD_DATE_DB_ID = 41;
export const HANDOVER_DATE_DB_ID = 40;
export const FACTORY_INVOICE = 42;
export const ACTUAL_EXFACTORY_DATE = 6;
export const DOC_SUBMIT_TO_CUSTOMER = 44;
export const PROCEED_DATE = 20;

// level ids
export const ADMIN_LEVEL_ID = 5;

// Department Ids
export const MERCHANDISING_DEPARTMENT_ID = 1;
export const COMMERCIAL_DEPARTMENT_ID = 2;
export const ACCOUNTING_DEPARTMENT_ID = 3;
export const QUALITY_DEPARTMENT_ID = 4;
export const ADMIN_DEPARTMENT_ID = 5;
export const COMPLIANCE_DEPARTMENT_ID = 6;

// urls
export const baseUrl = process.env.NODE_ENV === 'production' ? "http://rdlerp.rgbd.local:60005" : "http://localhost:4000";