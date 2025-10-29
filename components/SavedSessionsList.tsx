import React, { useState } from 'react';
import { SavedSession } from '../types';
import ExportModal from './ExportModal';

interface SavedSessionsListProps {
    sessions: SavedSession[];
    activeSessionId: string | null;
    onLoad: (sessionId: string) => void;
    onRename: (sessionId: string, newName: string) => void;
    onDelete: (sessionId: string) => void;
}

const PencilIcon: React.FC = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path d="M17.414 2.586a2 2 0 00-2.828 0L7 10.172V13h2.828l7.586-7.586a2 2 0 000-2.828z" /><path fillRule="evenodd" d="M2 6a2 2 0 012-2h4a1 1 0 010 2H4v10h10v-4a1 1 0 112 0v4a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" clipRule="evenodd" /></svg>;
const TrashIcon: React.FC = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" /></svg>;
const ViewIcon: React.FC = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor"><path d="M10 12a2 2 0 100-4 2 2 0 000 4z" /><path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.022 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" /></svg>;


const SavedSessionsList: React.FC<SavedSessionsListProps> = ({ sessions, activeSessionId, onLoad, onRename, onDelete }) => {
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [renameModal, setRenameModal] = useState<{ isOpen: boolean; session: SavedSession | null }>({ isOpen: false, session: null });

    const handleRenameClick = (session: SavedSession) => {
        setRenameModal({ isOpen: true, session });
    };

    const handleConfirmRename = (newName: string) => {
        if (renameModal.session) {
            onRename(renameModal.session.id, newName);
        }
        setRenameModal({ isOpen: false, session: null });
    };

    const handleDeleteClick = (sessionId: string, sessionName: string) => {
        if (window.confirm(`คุณแน่ใจหรือไม่ว่าต้องการลบ "${sessionName}"?`)) {
            onDelete(sessionId);
        }
    };

    return (
        <>
            <div id="saved-sessions-section" className="w-full max-w-5xl mx-auto bg-white shadow-xl rounded-2xl overflow-hidden no-print">
                <div className="flex justify-between items-center p-6 bg-gray-100 border-b">
                    <h2 className="text-2xl font-bold text-gray-800">ประวัติการวิเคราะห์ที่บันทึกไว้</h2>
                    <button 
                        onClick={() => setIsCollapsed(!isCollapsed)}
                        className="p-2 rounded-full hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-100 focus:ring-blue-500"
                        aria-label={isCollapsed ? 'ขยาย' : 'ย่อ'}
                        aria-expanded={!isCollapsed}
                        aria-controls="collapsible-sessions-list"
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
                <div 
                    id="collapsible-sessions-list"
                    className={`transition-all duration-500 ease-in-out overflow-hidden ${isCollapsed ? 'max-h-0' : 'max-h-[1000px]'}`}
                >
                    <div className="overflow-x-auto">
                        {sessions.length > 0 ? (
                            <ul className="divide-y divide-gray-200">
                                {sessions.map(session => (
                                    <li 
                                        key={session.id} 
                                        className={`p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between transition-colors ${activeSessionId === session.id ? 'bg-blue-50' : 'hover:bg-gray-50'}`}
                                    >
                                        <div className='flex-1 mb-3 sm:mb-0'>
                                            <p className={`font-semibold break-words ${activeSessionId === session.id ? 'text-blue-700' : 'text-gray-900'}`}>
                                                {session.name}
                                            </p>
                                            <p className="text-sm text-gray-500 mt-1">
                                                {new Date(session.timestamp).toLocaleString('th-TH')}
                                            </p>
                                        </div>
                                        <div className="flex items-center space-x-2 flex-shrink-0">
                                            <button 
                                                onClick={() => onLoad(session.id)}
                                                className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                                            >
                                                <ViewIcon />
                                                เปิดดู
                                            </button>
                                            <button 
                                                onClick={() => handleRenameClick(session)} 
                                                className="p-2 text-gray-500 hover:text-blue-600 hover:bg-gray-100 rounded-full"
                                                title="แก้ไขชื่อ"
                                            >
                                                <PencilIcon />
                                            </button>
                                            <button 
                                                onClick={() => handleDeleteClick(session.id, session.name)} 
                                                className="p-2 text-gray-500 hover:text-red-600 hover:bg-gray-100 rounded-full"
                                                title="ลบ"
                                            >
                                                <TrashIcon />
                                            </button>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <p className="p-6 text-center text-gray-500">ไม่มีข้อมูลที่บันทึกไว้</p>
                        )}
                    </div>
                </div>
            </div>
            {renameModal.session && (
                 <ExportModal
                    isOpen={renameModal.isOpen}
                    onClose={() => setRenameModal({ isOpen: false, session: null })}
                    onSave={handleConfirmRename}
                    initialValue={renameModal.session.name}
                    title="แก้ไขชื่อ"
                    saveButtonText="บันทึก"
                />
            )}
        </>
    );
};

export default SavedSessionsList;