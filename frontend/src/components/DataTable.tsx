import React, { useState } from 'react';
import { ForecastPoint } from '../types';
import { ChevronLeft, ChevronRight, Table } from 'lucide-react';

interface DataTableProps {
  historicalData: ForecastPoint[];
  forecastData: ForecastPoint[];
}

export const DataTable: React.FC<DataTableProps> = ({ historicalData, forecastData }) => {
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 10;

  // Combine historical and future forecast points
  const combined = [
    ...forecastData.filter((p) => p.is_forecast),
    ...[...historicalData].reverse()
  ];

  const totalPages = Math.ceil(combined.length / rowsPerPage) || 1;
  const startIndex = (currentPage - 1) * rowsPerPage;
  const currentRows = combined.slice(startIndex, startIndex + rowsPerPage);

  return (
    <div className="bg-[#0a0a0a] border border-neutral-800 rounded-2xl p-5 shadow-sm space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="flex items-center space-x-2">
          <Table className="w-4 h-4 text-white" />
          <h3 className="text-base font-semibold text-white">Telemetry & Forecast Log Table</h3>
        </div>
        <span className="text-xs text-neutral-400 font-mono">
          Showing {startIndex + 1} - {Math.min(startIndex + rowsPerPage, combined.length)} of {combined.length} entries
        </span>
      </div>

      <div className="overflow-x-auto border border-neutral-800 rounded-lg">
        <table className="w-full text-left text-xs font-mono">
          <thead className="bg-neutral-950 text-neutral-400 uppercase tracking-wider border-b border-neutral-800">
            <tr>
              <th className="py-2.5 px-3">Timestamp</th>
              <th className="py-2.5 px-3">Type</th>
              <th className="py-2.5 px-3">Actual CPU</th>
              <th className="py-2.5 px-3">SMA</th>
              <th className="py-2.5 px-3">WMA</th>
              <th className="py-2.5 px-3">EMA</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-800">
            {currentRows.map((row, idx) => (
              <tr
                key={`${row.timestamp}-${idx}`}
                className={`transition ${
                  row.is_forecast ? 'bg-neutral-900/50 text-white' : 'text-neutral-300 hover:bg-neutral-900/30'
                }`}
              >
                <td className="py-2 px-3 whitespace-nowrap">{row.timestamp}</td>
                <td className="py-2 px-3">
                  <span
                    className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase ${
                      row.is_forecast
                        ? 'bg-neutral-800 text-white border border-neutral-700'
                        : 'bg-neutral-950 text-neutral-400 border border-neutral-800'
                    }`}
                  >
                    {row.is_forecast ? 'Forecast' : 'Observed'}
                  </span>
                </td>
                <td className="py-2 px-3 font-semibold text-white">
                  {row.actual !== null && row.actual !== undefined ? `${row.actual.toFixed(2)}%` : '--'}
                </td>
                <td className="py-2 px-3 text-neutral-200">
                  {row.sma !== null && row.sma !== undefined ? `${row.sma.toFixed(2)}%` : '--'}
                </td>
                <td className="py-2 px-3 text-neutral-400">
                  {row.wma !== null && row.wma !== undefined ? `${row.wma.toFixed(2)}%` : '--'}
                </td>
                <td className="py-2 px-3 text-neutral-300">
                  {row.ema !== null && row.ema !== undefined ? `${row.ema.toFixed(2)}%` : '--'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination controls */}
      <div className="flex items-center justify-between text-xs text-neutral-400">
        <span>Page {currentPage} of {totalPages}</span>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="p-1.5 rounded bg-neutral-900 hover:bg-neutral-800 text-white border border-neutral-700 disabled:opacity-40 transition"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="p-1.5 rounded bg-neutral-900 hover:bg-neutral-800 text-white border border-neutral-700 disabled:opacity-40 transition"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
