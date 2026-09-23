/**
 * ====================================================================================================
 * QuantumX — Batch File Processor
 * ====================================================================================================
 * Parses, validates, and chunks multi-record uploads for batch screening.
 *
 * Supported input formats:
 *   - CSV / TSV  → PapaParse auto-detection with fuzzy column mapping
 *   - JSON       → Array of objects or single object
 *   - ZIP        → Decompresses and inspects contents (images → ECG batch, CSVs → tabular batch)
 *   - PDF bulk   → Each PDF treated as individual patient record
 *   - Image bulk → Each image treated as individual ECG record
 *
 * Auto-chunking: Splits parsed records into groups of BATCH_CHUNK_SIZE (1,000).
 * Disease auto-detection: Inspects column names / file types to determine target module.
 * ====================================================================================================
 */

import Papa from "papaparse";
import JSZip from "jszip";
import { parseMedicalReportFile } from "./medicalReportParser";
import { type DiseaseTarget } from "./uploadValidator";

// ── Constants ───────────────────────────────────────────────────────────────────

export const BATCH_CHUNK_SIZE = 1000;
export const MAX_RECORDS_PER_SESSION = 50000;

// ── Types ───────────────────────────────────────────────────────────────────────

export type BatchInputMode = "csv" | "tsv" | "json" | "zip" | "pdf_bulk" | "image_bulk";

export interface ParsedRecord {
  rowIndex: number;
  patientId: string;
  patientName: string;
  data: Record<string, number>; // mapped biomarker values
  rawRow?: Record<string, string | number>; // original row data
  imageBase64?: string; // for ECG image records
  imageName?: string;
  pdfText?: string;
}

export interface ColumnMapping {
  sourceColumn: string;
  canonicalField: string | null;
  confidence: number; // 0.0 – 1.0
  sampleValues: (string | number)[];
}

export interface BatchChunk {
  chunkIndex: number;
  totalChunks: number;
  records: ParsedRecord[];
}

export interface BatchParseResult {
  success: boolean;
  inputMode: BatchInputMode;
  detectedDisease: "breast_cancer" | "cardiac_ecg" | "unknown";
  totalRecords: number;
  chunks: BatchChunk[];
  columnMappings?: ColumnMapping[];
  fileInventory?: { name: string; type: string; size: number }[];
  warnings: string[];
  errors: string[];
}

// ── Canonical Aliases for Breast Cancer Biomarkers ──────────────────────────────

const BREAST_CANCER_ALIASES: Record<string, string[]> = {
  radius_mean: [
    "radius_mean", "radius mean", "radius", "cell size", "cell_size", "nuclear radius",
    "nuclear_radius", "mean radius", "mean_radius", "rad_mean", "r_mean",
  ],
  texture_mean: [
    "texture_mean", "texture mean", "texture", "surface texture", "surface_texture",
    "gray scale", "gray_scale", "grayscale", "tex_mean", "t_mean",
  ],
  perimeter_mean: [
    "perimeter_mean", "perimeter mean", "perimeter", "cell perimeter", "cell_perimeter",
    "nuclear perimeter", "peri_mean", "p_mean",
  ],
  area_mean: [
    "area_mean", "area mean", "area", "nuclear area", "nuclear_area", "cell area",
    "cell_area", "a_mean",
  ],
  smoothness_mean: [
    "smoothness_mean", "smoothness mean", "smoothness", "border smoothness",
    "border_smoothness", "smooth_mean", "s_mean",
  ],
  compactness_mean: [
    "compactness_mean", "compactness mean", "compactness", "compactness index",
    "compactness_index", "comp_mean", "c_mean",
  ],
  concavity_mean: [
    "concavity_mean", "concavity mean", "concavity", "indentation depth",
    "indentation_depth", "concav_mean",
  ],
  concave_points_mean: [
    "concave_points_mean", "concave points mean", "concave points", "concave_points",
    "indentation count", "indentation_count", "cp_mean", "concavepoints_mean",
    "concave_points_mean",
  ],
};

// Additional WDBC dataset columns we can accept but don't use for inference
const WDBC_ID_ALIASES = ["id", "patient_id", "patient id", "patientid", "case_id", "case id", "record_id"];
const WDBC_NAME_ALIASES = ["patient_name", "patient name", "patientname", "name", "full_name", "full name"];
const WDBC_DIAGNOSIS_ALIASES = ["diagnosis", "dx", "label", "target", "class", "outcome"];

// ── Fuzzy Column Mapping ────────────────────────────────────────────────────────

function normalizeColumnName(col: string): string {
  return col.toLowerCase().trim().replace(/[^a-z0-9]/g, "_").replace(/_+/g, "_").replace(/^_|_$/g, "");
}

function mapColumn(sourceColumn: string): { canonicalField: string | null; confidence: number } {
  const normalized = normalizeColumnName(sourceColumn);

  for (const [canonical, aliases] of Object.entries(BREAST_CANCER_ALIASES)) {
    for (const alias of aliases) {
      const normalizedAlias = normalizeColumnName(alias);
      if (normalized === normalizedAlias) {
        return { canonicalField: canonical, confidence: 1.0 };
      }
    }
  }

  // Partial match
  for (const [canonical, aliases] of Object.entries(BREAST_CANCER_ALIASES)) {
    for (const alias of aliases) {
      const normalizedAlias = normalizeColumnName(alias);
      if (normalized.includes(normalizedAlias) || normalizedAlias.includes(normalized)) {
        return { canonicalField: canonical, confidence: 0.75 };
      }
    }
  }

  return { canonicalField: null, confidence: 0 };
}

