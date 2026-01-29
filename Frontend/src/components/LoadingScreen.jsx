import loadingVideo from '../assets/animations/loading.webm';

const LoadingScreen = () => (
    <div className="flex items-center justify-center h-screen w-screen bg-white">
        <video 
            src={loadingVideo} 
            autoPlay 
            loop 
            muted 
            className="w-48 h-48" 
        />
    </div>
);

export default LoadingScreen;