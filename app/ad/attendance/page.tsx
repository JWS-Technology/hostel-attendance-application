"use client";

import { useEffect, useState } from "react";
import { Loader2, CheckCircle, XCircle, AlertCircle, Save, LayoutDashboard } from "lucide-react";
import axios from "axios";
import LogoutButton from "@/components/Logout"; // Ensure filename matches your project

// IMPORTANT: Added 'block' to the type
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

    useEffect(() => {
        const fetchList = async () => {
            try {
                const userStr = localStorage.getItem("user");
                if (!userStr) {
                    window.location.href = "/login"; // Force redirect if no user
                    return;
                }

                const user = JSON.parse(userStr);
                setCurrentUser(user);

                if (!user.profileId) {
                    console.error("No profileId found! Please log out and log back in.");
                    return;
                }

                const res = await axios.get(`/api/attendance/fetch-list`, {
                    params: { staffId: user.profileId },
                });

                const listWithStatus = res.data.data.map((s: any) => ({
                    ...s,
                    status: "PRESENT", // Default all to present for speed
                }));

                setStudents(listWithStatus);
            } catch (err) {
                console.error("Failed to load manifest", err);
            } finally {
                setIsLoading(false);
            }
        };

        fetchList();
    }, []);

    const setStatus = (id: string, newStatus: "PRESENT" | "ABSENT" | "ON_LEAVE") => {
        setStudents((prev) =>
            prev.map((s) => (s._id === id ? { ...s, status: newStatus } : s))
        );
    };

    const handleSubmit = async () => {
        if (students.length === 0) return;
        setIsSubmitting(true);

        try {
            if (!currentUser || !currentUser.id) throw new Error("Authentication error.");

            // 1. Group by Block for backend processing
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

            // 2. Submit concurrently
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
            console.error("Submission error:", err);
            if (axios.isAxiosError(err)) {
                alert(`Failed: ${err.response?.data?.message || "Submission Error"}`);
            } else {
                alert("An unexpected error occurred during submission.");
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    // UI Helper to group students by block for rendering
    const studentsByBlock = students.reduce((acc, student) => {
        if (!acc[student.block]) acc[student.block] = [];
        acc[student.block].push(student);
        return acc;
    }, {} as Record<string, Student[]>);

    if (isLoading) {
        return (
            <div className="flex h-screen items-center justify-center bg-gray-50">
                <div className="text-center">
                    <Loader2 className="h-10 w-10 animate-spin text-blue-600 mx-auto mb-4" />
                    <p className="text-gray-500 font-medium">Loading assigned rooms...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 pb-12">
            {/* Top Navigation Bar */}
            <nav className="bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center sticky top-0 z-10 shadow-sm">
                <div className="flex items-center text-blue-800 font-bold text-xl">
                    <LayoutDashboard className="w-6 h-6 mr-2" />
                    Hostel Portal
                </div>
                <div className="flex items-center space-x-6">
                    <span className="text-sm font-medium text-gray-600">
                        Welcome, {currentUser?.name || "AD"}
                    </span>
                    <LogoutButton />
                </div>
            </nav>

            <div className="max-w-5xl mx-auto px-6 mt-8">
                {/* Header Section */}
                <div className="flex justify-between items-end mb-8 bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">Mark Attendance</h1>
                        <p className="text-gray-500 mt-1 font-medium text-sm bg-gray-100 inline-block px-3 py-1 rounded-full">
                            {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                        </p>
                    </div>
                    <button
                        onClick={handleSubmit}
                        disabled={isSubmitting || students.length === 0}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg font-bold flex items-center disabled:opacity-50 transition-all shadow-md hover:shadow-lg"
                    >
                        {isSubmitting ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Save className="mr-2 h-5 w-5" />}
                        {isSubmitting ? "Saving Data..." : "Submit Attendance"}
                    </button>
                </div>

                {students.length === 0 ? (
                    <div className="text-center p-12 bg-white rounded-xl border border-gray-200 shadow-sm">
                        <AlertCircle className="mx-auto h-12 w-12 text-gray-400 mb-3" />
                        <h3 className="text-lg font-medium text-gray-900">No students found</h3>
                        <p className="text-gray-500">You do not have any active room assignments.</p>
                    </div>
                ) : (
                    /* Render a table for EACH Block the AD manages */
                    Object.entries(studentsByBlock).map(([block, blockStudents]) => (
                        <div key={block} className="mb-8">
                            <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
                                <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-lg mr-2">Block {block}</span>
                            </h2>

                            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                                <table className="w-full text-left">
                                    <thead className="bg-gray-50 border-b border-gray-200">
                                        <tr>
                                            <th className="px-6 py-4 text-sm font-semibold text-gray-700 w-24">Room</th>
                                            <th className="px-6 py-4 text-sm font-semibold text-gray-700">Student Details</th>
                                            <th className="px-6 py-4 text-sm font-semibold text-gray-700 text-right">Attendance Status</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {blockStudents.map((student) => (
                                            <tr key={student._id} className="hover:bg-gray-50 transition-colors">
                                                <td className="px-6 py-4">
                                                    <span className="font-bold text-gray-900 text-lg">{student.roomNo}</span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="font-bold text-gray-900">{student.name}</div>
                                                    <div className="text-xs font-mono text-gray-500 mt-0.5">{student.registerNo}</div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    {/* Segmented Toggle Control */}
                                                    <div className="flex justify-end space-x-2">
                                                        <button
                                                            onClick={() => setStatus(student._id, "PRESENT")}
                                                            className={`flex items-center px-3 py-1.5 rounded-md text-sm font-medium transition-all ${student.status === "PRESENT"
                                                                ? "bg-green-100 text-green-800 border-green-200 border"
                                                                : "bg-gray-50 text-gray-500 border border-transparent hover:bg-gray-100"
                                                                }`}
                                                        >
                                                            <CheckCircle className="w-4 h-4 mr-1.5" /> Present
                                                        </button>

                                                        <button
                                                            onClick={() => setStatus(student._id, "ABSENT")}
                                                            className={`flex items-center px-3 py-1.5 rounded-md text-sm font-medium transition-all ${student.status === "ABSENT"
                                                                ? "bg-red-100 text-red-800 border-red-200 border"
                                                                : "bg-gray-50 text-gray-500 border border-transparent hover:bg-gray-100"
                                                                }`}
                                                        >
                                                            <XCircle className="w-4 h-4 mr-1.5" /> Absent
                                                        </button>

                                                        <button
                                                            onClick={() => setStatus(student._id, "ON_LEAVE")}
                                                            className={`flex items-center px-3 py-1.5 rounded-md text-sm font-medium transition-all ${student.status === "ON_LEAVE"
                                                                ? "bg-yellow-100 text-yellow-800 border-yellow-200 border"
                                                                : "bg-gray-50 text-gray-500 border border-transparent hover:bg-gray-100"
                                                                }`}
                                                        >
                                                            <AlertCircle className="w-4 h-4 mr-1.5" /> Leave
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}