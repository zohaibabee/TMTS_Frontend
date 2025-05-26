import { useState, useEffect, useRef } from "react";

export default function SlideshowPage() {
  const [photos, setPhotos] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [logo, setLogo] = useState("");
  const [title, setTitle] = useState("");
  const [background, setBackground] = useState("");
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [transitionClass, setTransitionClass] = useState("");
  const [isAnimating, setIsAnimating] = useState(false);
  const [windowSize, setWindowSize] = useState({ width: 1920, height: 1080 });
  const prevIndexRef = useRef(0);
  const slideshowRef = useRef(null);

  useEffect(() => {
    fetch(`${import.meta.env.VITE_API_BASE_URL}/api/slideshow`)
      .then((res) => res.json())
      .then((data) => {
        const baseUrl = import.meta.env.VITE_API_BASE_URL;
        const resolvedPhotos = (data.photos || []).map(
          (path) => `${baseUrl}${path}`
        );
        const resolvedLogo = data.logo ? `${baseUrl}${data.logo}` : "";
        const resolvedBackground = data.background
          ? `${baseUrl}${data.background}`
          : "";

        setPhotos(resolvedPhotos);
        setLogo(resolvedLogo);
        setTitle(data.title || "");
        setBackground(resolvedBackground);
      })
      .catch((err) => {
        console.error("Failed to load slideshow data", err);
        alert("Unable to load slideshow content.");
      });
  }, []);

  // Track window size for responsive layout
  useEffect(() => {
    const updateSize = () => {
      setWindowSize({ width: window.innerWidth, height: window.innerHeight });
    };
    updateSize();
    window.addEventListener("resize", updateSize);
    window.addEventListener("orientationchange", updateSize);
    return () => {
      window.removeEventListener("resize", updateSize);
      window.removeEventListener("orientationchange", updateSize);
    };
  }, []);

  // Fullscreen detection
  useEffect(() => {
    const handleFullscreenChange = () => {
      const isFS = !!document.fullscreenElement;
      setIsFullscreen(isFS);
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
    };
  }, []);

  // Slideshow autoplay in fullscreen
  useEffect(() => {
    if (!isFullscreen || photos.length === 0) return;

    const interval = setInterval(() => {
      setTransitionClass(getRandomTransition());
      prevIndexRef.current = currentIndex;
      setCurrentIndex((prev) => (prev + 1) % photos.length);
    }, 1500);

    return () => clearInterval(interval);
  }, [isFullscreen, photos.length, currentIndex]);

  const getRandomTransition = () => {
    const transitions = [
      "opacity-0 scale-95",
      "opacity-0 translate-x-20",
      "opacity-0 -translate-x-20",
      "opacity-0 translate-y-20",
      "opacity-0 -translate-y-20",
    ];
    return transitions[Math.floor(Math.random() * transitions.length)];
  };

  const handleFullscreen = () => {
    const elem = slideshowRef.current;
    if (!elem) return;
    if (elem.requestFullscreen) {
      elem.requestFullscreen();
    } else if (elem.webkitRequestFullscreen) {
      elem.webkitRequestFullscreen();
    } else if (elem.msRequestFullscreen) {
      elem.msRequestFullscreen();
    }
  };

  const handleThumbnailClick = (index) => {
    setTransitionClass(""); // skip animation on click
    setCurrentIndex(index);
  };

  // Get up to 8 images surrounding the current one (excluding the current)
  const getSurroundingImages = () => {
    const result = [];
    const totalImages = photos.length;
    for (let i = 1; i <= 8; i++) {
      const index = (currentIndex + i) % totalImages;
      result.push({ photo: photos[index], index });
    }
    return result;
  };

  // Responsive radius and size for side images
  const getCircleLayout = () => {
    const minDim = Math.min(windowSize.width, windowSize.height);
    const radius = Math.max(minDim * 0.32, 180); // increased radius
    const sideSize = Math.max(Math.min(minDim * 0.13, 160), 90);
    const mainSize = Math.max(Math.min(minDim * 0.38, 480), 220); // larger main image
    return { radius, sideSize, mainSize };
  };

  const { radius, sideSize, mainSize } = getCircleLayout();

  return (
    <div
      ref={slideshowRef}
      className="relative w-full min-h-screen flex flex-col items-center justify-center text-white overflow-hidden"
      style={{
        backgroundImage: background ? `url(${background})` : "none",
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
      }}
    >
      {/* Header */}
      <div className="absolute top-5 left-1/2 transform -translate-x-1/2 text-center z-10 flex flex-col items-center">
        <h1 className="text-xl sm:text-2xl font-bold drop-shadow-lg">
          TMTSelfie
        </h1>
        {logo && (
          <img src={logo} alt="Logo" className="h-10 mt-2 drop-shadow-lg" />
        )}
        {isFullscreen && title && (
          <p className="text-md sm:text-lg mt-1 drop-shadow-md">{title}</p>
        )}
      </div>

      {/* Slideshow Display Area */}
      <div className="relative w-full h-[80vh] px-4 flex items-center justify-center">
        {photos.length > 0 ? (
          <div className="relative w-full h-full flex items-center justify-center">
            {/* Surrounding Images (Max 8) */}
            {isFullscreen &&
              getSurroundingImages().map(({ photo, index }, idx) => {
                const total = 8;
                const angle = (2 * Math.PI * idx) / total;
                const x = Math.cos(angle) * radius;
                const y = Math.sin(angle) * radius;
                return (
                  <img
                    key={index}
                    src={photo}
                    alt={`Surrounding ${index}`}
                    className="absolute object-cover rounded-lg shadow-md opacity-80 z-10 transition-all duration-500 ease-in-out hover:scale-110 hover:opacity-100 hover:z-20"
                    style={{
                      width: sideSize,
                      height: sideSize,
                      left: `calc(50% + ${x}px - ${sideSize / 2}px)`,
                      top: `calc(50% + ${y}px - ${sideSize / 2}px)`,
                      transform: `rotate(${Math.random() * 20 - 10}deg) scale(${
                        0.95 + Math.random() * 0.15
                      })`,
                    }}
                  />
                );
              })}

            {/* Center Main Image - always rendered last, always on top */}
            <img
              key={currentIndex}
              src={photos[currentIndex]}
              alt={`Slide ${currentIndex}`}
              className={`z-30 rounded-xl object-contain shadow-2xl transition-all duration-500 ease-in-out ${
                isFullscreen ? transitionClass : ""
              }`}
              style={{
                width: isFullscreen ? mainSize : undefined,
                height: isFullscreen ? mainSize : undefined,
                maxWidth: isFullscreen ? undefined : "70vw",
                maxHeight: isFullscreen ? undefined : "70vh",
                position: "absolute",
                left: "50%",
                top: "50%",
                transform: "translate(-50%, -50%)",
              }}
            />
          </div>
        ) : (
          <p className="text-white text-lg">No images yet</p>
        )}
      </div>

      {/* Persistent bottom thumbnail list */}
      <div className="flex justify-center gap-2 mt-4 px-4 overflow-x-auto w-full max-w-6xl pb-2 mx-auto z-10">
        {photos.map((photo, index) => (
          <img
            key={index}
            src={photo}
            alt={`Thumb ${index}`}
            className={`h-[60px] rounded-sm transition-opacity duration-300 cursor-pointer ${
              index === currentIndex
                ? "opacity-100 border-2 border-white"
                : "opacity-60"
            }`}
            onClick={() => handleThumbnailClick(index)}
          />
        ))}
      </div>

      {/* Fullscreen Button */}
      <button
        onClick={handleFullscreen}
        className="absolute bottom-6 right-6 bg-white text-black px-4 py-2 text-sm rounded hover:bg-gray-200 transition z-10"
      >
        ⛶ Fullscreen
      </button>
    </div>
  );
}
