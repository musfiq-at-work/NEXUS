/**
 * @description
 * This file defines the column configuration for the factory invoice table in the commercial module of the application. 
 * Each column is represented as an object with properties such as 'key', 'label', and 'type'. 
 * The 'key' property corresponds to the data field, while the 'label' property is the display name for the column header. 
 * The 'type' property indicates the type of data in the column, which can be used for formatting purposes (e.g., date formatting for 'invoice_date').
 * The 'actions' column is designated for action buttons (e.g., edit, delete) and does not correspond to a specific data field.
 * This configuration allows for easy management and rendering of the table columns in the user interface.
 */
export const tableHeaders= [
    { key: 'factory_name', label: 'Factory Name' },
    { key: 'buyer_name', label: 'Buyer Name' },
    { key: 'invoice_no', label: 'Invoice No' },
    { key: 'invoice_date', label: 'Invoice Date', type: 'date' },
    { key: 'value', label: 'Value' },
    { key: 'actions', label: '', type: 'action' }
]