import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { User, Lock, Eye, EyeOff } from "lucide-react";

export default function LoginPage() {
  const navigate = useNavigate();
  const [form, setForm]         = useState({ user: "", password: "" });
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState("");

  const handle = (k: keyof typeof form, v: string) => {
    setForm((p) => ({ ...p, [k]: v }));
    setError("");
  };

  const submit = async () => {
    if (!form.user || !form.password) {
      setError("Preencha usuário e senha.");
      return;
    }
    setLoading(true);

    // ── Substitua por chamada real quando tiver API ──────────────────────────
    // const res  = await fetch("/api/auth/login", {
    //   method: "POST",
    //   headers: { "Content-Type": "application/json" },
    //   body: JSON.stringify(form),
    // });
    // const data = await res.json();
    // if (!res.ok) { setError(data.message || "Credenciais inválidas."); setLoading(false); return; }
    // document.cookie = `username=${data.nome}; path=/; max-age=86400`;
    // ────────────────────────────────────────────────────────────────────────

    // Simulação: aceita qualquer login
    await new Promise((r) => setTimeout(r, 1000));

    // Salva sessão + nome do usuário em cookies
    document.cookie = `session=authenticated; path=/; max-age=86400`;
    document.cookie = `username=${encodeURIComponent(form.user)}; path=/; max-age=86400`;

    setLoading(false);
    navigate("/dashboard");
  };

  return (
    <div style={{
      display: "flex", height: "100vh",
      fontFamily: "'Inter', sans-serif", background: "#ffffff",
    }}>

      {/* ── Lado esquerdo: formulário ── */}
      <div style={{
        flex: "0 0 320px", display: "flex",
        flexDirection: "column", justifyContent: "center",
        padding: "48px 40px", background: "#ffffff",
      }}>

        {/* Logo */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 48 }}>
          <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
            <rect width="36" height="36" rx="6" fill="#1e3a8a"/>
            <rect x="6" y="10" width="10" height="10" rx="1" fill="#f59e0b"/>
            <rect x="20" y="10" width="10" height="7" rx="1" fill="#f59e0b"/>
            <rect x="6" y="22" width="10" height="7" rx="1" fill="#f59e0b" opacity="0.6"/>
            <rect x="20" y="19" width="10" height="10" rx="1" fill="#f59e0b" opacity="0.8"/>
          </svg>
          <span style={{ fontSize: 20, fontWeight: 400, color: "#111" }}>
            <span style={{ fontWeight: 700 }}>Stock</span>Overflow
          </span>
        </div>

        {/* Campos */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

          <div style={{
            display: "flex", alignItems: "center", gap: 10,
            borderBottom: "1.5px solid #d1d5db", paddingBottom: 8,
          }}>
            <User size={16} color="#9ca3af" />
            <input
              type="text" placeholder="User" value={form.user}
              onChange={e => handle("user", e.target.value)}
              onKeyDown={e => e.key === "Enter" && submit()}
              style={{ flex:1, border:"none", outline:"none", fontSize:14, color:"#111", background:"transparent" }}
            />
          </div>

          <div style={{
            display: "flex", alignItems: "center", gap: 10,
            borderBottom: "1.5px solid #d1d5db", paddingBottom: 8,
          }}>
            <Lock size={16} color="#9ca3af" />
            <input
              type={showPass ? "text" : "password"} placeholder="Password" value={form.password}
              onChange={e => handle("password", e.target.value)}
              onKeyDown={e => e.key === "Enter" && submit()}
              style={{ flex:1, border:"none", outline:"none", fontSize:14, color:"#111", background:"transparent" }}
            />
            <button onClick={() => setShowPass(p => !p)}
              style={{ background:"none", border:"none", cursor:"pointer", padding:0 }}>
              {showPass ? <EyeOff size={15} color="#9ca3af" /> : <Eye size={15} color="#9ca3af" />}
            </button>
          </div>

          {error && <p style={{ margin:0, fontSize:12, color:"#ef4444" }}>{error}</p>}

          <button onClick={submit} disabled={loading} style={{
            marginTop:8, background:"#1e3a8a", color:"#f59e0b",
            border:"none", borderRadius:6, padding:"12px 0",
            fontSize:15, fontWeight:600, cursor: loading ? "not-allowed" : "pointer",
            letterSpacing:"0.04em", opacity: loading ? 0.8 : 1, transition:"opacity 0.2s",
          }}>
            {loading ? "Entrando..." : "Login"}
          </button>

        </div>
      </div>

      {/* ── Lado direito: imagem ── */}
      <div style={{
        flex:1, background:"#111827",
        borderRadius:"16px 0 0 16px", overflow:"hidden", position:"relative",
      }}>
        <img src="/login-warehouse.png" alt="Armazém automatizado"
          style={{ width:"100%", height:"100%", objectFit:"cover", display:"block" }}
          onError={(e: React.SyntheticEvent<HTMLImageElement, Event>) => { (e.target as HTMLImageElement).style.display = "none"; }} />

        <div style={{
          position:"absolute", inset:0,
          display:"flex", alignItems:"center", justifyContent:"center",
          flexDirection:"column", gap:16,
          background:"linear-gradient(135deg, #1e3a8a 0%, #111827 60%, #1a1a1a 100%)",
        }}>
          <svg width="120" height="120" viewBox="0 0 120 120" fill="none" opacity="0.3">
            <rect x="10" y="40" width="30" height="20" rx="2" fill="#f59e0b"/>
            <rect x="10" y="65" width="30" height="20" rx="2" fill="#f59e0b" opacity="0.7"/>
            <rect x="45" y="30" width="30" height="20" rx="2" fill="#f59e0b"/>
            <rect x="45" y="55" width="30" height="20" rx="2" fill="#f59e0b" opacity="0.7"/>
            <rect x="45" y="80" width="30" height="20" rx="2" fill="#f59e0b" opacity="0.4"/>
            <rect x="80" y="40" width="30" height="20" rx="2" fill="#f59e0b"/>
            <rect x="80" y="65" width="30" height="20" rx="2" fill="#f59e0b" opacity="0.7"/>
            <line x1="8" y1="38" x2="8" y2="108" stroke="#f59e0b" strokeWidth="3" opacity="0.5"/>
            <line x1="43" y1="28" x2="43" y2="108" stroke="#f59e0b" strokeWidth="3" opacity="0.5"/>
            <line x1="78" y1="38" x2="78" y2="108" stroke="#f59e0b" strokeWidth="3" opacity="0.5"/>
          </svg>
          <p style={{ color:"#f59e0b", fontSize:13, fontWeight:500, opacity:0.6, margin:0 }}>
            Adicione login-warehouse.png em /public
          </p>
        </div>

        <div style={{
          position:"absolute", bottom:24, left:24,
          background:"rgba(0,0,0,0.6)", color:"#f59e0b",
          fontSize:13, fontWeight:700, padding:"4px 12px",
          borderRadius:4, letterSpacing:"0.1em",
        }}>A1</div>
      </div>

    </div>
  );
}