import { useState, useRef, useCallback } from 'react';
import * as XLSX from 'xlsx';
import { HiOutlineX, HiOutlineDownload, HiOutlineUpload, HiOutlineDocumentText } from 'react-icons/hi';

const ACCEPTED_TYPES = [
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-excel',
  'text/csv',
];

export default function ExcelImportModal({ isOpen, onClose, title, columns, onImport, onComplete, children }) {
  const [step, setStep] = useState('upload'); // upload | preview | importing | done
  const [rows, setRows] = useState([]);
  const [fileName, setFileName] = useState('');
  const [dragOver, setDragOver] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0, successes: 0, failures: 0, errors: [] });
  const fileInputRef = useRef(null);
  const abortRef = useRef(false);

  const reset = () => {
    setStep('upload');
    setRows([]);
    setFileName('');
    setDragOver(false);
    setProgress({ current: 0, total: 0, successes: 0, failures: 0, errors: [] });
    abortRef.current = false;
  };

  const handleClose = () => {
    if (step === 'importing') {
      abortRef.current = true;
    }
    if (step === 'done' || step === 'importing') {
      onComplete?.();
    }
    reset();
    onClose();
  };

  const parseFile = useCallback((file) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const wb = XLSX.read(e.target.result, { type: 'array' });
        const sheet = wb.Sheets[wb.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json(sheet, { defval: '' });

        if (!jsonData.length) {
          alert('The file is empty or has no data rows.');
          return;
        }

        // Map Excel headers to column keys (case-insensitive match on label or key)
        const excelHeaders = Object.keys(jsonData[0]);
        const headerMap = {};
        for (const col of columns) {
          const match = excelHeaders.find(
            (h) => h.toLowerCase().trim() === col.label.toLowerCase().trim() ||
                   h.toLowerCase().trim() === col.key.toLowerCase().trim()
          );
          if (match) headerMap[col.key] = match;
        }

        const parsed = jsonData.map((excelRow, idx) => {
          const row = {};
          const errors = [];
          for (const col of columns) {
            const excelKey = headerMap[col.key];
            let val = excelKey !== undefined ? excelRow[excelKey] : '';
            if (typeof val === 'string') val = val.trim();
            row[col.key] = val;
            if (col.required && (val === '' || val === undefined || val === null)) {
              errors.push(`${col.label} is required`);
            }
          }
          return { _idx: idx, ...row, _errors: errors, _valid: errors.length === 0 };
        });

        setRows(parsed);
        setFileName(file.name);
        setStep('preview');
      } catch {
        alert('Failed to parse the file. Please upload a valid Excel or CSV file.');
      }
    };
    reader.readAsArrayBuffer(file);
  }, [columns]);

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (file) parseFile(file);
    e.target.value = '';
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) parseFile(file);
  };

  const handleDragOver = (e) => { e.preventDefault(); setDragOver(true); };
  const handleDragLeave = () => setDragOver(false);

  const downloadTemplate = () => {
    const headers = columns.map((c) => c.label + (c.required ? ' *' : ''));
    const ws = XLSX.utils.aoa_to_sheet([headers]);
    // Set column widths
    ws['!cols'] = columns.map((c) => ({ wch: Math.max(c.label.length + 4, 15) }));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Template');
    const safeTitle = (title || 'import').replace(/[^a-zA-Z0-9]/g, '_');
    XLSX.writeFile(wb, `${safeTitle}_template.xlsx`);
  };

  const startImport = async () => {
    const validRows = rows.filter((r) => r._valid);
    if (!validRows.length) {
      alert('No valid rows to import.');
      return;
    }

    setStep('importing');
    abortRef.current = false;
    const state = { current: 0, total: validRows.length, successes: 0, failures: 0, errors: [] };
    setProgress({ ...state });

    for (const row of validRows) {
      if (abortRef.current) break;
      state.current++;
      try {
        const data = {};
        for (const col of columns) {
          data[col.key] = row[col.key];
        }
        await onImport(data);
        state.successes++;
      } catch (err) {
        state.failures++;
        const msg = err?.response?.data?.message || err?.message || 'Unknown error';
        state.errors.push({ row: row._idx + 1, name: row.name || `Row ${row._idx + 1}`, error: msg });
      }
      setProgress({ ...state });
    }

    setStep('done');
  };

  const removeRow = (idx) => {
    setRows((prev) => prev.filter((r) => r._idx !== idx));
  };

  if (!isOpen) return null;

  const validCount = rows.filter((r) => r._valid).length;
  const invalidCount = rows.length - validCount;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center px-4">
      <div className="fixed inset-0 bg-black/50" onClick={step !== 'importing' ? handleClose : undefined} />
      <div className="relative z-10 w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-xl bg-card p-6 shadow-xl">
        {/* Header */}
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-slate-800">{title || 'Import from Excel'}</h3>
          <button onClick={handleClose} className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600">
            <HiOutlineX size={20} />
          </button>
        </div>

        {/* Extra content (e.g. org selector) */}
        {children && (step === 'upload' || step === 'preview') && children}

        {/* Step: Upload */}
        {step === 'upload' && (
          <div className="space-y-4">
            <div className="flex justify-end">
              <button onClick={downloadTemplate} className="inline-flex items-center gap-2 rounded-lg border border-stroke px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 cursor-pointer">
                <HiOutlineDownload size={16} /> Download Template
              </button>
            </div>

            <div
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onClick={() => fileInputRef.current?.click()}
              className={`flex cursor-pointer flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed p-10 transition-colors ${
                dragOver ? 'border-primary bg-primary/5' : 'border-slate-300 hover:border-primary hover:bg-slate-50'
              }`}
            >
              <HiOutlineUpload size={36} className="text-slate-400" />
              <p className="text-sm text-slate-600">
                <span className="font-medium text-primary">Click to upload</span> or drag & drop
              </p>
              <p className="text-xs text-slate-400">Supports .xlsx, .xls, .csv</p>
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls,.csv"
                onChange={handleFileSelect}
                className="hidden"
              />
            </div>
          </div>
        )}

        {/* Step: Preview */}
        {step === 'preview' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm text-slate-600">
                <HiOutlineDocumentText size={18} />
                <span className="font-medium">{fileName}</span>
                <span>— {rows.length} row{rows.length !== 1 ? 's' : ''}</span>
                {invalidCount > 0 && (
                  <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700">
                    {invalidCount} invalid
                  </span>
                )}
              </div>
              <button
                onClick={() => { reset(); }}
                className="text-sm text-slate-500 hover:text-slate-700 cursor-pointer"
              >
                Choose another file
              </button>
            </div>

            <div className="max-h-64 overflow-auto rounded-lg border border-stroke">
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-slate-50">
                  <tr>
                    <th className="px-3 py-2 text-left text-xs font-medium text-slate-500">#</th>
                    {columns.map((col) => (
                      <th key={col.key} className="px-3 py-2 text-left text-xs font-medium text-slate-500">
                        {col.label}{col.required ? ' *' : ''}
                      </th>
                    ))}
                    <th className="px-3 py-2 text-left text-xs font-medium text-slate-500">Status</th>
                    <th className="px-3 py-2"></th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => (
                    <tr key={row._idx} className={`border-t border-stroke ${!row._valid ? 'bg-red-50/50' : ''}`}>
                      <td className="px-3 py-2 text-xs text-slate-400">{row._idx + 1}</td>
                      {columns.map((col) => (
                        <td
                          key={col.key}
                          className={`px-3 py-2 text-xs ${
                            col.required && !row[col.key] ? 'text-red-600 font-medium' : 'text-slate-700'
                          }`}
                        >
                          {row[col.key] !== '' && row[col.key] !== undefined ? String(row[col.key]) : (
                            col.required ? <span className="italic">missing</span> : '—'
                          )}
                        </td>
                      ))}
                      <td className="px-3 py-2">
                        {row._valid ? (
                          <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">OK</span>
                        ) : (
                          <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700" title={row._errors.join(', ')}>
                            Invalid
                          </span>
                        )}
                      </td>
                      <td className="px-3 py-2">
                        <button onClick={() => removeRow(row._idx)} className="text-slate-400 hover:text-red-500 cursor-pointer">
                          <HiOutlineX size={14} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {invalidCount > 0 && (
              <p className="text-xs text-amber-600">
                {invalidCount} row{invalidCount !== 1 ? 's' : ''} with validation errors will be skipped during import.
              </p>
            )}

            <div className="flex justify-end gap-3 pt-2">
              <button onClick={handleClose} className="rounded-lg border border-stroke px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 cursor-pointer">
                Cancel
              </button>
              <button
                onClick={startImport}
                disabled={!validCount}
                className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-white hover:bg-primary-dark disabled:opacity-50 cursor-pointer"
              >
                <HiOutlineUpload size={16} /> Import {validCount} Row{validCount !== 1 ? 's' : ''}
              </button>
            </div>
          </div>
        )}

        {/* Step: Importing */}
        {step === 'importing' && (
          <div className="space-y-4 py-4">
            <div className="text-center">
              <p className="text-sm font-medium text-slate-700">
                Importing... {progress.current}/{progress.total}
              </p>
            </div>
            <div className="h-3 w-full overflow-hidden rounded-full bg-slate-200">
              <div
                className="h-full rounded-full bg-primary transition-all duration-300"
                style={{ width: `${progress.total ? (progress.current / progress.total) * 100 : 0}%` }}
              />
            </div>
            <div className="flex justify-center gap-6 text-sm">
              <span className="text-green-600">{progress.successes} succeeded</span>
              {progress.failures > 0 && <span className="text-red-600">{progress.failures} failed</span>}
            </div>
          </div>
        )}

        {/* Step: Done */}
        {step === 'done' && (
          <div className="space-y-4 py-4">
            <div className="text-center space-y-2">
              <div className={`mx-auto flex h-14 w-14 items-center justify-center rounded-full ${progress.failures === 0 ? 'bg-green-100' : 'bg-amber-100'}`}>
                {progress.failures === 0 ? (
                  <svg className="h-7 w-7 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  <svg className="h-7 w-7 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                )}
              </div>
              <p className="text-lg font-semibold text-slate-800">Import Complete</p>
              <p className="text-sm text-slate-600">
                <span className="font-medium text-green-600">{progress.successes} succeeded</span>
                {progress.failures > 0 && (
                  <>, <span className="font-medium text-red-600">{progress.failures} failed</span></>
                )}
              </p>
            </div>

            {progress.errors.length > 0 && (
              <div className="max-h-40 overflow-auto rounded-lg border border-red-200 bg-red-50 p-3">
                <p className="mb-2 text-xs font-medium text-red-700">Error Details:</p>
                {progress.errors.map((err, i) => (
                  <p key={i} className="text-xs text-red-600">
                    <span className="font-medium">Row {err.row}</span> ({err.name}): {err.error}
                  </p>
                ))}
              </div>
            )}

            <div className="flex justify-end pt-2">
              <button onClick={handleClose} className="rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-white hover:bg-primary-dark cursor-pointer">
                Close
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
