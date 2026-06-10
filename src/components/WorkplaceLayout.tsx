/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { 
  FileText, 
  PlusCircle, 
  Cpu, 
  Trash2,
  Layers
} from 'lucide-react';
import ModuleContent from './ModuleContent';

interface WorkplaceLayoutProps {
  key?: React.Key;
  moduleId: string;
  title: string;
  subtitle: string;
  activeTab: 'list' | 'input';
  onTabChange: (tab: 'list' | 'input') => void;
  onShowModalDemo?: () => void;
  onShowDeleteDemo?: () => void;
}

export default function WorkplaceLayout({ 
  moduleId,
  title,
  subtitle,
  activeTab,
  onTabChange,
  onShowModalDemo,
  onShowDeleteDemo 
}: WorkplaceLayoutProps) {
  return (
    <div className="flex flex-col space-y-6 w-full animate-fade-in" id="workplace-wrapper">
      
      {/* Workplace Header Container - Styled as elegant header card banner */}
      <div className="bg-white/70 backdrop-blur-md border border-white/60 p-6 rounded-3xl shadow-xs flex flex-col md:flex-row md:items-center md:justify-between gap-4" id="workplace-header">
        
        {/* Module Title and Info */}
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <div className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse"></div>
            <span className="text-[10px] uppercase font-extrabold tracking-widest text-[#fbc449] font-mono">ACTIVE MODULE</span>
          </div>
          <h2 className="text-xl font-black text-neutral-900 tracking-tight">{title}</h2>
          <p className="text-xs text-slate-500 font-medium leading-relaxed max-w-2xl">{subtitle}</p>
        </div>

        {/* Global actions and triggers */}
        <div className="flex items-center gap-2 shrink-0">
          {onShowModalDemo && (
            <button
              onClick={onShowModalDemo}
              className="px-4 py-2 text-xs font-bold text-slate-700 bg-white border border-slate-200/60 hover:bg-slate-50 rounded-full transition shadow-2xs cursor-pointer flex items-center space-x-1"
            >
              <Cpu className="w-3.5 h-3.5 text-amber-500" />
              <span>Grup Parameter</span>
            </button>
          )}
          {onShowDeleteDemo && (
            <button
              onClick={onShowDeleteDemo}
              className="px-4 py-2 text-xs font-bold text-red-650 bg-red-50 hover:bg-red-100 rounded-full border border-red-200/60 transition shadow-2xs flex items-center space-x-1.5 cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Simulasi Hapus</span>
            </button>
          )}
          <span className="text-[9px] bg-amber-400/10 text-[#fbc449] border border-amber-400/20 font-black px-3 py-1 rounded-full uppercase tracking-wider hidden sm:inline-block">
            FIREBASE ACTIVE
          </span>
        </div>
      </div>

      {/* Workplace Internal View Switcher - Floating Pills style */}
      {moduleId !== 'master-parameter' && moduleId !== 'tarif-jual-biaya' && (
        <div className="flex items-center justify-between bg-neutral-200/30 p-1.5 rounded-2xl border border-white/20 max-w-sm" id="workplace-subtabs">
          <button
            onClick={() => onTabChange('list')}
            className={`flex-1 py-2 rounded-xl text-xs font-bold transition flex items-center justify-center space-x-2 cursor-pointer ${
              activeTab === 'list'
                ? 'bg-neutral-900 text-white shadow-xs'
                : 'text-slate-500 hover:text-slate-900 hover:bg-white/40'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Rekaman Data</span>
          </button>
          <button
            onClick={() => onTabChange('input')}
            className={`flex-1 py-2 rounded-xl text-xs font-bold transition flex items-center justify-center space-x-2 cursor-pointer ${
              activeTab === 'input'
                ? 'bg-neutral-900 text-white shadow-xs'
                : 'text-slate-500 hover:text-slate-900 hover:bg-white/40'
            }`}
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>Formulir Input</span>
          </button>
        </div>
      )}

      {/* Main Viewport Content Block */}
      <div className="w-full" id="workplace-content-area">
        <ModuleContent 
          moduleId={moduleId} 
          activeSubTab={activeTab} 
          setSubTab={onTabChange} 
        />
      </div>

    </div>
  );
}
