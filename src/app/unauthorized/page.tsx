"use client";
import Image from "next/image";
import { unauthorizedImage } from "~/assets";

const UnauthorizedPage = () => {
    return (
        <div className="flex flex-col items-center bg-white justify-center min-h-screen">
            <Image width={20} height={20} src={unauthorizedImage.src} alt="Unauthorized Access" />
            <p className="text-lg mt-4 text-red">You do not have permission to access this page.</p>
            <button onClick={() => window.history.go(-2)} 
                className="mt-6 px-4 py-2 bg-primary text-white rounded hover:bg-primary-accent cursor-pointer"
            >
                Go back to Previous Page
            </button>
        </div>
    );
};

export default UnauthorizedPage;