function findIdColumn(headers: string[]): string | null {
  for (const h of headers) {
    const norm = normalizeColumnName(h);
    if (WDBC_ID_ALIASES.some((a) => normalizeColumnName(a) === norm)) return h;
  }
  return null;
}

function findNameColumn(headers: string[]): string | null {
  for (const h of headers) {
    const norm = normalizeColumnName(h);
    if (WDBC_NAME_ALIASES.some((a) => normalizeColumnName(a) === norm)) return h;
  }
  return null;
}

// ── CSV/TSV Parser ──────────────────────────────────────────────────────────────

async function parseCSV(file: File): Promise<BatchParseResult> {
  return new Promise((resolve) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      dynamicTyping: true,
      complete: (results) => {
        const warnings: string[] = [];
        const errors: string[] = [];

        if (!results.data || results.data.length === 0) {
          resolve({
            success: false,
            inputMode: "csv",
            detectedDisease: "unknown",
            totalRecords: 0,
            chunks: [],
            warnings: [],
            errors: ["CSV file is empty or has no parseable rows."],
          });
          return;
        }

        const headers = results.meta.fields || [];
        if (headers.length === 0) {
          resolve({
            success: false,
            inputMode: "csv",
            detectedDisease: "unknown",
            totalRecords: 0,
            chunks: [],
            warnings: [],
            errors: ["CSV file has no headers. Please ensure the first row contains column names."],
          });
          return;
        }

        // Build column mappings
        const columnMappings: ColumnMapping[] = headers.map((h) => {
          const { canonicalField, confidence } = mapColumn(h);
          const samples = (results.data as Record<string, unknown>[])
            .slice(0, 3)
            .map((row) => row[h] as string | number)
            .filter((v) => v !== undefined && v !== null && v !== "");
          return { sourceColumn: h, canonicalField, confidence, sampleValues: samples };
        });

        const mappedFields = columnMappings.filter((m) => m.canonicalField !== null);

        if (mappedFields.length === 0) {
          // No breast cancer fields detected — maybe it's just a raw data CSV
          warnings.push(
            "No standard breast cancer biomarker columns detected. If this is a different disease dataset, column mapping may need manual adjustment.",
          );
        }

        const idColumn = findIdColumn(headers);
        const nameColumn = findNameColumn(headers);

        // Parse records
        const records: ParsedRecord[] = [];
        const rows = results.data as Record<string, unknown>[];

        for (let i = 0; i < Math.min(rows.length, MAX_RECORDS_PER_SESSION); i++) {
          const row = rows[i];
          const data: Record<string, number> = {};

          for (const mapping of mappedFields) {
            if (mapping.canonicalField) {
              const rawVal = row[mapping.sourceColumn];
              const num = parseFloat(String(rawVal));
              if (!isNaN(num)) {
                data[mapping.canonicalField] = num;
              }
            }
          }

          records.push({
            rowIndex: i,
            patientId: idColumn ? String(row[idColumn] || `QX-BATCH-${String(i + 1).padStart(4, "0")}`) : `QX-BATCH-${String(i + 1).padStart(4, "0")}`,
            patientName: nameColumn ? String(row[nameColumn] || `Patient ${i + 1}`) : `Patient ${i + 1}`,
            data,
            rawRow: row as Record<string, string | number>,
          });
        }

        if (rows.length > MAX_RECORDS_PER_SESSION) {
          warnings.push(
            `File contains ${rows.length.toLocaleString()} rows. Only the first ${MAX_RECORDS_PER_SESSION.toLocaleString()} records will be processed.`,
          );
        }

        // Chunk records
        const chunks = chunkRecords(records);

        resolve({
          success: true,
          inputMode: file.name.toLowerCase().endsWith(".tsv") ? "tsv" : "csv",
          detectedDisease: mappedFields.length >= 3 ? "breast_cancer" : "unknown",
          totalRecords: records.length,
          chunks,
          columnMappings,
          warnings,
          errors,
        });
      },
      error: (err) => {
        resolve({
          success: false,
          inputMode: "csv",
          detectedDisease: "unknown",
          totalRecords: 0,
          chunks: [],
          warnings: [],
          errors: [`CSV parsing error: ${err.message}`],
        });
      },
    });
  });
}

// ── JSON Parser ─────────────────────────────────────────────────────────────────

