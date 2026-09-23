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

async function parseJSON(file: File): Promise<BatchParseResult> {
  const warnings: string[] = [];
  const errors: string[] = [];

  try {
    const text = await file.text();
    let parsed = JSON.parse(text);

    // Normalize: wrap single object in array
    if (!Array.isArray(parsed)) {
      parsed = [parsed];
    }

    if (parsed.length === 0) {
      return {
        success: false,
        inputMode: "json",
        detectedDisease: "unknown",
        totalRecords: 0,
        chunks: [],
        warnings: [],
        errors: ["JSON file contains an empty array."],
      };
    }

    const records: ParsedRecord[] = [];

    for (let i = 0; i < Math.min(parsed.length, MAX_RECORDS_PER_SESSION); i++) {
      const item = parsed[i];
      const data: Record<string, number> = {};

      for (const [canonical, aliases] of Object.entries(BREAST_CANCER_ALIASES)) {
        for (const alias of aliases) {
          const normalizedAlias = normalizeColumnName(alias);
          for (const key of Object.keys(item)) {
            if (normalizeColumnName(key) === normalizedAlias) {
              const num = parseFloat(String(item[key]));
              if (!isNaN(num)) {
                data[canonical] = num;
                break;
              }
            }
          }
          if (data[canonical] !== undefined) break;
        }
      }

      records.push({
        rowIndex: i,
        patientId: item.patient_id || item.patientId || item.id || `QX-BATCH-${String(i + 1).padStart(4, "0")}`,
        patientName: item.patient_name || item.patientName || item.name || `Patient ${i + 1}`,
        data,
        rawRow: item,
      });
    }

    const mappedCount = records.length > 0 ? Object.keys(records[0].data).length : 0;
    const chunks = chunkRecords(records);

    return {
      success: true,
      inputMode: "json",
      detectedDisease: mappedCount >= 3 ? "breast_cancer" : "unknown",
      totalRecords: records.length,
      chunks,
      warnings,
      errors,
    };
  } catch (err: any) {
    return {
      success: false,
      inputMode: "json",
      detectedDisease: "unknown",
      totalRecords: 0,
      chunks: [],
      warnings: [],
      errors: [`JSON parsing error: ${err.message}`],
    };
  }
}

// ── ZIP Parser ──────────────────────────────────────────────────────────────────

async function parseZIP(file: File): Promise<BatchParseResult> {
  const warnings: string[] = [];
  const errors: string[] = [];

  try {
    const arrayBuffer = await file.arrayBuffer();
    const zip = await JSZip.loadAsync(arrayBuffer);

    const fileInventory: { name: string; type: string; size: number }[] = [];
    const imageFiles: { name: string; data: Uint8Array }[] = [];
    const csvFiles: { name: string; text: string }[] = [];
    const jsonFiles: { name: string; text: string }[] = [];

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
      }
    }

    // Determine primary content type
    if (imageFiles.length > 0 && csvFiles.length === 0 && jsonFiles.length === 0) {
      // Image batch → ECG mode
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

    if (csvFiles.length > 0) {
      // CSV batch — parse all CSVs and merge
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

    if (jsonFiles.length > 0) {
      const allRecords: ParsedRecord[] = [];
      let globalIndex = 0;

      for (const jsonFile of jsonFiles) {
        try {
          let items = JSON.parse(jsonFile.text);
          if (!Array.isArray(items)) items = [items];

          for (const item of items) {
            const data: Record<string, number> = {};
            for (const [canonical, aliases] of Object.entries(BREAST_CANCER_ALIASES)) {
              for (const alias of aliases) {
                const normalizedAlias = normalizeColumnName(alias);
                for (const key of Object.keys(item)) {
                  if (normalizeColumnName(key) === normalizedAlias) {
                    const num = parseFloat(String(item[key]));
                    if (!isNaN(num)) { data[canonical] = num; break; }
                  }
                }
                if (data[canonical] !== undefined) break;
              }
            }

            allRecords.push({
              rowIndex: globalIndex,
              patientId: item.patient_id || item.patientId || item.id || `QX-BATCH-${String(globalIndex + 1).padStart(4, "0")}`,
              patientName: item.patient_name || item.patientName || item.name || `Patient ${globalIndex + 1}`,
              data,
              rawRow: item,
            });
            globalIndex++;
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

    return {
      success: false,
      inputMode: "zip",
      detectedDisease: "unknown",
      totalRecords: 0,
      chunks: [],
      fileInventory,
      warnings,
      errors: ["ZIP archive does not contain any recognized files (CSV, JSON, or images)."],
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

async function parseImageBulk(files: File[]): Promise<BatchParseResult> {
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

// ── Main Entry Point ────────────────────────────────────────────────────────────

export async function processBatchUpload(
  files: File[],
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

  const file = files[0];
  const ext = file.name.split(".").pop()?.toLowerCase() || "";

  // Single ZIP file
  if (ext === "zip") {
    return parseZIP(file);
  }

  // Single CSV/TSV
  if (ext === "csv" || ext === "tsv") {
    return parseCSV(file);
  }

  // Single JSON
  if (ext === "json") {
    return parseJSON(file);
  }

  // Multiple image files → image batch
  const imageExts = new Set(["jpg", "jpeg", "png", "webp", "bmp"]);
  const allImages = files.every((f) => {
    const fExt = f.name.split(".").pop()?.toLowerCase() || "";
    return imageExts.has(fExt);
  });

  if (allImages) {
    return parseImageBulk(files);
  }

  // Mixed files — attempt to sort
  const imageFiles = files.filter((f) => {
    const fExt = f.name.split(".").pop()?.toLowerCase() || "";
    return imageExts.has(fExt);
  });

  if (imageFiles.length > 0) {
    return parseImageBulk(imageFiles);
  }

  return {
    success: false,
    inputMode: "csv",
    detectedDisease: "unknown",
    totalRecords: 0,
    chunks: [],
    warnings: [],
    errors: [`Unsupported file type: .${ext}. Accepted formats: CSV, TSV, JSON, ZIP, JPG, PNG.`],
  };
}
