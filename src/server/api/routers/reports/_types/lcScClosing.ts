export interface LcScClosingHeader {
    lc_no: string;
    buyer_name: string;
    order_quantity: number;
    value: number;
    secondary_value: number;
    symbol: string;
}

export interface LcScTableData {
    min_exfactory_date: Date;
    max_exfactory_date: Date;
    export_invoice_quantity: number;
    rdl_export_value: number;
    rdl_export_value_usd: number;
    factory_export_value: number;
    symbol: string;
    debit_note: string;
    realized_amount: number;
    factory_paid_amount: number;
}