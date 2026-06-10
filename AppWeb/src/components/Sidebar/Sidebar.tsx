import { useEffect, useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import styles from './Sidebar.module.css'
import {
  LayoutDashboard, Package, ArrowLeftRight,
  BarChart2, Settings, Bot, LogOut,
} from 'lucide-react'

interface MenuItem {
  label: string
  path: string
  icon: React.ElementType
}

const menuItems: MenuItem[] = [
  { label: 'Dashboard',    path: '/dashboard',    icon: LayoutDashboard },
  { label: 'Estoque',      path: '/estoque',      icon: Package },

  { label: 'Relatórios',   path: '/relatorios',   icon: BarChart2 },
  { label: 'Configurações',path: '/config',       icon: Settings },
]

function getCookie(name: string): string | null {
  const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'))
  return match ? decodeURIComponent(match[2]) : null
}

export default function Sidebar() {
  const navigate = useNavigate()
  const [username, setUsername] = useState('...')

  useEffect(() => {
    const name = getCookie('username')
    if (name) setUsername(name)
  }, [])

  const handleLogout = () => {
    document.cookie = 'session=; path=/; max-age=0'
    document.cookie = 'username=; path=/; max-age=0'
    navigate('/login')
  }

  return (
    <div className={styles.sidebarWrapper}>
      <aside className={styles.sidebar}>

        {/* Ícone + nome do usuário */}
        <div className={styles.header}>
          <Bot size={18} color="#d4a04a" />
          <span className={styles.username} title={username}>{username}</span>
        </div>

        {/* Navegação */}
        <nav className={styles.nav}>
          {menuItems.map(({ label, path, icon: Icon }) => (
            <NavLink
              key={path}
              to={path}
              title={label}
              className={({ isActive }) =>
                `${styles.link} ${isActive ? styles.active : ''}`
              }
            >
              <Icon size={22} />
            </NavLink>
          ))}
        </nav>

        {/* Logout */}
        <button onClick={handleLogout} className={styles.logoutBtn} title="Sair">
          <LogOut size={20} />
        </button>

      </aside>
    </div>
  )
}