// pages/new-scan.jsx
import React, { useState, useRef } from "react";

export default function NewScan() {
  // campos do formulário principais (preservando nomes usados no backend)
  const [cirurgiaNome, setCirurgiaNome] = useState("");
  const [cirurgiaSobrenome, setCirurgiaSobrenome] = useState("");
  const [pacienteNome, setPacienteNome] = useState("");
  const [pacienteSobrenome, setPacienteSobrenome] = useState("");
  const [tipo, setTipo] = useState("Escaneamento sobre dente");
  const [conexao, setConexao] = useState("HI Neodent");
  const [implanteInfo, setImplanteInfo] = useState("");
  const [comentarios, setComentarios] = useState("");
  const [link, setLink] = useState("");

  // novos campos solicitados
  const [dente, setDente] = useState(""); // ex: "11" (FDI)
  const [material, setMaterial] = useState("Zircônia");
  const [vitaShade, setVitaShade] = useState("");
  const [standardShade, setStandardShade] = useState("");

  // feedback / status
  const [statusMsg, setStatusMsg] = useState("");
  const [sending, setSending] = useState(false);

  // refs para inputs de arquivo
  const fotoFrontalRef = useRef();
  const fotoEscalaRef = useRef();
  const arquivosRef = useRef();

  // odontograma simples: lista de dentes (FDI notation subset)
  // We'll provide from 11..18, 21..28, 31..38, 41..48
  const odontograma = [
    "18","17","16","15","14","13","12","11",
    "21","22","23","24","25","26","27","28",
    "48","47","46","45","44","43","42","41",
    "31","32","33","34","35","36","37","38"
  ];

  function toggleDenteSelection(d) {
    // queremos apenas 1 dente selecionado (por sua preferência)
    setDente(prev => (prev === d ? "" : d));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setStatusMsg("");
    setSending(true);

    try {
      const formData = new FormData();

      // Campos preservados com os nomes que o backend espera
      formData.append("cirurgia_nome", cirurgiaNome || "");
      formData.append("cirurgia_sobrenome", cirurgiaSobrenome || "");
      formData.append("paciente_nome", pacienteNome || "");
      formData.append("paciente_sobrenome", pacienteSobrenome || "");
      formData.append("tipo", tipo || "");
      formData.append("conexao", conexao || "");
      formData.append("implante_info", implanteInfo || "");
      formData.append("comentarios", comentarios || "");
      formData.append("link", link || "");

      // Novos campos
      formData.append("dente", dente || "");
      formData.append("material", material || "");
      formData.append("vita_shade", vitaShade || "");
      formData.append("standard_shade", standardShade || "");

      // Arquivos (match backend: keys like foto_frontal, foto_escala, arquivos)
      if (fotoFrontalRef.current && fotoFrontalRef.current.files.length > 0) {
        formData.append("foto_frontal", fotoFrontalRef.current.files[0]);
      }
      if (fotoEscalaRef.current && fotoEscalaRef.current.files.length > 0) {
        formData.append("foto_escala", fotoEscalaRef.current.files[0]);
      }
      if (arquivosRef.current && arquivosRef.current.files.length > 0) {
        // envie múltiplos arquivos; backend lida com arrays
        const files = arquivosRef.current.files;
        for (let i = 0; i < files.length; i++) {
          // a backend pode aceitar um campo 'arquivos' repetido
          formData.append("arquivos", files[i]);
        }
      }

      // POST para API existente
      const res = await fetch("/api/send-scan", {
        method: "POST",
        body: formData,
      });

      const data = await res.json().catch(() => ({}));

      if (res.ok) {
        setStatusMsg("Enviado com sucesso ✅");
        // limpa inputs de arquivo (opcional)
        if (fotoFrontalRef.current) fotoFrontalRef.current.value = "";
        if (fotoEscalaRef.current) fotoEscalaRef.current.value = "";
        if (arquivosRef.current) arquivosRef.current.value = "";
      } else {
        setStatusMsg(
          data && data.error ? `Erro: ${data.error}` : "Erro ao enviar formulário"
        );
      }
    } catch (err) {
      console.error("submit error", err);
      setStatusMsg("Erro ao enviar formulário (ver console).");
    } finally {
      setSending(false);
    }
  }

  // opções de materiais e shades (exemplos comuns)
  const materialOptions = [
    "Zircônia",
    "E.max",
    "Resina (carga em cerâmica)",
    "Provisório",
  ];

  const vitaShades = [
    "", "BL1", "BL2", "A1", "A2", "A3", "A3.5", "A4", "B1", "B2", "B3", "C1", "D2"
  ];

  const standardShades = [
    "", "1", "2", "3", "4", "5", "A", "B", "C", "D"
  ];

  // estilos inline mínimos para não alterar sua estética atual (você pode manter CSS externo)
  const styles = {
    container: { maxWidth: 760, margin: "24px auto", padding: "0 20px", fontFamily: "Georgia, serif" },
    label: { display: "block", fontWeight: 700, marginTop: 18, marginBottom: 6 },
    input: { width: "100%", padding: "6px 8px", border: "1px solid #999", borderRadius: 2 },
    select: { width: "100%", padding: "6px 8px", border: "1px solid #999", borderRadius: 2 },
    smallInputRow: { display: "flex", gap: 12 },
    fileRow: { display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" },
    odontogramGrid: { display: "grid", gridTemplateColumns: "repeat(8, 1fr)", gap: 6, marginTop: 8 },
    toothBtn: (selected) => ({
      padding: 6,
      border: "1px solid #999",
      borderRadius: 4,
      cursor: "pointer",
      textAlign: "center",
      background: selected ? "#f4a261" : "white",
      color: selected ? "white" : "black",
      userSelect: "none",
    }),
    submitBtn: { marginTop: 18, padding: "8px 14px", background: "#e67e22", color: "white", border: "none", borderRadius: 4, cursor: "pointer" },
    status: { marginTop: 12, color: statusMsg && statusMsg.includes("Erro") ? "crimson" : "green" }
  };

  return (
    <div style={styles.container}>
      <h1 style={{ fontSize: 34 }}>Formulário de Escaneamento</h1>

      <form onSubmit={handleSubmit} encType="multipart/form-data">
        <label style={styles.label}>Cirurgião Dentista</label>
        <div style={styles.smallInputRow}>
          <input
            style={{ ...styles.input, flex: 1 }}
            placeholder="Nome"
            value={cirurgiaNome}
            onChange={(e) => setCirurgiaNome(e.target.value)}
            name="cirurgia_nome"
          />
          <input
            style={{ ...styles.input, flex: 1 }}
            placeholder="Sobrenome"
            value={cirurgiaSobrenome}
            onChange={(e) => setCirurgiaSobrenome(e.target.value)}
            name="cirurgia_sobrenome"
          />
        </div>

        <label style={styles.label}>Paciente</label>
        <div style={styles.smallInputRow}>
          <input
            style={{ ...styles.input, flex: 1 }}
            placeholder="Nome"
            value={pacienteNome}
            onChange={(e) => setPacienteNome(e.target.value)}
            name="paciente_nome"
          />
          <input
            style={{ ...styles.input, flex: 1 }}
            placeholder="Sobrenome"
            value={pacienteSobrenome}
            onChange={(e) => setPacienteSobrenome(e.target.value)}
            name="paciente_sobrenome"
          />
        </div>

        <label style={styles.label}>Tipo de escaneamento</label>
        <select style={styles.select} value={tipo} onChange={(e) => setTipo(e.target.value)} name="tipo">
          <option>Escaneamento sobre dente</option>
          <option>Escaneamento de arco completo</option>
          <option>Escaneamento de meia-arcada</option>
        </select>

        <label style={styles.label}>Conexão implante ou pilar</label>
        <select style={styles.select} value={conexao} onChange={(e) => setConexao(e.target.value)} name="conexao">
          <option>HI Neodent</option>
          <option>HE Neodent</option>
          <option>Neodent Pilar custom</option>
          <option>Outro</option>
        </select>

        <label style={styles.label}>Escolha do dente (odontograma) — clique para selecionar</label>
        <div style={styles.odontogramGrid}>
          {odontograma.map((t) => (
            <div
              key={t}
              role="button"
              tabIndex={0}
              onClick={() => toggleDenteSelection(t)}
              onKeyDown={(e) => (e.key === "Enter" ? toggleDenteSelection(t) : null)}
              style={styles.toothBtn(dente === t)}
              title={`Dente ${t}`}
            >
              {t}
            </div>
          ))}
        </div>
        <input type="hidden" name="dente" value={dente} />

        <label style={styles.label}>Material a ser feito</label>
        <select style={styles.select} value={material} onChange={(e) => setMaterial(e.target.value)} name="material">
          {materialOptions.map((m) => <option key={m} value={m}>{m}</option>)}
        </select>

        <label style={styles.label}>Escala de cores — VITA 3D</label>
        <select style={styles.select} value={vitaShade} onChange={(e) => setVitaShade(e.target.value)} name="vita_shade">
          {vitaShades.map(s => <option key={s} value={s}>{s || "Selecionar"}</option>)}
        </select>

        <label style={styles.label}>Escala de cores — padrão (A/B/C/D)</label>
        <select style={styles.select} value={standardShade} onChange={(e) => setStandardShade(e.target.value)} name="standard_shade">
          {standardShades.map(s => <option key={s} value={s}>{s || "Selecionar"}</option>)}
        </select>

        <label style={styles.label}>Informar elementos sobre o implante / observações</label>
        <input
          style={styles.input}
          placeholder="ex: diâmetro 3.5, comprimento 10mm, posição 23"
          value={implanteInfo}
          onChange={(e) => setImplanteInfo(e.target.value)}
          name="implante_info"
        />

        <label style={styles.label}>Fotos obrigatórias (frontal, escala de cor)</label>
        <div style={styles.fileRow}>
          <div>
            <input type="file" accept="image/*" ref={fotoFrontalRef} name="foto_frontal" />
            <div style={{ fontSize: 12 }}>Foto frontal (sorriso)</div>
          </div>
          <div>
            <input type="file" accept="image/*" ref={fotoEscalaRef} name="foto_escala" />
            <div style={{ fontSize: 12 }}>Foto com escala de cor</div>
          </div>
        </div>

        <label style={styles.label}>Arquivos adicionais (STL, PDF, imagens)</label>
        <input type="file" multiple ref={arquivosRef} name="arquivos" style={{ marginTop: 8 }} />

        <label style={styles.label}>Comentários adicionais e link escaneamento</label>
        <textarea
          rows={4}
          style={{ ...styles.input, height: 100 }}
          value={comentarios}
          onChange={(e) => setComentarios(e.target.value)}
          name="comentarios"
        />

        <label style={styles.label}>Link do escaneamento (opcional)</label>
        <input
          style={styles.input}
          value={link}
          onChange={(e) => setLink(e.target.value)}
          placeholder="https://..."
          name="link"
        />

        <button style={styles.submitBtn} type="submit" disabled={sending}>
          {sending ? "Enviando..." : "Enviar"}
        </button>

        {statusMsg && <div style={styles.status}>{statusMsg}</div>}
      </form>
    </div>
  );
}

