'use client';

import { Heading } from "~/components";
import styles from "./page.module.css";

const DashboardPage = () => {
    return (
        <section className="flex min-h-[calc(100dvh-0.5rem)] flex-col pb-10 pt-4">
            <Heading>Dashboard</Heading>

            <div className="flex flex-1 items-center justify-center px-2 py-10 sm:px-8">
                <section
                    aria-labelledby="dashboard-welcome-heading"
                    className={`${styles.banner} relative isolate flex min-h-80 w-full max-w-6xl flex-col items-center justify-center overflow-hidden rounded-3xl border border-primary/20 bg-linear-to-br from-primary via-primary-dark to-secondary px-6 py-14 text-center shadow-xl shadow-primary/15 sm:min-h-96 sm:px-12 sm:py-16`}
                >
                    <div className="pointer-events-none absolute inset-0 -z-10" aria-hidden="true">
                        <div className={`${styles.orb} absolute -left-24 -top-32 size-80 rounded-full border border-white/15 bg-white/5`} />
                        <div className={`${styles.orb} ${styles.orbSecondary} absolute -bottom-40 -right-20 size-96 rounded-full border border-white/15 bg-white/5`} />
                        <div className="absolute -right-8 -top-40 size-96 rounded-full border border-white/10" />
                    </div>

                    <div className="flex size-16 items-center justify-center rounded-2xl border border-white/20 bg-white/10 text-white shadow-lg shadow-primary-dark/10 sm:size-20" aria-hidden="true">
                        <svg viewBox="0 0 48 48" fill="none" className="size-10 sm:size-12">
                            <circle cx="24" cy="24" r="4.1" fill="currentColor" />
                            <g stroke="currentColor" strokeWidth="2">
                                <ellipse cx="24" cy="24" rx="22" ry="8.4" />
                                <ellipse cx="24" cy="24" rx="22" ry="8.4" transform="rotate(60 24 24)" />
                                <ellipse cx="24" cy="24" rx="22" ry="8.4" transform="rotate(120 24 24)" />
                            </g>
                        </svg>
                    </div>

                    <h2 id="dashboard-welcome-heading" className="mt-6 font-rajdhani font-semibold text-white">
                        <span className="block text-xl font-medium tracking-widest sm:text-2xl">Welcome to</span>
                        <span className="mt-1 block text-5xl tracking-wide sm:text-7xl lg:text-8xl">RDL Nexus</span>
                    </h2>

                    <div className="my-5 h-1 w-12 rounded-full bg-secondary-light" aria-hidden="true" />

                    <p className="text-xs font-medium tracking-widest text-white/80 sm:text-sm">
                        Renaissance Designs Limited
                    </p>
                </section>
            </div>
        </section>
    );
};
export default DashboardPage;