function extractRecordFromJSONItem(
  item: any,
  fallbackIndex: number,
  fallbackFileName: string,
): ParsedRecord | null {
  if (!item || typeof item !== "object") return null;

  const candidateSource: Record<string, any> = {
    ...item,
    ...(typeof item.biomarkers === "object" && item.biomarkers !== null ? item.biomarkers : {}),
    ...(typeof item.features === "object" && item.features !== null ? item.features : {}),
    ...(typeof item.measurements === "object" && item.measurements !== null ? item.measurements : {}),
    ...(typeof item.values === "object" && item.values !== null ? item.values : {}),
    ...(typeof item.data === "object" && item.data !== null ? item.data : {}),
  };

  const data: Record<string, number> = {};

  for (const [canonical, aliases] of Object.entries(BREAST_CANCER_ALIASES)) {
    for (const alias of aliases) {
      const normalizedAlias = normalizeColumnName(alias);
      for (const key of Object.keys(candidateSource)) {
        if (normalizeColumnName(key) === normalizedAlias) {
          const num = parseFloat(String(candidateSource[key]));
          if (!isNaN(num)) {
            data[canonical] = num;
            break;
          }
        }
      }
      if (data[canonical] !== undefined) break;
    }
  }

  const cleanFallbackName = fallbackFileName.replace(/\.[^.]+$/, "").replace(/[-_]/g, " ");
  const patientId = String(
    item.patient_id || item.patientId || item.id ||
    candidateSource.patient_id || candidateSource.patientId || candidateSource.id ||
    `QX-BATCH-${String(fallbackIndex + 1).padStart(4, "0")}`
  );
  const patientName = String(
    item.patient_name || item.patientName || item.name ||
    candidateSource.patient_name || candidateSource.patientName || candidateSource.name ||
    cleanFallbackName
  );

  return {
    rowIndex: fallbackIndex,
    patientId,
    patientName,
    data,
    rawRow: candidateSource,
  };
}

async function parseJSONFiles(files: File[]): Promise<BatchParseResult> {
  const warnings: string[] = [];
  const errors: string[] = [];
  const records: ParsedRecord[] = [];
  const fileInventory = files.map((f) => ({
    name: f.name,
    type: "json",
    size: f.size,
  }));

  for (const file of files) {
    try {
      const text = await file.text();
      let parsed = JSON.parse(text);

      if (!Array.isArray(parsed)) {
        parsed = [parsed];
      }

      for (let i = 0; i < parsed.length; i++) {
        if (records.length >= MAX_RECORDS_PER_SESSION) {
          warnings.push(`Maximum batch limit of ${MAX_RECORDS_PER_SESSION.toLocaleString()} records reached.`);
          break;
        }

        const rec = extractRecordFromJSONItem(parsed[i], records.length, file.name);
        if (rec) {
          records.push(rec);
        }
      }
    } catch (err: any) {
      errors.push(`Error parsing ${file.name}: ${err.message || "Invalid JSON syntax"}`);
    }
  }

  if (records.length === 0) {
    return {
      success: false,
      inputMode: "json",
      detectedDisease: "unknown",
      totalRecords: 0,
      chunks: [],
      fileInventory,
      warnings,
      errors: errors.length > 0 ? errors : ["JSON file(s) contain no valid patient records."],
    };
  }

  const mappedCount = Object.keys(records[0]?.data || {}).length;
  const chunks = chunkRecords(records);

  return {
    success: true,
    inputMode: "json",
    detectedDisease: mappedCount >= 3 ? "breast_cancer" : "unknown",
    totalRecords: records.length,
    chunks,
    fileInventory,
    warnings,
    errors,
  };
}

async function parseJSON(file: File): Promise<BatchParseResult> {
  return parseJSONFiles([file]);
}

// ── PDF ECG Image Extractor ────────────────────────────────────────────────────

/**
 * Extracts embedded 12-lead ECG JPEG images from PDF byte streams.
 */
export function extractEcgImageFromPdfBytes(bytes: Uint8Array): { bytes: Uint8Array; dataUrl: string } | null {
  const len = bytes.length;
  let bestStart = -1;
  let bestEnd = -1;
  let maxLen = 0;

  for (let i = 0; i < len - 4; i++) {
    // Check for JPEG SOI (Start of Image): 0xFF, 0xD8, 0xFF
    if (bytes[i] === 0xff && bytes[i + 1] === 0xd8 && bytes[i + 2] === 0xff) {
      const start = i;
      // Search for JPEG EOI (End of Image): 0xFF, 0xD9
      for (let j = start + 3; j < len - 1; j++) {
        if (bytes[j] === 0xff && bytes[j + 1] === 0xd9) {
          const imgLen = j + 2 - start;
          // An ECG recording is typically > 5KB
          if (imgLen > maxLen && imgLen > 5000) {
            maxLen = imgLen;
            bestStart = start;
            bestEnd = j + 2;
          }
          i = j + 1;
          break;
        }
      }
    }
  }

  if (bestStart !== -1 && bestEnd !== -1) {
    const sub = bytes.subarray(bestStart, bestEnd);
    let binary = "";
    const chunkSize = 8192;
    for (let k = 0; k < sub.length; k += chunkSize) {
      binary += String.fromCharCode.apply(null, Array.from(sub.subarray(k, k + chunkSize)));
    }
    const base64 = btoa(binary);
    return {
      bytes: sub,
      dataUrl: `data:image/jpeg;base64,${base64}`,
    };
  }

  return null;
}

export async function extractEcgImageFromPdfFile(file: File): Promise<string | null> {
  const arrayBuffer = await file.arrayBuffer();
  const bytes = new Uint8Array(arrayBuffer);
  const result = extractEcgImageFromPdfBytes(bytes);
  return result ? result.dataUrl : null;
}

