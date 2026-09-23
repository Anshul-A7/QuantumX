"use client";

import React, { useState, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  UploadCloud,
  FileSpreadsheet,
  FileImage,
  Archive,
  X,
  AlertTriangle,
  CheckCircle2,
  Loader2,
  Play,
  Info,
  ChevronDown,
} from "lucide-react";
import {
  processBatchUpload,
  type BatchParseResult,
} from "@/lib/batchFileProcessor";
import { validateFileType, type DiseaseTarget } from "@/lib/uploadValidator";

interface BatchUploadPanelProps {
  diseaseTarget: DiseaseTarget;
  onParseComplete: (result: BatchParseResult) => void;
  onExecute: (result: BatchParseResult) => void;
  isExecuting?: boolean;
}

export default function BatchUploadPanel({
  diseaseTarget,
  onParseComplete,
  onExecute,
  isExecuting = false,
}: BatchUploadPanelProps) {
  const [dragActive, setDragActive] = useState(false);
  const [parseResult, setParseResult] = useState<BatchParseResult | null>(null);
  const [isParsing, setIsParsing] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [validationError, setValidationError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const acceptedFormats =
    diseaseTarget === "cardiac_ecg"
      ? ".jpg,.jpeg,.png,.webp,.zip"
      : ".csv,.tsv,.json,.zip,.pdf,.txt";

  const handleFiles = useCallback(
    async (files: FileList | File[]) => {
      const fileArray = Array.from(files);
      if (fileArray.length === 0) return;

      // Validate file types
      for (const file of fileArray) {
        const result = validateFileType(file, diseaseTarget);
        if (result.verdict === "rejected") {
          setValidationError(result.details || result.message);
          return;
        }
      }

      setValidationError(null);
      setSelectedFiles(fileArray);
      setIsParsing(true);

      try {
        const result = await processBatchUpload(fileArray);
        setParseResult(result);
        onParseComplete(result);
      } catch (err: any) {
        setParseResult({
          success: false,
          inputMode: "csv",
          detectedDisease: "unknown",
          totalRecords: 0,
          chunks: [],
          warnings: [],
          errors: [err.message || "Failed to parse files"],
        });
      } finally {
        setIsParsing(false);
      }
    },
    [diseaseTarget, onParseComplete],
  );

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setDragActive(false);
      if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        handleFiles(e.dataTransfer.files);
      }
    },
    [handleFiles],
  );

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files.length > 0) {
        handleFiles(e.target.files);
      }
    },
    [handleFiles],
  );

  const resetUpload = () => {
    setParseResult(null);
    setSelectedFiles([]);
    setValidationError(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const getFileIcon = (name: string) => {
    const ext = name.split(".").pop()?.toLowerCase();
    if (ext === "zip") return <Archive size={14} className="text-amber-500" />;
    if (["jpg", "jpeg", "png", "webp"].includes(ext || ""))
      return <FileImage size={14} className="text-blue-500" />;
    return <FileSpreadsheet size={14} className="text-emerald-500" />;
  };

  return (
    <div className="space-y-4">
      {/* Drop Zone */}
      {!parseResult && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className={`relative rounded-2xl border-2 border-dashed transition-all duration-200 ${
            dragActive
              ? "border-quantum bg-quantum/5 scale-[1.01]"
              : "border-hairline hover:border-ink/30 bg-cream/50"
          } ${isParsing ? "pointer-events-none opacity-60" : "cursor-pointer"}`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept={acceptedFormats}
            multiple
            onChange={handleInputChange}
            className="hidden"
          />

          <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
            {isParsing ? (
              <>
                <Loader2
                  size={36}
                  className="text-quantum animate-spin mb-3"
                />
                <p className="text-sm font-semibold text-ink">
                  Parsing uploaded files...
                </p>
                <p className="text-xs text-ink-soft mt-1">
                  Detecting columns, mapping fields, and validating data.
                </p>
              </>
            ) : (
              <>
                <div className="w-14 h-14 rounded-2xl bg-quantum/10 border border-quantum/20 flex items-center justify-center mb-4">
                  <UploadCloud size={24} className="text-quantum" />
                </div>
                <p className="text-sm font-semibold text-ink mb-1">
                  Drop batch files here, or click to browse
                </p>
                <p className="text-xs text-ink-soft max-w-md">
                  {diseaseTarget === "cardiac_ecg"
                    ? "Accepts: .JPG, .PNG, .WEBP images or .ZIP containing ECG images"
                    : "Accepts: .CSV, .TSV, .JSON, .ZIP, .PDF, .TXT containing patient biomarker data"}
                </p>
                <p className="text-[10px] text-ink-soft/60 mt-2 font-mono">
                  Max 50,000 records per session • Auto-chunks at 1,000 per
                  batch
                </p>
              </>
            )}
          </div>
        </motion.div>
      )}

      {/* Validation Error */}
      <AnimatePresence>
        {validationError && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="rounded-xl bg-red-50 border border-red-200 p-4 flex items-start gap-3"
          >
            <AlertTriangle size={18} className="text-red-500 mt-0.5 shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-semibold text-red-800">
                Upload Rejected
              </p>
              <p className="text-xs text-red-600 mt-0.5">{validationError}</p>
            </div>
            <button
              onClick={() => setValidationError(null)}
              className="text-red-400 hover:text-red-600 cursor-pointer"
            >
              <X size={16} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Parse Result Summary */}
      <AnimatePresence>
        {parseResult && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="rounded-2xl bg-white border border-hairline shadow-xs overflow-hidden"
          >
            {/* File Info Header */}
            <div className="px-5 py-4 border-b border-hairline/70 flex items-center justify-between">
              <div className="flex items-center gap-3">
                {getFileIcon(selectedFiles[0]?.name || "file.csv")}
                <div>
                  <p className="text-sm font-semibold text-ink">
                    {selectedFiles.length === 1
                      ? selectedFiles[0].name
                      : `${selectedFiles.length} files selected (${selectedFiles.slice(0, 2).map((f) => f.name).join(", ")}${selectedFiles.length > 2 ? `, +${selectedFiles.length - 2} more` : ""})`}
                  </p>
                  <p className="text-[11px] text-ink-soft">
                    {parseResult.inputMode.toUpperCase()} •{" "}
                    {parseResult.totalRecords.toLocaleString()} records detected •{" "}
                    {parseResult.chunks.length} chunk
                    {parseResult.chunks.length !== 1 ? "s" : ""}
                  </p>
                </div>
              </div>
              <button
                onClick={resetUpload}
                className="text-ink-soft hover:text-ink p-1.5 rounded-lg hover:bg-cream transition-colors cursor-pointer"
                title="Remove and re-upload"
              >
                <X size={16} />
              </button>
            </div>

            {/* Errors */}
            {parseResult.errors.length > 0 && (
              <div className="px-5 py-3 bg-red-50 border-b border-red-200">
                {parseResult.errors.map((err, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <AlertTriangle
                      size={13}
                      className="text-red-500 mt-0.5 shrink-0"
                    />
                    <p className="text-xs text-red-700">{err}</p>
                  </div>
                ))}
              </div>
            )}

            {/* Warnings */}
            {parseResult.warnings.length > 0 && (
              <div className="px-5 py-3 bg-amber-50 border-b border-amber-200">
                {parseResult.warnings.map((warn, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <Info size={13} className="text-amber-500 mt-0.5 shrink-0" />
                    <p className="text-xs text-amber-700">{warn}</p>
                  </div>
                ))}
              </div>
            )}

            {/* Column Mappings Preview */}
            {parseResult.columnMappings &&
              parseResult.columnMappings.length > 0 && (
                <div className="px-5 py-3 border-b border-hairline/50">
                  <p className="text-[11px] font-semibold text-ink-soft uppercase tracking-wide mb-2">
                    Column Mapping Preview
                  </p>
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
                    {parseResult.columnMappings
                      .filter((m) => m.canonicalField)
                      .map((m, i) => (
                        <div
                          key={i}
                          className="flex items-center gap-1.5 text-xs bg-emerald-50 border border-emerald-200 rounded-lg px-2.5 py-1.5"
                        >
                          <CheckCircle2
                            size={12}
                            className="text-emerald-500 shrink-0"
                          />
                          <span className="text-ink-soft truncate">
                            {m.sourceColumn}
                          </span>
                          <ChevronDown
                            size={10}
                            className="text-ink-soft rotate-[-90deg]"
                          />
                          <span className="font-semibold text-emerald-700 truncate">
                            {m.canonicalField}
                          </span>
                        </div>
                      ))}
                    {parseResult.columnMappings.filter((m) => !m.canonicalField)
                      .length > 0 && (
                      <div className="flex items-center gap-1.5 text-xs text-ink-soft px-2.5 py-1.5">
                        +
                        {
                          parseResult.columnMappings.filter(
                            (m) => !m.canonicalField,
                          ).length
                        }{" "}
                        unmapped columns
                      </div>
                    )}
                  </div>
                </div>
              )}

            {/* ZIP File Inventory */}
            {parseResult.fileInventory &&
              parseResult.fileInventory.length > 0 && (
                <div className="px-5 py-3 border-b border-hairline/50">
                  <p className="text-[11px] font-semibold text-ink-soft uppercase tracking-wide mb-2">
                    Archive Contents ({parseResult.fileInventory.length} files)
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {parseResult.fileInventory.slice(0, 20).map((f, i) => (
                      <span
                        key={i}
                        className="text-[10px] px-2 py-0.5 rounded-full bg-cream border border-hairline text-ink-soft font-mono"
                      >
                        {f.name}
                      </span>
                    ))}
                    {parseResult.fileInventory.length > 20 && (
                      <span className="text-[10px] px-2 py-0.5 text-ink-soft">
                        +{parseResult.fileInventory.length - 20} more
                      </span>
                    )}
                  </div>
                </div>
              )}

            {/* Execute Button */}
            {parseResult.success && parseResult.totalRecords > 0 && (
              <div className="px-5 py-4 flex items-center justify-between">
                <div className="text-xs text-ink-soft">
                  <span className="font-semibold text-ink">
                    {parseResult.totalRecords.toLocaleString()}
                  </span>{" "}
                  records ready •{" "}
                  <span className="font-mono">
                    {parseResult.detectedDisease === "breast_cancer"
                      ? "Breast Cancer"
                      : parseResult.detectedDisease === "cardiac_ecg"
                        ? "Cardiac ECG"
                        : "Auto-detect"}
                  </span>{" "}
                  pipeline
                </div>
                <button
                  onClick={() => onExecute(parseResult)}
                  disabled={isExecuting}
                  className="px-5 py-2.5 rounded-xl bg-ink hover:bg-ink/90 text-parchment font-semibold text-xs flex items-center gap-2 transition-all shadow-md cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isExecuting ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : (
                    <Play size={14} className="text-quantum" />
                  )}
                  <span>
                    {isExecuting
                      ? "Executing..."
                      : `Execute Batch (${parseResult.totalRecords.toLocaleString()} records)`}
                  </span>
                </button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
