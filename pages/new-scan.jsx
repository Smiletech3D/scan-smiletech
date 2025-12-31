import { useState, useRef } from "react";
import Image from "next/image";
import "../styles/new-scan.css";

export default function NewScan() {
  const [status, setStatus] = useState("");
  const [sending, setSending] = useState(false);
  const formRef = useRef(null);

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

      if (!res.ok) {
        setStatus(data.error || "Erro ao enviar");
      } else {
        setStatus("Enviado com sucesso ✅");
        formRef.current.reset();
      }
    } catch (err) {
      setStatus("Erro de rede");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="page">
      <div className="card">
        <div className="logo">
          <Image src="/logo.png" alt="SmileTech 3D" width={220} height={60} />
        </div>

        <h1>Formulário de OS/SCAN</h1>

        <form ref={formRef} onSubmit={handleSubmit} encType="multipart/form-data">
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

          <h3>Tipo de escaneamento</h3>
          <select name="tipo" required>
            <option value="">Selecione</option>
            <option>Escaneamento sobre dente</option>
            <option>Escaneamento de arco completo</option>
            <option>Escaneamento arcada superior</option>
            <option>Escaneamento arcada inferior</option>
            <option>Escaneamento parcial (quadrante)</option>
            <option>Escaneamento de modelo</option>
            <option>Escaneamento de prótese</option>
            <option>Escaneamento para planejamento cirúrgico</option>
            <option>Outro</option>
          </select>

          <h3>Conexão implante ou pilar</h3>
          <select name="conexao" required>
            <option value="">Selecione</option>
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
            <option>Pilar de cicatrização</option>
            <option>Pilar anatômico</option>
            <option>Outro</option>
          </select>

          <h3>Informações do implante / observações</h3>
          <input
            name="implante_info"
            placeholder="ex: diâmetro 3.5, comprimento 10mm, posição 23"
          />

          <h3>Fotos obrigatórias (frontal + escala de cor)</h3>
          <input type="file" name="foto_frontal" accept="image/*" required />
          <input type="file" name="foto_cor" accept="image/*" required />

          <h3>Arquivos complementares (STL, PDF, imagens)</h3>
          <input type="file" name="arquivos" multiple />

          <h3>Comentários adicionais</h3>
          <textarea name="comentarios" rows="4" />

          <h3>Link do escaneamento (opcional)</h3>
          <input name="link" placeholder="https://..." />

          <button type="submit" disabled={sending}>
            {sending ? "Enviando..." : "Enviar"}
          </button>

          {status && <p className="status">{status}</p>}
        </form>
      </div>
    </div>
  );
}
