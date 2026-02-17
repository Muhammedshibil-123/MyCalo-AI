import React, { createContext, useContext, useState } from 'react';
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

    // 1. Add Optimistic Message to Context
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
      // 2. Upload to Backend
      await api.post('/chat/upload/', formData, {
        skipLoading: true,
        onUploadProgress: (progressEvent) => {
          const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          // Only go up to 90% via axios, leave rest for "processing" state
          const visualPercent = Math.min(percent, 90);
          updateUploadProgress(roomId, tempId, visualPercent, 'uploading');
        }
      });

      // 3. Upload Done, now "Processing" in Celery
      updateUploadProgress(roomId, tempId, 92, 'processing');

      // 4. Fake progress crawl from 92% to 99% while waiting for WebSocket message
      let currentProgress = 92;
      const interval = setInterval(() => {
        currentProgress += Math.random() * 3;
        
        if (currentProgress >= 99) {
          clearInterval(interval);
          return;
        }

        setRoomUploads(current => {
            const roomMsgs = current[roomId] || [];
            const target = roomMsgs.find(m => m.tempId === tempId);
            
            // If message removed (real one arrived), stop
            if (!target) {
                clearInterval(interval);
                return current;
            }

            return {
                ...current,
                [roomId]: roomMsgs.map(m => 
                    m.tempId === tempId 
                      ? { ...m, progress: Math.min(currentProgress, 99) } 
                      : m
                )
            };
        });
      }, 500);

      // 5. Wait a bit longer for WebSocket to deliver the actual message
      // This timeout handles the case where WebSocket takes time to deliver
      setTimeout(() => {
        setRoomUploads(current => {
          const roomMsgs = current[roomId] || [];
          // If temp message still exists after 15 seconds, remove it
          // (assume it was delivered but UI didn't sync properly)
          if (roomMsgs.some(m => m.tempId === tempId)) {
            return {
              ...current,
              [roomId]: roomMsgs.filter(m => m.tempId !== tempId)
            };
          }
          return current;
        });
        clearInterval(interval);
      }, 15000);

    } catch (error) {
      console.error("Upload failed", error);
      removeUpload(roomId, tempId);
      alert("Failed to send media. Please try again.");
    }
  };

  return (
    <UploadContext.Provider value={{ roomUploads, uploadFile, removeUpload }}>
      {children}
    </UploadContext.Provider>
  );
};