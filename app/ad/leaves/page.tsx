"use client";

import { useEffect, useState, useCallback } from "react";
import { Loader2, Check, X, User, Home, Calendar, History, ClipboardList } from "lucide-react";
import axios from "axios";
import Link from "next/link";

export default function ADLeaveManagementPage() {
    const [allLeaves, setAllLeaves] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    const fetchData = useCallback(async () => {
        try {
            const res = await axios.get("/api/ad/leaves");
            setAllLeaves(res.data.data);
        } catch (err) {
            console.error("Fetch failed");
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => { fetchData(); }, [fetchData]);

    const handleAction = async (leaveId: string, status: "APPROVED" | "REJECTED") => {
        try {
            await axios.patch("/api/ad/leaves", { leaveId, status });
            fetchData(); // Refresh list to move the item to history
        } catch (err) {
            alert("Action failed");
        }
    };

    const pending = allLeaves.filter((l: any) => l.status === "PENDING");
    const processed = allLeaves.filter((l: any) => l.status !== "PENDING");

    if (isLoading) return <LoadingSpinner />;

    return (
        <div className="min-h-screen bg-[#f8fafc] p-6 text-slate-900 font-sans">
            <div className="max-w-5xl mx-auto">
                <header className="mb-10 flex justify-between items-center">
                    <div>
                        <h1 className="text-4xl font-black italic uppercase tracking-tighter">Leave Management</h1>
                        <p className="text-slate-500 font-bold text-[10px] uppercase tracking-[0.3em] mt-2 italic">Student Out-Pass Authorization</p>
                    </div>
                </header>

                {/* SECTION 1: ACTION REQUIRED */}
                <section className="mb-16">
                    <h2 className="flex items-center text-xs font-black uppercase tracking-[0.2em] text-blue-600 mb-6">
                        <ClipboardList className="w-4 h-4 mr-2" /> Pending Approvals ({pending.length})
                    </h2>

                    <div className="grid gap-6">
                        {pending.length === 0 ? <EmptyState message="No pending requests" /> :
                            pending.map((req: any) => (
                                <LeaveActionCard key={req._id} req={req} onAction={handleAction} />
                            ))
                        }
                    </div>
                </section>

                <hr className="border-slate-200 mb-16" />

                {/* SECTION 2: HISTORY */}
                <section>
                    <h2 className="flex items-center text-xs font-black uppercase tracking-[0.2em] text-slate-400 mb-6">
                        <History className="w-4 h-4 mr-2" /> Processed History ({processed.length})
                    </h2>

                    <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
                        <table className="w-full text-left">
                            <thead className="bg-slate-50 border-b border-slate-200">
                                <tr>
                                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Student</th>
                                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Room</th>
                                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Dates</th>
                                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400 text-right">Final Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {processed.map((req: any) => (
                                    <tr key={req._id} className="hover:bg-slate-50 transition-colors">
                                        <td className="px-6 py-4 font-black uppercase text-sm">{req.studentId?.name}</td>
                                        <td className="px-6 py-4 font-bold text-slate-500 text-xs">{req.studentId?.block}-{req.studentId?.roomNo}</td>
                                        <td className="px-6 py-4 font-bold text-slate-500 text-xs">
                                            {new Date(req.fromDate).toLocaleDateString()} - {new Date(req.toDate).toLocaleDateString()}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest ${req.status === 'APPROVED' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                                }`}>
                                                {req.status}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        {processed.length === 0 && <div className="p-10 text-center text-slate-400 font-bold text-xs italic">No history available</div>}
                    </div>
                </section>
            </div>
        </div>
    );
}

function LeaveActionCard({ req, onAction }: any) {
    return (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden flex flex-col md:flex-row border-l-8 border-l-blue-500">
            <div className="p-8 flex-1">
                <div className="flex items-center space-x-3 mb-4">
                    <h3 className="text-xl font-black uppercase tracking-tight">{req.studentId?.name}</h3>
                    <span className="text-xs font-bold text-slate-400 px-2 py-1 bg-slate-100 rounded-md tracking-widest">{req.studentId?.registerNo}</span>
                </div>
                <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="flex items-center text-xs font-bold text-slate-600 uppercase tracking-tight"><Home className="w-3 h-3 mr-2" /> {req.studentId?.block} - {req.studentId?.roomNo}</div>
                    <div className="flex items-center text-xs font-bold text-slate-600 uppercase tracking-tight"><Calendar className="w-3 h-3 mr-2" /> {new Date(req.fromDate).toLocaleDateString()} to {new Date(req.toDate).toLocaleDateString()}</div>
                </div>
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 font-bold text-sm italic text-slate-600">"{req.reason}"</div>
            </div>
            <div className="bg-slate-50 p-6 flex flex-row md:flex-col justify-center gap-3 w-full md:w-64 border-t md:border-t-0 md:border-l border-slate-100">
                <button onClick={() => onAction(req._id, "APPROVED")} className="flex-1 bg-slate-900 text-white py-3 rounded-xl font-black uppercase tracking-tighter hover:bg-black transition-all shadow-md">Approve</button>
                <button onClick={() => onAction(req._id, "REJECTED")} className="flex-1 bg-white text-red-600 border border-red-200 py-3 rounded-xl font-black uppercase tracking-tighter hover:bg-red-50 transition-all">Reject</button>
            </div>
        </div>
    );
}

function LoadingSpinner() { return <div className="h-screen flex items-center justify-center bg-slate-50"><Loader2 className="w-10 h-10 animate-spin text-slate-900" /></div>; }
function EmptyState({ message }: any) { return <div className="p-12 text-center bg-white rounded-3xl border-2 border-dashed border-slate-200 text-slate-400 font-black uppercase tracking-widest text-xs">{message}</div>; }