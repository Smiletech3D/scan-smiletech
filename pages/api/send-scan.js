// pages/new-scan.jsx
import { useState } from "react";

export default function NewScan() {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);

  async function handleSubmit(e) {
    e.preventDefault();
    setMessage(null);
    setLoading(true);

    const form = e.currentTarget;
    const formData = new FormData(form);

    try {
      const resp = await fetch("/api/send-scan", {
        method: "POST",
        body: formData, // multipart/form-data automatically
      });

      const data = await resp.json();
      if (resp.ok) {
        setMessage({ type: "success", text: "Enviado com sucesso!" });
        form.reset();
      } else {
        setMessage({
          type: "error",
          text:
            (data && data.error) ||
            `Erro no envio (${resp.status}). Veja console para detalhes.`,
        });
        console.error("Resposta do servidor:", data);
      }
    } catch (err) {
      console.error(err);
      setMessage({ type: "error", text: `Erro de rede: ${String(err)}` });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ maxWidth: 920, margin: "24px auto", fontFamily: "serif" }}>
      <h1>Formulário de Escaneamento</h1>

      <form onSubmit={handleSubmit} encType="multipart/form-data">
        <fieldset style={{ marginBottom: 16 }}>
          <legend>Dados do cirurgião</legend>
          <label>
            Nome (primeiro):
            <input name="cirurgiao_nome" type="text" />
          </label>
          <br />
          <label>
            Sobrenome:
            <input name="cirurgiao_sobrenome" type="text" />
          </label>
        </fieldset>

        <fieldset style={{ marginBottom: 16 }}>
          <legend>Dados do paciente</legend>
          <label>
            Nome (primeiro):
            <input name="paciente_nome" type="text" />
          </label>
          <br />
          <label>
            Sobrenome:
            <input name="paciente_sobrenome" type="text" />
          </label>
        </fieldset>

        <fieldset style={{ marginBottom: 16 }}>
          <legend>Escaneamento</legend>

          <label>
            Tipo de escaneamento:
            <select name="tipo_escaneamento" defaultValue="">
              <option value="" disabled>
                Selecione...
              </option>
              <option value="escaneamento_sobre_dente">
                Escaneamento sobre dente
              </option>
              <option value="escaneamento_sobre_pilar">
                Escaneamento sobre pilar
              </option>
              <option value="escaneamento_modelo">Escaneamento de modelo</option>
              <option value="escaneamento_intraoral">
                Escaneamento intraoral
              </option>
              <option value="escaneamento_interno">Escaneamento interno</option>
            </select>
          </label>
          <br />

          <label>
            Escolha conexão implante ou pilar:
            <select name="conexao_implante" defaultValue="">
              <option value="" disabled>
                Selecione a conexão...
              </option>
              <option value="HE_5_0_Neodent">HE 5.0 Neodent</option>
              <option value="conexao_externa">Conexão externa</option>
              <option value="conexao_interna">Conexão interna</option>
              <option value="pilar_personalizado">Pilar personalizado</option>
              <option value="pilar_stock">Pilar stock</option>
              <option value="conexao_custom">Outra / custom</option>
            </select>
          </label>
          <br />

          <label>
            Informar elementos sobre o implante:
            <input name="implante_info" type="text" />
          </label>
        </fieldset>

        <fieldset style={{ marginBottom: 16 }}>
          <legend>Arquivos (imagens, STL, PDF)</legend>

          <label>
            Foto frontal (sorriso) *
            <input name="foto_frontal" type="file" accept="image/*" />
          </label>
          <br />
          <label>
            Foto com escala de cor *
            <input name="foto_escala" type="file" accept="image/*" />
          </label>
          <br />
          <label>
            Arquivos (fotos, STL, PDF) — múltiplos
            <input name="arquivos" type="file" multiple />
          </label>
        </fieldset>

        <fieldset style={{ marginBottom: 16 }}>
          <legend>Outros</legend>
          <label>
            Comentários adicionais e link escaneamento:
            <textarea name="comentarios" rows="4" />
          </label>
          <br />
          <label>
            Link do escaneamento (opcional)
            <input name="link_escaneamento" type="url" placeholder="https://..." />
          </label>
        </fieldset>

        <div style={{ marginTop: 16 }}>
          <button type="submit" disabled={loading}>
            {loading ? "Enviando..." : "Enviar"}
          </button>
        </div>

        {message && (
          <div
            role="status"
            style={{
              marginTop: 12,
              color: message.type === "error" ? "crimson" : "green",
            }}
          >
            {message.text}
          </div>
        )}
      </form>

      <p style={{ color: "#666", marginTop: 20 }}>
        Observações:
        <br />
        • Os <strong>names</strong> do formulário estão alinhados com o servidor:
        <code>cirurgiao_nome</code>, <code>cirurgiao_sobrenome</code>,{" "}
        <code>paciente_nome</code>, <code>paciente_sobrenome</code>,{" "}
        <code>tipo_escaneamento</code>, <code>conexao_implante</code>,{" "}
        <code>implante_info</code>, <code>comentarios</code>,{" "}
        <code>link_escaneamento</code>, e inputs de arquivos:
        <code>foto_frontal</code>, <code>foto_escala</code>, <code>arquivos</code>.
      </p>
    </div>
  );
}
