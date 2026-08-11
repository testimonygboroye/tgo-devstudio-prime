"use client";

import { useState, useRef, useEffect } from "react";
import { MessageCircle, X, Mail } from "lucide-react";
import { GitHubIcon, WhatsAppIcon, FacebookIcon, InstagramIcon } from "@/components/public/SocialIcons";

interface SocialLink {
  label: string;
  description: string;
  href: string;
  icon: (props: React.SVGProps<SVGSVGElement>) => React.JSX.Element;
  iconBg: string;
}

const SOCIAL_LINKS: SocialLink[] = [
  {
    label: "WhatsApp",
    description: "Chat with us directly",
    href: "https://wa.me/message/LUJ6PXE3ISDZF1",
    icon: WhatsAppIcon,
    iconBg: "bg-[#25D366]",
  },
  {
    label: "Email",
    description: "Send us a message",
    href: "mailto:testimonygboroye.dev@gmail.com",
    icon: (props) => <Mail {...props} />,
    iconBg: "bg-neutral-700",
  },
  {
    label: "GitHub",
    description: "See our code and projects",
    href: "https://github.com/testimonygboroye",
    icon: GitHubIcon,
    iconBg: "bg-neutral-800",
  },
  {
    label: "Instagram",
    description: "Follow us for updates",
    href: "https://www.instagram.com/testimonygboroye",
    icon: InstagramIcon,
    iconBg: "bg-gradient-to-br from-[#F58529] via-[#DD2A7B] to-[#8134AF]",
  },
  {
    label: "Facebook",
    description: "Like and follow our page",
    href: "https://www.facebook.com/profile.php?id=61590906354276",
    icon: FacebookIcon,
    iconBg: "bg-[#1877F2]",
  },
];

const BUTTON_SIZE = 56;
const EDGE_MARGIN = 16;
const DRAG_THRESHOLD_PX = 6;
const STORAGE_KEY = "tgo-social-button-position";

interface Position {
  x: number;
  y: number;
}

function getDefaultPosition(): Position {
  return {
    x: window.innerWidth - BUTTON_SIZE - EDGE_MARGIN,
    y: window.innerHeight - BUTTON_SIZE - EDGE_MARGIN,
  };
}

function clampPosition(pos: Position): Position {
  const maxX = window.innerWidth - BUTTON_SIZE - EDGE_MARGIN;
  const maxY = window.innerHeight - BUTTON_SIZE - EDGE_MARGIN;
  return {
    x: Math.min(Math.max(pos.x, EDGE_MARGIN), Math.max(maxX, EDGE_MARGIN)),
    y: Math.min(Math.max(pos.y, EDGE_MARGIN), Math.max(maxY, EDGE_MARGIN)),
  };
}

export default function SocialFloatingButton() {
  const [isOpen, setIsOpen] = useState(false);
  const [position, setPosition] = useState<Position | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const dragStateRef = useRef({ startX: 0, startY: 0, startPosX: 0, startPosY: 0, moved: false });

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      if (stored) {
        setPosition(clampPosition(JSON.parse(stored) as Position));
        return;
      }
    } catch {
      // fall through
    }
    setPosition(getDefaultPosition());
  }, []);

  useEffect(() => {
    function handleResize() {
      setPosition((prev) => (prev ? clampPosition(prev) : prev));
    }
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  function handlePointerDown(event: React.PointerEvent<HTMLButtonElement>) {
    if (!position) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    dragStateRef.current = {
      startX: event.clientX,
      startY: event.clientY,
      startPosX: position.x,
      startPosY: position.y,
      moved: false,
    };
    setIsDragging(true);
  }

  function handlePointerMove(event: React.PointerEvent<HTMLButtonElement>) {
    if (!isDragging) return;

    const dx = event.clientX - dragStateRef.current.startX;
    const dy = event.clientY - dragStateRef.current.startY;

    if (Math.abs(dx) > DRAG_THRESHOLD_PX || Math.abs(dy) > DRAG_THRESHOLD_PX) {
      dragStateRef.current.moved = true;
    }

    if (dragStateRef.current.moved) {
      setPosition(
        clampPosition({
          x: dragStateRef.current.startPosX + dx,
          y: dragStateRef.current.startPosY + dy,
        })
      );
    }
  }

  function handlePointerUp(event: React.PointerEvent<HTMLButtonElement>) {
    event.currentTarget.releasePointerCapture(event.pointerId);
    setIsDragging(false);

    setPosition((prev) => {
      if (prev) {
        try {
          window.localStorage.setItem(STORAGE_KEY, JSON.stringify(prev));
        } catch {
          // ignore storage errors
        }
      }
      return prev;
    });
  }

  function handleButtonClick() {
    if (dragStateRef.current.moved) {
      dragStateRef.current.moved = false;
      return;
    }
    setIsOpen((prev) => !prev);
  }

  if (!position) return null;

  const popupAboveButton = position.y > window.innerHeight / 2;

  return (
    <div
      ref={containerRef}
      className="fixed z-50"
      style={{ left: position.x, top: position.y, touchAction: "none" }}
    >
      {isOpen && (
        <div
          className={`absolute w-64 overflow-hidden rounded-xl border border-base-800 bg-base-900 shadow-2xl ${
            popupAboveButton ? "bottom-[64px] right-0" : "top-[64px] right-0"
          }`}
        >
          <div className="border-b border-base-800 px-4 py-3">
            <p className="font-mono text-xs uppercase tracking-widest text-neutral-400">
              Get in Touch
            </p>
          </div>
          <div className="flex flex-col divide-y divide-base-800">
            {SOCIAL_LINKS.map((social) => {
              const Icon = social.icon;
              return (
                <a
                  key={social.label}
                  href={social.href}
                  target={social.href.startsWith("mailto:") ? undefined : "_blank"}
                  rel={social.href.startsWith("mailto:") ? undefined : "noopener noreferrer"}
                  onClick={() => setIsOpen(false)}
                  className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-base-800"
                >
                  <span
                    className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full text-white ${social.iconBg}`}
                  >
                    <Icon className="h-4 w-4" />
                  </span>
                  <span>
                    <span className="block text-sm font-semibold text-neutral-100">
                      {social.label}
                    </span>
                    <span className="block text-xs text-neutral-400">{social.description}</span>
                  </span>
                </a>
              );
            })}
          </div>
        </div>
      )}

      <button
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onClick={handleButtonClick}
        aria-label={isOpen ? "Close social links" : "Open social links"}
        className={`flex h-14 w-14 items-center justify-center rounded-full brand-gradient-bg text-base-950 shadow-lg transition-transform ${
          isDragging ? "scale-110 cursor-grabbing" : "cursor-grab hover:scale-105 active:scale-95"
        }`}
      >
        {isOpen ? <X size={24} /> : <MessageCircle size={24} />}
      </button>
    </div>
  );
}
