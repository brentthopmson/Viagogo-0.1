'use client';
import { useEffect } from 'react';

export default function ManifestLoader() {
  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    if (token) {
      const link = document.querySelector('link[rel="manifest"]');
      if (link) {
        link.setAttribute('href', `/manifest.json?token=${encodeURIComponent(token)}`);
      }
    }
  }, []);
  return null;
}
