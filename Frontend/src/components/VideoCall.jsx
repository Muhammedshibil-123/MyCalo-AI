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
          if (socket.current) socket.current.removeEventListener('message', handleSignal);
        };
      })
      .catch(err => {
        console.error("Media Error:", err);
        alert("Could not access camera/microphone. Please allow permissions.");
        onClose();
      });

    return () => {
      stopMedia();
      if (connectionRef.current) {
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
    if (streamRef.current) {
      const audioTrack = streamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !micOn;
        setMicOn(!micOn);
      }
    }
  };

  const toggleVideo = () => {
    if (streamRef.current) {
      const videoTrack = streamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoOn;
        setVideoOn(!videoOn);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-slate-950 text-white font-sans">
      {/* Use dynamic viewport height for mobile browsers */}
      <div className="relative min-h-[100dvh] w-full overflow-hidden">

        {/* TOP HEADER */}
        <div className="sticky top-0 z-50 px-4 sm:px-6 pt-3 sm:pt-4">
          <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl px-4 py-3">
            <div className="flex items-center gap-2">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-500/60 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
              </span>
              <span className="text-[11px] font-semibold uppercase tracking-widest text-emerald-400">
                Encrypted
              </span>
            </div>

            <div className="text-xs sm:text-sm text-slate-300">
              Room: <span className="text-white font-medium">{roomId}</span>
            </div>
          </div>
        </div>

        {/* MAIN VIDEO AREA */}
        {/* IMPORTANT: padding-bottom so the fixed controls never cover video */}
        <div className="px-3 sm:px-6 pt-3 sm:pt-5 pb-32 sm:pb-36">
          <div className="relative mx-auto w-full max-w-6xl">
            {/* Remote Video Container */}
            <div className="relative w-full aspect-[16/9] sm:aspect-[16/9] bg-black/80 rounded-3xl overflow-hidden border border-white/10 shadow-[0_30px_80px_rgba(0,0,0,0.65)]">
              {/* Subtle gradient overlay for pro feel */}
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-white/5 via-transparent to-black/30" />

              {(callAccepted || !isInitiator) ? (
                <video
                  playsInline
                  ref={userVideo}
                  autoPlay
                  className="relative z-10 w-full h-full object-cover"
                />
              ) : (
                <div className="relative z-10 h-full w-full flex flex-col items-center justify-center gap-4">
                  <div className="w-16 h-16 rounded-2xl bg-white/10 border border-white/10 flex items-center justify-center shadow-lg">
                    <RiVidiconFill size={28} className="text-white/90" />
                  </div>
                  <p className="text-slate-300 text-sm">
                    Waiting for participant...
                  </p>
                  <p className="text-slate-500 text-xs">
                    Keep this screen open
                  </p>
                </div>
              )}

              {/* Local Video - responsive position */}
              <div className="
                absolute z-20
                bottom-3 right-3
                sm:bottom-4 sm:right-4
                w-28 sm:w-44 md:w-56
                aspect-video
                rounded-2xl overflow-hidden
                border border-white/15 bg-slate-900/60
                shadow-[0_18px_50px_rgba(0,0,0,0.6)]
                ring-1 ring-white/10
              ">
                {!videoOn && (
                  <div className="absolute inset-0 flex items-center justify-center bg-slate-950/90 z-10">
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

                {/* small label */}
                <div className="absolute left-2 bottom-2 text-[10px] px-2 py-1 rounded-full bg-black/50 border border-white/10 text-white/80">
                  You
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* FIXED BOTTOM CONTROLS */}
        {/* Safe-area padding for iPhone / gesture bar: pb-[env(safe-area-inset-bottom)] */}
        <div className="
          fixed inset-x-0 bottom-0 z-[60]
          px-3 sm:px-6
          pb-[env(safe-area-inset-bottom)]
        ">
          <div className="
            mx-auto max-w-3xl
            mb-3 sm:mb-5
            rounded-[2rem]
            border border-white/10
            bg-white/5 backdrop-blur-2xl
            shadow-[0_-20px_60px_rgba(0,0,0,0.55)]
            ring-1 ring-white/10
            px-4 py-3 sm:px-6 sm:py-4
          ">
            <div className="flex items-center justify-center gap-4 sm:gap-8">

              {/* Mic Toggle */}
              <button
                onClick={toggleMic}
                className={`
                  group relative
                  h-14 w-14 sm:h-16 sm:w-16
                  rounded-2xl
                  grid place-items-center
                  transition-all duration-200
                  active:scale-95
                  ${micOn
                    ? 'bg-slate-800/70 hover:bg-slate-700/70 border border-white/10'
                    : 'bg-red-500/90 hover:bg-red-500 border border-red-400/30 shadow-[0_10px_30px_rgba(239,68,68,0.35)]'}
                `}
                aria-label="Toggle microphone"
                title="Mic"
              >
                {micOn ? <IoMdMic size={26} /> : <IoMdMicOff size={26} />}
                <span className="pointer-events-none absolute -top-9 text-[11px] text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity">
                  {micOn ? 'Mic on' : 'Mic off'}
                </span>
              </button>

              {/* End Call */}
              <button
                onClick={() => endCall(true)}
                className="
                  group relative
                  h-16 w-16 sm:h-20 sm:w-20
                  rounded-2xl
                  grid place-items-center
                  bg-red-600 hover:bg-red-500
                  transition-all duration-200
                  shadow-[0_16px_40px_rgba(220,38,38,0.35)]
                  active:scale-95
                "
                aria-label="End call"
                title="End call"
              >
                <IoMdCall size={34} className="rotate-[135deg]" />
                <span className="pointer-events-none absolute -top-9 text-[11px] text-slate-200 opacity-0 group-hover:opacity-100 transition-opacity">
                  End
                </span>
              </button>

              {/* Video Toggle */}
              <button
                onClick={toggleVideo}
                className={`
                  group relative
                  h-14 w-14 sm:h-16 sm:w-16
                  rounded-2xl
                  grid place-items-center
                  transition-all duration-200
                  active:scale-95
                  ${videoOn
                    ? 'bg-slate-800/70 hover:bg-slate-700/70 border border-white/10'
                    : 'bg-red-500/90 hover:bg-red-500 border border-red-400/30 shadow-[0_10px_30px_rgba(239,68,68,0.35)]'}
                `}
                aria-label="Toggle camera"
                title="Camera"
              >
                {videoOn ? <RiVidiconFill size={26} /> : <RiCameraOffFill size={26} />}
                <span className="pointer-events-none absolute -top-9 text-[11px] text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity">
                  {videoOn ? 'Camera on' : 'Camera off'}
                </span>
              </button>

            </div>

            {/* Small hint row for mobile */}
            <div className="mt-3 flex items-center justify-center gap-2 text-[11px] text-slate-400">
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-500/80" />
              <span>Controls stay visible on all screens</span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default VideoCall;