// pages/new-scan.jsx
import { useState } from "react";

export default function NewScan() {
  const [status, setStatus] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    setStatus("Enviando...");

    const formData = new FormData(e.target);

    try {
      const res = await fetch("/api/send-scan", {
        method: "POST",
        body: formData,
      });

      const text = await res.text(); // ⚠️ NÃO JSON

      if (!res.ok) {
        console.error(text);
        setStatus("Erro ao enviar formulário");
        return;
      }

      setStatus("Formulário enviado com sucesso!");
      e.target.reset();
    } catch (err) {
      console.error(err);
      setStatus("Erro de rede ao enviar");
    }
  }

  return (
    <div style={{ maxWidth: 900, margin: "40px auto", fontFamily: "serif" }}>
      <h1>Formulário de Escaneamento</h1>

      <form onSubmit={handleSubmit} encType="multipart/form-data">
        <h3>Cirurgião Dentista</h3>
        <input name="cirurgiao_nome" placeholder="Nome" required />
        <input name="cirurgiao_sobrenome" placeholder="Sobrenome" required />

        <h3>Paciente</h3>
        <input name="paciente_nome" placeholder="Nome" required />
        <input name="paciente_sobrenome" placeholder="Sobrenome" required />

        <h3>Tipo de escaneamento</h3>
        <select name="tipo_escaneamento" required>
          <option value="">Selecione</option>
          <option value="Escaneamento sobre dente">Escaneamento sobre dente</option>
          <option value="Escaneamento sobre implante">Escaneamento sobre implante</option>
          <option value="Escaneamento de modelo">Escaneamento de modelo</option>
        </select>

        <h3>Conexão implante ou pilar</h3>
        <select name="conexao_implante" required>
          <option value="">Selecione</option>
          <option value="HE 5.0 Neodent">HE 5.0 Neodent</option>
          <option value="HI Neodent">HI Neodent</option>
          <option value="Cone Morse">Cone Morse</option>
          <option value="Outro">Outro</option>
        </select>

        <h3>Informações do implante</h3>
        <input name="implante_info" />

        <h3>Fotos obrigatórias</h3>
        <input type="file" name="foto_frontal" required />
        <input type="file" name="foto_escala" required />

        <h3>Arquivos adicionais (STL, PDF, imagens)</h3>
        <input type="file" name="arquivos" multiple />

        <h3>Comentários</h3>
        <textarea name="comentarios" />

        <h3>Link do escaneamento</h3>
        <input name="link_escaneamento" type="url" />

        <br /><br />
        <button type="submit">Enviar</button>
      </form>

      <p>{status}</p>
    </div>
  );
}
