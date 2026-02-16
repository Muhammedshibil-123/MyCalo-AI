import React, { useEffect, useRef, useState } from 'react';
import SimplePeer from 'simple-peer';
import { IoMdMic, IoMdMicOff, IoMdCall } from 'react-icons/io';
// FIX: Switched to RiCameraOffFill as RiVidiconOffFill was missing
import { RiVidiconFill, RiCameraOffFill } from 'react-icons/ri'; 

const VideoCall = ({ socket, user, roomId, onClose, isInitiator, signalData }) => {
  const [stream, setStream] = useState(null);
  const [callAccepted, setCallAccepted] = useState(false);
  const [micOn, setMicOn] = useState(true);
  const [videoOn, setVideoOn] = useState(true);
  
  const myVideo = useRef();
  const userVideo = useRef();
  const connectionRef = useRef();

  useEffect(() => {
    navigator.mediaDevices.getUserMedia({ video: true, audio: true })
      .then((currentStream) => {
        setStream(currentStream);
        if (myVideo.current) {
          myVideo.current.srcObject = currentStream;
        }

        const peer = new SimplePeer({
          initiator: isInitiator,
          trickle: false,
          stream: currentStream,
        });

        peer.on('signal', (data) => {
          socket.current.send(JSON.stringify({
            type: isInitiator ? 'call_user' : 'answer_call',
            data: data,
            sender_id: user.id
          }));
        });

        peer.on('stream', (remoteStream) => {
          if (userVideo.current) {
            userVideo.current.srcObject = remoteStream;
          }
        });

        if (!isInitiator && signalData) {
          peer.signal(signalData);
        }

        const handleSignal = (event) => {
          const message = JSON.parse(event.data);
          
          if (message.type === 'answer_call' && isInitiator) {
            setCallAccepted(true);
            peer.signal(message.data);
          } 
          
          if (message.type === 'call_ended') {
             endCall();
          }
        };

        socket.current.addEventListener('message', handleSignal);
        connectionRef.current = peer;

        return () => {
            socket.current.removeEventListener('message', handleSignal);
        };
      })
      .catch(err => {
          console.error("Media Error:", err);
          alert("Could not access camera/microphone");
          onClose();
      });

      return () => {
          if(connectionRef.current) connectionRef.current.destroy();
          if(stream) stream.getTracks().forEach(track => track.stop());
      };
  }, []);

  const endCall = () => {
    if (socket.current.readyState === WebSocket.OPEN) {
        socket.current.send(JSON.stringify({ type: 'call_ended' }));
    }
    onClose();
  };

  const toggleMic = () => {
    if(stream) {
        const audioTrack = stream.getAudioTracks()[0];
        if (audioTrack) {
            audioTrack.enabled = !micOn;
            setMicOn(!micOn);
        }
    }
  };

  const toggleVideo = () => {
    if(stream) {
        const videoTrack = stream.getVideoTracks()[0];
        if (videoTrack) {
            videoTrack.enabled = !videoOn;
            setVideoOn(!videoOn);
        }
    }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-gray-900 flex flex-col items-center justify-center p-4">
      
      {/* Video Grid */}
      <div className="relative w-full max-w-4xl flex-1 flex flex-col md:flex-row gap-4 items-center justify-center">
        
        {/* Remote Video (Full Screen-ish) */}
        <div className="relative w-full h-full flex items-center justify-center bg-black rounded-2xl overflow-hidden shadow-2xl">
            {callAccepted || !isInitiator ? (
                <video playsInline ref={userVideo} autoPlay className="w-full h-full object-cover" />
            ) : (
                <div className="flex flex-col items-center text-white animate-pulse">
                    <div className="w-20 h-20 bg-gray-700 rounded-full flex items-center justify-center mb-4 text-3xl">...</div>
                    <p className="text-xl font-semibold">Calling...</p>
                </div>
            )}
            
            {/* Local Video (PiP) */}
            <div className="absolute bottom-4 right-4 w-32 md:w-48 aspect-video bg-gray-800 rounded-xl overflow-hidden border-2 border-white/20 shadow-lg">
                <video playsInline ref={myVideo} autoPlay muted className="w-full h-full object-cover transform scale-x-[-1]" />
            </div>
        </div>

      </div>

      {/* Controls */}
      <div className="mt-6 flex items-center gap-6 pb-8">
        <button onClick={toggleMic} className={`p-4 rounded-full text-white transition-all ${micOn ? 'bg-gray-600 hover:bg-gray-500' : 'bg-red-500 hover:bg-red-600'}`}>
            {micOn ? <IoMdMic className="text-2xl" /> : <IoMdMicOff className="text-2xl" />}
        </button>

        <button onClick={endCall} className="p-5 rounded-full bg-red-600 text-white hover:bg-red-700 transition-all shadow-lg scale-110 active:scale-95">
            <IoMdCall className="text-3xl" />
        </button>

        <button onClick={toggleVideo} className={`p-4 rounded-full text-white transition-all ${videoOn ? 'bg-gray-600 hover:bg-gray-500' : 'bg-red-500 hover:bg-red-600'}`}>
            {videoOn ? <RiVidiconFill className="text-2xl" /> : <RiCameraOffFill className="text-2xl" />}
        </button>
      </div>
    </div>
  );
};

export default VideoCall;