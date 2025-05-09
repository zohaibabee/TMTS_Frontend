import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import "../styles/SlideshowPage.css";
import image1 from "../assets/image1.jpg";

const demoImages = [image1, image1, image1, image1, image1];

export default function SlideshowPage() {
  const [index, setIndex] = useState(0);
  const containerRef = useRef(null);

  useEffect(() => {
    const interval = setInterval(() => {
      setIndex((prev) => (prev + 1) % demoImages.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const handleEnterFullscreen = () => {
    if (containerRef.current) {
      const el = containerRef.current;
      if (el.requestFullscreen) {
        el.requestFullscreen();
      } else if (el.webkitRequestFullscreen) {
        el.webkitRequestFullscreen();
      } else if (el.msRequestFullscreen) {
        el.msRequestFullscreen();
      }
    }
  };

  return (
    <div className="slideshow-container" ref={containerRef}>
      <div className="slideshow-title">
        <h1>TMTSelfie</h1>
      </div>

      <button className="fullscreen-btn" onClick={handleEnterFullscreen}>
        ⛶ Start Slideshow
      </button>

      <div className="slideshow-main">
        <AnimatePresence mode="wait">
          <motion.img
            key={index}
            src={demoImages[index]}
            alt={`Slide ${index}`}
            className="slide-image"
            initial={{ opacity: 0, scale: 1.05 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1 }}
          />
        </AnimatePresence>
      </div>

      <div className="thumbnail-strip">
        {demoImages.map((img, idx) => (
          <img
            key={idx}
            src={img}
            alt={`Thumb ${idx}`}
            className={`thumbnail ${idx === index ? "active" : ""}`}
          />
        ))}
      </div>
    </div>
  );
}
