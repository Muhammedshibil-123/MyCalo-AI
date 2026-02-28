import React, { useEffect, useRef, useState } from 'react';
import SimplePeer from 'simple-peer';
import { IoMdMic, IoMdMicOff, IoMdCall } from 'react-icons/io';
import { RiVidiconFill, RiCameraOffFill } from 'react-icons/ri';
import { MdScreenShare, MdStopScreenShare } from 'react-icons/md';

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
    <div className="fixed inset-0 z-[100] bg-slate-950 flex flex-col items-center justify-center animate-in fade-in duration-300">
      
      {/* Main Video Container */}
      <div className="relative w-full h-full flex items-center justify-center overflow-hidden">
        
        {/* Remote Video (Full Screen) */}
        <div className="absolute inset-0 w-full h-full bg-slate-900">
            {callAccepted || !isInitiator ? (
                <video 
                    playsInline 
                    ref={userVideo} 
                    autoPlay 
                    className="w-full h-full object-cover md:object-contain transition-opacity duration-700" 
                />
            ) : (
                <div className="w-full h-full flex flex-col items-center justify-center space-y-6">
                    <div className="relative">
                        <div className="w-24 h-24 bg-blue-500/20 rounded-full flex items-center justify-center animate-ping absolute inset-0"></div>
                        <div className="w-24 h-24 bg-blue-600 rounded-full flex items-center justify-center relative z-10 shadow-[0_0_30px_rgba(37,99,235,0.5)]">
                            <RiVidiconFill className="text-white text-4xl animate-pulse" />
                        </div>
                    </div>
                    <div className="text-center">
                        <h2 className="text-white text-2xl font-bold tracking-wide">Calling Participant...</h2>
                        <p className="text-slate-400 text-sm mt-2">Connecting to secure server</p>
                    </div>
                </div>
            )}
        </div>

        {/* Local Self Video (Floating PiP) */}
        <div className="absolute top-6 right-6 w-32 md:w-64 aspect-video bg-slate-800 rounded-2xl overflow-hidden border border-white/10 shadow-2xl z-50 transform hover:scale-105 transition-transform duration-300">
            {!videoOn && (
                <div className="absolute inset-0 flex items-center justify-center bg-slate-800 z-10">
                    <RiCameraOffFill className="text-slate-500 text-2xl" />
                </div>
            )}
            <video 
                playsInline 
                ref={myVideo} 
                autoPlay 
                muted 
                className="w-full h-full object-cover scale-x-[-1]" 
            />
            <div className="absolute bottom-2 left-2 bg-black/40 backdrop-blur-md px-2 py-0.5 rounded text-[10px] text-white font-medium">
                You
            </div>
        </div>

        {/* Floating Controls Bar */}
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex items-center gap-4 md:gap-8 px-8 py-4 bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.3)] z-50 transition-all hover:bg-white/15">
            
            {/* Mic Toggle */}
            <button 
                onClick={toggleMic} 
                className={`group p-4 rounded-2xl transition-all duration-300 ${
                    micOn ? 'bg-slate-700/50 hover:bg-slate-600 text-white' : 'bg-red-500 text-white animate-pulse'
                }`}
            >
                {micOn ? <IoMdMic size={24} /> : <IoMdMicOff size={24} />}
                <span className="absolute -top-10 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                    {micOn ? 'Mute' : 'Unmute'}
                </span>
            </button>

            {/* End Call Button */}
            <button 
                onClick={() => endCall(true)} 
                className="group p-5 rounded-2xl bg-red-600 hover:bg-red-500 hover:rotate-135 text-white transition-all duration-500 shadow-[0_0_20px_rgba(220,38,38,0.4)] active:scale-90"
            >
                <IoMdCall size={32} className="rotate-[135deg]" />
                <span className="absolute -top-10 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                    Leave Call
                </span>
            </button>

            {/* Video Toggle */}
            <button 
                onClick={toggleVideo} 
                className={`group p-4 rounded-2xl transition-all duration-300 ${
                    videoOn ? 'bg-slate-700/50 hover:bg-slate-600 text-white' : 'bg-red-500 text-white animate-pulse'
                }`}
            >
                {videoOn ? <RiVidiconFill size={24} /> : <RiCameraOffFill size={24} />}
                <span className="absolute -top-10 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                    {videoOn ? 'Camera Off' : 'Camera On'}
                </span>
            </button>

        </div>

        {/* Security / Info Badge */}
        <div className="absolute top-6 left-6 flex items-center gap-2 bg-emerald-500/10 backdrop-blur-md border border-emerald-500/20 px-4 py-2 rounded-full">
            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
            <span className="text-emerald-500 text-xs font-bold uppercase tracking-wider">End-to-End Encrypted</span>
        </div>

      </div>

      <style jsx>{`
        @keyframes fade-in { from { opacity: 0; } to { opacity: 1; } }
        .animate-fade-in { animation: fade-in 0.3s ease-out; }
        
        .rotate-135 { transform: rotate(135deg); }
        
        @media (max-height: 600px) {
          .absolute.bottom-10 { bottom: 20px; }
        }
      `}</style>
    </div>
  );
};

export default VideoCall;