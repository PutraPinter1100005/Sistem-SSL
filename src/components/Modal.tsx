/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef } from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  contentClassName?: string;
  className?: string;
}

export default function Modal({ isOpen, onClose, title, children, footer, contentClassName, className }: ModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (isOpen && event.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    // Focus containment or locking scroll
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    }

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm transition-opacity duration-200"
      onClick={onClose}
    >
      {/* Absolute strict standard: rgba(0,0,0,0.6) and backdrop-filter blur is active via 'bg-black/60 backdrop-blur-sm' */}
      <div 
        ref={modalRef}
        onClick={(e) => e.stopPropagation()}
        className={`bg-white rounded-xl shadow-2xl border border-slate-200 w-full overflow-hidden flex flex-col transform transition-all animate-in zoom-in-95 duration-150 ${className || 'max-w-5xl'}`}
        id="standards-compliant-modal"
      >
        {/* Header */}
         <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <h3 className="font-semibold text-slate-800 text-sm tracking-tight flex items-center space-x-2">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-500 animate-pulse"></span>
            <span>{title}</span>
          </h3>
          <button 
            type="button"
            onClick={onClose}
            className="p-1 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-200 transition-colors focus:ring-2 focus:ring-slate-300"
            title="Tutup (ESC)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className={contentClassName || "p-6 overflow-y-auto max-h-[70vh]"}>
          {children}
        </div>

        {/* Footer */}
        {footer}
      </div>
    </div>
  );
}