export async function parseZIP(
  file: File,
  targetDisease?: DiseaseTarget,
): Promise<BatchParseResult> {
  const warnings: string[] = [];
  const errors: string[] = [];

  try {
    const arrayBuffer = await file.arrayBuffer();
    const zip = await JSZip.loadAsync(arrayBuffer);

    const fileInventory: { name: string; type: string; size: number }[] = [];
    const imageFiles: { name: string; data: Uint8Array }[] = [];
    const csvFiles: { name: string; text: string }[] = [];
    const jsonFiles: { name: string; text: string }[] = [];
    const pdfFiles: { name: string; data: Uint8Array }[] = [];
    const txtFiles: { name: string; text: string }[] = [];

    const imageExtensions = new Set(["jpg", "jpeg", "png", "webp", "bmp"]);
    const csvExtensions = new Set(["csv", "tsv"]);

    for (const [path, entry] of Object.entries(zip.files)) {
      if (entry.dir) continue;
      const ext = path.split(".").pop()?.toLowerCase() || "";
      const name = path.split("/").pop() || path;

      if (name.startsWith("__MACOSX") || name.startsWith(".")) continue;

      const data = await entry.async("uint8array");
      fileInventory.push({ name, type: ext, size: data.length });

      if (imageExtensions.has(ext)) {
        imageFiles.push({ name, data });
      } else if (csvExtensions.has(ext)) {
        const text = new TextDecoder().decode(data);
        csvFiles.push({ name, text });
      } else if (ext === "json") {
        const text = new TextDecoder().decode(data);
        jsonFiles.push({ name, text });
      } else if (ext === "pdf") {
        pdfFiles.push({ name, data });
      } else if (ext === "txt") {
        const text = new TextDecoder().decode(data);
        txtFiles.push({ name, text });
      }
    }

    // ── If Cardiac ECG mode and archive contains PDFs, inspect them for embedded ECG images ──
    if (targetDisease === "cardiac_ecg" && pdfFiles.length > 0) {
      for (const pdf of pdfFiles) {
        const ecgImage = extractEcgImageFromPdfBytes(pdf.data);
        if (ecgImage) {
          imageFiles.push({
            name: pdf.name.replace(/\.pdf$/i, ".jpg"),
            data: ecgImage.bytes,
          });
        }
      }
    }

    // ── Modality Gatekeeper: Heart Attack / Cardiac ECG ──
    if (targetDisease === "cardiac_ecg") {
      if (imageFiles.length === 0 && (csvFiles.length > 0 || jsonFiles.length > 0 || pdfFiles.length > 0 || txtFiles.length > 0)) {
        const summary = [
          csvFiles.length > 0 ? `${csvFiles.length} CSV/TSV` : "",
          jsonFiles.length > 0 ? `${jsonFiles.length} JSON` : "",
          pdfFiles.length > 0 ? `${pdfFiles.length} pathology PDF report(s)` : "",
          txtFiles.length > 0 ? `${txtFiles.length} TXT report(s)` : "",
        ]
          .filter(Boolean)
          .join(", ");
        return {
          success: false,
          inputMode: "zip",
          detectedDisease: "breast_cancer",
          totalRecords: 0,
          chunks: [],
          fileInventory,
          warnings,
          errors: [
            `This ZIP archive contains tabular cellular biomarker data (${summary}), not 12-lead ECG waveforms. The Cardiac ECG Studio exclusively processes 12-lead ECG waveform scans (.JPG, .PNG, .WEBP) or ECG PDFs containing waveform scans. For tabular cellular biomarker screening, please switch to the Breast Cancer Screening Studio.`,
          ],
        };
      }
    }

    // ── Modality Gatekeeper: Breast Cancer ──
    if (targetDisease === "breast_cancer") {
      if (imageFiles.length > 0 && csvFiles.length === 0 && jsonFiles.length === 0 && pdfFiles.length === 0 && txtFiles.length === 0) {
        return {
          success: false,
          inputMode: "zip",
          detectedDisease: "cardiac_ecg",
          totalRecords: 0,
          chunks: [],
          fileInventory,
          warnings,
          errors: [
            `Image files / ECG scans cannot be processed in the Breast Cancer Screening Studio. This ZIP archive contains ${imageFiles.length} 12-lead ECG image scans. The Breast Cancer Screening Studio exclusively processes tabular biopsy data (.CSV, .JSON, .PDF lab reports). For 12-lead ECG waveform analysis, please switch to the Heart Attack & Cardiac ECG Studio.`,
          ],
        };
      }
    }

    // 1. Image batch → ECG mode
    if (imageFiles.length > 0 && csvFiles.length === 0 && jsonFiles.length === 0 && pdfFiles.length === 0 && txtFiles.length === 0) {
      if (targetDisease === "breast_cancer") {
        return {
          success: false,
          inputMode: "zip",
          detectedDisease: "cardiac_ecg",
          totalRecords: 0,
          chunks: [],
          fileInventory,
          warnings,
          errors: [
            `Image files cannot be processed in the Breast Cancer Screening Studio. This archive contains ${imageFiles.length} ECG image scans. Please switch to the Heart Attack & Cardiac ECG Studio.`,
          ],
        };
      }

      const records: ParsedRecord[] = imageFiles.slice(0, MAX_RECORDS_PER_SESSION).map((img, i) => {
        const base64 = btoa(
          Array.from(img.data)
            .map((b) => String.fromCharCode(b))
            .join(""),
        );
        return {
          rowIndex: i,
          patientId: `QX-ECG-${String(i + 1).padStart(4, "0")}`,
          patientName: img.name.replace(/\.[^.]+$/, ""),
          data: {},
          imageBase64: `data:image/jpeg;base64,${base64}`,
          imageName: img.name,
        };
      });

      return {
        success: true,
        inputMode: "zip",
        detectedDisease: "cardiac_ecg",
        totalRecords: records.length,
        chunks: chunkRecords(records),
        fileInventory,
        warnings,
        errors,
      };
    }

    // 2. CSV batch
    if (csvFiles.length > 0) {
      const allRecords: ParsedRecord[] = [];
      let globalIndex = 0;

      for (const csvFile of csvFiles) {
        const parsed = Papa.parse(csvFile.text, {
          header: true,
          skipEmptyLines: true,
          dynamicTyping: true,
        });

        if (!parsed.data || !parsed.meta.fields) continue;

        const mappedFields = parsed.meta.fields.filter((h) => mapColumn(h).canonicalField !== null);
        const idColumn = findIdColumn(parsed.meta.fields);
        const nameColumn = findNameColumn(parsed.meta.fields);

        for (const row of parsed.data as Record<string, unknown>[]) {
          const data: Record<string, number> = {};
          for (const h of parsed.meta.fields!) {
            const { canonicalField } = mapColumn(h);
            if (canonicalField) {
              const num = parseFloat(String(row[h]));
              if (!isNaN(num)) data[canonicalField] = num;
            }
          }

          allRecords.push({
            rowIndex: globalIndex,
            patientId: idColumn
              ? String(row[idColumn] || `QX-BATCH-${String(globalIndex + 1).padStart(4, "0")}`)
              : `QX-BATCH-${String(globalIndex + 1).padStart(4, "0")}`,
            patientName: nameColumn
              ? String(row[nameColumn] || `Patient ${globalIndex + 1}`)
              : `Patient ${globalIndex + 1}`,
            data,
            rawRow: row as Record<string, string | number>,
          });
          globalIndex++;

          if (globalIndex >= MAX_RECORDS_PER_SESSION) break;
        }
      }

      const mappedCount = allRecords.length > 0 ? Object.keys(allRecords[0].data).length : 0;

      return {
        success: true,
        inputMode: "zip",
        detectedDisease: mappedCount >= 3 ? "breast_cancer" : "unknown",
        totalRecords: allRecords.length,
        chunks: chunkRecords(allRecords),
        fileInventory,
        warnings,
        errors,
      };
    }

    // 3. JSON batch
    if (jsonFiles.length > 0) {
      const allRecords: ParsedRecord[] = [];
      let globalIndex = 0;

      for (const jsonFile of jsonFiles) {
        try {
          let items = JSON.parse(jsonFile.text);
          if (!Array.isArray(items)) items = [items];

          for (const item of items) {
            const rec = extractRecordFromJSONItem(item, globalIndex, jsonFile.name);
            if (rec) {
              allRecords.push(rec);
              globalIndex++;
            }
            if (globalIndex >= MAX_RECORDS_PER_SESSION) break;
          }
        } catch {
          warnings.push(`Could not parse JSON file: ${jsonFile.name}`);
        }
      }

      return {
        success: true,
        inputMode: "zip",
        detectedDisease: allRecords.length > 0 && Object.keys(allRecords[0].data).length >= 3 ? "breast_cancer" : "unknown",
        totalRecords: allRecords.length,
        chunks: chunkRecords(allRecords),
        fileInventory,
        warnings,
        errors,
      };
    }

    // 4. PDF / TXT Clinical Reports batch inside ZIP
    if (pdfFiles.length > 0 || txtFiles.length > 0) {
      const allRecords: ParsedRecord[] = [];

      for (const pdfFile of pdfFiles) {
        try {
          const blob = new Blob([pdfFile.data as unknown as BlobPart], { type: "application/pdf" });
          const file = new File([blob], pdfFile.name, { type: "application/pdf" });
          const parsed = await parseMedicalReportFile(file);

          const cleanFallbackName = pdfFile.name.replace(/\.[^.]+$/, "").replace(/[-_]/g, " ");
          const matchId = pdfFile.name.match(/(Patient-[A-Za-z0-9\-]+|QX-[A-Za-z0-9\-]+)/i);
          const matchName = pdfFile.name
            .replace(/^Case_\d+_/i, "")
            .replace(/^(Patient-[A-Za-z0-9\-]+_)/i, "")
            .replace(/\.[^.]+$/, "")
            .replace(/_/g, " ");

          const patientId = matchId
            ? matchId[1]
            : (parsed.patientId || parsed.metadata?.patientId || `QX-BATCH-${String(allRecords.length + 1).padStart(4, "0")}`);
          const patientName = matchName && matchName.trim().length > 1
            ? matchName.trim()
            : (parsed.metadata?.patientName || cleanFallbackName);

          allRecords.push({
            rowIndex: allRecords.length,
            patientId,
            patientName,
            data: parsed.extractedFields || {},
            rawRow: parsed.extractedFields as any,
            pdfText: parsed.rawTextPreview,
          });

          if (allRecords.length >= MAX_RECORDS_PER_SESSION) break;
        } catch (err: any) {
          warnings.push(`Could not parse PDF report ${pdfFile.name}: ${err.message}`);
        }
      }

      for (const txtFile of txtFiles) {
        try {
          const blob = new Blob([txtFile.text], { type: "text/plain" });
          const file = new File([blob], txtFile.name, { type: "text/plain" });
          const parsed = await parseMedicalReportFile(file);

          const cleanFallbackName = txtFile.name.replace(/\.[^.]+$/, "").replace(/[-_]/g, " ");
          const matchId = txtFile.name.match(/(Patient-[A-Za-z0-9\-]+|QX-[A-Za-z0-9\-]+)/i);
          const matchName = txtFile.name
            .replace(/^Case_\d+_/i, "")
            .replace(/^(Patient-[A-Za-z0-9\-]+_)/i, "")
            .replace(/\.[^.]+$/, "")
            .replace(/_/g, " ");

          const patientId = matchId
            ? matchId[1]
            : (parsed.patientId || parsed.metadata?.patientId || `QX-BATCH-${String(allRecords.length + 1).padStart(4, "0")}`);
          const patientName = matchName && matchName.trim().length > 1
            ? matchName.trim()
            : (parsed.metadata?.patientName || cleanFallbackName);

          allRecords.push({
            rowIndex: allRecords.length,
            patientId,
            patientName,
            data: parsed.extractedFields || {},
            rawRow: parsed.extractedFields as any,
            pdfText: parsed.rawTextPreview,
          });

          if (allRecords.length >= MAX_RECORDS_PER_SESSION) break;
        } catch (err: any) {
          warnings.push(`Could not parse text report ${txtFile.name}: ${err.message}`);
        }
      }

      const mappedCount = allRecords.length > 0 ? Object.keys(allRecords[0].data).length : 0;

      if (targetDisease === "breast_cancer" && (allRecords.length === 0 || mappedCount === 0)) {
        return {
          success: false,
          inputMode: "zip",
          detectedDisease: "unknown",
          totalRecords: 0,
          chunks: [],
          fileInventory,
          warnings,
          errors: [
            "No breast cancer cytopathology features or FNA biopsy measurements (e.g. radius_mean, texture_mean, perimeter_mean) were found in the uploaded PDF reports. Please upload valid pathology lab reports or CSV/JSON sheets.",
          ],
        };
      }

      if (targetDisease === "cardiac_ecg" && imageFiles.length === 0) {
        return {
          success: false,
          inputMode: "zip",
          detectedDisease: "breast_cancer",
          totalRecords: 0,
          chunks: [],
          fileInventory,
          warnings,
          errors: [
            "This ZIP archive contains pathology reports, not 12-lead ECG waveforms. For tabular cellular biomarker or biopsy screening, please switch to the Breast Cancer Screening Studio.",
          ],
        };
      }

      return {
        success: allRecords.length > 0,
        inputMode: "zip",
        detectedDisease: mappedCount >= 3 ? "breast_cancer" : "unknown",
        totalRecords: allRecords.length,
        chunks: chunkRecords(allRecords),
        fileInventory,
        warnings,
        errors: allRecords.length === 0 ? ["No valid patient records could be extracted from PDF/TXT reports in ZIP."] : errors,
      };
    }

    return {
      success: false,
      inputMode: "zip",
      detectedDisease: "unknown",
      totalRecords: 0,
      chunks: [],
      fileInventory,
      warnings,
      errors: ["ZIP archive does not contain any recognized files (.CSV, .TSV, .JSON, .PDF, .TXT, or images)."],
    };
  } catch (err: any) {
    return {
      success: false,
      inputMode: "zip",
      detectedDisease: "unknown",
      totalRecords: 0,
      chunks: [],
      warnings: [],
      errors: [`ZIP extraction error: ${err.message}`],
    };
  }
}

