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
    <div className="fixed inset-0 z-[100] bg-slate-950 flex flex-col overflow-hidden">
      
      {/* 1. TOP BAR (Encryption Info) */}
      <div className="absolute top-0 left-0 right-0 p-6 flex justify-between items-start z-[110] pointer-events-none">
        <div className="flex items-center gap-2 bg-emerald-500/10 backdrop-blur-md border border-emerald-500/20 px-4 py-2 rounded-full pointer-events-auto">
          <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
          <span className="text-emerald-500 text-[10px] font-bold uppercase tracking-widest">Secure Connection</span>
        </div>

        {/* Local Self Video (Locked to Top Right) */}
        <div className="w-32 md:w-56 aspect-video bg-slate-800 rounded-2xl overflow-hidden border border-white/10 shadow-2xl pointer-events-auto transform hover:scale-105 transition-all duration-300">
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

      {/* 2. MAIN VIDEO VIEWPORT */}
      <div className="relative flex-1 w-full h-full flex items-center justify-center bg-slate-900">
          {callAccepted || !isInitiator ? (
              <video 
                playsInline 
                ref={userVideo} 
                autoPlay 
                className="w-full h-full object-cover md:object-contain" 
              />
          ) : (
              <div className="flex flex-col items-center gap-6">
                <div className="relative flex items-center justify-center">
                  <div className="absolute w-24 h-24 bg-blue-500/20 rounded-full animate-ping"></div>
                  <div className="relative w-20 h-20 bg-blue-600 rounded-full flex items-center justify-center shadow-lg">
                    <RiVidiconFill size={32} className="text-white animate-pulse" />
                  </div>
                </div>
                <h2 className="text-white text-xl font-medium tracking-wide">Connecting...</h2>
              </div>
          )}
      </div>

      {/* 3. BOTTOM CONTROLS (Fixed at bottom, never hidden) */}
      <div className="h-32 md:h-40 w-full flex items-center justify-center bg-gradient-to-t from-slate-950 to-transparent relative z-[120]">
        <div className="flex items-center gap-6 md:gap-10 px-8 py-4 bg-white/5 backdrop-blur-2xl border border-white/10 rounded-3xl shadow-2xl mb-6">
            
            {/* Mic Toggle */}
            <button 
              onClick={toggleMic} 
              className={`p-4 rounded-2xl transition-all duration-300 ${
                micOn ? 'bg-slate-800/80 hover:bg-slate-700 text-white' : 'bg-red-500 text-white animate-bounce'
              }`}
            >
              {micOn ? <IoMdMic size={24} /> : <IoMdMicOff size={24} />}
            </button>

            {/* End Call Button */}
            <button 
              onClick={() => endCall(true)} 
              className="p-5 rounded-2xl bg-red-600 hover:bg-red-500 text-white transition-all duration-300 shadow-[0_0_30px_rgba(220,38,38,0.3)] group"
            >
              <IoMdCall size={32} className="rotate-[135deg] group-hover:scale-110 transition-transform" />
            </button>

            {/* Video Toggle */}
            <button 
              onClick={toggleVideo} 
              className={`p-4 rounded-2xl transition-all duration-300 ${
                videoOn ? 'bg-slate-800/80 hover:bg-slate-700 text-white' : 'bg-red-500 text-white animate-bounce'
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