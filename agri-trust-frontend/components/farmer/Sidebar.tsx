// components/farmer/Sidebar.tsx
'use client'; // Needed for usePathname hook

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { FiGrid, FiPackage, FiPlusSquare, FiUser, FiLogOut } from 'react-icons/fi'; // Example icons

const navItems = [
  { href: '/farmer', label: 'Dashboard', icon: FiGrid },
  { href: '/farmer/batches', label: 'My Batches', icon: FiPackage },
  { href: '/farmer/register-batch', label: 'Register Batch', icon: FiPlusSquare },
  { href: '/farmer/profile', label: 'Profile', icon: FiUser },
];

const Sidebar = () => {
  const pathname = usePathname();

  return (
    <aside className="w-64 bg-gray-50 border-r border-gray-200 flex flex-col h-screen fixed top-0 left-0">
      {/* Logo Area */}
      <div className="h-16 flex items-center justify-center border-b border-gray-200">
        {/* Replace with your Logo Component or SVG */}
        <span className="text-xl font-semibold text-green-700">AFarm</span>
      </div>

      {/* Navigation */}
      <nav className="flex-grow pt-4">
        <ul>
          {navItems.map((item) => {
            const isActive = pathname === item.href || (item.href !== '/farmer' && pathname.startsWith(item.href));
            return (
              <li key={item.href} className="px-4 py-1">
                <Link href={item.href} legacyBehavior>
                  <a
                    className={`flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors duration-150 ease-in-out
                      ${isActive
                        ? 'bg-green-100 text-green-700'
                        : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                      }`}
                  >
                    <item.icon className={`mr-3 h-5 w-5 ${isActive ? 'text-green-600' : 'text-gray-400'}`} />
                    {item.label}
                  </a>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Footer/Logout */}
      <div className="p-4 border-t border-gray-200">
         {/* Add a real logout button later */}
         <button
            className={`flex w-full items-center px-3 py-2 rounded-md text-sm font-medium transition-colors duration-150 ease-in-out text-gray-600 hover:bg-red-100 hover:text-red-700`}
          >
            <FiLogOut className={`mr-3 h-5 w-5 text-gray-400 group-hover:text-red-600`} />
            Logout
          </button>
      </div>
    </aside>
  );
};

export default Sidebar;