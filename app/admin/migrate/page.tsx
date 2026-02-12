"use client";

import { useState } from "react";
import axios from "axios";
import { Loader2, DatabaseBackup, AlertTriangle, CheckCircle, XCircle, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function MigrationPage() {
    const [jsonInput, setJsonInput] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [stats, setStats] = useState<any>(null);

    const handleMigrate = async () => {
        if (!jsonInput) return;

        try {
            const parsed = JSON.parse(jsonInput); // Validate JSON format
            setIsLoading(true);
            setStats(null);

            // Wrap in object as API expects { users: [...] }
            const res = await axios.post("/api/admin/migrate-staff", { users: parsed });
            setStats(res.data.data);
        } catch (err: any) {
            alert("Migration Failed: " + (err.response?.data?.message || err.message));
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 p-6">
            <div className="max-w-3xl mx-auto">

                {/* Header & Back Link */}
                <div className="mb-8">
                    <Link href="/admin/setup" className="text-sm text-gray-500 hover:text-gray-900 flex items-center mb-4 transition-colors">
                        <ArrowLeft className="w-4 h-4 mr-1" /> Back to Setup
                    </Link>
                    <h1 className="text-3xl font-bold text-gray-900 flex items-center">
                        <DatabaseBackup className="w-8 h-8 mr-3 text-orange-600" />
                        Legacy Data Migration
                    </h1>
                    <p className="text-gray-500 mt-2">
                        Import old user data (JSON) into the new system. This will preserve passwords and expand room ranges.
                    </p>
                </div>

                {/* Warning Card */}
                <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 flex items-start mb-6">
                    <AlertTriangle className="w-5 h-5 text-orange-600 mr-3 flex-shrink-0 mt-0.5" />
                    <div className="text-sm text-orange-800">
                        <p className="font-semibold">Important:</p>
                        <ul className="list-disc list-inside mt-1 space-y-1">
                            <li>Paste the raw array of user objects directly.</li>
                            <li>Existing usernames will be skipped (no duplicates).</li>
                            <li>Room ranges (e.g., 129-146) will be automatically expanded.</li>
                        </ul>
                    </div>
                </div>

                {/* Input Area */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Paste Legacy JSON Here
                    </label>
                    <textarea
                        value={jsonInput}
                        onChange={(e) => setJsonInput(e.target.value)}
                        placeholder='[
  {
    "username": "Jovin",
    "password": "...",
    "role": "ad",
    "roomsIncharge": { "from": 129, "to": 146 }
  }
]'
                        className="w-full h-96 p-4 font-mono text-xs md:text-sm bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all resize-none"
                        spellCheck={false}
                    />

                    <div className="flex justify-end mt-4">
                        <button
                            onClick={handleMigrate}
                            disabled={isLoading || !jsonInput}
                            className="bg-orange-600 hover:bg-orange-700 text-white px-8 py-2.5 rounded-lg font-medium flex items-center disabled:opacity-50 transition-colors shadow-sm"
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 className="animate-spin w-4 h-4 mr-2" />
                                    Migrating...
                                </>
                            ) : (
                                <>
                                    <DatabaseBackup className="w-4 h-4 mr-2" />
                                    Start Migration
                                </>
                            )}
                        </button>
                    </div>
                </div>

                {/* Results Section */}
                {stats && (
                    <div className="mt-8 bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
                            <h3 className="font-bold text-gray-900">Migration Report</h3>
                        </div>
                        <div className="p-6 grid grid-cols-2 gap-4">
                            <div className="bg-green-50 p-4 rounded-lg flex items-center text-green-800">
                                <CheckCircle className="w-8 h-8 mr-3 text-green-600" />
                                <div>
                                    <p className="text-2xl font-bold">{stats.success}</p>
                                    <p className="text-sm opacity-80">Migrated Successfully</p>
                                </div>
                            </div>
                            <div className="bg-red-50 p-4 rounded-lg flex items-center text-red-800">
                                <XCircle className="w-8 h-8 mr-3 text-red-600" />
                                <div>
                                    <p className="text-2xl font-bold">{stats.failed}</p>
                                    <p className="text-sm opacity-80">Skipped / Failed</p>
                                </div>
                            </div>
                        </div>

                        {stats.errors.length > 0 && (
                            <div className="px-6 pb-6">
                                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Error Log</p>
                                <div className="bg-gray-100 rounded-lg p-3 max-h-40 overflow-y-auto">
                                    {stats.errors.map((e: string, i: number) => (
                                        <div key={i} className="text-xs text-red-600 font-mono py-1 border-b border-gray-200 last:border-0">
                                            {e}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}