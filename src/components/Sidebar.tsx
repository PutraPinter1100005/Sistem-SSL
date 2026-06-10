import React, { useState, useEffect, useRef } from 'react';
import { 
  LayoutDashboard, 
  Database, 
  Briefcase, 
  Truck, 
  Receipt,
  Hash
} from 'lucide-react';
import { MenuCategory, MenuItem } from '../types';
import { useFirebase } from '../context/FirebaseContext';

interface SidebarProps {
  activeId: string;
  onNavigate: (id: string) => void;
}

export default function Sidebar({ activeId, onNavigate }: SidebarProps) {
  // Pop-out Menu Panel state: active main menu ID that has sub-items
  const [activeMenu, setActiveMenu] = useState<string | null>(null);

  const { user } = useFirebase();
  const sidebarRef = useRef<HTMLDivElement>(null);

  const categories: MenuCategory[] = [
    {
      categoryName: "UTAMA",
      items: [
        {
          id: "dashboard",
          title: "DASHBOARD",
          iconName: "LayoutDashboard"
        }
      ]
    },
    {
      categoryName: "ERP OPERATIONS",
      items: [
        {
          id: "data-induk",
          title: "DATA INDUK",
          iconName: "Database",
          subItems: [
            { id: "master-customers", title: "Master Pelanggan", path: "master-customers" },
            { id: "master-vendors", title: "Master Vendor", path: "master-vendors" },
            { id: "master-drivers", title: "Master Supir", path: "master-drivers" },
            { id: "master-trucks", title: "Master Truk / Armada", path: "master-trucks" },
            { id: "tarif-jual-biaya", title: "Master Tarif & Biaya", path: "tarif-jual-biaya" }
          ]
        },
        {
          id: "manajemen-operasional",
          title: "MANAJEMEN OPERASIONAL",
          iconName: "Briefcase",
          subItems: [
            { id: "manajemen-job-order", title: "Manajemen Job Order", path: "manajemen-job-order" },
            { id: "operasional-lapangan", title: "Operasional Lapangan & SPK", path: "operasional-lapangan" }
          ]
        }
      ]
    }
  ];

  // Click-Outside Listener to close sub-menu automatically when user clicks outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (sidebarRef.current && !sidebarRef.current.contains(event.target as Node)) {
        setActiveMenu(null);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const getIcon = (iconName: string) => {
    switch (iconName) {
      case "LayoutDashboard":
        return <LayoutDashboard className="w-5 h-5 flex-shrink-0" />;
      case "Database":
        return <Database className="w-5 h-5 flex-shrink-0" />;
      case "Briefcase":
        return <Briefcase className="w-5 h-5 flex-shrink-0" />;
      case "Truck":
        return <Truck className="w-5 h-5 flex-shrink-0" />;
      case "Receipt":
        return <Receipt className="w-5 h-5 flex-shrink-0" />;
      default:
        return <Hash className="w-5 h-5 flex-shrink-0" />;
    }
  };

  const isMenuItemActiveOrChildrenActive = (item: MenuItem): boolean => {
    if (item.id === activeId) return true;
    if (item.subItems) {
      return item.subItems.some(sub => sub.id === activeId);
    }
    return false;
  };

  return (
    <aside 
      ref={sidebarRef} 
      className="w-16 bg-slate-900 text-slate-300 flex flex-col h-screen border-r border-slate-800 select-none shrink-0 relative z-[50] overflow-visible"
      id="main-sidebar"
    >
      {/* Sleek Brand Header Logo block */}
      <div className="h-14 border-b border-slate-800 bg-slate-950 flex items-center justify-center shrink-0 overflow-visible">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center font-bold text-white tracking-wider text-sm shadow-md">
          SSL
        </div>
      </div>

      {/* Main Icon Navigation Menu with overflow-visible to support flyouts */}
      <div className="flex-1 overflow-visible py-4 flex flex-col items-center space-y-6">
        {categories.map((cat, catIdx) => (
          <div key={catIdx} className="flex flex-col items-center space-y-4 w-full overflow-visible">
            {/* Category mini dividing indicator line */}
            <div className="w-6 h-[1px] bg-slate-800 shrink-0" />
            
            <div className="flex flex-col items-center space-y-2.5 w-full px-2 overflow-visible" id={`category-${catIdx}`}>
              {cat.items.map((item) => {
                const hasSubItems = !!item.subItems && item.subItems.length > 0;
                const isActiveOrChildActive = isMenuItemActiveOrChildrenActive(item);
                const isFlyoutOpen = activeMenu === item.id;

                return (
                  <div key={item.id} className="relative group flex justify-center w-full overflow-visible">
                    {/* Top Level Item Icon Only Button */}
                    <button
                      onClick={() => {
                        if (hasSubItems) {
                          // Toggle sub-menu
                          setActiveMenu(prev => prev === item.id ? null : item.id);
                        } else {
                          onNavigate(item.id);
                          setActiveMenu(null);
                        }
                      }}
                      className={`w-11 h-11 rounded-xl flex items-center justify-center transition-all duration-200 cursor-pointer ${
                        isActiveOrChildActive || isFlyoutOpen
                          ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20 scale-105' 
                          : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                      }`}
                      id={`nav-${item.id}`}
                    >
                      {getIcon(item.iconName)}
                    </button>

                    {/* Hover Effect (Floating Tooltip) */}
                    <div className="absolute left-full top-1/2 -translate-y-1/2 ml-3 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-[60]">
                      {item.title}
                    </div>

                    {/* Click Effect (Floating Sub-menu/Flyout) absolutely relative to layout */}
                    {hasSubItems && isFlyoutOpen && (
                      <div 
                        className="absolute left-full top-0 ml-3 min-w-[200px] bg-white border border-gray-200 shadow-xl rounded-md z-[100] flex flex-col p-1.5"
                        id={`sidebar-flyout-${item.id}`}
                      >
                        {/* Header of Flyout */}
                        <div className="px-2.5 py-1.5 border-b border-gray-100 flex items-center justify-between shrink-0 mb-1">
                          <span className="font-extrabold text-[10px] text-gray-400 uppercase tracking-widest">{item.title}</span>
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              setActiveMenu(null);
                            }} 
                            className="text-gray-400 hover:text-gray-600 text-sm font-bold leading-none p-0.5 cursor-pointer ml-1"
                          >
                            &times;
                          </button>
                        </div>

                        {/* List of Sub-modules */}
                        <div className="space-y-0.5">
                          {item.subItems.map((sub) => {
                            const isSubActive = activeId === sub.id;
                            return (
                              <button
                                key={sub.id}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onNavigate(sub.id);
                                  setActiveMenu(null);
                                }}
                                className={`w-full text-left px-3 py-1.5 rounded text-xs font-bold transition-all flex items-center space-x-2 cursor-pointer ${
                                  isSubActive
                                    ? 'bg-blue-600 text-white shadow-xs'
                                    : 'text-gray-600 hover:text-black hover:bg-gray-50'
                                }`}
                                id={`subnav-${sub.id}`}
                              >
                                <span className={`w-1 h-1 rounded-full ${isSubActive ? 'bg-white' : 'bg-gray-400'}`} />
                                <span className="truncate">{sub.title}</span>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Footer Database Status dot */}
      <div className="py-4 border-t border-slate-800 bg-slate-950 flex flex-col items-center justify-center space-y-3 shrink-0 overflow-visible">
        <div className="relative group cursor-help overflow-visible">
          <div className={`w-7 h-7 rounded-full flex items-center justify-center transition-colors hover:bg-slate-800 ${user ? 'bg-emerald-500/10' : 'bg-amber-500/10'}`}>
            <div className={`w-3.5 h-3.5 rounded-full flex items-center justify-center ${user ? 'bg-emerald-500/20' : 'bg-amber-500/20'}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${user ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
            </div>
          </div>
          
          {/* Detailed Diagnostics Pop-up */}
          <div className="absolute left-12 bottom-0 px-3 py-2.5 bg-slate-950 text-white text-[10px] rounded-xl shadow-2xl border border-slate-800 leading-relaxed min-w-[210px] pointer-events-none opacity-0 scale-95 origin-bottom-left group-hover:opacity-100 group-hover:scale-100 transition-all duration-150 z-50 shadow-black/80">
            <div className="font-bold flex items-center space-x-1.5 border-b border-slate-800 pb-1.5 mb-1.5 text-slate-200">
              <span className={`w-2.5 h-2.5 rounded-full flex items-center justify-center ${user ? 'bg-emerald-950 text-emerald-400' : 'bg-amber-950 text-amber-400'}`}>&bull;</span>
              <span>Diagnostics Monitor</span>
            </div>
            <p className="text-slate-300 font-semibold">
              {user ? 'Firestore Cloud Active.' : 'Firestore Standby Mode.'}
            </p>
            <p className="text-[9px] text-slate-500 mt-0.5">
              Session: {user ? (user.isAnonymous ? "Sesi Anonim" : "Sesi Google Sinkron") : "Belum Login"}
            </p>
            <div className="w-full bg-slate-900 h-1 rounded-full overflow-hidden mt-2">
              <div className="bg-emerald-500 h-full w-[100%] rounded-full shrink-0 animate-pulse"></div>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}
