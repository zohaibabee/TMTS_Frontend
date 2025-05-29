import { useState, useEffect, useRef } from "react";

export default function SlideshowPage() {
  const [photos, setPhotos] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [logo, setLogo] = useState("");
  const [title, setTitle] = useState("");
  const [background, setBackground] = useState("");
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [transitionClass, setTransitionClass] = useState("fade");
  const [windowSize, setWindowSize] = useState({ width: 1920, height: 1080 });
  const [thumbnailStartIndex, setThumbnailStartIndex] = useState(0);
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
        setPhotos(resolvedPhotos);
        setLogo(data.logo ? `${baseUrl}${data.logo}` : "");
        setTitle(data.title || "");
        setBackground(data.background ? `${baseUrl}${data.background}` : "");

        // Debug: Let's see what we're getting
        console.log("API Response:", data);
        console.log(
          "Logo URL:",
          data.logo ? `${baseUrl}${data.logo}` : "No logo"
        );
      })
      .catch((err) => {
        console.error("Failed to load slideshow data", err);
        alert("Unable to load slideshow content.");
      });
  }, []);

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

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
    };
  }, []);

  // Auto-start slideshow by default, not just in fullscreen
  useEffect(() => {
    if (photos.length === 0) return;

    const interval = setInterval(() => {
      setTransitionClass(getRandomTransition());
      prevIndexRef.current = currentIndex;
      setCurrentIndex((prev) => (prev + 1) % photos.length);
    }, 2500); // Faster transition - 1.5 seconds

    return () => clearInterval(interval);
  }, [photos.length, currentIndex]);

  const getRandomTransition = () => {
    const transitions = ["fade", "slide", "zoom", "rotate"];
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
    setTransitionClass(""); // no animation on manual switch
    setCurrentIndex(index);
  };

  // Thumbnail navigation functions
  const getVisibleThumbnailCount = () => {
    // Calculate how many thumbnails can fit based on 50% screen width
    const thumbnailWidth = 70; // 60px + gap
    const availableWidth = windowSize.width * 0.5 - 120; // 50% width minus arrow buttons
    return Math.floor(availableWidth / thumbnailWidth);
  };

  const handleThumbnailNavLeft = () => {
    const moveBy = 1;
    setThumbnailStartIndex((prev) => Math.max(0, prev - moveBy));
  };

  const handleThumbnailNavRight = () => {
    const moveBy = 1;
    const maxStartIndex = Math.max(
      0,
      photos.length - getVisibleThumbnailCount()
    );
    setThumbnailStartIndex((prev) => Math.min(maxStartIndex, prev + moveBy));
  };

  const getVisibleThumbnails = () => {
    const visibleCount = getVisibleThumbnailCount();
    return photos.slice(
      thumbnailStartIndex,
      thumbnailStartIndex + visibleCount
    );
  };

  const getFloatingPositions = () => {
    const isPortrait = windowSize.height > windowSize.width;

    // Different positioning for portrait vs landscape
    const positions = isPortrait
      ? [
          // Portrait mode - ONLY top and bottom, NO left/right of main image
          { top: "2%", left: "10%" },
          { top: "2%", right: "10%" },
          { top: "2%", left: "50%", transform: "translateX(-50%)" },
          { top: "8%", left: "5%" },
          { top: "8%", right: "5%" },
          { top: "8%", left: "25%" },
          { top: "8%", right: "25%" },
          { top: "15%", left: "15%" },
          { top: "15%", right: "15%" },
          { top: "15%", left: "50%", transform: "translateX(-50%)" },
          // Bottom positions - well spaced from main image
          { bottom: "15%", left: "15%" },
          { bottom: "15%", right: "15%" },
          { bottom: "15%", left: "50%", transform: "translateX(-50%)" },
          { bottom: "8%", left: "5%" },
          { bottom: "8%", right: "5%" },
          { bottom: "8%", left: "25%" },
          { bottom: "8%", right: "25%" },
          { bottom: "2%", left: "10%" },
          { bottom: "2%", right: "10%" },
          { bottom: "2%", left: "50%", transform: "translateX(-50%)" },
        ]
      : [
          // Landscape mode positions - more horizontal spread
          { top: "8%", left: "3%" },
          { top: "12%", right: "3%" },
          { top: "25%", left: "1%" },
          { top: "28%", right: "1%" },
          { bottom: "25%", left: "2%" },
          { bottom: "22%", right: "2%" },
          { bottom: "8%", left: "4%" },
          { bottom: "12%", right: "4%" },
          { top: "45%", left: "5%" },
          { top: "48%", right: "5%" },
          { bottom: "35%", left: "6%" },
          { bottom: "38%", right: "6%" },
        ];

    const result = [];
    const maxFloating = Math.min(positions.length, photos.length - 1);

    for (let i = 1; i <= maxFloating; i++) {
      const index = (currentIndex + i) % photos.length;
      result.push({
        photo: photos[index],
        index,
        pos: positions[(i - 1) % positions.length],
      });
    }
    return result;
  };

  const isPortrait = windowSize.height > windowSize.width;

  return (
    <div
      ref={slideshowRef}
      className="relative w-full min-h-screen flex flex-col text-white overflow-hidden"
      style={{
        backgroundImage: background ? `url(${background})` : "none",
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      {/* Header - Centered title */}
      <div
        className="absolute top-0 left-0 right-0 flex items-center justify-center px-6 py-4 z-30"
        style={{ height: isPortrait ? "80px" : "70px" }}
      >
        <div className="text-center">
          <h1 className="text-2xl font-bold drop-shadow-lg">TMTSelfie</h1>
          {title && <p className="text-md mt-1 drop-shadow-md">{title}</p>}
        </div>
      </div>

      {/* Fullscreen Button - Top Right */}
      <button
        onClick={handleFullscreen}
        className="absolute top-6 right-6 bg-white bg-opacity-90 text-black px-4 py-2 text-sm rounded-lg hover:bg-opacity-100 transition-all duration-300 z-30 shadow-lg"
      >
        ⛶ Fullscreen
      </button>

      {/* Slideshow - Account for header height */}
      <div
        className="relative flex-grow flex items-center justify-center"
        style={{
          marginTop: isPortrait ? "80px" : "70px",
          paddingBottom: isFullscreen ? "10px" : isPortrait ? "100px" : "120px",
        }}
      >
        {photos.length > 0 ? (
          <div className="relative w-full h-full flex items-center justify-center">
            {/* Floating Surrounding Images - Show always, not just in fullscreen */}
            {getFloatingPositions().map(({ photo, index, pos }) => (
              <img
                key={`floating-${index}`}
                src={photo}
                alt={`Floating ${index}`}
                className="absolute object-cover rounded-lg shadow-xl opacity-40 hover:opacity-70 hover:scale-110 transition-all duration-700 z-10"
                style={{
                  width: isPortrait ? "120px" : "150px",
                  height: isPortrait ? "120px" : "150px",
                  ...pos,
                  transform:
                    pos.transform ||
                    `rotate(${Math.random() * 30 - 15}deg) scale(${
                      0.8 + Math.random() * 0.4
                    })`,
                }}
              />
            ))}

            {/* Main Image - Optimized for both orientations */}
            <img
              key={`main-${currentIndex}`}
              src={photos[currentIndex]}
              alt={`Slide ${currentIndex}`}
              className={`rounded-xl object-contain shadow-2xl z-30 transition-all duration-1000 ease-in-out ${transitionClass}`}
              style={{
                width: "auto",
                height: isPortrait
                  ? `${windowSize.height * 0.8}px` // Increased from 0.6 to 0.8 for portrait
                  : `${windowSize.height * 0.75}px`,
                maxWidth: isPortrait ? "95%" : "60%", // Increased from 90% to 95%
                maxHeight: isPortrait ? "80%" : "75%", // Increased from 60% to 80%
              }}
            />
          </div>
        ) : (
          <p className="text-white text-lg text-center w-full">
            No images available
          </p>
        )}
      </div>

      {/* Thumbnails with Arrow Navigation - Hidden in fullscreen to maximize space */}
      {!isFullscreen && (
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 w-1/2 flex items-center justify-center gap-2 px-4 z-30">
          {/* Left Arrow */}
          <button
            onClick={handleThumbnailNavLeft}
            disabled={thumbnailStartIndex === 0}
            className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 ${
              thumbnailStartIndex === 0
                ? "bg-white bg-opacity-30 opacity-40"
                : "bg-white bg-opacity-90 hover:bg-opacity-100"
            }`}
            style={{
              cursor: thumbnailStartIndex === 0 ? "default" : "pointer",
            }}
          >
            <span
              className={`text-lg ${
                thumbnailStartIndex === 0 ? "text-gray-300" : "text-black"
              }`}
            >
              ‹
            </span>
          </button>

          {/* Thumbnails Container */}
          <div className="flex gap-2 overflow-hidden">
            {getVisibleThumbnails().map((photo, visibleIndex) => {
              const actualIndex = thumbnailStartIndex + visibleIndex;
              return (
                <img
                  key={`thumb-${actualIndex}`}
                  src={photo}
                  alt={`Thumb ${actualIndex}`}
                  className={`h-[60px] rounded-sm transition-all duration-300 cursor-pointer flex-shrink-0 ${
                    actualIndex === currentIndex
                      ? "opacity-100 border-2 border-white scale-110"
                      : "opacity-60 hover:opacity-80"
                  }`}
                  onClick={() => handleThumbnailClick(actualIndex)}
                />
              );
            })}
          </div>

          {/* Right Arrow */}
          <button
            onClick={handleThumbnailNavRight}
            disabled={
              thumbnailStartIndex >=
              Math.max(0, photos.length - getVisibleThumbnailCount())
            }
            className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 ${
              thumbnailStartIndex >=
              Math.max(0, photos.length - getVisibleThumbnailCount())
                ? "bg-white bg-opacity-30 opacity-40"
                : "bg-white bg-opacity-90 hover:bg-opacity-100"
            }`}
            style={{
              cursor:
                thumbnailStartIndex >=
                Math.max(0, photos.length - getVisibleThumbnailCount())
                  ? "default"
                  : "pointer",
            }}
          >
            <span
              className={`text-lg ${
                thumbnailStartIndex >=
                Math.max(0, photos.length - getVisibleThumbnailCount())
                  ? "text-gray-300"
                  : "text-black"
              }`}
            >
              ›
            </span>
          </button>
        </div>
      )}

      {/* QR Code - Bottom Left */}
      <div className="absolute bottom-5 left-9 z-30">
        <img
          src="https://api.qrserver.com/v1/create-qr-code/?size=90x90&data=https://www.facebook.com/profile.php?id=61576626537248"
          alt="Facebook QR Code"
          className="w-30 h-30 bg-white p-1 rounded-lg shadow-lg"
        />
      </div>

      {/* Bottom Right Logo instead of Fullscreen Button */}
      {logo && (
        <img
          src={logo}
          alt="Logo"
          className="absolute bottom-7 right-7 h-15 w-auto object-contain z-30"
        />
      )}
    </div>
  );
}
