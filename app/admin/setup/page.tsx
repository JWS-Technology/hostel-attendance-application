"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import axios from "axios";
import Papa from "papaparse";
import { Users, UserCog, UploadCloud, Loader2, FileSpreadsheet, CheckCircle, AlertCircle, Save, Trash2, ArrowRight } from "lucide-react";

export default function DataEntryPage() {
    const [activeTab, setActiveTab] = useState<"STUDENT" | "AD" | "BULK">("STUDENT");

    return (
        <div className="min-h-screen bg-gray-50 p-6">
            <div className="max-w-6xl mx-auto"> {/* Increased width for Table */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900">System Setup</h1>
                    <p className="text-gray-500">Manage students, staff, and bulk data imports.</p>
                </div>

                {/* Tab Navigation */}
                <div className="flex space-x-4 mb-6">
                    <TabButton
                        active={activeTab === "STUDENT"}
                        onClick={() => setActiveTab("STUDENT")}
                        icon={<Users className="w-4 h-4 mr-2" />}
                        label="Single Student"
                        color="blue"
                    />
                    <TabButton
                        active={activeTab === "AD"}
                        onClick={() => setActiveTab("AD")}
                        icon={<UserCog className="w-4 h-4 mr-2" />}
                        label="Add Staff (AD)"
                        color="purple"
                    />
                    <TabButton
                        active={activeTab === "BULK"}
                        onClick={() => setActiveTab("BULK")}
                        icon={<FileSpreadsheet className="w-4 h-4 mr-2" />}
                        label="Bulk CSV Upload"
                        color="green"
                    />
                </div>

                {/* Content Area */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    {activeTab === "STUDENT" && <StudentForm />}
                    {activeTab === "AD" && <AdForm />}
                    {activeTab === "BULK" && <BulkUploadForm />}
                </div>
            </div>
        </div>
    );
}

// ---------------------------------------------------------
// REVISED: Bulk Upload with Preview Table
// ---------------------------------------------------------
// ---------------------------------------------------------
// REVISED: Bulk Upload with CSV-to-Database Mapping Table
// ---------------------------------------------------------
function BulkUploadForm() {
    const [isLoading, setIsLoading] = useState(false);
    const [previewData, setPreviewData] = useState<any[]>([]);
    const [stats, setStats] = useState<any>(null);
    const [fileName, setFileName] = useState("");

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setFileName(file.name);
        setIsLoading(true);
        setStats(null);

        Papa.parse(file, {
            header: true,
            skipEmptyLines: true,
            complete: (results) => {
                // 1. MAP CSV HEADERS TO DATABASE FIELDS
                // We convert "dNo" -> "registerNo" here immediately.
                const mappedData = results.data.map((row: any) => ({
                    // Personal Info
                    name: row.name?.trim(),
                    religion: row.religion?.trim(),

                    // Identifiers
                    registerNo: row.dNo?.trim(),   // CSV: dNo
                    accountNo: row.accNo,          // CSV: accNo

                    // Location
                    block: row.block?.trim(),
                    roomNo: row.roomNo?.trim(),

                    // Contact
                    parentPhone: row.parentNo,     // CSV: parentNo
                    studentPhone: row.studentNo    // CSV: studentNo
                }));

                setPreviewData(mappedData);
                setIsLoading(false);
            },
            error: (err) => {
                alert("Error parsing CSV");
                setIsLoading(false);
            }
        });
    };

    const handleConfirmUpload = async () => {
        if (previewData.length === 0) return;
        setIsLoading(true);

        try {
            // Send the ALREADY MAPPED data to the API
            const res = await axios.post("/api/admin/bulk-upload", { students: previewData });
            setStats(res.data.data);
            setPreviewData([]); // Clear preview on success
            setFileName("");
        } catch (err: any) {
            alert("Upload failed: " + (err.response?.data?.message || err.message));
        } finally {
            setIsLoading(false);
        }
    };

    const handleReset = () => {
        setPreviewData([]);
        setFileName("");
        setStats(null);
    };

    // --- RENDER: SUCCESS REPORT ---
    if (stats) {
        return (
            <div className="space-y-6 text-center">
                <div className="bg-green-50 border border-green-200 rounded-xl p-8">
                    <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-4" />
                    <h3 className="text-2xl font-bold text-gray-900">Upload Complete</h3>
                    <div className="flex justify-center gap-8 mt-6">
                        <div className="text-center">
                            <p className="text-3xl font-bold text-green-600">{stats.success}</p>
                            <p className="text-sm text-gray-600">Added</p>
                        </div>
                        <div className="text-center">
                            <p className="text-3xl font-bold text-red-600">{stats.failed}</p>
                            <p className="text-sm text-gray-600">Skipped/Failed</p>
                        </div>
                    </div>
                </div>

                {stats.errors.length > 0 && (
                    <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-left">
                        <h4 className="font-bold text-red-800 mb-2 flex items-center">
                            <AlertCircle className="w-4 h-4 mr-2" /> Error Log
                        </h4>
                        <div className="max-h-40 overflow-y-auto text-xs text-red-700 space-y-1">
                            {stats.errors.map((e: string, i: number) => (
                                <div key={i}>{e}</div>
                            ))}
                        </div>
                    </div>
                )}
                <button onClick={handleReset} className="text-blue-600 hover:underline font-medium">
                    Upload Another File
                </button>
            </div>
        );
    }

    // --- RENDER: PREVIEW TABLE ---
    if (previewData.length > 0) {
        return (
            <div className="space-y-4">
                <div className="flex justify-between items-center bg-blue-50 p-4 rounded-lg">
                    <div>
                        <h3 className="text-lg font-bold text-gray-900">Review Data</h3>
                        <p className="text-sm text-blue-700">
                            Checking <strong>{previewData.length}</strong> records from <em>{fileName}</em>
                        </p>
                    </div>
                    <div className="flex space-x-3">
                        <button
                            onClick={handleReset}
                            className="px-4 py-2 text-sm font-medium text-red-600 bg-white border border-red-200 hover:bg-red-50 rounded-lg flex items-center transition-colors"
                        >
                            <Trash2 className="w-4 h-4 mr-2" /> Cancel
                        </button>
                        <button
                            onClick={handleConfirmUpload}
                            disabled={isLoading}
                            className="px-6 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-lg flex items-center shadow-md transition-colors disabled:opacity-50"
                        >
                            {isLoading ? <Loader2 className="animate-spin w-4 h-4 mr-2" /> : <UploadCloud className="w-4 h-4 mr-2" />}
                            Confirm Upload
                        </button>
                    </div>
                </div>

                <div className="overflow-x-auto border rounded-lg max-h-[500px] shadow-sm">
                    <table className="w-full text-sm text-left text-gray-500">
                        <thead className="text-xs text-gray-700 uppercase bg-gray-100 sticky top-0 shadow-sm">
                            <tr>
                                <th className="px-6 py-3">Name</th>
                                <th className="px-6 py-3">Reg No <span className="text-gray-400 normal-case">(dNo)</span></th>
                                <th className="px-6 py-3">Acc No</th>
                                <th className="px-6 py-3">Room</th>
                                <th className="px-6 py-3">Student Phone</th>
                                <th className="px-6 py-3">Parent Phone</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {previewData.map((row, index) => (
                                <tr key={index} className="bg-white hover:bg-blue-50 transition-colors">
                                    <td className="px-6 py-3 font-medium text-gray-900">{row.name}</td>

                                    {/* Validation: Highlight if Register Number is missing (CRITICAL) */}
                                    <td className={`px-6 py-3 font-mono ${!row.registerNo ? "bg-red-100 text-red-600 font-bold" : ""}`}>
                                        {row.registerNo || "MISSING"}
                                    </td>

                                    <td className="px-6 py-3">{row.accountNo}</td>

                                    {/* Combined Location for cleaner UI */}
                                    <td className="px-6 py-3">
                                        <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-gray-100 text-gray-800">
                                            {row.block}-{row.roomNo}
                                        </span>
                                    </td>

                                    <td className="px-6 py-3 text-gray-500">{row.studentPhone}</td>
                                    <td className="px-6 py-3 text-gray-500">{row.parentPhone}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                <p className="text-xs text-gray-400 text-center">
                    Rows highlighted in red (Missing Reg No) will be skipped automatically.
                </p>
            </div>
        );
    }

    // --- RENDER: INITIAL UPLOAD STATE ---
    return (
        <div className="space-y-6">
            <div className="border-2 border-dashed border-gray-300 rounded-xl p-12 text-center bg-gray-50 hover:bg-gray-100 transition-colors cursor-pointer relative group">
                <input
                    type="file"
                    accept=".csv"
                    onChange={handleFileChange}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                <div className="flex flex-col items-center justify-center pointer-events-none group-hover:scale-105 transition-transform">
                    <div className="bg-white p-4 rounded-full shadow-sm mb-4">
                        <FileSpreadsheet className="w-8 h-8 text-green-600" />
                    </div>
                    <h3 className="text-lg font-bold text-gray-900">Click to Upload CSV</h3>
                    <p className="text-sm text-gray-500 mt-2 max-w-sm mx-auto">
                        Make sure your file has headers: <code className="bg-gray-200 px-1 rounded">dNo</code>, <code className="bg-gray-200 px-1 rounded">accNo</code>, <code className="bg-gray-200 px-1 rounded">parentNo</code>, etc.
                    </p>
                </div>
            </div>
            {isLoading && (
                <div className="flex justify-center text-blue-600">
                    <Loader2 className="animate-spin w-6 h-6" />
                </div>
            )}
        </div>
    );
}

// ---------------------------------------------------------
// PREVIOUSLY DEFINED COMPONENTS (Keep these as they were)
// ---------------------------------------------------------

const TabButton = ({ active, onClick, icon, label, color }: any) => {
    const baseClass = "flex items-center px-4 py-2 rounded-lg font-medium transition-colors";
    const activeClass = `bg-${color}-600 text-white shadow-md`;
    const inactiveClass = "bg-white text-gray-600 hover:bg-gray-100";

    return (
        <button onClick={onClick} className={`${baseClass} ${active ? activeClass : inactiveClass}`}>
            {icon} {label}
        </button>
    );
};

// ... (Rest of your StudentForm and AdForm code from previous answer)
// ---------------------------------------------------------
// Sub-Component: Student Entry Form
// ---------------------------------------------------------
function StudentForm() {
    const { register, handleSubmit, reset } = useForm();
    const [status, setStatus] = useState({ loading: false, msg: "", type: "" });

    const onSubmit = async (data: any) => {
        setStatus({ loading: true, msg: "", type: "" });
        try {
            await axios.post("/api/admin/students", data);
            setStatus({ loading: false, msg: "Student Added Successfully!", type: "success" });
            reset(); // Clear form
        } catch (err: any) {
            setStatus({
                loading: false,
                msg: err.response?.data?.message || "Failed to add student",
                type: "error"
            });
        }
    };

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Personal Details */}
                <div className="space-y-4">
                    <h3 className="font-semibold text-gray-900 border-b pb-2">Personal Details</h3>
                    <Input label="Full Name" name="name" register={register} required />
                    <Input label="Register No (Login ID)" name="registerNo" register={register} required placeholder="24UCS537" />
                    <Input label="Hostel Account No" name="accountNo" type="number" register={register} required placeholder="395" />
                    <Input label="Religion" name="religion" register={register} />
                </div>

                {/* Contact & Room */}
                <div className="space-y-4">
                    <h3 className="font-semibold text-gray-900 border-b pb-2">Location & Contact</h3>
                    <div className="grid grid-cols-2 gap-4">
                        <Input label="Block" name="block" register={register} required placeholder="A" />
                        <Input label="Room No" name="roomNo" register={register} required placeholder="101" />
                    </div>
                    <Input label="Student Phone" name="studentPhone" register={register} required />
                    <Input label="Parent Phone" name="parentPhone" register={register} required />
                </div>
            </div>

            <FormActions status={status} btnColor="bg-blue-600 hover:bg-blue-700" />
        </form>
    );
}

// ---------------------------------------------------------
// Sub-Component: AD Entry Form
// ---------------------------------------------------------
function AdForm() {
    const { register, handleSubmit, reset } = useForm();
    const [status, setStatus] = useState({ loading: false, msg: "", type: "" });

    const onSubmit = async (data: any) => {
        setStatus({ loading: true, msg: "", type: "" });
        try {
            await axios.post("/api/admin/staff", data);
            setStatus({ loading: false, msg: "AD Created Successfully!", type: "success" });
            reset();
        } catch (err: any) {
            setStatus({
                loading: false,
                msg: err.response?.data?.message || "Failed to create AD",
                type: "error"
            });
        }
    };

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                    <h3 className="font-semibold text-gray-900 border-b pb-2 text-purple-700">Staff Profile</h3>
                    <Input label="Staff Name" name="name" register={register} required />
                    <Input label="Staff Code" name="staffCode" register={register} required placeholder="AD-001" />
                    <Input label="Phone Number" name="phone" register={register} required />
                </div>

                <div className="space-y-4">
                    <h3 className="font-semibold text-gray-900 border-b pb-2 text-purple-700">Login Credentials</h3>
                    <Input label="Username" name="username" register={register} required />
                    <Input label="Password" name="password" type="password" register={register} required />
                </div>
            </div>

            <FormActions status={status} btnColor="bg-purple-600 hover:bg-purple-700" />
        </form>
    );
}

// ---------------------------------------------------------
// Helper Components (UI Only)
// ---------------------------------------------------------
const Input = ({ label, name, register, required, type = "text", placeholder }: any) => (
    <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
        <input
            {...register(name, { required })}
            type={type}
            placeholder={placeholder}
            className="w-full px-3 py-2 border text-black border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
        />
    </div>
);

const FormActions = ({ status, btnColor }: any) => (
    <div className="flex items-center justify-between pt-4 border-t">
        <div className={`text-sm ${status.type === 'error' ? 'text-red-600' : 'text-green-600'}`}>
            {status.msg && (
                <span className="flex items-center">
                    {status.type === 'success' ? <CheckCircle className="w-4 h-4 mr-1" /> : null}
                    {status.msg}
                </span>
            )}
        </div>
        <button
            disabled={status.loading}
            className={`${btnColor} text-white px-6 py-2 rounded-lg font-medium flex items-center disabled:opacity-50 transition-colors`}
        >
            {status.loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
            Save Record
        </button>
    </div>
);