import loadingVideo from '../assets/animations/loading.webm';

const LoadingScreen = () => (
    <div className="flex items-center justify-center h-screen w-screen bg-white">
        <video 
            src={loadingVideo} 
            autoPlay 
            loop 
            muted 
            className="w-20 h-20" 
        />
    </div>
);

export default LoadingScreen;