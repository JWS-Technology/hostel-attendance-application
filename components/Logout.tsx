"use client";

import { LogOut } from "lucide-react";
import { useRouter } from "next/navigation";

export default function LogoutButton() {
    const router = useRouter();

    const handleLogout = () => {
        // 1. Clear all authentication data
        localStorage.removeItem("token");
        localStorage.removeItem("user");

        // Optional: If you want to wipe EVERYTHING in local storage
        // localStorage.clear(); 

        // 2. Redirect to the login screen
        // We use .replace() instead of .push() so the user can't hit the 
        // browser "Back" button to return to the protected dashboard
        router.replace("/login");
    };

    return (
        <button
            onClick={handleLogout}
            className="flex items-center px-4 py-2 text-sm font-medium text-red-600 bg-red-50 border border-red-100 rounded-lg hover:bg-red-100 hover:text-red-700 transition-colors"
            title="Securely log out"
        >
            <LogOut className="w-4 h-4 mr-2" />
            Logout
        </button>
    );
}