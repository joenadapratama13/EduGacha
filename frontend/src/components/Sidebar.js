'use client';

import Link from 'next/link';

export default function Sidebar({ activePage, user, isCollapsed, handleLogout, onToggle, isMobileOpen, onCloseMobile }) {
  return (
    <>
      {/* Mobile Drawer Backdrop */}
      {isMobileOpen && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[45] md:hidden transition-all duration-300"
        />
      )}

      <aside
        className={`fixed left-0 top-0 h-full bg-surface-container/95 md:bg-surface-container/30 backdrop-blur-md border-r border-parchment-border/40 z-50 md:z-40 flex flex-col p-6 transition-all duration-300 ease-in-out no-print ${
          isCollapsed ? 'md:w-20 md:px-3' : 'md:w-72'
        } ${
          isMobileOpen ? 'w-72 translate-x-0' : 'w-72 -translate-x-full md:translate-x-0'
        }`}
      >
        {/* Unified Logo Section */}
        <div
          className={`flex items-center mb-10 px-2 transition-all duration-300 ${
            isCollapsed ? 'justify-center' : 'justify-between'
          }`}
        >
          {!isCollapsed ? (
            <>
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 bg-primary rounded-xl flex items-center justify-center text-white shadow-md shadow-primary/20 shrink-0">
                  <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>
                    school
                  </span>
                </div>
                <div className="flex flex-col transition-all duration-300 ease-in-out">
                  <h1 className="font-headline-lg text-[20px] font-bold tracking-tight text-primary whitespace-nowrap">
                    EduGacha
                  </h1>
                  <p className="font-label-mono text-[9px] text-ink-muted uppercase tracking-widest leading-none mt-0.5 whitespace-nowrap">
                    Academic Excellence
                  </p>
                </div>
              </div>

              {/* Close button for Mobile */}
              <button
                onClick={onCloseMobile}
                className="md:hidden text-ink-muted hover:text-primary transition-colors cursor-pointer p-1.5 rounded-lg hover:bg-surface-container-high/60 active:scale-95 flex items-center justify-center"
                title="Tutup Menu"
              >
                <span className="material-symbols-outlined text-xl block">close</span>
              </button>

              {/* Toggle Button for Desktop */}
              {onToggle && (
                <button
                  onClick={onToggle}
                  className="hidden md:flex text-ink-muted hover:text-primary transition-colors cursor-pointer p-1.5 rounded-lg hover:bg-surface-container-high/60 active:scale-95 transition-all no-print items-center justify-center"
                  title="Tutup Sidebar"
                >
                  <span className="material-symbols-outlined text-xl block">side_navigation</span>
                </button>
              )}
            </>
          ) : (
            /* Toggle Button when collapsed replacing the logo */
            onToggle && (
              <button
                onClick={onToggle}
                className="text-ink-muted hover:text-primary transition-colors cursor-pointer w-12 h-12 rounded-xl hover:bg-surface-container-high/60 active:scale-95 transition-all no-print flex items-center justify-center mx-auto"
                title="Buka Sidebar"
              >
                <span className="material-symbols-outlined text-xl block">side_navigation</span>
              </button>
            )
          )}
        </div>

      {/* Unified Navigation Links */}
      <nav className="flex-1 flex flex-col gap-2">
        <Link
          className={`flex items-center rounded-xl font-label-mono text-label-mono transition-all duration-300 ease-in-out hover:no-underline w-full h-12 ${
            isCollapsed ? 'md:justify-center md:p-0 md:mx-auto px-4' : 'px-4'
          } ${
            activePage === 'dashboard'
              ? 'bg-secondary-container text-primary font-bold'
              : 'text-on-surface-variant hover:bg-surface-container-high/60'
          }`}
          href="/dashboard"
          title="Dashboard"
        >
          <span className="material-symbols-outlined shrink-0">dashboard</span>
          <span
            className={`transition-all duration-300 ease-in-out overflow-hidden whitespace-nowrap ${
              isCollapsed ? 'max-w-xs md:max-w-0 opacity-100 md:opacity-0 ml-4 md:ml-0' : 'max-w-xs opacity-100 ml-4'
            }`}
          >
            Dashboard
          </span>
        </Link>

        <Link
          className={`flex items-center rounded-xl font-label-mono text-label-mono transition-all duration-300 ease-in-out hover:no-underline w-full h-12 ${
            isCollapsed ? 'md:justify-center md:p-0 md:mx-auto px-4' : 'px-4'
          } ${
            activePage === 'missions'
              ? 'bg-secondary-container text-primary font-bold'
              : 'text-on-surface-variant hover:bg-surface-container-high/60'
          }`}
          href="/missions"
          title="Tulis Esai"
        >
          <span className="material-symbols-outlined shrink-0">edit_note</span>
          <span
            className={`transition-all duration-300 ease-in-out overflow-hidden whitespace-nowrap ${
              isCollapsed ? 'max-w-xs md:max-w-0 opacity-100 md:opacity-0 ml-4 md:ml-0' : 'max-w-xs opacity-100 ml-4'
            }`}
          >
            Tulis Esai
          </span>
        </Link>

        <Link
          id="onboarding-sidebar-gacha"
          className={`flex items-center rounded-xl font-label-mono text-label-mono transition-all duration-300 ease-in-out hover:no-underline w-full h-12 ${
            isCollapsed ? 'md:justify-center md:p-0 md:mx-auto px-4' : 'px-4'
          } ${
            activePage === 'gacha'
              ? 'bg-secondary-container text-primary font-bold'
              : 'text-on-surface-variant hover:bg-surface-container-high/60'
          }`}
          href="/gacha"
          title="Mesin Gacha"
        >
          <span className="material-symbols-outlined shrink-0">casino</span>
          <span
            className={`transition-all duration-300 ease-in-out overflow-hidden whitespace-nowrap ${
              isCollapsed ? 'max-w-xs md:max-w-0 opacity-100 md:opacity-0 ml-4 md:ml-0' : 'max-w-xs opacity-100 ml-4'
            }`}
          >
            Mesin Gacha
          </span>
        </Link>

        <Link
          className={`flex items-center rounded-xl font-label-mono text-label-mono transition-all duration-300 ease-in-out hover:no-underline w-full h-12 ${
            isCollapsed ? 'md:justify-center md:p-0 md:mx-auto px-4' : 'px-4'
          } ${
            activePage === 'checkin'
              ? 'bg-secondary-container text-primary font-bold'
              : 'text-on-surface-variant hover:bg-surface-container-high/60'
          }`}
          href="/checkin"
          title="Presensi Harian"
        >
          <span className="material-symbols-outlined shrink-0">calendar_today</span>
          <span
            className={`transition-all duration-300 ease-in-out overflow-hidden whitespace-nowrap ${
              isCollapsed ? 'max-w-xs md:max-w-0 opacity-100 md:opacity-0 ml-4 md:ml-0' : 'max-w-xs opacity-100 ml-4'
            }`}
          >
            Presensi Harian
          </span>
        </Link>

        <Link
          className={`flex items-center rounded-xl font-label-mono text-label-mono transition-all duration-300 ease-in-out hover:no-underline w-full h-12 ${
            isCollapsed ? 'md:justify-center md:p-0 md:mx-auto px-4' : 'px-4'
          } ${
            activePage === 'portfolio'
              ? 'bg-secondary-container text-primary font-bold'
              : 'text-on-surface-variant hover:bg-surface-container-high/60'
          }`}
          href="/portfolio"
          title="Portfolio"
        >
          <span className="material-symbols-outlined shrink-0">folder_shared</span>
          <span
            className={`transition-all duration-300 ease-in-out overflow-hidden whitespace-nowrap ${
              isCollapsed ? 'max-w-xs md:max-w-0 opacity-100 md:opacity-0 ml-4 md:ml-0' : 'max-w-xs opacity-100 ml-4'
            }`}
          >
            Portfolio
          </span>
        </Link>
      </nav>

      {/* Unified Bottom Section */}
      <div className="mt-auto pt-6 border-t border-parchment-border/40 space-y-4">
        {/* Esai Baru Button */}
        <Link
          href="/missions"
          className={`bg-primary text-white font-label-mono text-xs flex items-center justify-center transition-all duration-300 hover:opacity-90 hover:no-underline font-bold w-full h-12 rounded-xl ${
            isCollapsed ? 'md:px-0 px-4' : 'px-4'
          }`}
          title="Esai Baru"
        >
          <span className="material-symbols-outlined text-[20px] shrink-0">add</span>
          <span
            className={`transition-all duration-300 ease-in-out overflow-hidden whitespace-nowrap ${
              isCollapsed ? 'max-w-xs md:max-w-0 opacity-100 md:opacity-0 ml-2 md:ml-0' : 'max-w-xs opacity-100 ml-2'
            }`}
          >
            Esai Baru
          </span>
        </Link>

        {/* User profile card */}
        {user && (
          <div
            className={`flex items-center transition-all duration-300 w-full ${
              isCollapsed ? 'md:justify-center md:p-0 md:bg-transparent md:w-12 md:h-12 md:mx-auto p-3 rounded-2xl bg-surface-container-low/50 gap-3' : 'p-3 rounded-2xl bg-surface-container-low/50 gap-3'
            }`}
          >
            <img
              alt="User Avatar"
              className="w-10 h-10 rounded-full border-2 border-white shadow-sm shrink-0 object-cover"
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuDER-IP0xCIxwf0F8PNcFPWFsmUpUmTQwbO1loH0RDU0b_EfzYzASpAe20c9bLNtiTLgExfzNULE8iw_IZBJF1BqcHukNS06DO3SvVSqlMkAmzL39OV_LHHweaDbnfvy9tcB1uNikuFTbEPvR22C42vPpskVuUziZPOimhk0K3gjkLs_sMlc_Tn2syTUO_hFNaEGotgMt6MO6yR4MAeSDEeT4pcx24NwS-P1TfhqJLUeG6W9uKD1O7Ztd_wNPV1hGx3FfP2xKGLg0NO"
            />
            <div
              className={`overflow-hidden leading-tight flex flex-col transition-all duration-300 ease-in-out ${
                isCollapsed ? 'max-w-xs md:max-w-0 opacity-100 md:opacity-0' : 'max-w-xs opacity-100'
              }`}
            >
              <p className="font-label-mono text-xs font-bold truncate whitespace-nowrap">
                {user.username}
              </p>
              <p className="text-[10px] text-ink-muted truncate whitespace-nowrap">
                Lvl {user.level} {user.active_title || 'Scholar'}
              </p>
            </div>
          </div>
        )}

        {/* Logout button */}
        <button
          onClick={handleLogout}
          className={`border border-primary/30 text-primary font-label-mono text-xs hover:bg-primary hover:text-white transition-all duration-300 cursor-pointer flex items-center justify-center w-full h-12 rounded-xl ${
            isCollapsed ? 'md:px-0 px-4' : 'px-4'
          }`}
          title="Keluar"
        >
          {isCollapsed ? (
            <>
              {/* On Desktop collapsed: icon only */}
              <span className="material-symbols-outlined text-[20px] hidden md:block">logout</span>
              {/* On Mobile or Desktop expanded: text only */}
              <span className="block md:hidden">Keluar</span>
            </>
          ) : (
            <span>Keluar</span>
          )}
        </button>
      </div>
    </aside>
  </>
  );
}
