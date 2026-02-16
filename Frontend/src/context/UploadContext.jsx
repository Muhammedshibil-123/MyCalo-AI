import React, { createContext, useContext, useState, useCallback } from 'react';
import api from '../lib/axios';

const UploadContext = createContext();

export const useUpload = () => useContext(UploadContext);

export const UploadProvider = ({ children }) => {
  const [uploads, setUploads] = useState([]);

  // Use useCallback so this function reference doesn't change and cause re-renders
  const uploadFile = useCallback(async (file, roomId) => {
    const uploadId = Date.now();
    
    // Add to list
    setUploads(prev => [...prev, { id: uploadId, fileName: file.name, status: 'uploading', progress: 0 }]);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('room_id', roomId);

    try {
      // 1. Upload to Backend (Progress bar tracks this part)
      await api.post('/chat/upload/', formData, {
        // Remove 'Content-Type' header to let browser handle boundary
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          // Functional update prevents dependency issues
          setUploads(prev => prev.map(u => 
            u.id === uploadId ? { ...u, progress: percentCompleted } : u
          ));
        }
      });

      // 2. Success
      setUploads(prev => prev.map(u => 
        u.id === uploadId ? { ...u, status: 'processing', progress: 100 } : u
      ));

      // Remove notification after 4 seconds
      setTimeout(() => {
        setUploads(prev => prev.filter(u => u.id !== uploadId));
      }, 4000);

    } catch (error) {
      console.error("Upload failed", error);
      setUploads(prev => prev.map(u => 
        u.id === uploadId ? { ...u, status: 'error' } : u
      ));
    }
  }, []);

  return (
    <UploadContext.Provider value={{ uploadFile }}>
      {/* 1. The Children (Your App) - Won't re-render on progress update */}
      {children}
      
      {/* 2. The Progress Bar - WILL re-render (which is what we want) */}
      <FloatingUploadIndicator uploads={uploads} />
    </UploadContext.Provider>
  );
};

// Separate component to isolate re-renders
const FloatingUploadIndicator = ({ uploads }) => {
  if (uploads.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 space-y-2 pointer-events-none">
      {uploads.map(upload => (
        <div key={upload.id} className="bg-white p-3 rounded-xl shadow-xl border border-gray-100 w-72 animate-slide-up pointer-events-auto">
          <div className="flex justify-between mb-1">
            <span className="text-sm font-bold truncate w-2/3 text-gray-700">{upload.fileName}</span>
            <span className="text-xs font-medium text-blue-600">
              {upload.status === 'processing' ? 'Processing...' : `${upload.progress}%`}
            </span>
          </div>
          {upload.status === 'error' ? (
            <div className="text-xs text-red-500 font-bold">Upload Failed</div>
          ) : (
            <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
              <div 
                className={`h-full transition-all duration-200 ${
                  upload.status === 'processing' ? 'bg-green-500 animate-pulse' : 'bg-blue-600'
                }`} 
                style={{ width: `${upload.progress}%` }}
              ></div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};