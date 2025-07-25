// src/App.tsx

import React, { useEffect, useState } from 'react';

const API_URL = import.meta.env.VITE_API_URL;

// Tipos básicos
interface Audience {
  id: number;
  name: string;
  contacts: any[];
  fields: string[];
}
interface Template {
  id: number;
  name: string;
  variables: string[];
}

export function App() { // <- MUDANÇA PRINCIPAL AQUI
  // States principais
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Dados
  const [audiences, setAudiences] = useState<Audience[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);

  // Formulário
  const [campaignName, setCampaignName] = useState('');
  const [selectedListId, setSelectedListId] = useState('');
  const [selectedTemplateId, setSelectedTemplateId] = useState('');
  const [variableMapping, setVariableMapping] = useState<{ [key: string]: string }>({});
  const [scheduleOption, setScheduleOption] = useState('now');
  const [scheduledAt, setScheduledAt] = useState('');
  const [messageInterval, setMessageInterval] = useState('medium');

  // Carregar listas e templates
  useEffect(() => {
    setLoading(true);
    Promise.all([
      fetch(`${API_URL}/audiences`).then(r => r.json()),
      fetch(`${API_URL}/templates`).then(r => r.json()),
    ])
      .then(([aud, temp]) => {
        setAudiences(aud);
        setTemplates(temp);
        setLoading(false);
      })
      .catch(() => {
        setError('Erro ao carregar dados.');
        setLoading(false);
      });
  }, []);

  // Helpers
  const selectedList = audiences.find(a => a.id === Number(selectedListId));
  const selectedTemplate = templates.find(t => t.id === Number(selectedTemplateId));

  // Navegação
  const next = () => setStep(s => Math.min(s + 1, 5));
  const prev = () => setStep(s => Math.max(s - 1, 1));

  // Envio final
  const handleLaunch = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_URL}/campaigns`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: campaignName,
          audienceId: Number(selectedListId),
          templateId: Number(selectedTemplateId),
          variableMapping,
          scheduleOption,
          scheduledAt: scheduleOption === 'later' ? scheduledAt : null,
          messageInterval,
        }),
      });
      if (!res.ok) throw new Error('Erro ao criar campanha');
      alert('Campanha criada com sucesso!');
      setStep(1);
      setCampaignName('');
      setSelectedListId('');
      setSelectedTemplateId('');
      setVariableMapping({});
      setScheduleOption('now');
      setScheduledAt('');
      setMessageInterval('medium');
    } catch (e) {
      setError('Erro ao criar campanha.');
    } finally {
      setLoading(false);
    }
  };

  // Renderização dos passos
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-800 via-gray-900 to-black">
      <div className="w-full max-w-2xl bg-white/10 rounded-xl shadow-2xl p-8">
        <h1 className="text-2xl font-bold text-white mb-2">Criar Nova Campanha</h1>
        <p className="text-gray-300 mb-6">Passo {step} de 5</p>
        {error && <div className="bg-red-500 text-white p-2 rounded mb-4">{error}</div>}
        {loading && <div className="text-white">Carregando...</div>}
        {!loading && step === 1 && (
          <div className="space-y-4">
            <label className="text-white">Nome da Campanha</label>
            <input className="w-full p-2 rounded bg-slate-800 text-white border border-slate-600" value={campaignName} onChange={e => setCampaignName(e.target.value)} />
          </div>
        )}
        {!loading && step === 2 && (
          <div className="space-y-4">
            <label className="text-white">Selecione a Lista de Contatos</label>
            <select className="w-full p-2 rounded bg-slate-800 text-white border border-slate-600" value={selectedListId} onChange={e => setSelectedListId(e.target.value)}>
              <option value="">Escolha uma lista...</option>
              {audiences.map(a => <option key={a.id} value={a.id}>{a.name} ({a.contacts?.length || 0} contatos)</option>)}
            </select>
          </div>
        )}
        {!loading && step === 3 && (
          <div className="space-y-4">
            <label className="text-white">Selecione o Modelo de Mensagem</label>
            <select className="w-full p-2 rounded bg-slate-800 text-white border border-slate-600" value={selectedTemplateId} onChange={e => {
              setSelectedTemplateId(e.target.value);
              const t = templates.find(t => t.id === Number(e.target.value));
              if (t) {
                const mapping: { [key: string]: string } = {};
                t.variables.forEach(v => { mapping[v] = ''; });
                setVariableMapping(mapping);
              }
            }}>
              <option value="">Escolha um template...</option>
              {templates.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
            {selectedTemplate && selectedTemplate.variables.length > 0 && (
              <div className="mt-4">
                <label className="text-white">Variáveis do Template:</label>
                <ul className="mt-2 space-y-2">
                  {selectedTemplate.variables.map((v, i) => (
                    <li key={v} className="flex items-center gap-2">
                      <span className="inline-block w-6 h-6 rounded-full bg-green-600 text-white flex items-center justify-center font-bold text-xs">{i + 1}</span>
                      <span className="text-sm text-gray-300">{v}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
        {!loading && step === 4 && selectedTemplate && selectedList && (
          <div className="space-y-4">
            <label className="text-white">Mapeie as Variáveis</label>
            {selectedTemplate.variables.map(variable => (
              <div key={variable} className="flex items-center gap-2 mb-2">
                <span className="text-gray-300 w-32">{variable}</span>
                <select className="flex-1 p-2 rounded bg-slate-700 text-white border border-slate-600" value={variableMapping[variable] || ''} onChange={e => setVariableMapping(vm => ({ ...vm, [variable]: e.target.value }))}>
                  <option value="">Selecione um campo...</option>
                  {selectedList.fields.map(field => <option key={field} value={field}>{field}</option>)}
                </select>
              </div>
            ))}
          </div>
        )}
        {!loading && step === 5 && (
          <div className="space-y-6">
            <div>
              <label className="text-white">Quando enviar?</label>
              <select className="w-full p-2 rounded bg-slate-800 text-white border border-slate-600 mt-2" value={scheduleOption} onChange={e => setScheduleOption(e.target.value)}>
                <option value="now">Enviar Imediatamente</option>
                <option value="later">Agendar para Depois</option>
              </select>
              {scheduleOption === 'later' && (
                <input type="datetime-local" className="w-full p-2 rounded bg-slate-800 text-white border border-slate-600 mt-2" value={scheduledAt} onChange={e => setScheduledAt(e.target.value)} />
              )}
            </div>
            <div>
              <label className="text-white">Intervalo entre mensagens</label>
              <select className="w-full p-2 rounded bg-slate-800 text-white border border-slate-600 mt-2" value={messageInterval} onChange={e => setMessageInterval(e.target.value)}>
                <option value="slow">Lento (1 mensagem / 60-90s)</option>
                <option value="medium">Médio (1 mensagem / 30-60s)</option>
                <option value="fast">Rápido (1 mensagem / 5-10s)</option>
              </select>
            </div>
          </div>
        )}
        <div className="flex justify-between mt-8">
          <button className="px-4 py-2 rounded bg-slate-700 text-white disabled:opacity-50" onClick={prev} disabled={step === 1 || loading}>Anterior</button>
          {step < 5 ? (
            <button className="px-4 py-2 rounded bg-green-600 text-white disabled:opacity-50" onClick={next} disabled={loading || (step === 1 && !campaignName) || (step === 2 && !selectedListId) || (step === 3 && !selectedTemplateId)}>Próximo</button>
          ) : (
            <button className="px-4 py-2 rounded bg-green-600 text-white disabled:opacity-50" onClick={handleLaunch} disabled={loading}>Lançar Campanha</button>
          )}
        </div>
      </div>
    </div>
  );
}