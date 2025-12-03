"use client";
import { useRef, useState, MouseEvent, TouchEvent } from "react";

interface UseHorizontalScrollResult {
  sliderRef: React.RefObject<HTMLDivElement>;
  scrollLeftHandler: () => void;
  scrollRightHandler: () => void;
  handleMouseDown: (e: MouseEvent<HTMLDivElement>) => void;
  handleMouseUp: () => void;
  handleMouseMove: (e: MouseEvent<HTMLDivElement>) => void;
  handleTouchStart: (e: TouchEvent<HTMLDivElement>) => void;
  handleTouchMove: (e: TouchEvent<HTMLDivElement>) => void;
}

export function useHorizontalScroll(): UseHorizontalScrollResult {
  const sliderRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [startX, setStartX] = useState<number>(0);
  const [scrollLeft, setScrollLeft] = useState<number>(0);

  const scrollLeftHandler = () => {
    if (sliderRef.current) sliderRef.current.scrollLeft -= 200;
  };

  const scrollRightHandler = () => {
    if (sliderRef.current) sliderRef.current.scrollLeft += 200;
  };

  const handleMouseDown = (e: MouseEvent<HTMLDivElement>) => {
    if (!sliderRef.current) return;
    setIsDragging(true);
    setStartX(e.pageX - sliderRef.current.offsetLeft);
    setScrollLeft(sliderRef.current.scrollLeft);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleMouseMove = (e: MouseEvent<HTMLDivElement>) => {
    if (!isDragging || !sliderRef.current) return;
    e.preventDefault();
    const x = e.pageX - sliderRef.current.offsetLeft;
    const walk = (x - startX) * 2;
    sliderRef.current.scrollLeft = scrollLeft - walk;
  };

  const handleTouchStart = (e: TouchEvent<HTMLDivElement>) => {
    if (!sliderRef.current) return;
    setIsDragging(true);
    setStartX(e.touches[0].pageX - sliderRef.current.offsetLeft);
    setScrollLeft(sliderRef.current.scrollLeft);
  };

  const handleTouchMove = (e: TouchEvent<HTMLDivElement>) => {
    if (!isDragging || !sliderRef.current) return;
    const x = e.touches[0].pageX - sliderRef.current.offsetLeft;
    const walk = (x - startX) * 2;
    sliderRef.current.scrollLeft = scrollLeft - walk;
  };

  return {
    sliderRef,
    scrollLeftHandler,
    scrollRightHandler,
    handleMouseDown,
    handleMouseUp,
    handleMouseMove,
    handleTouchStart,
    handleTouchMove,
  };
}
