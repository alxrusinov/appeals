// Экранирует значение под CSV-ячейку (двойные кавычки удваиваются, как того требует формат)
const toCsvCell = (value: unknown): string =>
  `"${String(value ?? "").replace(/"/g, '""')}"`;

const toCsvRow = (values: unknown[]): string => values.map(toCsvCell).join(";");

// Собирает CSV (с BOM для корректной кириллицы в Excel) и запускает скачивание файла.
// header — первая строка целиком (с завершающим \n), rows — массив строк-значений построчно.
export const downloadCsv = (filename: string, header: string, rows: unknown[][]): void => {
  const body = rows.map(toCsvRow).join("\n");
  const csvContent = header + body;

  const blob = new Blob(["﻿" + csvContent], {
    type: "text/csv;charset=utf-8;",
  });

  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", filename);

  document.body.appendChild(link);
  link.click();

  link.remove();
  window.URL.revokeObjectURL(url);
};

// Текущая дата в формате YYYY-MM-DD — удобно для имени файла отчета
export const todayForFilename = (): string => new Date().toISOString().split("T")[0];
