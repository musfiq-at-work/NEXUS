import type { JsonValue } from "@prisma/client/runtime/client";
import React from "react";
import { formatDateTime } from "~/utils/localDateString";

interface ErrorLog {
    full_name: string;
    user_id: string;
    request_id: string;
    created_at: Date;
    procedure_name: string;
    request_method: string;
    ip_address: string | null;
    user_agent: string | null;
    referer: string | null;
    input_data: JsonValue;
    error_name: string;
    error_code: string | null;
}

type ErrorCardProps = {
    error: ErrorLog;
};

const errorCodes: Record<string, string> = {
    'P2000': 'BAD_REQUEST',
    'P2002': 'DUPLICATE EXISTS',
    'P2003': 'REFERENCED ELSEWHERE / NOT EXISTS',
    'P2025': 'NOT_FOUND',
}

export default function ErrorCard({ error }: ErrorCardProps) {
    return (
        <div className="overflow-hidden rounded-xl border border-red-200 bg-white shadow mb-4 m-2">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-red-200 bg-red-50 px-6 py-4">
                <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-100 text-2xl">
                        ⁉️
                    </div>

                    <div>
                        <h2 className="text-lg font-semibold text-red-700">
                            {error.error_name}
                        </h2>

                        <div className="mt-1 flex items-center gap-2">
                            <span className="rounded bg-blue-100 px-2 py-1 text-xs font-semibold text-blue-700">
                                {error.request_method}
                            </span>

                            <span className="rounded bg-red-100 px-2 py-1 text-xs font-semibold text-red-700">
                                {error.error_code}
                            </span>

                            <span className="rounded bg-yellow-100 px-2 py-1 text-xs font-semibold text-yellow-700">
                                {error.error_code ? errorCodes[error.error_code] : "UNKNOWN"}
                            </span>
                        </div>
                    </div>
                </div>

                <span className="text-sm text-gray-500">
                    {formatDateTime(new Date(error.created_at))}
                </span>
            </div>

            {/* Details */}
            <div className="grid gap-6 p-6 md:grid-cols-2">
                <InfoRow label="User" value={error.full_name} />
                <InfoRow label="User ID" value={error.user_id} />
                <InfoRow label="Request ID" value={error.request_id} />
                <InfoRow label="IP Address" value={error.ip_address} />
                <InfoRow label="Procedure" value={error.procedure_name} code />
                <InfoRow label="Referer" value={error.referer} />
            </div>

            {/* Input Data */}
            <Section title="Input Data">
                <pre className="overflow-x-auto rounded-lg bg-gray-900 p-4 text-sm text-green-400">
                    {JSON.stringify(error.input_data, null, 2)}
                </pre>
            </Section>

            {/* User Agent */}
            <Section title="User Agent">
                <div className="rounded-lg bg-gray-100 p-4 text-sm break-all text-gray-700">
                    {error.user_agent}
                </div>
            </Section>
        </div>
    );
}

type InfoRowProps = {
    label: string;
    value: React.ReactNode;
    code?: boolean;
};

function InfoRow({ label, value, code }: InfoRowProps) {
    return (
        <div>
            <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-gray-500">
                {label}
            </p>

            {code ? (
                <code className="block break-all rounded bg-gray-100 px-3 py-2 text-sm text-gray-800">
                    {value}
                </code>
            ) : (
                <div className="break-all text-sm text-gray-800">
                    {value}
                </div>
            )}
        </div>
    );
}

type SectionProps = {
    title: string;
    children: React.ReactNode;
};

function Section({ title, children }: SectionProps) {
    return (
        <div className="border-t border-gray-200 p-6">
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-gray-600">
                {title}
            </h3>

            {children}
        </div>
    );
}