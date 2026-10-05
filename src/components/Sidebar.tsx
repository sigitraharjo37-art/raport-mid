import React from 'react';
import {
  LayoutDashboard,
  FileEdit,
  Table2,
  Printer,
  ClipboardCheck,
  GraduationCap,
  Users,
  BookOpen,
  Settings,
  UserCheck,
} from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  onOpenSchoolSettings: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onTabChange,
  onOpenSchoolSettings,
}) => {
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, category: 'Utama' },
    { id: 'nilai', label: 'Input Nilai Siswa', icon: FileEdit, category: 'Penilaian' },
    { id: 'legger', label: 'Buku Leger Nilai', icon: Table2, category: 'Penilaian', badge: 'Lengkap' },
    { id: 'rapor', label: 'Cetak / Ekspor Rapor', icon: Printer, category: 'Penilaian', badge: 'PDF' },
    { id: 'presensi', label: 'Presensi & Catatan', icon: ClipboardCheck, category: 'Penilaian' },
    { id: 'guru', label: 'Data Guru (PTK)', icon: UserCheck, category: 'Data Master' },
    { id: 'siswa', label: 'Data Peserta Didik', icon: GraduationCap, category: 'Data Master' },
    { id: 'kelas', label: 'Data Kelas & Wali', icon: Users, category: 'Data Master' },
    { id: 'mapel', label: 'Mata Pelajaran', icon: BookOpen, category: 'Data Master' },
  ];

  // Group items by category
  const categories = ['Utama', 'Penilaian', 'Data Master'];

  return (
    <aside className="w-full md:w-64 bg-white border-r border-slate-200 shrink-0 no-print">
      <div className="p-4 space-y-6">
        {categories.map((cat) => {
          const items = menuItems.filter((m) => m.category === cat);
          return (
            <div key={cat}>
              <h4 className="px-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                {cat}
              </h4>
              <nav className="space-y-1">
                {items.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => onTabChange(item.id)}
                      className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition ${
                        isActive
                          ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                          : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                      }`}
                    >
                      <div className="flex items-center space-x-2.5 truncate">
                        <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-slate-500'}`} />
                        <span className="truncate">{item.label}</span>
                      </div>
                      {item.badge && (
                        <span
                          className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                            isActive
                              ? 'bg-white/20 text-white'
                              : 'bg-indigo-50 text-indigo-700'
                          }`}
                        >
                          {item.badge}
                        </span>
                      )}
                    </button>
                  );
                })}
              </nav>
            </div>
          );
        })}

        {/* School settings button */}
        <div className="pt-4 border-t border-slate-100">
          <button
            onClick={onOpenSchoolSettings}
            className="w-full flex items-center space-x-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition"
          >
            <Settings className="w-4 h-4 text-slate-500" />
            <span>Pengaturan Sekolah</span>
          </button>
        </div>
      </div>
    </aside>
  );
};
