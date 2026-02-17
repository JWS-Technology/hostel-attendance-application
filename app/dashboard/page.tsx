"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import axios from "axios";

export default function DashboardRedirect() {
    const router = useRouter();

    useEffect(() => {
        const resolveRole = async () => {
            try {
                // Fetch the source of truth from the server
                const res = await axios.get("/api/auth/me");
                const { role } = res.data.user;

                if (role === "AD") router.replace("/ad/dashboard");
                else if (role === "STUDENT") router.replace("/student/dashboard");
                else router.replace("/login");
            } catch (err) {
                router.replace("/login");
            }
        };
        resolveRole();
    }, [router]);

    return (
        <div className="flex h-screen items-center justify-center bg-[#f8fafc]">
            <Loader2 className="h-10 w-10 animate-spin text-slate-900" />
        </div>
    );
}