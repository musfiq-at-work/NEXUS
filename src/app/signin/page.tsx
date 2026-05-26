"use client";
import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { api } from "~/trpc/react";
import { Heading, TextField, Button } from "~/components";
import { Loader } from "~/components";
import { useRouter } from "next/navigation";
import { useDecodedUser } from "~/hooks/useDecodedUser";
import { toast } from "sonner";
import { parseTRPCError } from "~/utils/parseTRPCError";
import { ADMIN_DEPARTMENT_ID, ADMIN_LEVEL_ID } from "~/utils/config";
import { useAdminStore } from "~/store";

const formSchema = z.object({
  name: z.string().min(4, "Name must be at least 4 characters long"),
  password: z.string().min(3, "Password must be at least 3 characters long"),
});

type FormValues = z.infer<typeof formSchema>;

type Error = {
    name?: {message?: string}
    password?: {message?: string}
}

const SignInPage = () => {
    const router = useRouter();

    const [errors, setErrors] = useState<Error>({name: {}, password: {}});
    const [clicked, setClicked] = useState(false);
    
    // Form setup
    const { register, handleSubmit, formState: { errors: validationError } } = useForm<FormValues>({
        resolver: zodResolver(formSchema),
    });

    // Redirect if already signed in
    const { user } = useDecodedUser();

    const setIsAdmin = useAdminStore((state) => state.setIsAdmin);

    useEffect(() => {
        if (!!user) {
            router.push("/dashboard");
        }
    }, [user]);

    // Sign in mutation
    const signInMutation = api.auth.login.useMutation({
        onSuccess: (data) => {
            localStorage.setItem("token", data.token);
            const deptId = Array.isArray(data.user?.departments)
                ? Number(data.user?.departments[0]?.id)
                : Number(data.user?.departments?.id);
            const levelId = Array.isArray(data.user?.levels)
                ? Number(data.user?.levels[0]?.id)
                : Number(data.user?.levels?.id);
            const isAdmin = deptId === ADMIN_DEPARTMENT_ID && levelId === ADMIN_LEVEL_ID;
            setIsAdmin(isAdmin);
            router.push("/dashboard");
        },
        onError: (error) => {
            setErrors(prev => {
                const newErrors = {...prev};
                if (error.data?.code === "NOT_FOUND") {
                    newErrors.name = { message: error.message };
                }
                if (error.data?.code === "UNAUTHORIZED") {
                    newErrors.password = { message: error.message };
                }
                return newErrors;
            });
        },
    });
        
    const onSubmit = async (data: FormValues) => {
        setClicked(true);
        setErrors({name: {}, password: {}}); // Clear previous errors
        try {
            await signInMutation.mutateAsync({
                user_id: data.name,
                password: data.password,
            });
        } catch (error) {
            const parsedError = parseTRPCError(error);
            toast.error(`Error: ${parsedError}`);
        } finally {
            setClicked(false);
        }
    };

    return (
        <div className="flex login-gradient h-[100vh] justify-center items-center">
            <div className="flex-1 items-start h-full">
                <img  src="./nexus_T.png" alt="Logo" />
            </div>
            <div className="flex-1 flex justify-center items-center rounded-lg shadow-lg">
                <div className="bg-background w-full max-w-xl px-8 py-6 rounded-lg emboss-inner">
                    <Heading className="text-center font-rajdhani tracking-wide">RDL-NEXUS</Heading>
                    <Heading as='h3' className="text-center font-rajdhani">Sign In</Heading>
                    {!clicked ? (
                        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col">
                            <TextField {...register("name")} 
                                label="Name" 
                                placeholder="User ID" 
                                type="text" 
                                error={validationError.name?.message ?? errors.name?.message}
                            />
                            <TextField {...register("password")} 
                                label="Password" 
                                type="password" 
                                error={validationError.password?.message ?? errors.password?.message} 
                                placeholder="At least 6 characters long"
                            />
                            <Button type="submit" 
                                label="Sign In" 
                                className="font-rajdhani font-semibold text-lg tracking-wide mt-6"
                                disabled={clicked}
                            />
                        </form>
                    ) : (
                        <Loader />
                    )}
                    <Heading as='h3' className="text-center font-rajdhani mt-2">Renaissance Designs Limited</Heading>
                </div>
            </div>
        </div>
    );
};

export default SignInPage;
