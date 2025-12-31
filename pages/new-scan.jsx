// pages/new-scan.jsx
import React, { useState, useEffect } from "react";

export default function NewScan() {
  // Campos que já existiam
  const [cirurgiaNome, setCirurgiaNome] = useState("");
  const [cirurgiaSobrenome, setCirurgiaSobrenome] = useState("");
  const [pacienteNome, setPacienteNome] = useState("");
  const [pacienteSobrenome, setPacienteSobrenome] = useState("");
  const [tipo, setTipo] = useState("Escaneamento sobre dente");
  const [conexao, setConexao] = useState("HI Neodent");
  const [implanteInfo, setImplanteInfo] = useState("");
  const [comentarios, setComentarios] = useState("");
  const [link, setLink] = useState("");

  // Novos campos pedidos
  const [dentesSelecionados, setDentesSelecionados] = useState([]); // ex: ["11","12"]
  const [material, setMaterial] = useState("Zircônia");
  const [coresVita, setCoresVita] = useState([]); // ex: ["A1","A2"]

  // Arquivos
  const [fotoFrontal, setFotoFrontal] = useState(null);
  const [fotoEscala, setFotoEscala] = useState(null);
  const [arquivosExtra, setArquivosExtra] = useState([]);

  // Status UI
  const [statusMsg, setStatusMsg] = useState("");
  const [enviando, setEnviando] = useState(false);

  // Listas (mantenha e ajuste se quiser)
  const TIPOS = [
    "Escaneamento sobre dente",
    "Escaneamento de arco completo",
    "Escaneamento arcada superior",
    "Escaneamento arcada inferior",
    "Escaneamento parcial (quadrante)",
    "Escaneamento de modelo",
    "Escaneamento de prótese",
    "Escaneamento para planejamento cirúrgico",
    "Outro",
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
    "Outro",
  ];

  const MATERIAIS = [
    "Zircônia",
    "Emax",
    "Resina com carga em cerâmica",
    "Provisório (resina)",
  ];

  // VITA classical common shades (adapte se quiser)
  const VITA_SHADES = [
    "BL1","BL2","BL3","BL4",
    "A1","A2","A3","A3.5","A4",
    "B1","B2","B3","B4",
    "C1","C2","C3","C4",
    "D2","D3","D4"
  ];

  // Odontograma: números da FDI (superior direito 18->11, superior esquerdo 21->28, inferior esquerdo 48->41, inferior direito 31->38)
  const ODONTOGRAMA = [
    "18","17","16","15","14","13","12","11",
    "21","22","23","24","25","26","27","28",
    "48","47","46","45","44","43","42","41",
    "31","32","33","34","35","36","37","38"
  ];

  function toggleDente(dente) {
    setDentesSelecionados(prev => {
      if (prev.includes(dente)) return prev.filter(d => d !== dente);
      return [...prev, dente];
    });
  }

  function toggleCorVita(cor) {
    setCoresVita(prev => {
      if (prev.includes(cor)) return prev.filter(c => c !== cor);
      return [...prev, cor];
    });
  }

  // handle files inputs
  function handleFotoFrontal(e) {
    setFotoFrontal(e.target.files[0] || null);
  }
  function handleFotoEscala(e) {
    setFotoEscala(e.target.files[0] || null);
  }
  function handleArquivosExtra(e) {
    setArquivosExtra(Array.from(e.target.files || []));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setStatusMsg("");
    setEnviando(true);

    try {
      const formData = new FormData();

      // Campos textuais (nomes esperados pelo backend)
      formData.append("cirurgia_nome", cirurgiaNome);
      formData.append("cirurgia_sobrenome", cirurgiaSobrenome);
      formData.append("paciente_nome", pacienteNome);
      formData.append("paciente_sobrenome", pacienteSobrenome);
      formData.append("tipo", tipo);
      formData.append("conexao", conexao);
      formData.append("implante_info", implanteInfo);
      formData.append("comentarios", comentarios);
      formData.append("link", link);

      // Novos campos: dentes (vários) e material (único) e coresVita (várias)
      // Append multi-values as arrays (backend com formidable geralmente aceita múltiplas chaves do mesmo nome)
      dentesSelecionados.forEach(d => formData.append("dentes[]", d));
      formData.append("material", material);
      coresVita.forEach(c => formData.append("cores_vita[]", c));

      // Arquivos com os nomes que backend espera (mantive 'foto_frontal' e 'arquivos')
      if (fotoFrontal) formData.append("foto_frontal", fotoFrontal);
      if (fotoEscala) formData.append("foto_escala", fotoEscala);
      arquivosExtra.forEach((f) => formData.append("arquivos", f)); // backend aceita vários 'arquivos'

      // Envia via fetch para api route
      const resp = await fetch("/api/send-scan", {
        method: "POST",
        body: formData,
      });

      const json = await resp.json().catch(()=>({ok: resp.ok}));
      if (!resp.ok) {
        setStatusMsg(`Erro: ${json?.error || resp.statusText || "Envio falhou"}`);
      } else {
        setStatusMsg("Enviado com sucesso ✅");
        // limpa só os arquivos e campos extras, mantém o formulário como usuario preferir
        // comentar abaixo se preferir limpar tudo
        setFotoFrontal(null);
        setFotoEscala(null);
        setArquivosExtra([]);
        setDentesSelecionados([]);
        setCoresVita([]);
      }
    } catch (err) {
      console.error(err);
      setStatusMsg(`Erro ao enviar: ${String(err)}`);
    } finally {
      setEnviando(false);
    }
  }

  // Small inline styles para manter aparência similar (não altera a estrutura)
  const styles = {
    container: { maxWidth: 820, margin: "18px auto", padding: 12, fontFamily: "Arial, sans-serif" },
    fieldRow: { marginBottom: 14 },
    label: { display: "block", fontWeight: 700, marginBottom: 6 },
    input: { width: "48%", padding: 8, marginRight: "4%", boxSizing: "border-box", border: "1px solid #999" },
    inputFull: { width: "100%", padding: 8, boxSizing: "border-box", border: "1px solid #999" },
    select: { width: "100%", padding: 8, boxSizing: "border-box", border: "1px solid #999" },
    odontogramaGrid: { display: "grid", gridTemplateColumns: "repeat(8, 1fr)", gap: 6, marginTop: 8 },
    toothBtn: (selected) => ({
      padding: "8px 6px",
      border: "1px solid #666",
      borderRadius: 4,
      cursor: "pointer",
      background: selected ? "#ff8c00" : "#fff",
      color: selected ? "#fff" : "#000",
      textAlign: "center",
      fontWeight: 600,
      userSelect: "none"
    }),
    smallNote: { fontSize: 13, color: "#666", marginTop: 6 },
    submitBtn: { padding: "8px 16px", background: "#e67e22", color: "#fff", border: "none", cursor: "pointer", marginTop: 10 },
    status: { marginTop: 12 }
  };

  return (
    <div style={styles.container}>
      <h1 style={{ fontSize: 32 }}>Formulário de Ordem de Serviço/Escaneamento</h1>

      <form onSubmit={handleSubmit}>
        <div style={styles.fieldRow}>
          <label style={styles.label}>Cirurgião Dentista</label>
          <input name="cirurgia_nome" placeholder="Nome" style={styles.input} value={cirurgiaNome} onChange={e => setCirurgiaNome(e.target.value)} />
          <input name="cirurgia_sobrenome" placeholder="Sobrenome" style={styles.input} value={cirurgiaSobrenome} onChange={e => setCirurgiaSobrenome(e.target.value)} />
        </div>

        <div style={styles.fieldRow}>
          <label style={styles.label}>Paciente</label>
          <input name="paciente_nome" placeholder="Nome" style={styles.input} value={pacienteNome} onChange={e => setPacienteNome(e.target.value)} />
          <input name="paciente_sobrenome" placeholder="Sobrenome" style={styles.input} value={pacienteSobrenome} onChange={e => setPacienteSobrenome(e.target.value)} />
        </div>

        <div style={styles.fieldRow}>
          <label style={styles.label}>Tipo de escaneamento</label>
          <select name="tipo" style={styles.select} value={tipo} onChange={e => setTipo(e.target.value)}>
            {TIPOS.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>

        <div style={styles.fieldRow}>
          <label style={styles.label}>Conexão implante ou pilar</label>
          <select name="conexao" style={styles.select} value={conexao} onChange={e => setConexao(e.target.value)}>
            {CONEXOES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>

        <div style={styles.fieldRow}>
          <label style={styles.label}>Informar elementos sobre o implante / observações</label>
          <input name="implante_info" style={styles.inputFull} value={implanteInfo} onChange={e => setImplanteInfo(e.target.value)} placeholder="ex: diâmetro 3.5, comprimento 10mm, posição 23" />
        </div>

        {/* ==== NOVO: Odontograma (seleção múltipla de dentes) ==== */}
        <div style={styles.fieldRow}>
          <label style={styles.label}>Escolha do(s) dente(s) — selecione um ou mais</label>
          <div style={styles.odontogramaGrid}>
            {ODONTOGRAMA.map(d => {
              const selected = dentesSelecionados.includes(d);
              return (
                <div
                  key={d}
                  role="button"
                  tabIndex={0}
                  onClick={() => toggleDente(d)}
                  onKeyPress={() => toggleDente(d)}
                  style={styles.toothBtn(selected)}
                  title={`Dente ${d}`}
                >
                  {d}
                </div>
              );
            })}
          </div>
          <div style={styles.smallNote}>Clique em um dente para selecionar/remover. Os dentes selecionados serão enviados no campo <code>dentes[]</code>.</div>
        </div>

        {/* ==== NOVO: Material ==== */}
        <div style={styles.fieldRow}>
          <label style={styles.label}>Material a ser feito</label>
          <select name="material" style={styles.select} value={material} onChange={e => setMaterial(e.target.value)}>
            {MATERIAIS.map(m => <option key={m} value={m}>{m}</option>)}
          </select>
        </div>

        {/* ==== NOVO: Escala de cores (VITA) multi-select com botões ==== */}
        <div style={styles.fieldRow}>
          <label style={styles.label}>Escala de cores (VITA) — selecione uma ou mais</label>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {VITA_SHADES.map(shade => {
              const sel = coresVita.includes(shade);
              return (
                <button
                  key={shade}
                  type="button"
                  onClick={() => toggleCorVita(shade)}
                  style={{
                    padding: "6px 10px",
                    borderRadius: 6,
                    border: sel ? "2px solid #ff8c00" : "1px solid #ccc",
                    background: sel ? "#ffefd5" : "#fff",
                    cursor: "pointer"
                  }}
                >
                  {shade}
                </button>
              );
            })}
          </div>
          <div style={styles.smallNote}>As opções escolhidas serão enviadas em <code>cores_vita[]</code>.</div>
        </div>

        {/* Arquivos (mantive nomes que backend espera) */}
        <div style={styles.fieldRow}>
          <label style={styles.label}>Fotos obrigatórias (frontal)</label>
          <input type="file" name="foto_frontal" accept="image/*" onChange={handleFotoFrontal} />
        </div>

        <div style={styles.fieldRow}>
          <label style={styles.label}>Foto com escala de cor (opcional)</label>
          <input type="file" name="foto_escala" accept="image/*" onChange={handleFotoEscala} />
        </div>

        <div style={styles.fieldRow}>
          <label style={styles.label}>Arquivos adicionais (STL, PDF, imagens) — múltiplos</label>
          <input type="file" name="arquivos" accept=".stl,application/pdf,image/*" onChange={handleArquivosExtra} multiple />
        </div>

        <div style={styles.fieldRow}>
          <label style={styles.label}>Comentários adicionais e link escaneamento</label>
          <textarea name="comentarios" style={{...styles.inputFull, height: 100}} value={comentarios} onChange={e => setComentarios(e.target.value)} />
        </div>

        <div style={styles.fieldRow}>
          <label style={styles.label}>Link do escaneamento (opcional)</label>
          <input name="link" style={styles.inputFull} placeholder="https://..." value={link} onChange={e => setLink(e.target.value)} />
        </div>

        <button type="submit" disabled={enviando} style={styles.submitBtn}>Enviar</button>

        <div style={styles.status}>
          {statusMsg && <div>{statusMsg}</div>}
        </div>
      </form>
    </div>
  );
}