// ── Image Bulk Parser ───────────────────────────────────────────────────────────

async function parseImageBulk(
  files: File[],
  targetDisease?: DiseaseTarget,
): Promise<BatchParseResult> {
  if (targetDisease === "breast_cancer") {
    return {
      success: false,
      inputMode: "image_bulk",
      detectedDisease: "cardiac_ecg",
      totalRecords: 0,
      chunks: [],
      warnings: [],
      errors: [
        "Image files cannot be processed in the Breast Cancer Screening Studio. This batch contains 12-lead ECG images intended for the Heart Attack & Cardiac ECG Studio. Please switch to Heart Attack & Cardiac ECG Studio or upload cytopathology biopsy data (.CSV, .JSON, .PDF lab reports).",
      ],
    };
  }

  const records: ParsedRecord[] = [];
  const warnings: string[] = [];

  for (let i = 0; i < Math.min(files.length, MAX_RECORDS_PER_SESSION); i++) {
    const file = files[i];
    try {
      const arrayBuffer = await file.arrayBuffer();
      const bytes = new Uint8Array(arrayBuffer);
      const base64 = btoa(Array.from(bytes).map((b) => String.fromCharCode(b)).join(""));
      const mimeType = file.type || "image/jpeg";

      records.push({
        rowIndex: i,
        patientId: `QX-ECG-${String(i + 1).padStart(4, "0")}`,
        patientName: file.name.replace(/\.[^.]+$/, ""),
        data: {},
        imageBase64: `data:${mimeType};base64,${base64}`,
        imageName: file.name,
      });
    } catch (err) {
      warnings.push(`Could not read image file: ${file.name}`);
    }
  }

  return {
    success: true,
    inputMode: "image_bulk",
    detectedDisease: "cardiac_ecg",
    totalRecords: records.length,
    chunks: chunkRecords(records),
    warnings,
    errors: [],
  };
}

