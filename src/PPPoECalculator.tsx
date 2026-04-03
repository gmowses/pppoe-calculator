import { useState, useEffect } from 'react'
import { Sun, Moon, Languages, Network, Info } from 'lucide-react'

const translations = {
  en: {
    title: 'PPPoE Overhead Calculator',
    subtitle: 'Calculate MTU, MSS, and packet overhead for PPPoE links. RFC 2516 compliant.',
    mode: 'Link Mode',
    modeDesc: 'Select the encapsulation scenario',
    plain: 'Plain PPPoE (RFC 2516)',
    vlan: 'PPPoE over 802.1Q VLAN',
    qinq: 'PPPoE over QinQ (802.1ad)',
    baby: 'Baby Jumbo Frames (MTU 1508)',
    mlppp: 'MLPPP (RFC 1990)',
    ethernetMtu: 'Ethernet MTU',
    pppoeHeader: 'PPPoE Header',
    pppHeader: 'PPP Header',
    vlanTag: '802.1Q VLAN Tag',
    qinqTag: 'QinQ outer tag',
    pppoePayload: 'PPPoE Payload MTU',
    mss: 'TCP MSS (IPv4)',
    mssV6: 'TCP MSS (IPv6)',
    mrru: 'MLPPP MRRU',
    results: 'Results',
    resultsDesc: 'Calculated overhead values',
    diagram: 'Packet Diagram',
    diagramDesc: 'Visual frame layout',
    ipHeader: 'IP Header (20B)',
    tcpHeader: 'TCP Header (20B)',
    payload: 'Payload',
    outerEth: 'Outer Ethernet',
    innerEth: 'Inner Ethernet',
    note: 'MSS = MTU - 40 bytes (IP + TCP headers). Set MSS in your router/firewall to avoid fragmentation.',
    rfcNote: 'RFC 2516 (PPPoE), RFC 1990 (MLPPP), IEEE 802.1Q (VLAN), IEEE 802.1ad (QinQ)',
    builtBy: 'Built by',
    bytes: 'bytes',
    overhead: 'Total overhead',
    ethFrameMax: 'Max Ethernet frame',
  },
  pt: {
    title: 'Calculadora de Overhead PPPoE',
    subtitle: 'Calcule MTU, MSS e overhead de pacotes para links PPPoE. Conforme RFC 2516.',
    mode: 'Modo do Link',
    modeDesc: 'Selecione o cenario de encapsulamento',
    plain: 'PPPoE simples (RFC 2516)',
    vlan: 'PPPoE sobre VLAN 802.1Q',
    qinq: 'PPPoE sobre QinQ (802.1ad)',
    baby: 'Baby Jumbo Frames (MTU 1508)',
    mlppp: 'MLPPP (RFC 1990)',
    ethernetMtu: 'MTU Ethernet',
    pppoeHeader: 'Cabecalho PPPoE',
    pppHeader: 'Cabecalho PPP',
    vlanTag: 'Tag VLAN 802.1Q',
    qinqTag: 'Tag externa QinQ',
    pppoePayload: 'MTU Payload PPPoE',
    mss: 'MSS TCP (IPv4)',
    mssV6: 'MSS TCP (IPv6)',
    mrru: 'MRRU MLPPP',
    results: 'Resultados',
    resultsDesc: 'Valores de overhead calculados',
    diagram: 'Diagrama de Pacote',
    diagramDesc: 'Layout visual do frame',
    ipHeader: 'Cabecalho IP (20B)',
    tcpHeader: 'Cabecalho TCP (20B)',
    payload: 'Dados',
    outerEth: 'Ethernet externo',
    innerEth: 'Ethernet interno',
    note: 'MSS = MTU - 40 bytes (cabecalhos IP + TCP). Configure o MSS no roteador/firewall para evitar fragmentacao.',
    rfcNote: 'RFC 2516 (PPPoE), RFC 1990 (MLPPP), IEEE 802.1Q (VLAN), IEEE 802.1ad (QinQ)',
    builtBy: 'Criado por',
    bytes: 'bytes',
    overhead: 'Overhead total',
    ethFrameMax: 'Frame Ethernet maximo',
  },
} as const

type Lang = keyof typeof translations
type Mode = 'plain' | 'vlan' | 'qinq' | 'baby' | 'mlppp'

