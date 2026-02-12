"use client";

import { useEffect, useState, useCallback } from "react";
import { Loader2, CheckCircle, XCircle, AlertCircle, Save, LayoutDashboard, UserCircle } from "lucide-react";
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

    // Helper: Sort room numbers (Numbers 1, 2, 3... then "Beschi Hall" etc.)
    const sortRooms = (a: string, b: string) => {
        const numA = parseInt(a);
        const numB = parseInt(b);
        if (!isNaN(numA) && !isNaN(numB)) return numA - numB;
        return a.localeCompare(b);
    };

    const initializeDashboard = useCallback(async () => {
        try {
            // 1. Fetch stateless session from /api/auth/me (No localStorage)
            const meRes = await axios.get("/api/auth/me");
            const user = meRes.data.user;
            setCurrentUser(user);

            // 2. Fetch assigned students
            const res = await axios.get(`/api/attendance/fetch-list`, {
                params: { staffId: user.profileId },
            });

            // 3. Sort by room order before setting state
            const sortedData = res.data.data.sort((a: Student, b: Student) =>
                sortRooms(a.roomNo, b.roomNo)
            );

            const listWithStatus = sortedData.map((s: any) => ({
                ...s,
                status: "PRESENT",
            }));

            setStudents(listWithStatus);
        } catch (err) {
            console.error("Session invalid or fetch failed", err);
            router.replace("/login"); // Redirect if cookie is missing/expired
        } finally {
            setIsLoading(false);
        }
    }, [router]);

    useEffect(() => {
        initializeDashboard();
    }, [initializeDashboard]);

    const setStatus = (id: string, newStatus: "PRESENT" | "ABSENT" | "ON_LEAVE") => {
        setStudents((prev) =>
            prev.map((s) => (s._id === id ? { ...s, status: newStatus } : s))
        );
    };

    const handleSubmit = async () => {
        if (students.length === 0) return;
        setIsSubmitting(true);

        try {
            if (!currentUser?.id) throw new Error("Unauthorized");

            const recordsByBlock: Record<string, any[]> = {};
            students.forEach((s) => {
                if (!recordsByBlock[s.block]) recordsByBlock[s.block] = [];
                recordsByBlock[s.block].push({
                    studentId: s._id,
                    accountNo: s.accountNo,
                    name: s.name,
                    status: s.status,
                });
            });

            const today = new Date().toISOString();
            const submissionPromises = Object.keys(recordsByBlock).map((blockName) => {
                return axios.post("/api/attendance/submit", {
                    date: today,
                    block: blockName,
                    markedBy: currentUser.id,
                    records: recordsByBlock[blockName],
                });
            });

            await Promise.all(submissionPromises);
            alert("Attendance Submitted Successfully!");
            window.location.reload();
        } catch (err) {
            alert("Submission failed. Your session may have expired.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const studentsByBlock = students.reduce((acc, student) => {
        if (!acc[student.block]) acc[student.block] = [];
        acc[student.block].push(student);
        return acc;
    }, {} as Record<string, Student[]>);

    if (isLoading) {
        return (
            <div className="flex h-screen items-center justify-center bg-[#f8fafc]">
                <div className="text-center">
                    <Loader2 className="h-10 w-10 animate-spin text-slate-900 mx-auto mb-4" />
                    <p className="text-slate-600 font-bold tracking-tight">Authenticating Session...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#f8fafc] pb-12 text-slate-900 font-sans">
            <nav className="bg-white border-b border-slate-200 px-8 py-4 flex justify-between items-center sticky top-0 z-50 shadow-sm">
                <div className="flex items-center font-black text-xl tracking-tighter text-slate-900 uppercase">
                    <LayoutDashboard className="w-6 h-6 mr-2 text-blue-600" />
                    Hostel Portal
                </div>
                <div className="flex items-center space-x-6">
                    <div className="flex items-center bg-slate-100 px-4 py-1.5 rounded-full border border-slate-200">
                        <UserCircle className="w-4 h-4 mr-2 text-slate-500" />
                        <span className="text-xs font-bold text-slate-700">
                            {currentUser?.name || "AD Account"}
                        </span>
                    </div>
                    <LogoutButton />
                </div>
            </nav>

            <div className="max-w-5xl mx-auto px-6 mt-8">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-10 gap-4">
                    <div>
                        <h1 className="text-4xl font-black text-slate-900 tracking-tight italic uppercase">Mark Attendance</h1>
                        <p className="text-slate-500 font-bold text-sm mt-1 uppercase tracking-widest bg-white border border-slate-200 inline-block px-4 py-1.5 rounded-lg shadow-sm">
                            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                        </p>
                    </div>
                    <button
                        onClick={handleSubmit}
                        disabled={isSubmitting || students.length === 0}
                        className="w-full md:w-auto bg-slate-900 hover:bg-black text-white px-10 py-4 rounded-xl font-black uppercase tracking-tighter flex items-center justify-center disabled:opacity-30 transition-all shadow-xl hover:shadow-2xl"
                    >
                        {isSubmitting ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Save className="mr-2 h-5 w-5" />}
                        {isSubmitting ? "Syncing..." : "Submit Record"}
                    </button>
                </div>

                {Object.entries(studentsByBlock).map(([block, blockStudents]) => (
                    <div key={block} className="mb-12">
                        <h2 className="text-xs font-black text-slate-400 uppercase tracking-[0.3em] mb-4 ml-1">
                            Current Zone: Block {block}
                        </h2>

                        <div className="bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden">
                            <table className="w-full text-left border-collapse">
                                <thead className="bg-slate-50 border-b border-slate-200">
                                    <tr>
                                        <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Room</th>
                                        <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Student Information</th>
                                        <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Status Select</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {blockStudents.map((student) => (
                                        <tr key={student._id} className="hover:bg-slate-50 transition-colors group">
                                            <td className="px-8 py-6">
                                                <span className="font-black text-slate-900 text-xl tracking-tighter">{student.roomNo}</span>
                                            </td>
                                            <td className="px-8 py-6">
                                                <div className="font-black text-slate-900 uppercase tracking-tight text-sm">{student.name}</div>
                                                <div className="text-[10px] font-bold text-slate-400 mt-0.5 tracking-widest">{student.registerNo}</div>
                                            </td>
                                            <td className="px-8 py-6">
                                                <div className="flex justify-end gap-2">
                                                    {[
                                                        { label: "PRESENT", icon: CheckCircle, color: "green" },
                                                        { label: "ABSENT", icon: XCircle, color: "red" },
                                                        { label: "ON_LEAVE", icon: AlertCircle, color: "yellow" }
                                                    ].map((opt) => (
                                                        <button
                                                            key={opt.label}
                                                            onClick={() => setStatus(student._id, opt.label as any)}
                                                            className={`
                                                                flex items-center px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border-2
                                                                ${student.status === opt.label
                                                                    ? `bg-slate-900 text-white border-slate-900 shadow-lg scale-105`
                                                                    : `bg-white text-slate-400 border-slate-100 hover:border-slate-300`
                                                                }
                                                            `}
                                                        >
                                                            <opt.icon className={`w-3 h-3 mr-2 ${student.status === opt.label ? 'text-white' : ''}`} />
                                                            {opt.label.replace('_', ' ')}
                                                        </button>
                                                    ))}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}