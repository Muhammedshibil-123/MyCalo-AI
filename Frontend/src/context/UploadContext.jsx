import React, { createContext, useContext, useState, useRef } from 'react';
import api from '../lib/axios';

const UploadContext = createContext();

export const useUpload = () => useContext(UploadContext);

export const UploadProvider = ({ children }) => {
  // Structure: { [roomId]: [ { tempId, fileUrl, fileType, progress, status, ... } ] }
  const [roomUploads, setRoomUploads] = useState({});

  const addUploadToRoom = (roomId, messageObj) => {
    setRoomUploads(prev => ({
      ...prev,
      [roomId]: [...(prev[roomId] || []), messageObj]
    }));
  };

  const updateUploadProgress = (roomId, tempId, progress, status = 'uploading') => {
    setRoomUploads(prev => ({
      ...prev,
      [roomId]: (prev[roomId] || []).map(msg => 
        msg.tempId === tempId ? { ...msg, progress, status } : msg
      )
    }));
  };

  const removeUpload = (roomId, tempId) => {
    setRoomUploads(prev => ({
      ...prev,
      [roomId]: (prev[roomId] || []).filter(msg => msg.tempId !== tempId)
    }));
  };

  const uploadFile = async (file, roomId, typeOverride = null, userId) => {
    const tempId = Date.now();
    const previewUrl = URL.createObjectURL(file);
    
    let type = typeOverride || 'image';
    if (!typeOverride) {
        if (file.type.startsWith('video')) type = 'video';
        else if (file.type.startsWith('audio')) type = 'audio';
    }

    // 1. Add Optimistic Message
    const tempMsg = {
        tempId,
        file_url: previewUrl,
        file_type: type,
        sender_id: userId,
        timestamp: new Date().toISOString(),
        isUploading: true,
        progress: 0,
        status: 'uploading'
    };

    addUploadToRoom(roomId, tempMsg);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('room_id', roomId);

    try {
      await api.post('/chat/upload/', formData, {
        onUploadProgress: (progressEvent) => {
          const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          // Only go up to 90% via axios, leave rest for "processing"
          const visualPercent = Math.min(percent, 90);
          updateUploadProgress(roomId, tempId, visualPercent);
        }
      });

      // 2. Upload Done, now "Processing" in Celery
      updateUploadProgress(roomId, tempId, 92, 'processing');

      // 3. Fake crawl from 92% to 99%
      const interval = setInterval(() => {
        setRoomUploads(current => {
            const roomMsgs = current[roomId] || [];
            const target = roomMsgs.find(m => m.tempId === tempId);
            
            // If message removed (real one arrived), stop
            if (!target) {
                clearInterval(interval);
                return current;
            }

            // Cap at 99%
            if (target.progress >= 99) {
                clearInterval(interval);
                return current;
            }

            return {
                ...current,
                [roomId]: roomMsgs.map(m => 
                    m.tempId === tempId ? { ...m, progress: m.progress + 1 } : m
                )
            };
        });
      }, 500);

    } catch (error) {
      console.error("Upload failed", error);
      removeUpload(roomId, tempId);
      alert("Failed to send media.");
    }
  };

  return (
    <UploadContext.Provider value={{ roomUploads, uploadFile, removeUpload }}>
      {children}
    </UploadContext.Provider>
  );
};