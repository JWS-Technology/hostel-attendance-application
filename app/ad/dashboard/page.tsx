"use client";

import { useEffect, useState } from "react";
import { ClipboardCheck, FileText, Users, MapPin, LayoutDashboard } from "lucide-react";
import axios from "axios";
import LogoutButton from "@/components/Logout";

export default function ADDashboard() {
    const [user, setUser] = useState<any>(null);

    useEffect(() => {
        axios.get("/api/auth/me").then(res => setUser(res.data.user));
    }, []);

    return (
        <div className="min-h-screen bg-[#f8fafc] text-slate-900">
            <nav className="bg-white border-b border-slate-200 px-8 py-4 flex justify-between items-center shadow-sm">
                <div className="font-black text-xl uppercase tracking-tighter flex items-center">
                    <LayoutDashboard className="w-6 h-6 mr-2 text-blue-600" /> System: AD
                </div>
                <LogoutButton />
            </nav>

            <main className="max-w-5xl mx-auto px-6 py-12">
                <div className="mb-12">
                    <h1 className="text-5xl font-black italic uppercase tracking-tighter">AD Control</h1>
                    <p className="text-slate-500 font-bold mt-2 uppercase tracking-widest text-xs italic">
                        Authorized: {user?.name}
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <ActionCard
                        title="Night Attendance"
                        icon={<ClipboardCheck className="w-8 h-8" />}
                        href="/ad/attendance"
                        desc="Verify presence for assigned blocks."
                    />
                    <ActionCard
                        title="Leave Requests"
                        icon={<FileText className="w-8 h-8" />}
                        href="/ad/leaves"
                        desc="Approve or reject student out-passes."
                    />
                </div>
            </main>
        </div>
    );
}

function ActionCard({ title, icon, href, desc }: any) {
    return (
        <a href={href} className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm hover:shadow-2xl transition-all group">
            <div className="bg-slate-100 w-16 h-16 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-slate-900 group-hover:text-white transition-colors">
                {icon}
            </div>
            <h3 className="text-2xl font-black uppercase tracking-tighter mb-2">{title}</h3>
            <p className="text-slate-400 text-sm font-bold uppercase tracking-tight leading-relaxed">{desc}</p>
        </a>
    );
}