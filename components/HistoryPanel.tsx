import React, { useState } from 'react';
import { SavedSession } from '../types';
import ExportModal from './ExportModal';

interface HistoryPanelProps {
    sessions: SavedSession[];
    activeSessionId: string | null;
    onLoad: (sessionId: string) => void;
    onRename: (sessionId: string, newName: string) => void;
    onDelete: (sessionId: string) => void;
}

const PencilIcon: React.FC = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path d="M17.414 2.586a2 2 0 00-2.828 0L7 10.172V13h2.828l7.586-7.586a2 2 0 000-2.828z" /><path fillRule="evenodd" d="M2 6a2 2 0 012-2h4a1 1 0 010 2H4v10h10v-4a1 1 0 112 0v4a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" clipRule="evenodd" /></svg>;
const TrashIcon: React.FC = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" /></svg>;

const HistoryPanel: React.FC<HistoryPanelProps> = ({ sessions, activeSessionId, onLoad, onRename, onDelete }) => {
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
    }

    return (
        <>
            <aside className="w-80 bg-white h-screen flex-shrink-0 border-r border-gray-200 flex flex-col no-print">
                <div className="p-4 border-b border-gray-200">
                    <h2 className="text-xl font-bold text-gray-800">ประวัติการวิเคราะห์</h2>
                </div>
                <div className="flex-1 overflow-y-auto">
                    {sessions.length > 0 ? (
                        <ul>
                            {sessions.map(session => (
                                <li 
                                    key={session.id} 
                                    className={`border-b border-gray-100 group ${activeSessionId === session.id ? 'bg-blue-50' : ''}`}
                                >
                                    <div className="p-4 flex flex-col">
                                        <div className="flex justify-between items-start">
                                            <button 
                                                onClick={() => onLoad(session.id)}
                                                className="text-left flex-1"
                                            >
                                                <p className={`font-semibold text-gray-900 break-words ${activeSessionId === session.id ? 'text-blue-700' : ''}`}>
                                                    {session.name}
                                                </p>
                                                <p className="text-xs text-gray-500 mt-1">
                                                    {new Date(session.timestamp).toLocaleString('th-TH')}
                                                </p>
                                            </button>
                                            <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 ml-2">
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
                                        </div>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <div className="p-6 text-center text-gray-500">
                            <p>ยังไม่มีข้อมูลที่บันทึกไว้</p>
                        </div>
                    )}
                </div>
            </aside>
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

export default HistoryPanel;
