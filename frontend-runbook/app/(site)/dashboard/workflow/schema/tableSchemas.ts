/* -------------------- core types -------------------- */

export type ColumnType =
    | "string"
    | "number"
    | "date"
    | "enum"
    | "boolean";

export interface TableColumn {
    name: string;
    type: ColumnType;
    operators: ("=" | "!=" | ">" | "<" | ">=" | "<=" | "IN")[];
    updatable?: boolean; // used by Data Update node
}

export interface TableSchema {
    tableName: string;
    primaryKey: string;
    columns: TableColumn[];
}

/* -------------------- schemas -------------------- */

export const TABLE_SCHEMAS: Record<string, TableSchema> = {
    Orders_db: {
        tableName: "Orders_db",
        primaryKey: "Order_ID",
        columns: [
            { name: "Order_ID", type: "string", operators: ["="] },
            { name: "Material_ID", type: "string", operators: ["="] },
            { name: "Material", type: "string", operators: ["="] },
            { name: "Quantity", type: "number", operators: [">", "<", "="] },
            { name: "Price", type: "number", operators: [">", "<"] },
            { name: "Source", type: "string", operators: ["="] },
            { name: "Destination", type: "string", operators: ["="] },
            { name: "Customer", type: "string", operators: ["="] },
            { name: "Supplier", type: "string", operators: ["="] },
            { name: "Due_Date", type: "date", operators: [">", "<"] },
            {
                name: "Priority",
                type: "enum",
                operators: ["="],
                updatable: true,
            },
            {
                name: "State",
                type: "enum",
                operators: ["="],
                updatable: true,
            },
            {
                name: "Supplier_accept",
                type: "boolean",
                operators: ["="],
                updatable: true,
            },
        ],
    },

    Inventory_DB: {
        tableName: "Inventory_DB",
        primaryKey: "Material_ID",
        columns: [
            { name: "Material_ID", type: "string", operators: ["="] },
            { name: "HS_number", type: "string", operators: ["="] },
            { name: "Material", type: "string", operators: ["="] },
            { name: "Supplier", type: "string", operators: ["="] },
            { name: "Quantity_In_Transit", type: "number", operators: [">", "<"] },
            { name: "Quantity_Required", type: "number", operators: [">", "<"] },
            { name: "Quantity_Ordered", type: "number", operators: [">", "<"] },
            { name: "Total_Quantity_Needed", type: "number", operators: [">", "<"] },
            { name: "Total_Available_Quantity", type: "number", operators: [">", "<"] },
            {
                name: "Material_Availability",
                type: "enum",
                operators: ["="],
                updatable: true,
            },
        ],
    },

    Shipment_db: {
        tableName: "Shipment_db",
        primaryKey: "Shipment_ID",
        columns: [
            { name: "Shipment_ID", type: "string", operators: ["="] },
            { name: "Material_ID", type: "string", operators: ["="] },
            { name: "Material", type: "string", operators: ["="] },
            { name: "Source", type: "string", operators: ["="] },
            { name: "Destination", type: "string", operators: ["="] },
            { name: "Customer", type: "string", operators: ["="] },
            { name: "Supplier", type: "string", operators: ["="] },
            { name: "Due_Date", type: "date", operators: [">", "<"] },
            {
                name: "Priority",
                type: "enum",
                operators: ["="],
                updatable: true,
            },
            {
                name: "State",
                type: "enum",
                operators: ["="],
                updatable: true,
            },
            { name: "Turn_Around_Time", type: "number", operators: [">"] },
        ],
    },

    GlobalTrade_DB: {
        tableName: "GlobalTrade_DB",
        primaryKey: "Material_ID",
        columns: [
            { name: "Material_ID", type: "string", operators: ["="] },
            { name: "HS_number", type: "string", operators: ["="] },
            { name: "Material", type: "string", operators: ["="] },
            { name: "Supplier", type: "string", operators: ["="] },
            { name: "Tariff", type: "number", operators: [">", "<"] },
            {
                name: "Supplier_Restricted",
                type: "boolean",
                operators: ["="],
            },
        ],
    },
};
