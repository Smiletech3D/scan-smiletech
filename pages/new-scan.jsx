import { useState, useRef } from "react";
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
      console.error("Send error:", err);
      setStatus("Erro de rede");
    } finally {
      setSending(false);
    }
  }

  // Simple helper to toggle selection for teeth and vita colors
  function toggleValueInput(containerName, value) {
  const btn = document.querySelector(`button[data-btn="${containerName}"]`);
  if (!btn) return;
  btn.classList.toggle("selected");
}
    // containerName: 'dentes' or 'cores_vita'
    const input = formRef.current.querySelector(`input[name="${containerName}[]"]`);
    // We'll use a simple hidden multi-value approach: create inputs per selection
    // (the form uses real hidden inputs appended to the form)
    const existing = Array.from(formRef.current.querySelectorAll(`input[type="hidden"][data-field="${containerName}"]`));
    const found = existing.find(i => i.value === value);
    if (found) {
      found.remove();
    } else {
      const el = document.createElement("input");
      el.type = "hidden";
      el.name = `${containerName}[]`;
      el.value = value;
      el.setAttribute("data-field", containerName);
      formRef.current.appendChild(el);
    }

    // For visual feedback, toggle button class
    const btn = document.querySelector(`button[data-btn-${containerName}="${value}"]`);
    if (btn) btn.classList.toggle("selected");
  }

  *** Begin Patch
*** Update File: pages/new-scan.jsx
@@
   return (
     <div className="page">
       <div className="card">
         <div className="logo-row">
-          {/* Se quiser, coloque sua logo em public/logo.png e use <img src="/logo.png" /> */}
+          {/* Se quiser, coloque sua logo em public/logo.png e use <img src="/logo.png" /> */}
           <h1>Formulário de Escaneamento</h1>
         </div>
 
         <form ref={formRef} onSubmit={handleSubmit} className="scan-form" encType="multipart/form-data">
@@
-          <div className="form-actions">
  <button type="submit" disabled={sending}>
    {sending ? "Enviando..." : "Enviar"}
  </button>
  <div className="status">{status}</div>
</div>
+          <div className="form-actions">
+            <button type="submit" disabled={sending}>
+              {sending ? "Enviando..." : "Enviar"}
+            </button>
+            <div className="status">{status}</div>
+          </div>
 
         </form>
       </div>
     </div>
   );
 }
*** End Patch

          <div className="form-group">
            <label>Cirurgião Dentista</label>
            <input name="cirurgia_nome" placeholder="Nome" />
            <input name="cirurgia_sobrenome" placeholder="Sobrenome" />
          </div>

          <div className="form-group">
            <label>Paciente</label>
            <input name="paciente_nome" placeholder="Nome" />
            <input name="paciente_sobrenome" placeholder="Sobrenome" />
          </div>

          <div className="form-group">
            <label>Tipo de escaneamento</label>
            <select name="tipo">
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
          </div>

          <div className="form-group">
            <label>Conexão implante ou pilar</label>
            <select name="conexao">
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
          </div>

          <div className="form-group">
            <label>Informar elementos sobre o implante / observações</label>
            <input name="implante_info" placeholder="ex: diâmetro 3.5, comprimento 10mm, posição 23" />
          </div>

          {/* ======= Escolha do(s) dente(s) (odontograma clicável) ======= */}
          <div className="form-group">
            <label>Escolha do(s) dente(s) — selecione um ou mais</label>
            <div className="teeth-grid" role="group" aria-label="Dentes">
              {["18","17","16","15","14","13","12","11","21","22","23","24","25","26","27","28","48","47","46","45","44","43","42","41","31","32","33","34","35","36","37","38"].map(d => (
                <button
                  key={d}
                  type="button"
                  data-btn-dentes={d}
                  className="teeth-btn"
                  onClick={() => toggleValueInput("dentes", d)}
                >
                  {d}
                </button>
              ))}
            </div>
            <small>Clique em um dente para selecionar/remover. Os dentes selecionados serão enviados no campo dentes[].</small>
          </div>

          {/* ======= Material ======= */}
          <div className="form-group">
            <label>Material a ser feito</label>
            <select name="material">
              <option>Zircônia</option>
              <option>Emax</option>
              <option>Resina (carga em cerâmica)</option>
              <option>Provisório</option>
            </select>
          </div>

          {/* ======= Escala de cores (VITA) multi-select clicável ======= */}
          <div className="form-group">
            <label>Escala de cores (VITA) — selecione uma ou mais</label>
            <div className="vita-grid">
              {["BL1","BL2","BL3","BL4","A1","A2","A3","A3.5","A4","B1","B2","B3","B4","C1","C2","C3","C4","D2","D3","D4"].map(c => (
                <button
                  key={c}
                  type="button"
                  data-btn-cores_vita={c}
                  className="vita-btn"
                  onClick={() => toggleValueInput("cores_vita", c)}
                >
                  {c}
                </button>
              ))}
            </div>
            <small>As opções escolhidas serão enviadas em cores_vita[].</small>
          </div>

          {/* Files */}
          <div className="form-group">
            <label>Fotos obrigatórias (frontal)</label>
            <input type="file" name="foto_frontal" accept="image/*" />
          </div>

          <div className="form-group">
            <label>Foto com escala de cor (opcional)</label>
            <input type="file" name="foto_escala" accept="image/*" />
          </div>

          <div className="form-group">
            <label>Arquivos adicionais (STL, PDF, imagens) — múltiplos</label>
            <input type="file" name="arquivos" multiple />
          </div>

          <div className="form-group">
            <label>Comentários adicionais</label>
            <textarea name="comentarios" rows="4" />
          </div>

          <div className="form-group">
            <label>Link do escaneamento (opcional)</label>
            <input name="link" placeholder="https://..." />
          </div>

          <div className="form-actions">
            <button type="submit" disabled={sending}>
              {sending ? "Enviando..." : "Enviar"}
            </button>
            <div className="status">{status}</div>
          </div>
        </form>
      </div>
    </div>
  );
}
