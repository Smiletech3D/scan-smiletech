import { useState, useRef } from "react";

export default function NewScan() {
  const [status, setStatus] = useState("");
  const [sending, setSending] = useState(false);
  const formRef = useRef();

  async function handleSubmit(e) {
    e.preventDefault();
    setSending(true);
    setStatus("");

    const formElem = formRef.current;
    const fd = new FormData(formElem);

    try {
      const res = await fetch("/api/send-scan", {
        method: "POST",
        body: fd
      });

      const data = await res.json();
      if (res.ok) {
        setStatus("Enviado com sucesso!");
        formElem.reset();
      } else {
        setStatus(data?.error || "Erro ao enviar");
      }
    } catch (err) {
      setStatus(err.message || "Erro de rede");
    } finally {
      setSending(false);
    }
  }

  return (
    <div style={{ maxWidth: 760, margin: "24px auto", padding: 24 }}>
      <h1>Formulário de Escaneamento</h1>
      <form ref={formRef} onSubmit={handleSubmit} encType="multipart/form-data">
        <label>Nome do Cirurgião Dentista</label><br/>
        <input name="dentistName" placeholder="Nome" style={{width:"48%", marginRight:8}}/>
        <input name="dentistLast" placeholder="Sobrenome" style={{width:"48%"}}/>
        <br/><br/>

        <label>Nome do Paciente</label><br/>
        <input name="patientName" placeholder="Nome" style={{width:"48%", marginRight:8}}/>
        <input name="patientLast" placeholder="Sobrenome" style={{width:"48%"}}/>
        <br/><br/>

        <label>Tipo de escaneamento</label><br/>
        <select name="scanType" defaultValue="">
          <option value="">Selecione:</option>
          <option value="Escaneamento sobre dente">Escaneamento sobre dente</option>
          <option value="Escaneamento sobre implantes">Escaneamento sobre implantes</option>
        </select>
        <br/><br/>

        <label>Escolha conexão implante ou pilar</label><br/>
        <select name="connection" defaultValue="">
          <option value="">Selecione:</option>
          <option value="HE 5.0 Neodent">HE 5.0 Neodent</option>
          <option value="Cone Morse Neodent">Cone Morse Neodent</option>
        </select>
        <br/><br/>

        <label>Informar elementos sobre o implante</label><br/>
        <input name="implantInfo" placeholder="Ex.: marca, diâmetro, altura" style={{width:"100%"}}/>
        <br/><br/>

        <label>Foto frontal (sorriso) *</label><br/>
        <input type="file" name="frontPhoto" accept="image/*" />
        <br/><br/>

        <label>Foto com escala de cor *</label><br/>
        <input type="file" name="colorPhoto" accept="image/*" />
        <br/><br/>

        <label>Arquivos (fotos, STL, PDF) — múltiplos</label><br/>
        <input type="file" name="attachments" multiple />
        <br/><br/>

        <label>Comentários adicionais e link escaneamento</label><br/>
        <textarea name="comments" rows="4" style={{width:"100%"}} placeholder="Digite aqui"></textarea>
        <br/><br/>

        <label>Link do escaneamento (opcional)</label><br/>
        <input name="link" style={{width:"100%"}} placeholder="https://..." />
        <br/><br/>

        <button type="submit" disabled={sending} style={{padding:"10px 18px", background:"#f49d4f", border:"none", color:"#fff"}}>
          {sending ? "Enviando..." : "Enviar"}
        </button>

        <div style={{marginTop:12}}>
          {status && <span>{status}</span>}
        </div>
      </form>
    </div>
  );
}
