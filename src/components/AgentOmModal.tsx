import React, { useState, useRef, useEffect } from 'react';
import {
  Bot,
  Send,
  X,
  ExternalLink,
  Copy,
  Check,
  Globe,
  Satellite,
  BookOpen,
  Maximize2,
  Minimize2,
  Trash2,
  ChevronRight,
} from 'lucide-react';
import { AgentOmEngine, AgentContext, AgentResponse } from '../lib/agentOmEngine';
import { ProcessedAnalysisResult } from '../types';

interface Message {
  id: string;
  sender: 'user' | 'om';
  text: string;
  timestamp: string;
  sources?: AgentResponse['sources'];
  liveDataAction?: AgentResponse['liveDataAction'];
  liveDataPayload?: AgentResponse['liveDataPayload'];
  suggestedQuestions?: string[];
}

interface AgentOmModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedSample?: string | null;
  analysis?: ProcessedAnalysisResult | null;
  currentView?: 'ANALYZER' | 'GALLERY' | 'DOSSIER' | 'CLPS_BROWSER';
  nasaStatus?: any;
  isroStatus?: any;
}

export const AgentOmModal: React.FC<AgentOmModalProps> = ({
  isOpen,
  onClose,
  selectedSample,
  analysis,
  currentView,
  nasaStatus,
  isroStatus,
}) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'om-intro-1',
      sender: 'om',
      text:
        `### 🛰️ Greetings! I am Agent OM (Orbital & Mission AI Co-Pilot)\n\n` +
        `I am your autonomous lunar science and mission intelligence agent, fully grounded in authentic **ISRO** and **NASA** planetary science data.\n\n` +
        `#### What I Can Do For You:\n` +
        `- **Project Features & How-To**: Guide you step-by-step through every feature in LunarSafe (2D grid, 3D relief mesh, batch comparison, PDF reports, Disjoint-Set crater consolidation).\n` +
        `- **Expected Outputs & Benchmarks**: Provide exact mathematical and cryptographic benchmarks for all 3 demo targets (\`CH2_TMC2_MANZINUS_C\`, \`CH2_OHRC_SHIVSHAKTI\`, \`CH2_PSR_SOUTH_POLE\`, and \`NON_LUNAR_COLOR\` rejection).\n` +
        `- **Deep ISRO & NASA Science**: Explain Vikram lander dynamics (3.9m leg spread, ≤10° slope limit, 30cm boulder clearance) and 9 peer-reviewed papers authored by Dr. P. Veeramuthuvel, S. Somanath, Dr. Amitabh, and NASA teams.\n` +
        `- **Live Web / Internet Data**: Query NASA's live Planetary Data System (PDS) REST API in real time to fetch active lunar orbital products.\n\n` +
        `Tap any suggestion chip below or type your question!`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      suggestedQuestions: [
        'How do I use this project and its features?',
        'What are the expected outputs for the 3 demo targets?',
        'Why is the slope limit strictly ≤10°?',
        'Fetch live data from NASA PDS Web API',
        'Explain Dr. Veeramuthuvel\'s Chandrayaan-3 paper',
      ],
    },
  ]);

  const [inputQuery, setInputQuery] = useState('');
  const [isQuerying, setIsQuerying] = useState(false);
  const [isCopied, setIsCopied] = useState<string | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll on new messages
  useEffect(() => {
    if (isOpen) {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  if (!isOpen) return null;

  const currentContext: AgentContext = {
    selectedSample,
    analysis,
    currentView,
    nasaStatus,
    isroStatus,
  };

  const handleSend = async (textToSend?: string) => {
    const query = (textToSend || inputQuery).trim();
    if (!query || isQuerying) return;

    const userMsg: Message = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: query,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages(prev => [...prev, userMsg]);
    if (!textToSend) setInputQuery('');
    setIsQuerying(true);

    try {
      // First try calling backend endpoint /api/agent-om
      let agentResponse: AgentResponse;
      try {
        const res = await fetch('/api/agent-om', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ query, context: currentContext }),
        });
        if (res.ok) {
          agentResponse = await res.json();
        } else {
          // Fallback to local client engine
          agentResponse = await AgentOmEngine.query(query, currentContext);
        }
      } catch (err) {
        // Fallback to direct client-side engine if backend unreachable
        agentResponse = await AgentOmEngine.query(query, currentContext);
      }

      const omMsg: Message = {
        id: `om-${Date.now()}`,
        sender: 'om',
        text: agentResponse.reply,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        sources: agentResponse.sources,
        liveDataAction: agentResponse.liveDataAction,
        liveDataPayload: agentResponse.liveDataPayload,
        suggestedQuestions: agentResponse.suggestedQuestions,
      };

      setMessages(prev => [...prev, omMsg]);
    } catch (err: any) {
      const errorMsg: Message = {
        id: `om-err-${Date.now()}`,
        sender: 'om',
        text: `### ⚠️ Mission Comms Disrupted\n\nUnable to process query: ${err.message}. Please retry.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsQuerying(false);
    }
  };

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setIsCopied(id);
    setTimeout(() => setIsCopied(null), 2000);
  };

  const clearChat = () => {
    setMessages([
      {
        id: `om-reset-${Date.now()}`,
        sender: 'om',
        text: `### 🔄 Session Cleared\n\nAgent OM memory reset. How can I assist your lunar landing safety evaluation?`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        suggestedQuestions: [
          'How do I use this project and its features?',
          'What are the expected outputs for the 3 demo targets?',
          'Fetch live data from NASA PDS Web API',
        ],
      },
    ]);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/90 backdrop-blur-md animate-in fade-in duration-150 font-sans">
      <div
        className={`bg-black border border-zinc-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden transition-all duration-200 ${
          isExpanded
            ? 'w-full h-full max-w-[95vw] max-h-[95vh]'
            : 'w-full max-w-4xl h-[85vh] max-h-[750px]'
        }`}
      >
        {/* Header Bar */}
        <div className="border-b border-zinc-800 bg-black px-5 py-3.5 flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-3.5">
            <div className="relative w-10 h-10 rounded-xl bg-white text-black flex items-center justify-center shadow-lg font-mono font-bold">
              <Bot className="w-5 h-5 text-black" />
              <div className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-white border-2 border-black animate-ping" />
              <div className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-white border-2 border-black" />
            </div>

            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-base font-bold text-white font-mono tracking-wider flex items-center space-x-2">
                  <span>AGENT OM</span>
                  <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-zinc-900 text-zinc-300 border border-zinc-700">
                    AI CO-PILOT
                  </span>
                </h2>
                <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-black text-white border border-zinc-700">
                  ISRO & NASA GROUNDED
                </span>
              </div>
              <p className="text-[11px] text-zinc-400 font-mono flex items-center space-x-2">
                <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                <span>ONLINE · AUTONOMOUS LUNAR MISSION KNOWLEDGE AGENT</span>
              </p>
            </div>
          </div>

          {/* Action Icons */}
          <div className="flex items-center space-x-1.5 text-zinc-400">
            <button
              type="button"
              onClick={clearChat}
              className="p-2 rounded-lg hover:bg-zinc-900 hover:text-white transition-colors"
              title="Clear Chat History"
            >
              <Trash2 className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-2 rounded-lg hover:bg-zinc-900 hover:text-white transition-colors"
              title={isExpanded ? 'Normal View' : 'Expand View'}
            >
              {isExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-zinc-900 hover:text-white transition-colors"
              title="Close Agent OM"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Active Context Ribbon */}
        <div className="px-5 py-2 bg-black border-b border-zinc-800 flex flex-wrap items-center justify-between gap-2 text-xs font-mono shrink-0">
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-1.5">
              <Satellite className="w-3.5 h-3.5 text-zinc-400" />
              <span className="text-zinc-400">ACTIVE TARGET:</span>
              <span className="text-white font-bold">
                {selectedSample ? selectedSample.toUpperCase() : 'MANZINUS_C (DEFAULT)'}
              </span>
            </div>
            {analysis && (
              <>
                <div className="h-3 w-px bg-zinc-800 hidden sm:block" />
                <div className="hidden sm:flex items-center space-x-1.5">
                  <span className="text-zinc-400">SAFE CELLS:</span>
                  <span className="text-white font-bold">
                    {analysis.evidence.cellCountSafe} ({analysis.evidence.safeAreaPercentage}%)
                  </span>
                </div>
                <div className="h-3 w-px bg-zinc-800 hidden sm:block" />
                <div className="hidden sm:flex items-center space-x-1.5">
                  <span className="text-zinc-400">MEAN SLOPE:</span>
                  <span className="text-white font-bold">{analysis.meanSlopeDeg}°</span>
                </div>
              </>
            )}
          </div>

          <div className="flex items-center space-x-2 text-[11px]">
            <span className="px-2 py-0.5 rounded bg-black border border-zinc-800 text-white font-bold">
              SHA-256 SEALED
            </span>
            <span className="px-2 py-0.5 rounded bg-zinc-900 border border-zinc-700 text-white font-bold">
              ZERO PYTHON
            </span>
          </div>
        </div>

        {/* Chat Stream Body */}
        <div className="flex-1 p-5 overflow-y-auto space-y-4 bg-black">
          {messages.map(msg => {
            const isUser = msg.sender === 'user';

            return (
              <div
                key={msg.id}
                className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} space-y-1.5`}
              >
                {/* Sender badge & timestamp */}
                <div className="flex items-center space-x-2 px-1 text-[11px] font-mono">
                  {isUser ? (
                    <>
                      <span className="text-white/50">{msg.timestamp}</span>
                      <span className="text-white font-bold">MISSION OPERATOR</span>
                    </>
                  ) : (
                    <>
                      <div className="flex items-center space-x-1 text-white font-bold">
                        <Bot className="w-3.5 h-3.5 text-white" />
                        <span>AGENT OM</span>
                      </div>
                      <span className="text-zinc-500">{msg.timestamp}</span>
                    </>
                  )}
                </div>

                {/* Message Bubble */}
                <div
                  className={`max-w-[90%] sm:max-w-[85%] rounded-2xl p-4 text-xs sm:text-sm leading-relaxed ${
                    isUser
                      ? 'bg-zinc-900 border border-zinc-800 text-white rounded-tr-xs'
                      : 'bg-black border border-zinc-800 text-white rounded-tl-xs shadow-xl'
                  }`}
                >
                  {/* Markdown Content Formatter */}
                  <div className="space-y-3 prose prose-invert max-w-none text-white font-sans">
                    {msg.text.split('\n\n').map((block, idx) => {
                      // Headers
                      if (block.startsWith('### ')) {
                        return (
                          <h3
                            key={idx}
                            className="text-base font-bold text-white font-mono tracking-wide border-b border-zinc-800 pb-1 mt-1"
                          >
                            {block.replace('### ', '')}
                          </h3>
                        );
                      }
                      if (block.startsWith('#### ')) {
                        return (
                          <h4
                            key={idx}
                            className="text-sm font-bold text-white font-mono tracking-wide mt-2"
                          >
                            {block.replace('#### ', '')}
                          </h4>
                        );
                      }

                      // Blockquote / Notes
                      if (block.startsWith('> ')) {
                        return (
                          <div
                            key={idx}
                            className="p-3 rounded-lg bg-zinc-950 border-l-4 border-white text-zinc-200 text-xs font-mono"
                          >
                            {block.replace('> ', '')}
                          </div>
                        );
                      }

                      // Tables
                      if (block.includes('|') && block.includes('---')) {
                        const rows = block.trim().split('\n');
                        const headers = rows[0]
                          .split('|')
                          .map(c => c.trim())
                          .filter(Boolean);
                        const dataRows = rows.slice(2).map(r =>
                          r
                            .split('|')
                            .map(c => c.trim())
                            .filter(Boolean)
                        );

                        return (
                          <div key={idx} className="overflow-x-auto my-2 rounded-lg border border-zinc-800">
                            <table className="w-full text-left font-mono text-[11px]">
                              <thead className="bg-zinc-900 text-white">
                                <tr>
                                  {headers.map((h, hi) => (
                                    <th key={hi} className="p-2 border-b border-zinc-800 font-semibold">
                                      {h}
                                    </th>
                                  ))}
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-zinc-850 bg-black">
                                {dataRows.map((row, ri) => (
                                  <tr key={ri} className="hover:bg-zinc-900/50">
                                    {row.map((cell, ci) => (
                                      <td key={ci} className="p-2 text-zinc-200 font-mono">
                                        {cell}
                                      </td>
                                    ))}
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        );
                      }

                      // Bullet Lists
                      if (block.includes('- ')) {
                        const items = block
                          .split('\n')
                          .filter(l => l.trim().startsWith('- ') || l.trim().startsWith('* '));
                        if (items.length > 0) {
                          return (
                            <ul key={idx} className="list-disc pl-5 space-y-1 text-zinc-200 text-xs">
                              {items.map((it, ii) => (
                                <li key={ii}>
                                  <span
                                    dangerouslySetInnerHTML={{
                                      __html: it
                                        .replace(/^[-*]\s+/, '')
                                        .replace(/\*\*(.*?)\*\*/g, '<strong class="text-white font-bold">$1</strong>')
                                        .replace(/`([^`]+)`/g, '<code class="px-1 py-0.5 rounded bg-zinc-900 text-zinc-200 font-mono text-[10px] border border-zinc-800">$1</code>'),
                                    }}
                                  />
                                </li>
                              ))}
                            </ul>
                          );
                        }
                      }

                      // Standard Paragraph with inline bold and code formatting
                      return (
                        <p
                          key={idx}
                          className="leading-relaxed text-xs sm:text-sm text-zinc-200"
                          dangerouslySetInnerHTML={{
                            __html: block
                              .replace(/\*\*(.*?)\*\*/g, '<strong class="text-white font-bold">$1</strong>')
                              .replace(/`([^`]+)`/g, '<code class="px-1.5 py-0.5 rounded bg-zinc-900 text-zinc-200 font-mono text-[11px] border border-zinc-800">$1</code>'),
                          }}
                        />
                      );
                    })}
                  </div>

                  {/* Sources Footnote */}
                  {msg.sources && msg.sources.length > 0 && (
                    <div className="mt-3 pt-2.5 border-t border-zinc-800 space-y-1">
                      <div className="text-[10px] font-mono font-bold text-zinc-400 uppercase flex items-center space-x-1">
                        <BookOpen className="w-3 h-3 text-zinc-300" />
                        <span>Peer-Reviewed Literature Citations:</span>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {msg.sources.map((s, si) => (
                          <div
                            key={si}
                            className="px-2 py-0.5 rounded bg-black border border-zinc-800 text-[10px] font-mono text-zinc-300 flex items-center space-x-1"
                          >
                            <span className="text-white font-bold">[{s.organization}]</span>
                            <span>{s.title}</span>
                            {s.url && (
                              <a
                                href={s.url}
                                target="_blank"
                                rel="noreferrer"
                                className="text-zinc-400 hover:text-white"
                              >
                                <ExternalLink className="w-2.5 h-2.5" />
                              </a>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Message Action Footer */}
                  {!isUser && (
                    <div className="mt-2.5 pt-2 border-t border-zinc-850 flex items-center justify-between text-[11px] font-mono text-zinc-400">
                      <span>VERIFIED GROUNDED IN ISRO & NASA DATA</span>
                      <button
                        type="button"
                        onClick={() => handleCopy(msg.text, msg.id)}
                        className="flex items-center space-x-1 hover:text-white transition-colors"
                      >
                        {isCopied === msg.id ? (
                          <>
                            <Check className="w-3 h-3 text-white" />
                            <span className="text-white">COPIED</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3" />
                            <span>COPY ANSWER</span>
                          </>
                        )}
                      </button>
                    </div>
                  )}
                </div>

                {/* Follow-up Suggested Question Chips */}
                {msg.suggestedQuestions && msg.suggestedQuestions.length > 0 && !isUser && (
                  <div className="flex flex-wrap gap-1.5 pt-1 pl-2 max-w-[85%]">
                    {msg.suggestedQuestions.map((q, qi) => (
                      <button
                        key={qi}
                        type="button"
                        onClick={() => handleSend(q)}
                        disabled={isQuerying}
                        className="px-2.5 py-1 rounded-lg bg-black hover:bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-[11px] font-mono text-zinc-300 hover:text-white transition-all flex items-center space-x-1 text-left"
                      >
                        <ChevronRight className="w-3 h-3 text-zinc-400 shrink-0" />
                        <span>{q}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            );
          })}

          {/* Querying Loading Indicator */}
          {isQuerying && (
            <div className="flex items-start space-x-3 p-4 rounded-xl bg-black border border-zinc-800 w-fit">
              <div className="w-6 h-6 rounded-lg bg-zinc-900 flex items-center justify-center">
                <Bot className="w-3.5 h-3.5 text-white animate-spin" />
              </div>
              <div className="space-y-1 font-mono text-xs text-white">
                <div className="flex items-center space-x-2">
                  <span className="font-bold">AGENT OM SYNTHESIZING RESPONSE</span>
                  <span className="flex space-x-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-white animate-bounce" />
                    <span className="w-1.5 h-1.5 rounded-full bg-white animate-bounce [animation-delay:0.2s]" />
                    <span className="w-1.5 h-1.5 rounded-full bg-white animate-bounce [animation-delay:0.4s]" />
                  </span>
                </div>
                <p className="text-[10px] text-zinc-400">
                  Cross-referencing ISRO 24m physics, peer-reviewed papers & live telemetry...
                </p>
              </div>
            </div>
          )}

          <div ref={chatEndRef} />
        </div>

        {/* Input Bar & Live Action Triggers */}
        <div className="border-t border-zinc-800 bg-black p-4 space-y-3 shrink-0">
          {/* Quick Action Buttons */}
          <div className="flex items-center space-x-2 overflow-x-auto pb-1 text-xs font-mono scrollbar-thin">
            <button
              type="button"
              onClick={() => handleSend('Fetch live data from NASA PDS Web API')}
              disabled={isQuerying}
              className="px-2.5 py-1 rounded-md bg-white hover:bg-zinc-200 text-black border border-white font-bold flex items-center space-x-1.5 shrink-0 transition-colors shadow"
            >
              <Globe className="w-3 h-3 text-black" />
              <span>QUERY LIVE NASA PDS</span>
            </button>
            <button
              type="button"
              onClick={() => handleSend('How do I use this project and its features?')}
              disabled={isQuerying}
              className="px-2.5 py-1 rounded-md bg-black hover:bg-zinc-900 text-zinc-300 hover:text-white border border-zinc-800 flex items-center space-x-1.5 shrink-0 transition-colors"
            >
              <span>HOW TO USE</span>
            </button>
            <button
              type="button"
              onClick={() => handleSend('What are the expected outputs for the 3 demo targets?')}
              disabled={isQuerying}
              className="px-2.5 py-1 rounded-md bg-black hover:bg-zinc-900 text-zinc-300 hover:text-white border border-zinc-800 flex items-center space-x-1.5 shrink-0 transition-colors"
            >
              <span>BENCHMARK METRICS</span>
            </button>
            <button
              type="button"
              onClick={() => handleSend('Why is the slope limit strictly ≤10°?')}
              disabled={isQuerying}
              className="px-2.5 py-1 rounded-md bg-black hover:bg-zinc-900 text-zinc-300 hover:text-white border border-zinc-800 flex items-center space-x-1.5 shrink-0 transition-colors"
            >
              <span>≤10° SLOPE PHYSICS</span>
            </button>
            <button
              type="button"
              onClick={() => handleSend('Explain Dr. Veeramuthuvel\'s Chandrayaan-3 paper')}
              disabled={isQuerying}
              className="px-2.5 py-1 rounded-md bg-black hover:bg-zinc-900 text-zinc-300 hover:text-white border border-zinc-800 flex items-center space-x-1.5 shrink-0 transition-colors"
            >
              <span>ISRO PAPERS</span>
            </button>
          </div>

          {/* Main Text Input Field */}
          <form
            onSubmit={e => {
              e.preventDefault();
              handleSend();
            }}
            className="flex items-center space-x-2"
          >
            <div className="relative flex-1">
              <input
                type="text"
                value={inputQuery}
                onChange={e => setInputQuery(e.target.value)}
                placeholder="Ask Agent OM anything (features, expected output, ISRO/NASA papers, live data)..."
                disabled={isQuerying}
                className="w-full bg-black border border-zinc-800 focus:border-white rounded-xl px-4 py-3 text-xs sm:text-sm text-white placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-white transition-all font-mono"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-mono text-zinc-500 hidden sm:inline">
                PRESS ENTER
              </span>
            </div>

            <button
              type="submit"
              disabled={isQuerying || !inputQuery.trim()}
              className="px-5 py-3 rounded-xl bg-white hover:bg-zinc-200 disabled:bg-zinc-800 disabled:text-zinc-600 text-black font-bold font-mono text-xs sm:text-sm flex items-center space-x-2 transition-all shrink-0 shadow-lg disabled:cursor-not-allowed"
            >
              <span>SEND</span>
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
