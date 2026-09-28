import React from 'react';
import {
  Home,
  BookOpen,
  CheckSquare,
  Bot,
  TrendingUp,
  Sun,
  User,
} from 'lucide-react';
import { t } from '../services/i18n';

interface StudentNavProps {
  currentTab: string;
  onTabChange: (tab: string) => void;
  pendingSyncCount: number;
}

export const StudentNav: React.FC<StudentNavProps> = ({
  currentTab,
  onTabChange,
  pendingSyncCount,
}) => {
  const navItems = [
    { id: 'home', label: 'Home', icon: Home },
    { id: 'learn', label: 'Learn', icon: BookOpen },
    { id: 'practice', label: 'Practice', icon: CheckSquare },
    { id: 'tutor', label: 'AI Tutor', icon: Bot, highlight: true },
    { id: 'progress', label: 'Progress', icon: TrendingUp },
    { id: 'hub', label: 'Solar Hub', icon: Sun, badge: pendingSyncCount > 0 ? pendingSyncCount : null },
  ];

  return (
    <nav className="bg-white border-t border-slate-200 shadow-lg px-2 py-1.5 flex items-center justify-around select-none">
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive = currentTab === item.id;

        return (
          <button
            key={item.id}
            onClick={() => onTabChange(item.id)}
            className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-all relative ${
              isActive
                ? 'text-orange-600 font-bold scale-105'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <div className="relative">
              <div
                className={`p-1 rounded-xl transition-all ${
                  isActive
                    ? 'bg-orange-100 text-orange-600'
                    : item.highlight
                    ? 'text-orange-500'
                    : ''
                }`}
              >
                <Icon className="w-5 h-5" />
              </div>

              {item.badge && (
                <span className="absolute -top-1 -right-1 bg-amber-500 text-white text-[9px] font-extrabold w-4 h-4 rounded-full flex items-center justify-center shadow">
                  {item.badge}
                </span>
              )}
            </div>
            <span className="text-[11px] mt-0.5 tracking-tight">{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
};
