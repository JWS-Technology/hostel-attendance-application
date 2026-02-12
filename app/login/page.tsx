"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import { Loader2, Lock, User, ShieldCheck } from "lucide-react";
import axios from "axios";

export default function LoginPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const { register, handleSubmit, formState: { errors } } = useForm();

  const onSubmit = async (data: any) => {
    setIsLoading(true);
    setError("");

    try {
      // Backend sets HTTP-Only cookies (accessToken & refreshToken)
      const res = await axios.post("/api/auth/login", {
        ...data,
        deviceId: navigator.userAgent,
      });

      const { user } = res.data;

      // NO LOCAL STORAGE HERE
      // We redirect based on the role returned in the response
      if (user.role === "STUDENT") router.replace("/student/dashboard");
      else if (user.role === "AD") router.push("/ad/attendance");
      else if (user.role === "DIRECTOR" || user.role === "ADMIN") router.push("/admin/setup");

    } catch (err: any) {
      setError(err.response?.data?.message || "Authentication failed.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f8fafc] p-4 font-sans text-slate-900">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
        <div className="bg-slate-900 p-8 text-center text-white">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-lg bg-blue-500 mb-4 shadow-inner">
            <ShieldCheck className="w-7 h-7" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Hostel Systems</h1>
          <p className="text-slate-400 text-sm mt-1">Management & Attendance Portal</p>
        </div>

        <div className="p-8">
          {error && (
            <div className="mb-6 p-4 text-sm text-red-700 bg-red-50 rounded-xl border border-red-100 font-medium">
              <span className="font-bold">Error:</span> {error}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-900">Username / Register No</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-slate-400" />
                </div>
                <input
                  {...register("username", { required: "Username is required" })}
                  type="text"
                  className="block w-full pl-11 pr-4 py-3 border border-slate-300 rounded-xl text-slate-900 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all font-semibold"
                  placeholder="e.g. 24UCS537"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-900">Password</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-slate-400" />
                </div>
                <input
                  {...register("password", { required: "Password is required" })}
                  type="password"
                  className="block w-full pl-11 pr-4 py-3 border border-slate-300 rounded-xl text-slate-900 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all font-semibold"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-slate-900 hover:bg-black text-white font-bold py-4 rounded-xl shadow-lg transition-all flex items-center justify-center disabled:opacity-50"
            >
              {isLoading ? <Loader2 className="animate-spin h-5 w-5" /> : "Sign In to Portal"}
            </button>
          </form>

          <p className="mt-8 text-xs text-slate-400 text-center font-bold uppercase tracking-widest">
            Stateless Authentication Enabled
          </p>
        </div>
      </div>
    </div>
  );
}