/**
 * CertificateMaster Storage Service
 * Uses Supabase instead of IndexedDB for persistent storage
 */

import { supabase } from "@/lib/supabase";
import { Certificate, CertificateDesign } from "../types";

// ============= CERTIFICATES =============

/**
 * Save certificate to Supabase database
 * Note: Using 'as any' because generated_certificates may not be in generated types
 */
export const saveCertificateToDb = async (
  cert: Certificate
): Promise<boolean> => {
  try {
    const { error } = await (supabase as any)
      .from("generated_certificates")
      .upsert(
        {
          id: cert.id,
          certificate_id: cert.certificateNumber,
          worker_id: cert.worker_id || null,
          worker_full_name: cert.candidateName,
          worker_specialization: cert.role,
          verification_reason: cert.description,
          issue_date: cert.issueDate,
          valid_until: calculateValidUntil(
            cert.issueDate,
            cert.validityYears || 1
          ),
          status: cert.status || "active",
          pdf_url: cert.pdf_url || null,
          issued_by_admin_id: null, // Will be set from context
          issued_by_admin_name: cert.instructorName || "Administrator",
        },
        { onConflict: "id" }
      );

    if (error) {
      console.error("Error saving certificate:", error);
      return false;
    }
    return true;
  } catch (err) {
    console.error("Error saving certificate:", err);
    return false;
  }
};

/**
 * Get all certificates from database
 */
export const getAllCertificatesFromDb = async (): Promise<Certificate[]> => {
  try {
    const { data, error } = await (supabase as any)
      .from("generated_certificates")
      .select("*")
      .order("issue_date", { ascending: false });

    if (error) throw error;

    return (data || []).map((row: any) => ({
      id: row.id,
      worker_id: row.worker_id,
      candidateName: row.worker_full_name,
      candidateDob: "",
      candidatePlaceOfBirth: "",
      candidatePhoto: null,
      companyName: "ZZP Werkplaats",
      companyAddress: "Netherlands",
      role: row.worker_specialization || "",
      examDate: row.issue_date,
      description: row.verification_reason || "",
      instructorName: row.issued_by_admin_name || "Administrator",
      issueDate: row.issue_date,
      certificateNumber: row.certificate_id,
      validityYears: calculateYears(row.issue_date, row.valid_until),
      status: row.status,
      pdf_url: row.pdf_url,
      created_at: row.created_at,
      updated_at: row.updated_at,
    }));
  } catch (err) {
    console.error("Error fetching certificates:", err);
    return [];
  }
};

/**
 * Delete certificate from database
 */
export const deleteCertificateFromDb = async (id: string): Promise<boolean> => {
  try {
    const { error } = await (supabase as any)
      .from("generated_certificates")
      .delete()
      .eq("id", id);

    if (error) throw error;
    return true;
  } catch (err) {
    console.error("Error deleting certificate:", err);
    return false;
  }
};

// ============= DESIGN PREFERENCES =============

const DESIGN_STORAGE_KEY = "certificate_master_design";

/**
 * Save design preferences to localStorage (per-admin setting)
 */
export const saveDesign = (
  type: "cert" | "card",
  design: CertificateDesign
): void => {
  try {
    const key = `${DESIGN_STORAGE_KEY}_${type}`;
    localStorage.setItem(key, JSON.stringify(design));
  } catch (err) {
    console.error("Error saving design:", err);
  }
};

/**
 * Get design preferences from localStorage
 */
export const getDesign = (type: "cert" | "card"): CertificateDesign | null => {
  try {
    const key = `${DESIGN_STORAGE_KEY}_${type}`;
    const stored = localStorage.getItem(key);
    return stored ? JSON.parse(stored) : null;
  } catch (err) {
    console.error("Error loading design:", err);
    return null;
  }
};

// ============= WORKERS =============

/**
 * Fetch all workers for selection dropdown
 */
export const fetchWorkersForSelection = async () => {
  try {
    const { data, error } = await supabase
      .from("workers")
      .select(
        `
        id,
        specialization,
        profile:profiles!workers_profile_id_fkey (
          id,
          full_name,
          email,
          phone,
          avatar_url
        )
      `
      )
      .order("created_at", { ascending: false });

    if (error) throw error;

    return (data || []).map((worker: any) => ({
      id: worker.id,
      profile_id: worker.profile?.id,
      full_name: worker.profile?.full_name || "Unknown",
      email: worker.profile?.email || "",
      phone: worker.profile?.phone || "",
      specialization: worker.specialization || "",
      avatar_url: worker.profile?.avatar_url || null,
    }));
  } catch (err) {
    console.error("Error fetching workers:", err);
    return [];
  }
};

// ============= HELPERS =============

function calculateValidUntil(issueDate: string, years: number): string {
  const date = new Date(issueDate);
  date.setFullYear(date.getFullYear() + years);
  return date.toISOString().split("T")[0];
}

function calculateYears(issueDate: string, validUntil: string): number {
  if (!issueDate || !validUntil) return 1;
  const issue = new Date(issueDate);
  const valid = new Date(validUntil);
  return Math.round(
    (valid.getTime() - issue.getTime()) / (365.25 * 24 * 60 * 60 * 1000)
  );
}

/**
 * Generate unique certificate number
 */
export function generateCertificateNumber(): string {
  const year = new Date().getFullYear();
  const random = Math.floor(10000 + Math.random() * 90000);
  return `ZZP-${year}-${random}`;
}