// ── Chunking ────────────────────────────────────────────────────────────────────

function chunkRecords(records: ParsedRecord[]): BatchChunk[] {
  const chunks: BatchChunk[] = [];
  const totalChunks = Math.ceil(records.length / BATCH_CHUNK_SIZE);

  for (let i = 0; i < totalChunks; i++) {
    chunks.push({
      chunkIndex: i,
      totalChunks,
      records: records.slice(i * BATCH_CHUNK_SIZE, (i + 1) * BATCH_CHUNK_SIZE),
    });
  }

  return chunks;
}

// ── Multiple CSV/TSV Parser ───────────────────────────────────────────────────

async function parseCSVFiles(files: File[]): Promise<BatchParseResult> {
  if (files.length === 1) {
    const res = await parseCSV(files[0]);
    res.fileInventory = [
      {
        name: files[0].name,
        type: files[0].name.toLowerCase().endsWith(".tsv") ? "tsv" : "csv",
        size: files[0].size,
      },
    ];
    return res;
  }

  const warnings: string[] = [];
  const errors: string[] = [];
  const records: ParsedRecord[] = [];
  let combinedColumnMappings: ColumnMapping[] = [];
  const fileInventory = files.map((f) => ({
    name: f.name,
    type: f.name.toLowerCase().endsWith(".tsv") ? "tsv" : "csv",
    size: f.size,
  }));

  for (const file of files) {
    try {
      const res = await parseCSV(file);
      if (res.warnings) warnings.push(...res.warnings);
      if (res.errors && res.errors.length > 0 && !res.success) {
        errors.push(`${file.name}: ${res.errors.join(", ")}`);
        continue;
      }
      if (res.columnMappings && combinedColumnMappings.length === 0) {
        combinedColumnMappings = res.columnMappings;
      }
      for (const chunk of res.chunks) {
        for (const rec of chunk.records) {
          if (records.length >= MAX_RECORDS_PER_SESSION) break;
          records.push({
            ...rec,
            rowIndex: records.length,
          });
        }
      }
    } catch (err: any) {
      errors.push(`Failed to parse ${file.name}: ${err.message}`);
    }
  }

  if (records.length === 0) {
    return {
      success: false,
      inputMode: "csv",
      detectedDisease: "unknown",
      totalRecords: 0,
      chunks: [],
      fileInventory,
      warnings,
      errors: errors.length > 0 ? errors : ["CSV file(s) contained no parseable rows."],
    };
  }

  const mappedCount = Object.keys(records[0]?.data || {}).length;
  const chunks = chunkRecords(records);

  return {
    success: true,
    inputMode: files[0]?.name.toLowerCase().endsWith(".tsv") ? "tsv" : "csv",
    detectedDisease: mappedCount >= 3 ? "breast_cancer" : "unknown",
    totalRecords: records.length,
    chunks,
    columnMappings: combinedColumnMappings,
    fileInventory,
    warnings,
    errors,
  };
}

