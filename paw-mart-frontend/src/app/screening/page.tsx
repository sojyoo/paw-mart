"use client";
import React, { useState, useEffect, ChangeEvent, FormEvent } from "react";
import { useRouter } from "next/navigation";

const EXPERIENCE_OPTIONS = [
  "First-time pet owner",
  "Some experience",
  "Experienced dog owner",
  "Professional/Trainer"
];

export default function ScreeningFormPage() {
  const router = useRouter();
  const [status, setStatus] = useState<"NOT_SUBMITTED" | "PENDING" | "APPROVED" | "REJECTED">("NOT_SUBMITTED");
  const [form, setForm] = useState({
    experience: "",
    livingConditions: "",
    household: "",
    timeCommitment: "",
    idDocument: null as File | null,
    proofOfResidence: null as File | null,
    letter: "",
    interestedBreed: ""
  });
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [user, setUser] = useState<{ name: string; email: string; role: string } | null>(null);
  const [idDocName, setIdDocName] = useState('');
  const [proofName, setProofName] = useState('');
  const [rejectionReason, setRejectionReason] = useState<string | null>(null);
  const [canReapply, setCanReapply] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("pawmart_token") || sessionStorage.getItem("pawmart_token");
    if (!token) {
      router.replace("/");
      return;
    }
    fetch("http://localhost:4000/api/auth/me", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data && data.user && data.user.role === "BUYER") {
          setUser({ name: data.user.name, email: data.user.email, role: data.user.role });
          fetch("http://localhost:4000/api/screening/my-status", {
            headers: { Authorization: `Bearer ${token}` },
          })
            .then((res) => (res.ok ? res.json() : null))
            .then((data) => {
              setStatus(data?.status || "NOT_SUBMITTED");
              if (data && data.status === "REJECTED" && data.form) {
                setForm({ ...form, ...data.form });
              }
              if (data && data.status === "REJECTED" && data.form && data.form.adminNote) {
                setRejectionReason(data.form.adminNote);
              } else if (data && data.status === "REJECTED" && data.adminNote) {
                setRejectionReason(data.adminNote);
              } else {
                setRejectionReason(null);
              }
            });
        } else {
          router.replace("/");
        }
      });
    // On mount, check for stored rejection reason if status is NOT_SUBMITTED
    if (status === 'NOT_SUBMITTED') {
      const storedReason = localStorage.getItem('pawmart_rejection_reason');
      if (storedReason) setRejectionReason(storedReason);
    }
  }, [router, canReapply, status]);

  const validate = () => {
    const errs: { [key: string]: string } = {};
    if (!form.experience) errs.experience = "Required";
    if (!form.livingConditions.trim()) errs.livingConditions = "Required";
    if (!form.household.trim()) errs.household = "Required";
    if (!form.timeCommitment.trim()) errs.timeCommitment = "Required";
    if (!form.idDocument) errs.idDocument = "Required";
    if (!form.proofOfResidence) errs.proofOfResidence = "Required";
    if (!form.letter.trim()) errs.letter = "Required";
    // File validation
    [
      { key: "idDocument", file: form.idDocument },
      { key: "proofOfResidence", file: form.proofOfResidence }
    ].forEach(({ key, file }) => {
      if (file) {
        if (!/(jpg|jpeg|png)$/i.test(file.name.split(".").pop() || "")) {
          errs[key] = "Must be JPG or PNG";
        } else if (file.size > 5 * 1024 * 1024) {
          errs[key] = "Max size 5MB";
        }
      }
    });
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, files } = e.target as any;
    if (files) {
      if (name === 'idDocument') setIdDocName(files[0]?.name || '');
      if (name === 'proofOfResidence') setProofName(files[0]?.name || '');
      setForm((prev) => ({ ...prev, [name]: files[0] }));
    } else {
      setForm((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    const token = localStorage.getItem("pawmart_token") || sessionStorage.getItem("pawmart_token");
    const formData = new FormData();
    Object.entries(form).forEach(([key, value]) => {
      if (value) formData.append(key, value);
    });
    try {
      // Only use /update if status is REJECTED
      const shouldUpdate = status === "REJECTED";
      const endpoint = shouldUpdate ? "http://localhost:4000/api/screening/update" : "http://localhost:4000/api/screening/submit";
      const method = shouldUpdate ? "PUT" : "POST";
      const res = await fetch(endpoint, {
        method,
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      if (!res.ok) throw new Error("Failed to submit form");
      setSubmitted(true);
      setStatus("PENDING");
      // Clear rejection reason after successful new submission
      localStorage.removeItem('pawmart_rejection_reason');
      setRejectionReason(null);
    } catch (err) {
      setErrors({ form: "Submission failed. Please try again." });
    } finally {
      setSubmitting(false);
    }
  };

  if (!user) return null;

  if (status === "PENDING") {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 px-4 py-10">
        <div className="bg-white rounded-lg shadow p-8 max-w-lg w-full">
          <h1 className="text-2xl font-bold mb-4 text-blue-800">Screening Under Review</h1>
          <p className="mb-4 text-gray-700">Your application is under review. You cannot submit another until a decision is made. You will receive an email when your application is reviewed.</p>
          <button className="mt-4 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 font-semibold" onClick={() => router.push("/")}>Go to Dashboard</button>
        </div>
      </div>
    );
  }
  if (status === "APPROVED") {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 px-4 py-10">
        <div className="bg-white rounded-lg shadow p-8 max-w-lg w-full">
          <h1 className="text-2xl font-bold mb-4 text-green-800">Screening Approved</h1>
          <p className="mb-4 text-gray-700">You are eligible to rehome a pet. No need to submit another screening.</p>
          <button className="mt-4 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 font-semibold" onClick={() => router.push("/")}>Go to Dashboard</button>
        </div>
      </div>
    );
  }

  if (submitted && status !== "REJECTED") {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 px-4 py-10">
        <div className="bg-white rounded-lg shadow p-8 max-w-lg w-full">
          <h1 className="text-2xl font-bold mb-4 text-blue-800">Screening Submitted</h1>
          <p className="mb-4 text-gray-700">Thank you for filling out this form. Please wait for admin approval. You will receive an email when your application is reviewed.</p>
          <div className="bg-blue-50 border-l-4 border-blue-400 p-4 text-blue-800 rounded mb-4">
            <b>What to expect next:</b><br />
            Our team will review your application and documents. If approved, you'll be able to request to rehome a dog. If we need more info or your application is rejected, you'll receive an email with details and can resubmit.
          </div>
          <button className="mt-4 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 font-semibold" onClick={() => router.push("/")}>Go to Dashboard</button>
        </div>
      </div>
    );
  }

  if (status === "REJECTED" && !canReapply) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 px-4 py-10">
        <div className="bg-white rounded-lg shadow p-8 max-w-lg w-full">
          <h1 className="text-2xl font-bold mb-4 text-red-800">Screening Rejected</h1>
          <p className="mb-4 text-gray-700">Your application was rejected. Please review the reason below and reapply if you wish.</p>
          {rejectionReason && (
            <div className="bg-red-50 border-l-4 border-red-400 p-4 text-red-800 rounded mb-4">
              <b>Reason:</b> {rejectionReason}
            </div>
          )}
          <button
            className="mt-4 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 font-semibold"
            onClick={async () => {
              const token = localStorage.getItem("pawmart_token") || sessionStorage.getItem("pawmart_token");
              const res = await fetch("http://localhost:4000/api/screening/reapply", {
                method: "POST",
                headers: { Authorization: `Bearer ${token}` },
              });
              if (res.ok) {
                // Refetch status from backend to ensure state is correct
                const statusRes = await fetch("http://localhost:4000/api/screening/my-status", {
                  headers: { Authorization: `Bearer ${token}` },
                });
                const statusData = statusRes.ok ? await statusRes.json() : null;
                setStatus(statusData?.status || "NOT_SUBMITTED");
                setCanReapply(false);
                setForm({
                  experience: "",
                  livingConditions: "",
                  household: "",
                  timeCommitment: "",
                  idDocument: null,
                  proofOfResidence: null,
                  letter: "",
                  interestedBreed: ""
                });
                // Store rejection reason if present
                const data = await res.json();
                if (data.rejectionReason) {
                  localStorage.setItem('pawmart_rejection_reason', data.rejectionReason);
                  setRejectionReason(data.rejectionReason);
                } else {
                  localStorage.removeItem('pawmart_rejection_reason');
                  setRejectionReason(null);
                }
              }
            }}
          >
            Reapply
          </button>
        </div>
      </div>
    );
  }

  if (status !== "NOT_SUBMITTED" && !canReapply) {
    return null;
  }

  return (
    <div className="min-h-screen flex flex-col items-center bg-gray-50 px-4 py-10">
      <div className="bg-white rounded-lg shadow p-8 max-w-2xl w-full">
        <h1 className="text-3xl font-bold mb-6 text-blue-800">Buyer Screening Form</h1>
        {/* Show rejection banner if present and status is NOT_SUBMITTED */}
        {status === "NOT_SUBMITTED" && rejectionReason && (
          <div className="bg-red-50 border-l-4 border-red-400 p-4 text-red-800 rounded mb-6">
            <b>Your previous application was rejected.</b><br />
            <span>Reason: {rejectionReason}</span>
          </div>
        )}
        <div className="bg-blue-50 border-l-4 border-blue-400 p-4 text-blue-800 rounded mb-6">
          <b>What to expect next:</b><br />
          Our team will review your application and documents. If approved, you'll be able to request to rehome a dog. If we need more info or your application is rejected, you'll receive an email with details and can resubmit.
        </div>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block font-semibold mb-1">What is your experience with dogs? *</label>
            <select
              name="experience"
              value={form.experience}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900"
              required
            >
              <option value="">Select experience</option>
              {EXPERIENCE_OPTIONS.map(opt => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
            {errors.experience && <p className="text-red-500 text-xs mt-1">{errors.experience}</p>}
          </div>
          <div>
            <label className="block font-semibold mb-1">Describe your home and living environment for a pet. *</label>
            <textarea
              name="livingConditions"
              value={form.livingConditions}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900"
              rows={3}
              required
            />
            {errors.livingConditions && <p className="text-red-500 text-xs mt-1">{errors.livingConditions}</p>}
          </div>
          <div>
            <label className="block font-semibold mb-1">Who else lives with you? Any children or other pets? *</label>
            <textarea
              name="household"
              value={form.household}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900"
              rows={2}
              required
            />
            {errors.household && <p className="text-red-500 text-xs mt-1">{errors.household}</p>}
          </div>
          <div>
            <label className="block font-semibold mb-1">How much time are you willing to commit to taking care of your pet every day? *</label>
            <textarea
              name="timeCommitment"
              value={form.timeCommitment}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900"
              rows={2}
              required
            />
            {errors.timeCommitment && <p className="text-red-500 text-xs mt-1">{errors.timeCommitment}</p>}
          </div>
          <div>
            <label className="block font-semibold mb-1">Upload a photo of your ID document (JPG/PNG, max 5MB) *</label>
            <div className="flex items-center gap-3">
              <label className="bg-blue-600 text-white px-4 py-2 rounded cursor-pointer font-semibold hover:bg-blue-700 transition-colors">
                Choose File
                <input
                  type="file"
                  name="idDocument"
                  accept="image/jpeg,image/png"
                  onChange={handleChange}
                  className="hidden"
                  required
                />
              </label>
              <span className="text-gray-700 text-sm">{idDocName || 'No file selected.'}</span>
            </div>
            {errors.idDocument && <p className="text-red-500 text-xs mt-1">{errors.idDocument}</p>}
          </div>
          <div>
            <label className="block font-semibold mb-1">Upload a proof of residence (JPG/PNG, max 5MB) *</label>
            <div className="flex items-center gap-3">
              <label className="bg-blue-600 text-white px-4 py-2 rounded cursor-pointer font-semibold hover:bg-blue-700 transition-colors">
                Choose File
                <input
                  type="file"
                  name="proofOfResidence"
                  accept="image/jpeg,image/png"
                  onChange={handleChange}
                  className="hidden"
                  required
                />
              </label>
              <span className="text-gray-700 text-sm">{proofName || 'No file selected.'}</span>
            </div>
            {errors.proofOfResidence && <p className="text-red-500 text-xs mt-1">{errors.proofOfResidence}</p>}
          </div>
          <div>
            <label className="block font-semibold mb-1">Why do you want to rehome a dog? (Letter of intent) *</label>
            <textarea
              name="letter"
              value={form.letter}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900"
              rows={3}
              required
            />
            {errors.letter && <p className="text-red-500 text-xs mt-1">{errors.letter}</p>}
          </div>
          <div>
            <label className="block font-semibold mb-1">Are you interested in a specific breed? (Optional)</label>
            <input
              type="text"
              name="interestedBreed"
              value={form.interestedBreed}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900"
              placeholder="e.g. Labrador, Poodle, etc."
            />
          </div>
          {errors.form && <p className="text-red-500 text-xs mt-1">{errors.form}</p>}
          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50"
            disabled={submitting}
          >
            {submitting ? "Submitting..." : status === "REJECTED" ? "Resubmit Screening" : "Submit Screening"}
          </button>
        </form>
      </div>
    </div>
  );
} 