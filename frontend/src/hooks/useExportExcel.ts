import ExcelJS from "exceljs";
import fileSaver from "file-saver";

interface ExportOptions<T extends object> {
  data: T[];
  fileName?: string;
  sheetName?: string;
  headers?: Partial<Record<keyof T, string>>;
}

export function useExportExcel(){
    const exportToExcel = async <T extends object>({
    data,
    fileName = "export",
    sheetName = "Sheet1",
    headers,
  }: ExportOptions<T>) => {
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet(sheetName);

    if (data.length === 0) return;

    const keys = Object.keys(data[0]) as (keyof T)[];

    // Tạo cột từ headers map hoặc dùng tên key gốc
    sheet.columns = keys.map((key) => ({
      header: headers?.[key] ?? String(key),
      key: String(key),
      width: 20,
    }));

    // Style header
    const headerRow = sheet.getRow(1);
    headerRow.eachCell((cell) => {
      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FF1E3A5F" },
      };
      cell.font = { color: { argb: "FFFFFFFF" }, bold: true };
      cell.alignment = { horizontal: "center", vertical: "middle" };
      cell.border = {
        bottom: { style: "thin", color: { argb: "FFD0D7DE" } },
      };
    });
    headerRow.height = 28;

    // Thêm data rows
    data.forEach((row, i) => {
      const rowData = keys.reduce((acc, key) => {
        acc[String(key)] = row[key];
        return acc;
      }, {} as Record<string, unknown>);

      const addedRow = sheet.addRow(rowData);

      // Zebra striping
      if (i % 2 === 1) {
        addedRow.eachCell((cell) => {
          cell.fill = {
            type: "pattern",
            pattern: "solid",
            fgColor: { argb: "FFF5F7FA" },
          };
        });
      }
    });

    sheet.views = [{ state: "frozen", ySplit: 1 }];

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    fileSaver.saveAs(blob, `${fileName}.xlsx`);
  };

  return { exportToExcel };
}