
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  Code2,
  Cpu,
  Globe,
  Layers3,
  Sparkles,
} from 'lucide-react';

import { siteSettings } from '../siteSetting';

const HomePage = () => {
  const { name, description, theme } = siteSettings;
  const { primary, secondary, fontSans, fontDisplay } = theme;

  return (
    <main
      className="relative flex min-h-[calc(100vh-80px)] items-center overflow-hidden bg-[#171717] text-white"
      style={{ fontFamily: fontSans }}
    >
      {/* Background Effects */}
      <div
        className="pointer-events-none absolute -right-40 -top-40 h-[450px] w-[450px] rounded-full opacity-20 blur-[120px]"
        style={{ backgroundColor: primary }}
      />

      <div
        className="pointer-events-none absolute -bottom-40 -left-40 h-[400px] w-[400px] rounded-full opacity-15 blur-[120px]"
        style={{ backgroundColor: secondary }}
      />

      {/* Grid Background */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage: `linear-gradient(${primary} 1px, transparent 1px), linear-gradient(90deg, ${primary} 1px, transparent 1px)`,
          backgroundSize: '55px 55px',
        }}
      />

      <div className="relative mx-auto grid w-full max-w-7xl items-center gap-16 px-5 py-20 sm:px-8 lg:grid-cols-2 lg:px-10">

        {/* Left Content */}
        <section className="z-10">
          {/* Small Label */}
          <div
            className="mb-8 inline-flex items-center gap-2 rounded-full border px-4 py-2 text-xs font-semibold tracking-widest sm:text-sm"
            style={{
              borderColor: `${primary}55`,
              backgroundColor: `${primary}12`,
              color: primary,
            }}
          >
            <Sparkles size={15} />
            THE FUTURE STARTS HERE
          </div>

          {/* Main Heading */}
          <h1
            className="max-w-2xl text-5xl font-extrabold leading-[1.15] tracking-tight sm:text-6xl lg:text-7xl"
            style={{ fontFamily: fontDisplay }}
          >
            Explore The
            <span className="block mt-2" style={{ color: primary }}>
              World Of
            </span>
            <span className="block mt-2">Technology.</span>
          </h1>

          {/* Description */}
          <p className="mt-8 max-w-xl text-base leading-8 text-gray-400 sm:text-lg">
            Technology is more than just innovation. It's the power
            to create, explore, and shape the future. Discover new
            possibilities, develop your skills, and turn your ideas
            into reality.
          </p>

          {/* Buttons */}
          <div className="mt-10 flex flex-wrap items-center gap-4">
            <Link
              to="/courses"
              className="group inline-flex items-center gap-3 rounded-lg px-7 py-4 text-sm font-bold"
              style={{
                backgroundColor: primary,
                color: '#FFFFFF',
                boxShadow: `0 8px 30px ${primary}30`,
              }}
            >
              Explore Courses

              <ArrowRight
                size={19}
                className="transition-transform duration-300 group-hover:translate-x-1"
              />
            </Link>

            <div className="flex items-center gap-2 text-sm text-gray-400">
              <span
                className="h-2 w-2 rounded-full"
                style={{ backgroundColor: primary }}
              />
              Learn. Create. Innovate.
            </div>
          </div>

          {/* Brand */}
          <div className="mt-16 border-t border-white/10 pt-6">
            <p className="text-xs font-medium tracking-[0.25em] text-gray-500">
              POWERED BY
            </p>

            <p
              className="mt-2 text-lg font-extrabold tracking-widest"
              style={{ color: secondary }}
            >
              {name}
            </p>
          </div>
        </section>

        {/* Right Visual */}
        <section className="relative mx-auto flex w-full max-w-[480px] items-center justify-center">

          {/* Main Circle */}
          <div
            className="relative flex aspect-square w-full items-center justify-center rounded-full border"
            style={{
              borderColor: `${primary}35`,
              background: `radial-gradient(circle, ${primary}18 0%, transparent 68%)`,
            }}
          >
            {/* Inner Circle */}
            <div
              className="flex h-[65%] w-[65%] items-center justify-center rounded-full border"
              style={{
                borderColor: `${secondary}70`,
                background: `radial-gradient(circle, ${secondary}35, #171717 75%)`,
                boxShadow: `0 0 80px ${primary}20`,
              }}
            >
              <div className="text-center">
                <Cpu
                  size={76}
                  strokeWidth={1}
                  style={{ color: primary }}
                  className="mx-auto"
                />

                <p className="mt-5 text-2xl font-black tracking-widest">
                  TECH
                </p>

                <p
                  className="mt-1 text-xs font-semibold tracking-[0.4em]"
                  style={{ color: primary }}
                >
                  PLUS
                </p>
              </div>
            </div>

            {/* Floating Icons */}
            <div
              className="absolute left-[8%] top-[22%] flex h-16 w-16 items-center justify-center rounded-2xl border bg-[#202020] shadow-2xl"
              style={{ borderColor: `${primary}50`, color: primary }}
            >
              <Code2 size={29} />
            </div>

            <div
              className="absolute right-[5%] top-[30%] flex h-16 w-16 items-center justify-center rounded-2xl border bg-[#202020] shadow-2xl"
              style={{ borderColor: `${secondary}70`, color: secondary }}
            >
              <Globe size={29} />
            </div>

            <div
              className="absolute bottom-[15%] left-[15%] flex h-16 w-16 items-center justify-center rounded-2xl border bg-[#202020] shadow-2xl"
              style={{ borderColor: `${secondary}70`, color: secondary }}
            >
              <Layers3 size={29} />
            </div>

            {/* Decorative Dots */}
            <div
              className="absolute right-[20%] bottom-[12%] h-3 w-3 rounded-full"
              style={{ backgroundColor: primary }}
            />

            <div
              className="absolute left-[28%] top-[8%] h-2 w-2 rounded-full"
              style={{ backgroundColor: secondary }}
            />
          </div>

          {/* Bottom Floating Card */}
          <div
            className="absolute -bottom-5 right-0 rounded-xl border border-white/10 bg-[#202020]/95 px-5 py-4 shadow-2xl backdrop-blur-md sm:-right-5"
          >
            <div className="flex items-center gap-3">
              <div
                className="flex h-10 w-10 items-center justify-center rounded-lg"
                style={{
                  backgroundColor: `${primary}20`,
                  color: primary,
                }}
              >
                <Sparkles size={21} />
              </div>

              <div>
                <p className="text-sm font-bold text-white">
                  Think Beyond Limits
                </p>

                <p className="mt-1 text-xs text-gray-500">
                  Build Your Future
                </p>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
};

export default HomePage;
