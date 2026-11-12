
import { useEffect, useRef, useState } from 'react';
import { NavLink, Link } from 'react-router-dom';
import {
  Menu,
  X,
  ChevronDown,
  UserRound,
  LogOut,
  LayoutDashboard,
  ShieldCheck,
} from 'lucide-react';

import { supabase } from '../../supabase';
import { siteSettings } from '../../siteSetting';

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [userRole, setUserRole] = useState(null);

  const dropdownRef = useRef(null);

  const { primary, secondary, accent, fontSans } =
    siteSettings.theme;

  const navLinks = [
    { name: 'Home', path: '/' },
    { name: 'Courses', path: '/courses' },
    { name: 'Buy', path: '/payment' },
  ];

  // Get Current User
  useEffect(() => {
    const getCurrentUser = async () => {
      const { data, error } = await supabase.auth.getSession();

      if (!error) {
        setUser(data.session?.user || null);
      }
    };

    getCurrentUser();

    // Listen for Authentication Changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null);
      setUserRole(null);
      setIsDropdownOpen(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Get User Role From Profiles
  useEffect(() => {
    let active = true;

    const getUserRole = async () => {
      if (!user) {
        setUserRole(null);
        return;
      }

      const { data, error } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

      if (!active) return;

      if (error) {
        console.error('Get User Role Error:', error.message);
        setUserRole(null);
        return;
      }

      setUserRole(data?.role || null);
    };

    getUserRole();

    return () => {
      active = false;
    };
  }, [user]);

  // Check If User Can Access Dashboard
  const canAccessControl = [
    'admin',
    'teacher',
    'lecturer',
  ].includes(userRole);

  // Close Dropdown When Clicking Outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target)
      ) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Get User Display Name
  const userName =
    user?.user_metadata?.full_name ||
    user?.user_metadata?.name ||
    user?.user_metadata?.display_name ||
    user?.email?.split('@')[0] ||
    'My Account';

  // Sign Out
  const handleSignOut = async () => {
    const { error } = await supabase.auth.signOut();

    if (error) {
      console.error('Sign Out Error:', error.message);
      return;
    }

    setUser(null);
    setUserRole(null);
    setIsDropdownOpen(false);
    setIsMenuOpen(false);
  };

  const linkClasses = ({ isActive }) =>
    `text-sm font-semibold transition-colors duration-200 ${
      isActive ? 'font-bold' : 'hover:opacity-75'
    }`;

  // Login Button
  const loginButton = (
    <Link
      to="/login"
      onClick={() => setIsMenuOpen(false)}
      className="inline-flex items-center justify-center gap-2 rounded-lg px-5 py-2.5 text-sm font-bold transition-all duration-300 hover:brightness-110"
      style={{
        backgroundColor: primary,
        color: accent,
      }}
    >
      <UserRound size={18} />
      Log In
    </Link>
  );

  // User Account Dropdown
  const accountDropdown = (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsDropdownOpen((prev) => !prev)}
        aria-expanded={isDropdownOpen}
        className="inline-flex max-w-[220px] items-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-semibold transition-all hover:bg-white/5"
        style={{
          borderColor: `${primary}55`,
          color: accent,
        }}
      >
        <UserRound size={18} style={{ color: primary }} />

        <span className="truncate">{userName}</span>

        <ChevronDown
          size={16}
          className={`shrink-0 transition-transform duration-200 ${
            isDropdownOpen ? 'rotate-180' : ''
          }`}
        />
      </button>

      {isDropdownOpen && (
        <div className="absolute right-0 top-full z-50 mt-3 w-56 overflow-hidden rounded-xl border border-white/10 bg-[#202020] py-2 shadow-2xl">
          <div className="border-b border-white/10 px-4 py-3">
            <p className="truncate text-sm font-bold text-white">
              {userName}
            </p>

            <p className="mt-1 truncate text-xs text-gray-400">
              {user?.email}
            </p>
          </div>

          {/* My Account */}
          <Link
            to="/account"
            onClick={() => {
              setIsDropdownOpen(false);
              setIsMenuOpen(false);
            }}
            className="flex items-center gap-3 px-4 py-3 text-sm text-gray-300 transition-colors hover:bg-white/5 hover:text-white"
          >
            <LayoutDashboard size={17} style={{ color: primary }} />
            My Account
          </Link>

          {/* Control - Only Admin, Teacher, Lecturer */}
          {canAccessControl && (
            <Link
              to="/admin"
              onClick={() => {
                setIsDropdownOpen(false);
                setIsMenuOpen(false);
              }}
              className="flex items-center gap-3 px-4 py-3 text-sm font-semibold text-gray-300 transition-colors hover:bg-white/5 hover:text-white"
            >
              <ShieldCheck size={17} style={{ color: primary }} />
              CONTROL
            </Link>
          )}

          {/* Sign Out */}
          <button
            type="button"
            onClick={handleSignOut}
            className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm text-red-400 transition-colors hover:bg-red-500/10"
          >
            <LogOut size={17} />
            Sign Out
          </button>
        </div>
      )}
    </div>
  );

  return (
    <nav
      className="sticky top-0 z-50 w-full border-b bg-[#171717] backdrop-blur-md"
      style={{
        borderColor: `${primary}40`,
        fontFamily: fontSans,
      }}
    >
      <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-5 sm:px-8 lg:px-10">

        {/* Logo & Brand */}
        <NavLink
          to="/"
          onClick={() => setIsMenuOpen(false)}
          className="flex items-center gap-3"
        >
          <img
            src="./assets/images/logo.png"
            alt={`${siteSettings.name} Logo`}
            className="h-11 w-11 object-contain"
          />

          <span
            className="text-xl font-extrabold tracking-wide sm:text-2xl"
            style={{ color: secondary }}
          >
            {siteSettings.name}
          </span>
        </NavLink>

        {/* Desktop Navigation */}
        <div className="hidden items-center gap-10 md:flex">
          {navLinks.map((link) => (
            <NavLink
              key={link.path}
              to={link.path}
              className={linkClasses}
              style={({ isActive }) => ({
                color: isActive ? primary : secondary,
              })}
            >
              {link.name}
            </NavLink>
          ))}
        </div>

        {/* Desktop Authentication */}
        <div className="hidden md:block">
          {user ? accountDropdown : loginButton}
        </div>

        {/* Mobile Menu Button */}
        <button
          type="button"
          onClick={() => setIsMenuOpen((prev) => !prev)}
          aria-label={isMenuOpen ? 'Close menu' : 'Open menu'}
          aria-expanded={isMenuOpen}
          className="flex h-10 w-10 items-center justify-center rounded-lg transition-colors md:hidden"
          style={{
            color: secondary,
            backgroundColor: `${primary}20`,
          }}
        >
          {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile Navigation */}
      {isMenuOpen && (
        <div
          className="border-t px-5 py-5 md:hidden"
          style={{
            borderColor: `${primary}40`,
            backgroundColor: '#171717',
          }}
        >
          <div className="mx-auto flex max-w-7xl flex-col gap-5">
            {navLinks.map((link) => (
              <NavLink
                key={link.path}
                to={link.path}
                onClick={() => setIsMenuOpen(false)}
                className={linkClasses}
                style={({ isActive }) => ({
                  color: isActive ? primary : secondary,
                })}
              >
                {link.name}
              </NavLink>
            ))}

            <div className="border-t border-white/10 pt-5">
              {user ? accountDropdown : loginButton}
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
