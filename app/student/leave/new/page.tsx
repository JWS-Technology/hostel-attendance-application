"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Calendar, FileText, Send, Loader2, ArrowLeft } from "lucide-react";
import axios from "axios";

export default function NewLeavePage() {
    const [loading, setLoading] = useState(false);
    const [form, setForm] = useState({ fromDate: "", toDate: "", reason: "" });
    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const res = await axios.post("/api/student/leave", form);
            alert(res.data.message);
            router.push("/student/dashboard");
        } catch (err) {
            alert("Failed to submit request");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#f8fafc] p-6 text-slate-900 font-sans">
            <div className="max-w-2xl mx-auto bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden">
                <div className="bg-slate-900 p-8 text-white">
                    <h1 className="text-3xl font-black italic uppercase tracking-tighter">Apply for Leave</h1>
                    <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mt-1">Official Out-Pass Request</p>
                </div>

                <form onSubmit={handleSubmit} className="p-8 space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-xs font-black uppercase tracking-widest text-slate-400">From Date</label>
                            <input
                                type="date" required
                                onChange={e => setForm({ ...form, fromDate: e.target.value })}
                                className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold focus:ring-2 focus:ring-blue-500 outline-none"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-black uppercase tracking-widest text-slate-400">To Date</label>
                            <input
                                type="date" required
                                onChange={e => setForm({ ...form, toDate: e.target.value })}
                                className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold focus:ring-2 focus:ring-blue-500 outline-none"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-black uppercase tracking-widest text-slate-400">Reason for Leave</label>
                        <textarea
                            required rows={4}
                            onChange={e => setForm({ ...form, reason: e.target.value })}
                            placeholder="e.g. Going home for pongal holidays"
                            className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold focus:ring-2 focus:ring-blue-500 outline-none"
                        />
                    </div>

                    <button
                        disabled={loading}
                        className="w-full bg-slate-900 hover:bg-black text-white py-4 rounded-2xl font-black uppercase tracking-tighter shadow-lg transition-all flex items-center justify-center"
                    >
                        {loading ? <Loader2 className="animate-spin mr-2" /> : <Send className="mr-2 w-5 h-5" />}
                        Submit Leave Request
                    </button>
                </form>
            </div>
        </div>
    );
}