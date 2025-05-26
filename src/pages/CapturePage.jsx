import { useRef, useState, useEffect } from "react";
import { Camera, Repeat2 } from "lucide-react";

export default function CapturePage() {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [preview, setPreview] = useState(null);
  const [stream, setStream] = useState(null);
  const [cameraActive, setCameraActive] = useState(true);
  const [isMirrored, setIsMirrored] = useState(true);
  const [logo, setLogo] = useState("");
  const [pageTitle, setPageTitle] = useState("");
  const [logoLoaded, setLogoLoaded] = useState(false);

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

    const fetchSettings = async () => {
      try {
        const res = await fetch(
          `${import.meta.env.VITE_API_BASE_URL}/api/admin/settings`
        );
        const data = await res.json();

        const baseUrl = import.meta.env.VITE_API_BASE_URL;
        const logoUrl = data.logo_filename
          ? `${baseUrl}${data.logo_filename}`
          : "/default-logo.png";

        const img = new Image();
        img.src = logoUrl;
        img.onload = () => setLogoLoaded(true);
        img.onerror = () => setLogoLoaded(false);

        setLogo(logoUrl);
        setPageTitle(data.page_title || "");
      } catch (err) {
        console.error("Failed to fetch capture page settings", err);
        setLogo("/default-logo.png");
        setLogoLoaded(true);
      }
    };

    if (!preview) {
      startCamera();
      fetchSettings();
    }

    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [preview]);

  const takePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext("2d");

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    context.save();
    if (isMirrored) {
      context.translate(canvas.width, 0);
      context.scale(-1, 1);
    }
    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    context.restore();

    const logoImg = new Image();
    logoImg.crossOrigin = "anonymous";
    logoImg.src = logo;

    logoImg.onload = () => {
      const logoSize = 64;
      const padding = 12;
      const x = canvas.width - logoSize - padding;
      const y = canvas.height - logoSize - padding;

      context.drawImage(logoImg, x, y, logoSize, logoSize);

      const dataUrl = canvas.toDataURL("image/png");
      setPreview(dataUrl);

      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };

    logoImg.onerror = () => {
      console.warn("Failed to load logo for watermark.");
      const dataUrl = canvas.toDataURL("image/png");
      setPreview(dataUrl);
    };
  };

  const dataURLtoBlob = (dataURL) => {
    const parts = dataURL.split(",");
    const mime = parts[0].match(/:(.*?);/)[1];
    const bstr = atob(parts[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    return new Blob([u8arr], { type: mime });
  };

  const confirmPhoto = async () => {
    if (!preview) return;

    const blob = dataURLtoBlob(preview);
    const formData = new FormData();
    formData.append("file", blob, "selfie.png");

    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/api/capture/upload`,
        {
          method: "POST",
          body: formData,
        }
      );

      const result = await response.json();
      console.log("Upload response:", result);
      alert("Photo uploaded successfully!");
      setPreview(null);
    } catch (err) {
      console.error("Upload failed", err);
      alert("Failed to upload photo.");
    }
  };

  const retakePhoto = () => {
    setPreview(null);
  };

  const toggleMirror = () => {
    setIsMirrored((prev) => !prev);
  };

  return (
    <div className="w-full h-[calc(100vh-20px)] flex justify-center items-center bg-blue-50 px-4 overflow-hidden">
      <div className="w-full max-w-[1150px] h-full flex flex-col items-center p-4 overflow-hidden">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-800 mb-0 text-center">
          TAKE A SELFIE
        </h1>

        {pageTitle && (
          <p className="text-sm text-gray-500 mt-1 text-center">{pageTitle}</p>
        )}

        {logo && (
          <img
            src={logo}
            alt="Business Logo"
            className="h-16 mt-3 object-contain"
          />
        )}

        {/* Preview Container */}
        <div className="relative w-full max-h-[700px] flex-1 min-h-0 overflow-hidden rounded-xl bg-gray-800 shadow-lg my-3">
          {preview ? (
            <img
              src={preview}
              alt="Captured selfie"
              className="w-full h-full object-contain"
            />
          ) : (
            <>
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className={`w-full h-full object-cover ${
                  isMirrored ? "scale-x-[-1]" : ""
                }`}
              />
              {logo && logoLoaded && (
                <img
                  src={logo}
                  alt="Watermark"
                  className="absolute bottom-3 right-3 w-16 h-16 opacity-80 object-contain"
                />
              )}
            </>
          )}

          {/* Mirror Toggle */}
          {!preview && (
            <button
              onClick={toggleMirror}
              className="absolute top-3 right-3 bg-white/80 hover:bg-white text-gray-800 p-2 rounded-full shadow-md transition"
            >
              <Repeat2 size={20} />
            </button>
          )}

          {/* Action Buttons - Centered Inside Preview */}
          {!preview ? (
            <div className="absolute inset-0 flex justify-center items-center z-10 pointer-events-none">
              <button
                onClick={takePhoto}
                disabled={!cameraActive}
                className="w-20 h-20 rounded-full bg-white text-gray-900 text-2xl font-bold shadow-lg flex items-center justify-center hover:bg-gray-100 transition pointer-events-auto"
              >
                <Camera size={36} />
              </button>
            </div>
          ) : (
            <div className="absolute inset-0 flex flex-wrap justify-center items-center gap-4 z-10 pointer-events-none">
              <button
                onClick={confirmPhoto}
                className="px-6 md:px-8 py-4 md:py-6 rounded-xl bg-green-400 hover:bg-green-500 text-red-500 font-bold text-lg md:text-xl shadow-lg border-4 border-cyan-200 pointer-events-auto"
              >
                👍 Looks Great!
              </button>
              <button
                onClick={retakePhoto}
                className="px-6 md:px-8 py-4 md:py-6 rounded-xl bg-yellow-300 hover:bg-yellow-400 text-red-600 font-bold text-lg md:text-xl shadow-lg border-4 border-red-500 pointer-events-auto"
              >
                👎 Retake
              </button>
            </div>
          )}
        </div>

        <canvas ref={canvasRef} className="hidden" />
      </div>
    </div>
  );
}
