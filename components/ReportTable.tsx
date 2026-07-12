"use client";

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { Card } from "@/components/ui/card";

export interface Column<T> {
  header: string;
  accessorKey: keyof T;
  cell?: (value: any, row: T) => React.ReactNode;
}

interface ReportTableProps<T> {
  columns: Column<T>[];
  data: T[];
  title?: string;
  exportFilename?: string;
}

export function ReportTable<T>({ columns, data, title, exportFilename = "export.csv" }: ReportTableProps<T>) {
  
  const handleExportCsv = () => {
    if (!data || data.length === 0) return;

    // Build header row
    const headers = columns.map(c => c.header).join(',');
    
    // Build data rows (using raw values)
    const rows = data.map(item => {
      return columns.map(c => {
        const val = item[c.accessorKey];
        // simple quote escaping
        const stringVal = String(val ?? "").replace(/"/g, '""');
        return `"${stringVal}"`;
      }).join(',');
    });

    const csvContent = [headers, ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", exportFilename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <Card className="shadow-sm border border-border/50 overflow-hidden">
      <div className="flex items-center justify-between p-4 border-b border-border/50 bg-muted/20">
        <h3 className="font-medium text-sm text-foreground">{title || "Report Data"}</h3>
        <Button variant="outline" size="sm" onClick={handleExportCsv} className="h-8 text-xs">
          <Download className="w-3 h-3 mr-2" />
          Export CSV
        </Button>
      </div>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              {columns.map((col, idx) => (
                <TableHead key={idx} className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">
                  {col.header}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.length === 0 ? (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center text-muted-foreground">
                  No data found for the selected filters.
                </TableCell>
              </TableRow>
            ) : (
              data.map((row, rowIndex) => (
                <TableRow key={rowIndex}>
                  {columns.map((col, colIndex) => (
                    <TableCell key={colIndex} className="py-3">
                      {col.cell ? col.cell(row[col.accessorKey], row) : String(row[col.accessorKey] ?? "")}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </Card>
  );
}
