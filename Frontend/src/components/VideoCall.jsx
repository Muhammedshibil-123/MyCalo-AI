import React, { useEffect, useRef, useState } from 'react';
import SimplePeer from 'simple-peer';
import { IoMdMic, IoMdMicOff, IoMdCall } from 'react-icons/io';
import { RiVidiconFill, RiCameraOffFill } from 'react-icons/ri';

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

        peer.on('close', () => {
            endCall(false);
        });

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
          
          if (message.type === 'call_ended') {
             endCall(false);
          }
        };

        socket.current.addEventListener('message', handleSignal);
        connectionRef.current = peer;

        return () => {
            if(socket.current) socket.current.removeEventListener('message', handleSignal);
        };
      })
      .catch(err => {
          console.error("Media Error:", err);
          alert("Could not access camera/microphone. Please allow permissions.");
          onClose();
      });

      return () => {
          stopMedia();
          if(connectionRef.current) {
              connectionRef.current.destroy();
          }
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
    if (stream) {
        stream.getTracks().forEach(track => track.stop());
        setStream(null);
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
    
    if (connectionRef.current) {
        connectionRef.current.destroy();
    }
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
    <div className="fixed inset-0 z-[100] bg-slate-950 flex flex-col h-screen w-screen overflow-hidden font-sans">
      
      {/* 1. TOP HEADER (Security & Info) */}
      <div className="h-16 flex items-center justify-between px-6 z-50 bg-gradient-to-b from-slate-950/80 to-transparent">
        <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 rounded-full">
          <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
          <span className="text-emerald-500 text-[10px] font-bold uppercase tracking-widest">Encrypted</span>
        </div>
        <div className="text-slate-400 text-xs font-medium">
          Room: <span className="text-slate-200">{roomId}</span>
        </div>
      </div>

      {/* 2. MAIN VIDEO AREA (This section will shrink/grow) */}
      <div className="flex-1 relative w-full flex items-center justify-center p-2 md:p-6 bg-slate-900/40">
        
        {/* Remote Video Container */}
        <div className="relative w-full h-full max-w-6xl aspect-video md:aspect-auto bg-black rounded-3xl overflow-hidden shadow-2xl border border-white/5 flex items-center justify-center">
            {callAccepted || !isInitiator ? (
                <video 
                    playsInline 
                    ref={userVideo} 
                    autoPlay 
                    className="w-full h-full object-cover md:object-contain" 
                />
            ) : (
                <div className="flex flex-col items-center gap-4">
                    <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center animate-bounce shadow-lg shadow-blue-500/20">
                        <RiVidiconFill size={28} className="text-white" />
                    </div>
                    <p className="text-slate-400 text-sm animate-pulse">Waiting for participant...</p>
                </div>
            )}
        </div>

        {/* Local Video (Floating Mini-Window) */}
        <div className="absolute bottom-6 right-6 md:top-10 md:right-10 w-28 md:w-56 aspect-video bg-slate-800 rounded-2xl overflow-hidden border-2 border-white/10 shadow-2xl z-40">
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

      {/* 3. CONTROLS BAR (Locked to Bottom) */}
      <div className="h-28 md:h-36 flex items-center justify-center px-6 bg-gradient-to-t from-slate-950/90 to-transparent">
        <div className="flex items-center gap-4 md:gap-8 p-3 md:p-4 bg-white/5 backdrop-blur-3xl border border-white/10 rounded-[2.5rem] shadow-2xl ring-1 ring-white/10">
            
            {/* Mic Toggle */}
            <button 
                onClick={toggleMic} 
                className={`p-4 md:p-5 rounded-3xl transition-all duration-300 ${
                    micOn ? 'bg-slate-800/80 hover:bg-slate-700 text-white' : 'bg-red-500/90 text-white shadow-lg shadow-red-500/20'
                }`}
            >
                {micOn ? <IoMdMic size={24} /> : <IoMdMicOff size={24} />}
            </button>

            {/* End Call Button */}
            <button 
                onClick={() => endCall(true)} 
                className="p-5 md:p-6 rounded-3xl bg-red-600 hover:bg-red-500 text-white transition-all duration-300 shadow-[0_15px_30px_rgba(220,38,38,0.3)] hover:-rotate-12 active:scale-90"
            >
                <IoMdCall size={32} className="rotate-[135deg]" />
            </button>

            {/* Video Toggle */}
            <button 
                onClick={toggleVideo} 
                className={`p-4 md:p-5 rounded-3xl transition-all duration-300 ${
                    videoOn ? 'bg-slate-800/80 hover:bg-slate-700 text-white' : 'bg-red-500/90 text-white shadow-lg shadow-red-500/20'
                }`}
            >
                {videoOn ? <RiVidiconFill size={24} /> : <RiCameraOffFill size={24} />}
            </button>
        </div>
      </div>

    </div>
  );
};

export default VideoCall;