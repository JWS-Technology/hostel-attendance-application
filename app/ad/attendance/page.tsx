"use client";

import { useEffect, useState, useCallback } from "react";
import {
    Loader2,
    CheckCircle,
    XCircle,
    AlertCircle,
    Save,
    LayoutDashboard,
    UserCircle,
} from "lucide-react";
import { useRouter } from "next/navigation";
import axios from "axios";
import LogoutButton from "@/components/Logout";

type Student = {
    _id: string;
    name: string;
    registerNo: string;
    accountNo: number;
    block: string;
    roomNo: string;
    status: "PRESENT" | "ABSENT" | "ON_LEAVE";
};

export default function AttendancePage() {
    const [students, setStudents] = useState<Student[]>([]);
    const [currentUser, setCurrentUser] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const router = useRouter();

    // Sort rooms numerically first, then lexicographically
    const sortRooms = (a: string, b: string) => {
        const na = parseInt(a);
        const nb = parseInt(b);
        if (!isNaN(na) && !isNaN(nb)) return na - nb;
        return a.localeCompare(b);
    };

    const initializeDashboard = useCallback(async () => {
        try {
            // 1. Validate session
            const meRes = await axios.get("/api/auth/me");
            const user = meRes.data.user;
            setCurrentUser(user);

            // 2. Fetch assigned students (server derives AD identity)
            const res = await axios.get("/api/attendance/fetch-list");

            const sorted = res.data.data.sort((a: any, b: any) =>
                sortRooms(a.roomNo, b.roomNo),
            );

            setStudents(
                sorted.map((s: any) => ({
                    ...s,
                    status: s.initialStatus,
                })),
            );
        } catch (err) {
            console.error("Session invalid or fetch failed", err);
            router.replace("/login");
        } finally {
            setIsLoading(false);
        }
    }, [router]);

    useEffect(() => {
        initializeDashboard();
    }, [initializeDashboard]);

    const setStatus = (
        id: string,
        status: "PRESENT" | "ABSENT" | "ON_LEAVE",
    ) => {
        setStudents((prev) =>
            prev.map((s) => (s._id === id ? { ...s, status } : s)),
        );
    };

    const handleSubmit = async () => {
        if (students.length === 0 || isSubmitting) return;
        setIsSubmitting(true);

        try {
            const records = students.map((s) => ({
                studentId: s._id,
                accountNo: s.accountNo,
                name: s.name,
                status: s.status,
            }));

            await axios.post("/api/attendance/submit", { records });

            alert("Attendance submitted successfully");
            router.refresh();
        } catch (err: any) {
            alert(
                err.response?.data?.message ||
                "Submission failed. Please try again.",
            );
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isLoading) {
        return (
            <div className="flex h-screen items-center justify-center bg-[#f8fafc]">
                <div className="text-center">
                    <Loader2 className="h-10 w-10 animate-spin text-slate-900 mx-auto mb-4" />
                    <p className="text-slate-600 font-bold">
                        Authenticating session…
                    </p>
                </div>
            </div>
        );
    }

    const blockName = students[0]?.block;

    return (
        <div className="min-h-screen bg-[#f8fafc] pb-12 text-slate-900 font-sans">
            {/* NAV */}
            <nav className="bg-white border-b border-slate-200 px-8 py-4 flex justify-between items-center sticky top-0 z-50 shadow-sm">
                <div className="flex items-center font-black text-xl uppercase">
                    <LayoutDashboard className="w-6 h-6 mr-2 text-blue-600" />
                    Hostel Portal
                </div>
                <div className="flex items-center space-x-6">
                    <div className="flex items-center bg-slate-100 px-4 py-1.5 rounded-full border">
                        <UserCircle className="w-4 h-4 mr-2 text-slate-500" />
                        <span className="text-xs font-bold">
                            {currentUser?.name || "AD"}
                        </span>
                    </div>
                    <LogoutButton />
                </div>
            </nav>

            {/* CONTENT */}
            <div className="max-w-5xl mx-auto px-6 mt-8">
                <div className="flex justify-between items-end mb-10">
                    <div>
                        <h1 className="text-4xl font-black italic uppercase">
                            Mark Attendance
                        </h1>
                        <p className="text-xs font-bold text-slate-500 mt-1 uppercase">
                            Block {blockName}
                        </p>
                    </div>
                    <button
                        onClick={handleSubmit}
                        disabled={isSubmitting}
                        className="bg-slate-900 text-white px-10 py-4 rounded-xl font-black uppercase flex items-center disabled:opacity-30"
                    >
                        {isSubmitting ? (
                            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                        ) : (
                            <Save className="mr-2 h-5 w-5" />
                        )}
                        {isSubmitting ? "Submitting…" : "Submit"}
                    </button>
                </div>

                {/* TABLE */}
                <div className="bg-white rounded-3xl shadow-xl border overflow-hidden">
                    <table className="w-full">
                        <thead className="bg-slate-50 border-b">
                            <tr>
                                <th className="px-8 py-5 text-xs text-left">Room</th>
                                <th className="px-8 py-5 text-xs text-left">Student</th>
                                <th className="px-8 py-5 text-xs text-right">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {students.map((student) => {
                                // Check if the student was auto-marked as leave based on an approved request
                                const isAutoLeave = student.status === "ON_LEAVE";

                                return (
                                    <tr
                                        key={student._id}
                                        className={`transition-colors ${isAutoLeave ? "bg-amber-50/50" : "hover:bg-slate-50"}`}
                                    >
                                        <td className="px-8 py-6">
                                            <span className="font-black text-slate-900 text-xl tracking-tighter">
                                                {student.roomNo}
                                            </span>
                                        </td>
                                        <td className="px-8 py-6">
                                            <div className="flex items-center">
                                                <div className="font-black text-slate-900 uppercase tracking-tight text-sm">
                                                    {student.name}
                                                </div>
                                                {isAutoLeave && (
                                                    <span className="ml-3 px-2 py-0.5 bg-amber-100 text-amber-700 border border-amber-200 rounded-md text-[9px] font-black uppercase tracking-widest">
                                                        Approved Leave
                                                    </span>
                                                )}
                                            </div>
                                            <div className="text-[10px] font-bold text-slate-400 mt-0.5 tracking-widest">
                                                {student.registerNo}
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <div className="flex justify-end gap-2">
                                                {[
                                                    { k: "PRESENT", i: CheckCircle, activeClass: "bg-slate-900 border-slate-900 text-white" },
                                                    { k: "ABSENT", i: XCircle, activeClass: "bg-red-600 border-red-600 text-white shadow-red-100" },
                                                    { k: "ON_LEAVE", i: AlertCircle, activeClass: "bg-amber-500 border-amber-500 text-white shadow-amber-100" },
                                                ].map(({ k, i: Icon, activeClass }) => {
                                                    const isActive = student.status === k;

                                                    // NEW LOGIC: If student is ON_LEAVE, disable the other two buttons
                                                    const isDisabled = isAutoLeave && k !== "ON_LEAVE";

                                                    return (
                                                        <button
                                                            key={k}
                                                            onClick={() => !isDisabled && setStatus(student._id, k as any)}
                                                            disabled={isDisabled}
                                                            className={`
                    px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center border-2 transition-all
                    ${isActive
                                                                    ? `${activeClass} shadow-lg scale-105`
                                                                    : "bg-white text-slate-400 border-slate-100 hover:border-slate-300"
                                                                }
                    ${isDisabled ? "opacity-20 cursor-not-allowed border-transparent grayscale" : ""}
                  `}
                                                        >
                                                            <Icon className={`w-3 h-3 mr-2 ${isActive ? 'text-white' : ''}`} />
                                                            {k.replace("_", " ")}
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
