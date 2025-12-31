// pages/new-scan.jsx
import React, { useState } from "react";

export default function NewScan() {
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState("");
  const [formDataState, setFormDataState] = useState({});

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
    "Outro"
  ];

  function onInput(e) {
    setFormDataState({ ...formDataState, [e.target.name]: e.target.value });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setMessage("");
    setSending(true);

    const formEl = e.currentTarget;
    const fd = new FormData(formEl);

    try {
      const res = await fetch("/api/send-scan", {
        method: "POST",
        body: fd,
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || "Erro desconhecido");

      setMessage("Enviado com sucesso ✅");
      formEl.reset();
    } catch (err) {
      setMessage("Erro: " + (err.message || String(err)));
    } finally {
      setSending(false);
    }
  }

  // estilo simples inline (basta colar, pode melhorar depois)
  const style = {
    container: { maxWidth: 720, margin: "24px auto", fontFamily: "Arial, serif", padding: "0 16px" },
    heading: { fontSize: 30, marginBottom: 8 },
    label: { display: "block", marginTop: 14, fontWeight: 700 },
    input: { width: "100%", padding: "6px 8px", marginTop: 6, boxSizing: "border-box" },
    twoCols: { display: "flex", gap: 8 },
    smallInput: { flex: 1 },
    button: { marginTop: 18, background: "#e67e22", color: "#fff", border: "none", padding: "10px 16px", cursor: "pointer" },
    textarea: { width: "100%", minHeight: 90, padding: 8, boxSizing: "border-box" },
    note: { marginTop: 12, color: "#b00" }
  };

  return (
    <div style={style.container}>
      <h1 style={style.heading}>Formulário de Escaneamento</h1>

      <form onSubmit={handleSubmit} encType="multipart/form-data" id="scanForm">
        <label style={style.label}>Cirurgião Dentista</label>
        <div style={style.twoCols}>
          <input style={{...style.input, ...style.smallInput}} name="cirurgia_nome" placeholder="Nome" onChange={onInput} />
          <input style={{...style.input, ...style.smallInput}} name="cirurgia_sobrenome" placeholder="Sobrenome" onChange={onInput} />
        </div>

        <label style={style.label}>Paciente</label>
        <div style={style.twoCols}>
          <input style={{...style.input, ...style.smallInput}} name="paciente_nome" placeholder="Nome" onChange={onInput} />
          <input style={{...style.input, ...style.smallInput}} name="paciente_sobrenome" placeholder="Sobrenome" onChange={onInput} />
        </div>

        <label style={style.label}>Tipo de escaneamento</label>
        <select name="tipo" style={style.input} defaultValue={TIPOS[0]} onChange={onInput}>
          {TIPOS.map(t => <option key={t} value={t}>{t}</option>)}
        </select>

        <label style={style.label}>Conexão implante ou pilar</label>
        <select name="conexao" style={style.input} defaultValue={CONEXOES[0]} onChange={onInput}>
          {CONEXOES.map(c => <option key={c} value={c}>{c}</option>)}
        </select>

        <label style={style.label}>Informar elementos sobre o implante / observações</label>
        <input name="implante_info" style={style.input} onChange={onInput} placeholder="ex: diâmetro 3.5, comprimento 10mm, posição 23" />

        <label style={style.label}>Fotos obrigatórias (frontal, escala de cor)</label>
        <input style={style.input} name="foto_frontal" type="file" accept="image/*" required />

        <label style={style.label}>Fotos complementares / anexos (STL, PDF, imagens)</label>
        <input style={style.input} name="arquivos" type="file" multiple />

        <label style={style.label}>Comentários adicionais e link do escaneamento</label>
        <textarea name="comentarios" style={style.textarea} onChange={onInput} />

        <label style={style.label}>Link do escaneamento (opcional)</label>
        <input style={style.input} name="link" placeholder="https://..." onChange={onInput} />

        <button style={style.button} type="submit" disabled={sending}>
          {sending ? "Enviando..." : "Enviar"}
        </button>

        {message && <div style={style.note}>{message}</div>}
      </form>
    </div>
  );
}
