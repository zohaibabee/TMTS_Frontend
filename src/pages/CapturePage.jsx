import { useRef, useState, useEffect } from 'react';
import '../styles/CapturePage.css';
import { Camera } from 'lucide-react';

export default function CapturePage() {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [preview, setPreview] = useState(null);
  const [stream, setStream] = useState(null);
  const [cameraActive, setCameraActive] = useState(true);

  useEffect(() => {
    const startCamera = async () => {
      try {
        const mediaStream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'user' },
        });
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
        }
        setStream(mediaStream);
        setCameraActive(true);
      } catch (err) {
        console.error('Camera access denied:', err);
        setCameraActive(false);
      }
    };
    
    if (!preview) {
      startCamera();
    }
    
    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [preview]);

  const takePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      
      // Set canvas dimensions to match video
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      const context = canvas.getContext('2d');
      context.drawImage(video, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL('image/png');
      setPreview(dataUrl);
      
      // Stop the camera stream after taking photo
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    }
  };

  const confirmPhoto = () => {
    console.log('Photo confirmed!');
    console.log(preview);
    // Here you would typically send the photo somewhere or save it
  };

  const retakePhoto = () => {
    setPreview(null);
    // The camera will restart in the useEffect when preview is null
  };

  return (
    <div className="capture-container">
      <div className="capture-content">
        <h1 className="capture-title">TAKE A SELFIE</h1>
        <p className="capture-subtitle">Photo Booth App</p>
        
        <div className="logo-container">
          <div className="camera-logo">
            <div className="camera-icon">
              <div className="camera-person"></div>
            </div>
          </div>
        </div>
        
        <div className="preview-container">
          {preview ? (
            <img src={preview} alt="Captured selfie" className="preview-image" />
          ) : (
            <video 
              ref={videoRef} 
              autoPlay 
              playsInline 
              muted 
              className="camera-preview"
            />
          )}
        </div>
        
        <canvas ref={canvasRef} style={{ display: 'none' }} />
        
        <div className="buttons-container">
          {!preview ? (
            <button className="take-photo-btn" onClick={takePhoto} disabled={!cameraActive}>
              <Camera size={24} />
              <span>TAKE PHOTO</span>
            </button>
          ) : (
            <div className="confirm-buttons">
              <button className="confirm-btn" onClick={confirmPhoto}>
                ✅ Confirm
              </button>
              <button className="retake-btn" onClick={retakePhoto}>
                🔁 Retake
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}