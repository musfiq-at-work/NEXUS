'use client';

import { Wrapper } from "~/components";

const DashboardPage = () => {
    return (
        <Wrapper heading='Dashboard'>
            <div className="relative overflow-hidden rounded-md border border-amber-200 bg-amber-50 px-5 py-4">
                <div className="absolute inset-y-0 left-0 w-2 bg-warning" />

                <div className="flex items-center gap-4">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-amber-100 text-xl">
                        🚧
                    </div>

                    <div className="min-w-0">
                        <div className="flex items-center gap-2">
                            <h3 className="font-semibold text-amber-900">
                                Work in Progress
                            </h3>

                            <span className="relative flex h-2 w-2">
                                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-warning opacity-75" />
                                <span className="relative inline-flex h-2 w-2 rounded-full bg-amber-500" />
                            </span>
                        </div>

                        <p className="mt-0.5 text-sm text-amber-800/80">
                            This section is currently under development.
                        </p>
                    </div>
                </div>
            </div>
        </Wrapper>
    );
};
export default DashboardPage;