interface Calc {
  ethernetMtu: number
  overhead: number
  payloadMtu: number
  mss: number
  mssV6: number
  mrru: number | null
  layers: { label: string; size: number; color: string }[]
}

function calculate(mode: Mode): Calc {
  // Base: Ethernet MTU 1500, PPPoE=6B, PPP=2B
  const ETH_MTU = mode === 'baby' ? 1508 : 1500
  const PPPOE = 6
  const PPP = 2
  const VLAN = 4
  const QINQ = 4

  let overhead = PPPOE + PPP
  let vlanOverhead = 0

  if (mode === 'vlan') vlanOverhead = VLAN
  if (mode === 'qinq') vlanOverhead = VLAN + QINQ

  const payloadMtu = ETH_MTU - overhead - vlanOverhead
  const mss = payloadMtu - 40
  const mssV6 = payloadMtu - 60
  const mrru = mode === 'mlppp' ? payloadMtu : null

  const layers: { label: string; size: number; color: string }[] = []

  if (mode === 'qinq') {
    layers.push({ label: 'QinQ (4B)', size: QINQ, color: '#6366f1' })
    layers.push({ label: 'VLAN (4B)', size: VLAN, color: '#8b5cf6' })
  } else if (mode === 'vlan') {
    layers.push({ label: 'VLAN (4B)', size: VLAN, color: '#8b5cf6' })
  }
  layers.push({ label: 'PPPoE (6B)', size: PPPOE, color: '#3b82f6' })
  layers.push({ label: 'PPP (2B)', size: PPP, color: '#0ea5e9' })
  layers.push({ label: `IP+TCP (40B)`, size: 40, color: '#10b981' })
  layers.push({ label: `Payload (${payloadMtu - 40}B)`, size: payloadMtu - 40, color: '#94a3b8' })

  return {
    ethernetMtu: ETH_MTU,
    overhead: overhead + vlanOverhead,
    payloadMtu,
    mss,
    mssV6,
    mrru,
    layers,
  }
}

