import { useRef, useState } from "react";
import "../styles/new-scan.css";

export default function NewScan() {
  const formRef = useRef(null);
  const [status, setStatus] = useState("");
  const [sending, setSending] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setSending(true);
    setStatus("");

    const formData = new FormData(formRef.current);

    try {
      const res = await fetch("/api/send-scan", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erro");
      setStatus("Enviado com sucesso ✅");
      formRef.current.reset();
    } catch (err) {
      console.error(err);
      setStatus("Erro ao enviar formulário");
    } finally {
      setSending(false);
    }
  }

  // tooth numbers (FDI) array
  const TEETH = [
    // upper right 18..11
    "18","17","16","15","14","13","12","11",
    // upper left 21..28
    "21","22","23","24","25","26","27","28",
    // lower left 48..41
    "48","47","46","45","44","43","42","41",
    // lower right 31..38
    "31","32","33","34","35","36","37","38",
  ];

  const VITA = [
    "A1","A2","A3","A3.5","A4",
    "B1","B2","B3","B4",
    "C1","C2","C3","C4",
    "D2","D3","D4",
    // 3D-master common conversions (include as options)
    "1M2","2M2","3M3","3R2.5","4L1.4","1M1","2L2.5","3L2.5","3M1","3L1.5","4L1.5","5M1","3M2","3M1/4L1.5"
  ];

  return (
    <div className="page">
      <h1>Formulário de Escaneamento</h1>

      <form ref={formRef} onSubmit={handleSubmit} className="scan-form">
        <h3>Cirurgião Dentista</h3>
        <div className="row">
          <input name="cirurgia_nome" placeholder="Nome" required />
          <input name="cirurgia_sobrenome" placeholder="Sobrenome" required />
        </div>

        <h3>Paciente</h3>
        <div className="row">
          <input name="paciente_nome" placeholder="Nome" required />
          <input name="paciente_sobrenome" placeholder="Sobrenome" required />
        </div>

        <label>Tipo de escaneamento</label>
        <select name="tipo" required>
          <option>Escaneamento sobre dente</option>
          <option>Escaneamento de arco completo</option>
          <option>Escaneamento arcada superior</option>
          <option>Escaneamento arcada inferior</option>
          <option>Escaneamento parcial (quadrante)</option>
          <option>Escaneamento de modelo</option>
          <option>Escaneamento para prótese</option>
          <option>Escaneamento para planejamento cirúrgico</option>
          <option>Outro</option>
        </select>

        <label>Conexão implante ou pilar</label>
        <select name="conexao" required>
          <option>HI Neodent</option>
          <option>HE Neodent</option>
          <option>Neodent Pilar custom</option>
          <option>Straumann (Internal)</option>
          <option>Straumann (External)</option>
          <option>Nobel Active</option>
          <option>Nobel Replace</option>
          <option>Astra Tech</option>
          <option>Ankylos</option>
          <option>Camlog</option>
          <option>Zimmer</option>
          <option>Hexagonal externo</option>
          <option>Hexagonal interno</option>
          <option>Morse Taper</option>
          <option>Conexão cônica generic</option>
          <option>Pilar de cicatrização</option>
          <option>Pilar anatômico</option>
          <option>Outro</option>
        </select>

        <label>Informar elementos sobre o implante / observações</label>
        <input name="implante_info" placeholder="ex: diâmetro 3.5, comprimento 10mm, posição 23" />

        {/* --- NOVOS CAMPOS: DENTES (multi), MATERIAL, VITA --- */}
        <label>Escolha o(s) dente(s) (seleção múltipla)</label>
        <div className="teeth-grid" role="group" aria-label="Seleção de dentes">
          {TEETH.map((t) => (
            <label key={t} className="tooth">
              <input type="checkbox" name="dentes" value={t} />
              <span>{t}</span>
            </label>
          ))}
        </div>

        <label>Material a ser feito</label>
        <select name="material">
          <option value="">-- selecione --</option>
          <option>Zircônia</option>
          <option>Emax</option>
          <option>Resina</option>
          <option>Carga em cerâmica</option>
          <option>Provisório</option>
        </select>

        <label>Escala de cores (VITA) — pode selecionar mais de uma</label>
        <div className="vita-grid" role="group" aria-label="Escala VITA">
          {VITA.map((v) => (
            <label key={v} className="vita">
              <input type="checkbox" name="vita" value={v} />
              <span>{v}</span>
            </label>
          ))}
        </div>

        <label>Fotos obrigatórias (frontal, escala de cor)</label>
        <input type="file" name="foto_frontal" required />
        <input type="file" name="foto_escala" required />

        <label>Arquivos complementares (STL, PDF, imagens) — múltiplos</label>
        <input type="file" name="arquivos" multiple />

        <label>Comentários adicionais e link do escaneamento</label>
        <textarea name="comentarios" />

        <label>Link do escaneamento (opcional)</label>
        <input name="link" placeholder="https://..." />

        <button type="submit" disabled={sending}>{sending ? "Enviando..." : "Enviar"}</button>
        {status && <p className="status">{status}</p>}
      </form>
    </div>
  );
}
