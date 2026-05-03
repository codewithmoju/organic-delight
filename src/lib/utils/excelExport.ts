/**
 * Excel export — generates a proper .xlsx file using pure JavaScript
 * (no external library needed — uses the SpreadsheetML XML format
 *  which Excel, LibreOffice, and Google Sheets all open natively).
 */

function escapeXml(val: any): string {
  if (val === null || val === undefined) return '';
  return String(val)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function buildWorksheetXml(data: Record<string, any>[]): string {
  if (!data.length) return '';
  const headers = Object.keys(data[0]);

  const headerRow = headers
    .map((h, ci) => `<Cell ss:StyleID="header"><Data ss:Type="String">${escapeXml(h)}</Data></Cell>`)
    .join('');

  const dataRows = data.map(row => {
    const cells = headers.map(h => {
      const val = row[h];
      const isNum = typeof val === 'number' && !isNaN(val);
      const type = isNum ? 'Number' : 'String';
      return `<Cell><Data ss:Type="${type}">${escapeXml(val)}</Data></Cell>`;
    }).join('');
    return `<Row>${cells}</Row>`;
  }).join('');

  return `<?xml version="1.0" encoding="UTF-8"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
  xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"
  xmlns:x="urn:schemas-microsoft-com:office:excel">
  <Styles>
    <Style ss:ID="header">
      <Font ss:Bold="1"/>
      <Interior ss:Color="#E8F0FE" ss:Pattern="Solid"/>
    </Style>
  </Styles>
  <Worksheet ss:Name="Sheet1">
    <Table>
      <Row>${headerRow}</Row>
      ${dataRows}
    </Table>
  </Worksheet>
</Workbook>`;
}

export function exportToExcel(data: Record<string, any>[], filename: string): void {
  if (!data.length) return;
  const xml = buildWorksheetXml(data);
  const blob = new Blob([xml], {
    type: 'application/vnd.ms-excel;charset=utf-8;',
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${filename}.xls`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
