import React from 'react';
import Link from 'next/link';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faTimes,
    faLock
} from '@fortawesome/free-solid-svg-icons';
import { IconDefinition } from '@fortawesome/fontawesome-svg-core';

interface SidebarItem {
    icon: IconDefinition;
    label: string;
    href: string;
    active: boolean;
    action?: () => void; // Optional action for items like 'Sign Out'
}

interface SidebarProps {
    sidebarItems: SidebarItem[];
    isSidebarOpen: boolean;
    onClose: () => void;
    adminUsername?: string | null; // Optional prop for displaying admin username
}

const Sidebar: React.FC<SidebarProps> = ({
    sidebarItems,
    isSidebarOpen,
    onClose,
    adminUsername
}) => {
    return (
        <aside className={`fixed inset-0 bg-white z-40 transform transition-transform duration-300 ease-in-out lg:relative lg:translate-x-0 lg:bg-transparent lg:inset-auto lg:w-64 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
            <div className="p-6 lg:p-0">
                <div className="lg:hidden flex justify-end mb-8">
                    <button onClick={onClose} className="text-2xl text-[#001B41]">
                        <FontAwesomeIcon icon={faTimes} />
                    </button>
                </div>
                <nav className="space-y-1">
                    {sidebarItems.map((item, i) => (
                        item.href && item.href !== '#' ? (
                            <Link key={i} href={item.href} onClick={onClose}
                                className={`w-full text-left px-4 py-3 rounded-[12px] flex items-center space-x-3 transition-all ${item.active ? 'bg-[#89CF28] text-white font-black shadow-lg shadow-[#89CF28]/20' : 'text-[#001B41] hover:bg-white hover:shadow-sm font-bold'}`}>
                                <FontAwesomeIcon icon={item.icon} className="w-5" />
                                <span>{item.label}</span>
                            </Link>
                        ) : (
                            <button key={i} onClick={() => {
                                if (item.action) item.action();
                                onClose();
                            }}
                                className={`w-full text-left px-4 py-3 rounded-[12px] flex items-center space-x-3 transition-all ${item.active ? 'bg-[#89CF28] text-white font-black shadow-lg shadow-[#89CF28]/20' : (item.label === 'Sign Out' ? 'text-red-600 hover:bg-red-50' : 'text-[#001B41] hover:bg-white hover:shadow-sm font-bold')}`}>
                                <FontAwesomeIcon icon={item.icon} className="w-5" />
                                <span>{item.label}</span>
                            </button>
                        )
                    ))}
                </nav>
                <div className="mt-12 pt-8 border-t border-gray-100">
                    <Link href="/secure/myaccount/manage" className="flex items-center space-x-3 text-gray-400 hover:text-[#89CF28] transition-colors text-[10px] font-black uppercase tracking-widest">
                        <FontAwesomeIcon icon={faLock} className="w-4" />
                        <span>Admin Panel</span>
                    </Link>
                </div>
            </div>
        </aside>
    );
};

export default Sidebar;