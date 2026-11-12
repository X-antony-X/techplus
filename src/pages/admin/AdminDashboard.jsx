
import { Link } from 'react-router-dom';
import {
  BookPlus,
  Video,
  Users,
  Wallet,
  ArrowUpRight,
  GraduationCap,
} from 'lucide-react';

import { siteSettings } from '../../siteSetting';

const dashboardItems = [
  {
    title: 'ADD A COURSE',
    description: 'Create and publish a new course on your platform.',
    icon: BookPlus,
    path: '/admin/courses',
  },
  {
    title: 'ADD A VIDEO TO A COURSE',
    description: 'Add new lessons and videos to your existing courses.',
    icon: Video,
    path: '/admin/lessons',
  },
  {
    title: 'MEMBERS',
    description: 'View and manage your platform members.',
    icon: Users,
    path: '/admin/members',
  },
  {
    title: 'PAYMENTS',
    description: 'Manage payments and review transactions.',
    icon: Wallet,
    path: '/admin/payments',
  },
  {
    title: 'SETTINGS',
    description: 'Manage your platform settings and configurations.',
    icon: Wallet,
    path: '/admin/settings',
  },
];

function AdminDashboard() {
  const { primary, secondary, fontSans, fontDisplay } =
    siteSettings.theme;

  return (
    <main
      className="min-h-screen bg-slate-50 px-4 py-12 sm:px-8 lg:px-12"
      style={{
        fontFamily: fontSans,
        '--primary': primary,
        '--secondary': secondary,
      }}
    >
      <div className="mx-auto max-w-6xl">

        {/* Header */}
        <div className="mb-12">
          <div className="mb-6 flex items-center gap-3">
            <div
              className="flex h-12 w-12 items-center justify-center rounded-xl text-white"
              style={{ backgroundColor: primary }}
            >
              <GraduationCap size={27} />
            </div>

            <div>
              <h2
                className="text-xl font-bold tracking-wide text-slate-900"
                style={{ fontFamily: fontDisplay }}
              >
                {siteSettings.name}
              </h2>

              <p className="text-xs font-medium tracking-[0.2em] text-slate-400">
                ADMINISTRATION PANEL
              </p>
            </div>
          </div>

          <div className="border-b border-slate-200 pb-8">
            <p
              className="mb-2 text-sm font-semibold uppercase tracking-[0.2em]"
              style={{ color: secondary }}
            >
              Control Center
            </p>

            <h1 className="text-3xl font-bold text-slate-900 sm:text-4xl">
              Dashboard Overview
            </h1>

            <p className="mt-3 max-w-xl text-sm leading-7 text-slate-500 sm:text-base">
              Welcome to your administration dashboard.
              Manage your courses, lessons, members and payments
              from one place.
            </p>
          </div>
        </div>

        {/* Dashboard Cards */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">

          {dashboardItems.map((item, index) => {
            const Icon = item.icon;

            return (
              <Link
                key={item.title}
                to={item.path}
                className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl sm:p-8"
                style={{
                  animationDelay: `${index * 100}ms`,
                }}
              >
                <div className="flex items-start justify-between">

                  <div
                    className="flex h-14 w-14 items-center justify-center rounded-xl transition-colors duration-300 group-hover:text-white"
                    style={{
                      backgroundColor: `${primary}15`,
                      color: primary,
                    }}
                  >
                    <Icon size={27} strokeWidth={1.8} />
                  </div>

                  <ArrowUpRight
                    size={22}
                    className="text-slate-300 transition-all duration-300 group-hover:-translate-y-1 group-hover:translate-x-1"
                    style={{ color: undefined }}
                  />
                </div>

                <div className="mt-8">
                  <h2 className="text-lg font-bold tracking-wide text-slate-900 sm:text-xl">
                    {item.title}
                  </h2>

                  <p className="mt-2 max-w-sm text-sm leading-6 text-slate-500">
                    {item.description}
                  </p>
                </div>

                <div
                  className="mt-6 flex items-center gap-2 text-sm font-semibold"
                  style={{ color: primary }}
                >
                  Open Section
                  <ArrowUpRight size={16} />
                </div>

                <div
                  className="absolute bottom-0 left-0 h-1 w-0 transition-all duration-300 group-hover:w-full"
                  style={{ backgroundColor: primary }}
                />
              </Link>
            );
          })}

        </div>

        {/* Footer */}
        <footer className="mt-14 border-t border-slate-200 pt-6 text-center">
          <p className="text-xs tracking-wide text-slate-400">
            © {new Date().getFullYear()} {siteSettings.name}. All rights reserved.
          </p>
        </footer>

      </div>
    </main>
  );
}

export default AdminDashboard;
