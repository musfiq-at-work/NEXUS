"use client";

import { useRouter } from "next/navigation";

const UnauthorizedPage = () => {
    const router = useRouter();

    return (
        <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-br from-red-100 via-white to-red-100 p-6">
            {/* Background Blobs */}
            <div className="absolute -left-32 -top-32 h-96 w-96 rounded-full bg-red-300/30 blur-3xl" />
            <div className="absolute -bottom-32 -right-32 h-96 w-96 rounded-full bg-red-400/20 blur-3xl" />

            <div className="relative w-full max-w-md rounded-3xl p-10 text-center backdrop-blur-md">
                {/* CSS Lock Icon */}
                <div className="mb-6">
                    <div className="inline-block rounded-2xl border-4 border-red-600 px-6 py-4 rotate-[-3deg]">
                        <h1
                            className="text-7xl font-black uppercase tracking-wider text-red-600 md:text-6xl"
                            style={{
                                textShadow: `
                                    2px 2px 0 rgba(220,38,38,0.15),
                                    -1px -1px 0 rgba(220,38,38,0.1)
                                `,
                            }}
                        >
                            ACCESS
                        </h1>

                        <h1
                            className="text-7xl font-black uppercase tracking-wider text-red-600 md:text-6xl"
                            style={{
                                textShadow: `
                                    2px 2px 0 rgba(220,38,38,0.15),
                                    -1px -1px 0 rgba(220,38,38,0.1)
                                `,
                            }}
                        >
                            DENIED
                        </h1>
                    </div>
                </div>

                <div className="mt-6 inline-flex rounded-full bg-red-100 px-4 py-1 text-sm font-semibold text-red-700">
                    403 Forbidden
                </div>

                <h1 className="mt-5 text-3xl font-bold tracking-tight text-slate-900">
                    Access Denied
                </h1>

                <p className="mt-3 text-sm leading-6 text-slate-600">
                    You don't have permission to view this page. Please contact
                    go back to the previous page or return to the homepage.
                </p>

                <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                    <button
                        onClick={() => router.back()}
                        className="flex-1 cursor-pointer rounded-xl bg-primary px-5 py-3 font-medium text-white transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg"
                    >
                        ← Go Back
                    </button>

                    <button
                        onClick={() => router.push("/")}
                        className="flex-1 cursor-pointer rounded-xl border border-slate-300 bg-white px-5 py-3 font-medium text-slate-700 transition-all duration-200 hover:bg-slate-50"
                    >
                        Home
                    </button>
                </div>
            </div>
        </div>
    );
};

export default UnauthorizedPage;