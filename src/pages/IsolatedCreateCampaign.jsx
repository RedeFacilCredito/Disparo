// ADICIONADO: Importação direta do CSS para evitar conflitos de DOM
import '../index.css'; 

import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, CheckCircle, Smartphone, Globe, Edit3, FileText } from 'lucide-react';

// Componentes de UI locais para manter o isolamento
const IFrameInput = ({ type = "text", value, onChange, placeholder, className = "", ...props }) => ( <input type={type} value={value} onChange={onChange} placeholder={placeholder} className={`flex h-10 w-full rounded-md border border-slate-600 bg-slate-800 px-3 py-2 text-sm text-white ring-offset-white file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-800 dark:bg-slate-950 dark:ring-offset-slate-950 dark:placeholder:text-slate-400 dark:focus-visible:ring-slate-300 ${className}`} {...props} /> );
const IFrameLabel = ({ children, className = "", ...props }) => ( <label className={`text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-white ${className}`} {...props} > {children} </label> );
const IFrameProgress = ({ value, className = "" }) => ( <div className={`relative h-4 w-full overflow-hidden rounded-full bg-slate-700 ${className}`}> <div className="h-full bg-green-500 transition-all duration-300" style={{ width: `${value || 0}%` }} /> </div> );

const steps = [
    { name: 'Informações Básicas', description: 'Defina o nome da campanha' },
    { name: 'Remetente', description: 'Escolha como enviar' },
    { name: 'Selecionar Lista', description: 'Escolha o público-alvo' },
    { name: 'Conteúdo da Mensagem', description: 'Selecione o template ou escreva' },
    { name: 'Mapear Variáveis', description: 'Configure as variáveis' },
    { name: 'Agendamento', description: 'Defina quando enviar' }
];

