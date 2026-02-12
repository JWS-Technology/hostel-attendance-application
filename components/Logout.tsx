"use client";

import { LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import axios from "axios";

export default function LogoutButton() {
    const router = useRouter();

    const handleLogout = async () => {
        try {
            await axios.post("/api/auth/logout");
            // Since we don't use localStorage, we just redirect
            router.replace("/login");
        } catch (err) {
            console.error("Logout failed");
            // Force redirect anyway
            router.replace("/login");
        }
    };

    return (
        <button
            onClick={handleLogout}
            className="flex items-center px-4 py-2 text-sm font-bold text-red-600 bg-red-50 rounded-xl hover:bg-red-100 transition-all border border-red-100 uppercase tracking-tighter"
        >
            <LogOut className="w-4 h-4 mr-2" />
            Logout
        </button>
    );
}