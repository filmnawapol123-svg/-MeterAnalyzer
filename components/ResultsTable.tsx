import React, { useState, useMemo, useEffect, useRef } from 'react';
import { AnalysisResult } from '../types';
import ExportModal from './ExportModal';

interface ResultsTableProps {
  results: AnalysisResult[];
  onSaveSession: () => void;
}

const CheckIcon: React.FC = () => (
    <svg className="w-6 h-6 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
    </svg>
);

const CrossIcon: React.FC = () => (
    <svg className="w-6 h-6 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
    </svg>
);

const SortIcon: React.FC<{ direction: 'asc' | 'desc' | 'none' }> = ({ direction }) => {
    const baseClasses = "w-4 h-4 inline-block ml-1 transition-opacity";
    if (direction === 'none') {
        return <svg className={`${baseClasses} text-gray-400 opacity-30 group-hover:opacity-100`} aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 9l4-4 4 4m0 6l-4 4-4-4"/></svg>;
    }
    return direction === 'asc' ? (
        <svg className={`${baseClasses} text-blue-600`} aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 15l7-7 7 7"/></svg>
    ) : (
        <svg className={`${baseClasses} text-blue-600`} aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"/></svg>
    );
};


const ResultsTable: React.FC<ResultsTableProps> = ({ results, onSaveSession }) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [sortConfig, setSortConfig] = useState<{ key: keyof AnalysisResult | null; direction: 'asc' | 'desc' }>({ key: null, direction: 'asc' });
  const [isExportMenuOpen, setIsExportMenuOpen] = useState(false);
  const exportMenuRef = useRef<HTMLDivElement>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [exportFileType, setExportFileType] = useState<'csv' | null>(null);

  const sortedResults = useMemo(() => {
    if (!results) return [];
    let sortableItems = [...results];
    if (sortConfig.key !== null) {
      sortableItems.sort((a, b) => {
        const aValue = a[sortConfig.key!];
        const bValue = b[sortConfig.key!];

        if (aValue === null || aValue === undefined) return 1;
        if (bValue === null || bValue === undefined) return -1;
        
        if (aValue < bValue) {
          return sortConfig.direction === 'asc' ? -1 : 1;
        }
        if (aValue > bValue) {
          return sortConfig.direction === 'asc' ? 1 : -1;
        }
        return 0;
      });
    }
    return sortableItems;
  }, [results, sortConfig]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (exportMenuRef.current && !exportMenuRef.current.contains(event.target as Node)) {
        setIsExportMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const openExportModal = (type: 'csv') => {
    setExportFileType(type);
    setIsModalOpen(true);
    setIsExportMenuOpen(false); // Close the dropdown
  };

  const handleExport = (filename: string) => {
    if (!exportFileType) return;

    const headers = ['เงื่อนไขตรวจสอบ', 'สมการที่คำนวณ', 'ผลลัพธ์ที่ได้', 'ค่าที่ควรเป็น', 'สถานะ', 'เหตุผล'];
    const csvRows = [headers.join(',')];

    sortedResults.forEach(result => {
        const statusText = result.status ? 'ผ่าน' : 'ไม่ผ่าน';
        const reasonText = result.reason ? result.reason.replace(/"/g, '""') : '';
        const values = [
            `"${result.condition}"`,
            `"${result.calculation}"`,
            `"${result.actualResult}"`,
            `"${result.expectedValue}"`,
            `"${statusText}"`,
            `"${reasonText}"`
        ];
        csvRows.push(values.join(','));
    });

    const fileContent = csvRows.join('\n');
    const blob = new Blob([`\uFEFF${fileContent}`], { type: 'text/csv;charset=utf-8;' });
    
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `${filename}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    setIsModalOpen(false);
    setExportFileType(null);
  };

  const handlePrint = () => {
    window.print();
    setIsExportMenuOpen(false);
  };

  const requestSort = (key: keyof AnalysisResult) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  if (!results || results.length === 0) {
    return null;
  }

  const getSortDirectionForKey = (key: keyof AnalysisResult) => {
      return sortConfig.key === key ? sortConfig.direction : 'none';
  }

  const defaultFilename = `analysis-results-${new Date().toISOString().slice(0, 10)}`;

  return (
    <>
    <div id="results-section" className="w-full max-w-5xl mx-auto mt-8 bg-white shadow-xl rounded-2xl overflow-hidden">
        <div className="flex justify-between items-center p-6 bg-gray-100 border-b">
            <h2 className="text-2xl font-bold text-gray-800">ผลการตรวจสอบ</h2>
            <div className="flex items-center space-x-2 no-print">
                <button
                    onClick={onSaveSession}
                    className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M7.707 10.293a1 1 0 10-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L11 11.586V6h5a2 2 0 012 2v7a2 2 0 01-2 2H4a2 2 0 01-2-2V8a2 2 0 012-2h5v5.586l-1.293-1.293zM9 4a1 1 0 012 0v2H9V4z" />
                    </svg>
                    บันทึกผล
                </button>
                <div className="relative" ref={exportMenuRef}>
                    <button
                        onClick={() => setIsExportMenuOpen(!isExportMenuOpen)}
                        className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                        ส่งออก
                        <svg className="-mr-1 ml-2 h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                            <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                    </button>
                    {isExportMenuOpen && (
                        <div className="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 focus:outline-none z-10">
                            <div className="py-1" role="menu" aria-orientation="vertical" aria-labelledby="options-menu">
                                <button onClick={() => openExportModal('csv')} className="w-full text-left block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900" role="menuitem">
                                    ดาวน์โหลด CSV
                                </button>
                                <button onClick={handlePrint} className="w-full text-left block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900" role="menuitem">
                                    พิมพ์
                                </button>
                            </div>
                        </div>
                    )}
                </div>
                 <button 
                    onClick={() => setIsCollapsed(!isCollapsed)}
                    className="p-2 rounded-full hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-100 focus:ring-blue-500"
                    aria-label={isCollapsed ? 'ขยายผลลัพธ์' : 'ย่อผลลัพธ์'}
                    aria-expanded={!isCollapsed}
                    aria-controls="collapsible-results-table"
                    title={isCollapsed ? 'ขยาย' : 'ย่อ'}
                >
                    <svg 
                        xmlns="http://www.w3.org/2000/svg" 
                        className={`h-5 w-5 text-gray-700 transition-transform duration-300 ${isCollapsed ? 'rotate-180' : ''}`} 
                        fill="none" 
                        viewBox="0 0 24 24" 
                        stroke="currentColor" strokeWidth={2}
                    >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
                    </svg>
                </button>
            </div>
        </div>
        <div 
            id="collapsible-results-table"
            className={`transition-all duration-500 ease-in-out overflow-hidden ${isCollapsed ? 'max-h-0' : 'max-h-[1000px]'}`}
        >
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                    <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            <button onClick={() => requestSort('condition')} className="group flex items-center focus:outline-none focus:text-blue-600">
                                <span>เงื่อนไขตรวจสอบ</span>
                                <SortIcon direction={getSortDirectionForKey('condition')} />
                            </button>
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">สมการที่คำนวณ</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ผลลัพธ์ที่ได้</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ค่าที่ควรเป็น</th>
                        <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                            <button onClick={() => requestSort('status')} className="group flex items-center mx-auto focus:outline-none focus:text-blue-600">
                                <span>สถานะ</span>
                                <SortIcon direction={getSortDirectionForKey('status')} />
                            </button>
                        </th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                    {sortedResults.map((result, index) => (
                    <tr key={index} className={`${result.status ? 'bg-green-50 hover:bg-green-100' : 'bg-red-50 hover:bg-red-100'} transition-colors`}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{result.condition}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 font-mono">{result.calculation}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 font-mono">{result.actualResult}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 font-mono">{result.expectedValue}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-center">
                        <div className={`inline-flex items-center justify-center space-x-2 px-3 py-1 rounded-full ${result.status ? 'bg-green-100' : 'bg-red-100'}`}>
                            {result.status ? <CheckIcon /> : <CrossIcon />}
                            <span className={`font-semibold ${result.status ? 'text-green-600' : 'text-red-600'}`}>
                                {result.status ? 'ผ่าน' : 'ไม่ผ่าน'}
                            </span>
                        </div>
                        {!result.status && result.reason && (
                            <p className="text-xs text-red-500 mt-1">{result.reason}</p>
                        )}
                        </td>
                    </tr>
                    ))}
                </tbody>
                </table>
            </div>
        </div>
    </div>
    <ExportModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleExport}
        initialValue={defaultFilename}
        fileExtension={'csv'}
        title="ตั้งชื่อไฟล์สำหรับดาวน์โหลด"
        saveButtonText="ดาวน์โหลด"
      />
    </>
  );
};

export default ResultsTable;