const IsolatedCreateCampaign = () => {
    // --- State Management ---
    const [currentStep, setCurrentStep] = useState(1);
    const [campaignName, setCampaignName] = useState('');
    const [senderType, setSenderType] = useState('GUPSHUP');
    const [selectedSenderId, setSelectedSenderId] = useState('');
    const [onlineSenders, setOnlineSenders] = useState([]);
    const [selectedListId, setSelectedListId] = useState('');
    const [selectedTemplateId, setSelectedTemplateId] = useState('');
    const [variableMapping, setVariableMapping] = useState({});
    const [scheduleOption, setScheduleOption] = useState('manual');
    const [scheduledAt, setScheduledAt] = useState('');
    const [messageInterval, setMessageInterval] = useState('medium');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [campaignLaunched, setCampaignLaunched] = useState(false);
    const [audiences, setAudiences] = useState([]);
    const [templates, setTemplates] = useState([]);
    const [token, setToken] = useState('');
    const [apiBaseUrl, setApiBaseUrl] = useState('');
    const [messageType, setMessageType] = useState('template');
    const [customMessage, setCustomMessage] = useState('');
    const [customVariables, setCustomVariables] = useState([]);

    // --- Pega Token e API URL dos parâmetros ---
    useEffect(() => {
        const urlParams = new URLSearchParams(window.location.search);
        const authToken = urlParams.get('token');
        const apiUrlFromParam = urlParams.get('apiUrl');
        if (authToken) setToken(authToken);
        if (apiUrlFromParam) setApiBaseUrl(decodeURIComponent(apiUrlFromParam));
    }, []);

    // --- Busca de Dados ---
    useEffect(() => {
        if (!token || !apiBaseUrl) return;
        const headers = { Authorization: `Bearer ${token}` };
        const fetchData = async (endpoint, setter) => {
            try {
                const response = await fetch(`${apiBaseUrl}/api/${endpoint}`, { headers });
                if(!response.ok) throw new Error(`Failed to fetch ${endpoint}`);
                const data = await response.json();
                setter(data);
            } catch (error) {
                console.error(`Error fetching ${endpoint}:`, error);
            }
        };
        fetchData('audiences', setAudiences);
        fetchData('templates', setTemplates);
        fetchData('senders/baileys-online', setOnlineSenders);
    }, [token, apiBaseUrl]);

    // --- Efeito para detectar variáveis na mensagem customizada ---
    useEffect(() => {
        const regex = /\{\{([^{}]+)\}\}/g;
        const matches = [...customMessage.matchAll(regex)];
        const uniqueVariables = [...new Set(matches.map(match => match[0]))];
        setCustomVariables(uniqueVariables);
    }, [customMessage]);

    // --- Lógica do Wizard ---
    const selectedListData = audiences?.find(a => a.id === parseInt(selectedListId, 10));
    const selectedTemplateData = templates?.find(t => t.id === parseInt(selectedTemplateId, 10));

    const handleNext = () => {
        if (currentStep < steps.length) {
            setCurrentStep(currentStep + 1);
        }
    };
    const handlePrev = () => {
        if (currentStep > 1) {
            setCurrentStep(currentStep - 1);
        }
    };
    
    const handleTemplateSelect = (templateId) => {
        setSelectedTemplateId(templateId);
        setVariableMapping({}); 
    };

    const handleVariableMap = (variable, field) => {
        setVariableMapping(prev => ({ ...prev, [variable]: field }));
    };

    // --- Lógica de Envio Final ---
    const handleLaunch = async () => {
        setIsSubmitting(true);
        try {
            const response = await fetch(`${apiBaseUrl}/api/campaigns`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}`},
                body: JSON.stringify({
                    name: campaignName,
                    audienceId: parseInt(selectedListId, 10),
                    templateId: messageType === 'template' ? parseInt(selectedTemplateId, 10) : null,
                    customMessageBody: messageType === 'custom' ? customMessage : null,
                    scheduleOption,
                    scheduledAt: scheduleOption === 'later' ? scheduledAt : null,
                    messageInterval,
                    variableMapping,
                    senderType, 
                    senderInstanceId: senderType === 'BAILEYS' ? selectedSenderId : null, 
                }),
            });

            if (response.ok) setCampaignLaunched(true);
            else {
                const errorData = await response.json();
                alert(`Erro ao criar campanha: ${errorData.error || 'Erro desconhecido'}`);
                setIsSubmitting(false);
            }
        } catch (error) {
            alert(`Erro de rede: ${error.message}`);
            setIsSubmitting(false);
        }
    };
    
    useEffect(() => {
        if (campaignLaunched) {
            window.parent.postMessage({ type: 'campaign-launched' }, '*');
        }
    }, [campaignLaunched]);

    const renderStepContent = () => {
        switch (currentStep) {
            case 1:
                return (
                    <div className="space-y-2">
                        <IFrameLabel htmlFor="campaignName">Nome da Campanha</IFrameLabel>
                        <IFrameInput id="campaignName" value={campaignName} onChange={(e) => setCampaignName(e.target.value)} placeholder="Ex: Promoção de Julho"/>
                    </div>
                );

            case 2:
                return (
                    <div className="space-y-4">
                        <IFrameLabel>Como você deseja enviar esta campanha?</IFrameLabel>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div onClick={() => setSenderType('GUPSHUP')} className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${senderType === 'GUPSHUP' ? 'border-green-500 bg-green-500/10' : 'border-slate-600 hover:border-slate-400'}`}>
                                <div className="flex items-center gap-3"><Globe className="w-6 h-6 text-green-400"/><div><h3 className="font-bold text-white">API Oficial (Gupshup)</h3><p className="text-xs text-gray-400">Maior segurança e ideal para conversas importantes.</p></div></div>
                            </div>
                            <div onClick={() => setSenderType('BAILEYS')} className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${senderType === 'BAILEYS' ? 'border-blue-500 bg-blue-500/10' : 'border-slate-600 hover:border-slate-400'}`}>
                                <div className="flex items-center gap-3"><Smartphone className="w-6 h-6 text-blue-400"/><div><h3 className="font-bold text-white">API Não-Oficial (Baileys)</h3><p className="text-xs text-gray-400">Flexível e ideal para disparos em massa.</p></div></div>
                            </div>
                        </div>
                        {senderType === 'BAILEYS' && (
                            <div className="space-y-2 pt-4">
                                <IFrameLabel htmlFor="senderId">Selecione o Número de Disparo</IFrameLabel>
                                <select id="senderId" className="block w-full h-10 border rounded-md px-3 py-2 text-sm bg-slate-800 border-slate-600 text-white" value={selectedSenderId} onChange={(e) => setSelectedSenderId(e.target.value)}>
                                    <option value="">Escolha um número online...</option>
                                    {onlineSenders.map(sender => (<option key={sender.id} value={sender.id}>{sender.instanceName} ({sender.whatsappNumber})</option>))}
                                </select>
                                {onlineSenders.length === 0 && <p className="text-xs text-yellow-400 pt-2">Nenhuma instância Baileys está conectada no momento.</p>}
                            </div>
                        )}
                    </div>
                );
            
            case 3:
                return (
                    <div className="space-y-2">
                        <IFrameLabel htmlFor="list">Selecione a Lista de Contatos</IFrameLabel>
                        <select id="list" className="block w-full h-10 border rounded-md px-3 py-2 text-sm bg-slate-800 border-slate-600 text-white" value={selectedListId} onChange={e => setSelectedListId(e.target.value)}>
                            <option value="">Escolha uma lista...</option>
                            {audiences.map(a => (<option key={a.id} value={a.id}>{a.name} ({a.contactCount} contatos)</option>))}
                        </select>
                    </div>
                );

            case 4:
                if (senderType === 'GUPSHUP') {
                    return (
                        <div className="space-y-2">
                            <IFrameLabel htmlFor="template">Selecione o Modelo de Mensagem</IFrameLabel>
                            <select id="template" className="block w-full h-10 border rounded-md px-3 py-2 text-sm bg-slate-800 border-slate-600 text-white" value={selectedTemplateId} onChange={e => handleTemplateSelect(e.target.value)}>
                                <option value="">Escolha um template...</option>
                                {templates.map(t => (<option key={t.id} value={t.id}>{t.name}</option>))}
                            </select>
                        </div>
                    );
                } else {
                    return (
                        <div className="space-y-4">
                            <IFrameLabel>Escolha o tipo de conteúdo:</IFrameLabel>
                            <div className="flex gap-4">
                                <div onClick={() => setMessageType('template')} className={`flex-1 p-4 rounded-lg border-2 cursor-pointer transition-all ${messageType === 'template' ? 'border-blue-500 bg-blue-500/10' : 'border-slate-600 hover:border-slate-400'}`}>
                                    <div className="flex items-center gap-3"><FileText className="w-6 h-6 text-blue-400"/><div><h3 className="font-bold text-white">Usar Template</h3><p className="text-xs text-gray-400">Use um modelo pré-aprovado.</p></div></div>
                                </div>
                                <div onClick={() => setMessageType('custom')} className={`flex-1 p-4 rounded-lg border-2 cursor-pointer transition-all ${messageType === 'custom' ? 'border-green-500 bg-green-500/10' : 'border-slate-600 hover:border-slate-400'}`}>
                                    <div className="flex items-center gap-3"><Edit3 className="w-6 h-6 text-green-400"/><div><h3 className="font-bold text-white">Mensagem Personalizada</h3><p className="text-xs text-gray-400">Escreva um texto livre agora.</p></div></div>
                                </div>
                            </div>
                            {messageType === 'template' && (
                                <div className="space-y-2 pt-4">
                                    <IFrameLabel htmlFor="template">Selecione o Modelo</IFrameLabel>
                                    <select id="template" className="block w-full h-10 border rounded-md px-3 py-2 text-sm bg-slate-800 border-slate-600 text-white" value={selectedTemplateId} onChange={e => handleTemplateSelect(e.target.value)}>
                                        <option value="">Escolha um template...</option>
                                        {templates.map(t => (<option key={t.id} value={t.id}>{t.name}</option>))}
                                    </select>
                                    <p className="text-xs text-yellow-400 pt-2">Lembrete: A API Não-Oficial não suporta templates com botões interativos.</p>
                                </div>
                            )}
                            {messageType === 'custom' && (
                                <div className="space-y-2 pt-4">
                                    <IFrameLabel htmlFor="customMessage">Digite sua mensagem</IFrameLabel>
                                    <textarea id="customMessage" rows="5" className="block w-full border rounded-md px-3 py-2 text-sm bg-slate-800 border-slate-600 text-white" value={customMessage} onChange={(e) => setCustomMessage(e.target.value)} placeholder="Olá, {{nome}}! Temos uma oferta especial para você..."></textarea>
                                    <p className="text-xs text-gray-400 pt-2">Você pode usar variáveis da sua lista de contatos, como {'`{{nome}}`'}.</p>
                                </div>
                            )}
                        </div>
                    );
                }

            case 5:
                const variablesToMap = messageType === 'template' 
                    ? selectedTemplateData?.variables || [] 
                    : customVariables;
                
                if (variablesToMap.length === 0) {
                    return (
                        <div className="text-center text-gray-400">
                            <p>Nenhuma variável {'`{{...}}`'} foi encontrada para mapear.</p>
                            <p className="text-xs mt-2">Você pode prosseguir para o próximo passo.</p>
                        </div>
                    );
                }

                return (
                    <div className="bg-slate-800/50 border border-slate-700 rounded-lg">
                        <div className="p-6 border-b border-slate-700"><h3 className="text-lg font-semibold text-white">Mapear Variáveis</h3></div>
                        <div className="p-6 space-y-4">
                            {variablesToMap.map(variable => (
                                <div key={variable} className="flex items-center space-x-4">
                                    <IFrameLabel className="w-1/3">{variable}</IFrameLabel>
                                    <select className="block w-2/3 h-10 border rounded-md px-3 py-2 text-sm bg-slate-700 border-slate-600 text-white" value={variableMapping[variable] || ''} onChange={(e) => handleVariableMap(variable, e.target.value)}>
                                        <option value="">Selecione um campo da lista...</option>
                                        {selectedListData?.fields?.map(field => (<option key={field} value={field}>{field}</option>))}
                                    </select>
                                </div>
                            ))}
                        </div>
                    </div>
                );

            case 6:
                return (
                    <div className="space-y-6">
                        <div className="space-y-2">
                            <IFrameLabel htmlFor="schedule">Quando enviar?</IFrameLabel>
                            <select id="schedule" className="block w-full h-10 border rounded-md px-3 py-2 text-sm bg-slate-800 border-slate-600 text-white" value={scheduleOption} onChange={e => setScheduleOption(e.target.value)}>
                                <option value="manual">Enviar Manualmente (após criação)</option>
                                <option value="later">Agendar para Depois</option>
                            </select>
                            {scheduleOption === 'later' && (<IFrameInput type="datetime-local" value={scheduledAt} onChange={(e) => setScheduledAt(e.target.value)} className="mt-2"/>)}
                        </div>
                        <div className="space-y-2">
                            <IFrameLabel htmlFor="interval">Intervalo entre mensagens</IFrameLabel>
                            <select id="interval" className="block w-full h-10 border rounded-md px-3 py-2 text-sm bg-slate-800 border-slate-600 text-white" value={messageInterval} onChange={e => setMessageInterval(e.target.value)}>
                                <option value="slow">Lento (1 mensagem / 60-90s)</option>
                                <option value="medium">Médio (1 mensagem / 30-60s)</option>
                                <option value="fast">Rápido (1 mensagem / 5-10s)</option>
                            </select>
                        </div>
                    </div>
                );

            default:
                return null;
        }
    };

    return (
        <div className="min-h-screen bg-transparent p-6">
            <div className="max-w-4xl mx-auto">
                <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-xl shadow-2xl">
                    <div className="p-6 border-b border-white/20">
                        <div className="flex items-center justify-between">
                            <div>
                                <h1 className="text-2xl font-bold text-white">Criar Nova Campanha</h1>
                                <p className="text-gray-400">Passo {currentStep} de {steps.length}: {steps[currentStep - 1]?.name || ''}</p>
                            </div>
                            <div className="w-1/3">
                                <IFrameProgress value={(currentStep / steps.length) * 100} />
                            </div>
                        </div>
                    </div>
                    <div className="p-6 min-h-[350px] flex items-center justify-center">
                        <div className="w-full" key={currentStep}>{renderStepContent()}</div>
                    </div>
                    <div className="p-6 flex justify-between border-t border-white/20">
                        <button type="button" className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-slate-200 bg-transparent hover:bg-slate-800 h-10 px-4 py-2 text-white" onClick={handlePrev} disabled={currentStep === 1 || isSubmitting}>
                            <ChevronLeft className="mr-2 h-4 w-4" />
                            Anterior
                        </button>
                        {currentStep < steps.length ? (
                            <button type="button" className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-slate-50 text-slate-900 hover:bg-slate-50/90 h-10 px-4 py-2" onClick={handleNext} disabled={isSubmitting}>
                                Próximo
                                <ChevronRight className="ml-2 h-4 w-4" />
                            </button>
                        ) : (
                            <button type="button" className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-green-600 text-white hover:bg-green-700 h-10 px-4 py-2" onClick={handleLaunch} disabled={isSubmitting}>
                                <CheckCircle className="mr-2 h-4 w-4" />
                                {isSubmitting ? 'Criando...' : 'Criar Campanha'}
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default IsolatedCreateCampaign;
