import { useRef, useState, useEffect } from "react";
import "../styles/CapturePage.css";
import { Camera, Repeat2 } from "lucide-react";

export default function CapturePage() {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [preview, setPreview] = useState(null);
  const [stream, setStream] = useState(null);
  const [cameraActive, setCameraActive] = useState(true);
  const [isMirrored, setIsMirrored] = useState(true);

  useEffect(() => {
    const startCamera = async () => {
      try {
        const mediaStream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "user" },
        });
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
        }
        setStream(mediaStream);
        setCameraActive(true);
      } catch (err) {
        console.error("Camera access denied:", err);
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

  // const takePhoto = () => {
  //   if (videoRef.current && canvasRef.current) {
  //     const video = videoRef.current;
  //     const canvas = canvasRef.current;

  //     canvas.width = video.videoWidth;
  //     canvas.height = video.videoHeight;

  //     const context = canvas.getContext("2d");

  //     context.save(); // ✅ Save the current context state

  //     if (isMirrored) {
  //       context.translate(canvas.width, 0);
  //       context.scale(-1, 1);
  //     }

  //     context.drawImage(video, 0, 0, canvas.width, canvas.height);
  //     context.restore(); // ✅ Restore to avoid affecting future drawings

  //     const dataUrl = canvas.toDataURL("image/png");
  //     setPreview(dataUrl);

  //     if (stream) {
  //       stream.getTracks().forEach((track) => track.stop());
  //     }
  //   }
  // };

  const takePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;

      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      const context = canvas.getContext("2d");
      context.save();

      if (isMirrored) {
        context.translate(canvas.width, 0);
        context.scale(-1, 1);
      }

      context.drawImage(video, 0, 0, canvas.width, canvas.height);
      context.restore();

      const dataUrl = canvas.toDataURL("image/png");
      setPreview(dataUrl);

      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    }
  };

  const confirmPhoto = () => {
    console.log("Photo confirmed!", preview);
  };

  const retakePhoto = () => {
    setPreview(null);
  };

  const toggleMirror = () => {
    setIsMirrored((prev) => !prev);
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

        {/* <div className="preview-container">
          {preview ? (
            <img
              src={preview}
              alt="Captured selfie"
              className={`preview-image ${isMirrored ? "mirrored" : ""}`}
            />
          ) : (
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className={`camera-preview ${isMirrored ? "mirrored" : ""}`}
            />
          )}

          {!preview && (
            <button className="mirror-icon-btn" onClick={toggleMirror}>
              <Repeat2 size={20} />
            </button>
          )}
        </div> */}

        <div className="preview-container">
          {preview ? (
            <img
              src={preview}
              alt="Captured selfie"
              className="preview-image" // ❌ removed "mirrored" class here
            />
          ) : (
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className={`camera-preview ${isMirrored ? "mirrored" : ""}`}
            />
          )}

          {!preview && (
            <button className="mirror-icon-btn" onClick={toggleMirror}>
              <Repeat2 size={20} />
            </button>
          )}
        </div>

        <canvas ref={canvasRef} style={{ display: "none" }} />

        <div className="buttons-container">
          {!preview ? (
            <div className="camera-controls-inside">
              <button
                className="capture-circle-btn"
                onClick={takePhoto}
                disabled={!cameraActive}
              >
                <Camera size={24} />
              </button>
            </div>
          ) : (
            <div className="confirm-retake-controls">
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
