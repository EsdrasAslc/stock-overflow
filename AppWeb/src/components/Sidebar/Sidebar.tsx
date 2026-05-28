"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import styles from "./Sidebar.module.css";
import {
  LayoutDashboard, Package, ArrowLeftRight,
  BarChart2, Settings, Bot, LogOut,
} from "lucide-react";

const menuItems = [
  { label: "Dashboard",    path: "/",             icon: LayoutDashboard },
  { label: "Estoque",      path: "/estoque",      icon: Package },
  { label: "Movimentação", path: "/movimentacao", icon: ArrowLeftRight },
  { label: "Relatórios",   path: "/relatorios",   icon: BarChart2 },
  { label: "Configurações",path: "/config",       icon: Settings },
];

// Lê um cookie pelo nome
function getCookie(name) {
  const match = document.cookie.match(new RegExp("(^| )" + name + "=([^;]+)"));
  return match ? decodeURIComponent(match[2]) : null;
}

export default function Sidebar() {
  const pathname = usePathname();
  const router   = useRouter();
  const [username, setUsername] = useState("...");

  // Lê o cookie do nome assim que o componente monta no browser
  useEffect(() => {
    const name = getCookie("username");
    if (name) setUsername(name);
  }, []);

  const handleLogout = () => {
    // Apaga os cookies de sessão
    document.cookie = "session=; path=/; max-age=0";
    document.cookie = "username=; path=/; max-age=0";
    router.push("/login");
  };

  return (
    <div className={styles.sidebarWrapper}>
      <aside className={styles.sidebar}>

        {/* Nome do usuário */}
        <div className={styles.header}>
          <Bot size={18} color="#d4a04a" />
          <span className={styles.username} title={username}>{username}</span>
        </div>

        {/* Navegação */}
        <nav className={styles.nav}>
          {menuItems.map(({ label, path, icon: Icon }) => {
            const isActive = path === "/" ? pathname === "/" : pathname.startsWith(path);
            return (
              <Link key={path} href={path} title={label}
                className={`${styles.link} ${isActive ? styles.active : ""}`}>
                <Icon size={22} />
              </Link>
            );
          })}
        </nav>

        {/* Botão de logout no rodapé */}
        <button onClick={handleLogout} className={styles.logoutBtn} title="Sair">
          <LogOut size={20} />
        </button>

      </aside>
    </div>
  );
}