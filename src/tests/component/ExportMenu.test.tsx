import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import ExportMenu from '../../components/ui/ExportMenu';
import * as csvExport from '../../lib/utils/csvExport';
import * as excelExport from '../../lib/utils/excelExport';
import * as pdfExport from '../../lib/utils/pdfExport';

const mockData = [{ Name: 'Item A', Price: 100 }, { Name: 'Item B', Price: 200 }];

const renderMenu = (props = {}) =>
  render(
    <MemoryRouter>
      <ExportMenu getData={() => mockData} filename="test" title="Test Report" {...props} />
    </MemoryRouter>
  );

describe('ExportMenu', () => {
  beforeEach(() => {
    vi.spyOn(csvExport, 'exportToCSV').mockImplementation(() => {});
    vi.spyOn(excelExport, 'exportToExcel').mockImplementation(() => {});
    vi.spyOn(pdfExport, 'exportTableToPDF').mockImplementation(() => {});
  });

  it('renders the Export button', () => {
    renderMenu();
    expect(screen.getByText('Export')).toBeInTheDocument();
  });

  it('opens dropdown on click', async () => {
    renderMenu();
    fireEvent.click(screen.getByText('Export'));
    await waitFor(() => {
      expect(screen.getByText('Export CSV')).toBeInTheDocument();
      expect(screen.getByText('Export Excel')).toBeInTheDocument();
      expect(screen.getByText('Export PDF')).toBeInTheDocument();
    });
  });

  it('calls exportToCSV when CSV is selected', async () => {
    renderMenu();
    fireEvent.click(screen.getByText('Export'));
    await waitFor(() => screen.getByText('Export CSV'));
    fireEvent.click(screen.getByText('Export CSV'));
    expect(csvExport.exportToCSV).toHaveBeenCalledWith(mockData, 'test');
  });

  it('calls exportToExcel when Excel is selected', async () => {
    renderMenu();
    fireEvent.click(screen.getByText('Export'));
    await waitFor(() => screen.getByText('Export Excel'));
    fireEvent.click(screen.getByText('Export Excel'));
    expect(excelExport.exportToExcel).toHaveBeenCalledWith(mockData, 'test');
  });

  it('calls exportTableToPDF when PDF is selected', async () => {
    renderMenu();
    fireEvent.click(screen.getByText('Export'));
    await waitFor(() => screen.getByText('Export PDF'));
    fireEvent.click(screen.getByText('Export PDF'));
    expect(pdfExport.exportTableToPDF).toHaveBeenCalledWith(mockData, 'test', 'Test Report');
  });

  it('shows only specified formats', async () => {
    renderMenu({ formats: ['csv'] });
    fireEvent.click(screen.getByText('Export'));
    await waitFor(() => screen.getByText('Export CSV'));
    expect(screen.queryByText('Export Excel')).not.toBeInTheDocument();
    expect(screen.queryByText('Export PDF')).not.toBeInTheDocument();
  });

  it('shows error toast when data is empty', async () => {
    // Reset spy call count before this test
    vi.mocked(csvExport.exportToCSV).mockClear();
    render(
      <MemoryRouter>
        <ExportMenu getData={() => []} filename="empty" />
      </MemoryRouter>
    );
    fireEvent.click(screen.getByText('Export'));
    await waitFor(() => screen.getByText('Export CSV'));
    fireEvent.click(screen.getByText('Export CSV'));
    expect(csvExport.exportToCSV).not.toHaveBeenCalled();
  });
});
