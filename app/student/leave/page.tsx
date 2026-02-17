"use client";

import { useEffect, useState } from "react";
import { Loader2, Calendar, Clock, CheckCircle2, XCircle, ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import axios from "axios";

export default function StudentLeaveListPage() {
    const [leaves, setLeaves] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        const fetchLeaves = async () => {
            try {
                const res = await axios.get("/api/student/leave"); // Fetches only this student's requests
                setLeaves(res.data.data);
            } catch (err) {
                router.replace("/login");
            } finally {
                setIsLoading(false);
            }
        };
        fetchLeaves();
    }, [router]);

    if (isLoading) return <LoadingSpinner />;

    return (
        <div className="min-h-screen bg-[#f8fafc] p-6 text-slate-900 font-sans">
            <div className="max-w-4xl mx-auto">
                <header className="mb-10 flex justify-between items-end">
                    <div>
                        <Link href="/student/dashboard" className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center mb-2 hover:text-slate-900 transition-colors">
                            <ArrowLeft className="w-3 h-3 mr-1" /> Back to Dashboard
                        </Link>
                        <h1 className="text-4xl font-black italic uppercase tracking-tighter">My Leave Requests</h1>
                    </div>
                    <Link href="/student/leave/new" className="bg-slate-900 text-white px-6 py-3 rounded-xl font-black uppercase tracking-tighter text-sm shadow-lg hover:bg-black transition-all">
                        Apply New
                    </Link>
                </header>

                <div className="space-y-4">
                    {leaves.length === 0 ? <EmptyState message="No leave applications found" /> :
                        leaves.map((leave: any) => (
                            <div key={leave._id} className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex items-center justify-between group hover:border-slate-400 transition-all">
                                <div className="flex items-center space-x-6">
                                    <div className="bg-slate-100 p-4 rounded-2xl group-hover:bg-slate-900 group-hover:text-white transition-colors">
                                        <Calendar className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <p className="font-black text-lg tracking-tight uppercase">
                                            {new Date(leave.fromDate).toLocaleDateString()} — {new Date(leave.toDate).toLocaleDateString()}
                                        </p>
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Reason: {leave.reason}</p>
                                    </div>
                                </div>
                                <StatusBadge status={leave.status} auto={!leave.approvalRequired} />
                            </div>
                        ))
                    }
                </div>
            </div>
        </div>
    );
}

function StatusBadge({ status, auto }: { status: string, auto: boolean }) {
    const config: any = {
        PENDING: "bg-yellow-100 text-yellow-800 border-yellow-200",
        APPROVED: "bg-slate-900 text-white border-slate-900",
        REJECTED: "bg-red-100 text-red-800 border-red-200"
    };
    return (
        <div className="text-right">
            <span className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border-2 ${config[status]}`}>
                {status}
            </span>
            {auto && status === "APPROVED" && <p className="text-[8px] font-black text-slate-400 mt-2 uppercase tracking-widest">Auto-Approved (Weekend)</p>}
        </div>
    );
}


function LoadingSpinner() {
    return (
        <div className="h-screen flex items-center justify-center bg-slate-50">
            <Loader2 className="w-10 h-10 animate-spin text-slate-900" />
        </div>
    );
}

function EmptyState({ message }: { message: string }) {
    return (
        <div className="p-20 text-center bg-white rounded-3xl border-2 border-dashed border-slate-200">
            <p className="text-slate-400 font-black uppercase tracking-widest text-sm">{message}</p>
        </div>
    );
}