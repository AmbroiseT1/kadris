"use client";
import React, { useRef, useState, useEffect } from "react";
import { motion } from "framer-motion";
import { ArrowRight, ArrowLeft } from "lucide-react";

interface CardProps {
  card: {
    category: string;
    title: string;
    content: React.ReactNode;
    bgClass: string;
  };
  index: number;
}

const Card = ({ card, index }: CardProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0, transition: { duration: 0.5, delay: 0.05 * index } }}
      className={`
        rounded-3xl relative h-[400px] w-[300px] md:w-[350px] overflow-hidden flex-shrink-0 snap-center 
        border border-white/10 shadow-xl transition-all duration-300 hover:shadow-2xl hover:-translate-y-2
        ${card.bgClass}
      `}
    >
      {/* Background Abstract Pattern */}
      <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
      
      {/* Header Card */}
      <div className="absolute top-0 left-0 p-6 z-20">
        <p className="text-xs font-bold uppercase tracking-widest text-white/70 mb-1">
          {card.category}
        </p>
        <h3 className="text-2xl font-serif font-bold text-white leading-tight">
          {card.title}
        </h3>
      </div>

      {/* Content Body */}
      <div className="absolute bottom-0 left-0 w-full p-6 z-20 bg-gradient-to-t from-black/80 via-black/40 to-transparent">
         <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-4 text-white">
            {card.content}
         </div>
      </div>
    </motion.div>
  );
};

export const AppleCarousel = ({ items }: { items: any[] }) => {
  const carouselRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const checkScroll = () => {
    if (carouselRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = carouselRef.current;
      setCanScrollLeft(scrollLeft > 0);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
    }
  };

  useEffect(() => {
    checkScroll();
  }, []);

  const scroll = (direction: "left" | "right") => {
    if (carouselRef.current) {
      const scrollAmount = direction === "left" ? -300 : 300;
      carouselRef.current.scrollBy({ left: scrollAmount, behavior: "smooth" });
    }
  };

  return (
    <div className="relative w-full group">
      {/* Buttons de navigation (visible au survol) */}
      <div className="absolute top-1/2 -left-4 z-40 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
        <button 
            onClick={() => scroll("left")} 
            disabled={!canScrollLeft}
            className="bg-white/80 backdrop-blur p-3 rounded-full shadow-lg disabled:opacity-50 hover:bg-white text-kadris-slate"
        >
            <ArrowLeft size={20} />
        </button>
      </div>
      <div className="absolute top-1/2 -right-4 z-40 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
        <button 
            onClick={() => scroll("right")} 
            disabled={!canScrollRight}
            className="bg-white/80 backdrop-blur p-3 rounded-full shadow-lg disabled:opacity-50 hover:bg-white text-kadris-slate"
        >
            <ArrowRight size={20} />
        </button>
      </div>

      {/* Container Scroll */}
      <div
        ref={carouselRef}
        onScroll={checkScroll}
        className="flex w-full overflow-x-scroll snap-x py-10 gap-6 scroll-smooth no-scrollbar px-4"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }} // Hide scrollbar
      >
        {items.map((card, index) => (
          <Card key={index} card={card} index={index} />
        ))}
      </div>
    </div>
  );
};