// ── Medical Reports Parser (PDF / TXT Bulk) ───────────────────────────────────

async function parseReportFiles(files: File[]): Promise<BatchParseResult> {
  const warnings: string[] = [];
  const errors: string[] = [];
  const records: ParsedRecord[] = [];
  const fileInventory = files.map((f) => ({
    name: f.name,
    type: f.name.toLowerCase().endsWith(".pdf") ? "pdf" : "txt",
    size: f.size,
  }));

  for (const file of files) {
    try {
      const parsed = await parseMedicalReportFile(file);
      const fallbackName = file.name.replace(/\.[^.]+$/, "").replace(/[-_]/g, " ");
      const patientId =
        parsed.patientId ||
        parsed.metadata?.patientId ||
        `QX-BATCH-${String(records.length + 1).padStart(4, "0")}`;
      const patientName = parsed.metadata?.patientName || fallbackName;

      records.push({
        rowIndex: records.length,
        patientId,
        patientName,
        data: parsed.extractedFields || {},
        rawRow: parsed.extractedFields as any,
        pdfText: parsed.rawTextPreview,
      });
    } catch (err: any) {
      errors.push(`Failed to parse report ${file.name}: ${err.message}`);
    }
  }

  if (records.length === 0) {
    return {
      success: false,
      inputMode: "pdf_bulk",
      detectedDisease: "unknown",
      totalRecords: 0,
      chunks: [],
      fileInventory,
      warnings,
      errors: errors.length > 0 ? errors : ["No clinical reports could be parsed."],
    };
  }

  const mappedCount = Object.keys(records[0]?.data || {}).length;
  const chunks = chunkRecords(records);

  return {
    success: true,
    inputMode: "pdf_bulk",
    detectedDisease: mappedCount >= 3 ? "breast_cancer" : "unknown",
    totalRecords: records.length,
    chunks,
    fileInventory,
    warnings,
    errors,
  };
}

// ── Mixed Format Parser ────────────────────────────────────────────────────────

