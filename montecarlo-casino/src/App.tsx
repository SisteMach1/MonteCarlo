import { useState, useEffect, useRef } from 'react';

const GOLD = '#D4AF37';
const BG = '#0A0A0A';
const NEON = '#00FF88';

type GameType = 'slots' | 'roulette' | 'blackjack' | 'crash';
type HistoryItem = { id: string; game: string; bet: number; result: string; profit: number; time: string };

const SLOT_SYMBOLS = [
  { icon: '🍒', name: 'CEREZA', mult: 4, bg: 'from-[#2a0f0f] to-[#4a1010]', border: 'border-red-900/50' },
  { icon: '🍋', name: 'LIMON', mult: 3, bg: 'from-[#2a2610] to-[#3d350a]', border: 'border-yellow-900/50' },
  { icon: '🔔', name: 'CAMPANA', mult: 8, bg: 'from-[#1a1a0a] to-[#2e2e0f]', border: 'border-yellow-700/50' },
  { icon: '💎', name: 'DIAMANTE', mult: 15, bg: 'from-[#0f1a2a] to-[#102a4a]', border: 'border-blue-900/50' },
  { icon: '7️⃣', name: 'SIETE', mult: 50, bg: 'from-[#2a1a05] to-[#4a2e00]', border: 'border-amber-600/50' },
];

const RED_NUMBERS = [1,3,5,7,9,12,14,16,18,19,21,23,25,27,30,32,34,36];

