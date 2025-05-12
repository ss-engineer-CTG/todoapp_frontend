// src/components/common/ShortcutOverlay.tsx
import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";

interface ShortcutOverlayProps {
  shortcut: string;
  action: string;
  duration?: number;
}

export default function ShortcutOverlay({ shortcut, action, duration = 2000 }: ShortcutOverlayProps) {
  const [isVisible, setIsVisible] = useState(true);
  
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
    }, duration);
    
    return () => clearTimeout(timer);
  }, [duration]);
  
  // トランジションの処理
  const [opacity, setOpacity] = useState(1);
  
  useEffect(() => {
    if (!isVisible) {
      // フェードアウト
      const fadeTimer = setTimeout(() => {
        setOpacity(0);
      }, 50);
      return () => clearTimeout(fadeTimer);
    }
  }, [isVisible]);
  
  if (!isVisible && opacity === 0) return null;
  
  // ポータルを使ってDOMのルートに直接レンダリング
  return createPortal(
    <div 
      className="fixed bottom-8 right-8 bg-blue-600 text-white px-4 py-2 rounded-lg shadow-lg z-50 transition-opacity duration-300"
      style={{ opacity }}
    >
      <div className="flex flex-col items-center">
        <div className="font-bold text-xl">{shortcut}</div>
        <div className="text-sm">{action}</div>
      </div>
    </div>,
    document.body
  );
}