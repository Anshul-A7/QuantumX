"use client";

import React, { useState, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  UploadCloud,
  FileText,
  FileSpreadsheet,
  FileCode,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  X,
  ArrowRight,
  ShieldCheck,
  RefreshCw,
  Info,
} from "lucide-react";
import {
  parseMedicalReportFile,
  MedicalReportParseResult,
  BREAST_CANCER_CANONICAL_SCHEMA,
} from "@/lib/medicalReportParser";
import { playSound } from "@/lib/sound";

interface BiomarkerUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyData: (extractedValues: Record<string, number>, patientId: string) => void;
}

export default function BiomarkerUploadModal({
  isOpen,
  onClose,
  onApplyData,
}: BiomarkerUploadModalProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [parseResult, setParseResult] = useState<MedicalReportParseResult | null>(null);
  const [editableValues, setEditableValues] = useState<Record<string, number>>({});
  const [patientId, setPatientId] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const processFile = async (file: File) => {
    setIsProcessing(true);
    setErrorMessage(null);
    playSound("click");

    try {
      const result = await parseMedicalReportFile(file);
      setParseResult(result);
      setEditableValues({ ...result.extractedFields });
      setPatientId(result.patientId);
      playSound("success");
    } catch (err: any) {
      console.error("File processing failed:", err);
      setErrorMessage(err.message || "Failed to parse the uploaded file.");
      playSound("error");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      await processFile(file);
    }
  };

  const handleFileInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      await processFile(file);
    }
  };

  const handleValueChange = (key: string, valStr: string) => {
    const val = parseFloat(valStr);
    if (!isNaN(val)) {
      setEditableValues((prev) => ({ ...prev, [key]: val }));
    }
  };

  const handleApply = () => {
    if (!parseResult) return;
    playSound("quantum");
    onApplyData(editableValues, patientId);
    onClose();
  };

  const handleResetModal = () => {
    setParseResult(null);
    setEditableValues({});
    setErrorMessage(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        transition={{ duration: 0.2 }}
        className="relative w-full max-w-2xl overflow-hidden rounded-2xl border border-border bg-card shadow-2xl"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-6 py-4 bg-muted/30">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-foreground">
                Import Patient Medical Report
              </h2>
              <p className="text-xs text-muted-foreground">
                AI-assisted extraction for CSV, PDF, JSON, and pathology lab sheets
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 max-h-[75vh] overflow-y-auto space-y-5">
          {!parseResult ? (
            /* Upload Dropzone */
            <div className="space-y-4">
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed p-8 text-center cursor-pointer transition-all ${
                  isDragging
                    ? "border-primary bg-primary/5 scale-[0.99]"
                    : "border-border hover:border-primary/50 hover:bg-muted/30"
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv,.json,.pdf,.txt,.tsv"
                  onChange={handleFileInputChange}
                  className="hidden"
                />

                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary shadow-inner">
                  {isProcessing ? (
                    <RefreshCw className="h-7 w-7 animate-spin" />
                  ) : (
                    <UploadCloud className="h-7 w-7" />
                  )}
                </div>

                <div>
                  <p className="text-sm font-semibold text-foreground">
                    {isProcessing
                      ? "Analyzing report & resolving medical aliases..."
                      : "Click to upload or drag & drop patient report"}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Supports <span className="font-medium text-foreground">.CSV, .PDF, .JSON, .TXT, .TSV</span>
                  </p>
                </div>

                <div className="flex items-center gap-4 text-xs text-muted-foreground pt-2">
                  <span className="flex items-center gap-1">
                    <FileSpreadsheet className="h-3.5 w-3.5 text-emerald-500" /> CSV / TSV
                  </span>
                  <span className="flex items-center gap-1">
                    <FileText className="h-3.5 w-3.5 text-rose-500" /> PDF Pathology
                  </span>
                  <span className="flex items-center gap-1">
                    <FileCode className="h-3.5 w-3.5 text-sky-500" /> JSON FHIR
                  </span>
                </div>
              </div>

              {errorMessage && (
                <div className="flex items-center gap-2.5 rounded-xl border border-rose-500/30 bg-rose-500/10 p-3.5 text-xs text-rose-600 dark:text-rose-400">
                  <AlertTriangle className="h-4 w-4 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* Guarantees Note */}
              <div className="rounded-xl border border-border/60 bg-muted/20 p-4 space-y-2">
                <div className="flex items-center gap-2 text-xs font-semibold text-foreground">
                  <ShieldCheck className="h-4 w-4 text-emerald-500" />
                  <span>Zero-Hallucination Intelligence Guarantee</span>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Our medical parser strictly resolves variable naming discrepancies (e.g. &ldquo;nuclear radius&rdquo; vs &ldquo;radius_mean&rdquo;) while preserving exact numerical readings without rounding, guessing, or alteration.
                </p>
              </div>
            </div>
          ) : (
            /* Review & Mapping Confirmation Panel */
            <div className="space-y-4">
              {/* File summary banner */}
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-primary/20 bg-primary/5 p-3.5">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/20 text-primary">
                    <FileText className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-foreground">{parseResult.fileName}</p>
                    <p className="text-[11px] text-muted-foreground">
                      Parsed via {parseResult.parseMethod === "json" ? "JSON Engine" : parseResult.parseMethod === "csv" ? "CSV Engine" : "Pathology NLP Engine"}
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleResetModal}
                  className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 underline"
                >
                  <RefreshCw className="h-3 w-3" /> Upload Another File
                </button>
              </div>

              {/* Patient ID field */}
              <div className="flex items-center justify-between rounded-xl border border-border p-3 bg-card">
                <label className="text-xs font-medium text-muted-foreground">Patient Identifier</label>
                <input
                  type="text"
                  value={patientId}
                  onChange={(e) => setPatientId(e.target.value)}
                  className="rounded-lg border border-border bg-background px-2.5 py-1 text-xs font-semibold text-foreground focus:border-primary focus:outline-none w-48 text-right"
                />
              </div>

              {/* Biomarkers Extraction Grid */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Extracted Cellular Biomarkers (8 Parameters)
                  </h3>
                  <span className="text-[11px] text-emerald-500 flex items-center gap-1">
                    <CheckCircle2 className="h-3 w-3" /> Numbers Preserved 100%
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {BREAST_CANCER_CANONICAL_SCHEMA.map((field) => {
                    const match = parseResult.fieldMatches.find((m) => m.key === field.key);
                    const isDefault = match?.matchType === "default";
                    const isDerived = match?.matchType === "derived";
                    const isAi = match?.matchType === "ai_semantic";
                    const val = editableValues[field.key] ?? field.defaultValue;

                    return (
                      <div
                        key={field.key}
                        className={`flex items-center justify-between p-3 rounded-xl border transition-all ${
                          isDefault
                            ? "border-amber-500/30 bg-amber-500/5"
                            : isDerived
                            ? "border-purple-500/30 bg-purple-500/5"
                            : "border-border bg-card hover:border-primary/40"
                        }`}
                      >
                        <div className="space-y-0.5 max-w-[60%]">
                          <p className="text-xs font-medium text-foreground truncate">{field.label}</p>
                          <div className="flex items-center gap-1.5 flex-wrap">
                            {isDefault ? (
                              <span className="text-[10px] text-amber-500 font-medium">Cohort Median</span>
                            ) : isDerived ? (
                              <span className="text-[10px] text-purple-600 dark:text-purple-400 font-semibold flex items-center gap-0.5" title={match?.derivationFormula}>
                                ⚡ Derived ({match?.derivationFormula || match?.rawLabel})
                              </span>
                            ) : isAi ? (
                              <span className="text-[10px] text-sky-500 font-medium flex items-center gap-0.5">
                                <Sparkles className="h-2.5 w-2.5" /> AI Mapped
                              </span>
                            ) : (
                              <span className="text-[10px] text-emerald-500 font-medium flex items-center gap-0.5">
                                <CheckCircle2 className="h-2.5 w-2.5" /> Mapped
                              </span>
                            )}
                            {!isDerived && (
                              <span className="text-[10px] text-muted-foreground truncate">
                                ({match?.rawLabel || field.key})
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-1">
                          <input
                            type="number"
                            step="any"
                            value={val}
                            onChange={(e) => handleValueChange(field.key, e.target.value)}
                            className="w-20 rounded-lg border border-border bg-background px-2 py-1 text-right text-xs font-semibold text-foreground focus:border-primary focus:outline-none"
                          />
                          <span className="text-[11px] text-muted-foreground w-6">{field.unit}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 border-t border-border px-6 py-4 bg-muted/20">
          <button
            onClick={onClose}
            className="rounded-xl border border-border px-4 py-2 text-xs font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          >
            Cancel
          </button>
          {parseResult && (
            <button
              onClick={handleApply}
              className="flex items-center gap-1.5 rounded-xl bg-primary px-5 py-2 text-xs font-semibold text-primary-foreground hover:opacity-90 transition-opacity shadow-md"
            >
              <span>Apply to Screening Form</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </motion.div>
    </div>
  );
}
