// pages/new-scan.jsx
import { useRef, useState } from "react";

export default function NewScan() {
  const formRef = useRef(null);
  const [status, setStatus] = useState("");

  // listas completas (colecionadas da sua captura)
  const TIPOS = [
    "Escaneamento sobre dente",
    "Escaneamento de arco completo",
    "Escaneamento arcada superior",
    "Escaneamento arcada inferior",
    "Escaneamento parcial (quadrante)",
    "Escaneamento de modelo",
    "Escaneamento de prótese",
    "Escaneamento para planejamento cirúrgico",
    "Outro"
  ];

  const CONEXOES = [
    "HI Neodent",
    "HE Neodent",
    "Neodent Pilar custom",
    "Straumann (Internal)",
    "Straumann (External)",
    "Nobel Active",
    "Nobel Replace",
    "Astra Tech",
    "Ankylos",
    "Camlog",
    "Zimmer",
    "Hexagonal externo",
    "Hexagonal interno",
    "Morse Taper",
    "Conexão cônica generic",
    "Pilar de cicatrização",
    "Pilar anatômico",
    "Pilar reto",
    "Conexão Indexada",
    "Outro"
  ];

  async function handleSubmit(e) {
    e.preventDefault();
    setStatus("Enviando...");

    try {
      const formData = new FormData(formRef.current);

      const res = await fetch("/api/send-scan", {
        method: "POST",
        body: formData,
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        console.error("Resposta não ok:", res.status, data);
        setStatus(data.error || "Erro ao enviar formulário");
        return;
      }

      setStatus("Enviado com sucesso ✅");
      formRef.current.reset();
    } catch (err) {
      console.error(err);
      setStatus("Erro ao enviar formulário");
    }
  }

  return (
    <div style={{ maxWidth: 820, margin: "30px auto", fontFamily: "Georgia, serif" }}>
      <h1 style={{ fontSize: 34, marginBottom: 20 }}>Formulário de Escaneamento</h1>

      <form
        ref={formRef}
        onSubmit={handleSubmit}
        encType="multipart/form-data"
        style={{ lineHeight: 1.6 }}
      >
        {/* CIRURGIÃO */}
        <label><strong>Cirurgião Dentista</strong></label><br />
        <input name="cirurgia_nome" placeholder="Nome" required style={{ width: "48%" }} />{" "}
        <input name="cirurgia_sobrenome" placeholder="Sobrenome" required style={{ width: "48%" }} />
        <br /><br />

        {/* PACIENTE */}
        <label><strong>Paciente</strong></label><br />
        <input name="paciente_nome" placeholder="Nome" required style={{ width: "48%" }} />{" "}
        <input name="paciente_sobrenome" placeholder="Sobrenome" required style={{ width: "48%" }} />
        <br /><br />

        {/* TIPO DE ESCANEAMENTO (COMPLETO) */}
        <label><strong>Tipo de escaneamento</strong></label><br />
        <select name="tipo" required style={{ width: "100%", maxWidth: 600 }}>
          {TIPOS.map((t) => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>
        <br /><br />

        {/* CONEXÃO IMPLANTE OU PILAR (COMPLETO) */}
        <label><strong>Conexão implante ou pilar</strong></label><br />
        <select name="conexao" required style={{ width: "100%", maxWidth: 600 }}>
          {CONEXOES.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
        <br /><br />

        {/* INFO IMPLANTE */}
        <label><strong>Informar elementos sobre o implante / observações</strong></label><br />
        <input
          name="implante_info"
          placeholder="ex: diâmetro 3.5, comprimento 10mm, posição 23"
          style={{ width: "100%", maxWidth: 760 }}
        />
        <br /><br />

        {/* FOTOS obrigatórias */}
        <label><strong>Fotos obrigatórias (frontal, escala de cor)</strong></label><br />
        <input type="file" name="foto_frontal" accept="image/*" required /><br />
        <input type="file" name="foto_escala" accept="image/*" required /><br /><br />

        {/* ANEXOS */}
        <label><strong>Arquivos (STL, PDF, imagens) — múltiplos</strong></label><br />
        <input type="file" name="arquivos" multiple />
        <br /><br />

        {/* COMENTÁRIOS */}
        <label><strong>Comentários adicionais e link escaneamento</strong></label><br />
        <textarea name="comentarios" rows={4} style={{ width: "100%", maxWidth: 760 }} />
        <br /><br />

        <label><strong>Link do escaneamento (opcional)</strong></label><br />
        <input name="link" placeholder="https://..." style={{ width: "100%", maxWidth: 760 }} />
        <br /><br />

        <button
          type="submit"
          style={{
            padding: "8px 18px",
            background: "#e67e22",
            color: "#fff",
            border: "none",
            cursor: "pointer",
          }}
        >
          Enviar
        </button>

        <div style={{ marginTop: 12, fontWeight: "bold", color: status.startsWith("Erro") ? "crimson" : "green" }}>
          {status}
        </div>
      </form>
    </div>
  );
}
