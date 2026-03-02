import React, { useEffect, useRef, useState } from 'react';
import SimplePeer from 'simple-peer';
import { 
  IoMdMic, IoMdMicOff, IoMdCall, 
  IoIosArrowBack 
} from 'react-icons/io';
import { 
  RiVidiconFill, RiCameraOffFill, 
  RiUserFill, RiShieldCheckFill 
} from 'react-icons/ri';

const VideoCall = ({ socket, user, roomId, onClose, isInitiator, signalData }) => {
  const [stream, setStream] = useState(null);
  const [callAccepted, setCallAccepted] = useState(false);
  const [micOn, setMicOn] = useState(true);
  const [videoOn, setVideoOn] = useState(true);
  
  const myVideo = useRef();
  const userVideo = useRef();
  const connectionRef = useRef();
  const streamRef = useRef();
  const connectionStarted = useRef(false);

  // --- INTERNAL LOGIC (UNCHANGED AS REQUESTED) ---
  useEffect(() => {
    if (connectionStarted.current) return;
    connectionStarted.current = true;

    navigator.mediaDevices.getUserMedia({ video: true, audio: true })
      .then((currentStream) => {
        setStream(currentStream);
        streamRef.current = currentStream;
        
        if (myVideo.current) {
          myVideo.current.srcObject = currentStream;
        }

        const peer = new SimplePeer({
          initiator: isInitiator,
          trickle: false,
          stream: currentStream,
          config: {
            iceServers: [
              { urls: 'stun:stun.l.google.com:19302' },
              { urls: 'stun:stun1.l.google.com:19302' },
              { urls: 'stun:stun2.l.google.com:19302' },
              { urls: 'stun:stun3.l.google.com:19302' },
              { urls: 'stun:stun4.l.google.com:19302' }
              // Note: If you register for Metered TURN, add those credentials right here later
            ]
          }
        });

        peer.on('signal', (data) => {
          if (socket.current && socket.current.readyState === WebSocket.OPEN) {
            socket.current.send(JSON.stringify({
              type: isInitiator ? 'call_user' : 'answer_call',
              data: data,
              sender_id: user.id
            }));
          }
        });

        peer.on('stream', (remoteStream) => {
          if (userVideo.current) {
            userVideo.current.srcObject = remoteStream;
          }
        });

        peer.on('close', () => endCall(false));

        if (!isInitiator && signalData) {
          peer.signal(signalData);
        }

        const handleSignal = (event) => {
          const message = JSON.parse(event.data);
          if (message.type === 'answer_call' && isInitiator) {
            setCallAccepted(true);
            peer.signal(message.data);
            if (socket.current && socket.current.readyState === WebSocket.OPEN) {
                socket.current.send(JSON.stringify({
                    message: "Video call started",
                    sender_id: user.id,
                    file_type: 'system'
                }));
            }
          } 
          if (message.type === 'call_ended') endCall(false);
        };

        socket.current.addEventListener('message', handleSignal);
        connectionRef.current = peer;
        return () => {
            if(socket.current) socket.current.removeEventListener('message', handleSignal);
        };
      })
      .catch(err => {
          console.error("Media Error:", err);
          onClose();
      });

      return () => {
          stopMedia();
          if(connectionRef.current) connectionRef.current.destroy();
      };
  }, []);

  const stopMedia = () => {
    if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => {
            track.stop();
            track.enabled = false;
        });
        streamRef.current = null;
    }
  };

  const endCall = (emitSignal = true) => {
    stopMedia();
    if (emitSignal && socket.current && socket.current.readyState === WebSocket.OPEN) {
        socket.current.send(JSON.stringify({ type: 'call_ended' }));
        socket.current.send(JSON.stringify({
            message: "Video call ended",
            sender_id: user.id,
            file_type: 'system'
        }));
    }
    if (connectionRef.current) connectionRef.current.destroy();
    onClose();
  };

  const toggleMic = () => {
    if(streamRef.current) {
        const audioTrack = streamRef.current.getAudioTracks()[0];
        if (audioTrack) {
            audioTrack.enabled = !micOn;
            setMicOn(!micOn);
        }
    }
  };

  const toggleVideo = () => {
    if(streamRef.current) {
        const videoTrack = streamRef.current.getVideoTracks()[0];
        if (videoTrack) {
            videoTrack.enabled = !videoOn;
            setVideoOn(!videoOn);
        }
    }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-slate-950 flex flex-col h-[100dvh] w-screen overflow-hidden select-none animate-in fade-in duration-500">
      
      {/* 1. HEADER: Global across devices */}
      <header className="h-16 md:h-20 flex items-center justify-between px-4 md:px-8 z-50 bg-gradient-to-b from-slate-950 to-transparent">
        <button onClick={() => endCall(true)} className="p-2 text-slate-400 hover:text-white transition-colors">
          <IoIosArrowBack size={24} />
        </button>
        
        <div className="flex flex-col items-center">
          <span className="text-white text-sm font-semibold tracking-wide">Secure Video Call</span>
          <div className="flex items-center gap-1.5">
            <RiShieldCheckFill className="text-emerald-500 text-xs" />
            <span className="text-[10px] text-slate-400 uppercase tracking-tighter">End-to-End Encrypted</span>
          </div>
        </div>

        <div className="w-10 h-10 bg-slate-800 rounded-full flex items-center justify-center border border-slate-700">
          <RiUserFill className="text-slate-400" />
        </div>
      </header>

      {/* 2. MAIN VIEWPORT: Flex-1 ensures this area takes remaining space */}
      <main className="flex-1 relative w-full flex items-center justify-center p-2 md:p-6 overflow-hidden">
        
        {/* Remote Video Container */}
        <div className="relative w-full h-full max-w-7xl bg-slate-900 rounded-[2rem] md:rounded-[3rem] overflow-hidden shadow-2xl border border-white/5 ring-1 ring-white/10 flex items-center justify-center">
            {callAccepted || !isInitiator ? (
                <video 
                    playsInline 
                    ref={userVideo} 
                    autoPlay 
                    className="w-full h-full object-cover md:object-contain transition-opacity duration-1000" 
                />
            ) : (
                <div className="flex flex-col items-center gap-6">
                    <div className="relative">
                      <div className="absolute inset-0 bg-blue-500 rounded-full blur-2xl opacity-20 animate-pulse"></div>
                      <div className="w-20 h-20 bg-blue-600 rounded-3xl flex items-center justify-center shadow-2xl relative rotate-12">
                          <RiVidiconFill size={36} className="text-white -rotate-12 animate-pulse" />
                      </div>
                    </div>
                    <div className="text-center space-y-1">
                      <p className="text-white font-medium">Waiting for participant...</p>
                      <p className="text-slate-500 text-xs">Awaiting secure handshake</p>
                    </div>
                </div>
            )}

            {/* Local Preview (PiP) - Repositioned for Mobile vs Desktop */}
            <div className="absolute top-4 right-4 md:bottom-8 md:right-8 w-28 md:w-64 aspect-video bg-slate-800 rounded-2xl overflow-hidden border-2 border-white/10 shadow-2xl z-40 transition-all hover:scale-105 duration-300">
                {!videoOn && (
                    <div className="absolute inset-0 flex items-center justify-center bg-slate-900 z-10">
                        <RiCameraOffFill className="text-slate-600 text-xl" />
                    </div>
                )}
                <video 
                    playsInline 
                    ref={myVideo} 
                    autoPlay 
                    muted 
                    className="w-full h-full object-cover scale-x-[-1]" 
                />
            </div>
        </div>
      </main>

      {/* 3. CONTROL DOCK: Locked to bottom regardless of zoom */}
      <footer className="h-28 md:h-40 flex items-center justify-center px-6 bg-gradient-to-t from-slate-950 to-transparent">
        <div className="flex items-center gap-4 md:gap-10 p-3 md:p-5 bg-white/5 backdrop-blur-3xl border border-white/10 rounded-[2.5rem] md:rounded-[3.5rem] shadow-2xl ring-1 ring-white/10 transition-all hover:bg-white/10">
            
            {/* Toggle Mic */}
            <button 
                onClick={toggleMic} 
                className={`group relative p-4 md:p-6 rounded-3xl transition-all duration-300 ${
                    micOn ? 'bg-slate-800/80 hover:bg-slate-700 text-white' : 'bg-red-500/90 text-white shadow-lg shadow-red-500/20'
                }`}
            >
                {micOn ? <IoMdMic size={24} /> : <IoMdMicOff size={24} />}
                <div className="absolute -top-12 left-1/2 -translate-x-1/2 bg-slate-800 text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity hidden md:block">
                  {micOn ? 'Mute' : 'Unmute'}
                </div>
            </button>

            {/* Hang Up */}
            <button 
                onClick={() => endCall(true)} 
                className="group p-5 md:p-8 rounded-3xl md:rounded-[2.5rem] bg-red-600 hover:bg-red-500 text-white transition-all duration-500 shadow-[0_15px_40px_rgba(220,38,38,0.4)] hover:rotate-[135deg] active:scale-90"
            >
                <IoMdCall size={32} className="rotate-[135deg] group-hover:scale-110 transition-transform" />
            </button>

            {/* Toggle Video */}
            <button 
                onClick={toggleVideo} 
                className={`group relative p-4 md:p-6 rounded-3xl transition-all duration-300 ${
                    videoOn ? 'bg-slate-800/80 hover:bg-slate-700 text-white' : 'bg-red-500/90 text-white shadow-lg shadow-red-500/20'
                }`}
            >
                {videoOn ? <RiVidiconFill size={24} /> : <RiCameraOffFill size={24} />}
                <div className="absolute -top-12 left-1/2 -translate-x-1/2 bg-slate-800 text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity hidden md:block">
                  {videoOn ? 'Stop Video' : 'Start Video'}
                </div>
            </button>
        </div>
      </footer>

      {/* Embedded CSS for custom scroll-prevention */}
      <style jsx>{`
        .rotate-135 { transform: rotate(135deg); }
        @media (max-height: 500px) {
          header { height: 40px; padding: 0 10px; }
          footer { height: 80px; }
          .rounded-3xl { border-radius: 1rem; }
        }
      `}</style>
    </div>
  );
};

export default VideoCall;