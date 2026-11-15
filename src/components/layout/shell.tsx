"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, type ReactNode } from "react";
import { AnimatePresence, motion, MotionConfig } from "motion/react";
import {
  FilePlus2,
  Files,
  Users,
  Package,
  PanelsTopLeft,
  Settings2,
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Sun,
  Moon,
  Menu,
  Check,
  HardDrive,
  ArrowUpRight,
  CircleHelp,
} from "lucide-react";
import { useUI } from "@/stores/ui";
import { brand } from "@/constants/brand";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/shared";
const nav = [
  ["Create Document", "/app", FilePlus2],
  ["Documents", "/app/documents", Files],
  ["Clients", "/app/clients", Users],
  ["Items & Services", "/app/items", Package],
  ["Templates", "/app/templates", PanelsTopLeft],
  ["Business Settings", "/app/settings", Settings2],
] as const;
export function Brand() {
  return (
    <Link className="brand" href="/">
      <span className="brand-mark">
        <Check size={22} strokeWidth={3} />
      </span>
      {brand.name.toLowerCase()}
      <span className="brand-dot">.</span>
    </Link>
  );
}
export default function Shell({ children }: { children: ReactNode }) {
  const path = usePathname();
  const ui = useUI();
  useEffect(() => {
    try {
      if (
        localStorage.getItem("vouch-theme") === "dark" &&
        !useUI.getState().dark
      )
        useUI.getState().toggleTheme();
    } catch {
      /* Restricted storage must not prevent using the workspace. */
    }
  }, []);
  const links = (
    <>
      {nav.map(([name, href, Icon]) => (
        <Link
          onClick={() => ui.setMobile(false)}
          key={href}
          title={name}
          aria-current={path === href ? "page" : undefined}
          className={`nav-link ${path === href ? "active" : ""}`}
          href={href}
        >
          <Icon size={19} />
          <span>{name}</span>
          {path === href && <span className="nav-dot" />}
        </Link>
      ))}
    </>
  );
  return (
    <MotionConfig reducedMotion="user">
      <div className={`workspace ${ui.collapsed ? "is-collapsed" : ""}`}>
        <aside className="sidebar">
          <Brand />
          <div className="workspace-label">WORKSPACE</div>
          <nav>{links}</nav>
          <button
            className="collapse-button"
            aria-label="Toggle sidebar"
            onClick={ui.toggleSidebar}
          >
            {ui.collapsed ? (
              <ChevronRight size={15} />
            ) : (
              <ChevronLeft size={15} />
            )}
          </button>
          <div className="sidebar-bottom">
            <div className="pro-banner">
              <div className="pro-title">
                <Sparkles size={17} />
                <strong>{brand.name} Pro</strong>
              </div>
              <span className="coming">COMING SOON</span>
              <p>Even more powerful tools are on the way.</p>
              <ul>
                <li>Cloud backup & sync</li>
                <li>Multiple business profiles</li>
                <li>Recurring invoices</li>
                <li>Team collaboration</li>
              </ul>
              <small>
                Stay tuned for updates <ArrowUpRight size={12} />
              </small>
            </div>
            <div className="storage">
              <span className="status-dot" />
              <span>Stored on your device</span>
              <ShieldCheck size={15} />
            </div>
            <div className="sidebar-foot">Made for your independence.</div>
          </div>
        </aside>
        <div className="main-shell">
          <header className="topbar">
            <div className="topbar-left">
              <Button
                variant="ghost"
                size="icon"
                className="mobile-menu"
                aria-label="Open navigation"
                onClick={() => ui.setMobile(true)}
              >
                <Menu size={20} />
              </Button>
              <span>Workspace</span>
              <ChevronRight size={14} />
              <strong>
                {nav.find((n) => n[1] === path)?.[0] ?? "Create Document"}
              </strong>
            </div>
            <div className="topbar-actions">
              <span className="local-badge">
                <ShieldCheck size={14} />
                Private by design
              </span>
              <Button
                variant="ghost"
                size="icon"
                aria-label="Help"
                onClick={() =>
                  ui.toast(
                    "Your work stays in this browser. Save backups in Business Settings. Use Download PDF to share a document."
                  )
                }
              >
                <CircleHelp size={19} />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                aria-label="Toggle color theme"
                onClick={ui.toggleTheme}
              >
                {ui.dark ? <Sun size={19} /> : <Moon size={19} />}
              </Button>
              <span className="avatar">Y</span>
            </div>
          </header>
          <main>{children}</main>
          <footer className="workspace-footer">
            <span>
              <HardDrive size={13} />
              Your documents are stored locally on this device.
            </span>
            <Link
              href="/app/settings"
              title="Browser data can be removed. Export a backup regularly."
            >
              Manage your data <ArrowUpRight size={12} />
            </Link>
          </footer>
        </div>
        <Modal
          open={ui.mobile}
          onOpenChange={ui.setMobile}
          title="Your workspace"
        >
          <nav className="mobile-nav">{links}</nav>
        </Modal>
        <AnimatePresence>
          {ui.notice && (
            <motion.div
              role="status"
              className="toast"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
            >
              <Check size={17} />
              {ui.notice}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </MotionConfig>
  );
}
