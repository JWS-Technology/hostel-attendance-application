"use client";

import { useEffect, useState } from "react";
import { Loader2, Calendar, CheckCircle, XCircle, AlertCircle, ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import axios from "axios";

type AttendanceRecord = {
    date: string;
    block: string;
    status: "PRESENT" | "ABSENT" | "ON_LEAVE" | "NOT_MARKED";
    remarks: string;
};

export default function StudentAttendancePage() {
    const [history, setHistory] = useState<AttendanceRecord[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        const fetchAttendance = async () => {
            try {
                // Verify session and fetch history
                const res = await axios.get("/api/student/attendance");
                setHistory(res.data.data);
            } catch (err) {
                console.error("Failed to fetch attendance");
                router.replace("/login");
            } finally {
                setIsLoading(false);
            }
        };
        fetchAttendance();
    }, [router]);

    if (isLoading) {
        return (
            <div className="flex h-screen items-center justify-center bg-slate-50">
                <Loader2 className="h-8 w-8 animate-spin text-slate-900" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#f8fafc] pb-12 font-sans text-slate-900">
            {/* Header Area */}
            <div className="bg-slate-900 text-white pt-12 pb-20 px-6">
                <div className="max-w-4xl mx-auto">
                    <Link href="/student/dashboard" className="inline-flex items-center text-slate-400 hover:text-white mb-6 transition-colors text-sm font-bold uppercase tracking-widest">
                        <ArrowLeft className="w-4 h-4 mr-2" /> Back to Dashboard
                    </Link>
                    <h1 className="text-4xl font-black italic uppercase tracking-tighter">My Attendance</h1>
                    <p className="text-slate-400 font-bold mt-2 uppercase tracking-widest text-xs">Official Record Presence History</p>
                </div>
            </div>

            {/* Stats Summary */}
            <div className="max-w-4xl mx-auto px-6 -mt-10">
                <div className="grid grid-cols-3 gap-4 mb-8">
                    <StatCard
                        label="Present"
                        count={history.filter(h => h.status === "PRESENT").length}
                        color="text-green-600"
                    />
                    <StatCard
                        label="Absent"
                        count={history.filter(h => h.status === "ABSENT").length}
                        color="text-red-600"
                    />
                    <StatCard
                        label="Leave"
                        count={history.filter(h => h.status === "ON_LEAVE").length}
                        color="text-yellow-600"
                    />
                </div>

                {/* List Section */}
                <div className="bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden">
                    {history.length === 0 ? (
                        <div className="p-20 text-center">
                            <Calendar className="w-12 h-12 text-slate-200 mx-auto mb-4" />
                            <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">No attendance records found yet</p>
                        </div>
                    ) : (
                        <div className="divide-y divide-slate-100">
                            {history.map((record, index) => (
                                <div key={index} className="p-6 flex items-center justify-between hover:bg-slate-50 transition-colors">
                                    <div className="flex items-center space-x-4">
                                        <div className="bg-slate-100 p-3 rounded-2xl">
                                            <Calendar className="w-5 h-5 text-slate-600" />
                                        </div>
                                        <div>
                                            <p className="font-black text-slate-900 uppercase tracking-tight">
                                                {new Date(record.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                            </p>
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-0.5">
                                                Zone: Block {record.block}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex flex-col items-end">
                                        <StatusBadge status={record.status} />
                                        {record.remarks && (
                                            <p className="text-[10px] text-slate-400 mt-2 italic">{record.remarks}</p>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

// UI Sub-components
function StatCard({ label, count, color }: { label: string, count: number, color: string }) {
    return (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm text-center">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">{label}</p>
            <p className={`text-3xl font-black tracking-tighter ${color}`}>{count}</p>
        </div>
    );
}

function StatusBadge({ status }: { status: string }) {
    const configs = {
        PRESENT: { color: "bg-green-100 text-green-800 border-green-200", icon: CheckCircle },
        ABSENT: { color: "bg-red-100 text-red-800 border-red-200", icon: XCircle },
        ON_LEAVE: { color: "bg-yellow-100 text-yellow-800 border-yellow-200", icon: AlertCircle },
        NOT_MARKED: { color: "bg-slate-100 text-slate-500 border-slate-200", icon: Calendar },
    };

    const config = configs[status as keyof typeof configs] || configs.NOT_MARKED;
    const Icon = config.icon;

    return (
        <span className={`flex items-center px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest border ${config.color}`}>
            <Icon className="w-3 h-3 mr-2" />
            {status.replace('_', ' ')}
        </span>
    );
}