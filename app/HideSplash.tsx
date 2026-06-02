'use client';
import { useEffect } from 'react';

export default function HideSplash() {
  useEffect(() => {
    const el = document.getElementById('splash-screen');
    if (el) {
      el.classList.add('hidden');
      setTimeout(() => el.remove(), 500);
    }
  }, []);
  return null;
}