async function parseMixedFiles(files: File[]): Promise<BatchParseResult> {
  const warnings: string[] = [];
  const errors: string[] = [];
  const records: ParsedRecord[] = [];
  const fileInventory = files.map((f) => ({
    name: f.name,
    type: f.name.split(".").pop()?.toLowerCase() || "unknown",
    size: f.size,
  }));

  for (const file of files) {
    const ext = file.name.split(".").pop()?.toLowerCase() || "";
    try {
      if (ext === "json") {
        const res = await parseJSONFiles([file]);
        if (res.chunks) {
          for (const c of res.chunks) {
            for (const r of c.records) {
              records.push({ ...r, rowIndex: records.length });
            }
          }
        }
      } else if (ext === "csv" || ext === "tsv") {
        const res = await parseCSV(file);
        if (res.chunks) {
          for (const c of res.chunks) {
            for (const r of c.records) {
              records.push({ ...r, rowIndex: records.length });
            }
          }
        }
      } else if (ext === "pdf" || ext === "txt") {
        const res = await parseReportFiles([file]);
        if (res.chunks) {
          for (const c of res.chunks) {
            for (const r of c.records) {
              records.push({ ...r, rowIndex: records.length });
            }
          }
        }
      } else {
        warnings.push(`Skipped unsupported file: ${file.name}`);
      }
    } catch (err: any) {
      errors.push(`Error processing ${file.name}: ${err.message}`);
    }
  }

  if (records.length === 0) {
    return {
      success: false,
      inputMode: "csv",
      detectedDisease: "unknown",
      totalRecords: 0,
      chunks: [],
      fileInventory,
      warnings,
      errors: errors.length > 0 ? errors : ["No valid records could be extracted from uploaded files."],
    };
  }

  const mappedCount = Object.keys(records[0]?.data || {}).length;
  const chunks = chunkRecords(records);

  return {
    success: true,
    inputMode: "csv",
    detectedDisease: mappedCount >= 3 ? "breast_cancer" : "unknown",
    totalRecords: records.length,
    chunks,
    fileInventory,
    warnings,
    errors,
  };
}

// ── Main Entry Point ────────────────────────────────────────────────────────────

export async function processBatchUpload(
  files: File[],
  targetDisease?: DiseaseTarget,
): Promise<BatchParseResult> {
  if (files.length === 0) {
    return {
      success: false,
      inputMode: "csv",
      detectedDisease: "unknown",
      totalRecords: 0,
      chunks: [],
      warnings: [],
      errors: ["No files provided."],
    };
  }

  // 1. Single ZIP file
  if (files.length === 1 && files[0].name.toLowerCase().endsWith(".zip")) {
    return parseZIP(files[0], targetDisease);
  }

  // 2. Modality Gate: Cardiac ECG must receive images or ECG zip
  if (targetDisease === "cardiac_ecg") {
    const imageExts = new Set(["jpg", "jpeg", "png", "webp", "bmp"]);
    const hasNonImages = files.some((f) => {
      const fExt = f.name.split(".").pop()?.toLowerCase() || "";
      return !imageExts.has(fExt) && fExt !== "zip";
    });
    if (hasNonImages) {
      return {
        success: false,
        inputMode: "csv",
        detectedDisease: "breast_cancer",
        totalRecords: 0,
        chunks: [],
        warnings: [],
        errors: [
          "Tabular biomarker data cannot be processed in the Cardiac ECG Studio. The Cardiac ECG Studio exclusively processes 12-lead ECG waveform images (.JPG, .PNG, .WEBP) or ECG PDFs. For tabular cellular biomarker screening, please use the Breast Cancer Screening Studio.",
        ],
      };
    }
  }

  // 3. Modality Gate: Breast Cancer must receive tabular / report data
  if (targetDisease === "breast_cancer") {
    const imageExts = new Set(["jpg", "jpeg", "png", "webp", "bmp"]);
    const allImages = files.every((f) => {
      const fExt = f.name.split(".").pop()?.toLowerCase() || "";
      return imageExts.has(fExt);
    });
    if (allImages) {
      return {
        success: false,
        inputMode: "image_bulk",
        detectedDisease: "cardiac_ecg",
        totalRecords: 0,
        chunks: [],
        warnings: [],
        errors: [
          "Image files cannot be processed in the Breast Cancer Screening Studio. The Breast Cancer Screening Studio processes tabular biopsy data (.CSV, .JSON, .PDF lab reports). For 12-lead ECG analysis, please use the Heart Attack & Cardiac ECG Studio.",
        ],
      };
    }
  }

  // 4. Images (cardiac ECG)
  const imageExts = new Set(["jpg", "jpeg", "png", "webp", "bmp"]);
  const allImages = files.every((f) => {
    const fExt = f.name.split(".").pop()?.toLowerCase() || "";
    return imageExts.has(fExt);
  });
  if (allImages) {
    return parseImageBulk(files, targetDisease);
  }

  const imageFiles = files.filter((f) => {
    const fExt = f.name.split(".").pop()?.toLowerCase() || "";
    return imageExts.has(fExt);
  });
  if (imageFiles.length > 0 && imageFiles.length === files.length) {
    return parseImageBulk(imageFiles, targetDisease);
  }

  // 5. Tabular / Structured / Reports Multi-file Handling
  const allJson = files.every((f) => f.name.toLowerCase().endsWith(".json"));
  if (allJson) {
    return parseJSONFiles(files);
  }

  const allCsv = files.every((f) => {
    const fExt = f.name.split(".").pop()?.toLowerCase() || "";
    return fExt === "csv" || fExt === "tsv";
  });
  if (allCsv) {
    return parseCSVFiles(files);
  }

  const allPdfOrTxt = files.every((f) => {
    const fExt = f.name.split(".").pop()?.toLowerCase() || "";
    return fExt === "pdf" || fExt === "txt";
  });
  if (allPdfOrTxt) {
    return parseReportFiles(files);
  }

  // 6. Mixed files
  return parseMixedFiles(files);
}
