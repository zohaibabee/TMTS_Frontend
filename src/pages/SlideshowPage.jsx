import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import '../styles/SlideshowPage.css';
import image1 from '../assets/image1.jpg'; // ✅ Proper import

const demoImages = [image1, image1, image1, image1, image1]; // Use 5 times

export default function SlideshowPage() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setIndex((prev) => (prev + 1) % demoImages.length);
    }, 3000); // Change slide every 3 seconds
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="slideshow-container">
      <div className="slideshow-title">
        <h1>TMTSelfie</h1>
      </div>

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
            className={`thumbnail ${idx === index ? 'active' : ''}`}
          />
        ))}
      </div>
    </div>
  );
}
