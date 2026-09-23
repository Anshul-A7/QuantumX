"use client";

import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Search,
  Download,
  Eye,
  ChevronDown,
  CheckCircle2,
  AlertTriangle,
  ArrowUpDown,
  Filter,
  FileText,
  FileJson,
  Archive,
  Loader2,
  ArrowUp,
  Activity,
  Clock,
  BarChart3,
  XCircle,
} from "lucide-react";
import {
  type BatchSession,
  type BatchRecord,
  exportBatchAsCSV,
  exportBatchAsJSON,
  exportBatchAsPdfZip,
} from "@/services/batch.service";

interface BatchResultsTableProps {
  session: BatchSession;
  onViewDetails: (record: BatchRecord) => void;
}

type SortField = "rowIndex" | "riskScore" | "confidence" | "patientName" | "consensusStatus";
type SortDirection = "asc" | "desc";
type RiskFilter = "ALL" | "High" | "Low" | "Borderline";
type ConsensusFilter = "ALL" | "Concordant" | "Discordant";
type PageSize = 30 | 50 | 100 | 500 | "ALL";

export default function BatchResultsTable({
  session,
  onViewDetails,
}: BatchResultsTableProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [riskFilter, setRiskFilter] = useState<RiskFilter>("ALL");
  const [consensusFilter, setConsensusFilter] = useState<ConsensusFilter>("ALL");
  const [sortField, setSortField] = useState<SortField>("rowIndex");
  const [sortDir, setSortDir] = useState<SortDirection>("asc");
  const [pageSize, setPageSize] = useState<PageSize>(30);
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [pdfProgress, setPdfProgress] = useState({ current: 0, total: 0 });
  const [showScrollTop, setShowScrollTop] = useState(false);

  // Filter + Sort
  const filteredRecords = useMemo(() => {
    let records = session.records.filter((r) => r.status === "success" || r.status === "error");

    // Search
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      records = records.filter(
        (r) =>
          r.patientId.toLowerCase().includes(q) ||
          r.patientName.toLowerCase().includes(q) ||
          (r.quantumPrediction || "").toLowerCase().includes(q) ||
          (r.classicalPrediction || "").toLowerCase().includes(q),
      );
    }

    // Risk filter
    if (riskFilter !== "ALL") {
      records = records.filter((r) => r.riskLevel === riskFilter);
    }

    // Consensus filter
    if (consensusFilter !== "ALL") {
      records = records.filter((r) => r.consensusStatus === consensusFilter);
    }

    // Sort
    records.sort((a, b) => {
      let cmp = 0;
      switch (sortField) {
        case "rowIndex":
          cmp = a.rowIndex - b.rowIndex;
          break;
        case "riskScore":
          cmp = (a.quantumRiskScore || 0) - (b.quantumRiskScore || 0);
          break;
        case "confidence":
          cmp = (a.quantumConfidence || 0) - (b.quantumConfidence || 0);
          break;
        case "patientName":
          cmp = a.patientName.localeCompare(b.patientName);
          break;
        case "consensusStatus":
          cmp = (a.consensusStatus || "").localeCompare(b.consensusStatus || "");
          break;
      }
      return sortDir === "asc" ? cmp : -cmp;
    });

    return records;
  }, [session.records, searchQuery, riskFilter, consensusFilter, sortField, sortDir]);

  const displayedRecords = useMemo(() => {
    if (pageSize === "ALL") return filteredRecords;
    return filteredRecords.slice(0, pageSize);
  }, [filteredRecords, pageSize]);

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDir("asc");
    }
  };

  const handleExportPdf = async () => {
    setIsExportingPdf(true);
    setPdfProgress({ current: 0, total: session.successCount });
    try {
      await exportBatchAsPdfZip(session, (current, total) => {
        setPdfProgress({ current, total });
      });
    } finally {
      setIsExportingPdf(false);
    }
  };

  const getRiskBadge = (riskLevel?: string, riskScore?: number) => {
    const score = riskScore || 0;
    if (score >= 65 || riskLevel === "High") {
      return (
        <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-red-50 border border-red-200 text-red-700 font-bold">
          ● HIGH {score.toFixed(1)}
        </span>
      );
    }
    if (score >= 45 || riskLevel === "Borderline") {
      return (
        <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-amber-50 border border-amber-200 text-amber-700 font-bold">
          ● BORDERLINE {score.toFixed(1)}
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 font-bold">
        ● LOW {score.toFixed(1)}
      </span>
    );
  };

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    setShowScrollTop(e.currentTarget.scrollTop > 400);
  };

  return (
    <div className="space-y-4">
      {/* Summary Stats Bar */}
      <div className="rounded-2xl bg-white border border-hairline shadow-xs p-4">
        <div className="flex flex-wrap items-center gap-4 text-xs">
          <div className="flex items-center gap-2 px-3 py-2 bg-cream rounded-xl border border-hairline">
            <BarChart3 size={14} className="text-quantum" />
            <span className="text-ink-soft">Total:</span>
            <span className="font-bold text-ink">{session.totalRecords.toLocaleString()}</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-2 bg-emerald-50 rounded-xl border border-emerald-200">
            <CheckCircle2 size={14} className="text-emerald-500" />
            <span className="text-emerald-600">Success:</span>
            <span className="font-bold text-emerald-700">{session.successCount}</span>
          </div>
          {session.errorCount > 0 && (
            <div className="flex items-center gap-2 px-3 py-2 bg-red-50 rounded-xl border border-red-200">
              <XCircle size={14} className="text-red-500" />
              <span className="text-red-600">Errors:</span>
              <span className="font-bold text-red-700">{session.errorCount}</span>
            </div>
          )}
          <div className="flex items-center gap-2 px-3 py-2 bg-red-50 rounded-xl border border-red-200">
            <AlertTriangle size={14} className="text-red-500" />
            <span className="text-red-600">High Risk:</span>
            <span className="font-bold text-red-700">{session.highRiskCount}</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-2 bg-blue-50 rounded-xl border border-blue-200">
            <Activity size={14} className="text-blue-500" />
            <span className="text-blue-600">Concordant:</span>
            <span className="font-bold text-blue-700">
              {session.concordantCount} ({session.successCount > 0 ? ((session.concordantCount / session.successCount) * 100).toFixed(1) : 0}%)
            </span>
          </div>
          <div className="flex items-center gap-2 px-3 py-2 bg-purple-50 rounded-xl border border-purple-200">
            <Clock size={14} className="text-purple-500" />
            <span className="text-purple-600">Time:</span>
            <span className="font-bold text-purple-700">
              {(session.executionTimeMs / 1000).toFixed(1)}s
            </span>
          </div>
          <div className="flex items-center gap-2 px-3 py-2 bg-cream rounded-xl border border-hairline">
            <span className="text-ink-soft">Avg Risk:</span>
            <span className="font-bold text-ink">{session.averageRiskScore.toFixed(1)}</span>
          </div>
        </div>
      </div>

      {/* Controls Bar */}
      <div className="rounded-2xl bg-white border border-hairline shadow-xs p-4 flex flex-col sm:flex-row items-start sm:items-center gap-3">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px]">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-soft" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by ID, name, or prediction..."
            className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-hairline bg-cream/50 text-ink placeholder:text-ink-soft/50 focus:outline-none focus:ring-1 focus:ring-quantum/30 focus:border-quantum/30"
          />
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1">
            <Filter size={12} className="text-ink-soft" />
            <select
              value={riskFilter}
              onChange={(e) => setRiskFilter(e.target.value as RiskFilter)}
              className="text-xs rounded-lg border border-hairline bg-cream/50 px-2 py-1.5 text-ink cursor-pointer focus:outline-none"
            >
              <option value="ALL">All Risk</option>
              <option value="High">High Risk</option>
              <option value="Borderline">Borderline</option>
              <option value="Low">Low Risk</option>
            </select>
          </div>

          <select
            value={consensusFilter}
            onChange={(e) => setConsensusFilter(e.target.value as ConsensusFilter)}
            className="text-xs rounded-lg border border-hairline bg-cream/50 px-2 py-1.5 text-ink cursor-pointer focus:outline-none"
          >
            <option value="ALL">All Consensus</option>
            <option value="Concordant">Concordant</option>
            <option value="Discordant">Discordant</option>
          </select>

          <select
            value={String(pageSize)}
            onChange={(e) => setPageSize(e.target.value === "ALL" ? "ALL" : (Number(e.target.value) as PageSize))}
            className="text-xs rounded-lg border border-hairline bg-cream/50 px-2 py-1.5 text-ink cursor-pointer focus:outline-none"
          >
            <option value="30">Top 30</option>
            <option value="50">Top 50</option>
            <option value="100">Top 100</option>
            <option value="500">Top 500</option>
            <option value="ALL">All</option>
          </select>
        </div>

        {/* Export Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => exportBatchAsCSV(session)}
            className="px-3 py-1.5 rounded-lg bg-cream border border-hairline text-xs font-medium text-ink hover:bg-cream/80 flex items-center gap-1.5 cursor-pointer transition-colors"
          >
            <FileText size={12} />
            CSV
          </button>
          <button
            onClick={() => exportBatchAsJSON(session)}
            className="px-3 py-1.5 rounded-lg bg-cream border border-hairline text-xs font-medium text-ink hover:bg-cream/80 flex items-center gap-1.5 cursor-pointer transition-colors"
          >
            <FileJson size={12} />
            JSON
          </button>
          <button
            onClick={handleExportPdf}
            disabled={isExportingPdf}
            className="px-3 py-1.5 rounded-lg bg-ink text-parchment text-xs font-semibold hover:bg-ink/90 flex items-center gap-1.5 cursor-pointer transition-colors disabled:opacity-50"
          >
            {isExportingPdf ? (
              <>
                <Loader2 size={12} className="animate-spin" />
                {pdfProgress.current}/{pdfProgress.total}
              </>
            ) : (
              <>
                <Archive size={12} />
                PDF ZIP
              </>
            )}
          </button>
        </div>
      </div>

      {/* Results count */}
      <div className="text-[11px] text-ink-soft px-1">
        Showing <span className="font-semibold text-ink">{displayedRecords.length}</span> of{" "}
        <span className="font-semibold text-ink">{filteredRecords.length}</span> records
        {filteredRecords.length !== session.records.length && (
          <span> (filtered from {session.records.length} total)</span>
        )}
      </div>

      {/* Table */}
      <div
        className="rounded-2xl bg-white border border-hairline shadow-xs overflow-hidden"
        onScroll={handleScroll}
      >
        <div className="overflow-x-auto max-h-[70vh] overflow-y-auto">
          <table className="w-full text-xs">
            <thead className="sticky top-0 z-10 bg-cream border-b border-hairline">
              <tr>
                <th
                  className="px-3 py-3 text-left font-semibold text-ink-soft cursor-pointer hover:text-ink transition-colors"
                  onClick={() => toggleSort("rowIndex")}
                >
                  <div className="flex items-center gap-1">
                    # <ArrowUpDown size={10} className={sortField === "rowIndex" ? "text-quantum" : ""} />
                  </div>
                </th>
                <th className="px-3 py-3 text-left font-semibold text-ink-soft">Patient ID</th>
                <th
                  className="px-3 py-3 text-left font-semibold text-ink-soft cursor-pointer hover:text-ink transition-colors"
                  onClick={() => toggleSort("patientName")}
                >
                  <div className="flex items-center gap-1">
                    Name <ArrowUpDown size={10} className={sortField === "patientName" ? "text-quantum" : ""} />
                  </div>
                </th>
                <th className="px-3 py-3 text-left font-semibold text-ink-soft">Quantum</th>
                <th className="px-3 py-3 text-left font-semibold text-ink-soft">Classical</th>
                <th
                  className="px-3 py-3 text-left font-semibold text-ink-soft cursor-pointer hover:text-ink transition-colors"
                  onClick={() => toggleSort("riskScore")}
                >
                  <div className="flex items-center gap-1">
                    Risk <ArrowUpDown size={10} className={sortField === "riskScore" ? "text-quantum" : ""} />
                  </div>
                </th>
                <th
                  className="px-3 py-3 text-left font-semibold text-ink-soft cursor-pointer hover:text-ink transition-colors"
                  onClick={() => toggleSort("consensusStatus")}
                >
                  <div className="flex items-center gap-1">
                    Consensus <ArrowUpDown size={10} className={sortField === "consensusStatus" ? "text-quantum" : ""} />
                  </div>
                </th>
                <th className="px-3 py-3 text-right font-semibold text-ink-soft">Action</th>
              </tr>
            </thead>
            <tbody>
              <AnimatePresence>
                {displayedRecords.map((record, i) => (
                  <motion.tr
                    key={record.rowIndex}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: Math.min(i * 0.01, 0.3) }}
                    className={`border-b border-hairline/50 hover:bg-cream/50 transition-colors ${
                      record.status === "error" ? "bg-red-50/30" : ""
                    }`}
                  >
                    <td className="px-3 py-2.5 font-mono text-ink-soft">
                      {record.rowIndex + 1}
                    </td>
                    <td className="px-3 py-2.5">
                      <span className="font-mono text-[10px] bg-cream px-1.5 py-0.5 rounded border border-hairline text-ink-soft">
                        {record.patientId}
                      </span>
                    </td>
                    <td className="px-3 py-2.5 font-medium text-ink">
                      {record.patientName}
                    </td>
                    <td className="px-3 py-2.5">
                      {record.status === "error" ? (
                        <span className="text-red-500 text-[10px]">Error</span>
                      ) : (
                        <span
                          className={
                            record.quantumPrediction === "Malignant" || record.quantumPrediction?.includes("Infarction")
                              ? "text-red-600 font-semibold"
                              : "text-emerald-600 font-medium"
                          }
                        >
                          {record.quantumPrediction || "—"}
                        </span>
                      )}
                    </td>
                    <td className="px-3 py-2.5">
                      {record.status === "error" ? (
                        <span className="text-red-500 text-[10px]">—</span>
                      ) : (
                        <span
                          className={
                            record.classicalPrediction === "Malignant" || record.classicalPrediction?.includes("Infarction")
                              ? "text-red-600 font-semibold"
                              : "text-emerald-600 font-medium"
                          }
                        >
                          {record.classicalPrediction || "—"}
                        </span>
                      )}
                    </td>
                    <td className="px-3 py-2.5">
                      {record.status === "success"
                        ? getRiskBadge(record.riskLevel, record.quantumRiskScore)
                        : <span className="text-red-500 text-[10px]">—</span>}
                    </td>
                    <td className="px-3 py-2.5">
                      {record.consensusStatus === "Concordant" ? (
                        <span className="inline-flex items-center gap-1 text-[10px] text-emerald-600 font-semibold">
                          <CheckCircle2 size={12} /> Concordant
                        </span>
                      ) : record.consensusStatus === "Discordant" ? (
                        <span className="inline-flex items-center gap-1 text-[10px] text-amber-600 font-semibold">
                          <AlertTriangle size={12} /> Discordant
                        </span>
                      ) : (
                        <span className="text-ink-soft text-[10px]">—</span>
                      )}
                    </td>
                    <td className="px-3 py-2.5 text-right">
                      {record.status === "success" && (
                        <button
                          onClick={() => onViewDetails(record)}
                          className="px-2.5 py-1 rounded-lg bg-cream border border-hairline text-[10px] font-medium text-ink hover:bg-ink hover:text-parchment transition-all cursor-pointer flex items-center gap-1 ml-auto"
                        >
                          <Eye size={11} /> View
                        </button>
                      )}
                      {record.status === "error" && (
                        <span className="text-[10px] text-red-500 italic truncate max-w-[100px] block ml-auto" title={record.error}>
                          {record.error}
                        </span>
                      )}
                    </td>
                  </motion.tr>
                ))}
              </AnimatePresence>
            </tbody>
          </table>
        </div>
      </div>

      {/* Scroll to Top */}
      <AnimatePresence>
        {showScrollTop && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            className="fixed bottom-8 right-8 w-10 h-10 rounded-full bg-ink text-parchment shadow-lg flex items-center justify-center cursor-pointer z-50 hover:bg-ink/90 transition-colors"
          >
            <ArrowUp size={18} />
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
}
