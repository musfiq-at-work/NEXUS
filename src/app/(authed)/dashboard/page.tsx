'use client';

import { Great_Vibes } from "next/font/google";
import { Heading } from "~/components";
import styles from "./page.module.css";

const welcomeFont = Great_Vibes({
    subsets: ["latin"],
    weight: "400",
    display: "swap",
});

const DashboardPage = () => {
    return (
        <section className="flex min-h-[calc(100dvh-0.5rem)] flex-col pb-10 pt-4">
            <Heading>Dashboard</Heading>

            <div className="flex flex-1 items-center justify-center px-2 py-10 sm:px-8">
                <section
                    aria-labelledby="dashboard-welcome-heading"
                    className={`${styles.banner} relative isolate flex min-h-80 w-full max-w-6xl flex-col items-center justify-center overflow-hidden rounded-3xl border border-black/5 bg-stone-50 px-6 py-14 text-center shadow-lg shadow-black/5 sm:min-h-96 sm:px-12 sm:py-16`}
                >
                    <div className="pointer-events-none absolute inset-0 -z-10" aria-hidden="true">
                        <div className={`${styles.orb} absolute -left-24 -top-32 size-75 rounded-full border border-black/5 bg-white/50`} />
                        <div className={`${styles.orb} ${styles.orbSecondary} absolute -bottom-30 -right-10 size-70 rounded-full border border-black/5 bg-white/50`} />
                    </div>

                    <h2 id="dashboard-welcome-heading" className="mt-6 flex w-full flex-col items-center text-black">
                        <span className={`${welcomeFont.className} ${styles.welcomeScript} relative inline-block font-normal`}>
                            Welcome
                            <svg
                                viewBox="0 0 360 60"
                                fill="currentColor"
                                className="pointer-events-none absolute -bottom-2 left-[19%] h-auto w-[78%] overflow-visible"
                                aria-hidden="true"
                            >
                                <path d="M7 25C24 49 80 36 152 18C209 4 271-6 311 8C335 16 341 32 331 42C323 50 306 47 299 35C292 23 296 6 299-3C302 13 304 31 312 36C321 43 334 37 329 28C321 12 292 11 265 13C215 16 171 30 125 39C76 49 20 57 7 25Z" />
                            </svg>
                        </span>
                        <span className="mt-6 block font-rajdhani text-xl font-medium leading-none sm:mt-8 sm:text-2xl">to</span>
                        <span className="mt-3 block font-rajdhani text-3xl font-semibold tracking-wide sm:mt-4 sm:text-5xl lg:text-6xl">RDL NEXUS</span>
                    </h2>

                    <p className="mt-5 text-xs font-medium tracking-widest text-black sm:mt-6 sm:text-sm">
                        Renaissance Designs Limited
                    </p>
                </section>
            </div>
        </section>
    );
};
export default DashboardPage;