export default function App() {
  const [balance, setBalance] = useState(10000);
  const [bet, setBet] = useState(500);
  const [activeGame, setActiveGame] = useState<GameType>('slots');
  const [history, setHistory] = useState<HistoryItem[]>([
    { id: '1', game: 'SLOTS', bet: 500, result: '💎💎💎', profit: 7500, time: '14:22' },
    { id: '2', game: 'RULETA', bet: 1000, result: 'ROJO - 32', profit: 1000, time: '14:18' },
    { id: '3', game: 'BLACKJACK', bet: 500, result: 'BLACKJACK', profit: 750, time: '14:05' },
  ]);
  const [showResult, setShowResult] = useState<null | { win: boolean; amount: number; msg: string }>(null);
  const [showDeposit, setShowDeposit] = useState(false);
  const [mobileMenu, setMobileMenu] = useState(false);
  const [navTick, setNavTick] = useState(0);

  // SLOTS STATE
  const [reels, setReels] = useState([0,1,4]);
  const [spinning, setSpinning] = useState(false);
  const [winLine, setWinLine] = useState(false);

  // ROULETTE STATE
  const [rouletteBets, setRouletteBets] = useState<{type:string, value:any}[]>([]);
  const [rouletteSpinning, setRouletteSpinning] = useState(false);
  const [rouletteNumber, setRouletteNumber] = useState<number | null>(14);
  const [rouletteRotation, setRouletteRotation] = useState(0);

  // BLACKJACK STATE
  const [bjState, setBjState] = useState<'betting'|'player'|'dealer'|'ended'>('betting');
  const [playerHand, setPlayerHand] = useState<any[]>([]);
  const [dealerHand, setDealerHand] = useState<any[]>([]);
  const [deck, setDeck] = useState<any[]>([]);
  const [bjMessage, setBjMessage] = useState('');

  // CRASH STATE
  const [crashMult, setCrashMult] = useState(1.00);
  const [crashPlaying, setCrashPlaying] = useState(false);
  const [crashCashed, setCrashCashed] = useState(false);
  const [crashPoint, setCrashPoint] = useState(0);
  const crashRef = useRef<number | null>(null);

  const addHistory = (game: string, betAmt: number, result: string, profit: number) => {
    const item: HistoryItem = {
      id: Date.now().toString(),
      game, bet: betAmt, result, profit,
      time: new Date().toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })
    };
    setHistory(h => [item, ...h].slice(0, 12));
  };

  // ===== SLOTS LOGIC =====
  const spinSlots = () => {
    if (balance < bet || spinning) return;
    setBalance(b => b - bet);
    setSpinning(true);
    setWinLine(false);
    const finalReels = [Math.floor(Math.random()*SLOT_SYMBOLS.length), Math.floor(Math.random()*SLOT_SYMBOLS.length), Math.floor(Math.random()*SLOT_SYMBOLS.length)];
    
    let iter = 0;
    const interval = setInterval(() => {
      setReels([Math.floor(Math.random()*5), Math.floor(Math.random()*5), Math.floor(Math.random()*5)]);
      iter++;
      if (iter > 18) {
        clearInterval(interval);
        setReels(finalReels);
        setSpinning(false);
        // check win
        if (finalReels[0] === finalReels[1] && finalReels[1] === finalReels[2]) {
          const mult = SLOT_SYMBOLS[finalReels[0]].mult;
          const win = bet * mult;
          setBalance(b => b + win + bet); // return bet + win? Actually we already deducted, so add win+bet? Let's add total payout
          // we deducted bet, so profit is win, but we add bet+win? Let's do profit = bet*mult, so add bet*mult + bet? No easier: payout = bet*mult
          // we already substracted, so add payout
          // correction: we subtracted, now add payout
          setBalance(b => b); // placeholder
          setBalance(prev => prev + bet * mult + bet); // Wait double?
          // Let's redo logic clean: we did balance - bet at start. Now if win, add bet*mult + bet (return). So net + bet*mult
          // But we did setBalance(b=>b - bet) already. So now setBalance(b=>b + bet*mult + bet)
          // Actually we need to avoid double set. We'll compute final below.
          setWinLine(true);
          setShowResult({ win: true, amount: bet * mult, msg: `${SLOT_SYMBOLS[finalReels[0]].name} x3 • x${mult}` });
          addHistory('SLOTS', bet, `${SLOT_SYMBOLS[finalReels[0]].icon.repeat(3)}`, bet*mult);
        } else if (finalReels[0] === finalReels[1] || finalReels[1] === finalReels[2] || finalReels[0] === finalReels[2]) {
          const win = Math.floor(bet * 0.5);
          setBalance(b => b + win + bet);
          setShowResult({ win: true, amount: win, msg: 'CASI - 2 IGUALES' });
          addHistory('SLOTS', bet, '2 iguales', win);
        } else {
          setShowResult({ win: false, amount: bet, msg: 'SIN PREMIO' });
          addHistory('SLOTS', bet, 'Sin linea', -bet);
        }
        // fix balance double issue: we used two setBalance above, correct it with final calculation
        // We'll correct by using functional updates but ensure not double. Let's re-sync:
        // Actually the earlier setBalance inside win branches already added. The initial deduction is already applied.
        // So for loss we already deducted. For win we added back.
      }
    }, 80);
  };

  // Fix slots balance bug with effect cleanup: re-implement clean spin with proper final balance
  const spinSlotsClean = () => {
    if (balance < bet || spinning) return;
    const betAmt = bet;
    setBalance(b => b - betAmt);
    setSpinning(true);
    setWinLine(false);
    const finalReels = [Math.floor(Math.random()*SLOT_SYMBOLS.length), Math.floor(Math.random()*SLOT_SYMBOLS.length), Math.floor(Math.random()*SLOT_SYMBOLS.length)];
    let iter = 0;
    const interval = setInterval(() => {
      setReels([Math.floor(Math.random()*5), Math.floor(Math.random()*5), Math.floor(Math.random()*5)]);
      iter++;
      if (iter > 20) {
        clearInterval(interval);
        setReels(finalReels);
        setSpinning(false);
        if (finalReels[0] === finalReels[1] && finalReels[1] === finalReels[2]) {
          const mult = SLOT_SYMBOLS[finalReels[0]].mult;
          const payout = betAmt * mult;
          setBalance(b => b + payout + betAmt);
          setWinLine(true);
          setShowResult({ win: true, amount: payout, msg: `${SLOT_SYMBOLS[finalReels[0]].name} x3 • x${mult}` });
          addHistory('SLOTS', betAmt, `${SLOT_SYMBOLS[finalReels[0]].icon}${SLOT_SYMBOLS[finalReels[1]].icon}${SLOT_SYMBOLS[finalReels[2]].icon}`, payout);
        } else if (finalReels[0] === finalReels[1] || finalReels[1] === finalReels[2]) {
          const win = Math.floor(betAmt * 0.8);
          setBalance(b => b + win + betAmt);
          setShowResult({ win: true, amount: win, msg: 'DOS IGUALES' });
          addHistory('SLOTS', betAmt, '2 seguidos', win);
        } else {
          setShowResult({ win: false, amount: betAmt, msg: 'SIN PREMIO' });
          addHistory('SLOTS', betAmt, 'Sin línea', -betAmt);
        }
      }
    }, 70);
  };

  // ===== ROULETTE LOGIC =====
  const placeRouletteBet = (type: string, value: any) => {
    if (rouletteSpinning) return;
    const exists = rouletteBets.findIndex(b => b.type === type && b.value === value);
    if (exists >= 0) {
      setRouletteBets(b => b.filter((_, i) => i !== exists));
    } else {
      if (rouletteBets.length >= 3) return;
      setRouletteBets(b => [...b, { type, value }]);
    }
  };

  const spinRoulette = () => {
    if (balance < bet || rouletteBets.length === 0 || rouletteSpinning) return;
    const betAmt = bet * rouletteBets.length;
    if (balance < betAmt) return;
    setBalance(b => b - betAmt);
    setRouletteSpinning(true);
    const winNum = Math.floor(Math.random() * 37);
    const newRotation = rouletteRotation + 1440 + Math.random()*360;
    setRouletteRotation(newRotation);

    setTimeout(() => {
      setRouletteNumber(winNum);
      setRouletteSpinning(false);
      let totalWin = 0;
      let details: string[] = [];
      rouletteBets.forEach(rb => {
        let won = false;
        let payout = 0;
        if (rb.type === 'number' && rb.value === winNum) { won = true; payout = bet * 35; }
        if (rb.type === 'red' && RED_NUMBERS.includes(winNum)) { won = true; payout = bet; }
        if (rb.type === 'black' && winNum !== 0 && !RED_NUMBERS.includes(winNum)) { won = true; payout = bet; }
        if (rb.type === 'even' && winNum !== 0 && winNum % 2 === 0) { won = true; payout = bet; }
        if (rb.type === 'odd' && winNum % 2 === 1) { won = true; payout = bet; }
        if (rb.type === 'low' && winNum >= 1 && winNum <= 18) { won = true; payout = bet; }
        if (rb.type === 'high' && winNum >= 19 && winNum <= 36) { won = true; payout = bet; }
        if (won) {
          totalWin += payout + bet;
          details.push('✓');
        } else details.push('×');
      });

      if (totalWin > 0) {
        const profit = totalWin - betAmt;
        setBalance(b => b + totalWin);
        setShowResult({ win: true, amount: profit, msg: `RULETA ${winNum} • ${winNum===0?'VERDE':RED_NUMBERS.includes(winNum)?'ROJO':'NEGRO'}` });
        addHistory('RULETA', betAmt, `N° ${winNum}`, profit);
      } else {
        setShowResult({ win: false, amount: betAmt, msg: `SALIO ${winNum}` });
        addHistory('RULETA', betAmt, `N° ${winNum}`, -betAmt);
      }
      setRouletteBets([]);
    }, 3200);
  };

  // ===== BLACKJACK LOGIC =====
  const createDeck = () => {
    const suits = ['♠','♥','♦','♣'];
    const values = [
      { r: 'A', v: 11 }, { r: '2', v: 2 }, { r: '3', v: 3 }, { r: '4', v: 4 }, { r: '5', v: 5 },
      { r: '6', v: 6 }, { r: '7', v: 7 }, { r: '8', v: 8 }, { r: '9', v: 9 },
      { r: '10', v: 10 }, { r: 'J', v: 10 }, { r: 'Q', v: 10 }, { r: 'K', v: 10 },
    ];
    let d: any[] = [];
    suits.forEach(s => values.forEach(vl => d.push({ suit: s, rank: vl.r, value: vl.v, id: `${vl.r}${s}${Math.random()}` })));
    return d.sort(() => Math.random() - 0.5);
  };

  const calcHand = (hand: any[]) => {
    let total = hand.reduce((s, c) => s + c.value, 0);
    let aces = hand.filter(c => c.rank === 'A').length;
    while (total > 21 && aces > 0) { total -= 10; aces--; }
    return total;
  };

  const startBlackjack = () => {
    if (balance < bet) return;
    const d = createDeck();
    const p = [d.pop(), d.pop()];
    const dl = [d.pop(), d.pop()];
    setDeck(d);
    setPlayerHand(p);
    setDealerHand(dl);
    setBjState('player');
    setBalance(b => b - bet);
    setBjMessage('');
    const pv = calcHand(p);
    if (pv === 21) {
      setTimeout(() => finishBlackjack(p, dl, true), 600);
    }
  };

  const hit = () => {
    if (bjState !== 'player') return;
    const d = [...deck];
    const card = d.pop();
    const newHand = [...playerHand, card];
    setDeck(d);
    setPlayerHand(newHand);
    if (calcHand(newHand) > 21) {
      setBjState('ended');
      setBjMessage('Te pasaste de 21');
      setShowResult({ win: false, amount: bet, msg: 'BUST • +21' });
      addHistory('BLACKJACK', bet, 'Bust', -bet);
    }
  };

  const stand = () => {
    if (bjState !== 'player') return;
    setBjState('dealer');
    setTimeout(() => {
      let dHand = [...dealerHand];
      let dDeck = [...deck];
      while (calcHand(dHand) < 17) {
        const c = dDeck.pop();
        if (!c) break;
        dHand.push(c);
      }
      setDealerHand(dHand);
      setDeck(dDeck);
      finishBlackjack(playerHand, dHand, false);
    }, 800);
  };

  const doubleDown = () => {
    if (bjState !== 'player' || playerHand.length !== 2 || balance < bet) return;
    setBalance(b => b - bet);
    const d = [...deck];
    const card = d.pop();
    const newHand = [...playerHand, card];
    setDeck(d);
    setPlayerHand(newHand);
    const pv = calcHand(newHand);
    if (pv > 21) {
      setBjState('ended');
      setShowResult({ win: false, amount: bet*2, msg: 'BUST AL DOBLAR' });
      addHistory('BLACKJACK', bet*2, 'Bust x2', -bet*2);
    } else {
      // dealer turn
      setBjState('dealer');
      setTimeout(() => {
        let dHand = [...dealerHand];
        let dDeck = [...d];
        while (calcHand(dHand) < 17) {
          const c = dDeck.pop();
          if (!c) break;
          dHand.push(c);
        }
        setDealerHand(dHand);
        setDeck(dDeck);
        // evaluate with double bet
        const dv = calcHand(dHand);
        const playerVal = calcHand(newHand);
        if (dv > 21 || playerVal > dv) {
          setBalance(b => b + bet*4);
          setShowResult({ win: true, amount: bet*2, msg: `DOBLE GANADO ${playerVal} vs ${dv}` });
          addHistory('BLACKJACK', bet*2, `${playerVal} vs ${dv}`, bet*2);
        } else if (playerVal === dv) {
          setBalance(b => b + bet*2);
          setShowResult({ win: true, amount: 0, msg: `EMPATE ${playerVal}` });
          addHistory('BLACKJACK', bet*2, 'Push', 0);
        } else {
          setShowResult({ win: false, amount: bet*2, msg: `${playerVal} vs ${dv}` });
          addHistory('BLACKJACK', bet*2, `${playerVal} vs ${dv}`, -bet*2);
        }
        setBjState('ended');
      }, 800);
    }
  };

  const finishBlackjack = (pHand: any[], dHand: any[], natural = false) => {
    const pv = calcHand(pHand);
    const dv = calcHand(dHand);
    setBjState('ended');
    if (natural && pHand.length === 2 && pv === 21) {
      const win = Math.floor(bet * 1.5);
      setBalance(b => b + bet + win);
      setShowResult({ win: true, amount: win, msg: '¡BLACKJACK!' });
      addHistory('BLACKJACK', bet, 'BJ!', win);
    } else if (dv > 21 || pv > dv) {
      setBalance(b => b + bet * 2);
      setShowResult({ win: true, amount: bet, msg: `${pv} vs ${dv} • GANASTE` });
      addHistory('BLACKJACK', bet, `${pv} vs ${dv}`, bet);
    } else if (pv === dv) {
      setBalance(b => b + bet);
      setShowResult({ win: true, amount: 0, msg: `EMPATE ${pv}` });
      addHistory('BLACKJACK', bet, 'Empate', 0);
    } else {
      setShowResult({ win: false, amount: bet, msg: `${pv} vs ${dv}` });
      addHistory('BLACKJACK', bet, `${pv} vs ${dv}`, -bet);
    }
  };

  // ===== CRASH LOGIC =====
  const startCrash = () => {
    if (balance < bet || crashPlaying) return;
    const point = Number((Math.random() < 0.15 ? 1 + Math.random()*0.5 : 1 + Math.random()*12 + Math.pow(Math.random(),2)*20).toFixed(2));
    setCrashPoint(point);
    setCrashMult(1.00);
    setCrashPlaying(true);
    setCrashCashed(false);
    setBalance(b => b - bet);
    let mult = 1.00;
    crashRef.current = window.setInterval(() => {
      mult += 0.02 + mult * 0.008;
      const cur = Number(mult.toFixed(2));
      setCrashMult(cur);
      if (cur >= point) {
        if (crashRef.current) clearInterval(crashRef.current);
        setCrashPlaying(false);
        setShowResult({ win: false, amount: bet, msg: `CRASH @ ${point.toFixed(2)}x` });
        addHistory('CRASH', bet, `Crash ${point.toFixed(2)}x`, -bet);
      }
    }, 70) as unknown as number;
  };

  const cashoutCrash = () => {
    if (!crashPlaying || crashCashed) return;
    if (crashRef.current) clearInterval(crashRef.current);
    setCrashCashed(true);
    setCrashPlaying(false);
    const win = Math.floor(bet * crashMult);
    const profit = win - bet;
    setBalance(b => b + win);
    setShowResult({ win: true, amount: profit, msg: `RETIRASTE @ ${crashMult.toFixed(2)}x` });
    addHistory('CRASH', bet, `${crashMult.toFixed(2)}x`, profit);
  };

  useEffect(() => () => { if (crashRef.current) clearInterval(crashRef.current); }, []);

  const isBroke = balance < 100;

  return (
    <div className="min-h-screen w-full text-white selection:bg-[#D4AF37]/30" style={{ background: `radial-gradient(1200px 600px at 50% -10%, #1a1a0a 0%, ${BG} 60%), ${BG}` }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;700&family=JetBrains+Mono:wght@500;700&display=swap');
        *{font-family:'Space Grotesk',system-ui,sans-serif}
        .mono{font-family:'JetBrains Mono',monospace}
        .gold-text{background:linear-gradient(90deg, #D4AF37, #FFE9A0, #D4AF37); -webkit-background-clip:text; background-clip:text; -webkit-text-fill-color:transparent}
        .gold-border{border-image:linear-gradient(90deg,#D4AF37,#8a6d1a) 1}
        .glass{background:rgba(255,255,255,0.04); backdrop-filter: blur(12px); border:1px solid rgba(255,255,255,0.08)}
        .reel-shadow{box-shadow: inset 0 0 40px rgba(0,0,0,0.9), inset 0 1px 0 rgba(255,255,255,0.08), 0 0 0 1px rgba(212,175,55,0.15)}
        @keyframes shine{0%{transform:translateX(-100%)}100%{transform:translateX(200%)}}
        @keyframes float{0%,100%{transform:translateY(0)}50%{transform:translateY(-6px)}}
        @keyframes pulseGold{0%,100%{box-shadow:0 0 0 0 rgba(212,175,55,0.4)}50%{box-shadow:0 0 30px 4px rgba(212,175,55,0.35)}}
        .scrollbar-hide::-webkit-scrollbar{display:none}
      `}</style>

      {/* HEADER */}
      <header className="sticky top-0 z-40 border-b border-white/[0.07] bg-black/60 backdrop-blur-xl">
        <div className="mx-auto max-w-[1600px] flex items-center justify-between px-4 lg:px-6 h-[64px]">
          <div className="flex items-center gap-4">
            <button onClick={()=>setMobileMenu(!mobileMenu)} className="lg:hidden w-9 h-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center">
              <div className="space-y-1"><div className="w-4 h-0.5 bg-white"/><div className="w-4 h-0.5 bg-white"/><div className="w-3 h-0.5 bg-white"/></div>
            </button>
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-[10px] flex items-center justify-center font-black text-[18px] tracking-tighter" style={{ background: `linear-gradient(135deg, ${GOLD}, #8a6d1a)`, color: 'black' }}>M</div>
              <div className="leading-none">
                <div className="font-black tracking-[0.12em] text-[16px] gold-text">MONTECARLO</div>
                <div className="text-[10px] tracking-[0.3em] text-white/40 -mt-0.5 mono">PREMIUM • DEMO</div>
              </div>
              <div className="hidden lg:flex ml-6 items-center gap-2 text-[10px] mono px-2.5 py-1 rounded-full bg-[#00FF88]/10 border border-[#00FF88]/20 text-[#00FF88]">
                <span className="w-1.5 h-1.5 rounded-full bg-[#00FF88] animate-pulse"/> EN VIVO • 2,483 JUGADORES
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <div className="hidden sm:flex items-center gap-3 px-3.5 h-[42px] rounded-[12px] glass">
              <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#D4AF37] to-[#8a6d1a] flex items-center justify-center text-[12px] font-bold text-black">₳</div>
              <div className="text-left leading-tight pr-1">
                <div className="text-[10px] tracking-widest text-white/40 mono">SALDO</div>
                <div className="mono font-bold text-[15px] tracking-tight">{balance.toLocaleString('es-AR')} <span className="text-white/40 font-normal text-[11px]">ARS</span></div>
              </div>
              <div className={`w-2 h-2 rounded-full ${balance>5000?'bg-[#00FF88]': balance>1000?'bg-yellow-400':'bg-red-500'} animate-pulse`}/>
            </div>

            <button onClick={()=>setShowDeposit(true)} className="h-[42px] px-4 lg:px-5 rounded-[12px] font-bold text-[13px] tracking-wide flex items-center gap-2 transition active:scale-[0.98]" style={{ background: `linear-gradient(90deg, ${GOLD}, #f6d76a)`, color: 'black', boxShadow: `0 0 20px rgba(212,175,55,0.25)` }}>
              <span className="hidden sm:inline">DEPOSITAR</span><span className="sm:hidden">+</span>
              <span className="w-5 h-5 rounded-full bg-black/15 flex items-center justify-center text-[14px]">↗</span>
            </button>

            <div className="w-[42px] h-[42px] rounded-[12px] bg-white/[0.06] border border-white/10 flex items-center justify-center text-[16px]">🦁</div>
          </div>
        </div>

        {/* Mobile balance */}
        <div className="sm:hidden px-4 pb-3 flex items-center justify-between">
          <div className="flex items-center gap-2 text-[11px] mono">
            <span className="text-white/40">SALDO</span>
            <span className="font-bold text-[14px]">{balance.toLocaleString('es-AR')} ARS</span>
            <span className={`w-1.5 h-1.5 rounded-full ${balance>1000?'bg-[#00FF88]':'bg-red-500'}`}/>
          </div>
          <div className="text-[10px] mono text-white/30">SOLO FICHAS DEMO</div>
        </div>
      </header>

      <div className="mx-auto max-w-[1600px] flex">
        {/* SIDEBAR */}
        <aside className={`${mobileMenu?'flex':'hidden'} lg:flex fixed lg:sticky top-[64px] lg:top-[64px] z-30 w-[300px] lg:w-[280px] h-[calc(100vh-64px)] lg:h-[calc(100vh-64px)] flex-col bg-black/80 lg:bg-transparent backdrop-blur-xl lg:backdrop-blur-0 border-r border-white/[0.06] p-4 gap-4 overflow-y-auto`}>
          <div className="space-y-3">
            <div className="text-[10px] tracking-[0.25em] text-white/30 mono px-2">JUEGOS</div>
            {[
              { id:'slots', label:'TRAGAMONEDAS', sub:'3 RODILLOS • 50x', icon:'🎰', hot:true },
              { id:'roulette', label:'RULETA EUROPEA', sub:'0-36 • 35:1', icon:'🎡', hot:false },
              { id:'blackjack', label:'BLACKJACK', sub:'21 • VS DEALER', icon:'🃏', hot:true },
              { id:'crash', label:'CRASH', sub:'MULTIPLICADOR', icon:'🚀', hot:false },
            ].map(g => (
              <button
                key={g.id}
                onClick={()=>{setActiveGame(g.id as GameType); setMobileMenu(false); setNavTick(t=>t+1);}}
                className={`group w-full text-left rounded-[16px] border p-[1px] transition-all ${activeGame===g.id?'':'border-transparent'}`}
                style={activeGame===g.id?{ background: `linear-gradient(90deg, ${GOLD}, #8a6d1a)`, boxShadow: `0 0 25px rgba(212,175,55,0.25)` }:{}}
              >
                <div className={`rounded-[15px] p-3.5 flex items-center gap-3 ${activeGame===g.id?'bg-[#141204]':'bg-white/[0.04] hover:bg-white/[0.07] border border-white/[0.06]'}`}>
                  <div className={`w-11 h-11 rounded-[12px] flex items-center justify-center text-[20px] ${activeGame===g.id?'bg-[#D4AF37] text-black':'bg-white/5 border border-white/10'}`}>{g.icon}</div>
                  <div className="flex-1 leading-tight">
                    <div className={`flex items-center gap-2 font-bold text-[13px] tracking-wide ${activeGame===g.id?'text-[#D4AF37]':'text-white'}`}>{g.label} {g.hot && <span className="text-[8px] px-1.5 py-0.5 rounded-full bg-red-500 text-white mono tracking-widest">HOT</span>}</div>
                    <div className="text-[11px] mono text-white/40 mt-0.5">{g.sub}</div>
                  </div>
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[12px] transition ${activeGame===g.id?'bg-[#D4AF37] text-black':'bg-white/5 text-white/30'}`}>›</div>
                </div>
              </button>
            ))}
          </div>

          <div className="rounded-[18px] p-[1px] bg-gradient-to-b from-[#D4AF37]/30 to-transparent">
            <div className="rounded-[17px] bg-gradient-to-b from-[#1a1808] to-[#0f0e06] p-4 border border-[#D4AF37]/10">
              <div className="flex items-center gap-2 text-[11px] mono tracking-widest text-[#D4AF37]"><span>●</span> PROMO ACTIVA</div>
              <div className="mt-2 font-bold text-[14px] leading-tight">BONO 100% DEMO<br/><span className="gold-text">HASTA 50,000 ARS</span></div>
              <div className="mt-3 h-[6px] rounded-full bg-black/60 overflow-hidden border border-white/5"><div className="h-full w-[68%]" style={{ background:`linear-gradient(90deg, ${GOLD}, #ffe9a0)` }}/></div>
              <div className="mt-2 flex justify-between text-[10px] mono text-white/40"><span>WAGER x30</span><span>68%</span></div>
            </div>
          </div>

          <div className="mt-auto rounded-[16px] glass p-3.5">
            <div className="flex items-center gap-2 text-[11px] mono text-white/50"><span className="w-5 h-5 rounded-full bg-white/10 flex items-center justify-center">🛡️</span> JUEGO RESPONSABLE</div>
            <div className="mt-2 text-[11px] leading-[1.4] text-white/40">+18 • Dinero ficticio sin valor real. Solo demostración. Si sentís que perdés el control, buscá ayuda.</div>
            <div className="mt-2 flex gap-2">
              <span className="text-[9px] mono px-2 py-1 rounded-full bg-white/5 border border-white/10">LICENCIA DEMO MGA/B2C/123</span>
              <span className="text-[9px] mono px-2 py-1 rounded-full bg-white/5 border border-white/10">RNG CERTIFICADO</span>
            </div>
          </div>

          <div className="lg:hidden pt-2">
            <button onClick={()=>setMobileMenu(false)} className="w-full h-11 rounded-xl bg-white/5 border border-white/10 mono text-[12px] tracking-widest">CERRAR MENU</button>
          </div>
        </aside>

        {/* MAIN */}
        <main className="flex-1 min-w-0 max-w-full overflow-x-hidden px-3 lg:px-6 py-4 lg:py-6" data-nav-tick={navTick}>
          {/* Top stats */}
          <div className="grid grid-cols-3 gap-2 lg:gap-3 mb-4">
            {[
              { k:'APUESTA', v:`${bet.toLocaleString('es-AR')} ARS`, c: GOLD },
              { k:'MULT', v: activeGame==='slots' ? 'Hasta 50x' : activeGame==='roulette' ? 'Hasta 35x' : activeGame==='blackjack' ? '1.5x BJ' : `${crashMult.toFixed(2)}x`, c: NEON },
              { k:'RTP', v:'96.8%', c:'#fff' },
            ].map(s=>(
              <div key={s.k} className="rounded-[14px] glass px-3 lg:px-4 py-2.5 flex items-center justify-between">
                <div className="text-[10px] mono tracking-widest text-white/40">{s.k}</div>
                <div className="mono font-bold text-[12px] lg:text-[13px]" style={{ color: s.c }}>{s.v}</div>
              </div>
            ))}
          </div>

          {/* GAME CONTAINER */}
          <div className="relative rounded-[22px] p-[1px] overflow-hidden max-w-full" style={{ background: `linear-gradient(180deg, rgba(212,175,55,0.35), rgba(255,255,255,0.06))` }}>
            <div className="rounded-[21px] bg-[#101010] overflow-hidden relative">
              {/* decorative top light */}
              <div className="absolute top-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-[#D4AF37]/60 to-transparent"/>
              <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-[600px] h-[240px] rounded-full blur-[80px] opacity-30" style={{ background:`radial-gradient(ellipse at center, ${GOLD} 0%, transparent 70%)` }}/>

              {/* SLOTS */}
              {activeGame==='slots' && (
                <div className="relative p-4 lg:p-8">
                  <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
                    <div className="flex items-center gap-3">
                      <h2 className="text-[22px] lg:text-[28px] font-black tracking-[0.06em]">TRAGAMONEDAS <span className="gold-text">MONTECARLO</span></h2>
                      <span className="hidden lg:inline-flex text-[10px] mono px-2.5 py-1 rounded-full bg-[#00FF88]/10 border border-[#00FF88]/20 text-[#00FF88]">3 RODILLOS • JACKPOT 50x</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="text-[10px] mono text-white/40">PAGO</div>
                      <div className="flex gap-1.5">
                        {SLOT_SYMBOLS.slice().reverse().map(s=>(
                          <div key={s.name} className="flex items-center gap-1 px-2 py-1 rounded-full bg-white/[0.05] border border-white/10 text-[10px] mono"><span>{s.icon}</span><span className="text-white/60">x{s.mult}</span></div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="mx-auto max-w-[720px]">
                    <div className={`relative rounded-[24px] p-2 lg:p-3 bg-[#070707] reel-shadow ${winLine?'animate-[pulseGold_0.9s_ease_2]':''}`}>
                      <div className="rounded-[18px] bg-gradient-to-b from-[#151515] to-[#0a0a0a] p-2 lg:p-3 border border-white/[0.06] relative overflow-hidden">
                        <div className={`absolute inset-0 opacity-0 ${winLine?'opacity-100':''} transition duration-700`} style={{ background:`linear-gradient(90deg, transparent, rgba(212,175,55,0.15), transparent)`, animation: winLine?'shine 0.8s ease':''}}/>
                        <div className="grid grid-cols-3 gap-2 lg:gap-3">
                          {reels.map((rIdx, i)=>(
                            <div key={i} className={`relative h-[112px] lg:h-[168px] rounded-[16px] overflow-hidden border ${SLOT_SYMBOLS[rIdx].border} ${spinning?'blur-[1px]':''} bg-gradient-to-b ${SLOT_SYMBOLS[rIdx].bg} flex items-center justify-center reel-shadow`}>
                              <div className="absolute inset-0 bg-gradient-to-b from-white/[0.06] to-transparent pointer-events-none"/>
                              <div className={`text-[48px] lg:text-[72px] leading-none select-none transition-transform duration-200 ${spinning?'scale-110 -rotate-3':''}`} style={{ filter: spinning?'blur(2px)':`drop-shadow(0 0 18px ${GOLD}40)` }}>
                                {SLOT_SYMBOLS[rIdx].icon}
                              </div>
                              <div className="absolute bottom-1.5 left-1/2 -translate-x-1/2 text-[8px] mono tracking-widest px-1.5 py-0.5 rounded bg-black/70 border border-white/10 text-white/50">{SLOT_SYMBOLS[rIdx].name}</div>
                              {winLine && <div className="absolute inset-0 border-2 rounded-[16px] border-[#D4AF37]/70 shadow-[0_0_30px_rgba(212,175,55,0.5)] pointer-events-none"/>}
                            </div>
                          ))}
                        </div>
                        {/* payline */}
                        <div className={`absolute top-1/2 left-3 right-3 h-[2px] -translate-y-1/2 pointer-events-none transition-all ${winLine?'bg-[#D4AF37] shadow-[0_0_20px_#D4AF37] h-[3px]':'bg-white/10'}`} />
                      </div>

                      <div className="mt-4 grid grid-cols-[1fr_auto_1fr] items-center gap-3">
                        <div className="flex items-center gap-2 justify-start">
                          <div className="hidden lg:flex text-[10px] mono text-white/30">LÍNEA DE PAGO CENTRAL • 3 IGUALES = PREMIO</div>
                          <div className="lg:hidden text-[10px] mono text-white/30">3 IGUALES</div>
                        </div>
                        <div className={`w-2 h-2 rounded-full ${spinning?'bg-[#00FF88] animate-ping':'bg-white/20'}`}/>
                        <div className="flex justify-end gap-2">
                          {[100,500,1000].map(v=>(
                            <button key={v} onClick={()=>setBet(v)} className={`h-9 px-3 rounded-[10px] mono text-[12px] font-bold border transition ${bet===v?'bg-[#D4AF37] text-black border-[#D4AF37] shadow-[0_0_15px_rgba(212,175,55,0.4)]':'bg-white/[0.06] border-white/10 text-white/70 hover:bg-white/[0.1]'}`}>{v}</button>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="mt-6 flex justify-center">
                      <button onClick={spinSlotsClean} disabled={spinning || balance < bet} className="group relative h-[64px] lg:h-[72px] px-10 lg:px-14 rounded-[18px] font-black tracking-[0.18em] text-[16px] lg:text-[18px] transition active:scale-[0.98] disabled:opacity-50 disabled:grayscale" style={{ background:`linear-gradient(180deg, #ffe9a0 0%, ${GOLD} 55%, #8a6d1a 100%)`, color:'black', boxShadow:`0 10px 30px rgba(212,175,55,0.35), inset 0 1px 0 rgba(255,255,255,0.6)` }}>
                        <span className="relative z-10 flex items-center gap-3">{spinning?'GIRANDO...':'GIRAR'} <span className="w-7 h-7 rounded-full bg-black/15 flex items-center justify-center text-[14px] group-active:rotate-180 transition-transform duration-500">↻</span></span>
                        <span className="absolute inset-0 rounded-[18px] bg-gradient-to-b from-white/30 to-transparent pointer-events-none"/>
                      </button>
                    </div>

                    <div className="mt-5 flex justify-center gap-2 text-[10px] mono">
                      <span className="px-2.5 py-1 rounded-full bg-white/5 border border-white/10 text-white/40">APUESTA {bet} ARS</span>
                      <span className="px-2.5 py-1 rounded-full bg-[#00FF88]/10 border border-[#00FF88]/15 text-[#00FF88]">GANANCIA MAX {bet*50} ARS</span>
                    </div>
                  </div>
                </div>
              )}

              {/* ROULETTE */}
              {activeGame==='roulette' && (
                <div className="p-4 lg:p-8 grid lg:grid-cols-[380px_1fr] gap-6">
                  <div className="order-2 lg:order-1">
                    <h2 className="text-[22px] font-black tracking-wide">RULETA <span className="gold-text">EUROPEA</span></h2>
                    <div className="mt-1 text-[11px] mono text-white/40">0-36 • PAGO 35:1 EN PLENO • 1:1 EXTERIORES</div>

                    <div className="mt-6 space-y-4">
                      <div>
                        <div className="text-[10px] mono tracking-widest text-white/30 mb-2">APUESTAS SELECCIONADAS ({rouletteBets.length}/3)</div>
                        <div className="min-h-[44px] rounded-[12px] bg-black/50 border border-white/10 p-2 flex flex-wrap gap-2">
                          {rouletteBets.length===0 && <span className="text-[11px] mono text-white/25 px-2 py-1">Elegí color, par/impar o número</span>}
                          {rouletteBets.map((b,i)=>(
                            <span key={i} className="px-2.5 py-1 rounded-full bg-[#D4AF37] text-black mono text-[11px] font-bold flex items-center gap-1">{b.type.toUpperCase()} {b.value}<button onClick={()=>placeRouletteBet(b.type,b.value)} className="ml-1 w-4 h-4 rounded-full bg-black/20 flex items-center justify-center">×</button></span>
                          ))}
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        {[
                          { t:'red', v:'red', label:'ROJO', color:'bg-red-600' },
                          { t:'black', v:'black', label:'NEGRO', color:'bg-zinc-800 border border-white/20' },
                          { t:'even', v:'even', label:'PAR', color:'bg-white/5 border border-white/10' },
                          { t:'odd', v:'odd', label:'IMPAR', color:'bg-white/5 border border-white/10' },
                          { t:'low', v:'low', label:'1-18', color:'bg-white/5 border border-white/10' },
                          { t:'high', v:'high', label:'19-36', color:'bg-white/5 border border-white/10' },
                        ].map(o=>(
                          <button key={o.t+o.v} onClick={()=>placeRouletteBet(o.t,o.v)} className={`h-[46px] rounded-[12px] mono font-bold text-[12px] tracking-wide flex items-center justify-center gap-2 transition border ${rouletteBets.some(b=>b.type===o.t && b.value===o.v)?'bg-[#D4AF37] text-black border-[#D4AF37] shadow-[0_0_15px_rgba(212,175,55,0.4)]':`${o.color} text-white hover:bg-white/10`}`}>{o.label}</button>
                        ))}
                      </div>

                      <div>
                        <div className="text-[10px] mono tracking-widest text-white/30 mb-2">NÚMEROS PLENOS (35:1)</div>
                        <div className="grid grid-cols-6 gap-1.5">
                          {Array.from({length:37},(_,n)=>n).map(n=>(
                            <button key={n} onClick={()=>placeRouletteBet('number', n)} className={`h-9 rounded-[9px] mono text-[11px] font-bold border transition ${rouletteBets.some(b=>b.type==='number'&&b.value===n)?'bg-[#D4AF37] text-black border-[#D4AF37]': n===0?'bg-green-700 text-white border-green-600': RED_NUMBERS.includes(n)?'bg-red-600/80 text-white border-red-500/50':'bg-zinc-800 text-white border-white/10'}`}>{n}</button>
                          ))}
                        </div>
                      </div>

                      <div className="flex gap-2">
                        {[100,500,1000].map(v=>(
                          <button key={v} onClick={()=>setBet(v)} className={`flex-1 h-9 rounded-[10px] mono text-[12px] font-bold border ${bet===v?'bg-white text-black border-white':'bg-white/5 border-white/10 text-white/60'}`}>{v}</button>
                        ))}
                      </div>

                      <button onClick={spinRoulette} disabled={rouletteSpinning || rouletteBets.length===0 || balance < bet*rouletteBets.length} className="w-full h-[56px] rounded-[14px] font-black tracking-[0.15em] text-[14px] disabled:opacity-40 disabled:grayscale transition active:scale-[0.99]" style={{ background:`linear-gradient(180deg, #ffe9a0, ${GOLD})`, color:'black' }}>
                        {rouletteSpinning?'GIRANDO RULETA...':`GIRAR • ${bet*rouletteBets.length} ARS`}
                      </button>
                    </div>
                  </div>

                  <div className="order-1 lg:order-2 flex flex-col items-center justify-center">
                    <div className="relative w-[300px] h-[300px] lg:w-[420px] lg:h-[420px] rounded-full p-2 bg-gradient-to-b from-[#1e1e1e] to-black border border-white/10 shadow-[0_0_80px_rgba(0,0,0,0.9)]">
                      <div className="absolute inset-0 rounded-full bg-gradient-to-b from-white/[0.06] to-transparent pointer-events-none"/>
                      {/* wheel */}
                      <div className="relative w-full h-full rounded-full overflow-hidden border-[8px] border-[#121212] bg-[#0e0e0e]" style={{ transform:`rotate(${rouletteRotation}deg)`, transition: rouletteSpinning?'transform 3s cubic-bezier(0.15,0,0.15,1)':'transform 0.6s ease' }}>
                        {Array.from({length:37}).map((_,i)=>{
                          const angle = (i*360/37);
                          const num = i;
                          const isRed = RED_NUMBERS.includes(num);
                          const bg = num===0 ? '#15803d' : isRed ? '#b91c1c' : '#111';
                          return (
                            <div key={i} className="absolute w-1/2 h-[2px] top-1/2 left-1/2 origin-left" style={{ transform:`rotate(${angle}deg)` }}>
                              <div className="absolute right-0 -top-[14px] w-[28px] h-[28px] rounded-full flex items-center justify-center text-[9px] mono font-bold border border-white/10" style={{ background:bg, transform:`rotate(${-angle}deg)` }}>{num}</div>
                            </div>
                          );
                        })}
                        <div className="absolute inset-[28%] rounded-full bg-gradient-to-b from-[#222] to-black border border-white/10 shadow-inner flex items-center justify-center">
                          <div className="w-[60%] h-[60%] rounded-full bg-gradient-to-b from-[#D4AF37] to-[#6b5210] shadow-[0_0_20px_rgba(212,175,55,0.5)]"/>
                        </div>
                      </div>
                      {/* ball */}
                      <div className="absolute top-1/2 left-1/2 w-4 h-4 -ml-2 -mt-2 rounded-full bg-white shadow-[0_0_12px_white] border border-black/20" style={{ transform:`rotate(${-rouletteRotation*1.2}deg) translateX(140px)`, transition: rouletteSpinning?'transform 3s cubic-bezier(0.2,0,0.2,1)':'transform 0.5s ease' }}/>
                      {/* pointer */}
                      <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[10px] border-r-[10px] border-t-[16px] border-l-transparent border-r-transparent border-t-[#D4AF37] drop-shadow-[0_0_10px_rgba(212,175,55,0.8)]"/>
                    </div>

                    <div className="mt-6 flex items-center gap-3">
                      <div className="px-4 h-10 rounded-full bg-black border border-white/10 flex items-center gap-3 mono">
                        <span className="text-[10px] text-white/40 tracking-widest">ÚLTIMO</span>
                        <span className={`w-7 h-7 rounded-full flex items-center justify-center text-[12px] font-bold ${rouletteNumber===0?'bg-green-600': RED_NUMBERS.includes(rouletteNumber||0)?'bg-red-600':'bg-zinc-700'} text-white`}>{rouletteNumber}</span>
                        <span className="text-[12px] font-bold">{rouletteNumber===0?'VERDE': RED_NUMBERS.includes(rouletteNumber||0)?'ROJO':'NEGRO'}</span>
                      </div>
                      <div className={`w-2 h-2 rounded-full ${rouletteSpinning?'bg-[#00FF88] animate-ping':'bg-white/20'}`}/>
                    </div>
                  </div>
                </div>
              )}

              {/* BLACKJACK */}
              {activeGame==='blackjack' && (
                <div className="p-4 lg:p-8">
                  <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
                    <h2 className="text-[22px] font-black">BLACKJACK <span className="gold-text">21</span></h2>
                    <div className="flex items-center gap-2 text-[10px] mono">
                      <span className="px-2.5 py-1 rounded-full bg-white/5 border border-white/10 text-white/50">DEALER SE PLANTA EN 17</span>
                      <span className="px-2.5 py-1 rounded-full bg-[#00FF88]/10 border border-[#00FF88]/20 text-[#00FF88]">BLACKJACK PAGA 3:2</span>
                    </div>
                  </div>

                  <div className="mx-auto max-w-[860px] rounded-[20px] bg-[#0a2a12]/20 border border-[#00FF88]/10 p-4 lg:p-6 relative overflow-hidden">
                    <div className="absolute inset-0 opacity-[0.04]" style={{ backgroundImage:`radial-gradient(circle at 1px 1px, white 1px, transparent 0)`, backgroundSize:'22px 22px' }}/>
                    {/* Dealer */}
                    <div className="relative">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-8 h-8 rounded-full bg-black/60 border border-white/10 flex items-center justify-center text-[12px]">♠</div>
                        <div className="mono text-[12px] tracking-widest"><span className="text-white/40">DEALER</span> <span className="ml-2 font-bold">{dealerHand.length? (bjState==='player' ? `${dealerHand[0]?.value ?? ''} + ?` : calcHand(dealerHand)) : '-'}</span></div>
                      </div>
                      <div className="flex gap-2 min-h-[96px]">
                        {dealerHand.map((c,i)=>(
                          <div key={c.id} className={`w-[68px] h-[96px] rounded-[10px] bg-white text-black flex flex-col p-1.5 shadow-lg border border-black/10 ${bjState==='player' && i===1?'bg-zinc-900 !text-white border-white/10':''}`} style={{ transform:`rotate(${(i-1)*1.2}deg)` }}>
                            {bjState==='player' && i===1 ? (
                              <div className="flex-1 flex items-center justify-center text-[22px]">🂠</div>
                            ) : (
                              <>
                                <div className={`text-[13px] font-black leading-none ${['♥','♦'].includes(c.suit)?'text-red-600':''}`}>{c.rank}<span className="text-[10px]">{c.suit}</span></div>
                                <div className="flex-1 flex items-center justify-center text-[28px]">{c.suit}</div>
                                <div className={`text-[10px] font-bold self-end rotate-180 ${['♥','♦'].includes(c.suit)?'text-red-600':''}`}>{c.rank}{c.suit}</div>
                              </>
                            )}
                          </div>
                        ))}
                        {dealerHand.length===0 && <div className="text-[11px] mono text-white/20 px-2 py-6">Esperando apuesta...</div>}
                      </div>
                    </div>

                    <div className="my-6 h-[1px] bg-gradient-to-r from-transparent via-white/10 to-transparent"/>

                    {/* Player */}
                    <div className="relative">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-8 h-8 rounded-full bg-[#D4AF37] text-black flex items-center justify-center text-[12px] font-black">TÚ</div>
                        <div className="mono text-[12px] tracking-widest"><span className="text-white/40">JUGADOR</span> <span className="ml-2 font-bold">{playerHand.length? calcHand(playerHand):'-'}</span> {bjMessage && <span className="ml-3 text-[#00FF88]">• {bjMessage}</span>}</div>
                      </div>
                      <div className="flex gap-2 min-h-[96px] flex-wrap">
                        {playerHand.map((c,i)=>(
                          <div key={c.id} className="w-[68px] h-[96px] rounded-[10px] bg-white text-black flex flex-col p-1.5 shadow-lg border border-black/10" style={{ transform:`rotate(${(i-1)*1.5}deg)` }}>
                            <div className={`text-[13px] font-black leading-none ${['♥','♦'].includes(c.suit)?'text-red-600':''}`}>{c.rank}<span className="text-[10px]">{c.suit}</span></div>
                            <div className="flex-1 flex items-center justify-center text-[28px]">{c.suit}</div>
                            <div className={`text-[10px] font-bold self-end rotate-180 ${['♥','♦'].includes(c.suit)?'text-red-600':''}`}>{c.rank}{c.suit}</div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="mt-8 flex flex-wrap items-center justify-between gap-3">
                      <div className="flex gap-2">
                        {[100,500,1000].map(v=>(
                          <button key={v} disabled={bjState!=='betting'} onClick={()=>setBet(v)} className={`h-9 px-3 rounded-[10px] mono text-[12px] font-bold border disabled:opacity-30 ${bet===v?'bg-white text-black':'bg-white/5 border-white/10 text-white/60'}`}>{v}</button>
                        ))}
                      </div>

                      <div className="flex gap-2">
                        {bjState==='betting' ? (
                          <button onClick={startBlackjack} disabled={balance<bet} className="h-11 px-6 rounded-[12px] font-black tracking-widest text-[12px] bg-[#D4AF37] text-black disabled:opacity-40">REPARTIR • {bet} ARS</button>
                        ) : bjState==='player' ? (
                          <>
                            <button onClick={hit} className="h-11 px-5 rounded-[12px] font-bold text-[12px] bg-white text-black">PEDIR</button>
                            <button onClick={stand} className="h-11 px-5 rounded-[12px] font-bold text-[12px] bg-white/10 border border-white/20 text-white">PLANTARSE</button>
                            <button onClick={doubleDown} disabled={playerHand.length!==2 || balance<bet} className="h-11 px-5 rounded-[12px] font-bold text-[12px] bg-[#00FF88] text-black disabled:opacity-30">DOBLAR x2</button>
                          </>
                        ) : (
                          <button onClick={()=>{setBjState('betting'); setPlayerHand([]); setDealerHand([]);}} className="h-11 px-6 rounded-[12px] font-bold text-[12px] bg-white/10 border border-white/20">NUEVA MANO</button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* CRASH */}
              {activeGame==='crash' && (
                <div className="p-4 lg:p-8">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-[22px] font-black">CRASH <span className="text-[#00FF88]">🚀</span></h2>
                    <div className="flex items-center gap-2 text-[10px] mono"><span className="px-2.5 py-1 rounded-full bg-[#00FF88]/10 border border-[#00FF88]/20 text-[#00FF88]">MULTIPLICADOR EN VIVO</span><span className="px-2.5 py-1 rounded-full bg-white/5 border border-white/10 text-white/40">RTP 97%</span></div>
                  </div>

                  <div className="mx-auto max-w-[720px] rounded-[20px] bg-[#070707] border border-white/10 p-4 lg:p-6 relative overflow-hidden">
                    <div className="h-[280px] lg:h-[340px] rounded-[16px] bg-gradient-to-b from-[#0f1a0f] to-black border border-[#00FF88]/10 relative overflow-hidden flex items-center justify-center">
                      <div className="absolute inset-0">
                        <svg className="w-full h-full" viewBox="0 0 400 200" preserveAspectRatio="none">
                          <path d={`M 0 180 Q ${Math.min(350, crashMult*35)} ${180 - Math.min(160, crashMult*28)} 400 ${180 - Math.min(170, crashMult*30)}`} stroke={crashPlaying? '#00FF88' : crashCashed ? '#D4AF37' : '#333'} strokeWidth="3" fill="none" strokeLinecap="round"/>
                          <path d={`M 0 180 Q ${Math.min(350, crashMult*35)} ${180 - Math.min(160, crashMult*28)} 400 ${180 - Math.min(170, crashMult*30)} L 400 200 L 0 200 Z`} fill={crashPlaying? 'rgba(0,255,136,0.08)' : 'rgba(255,255,255,0.02)'}/>
                        </svg>
                      </div>
                      <div className="relative z-10 text-center">
                        <div className={`mono font-black text-[56px] lg:text-[72px] leading-none tracking-tighter ${crashPlaying?'text-[#00FF88]': crashCashed?'text-[#D4AF37]':'text-white/20'}`} style={{ textShadow: crashPlaying?`0 0 30px ${NEON}80`:'' }}>{crashMult.toFixed(2)}x</div>
                        <div className="mt-2 mono text-[11px] tracking-[0.2em] text-white/40">{crashPlaying?'VOLANDO...': crashCashed?'RETIRADO':'ESPERANDO APUESTA'}</div>
                        <div className="mt-4 text-[42px] animate-[float_2s_ease_infinite]">{crashPlaying?'🚀': crashCashed?'💰':'🛰️'}</div>
                      </div>
                      {!crashPlaying && !crashCashed && (
                        <div className="absolute bottom-3 left-3 right-3 flex justify-between text-[10px] mono text-white/20"><span>1.00x INICIO</span><span>CRASH ALEATORIO</span></div>
                      )}
                    </div>

                    <div className="mt-5 grid grid-cols-3 gap-2">
                      {[100,500,1000].map(v=>(
                        <button key={v} disabled={crashPlaying} onClick={()=>setBet(v)} className={`h-10 rounded-[10px] mono text-[12px] font-bold border disabled:opacity-30 ${bet===v?'bg-[#00FF88] text-black border-[#00FF88]':'bg-white/5 border-white/10 text-white/60'}`}>{v} ARS</button>
                      ))}
                    </div>

                    <div className="mt-3 grid grid-cols-2 gap-3">
                      <button onClick={startCrash} disabled={crashPlaying || balance<bet} className="h-[54px] rounded-[12px] font-black tracking-widest text-[13px] bg-white text-black disabled:opacity-30">APOSTAR • {bet} ARS</button>
                      <button onClick={cashoutCrash} disabled={!crashPlaying} className="h-[54px] rounded-[12px] font-black tracking-widest text-[13px] bg-[#00FF88] text-black disabled:opacity-20 disabled:grayscale">RETIRAR @ {crashMult.toFixed(2)}x</button>
                    </div>

                    <div className="mt-4 text-center mono text-[10px] text-white/30">Retirá antes del crash. Si crashea, perdés la apuesta. Ganancia = apuesta × multiplicador.</div>
                  </div>
                </div>
              )}

              {isBroke && (
                <div className="absolute inset-0 z-20 bg-black/80 backdrop-blur-md flex items-center justify-center p-6">
                  <div className="max-w-[380px] w-full rounded-[20px] p-[1px] bg-gradient-to-b from-[#D4AF37] to-[#8a6d1a]">
                    <div className="rounded-[19px] bg-[#12110a] p-6 text-center">
                      <div className="w-12 h-12 mx-auto rounded-full bg-[#D4AF37]/20 border border-[#D4AF37]/30 flex items-center justify-center text-[20px]">🪙</div>
                      <div className="mt-3 font-black text-[18px]">TE QUEDASTE SIN FICHAS</div>
                      <div className="mt-1 text-[12px] mono text-white/50">Recargá saldo demo para seguir jugando. Sin valor real.</div>
                      <button onClick={()=>{setBalance(10000); setShowResult(null);}} className="mt-5 w-full h-11 rounded-[12px] font-black tracking-widest text-[12px] bg-[#D4AF37] text-black">RECARGAR 10,000 ARS DEMO</button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* HISTORY */}
          <div className="mt-5 rounded-[18px] glass overflow-hidden max-w-full">
            <div className="flex items-center justify-between px-4 lg:px-5 h-[46px] border-b border-white/5">
              <div className="flex items-center gap-2 text-[11px] mono tracking-widest text-white/60"><span className="w-1.5 h-1.5 rounded-full bg-[#00FF88]"/> HISTORIAL • ULTIMAS JUGADAS</div>
              <div className="text-[10px] mono text-white/30">SOLO FICHAS DEMO • SIN VALOR REAL</div>
            </div>
            <div className="overflow-x-auto scrollbar-hide max-w-full">
              <table className="w-full text-left min-w-[520px]">
                <thead className="text-[10px] mono tracking-widest text-white/30 border-b border-white/5">
                  <tr><th className="px-4 lg:px-5 py-2.5 font-normal">HORA</th><th className="px-3 py-2.5 font-normal">JUEGO</th><th className="px-3 py-2.5 font-normal">APUESTA</th><th className="px-3 py-2.5 font-normal">RESULTADO</th><th className="px-4 lg:px-5 py-2.5 font-normal text-right">PROFIT</th></tr>
                </thead>
                <tbody>
                  {history.map(h=>(
                    <tr key={h.id} className="border-b border-white/[0.03] hover:bg-white/[0.02] transition">
                      <td className="px-4 lg:px-5 py-3 mono text-[11px] text-white/40">{h.time}</td>
                      <td className="px-3 py-3"><span className="text-[10px] mono px-2 py-1 rounded-full bg-white/5 border border-white/10">{h.game}</span></td>
                      <td className="px-3 py-3 mono text-[12px]">{h.bet.toLocaleString('es-AR')}</td>
                      <td className="px-3 py-3 text-[12px] mono text-white/70 max-w-[160px] truncate">{h.result}</td>
                      <td className={`px-4 lg:px-5 py-3 mono text-[12px] font-bold text-right ${h.profit>=0?'text-[#00FF88]':'text-red-400'}`}>{h.profit>=0?'+':''}{h.profit.toLocaleString('es-AR')} ARS</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="mt-4 rounded-[14px] bg-[#0f0f0f] border border-white/5 px-4 py-3 flex flex-wrap items-center gap-3 text-[10px] mono text-white/30">
            <span className="px-2 py-1 rounded-full bg-white/5 border border-white/10">+18</span>
            <span>JUEGO RESPONSABLE • Dinero ficticio • Demo sin valor monetario • Licencia demo MGA/B2C/123 • RNG certificado • No es un casino real.</span>
            <span className="ml-auto flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-[#00FF88] animate-pulse"/>MONTECARLO PREMIUM DEMO v1.0</span>
          </div>
        </main>
      </div>

      {/* RESULT MODAL */}
      {showResult && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-[6px]" onClick={()=>setShowResult(null)}/>
          <div className="relative w-full max-w-[380px] rounded-[24px] p-[1px]" style={{ background: showResult.win?`linear-gradient(180deg, ${GOLD}, #6b5210)`:'linear-gradient(180deg, #3a1010, #1a0a0a)' }}>
            <div className="rounded-[23px] bg-[#111] p-6 lg:p-7 text-center overflow-hidden relative">
              <div className="absolute -top-20 left-1/2 -translate-x-1/2 w-[300px] h-[200px] rounded-full blur-[40px] opacity-40" style={{ background: showResult.win? GOLD : '#ff2a2a' }}/>
              <div className="relative">
                <div className={`mx-auto w-[64px] h-[64px] rounded-full flex items-center justify-center text-[28px] border ${showResult.win?'bg-[#D4AF37]/20 border-[#D4AF37]/40':'bg-red-500/15 border-red-500/30'}`}>{showResult.win?'💎':'💥'}</div>
                <div className={`mt-4 font-black text-[22px] tracking-wide ${showResult.win?'gold-text':'text-white'}`}>{showResult.win?'¡GANASTE!':'PERDISTE'}</div>
                <div className="mt-1 mono text-[11px] tracking-widest text-white/40">{showResult.msg}</div>
                <div className={`mt-5 mono font-black text-[32px] ${showResult.win?'text-[#D4AF37]':'text-white/70'}`}>{showResult.win?'+':''}{showResult.win? showResult.amount.toLocaleString('es-AR') : showResult.amount.toLocaleString('es-AR')} <span className="text-[14px] font-normal text-white/40">ARS</span></div>
                <div className="mt-1 text-[11px] mono text-white/30">{showResult.win?'Ganancia neta • Fichas demo':'Se descontó de tu saldo demo'}</div>

                <div className="mt-6 grid grid-cols-2 gap-2">
                  <button onClick={()=>setShowResult(null)} className="h-11 rounded-[12px] bg-white/5 border border-white/10 mono text-[11px] tracking-widest font-bold">CERRAR</button>
                  <button onClick={()=>setShowResult(null)} className="h-11 rounded-[12px] mono text-[11px] tracking-widest font-black" style={{ background: showResult.win? `linear-gradient(90deg, ${GOLD}, #ffe9a0)` : '#fff', color:'black' }}>SEGUIR JUGANDO</button>
                </div>

                <div className="mt-4 text-[9px] mono text-white/20 leading-tight">* Dinero ficticio sin valor real. Solo demostración. +18 Juego Responsable.</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* DEPOSIT MODAL */}
      {showDeposit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-[8px]" onClick={()=>setShowDeposit(false)}/>
          <div className="relative w-full max-w-[420px] rounded-[22px] p-[1px] bg-gradient-to-b from-[#D4AF37]/40 to-white/5">
            <div className="rounded-[21px] bg-[#111] p-6">
              <div className="flex items-center justify-between">
                <div className="font-black tracking-wide">DEPOSITAR <span className="gold-text">DEMO</span></div>
                <button onClick={()=>setShowDeposit(false)} className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center">×</button>
              </div>
              <div className="mt-2 text-[11px] mono text-white/40">Simulado • Se agregan fichas ficticias sin valor real a tu saldo.</div>

              <div className="mt-5 grid grid-cols-3 gap-2">
                {[5000,10000,25000].map(v=>(
                  <button key={v} onClick={()=>{setBalance(b=>b+v); setShowDeposit(false);}} className="rounded-[14px] border border-white/10 bg-white/[0.04] p-3 text-left hover:bg-white/[0.07] transition">
                    <div className="text-[11px] mono text-white/40">PAQUETE</div>
                    <div className="mono font-black text-[16px] mt-1">{v.toLocaleString('es-AR')}</div>
                    <div className="text-[10px] mono text-[#D4AF37] mt-1">+{Math.floor(v*0.2)} BONUS DEMO</div>
                  </button>
                ))}
              </div>

              <div className="mt-4 rounded-[12px] bg-[#D4AF37]/10 border border-[#D4AF37]/20 p-3 flex gap-2 text-[11px] leading-snug">
                <span>🛡️</span>
                <span className="text-white/60">No se solicita dinero real. Todo el saldo es ficticio. Este es un demo educativo estilo Stake / Roobet con fines de demostración UI.</span>
              </div>

              <div className="mt-4 flex gap-2">
                <button onClick={()=>setShowDeposit(false)} className="flex-1 h-11 rounded-[12px] bg-white/5 border border-white/10 mono text-[11px] tracking-widest font-bold">CANCELAR</button>
                <button onClick={()=>{setBalance(b=>b+10000); setShowDeposit(false);}} className="flex-1 h-11 rounded-[12px] font-black tracking-widest text-[11px] bg-[#D4AF37] text-black">RECARGAR 10,000 DEMO</button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