export default function PPPoECalculator() {
  const [lang, setLang] = useState<Lang>(() => (navigator.language.startsWith('pt') ? 'pt' : 'en'))
  const [dark, setDark] = useState(() => window.matchMedia('(prefers-color-scheme: dark)').matches)
  const [mode, setMode] = useState<Mode>('plain')

  const t = translations[lang]
  const calc = calculate(mode)

  useEffect(() => { document.documentElement.classList.toggle('dark', dark) }, [dark])

  const modes: { key: Mode; label: string }[] = [
    { key: 'plain', label: t.plain },
    { key: 'vlan', label: t.vlan },
    { key: 'qinq', label: t.qinq },
    { key: 'baby', label: t.baby },
    { key: 'mlppp', label: t.mlppp },
  ]

  const totalFrame = calc.layers.reduce((a, l) => a + l.size, 0)

  return (
    <div className="min-h-screen flex flex-col bg-white dark:bg-[#09090b] text-zinc-900 dark:text-zinc-100 transition-colors">
      <header className="border-b border-zinc-200 dark:border-zinc-800 px-6 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
              <Network size={18} className="text-white" />
            </div>
            <span className="font-semibold">PPPoE Calculator</span>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setLang(l => l === 'en' ? 'pt' : 'en')} className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors">
              <Languages size={14} />{lang.toUpperCase()}
            </button>
            <button onClick={() => setDark(d => !d)} className="p-2 rounded-lg border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors">
              {dark ? <Sun size={16} /> : <Moon size={16} />}
            </button>
            <a href="https://github.com/gmowses/pppoe-calculator" target="_blank" rel="noopener noreferrer" className="p-2 rounded-lg border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/></svg>
            </a>
          </div>
        </div>
      </header>

      <main className="flex-1 px-6 py-10">
        <div className="max-w-5xl mx-auto space-y-8">
          <div>
            <h1 className="text-3xl font-bold">{t.title}</h1>
            <p className="mt-2 text-zinc-500 dark:text-zinc-400">{t.subtitle}</p>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            {/* Mode selector */}
            <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 space-y-4">
              <div>
                <h2 className="font-semibold">{t.mode}</h2>
                <p className="text-sm text-zinc-500 dark:text-zinc-400">{t.modeDesc}</p>
              </div>
              <div className="space-y-2">
                {modes.map(m => (
                  <label key={m.key} className="flex items-center gap-3 cursor-pointer p-3 rounded-lg border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors">
                    <input type="radio" name="mode" value={m.key} checked={mode === m.key} onChange={() => setMode(m.key)} className="accent-blue-500" />
                    <span className="text-sm font-medium">{m.label}</span>
                  </label>
                ))}
              </div>

              <div className="rounded-lg bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 px-4 py-3 flex gap-2">
                <Info size={14} className="text-blue-500 mt-0.5 shrink-0" />
                <p className="text-xs text-blue-700 dark:text-blue-300">{t.note}</p>
              </div>
            </div>

            {/* Results */}
            <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 space-y-4">
              <div>
                <h2 className="font-semibold">{t.results}</h2>
                <p className="text-sm text-zinc-500 dark:text-zinc-400">{t.resultsDesc}</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: t.ethernetMtu, value: `${calc.ethernetMtu} ${t.bytes}`, accent: true },
                  { label: t.overhead, value: `${calc.overhead} ${t.bytes}`, accent: false },
                  { label: t.pppoePayload, value: `${calc.payloadMtu} ${t.bytes}`, accent: true },
                  { label: t.mss, value: `${calc.mss} ${t.bytes}`, accent: false },
                  { label: t.mssV6, value: `${calc.mssV6} ${t.bytes}`, accent: false },
                  ...(calc.mrru !== null ? [{ label: t.mrru, value: `${calc.mrru} ${t.bytes}`, accent: true }] : []),
                ].map(({ label, value, accent }) => (
                  <div key={label} className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/30 px-3 py-2.5">
                    <p className="text-[10px] uppercase tracking-wide text-zinc-400 mb-0.5">{label}</p>
                    <p className={`text-sm font-bold tabular-nums ${accent ? 'text-blue-500' : ''}`}>{value}</p>
                  </div>
                ))}
              </div>

              {/* Overhead breakdown */}
              <div className="space-y-1.5">
                {[
                  { label: 'PPPoE header', size: 6 },
                  { label: 'PPP header', size: 2 },
                  ...(mode === 'vlan' || mode === 'qinq' ? [{ label: '802.1Q VLAN tag', size: 4 }] : []),
                  ...(mode === 'qinq' ? [{ label: 'QinQ outer tag', size: 4 }] : []),
                ].map(r => (
                  <div key={r.label} className="flex items-center justify-between text-sm">
                    <span className="text-zinc-500 dark:text-zinc-400">{r.label}</span>
                    <span className="font-mono font-semibold text-zinc-700 dark:text-zinc-300">{r.size}B</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Packet diagram */}
          <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 space-y-4">
            <div>
              <h2 className="font-semibold">{t.diagram}</h2>
              <p className="text-sm text-zinc-500 dark:text-zinc-400">{t.diagramDesc}</p>
            </div>
            <div className="overflow-x-auto">
              <div className="flex min-w-max rounded-lg overflow-hidden border border-zinc-200 dark:border-zinc-700">
                {calc.layers.map((layer, i) => {
                  const pct = (layer.size / totalFrame) * 100
                  return (
                    <div
                      key={i}
                      style={{ backgroundColor: layer.color, width: `max(${pct}%, 60px)` }}
                      className="flex flex-col items-center justify-center py-4 px-2 text-white text-center"
                    >
                      <span className="text-[10px] font-semibold leading-tight">{layer.label}</span>
                    </div>
                  )
                })}
              </div>
              <div className="flex min-w-max mt-1">
                {calc.layers.map((layer, i) => {
                  const pct = (layer.size / totalFrame) * 100
                  return (
                    <div key={i} style={{ width: `max(${pct}%, 60px)` }} className="text-center text-[10px] text-zinc-400 px-1">
                      {layer.size}B
                    </div>
                  )
                })}
              </div>
            </div>
            <p className="text-[10px] text-zinc-400">{t.rfcNote}</p>
          </div>
        </div>
      </main>

      <footer className="border-t border-zinc-200 dark:border-zinc-800 px-6 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between text-xs text-zinc-400">
          <span>{t.builtBy} <a href="https://github.com/gmowses" className="text-zinc-600 dark:text-zinc-300 hover:text-blue-500 transition-colors">Gabriel Mowses</a></span>
          <span>MIT License</span>
        </div>
      </footer>
    </div>
  )
}
