import { useState, useEffect } from 'react';

// 🎨 ポケモンのタイプに応じた背景色・文字色の定義
const TYPE_COLORS = {
  NORMAL: { bg: '#A8A77A', text: '#fff' },
  FIRE: { bg: '#EE8130', text: '#fff' },
  WATER: { bg: '#6390F0', text: '#fff' },
  ELECTRIC: { bg: '#F7D02C', text: '#333' },
  GRASS: { bg: '#7AC74C', text: '#fff' },
  ICE: { bg: '#96D9D6', text: '#333' },
  FIGHTING: { bg: '#C22E28', text: '#fff' },
  POISON: { bg: '#A33EA1', text: '#fff' },
  GROUND: { bg: '#E2BF65', text: '#333' },
  FLYING: { bg: '#A98FF3', text: '#fff' },
  PSYCHIC: { bg: '#F95587', text: '#fff' },
  BUG: { bg: '#A6B91A', text: '#fff' },
  ROCK: { bg: '#B6A136', text: '#fff' },
  GHOST: { bg: '#705746', text: '#fff' },
  DRAGON: { bg: '#6F35FC', text: '#fff' },
  DARK: { bg: '#705746', text: '#fff' },
  STEEL: { bg: '#B7B7CE', text: '#333' },
  FAIRY: { bg: '#D685AD', text: '#fff' },
};

// 🗺️ タイプの日本語変換マップ
const TYPE_JA = {
  NORMAL: 'ノーマル', FIRE: 'ほのお', WATER: 'みず', ELECTRIC: 'でんき',
  GRASS: 'くさ', ICE: 'こおり', FIGHTING: 'かくとう', POISON: 'どく',
  GROUND: 'じめん', FLYING: 'ひこう', PSYCHIC: 'エスパー', BUG: 'むし',
  ROCK: 'いわ', GHOST: 'ゴースト', DRAGON: 'ドラゴン', DARK: 'あく',
  STEEL: 'はがね', FAIRY: 'フェアリー'
};

function App() {
  const [currentMode, setCurrentMode] = useState('pokedex');
  const [allPokemon, setAllPokemon] = useState([]);
  const [selectedPokemon, setSelectedPokemon] = useState(null);
  const [quizPokemon, setQuizPokemon] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isShiny, setIsShiny] = useState(false);
  const [isQuizMode, setIsQuizMode] = useState(true);

  // 📱 スマホかどうかを判定するための画面幅ステート
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);

  useEffect(() => {
    // 画面サイズが変更されたら幅を更新するイベント
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    
    const initPokedex = () => {
      setLoading(true);
      const list = [];
      for (let i = 1; i <= 1025; i++) {
        list.push({
          id: i,
          sprite: `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${i}.png`,
          shinySprite: `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/shiny/${i}.png`
        });
      }
      setAllPokemon(list);
      fetchDetailedPokemon(1, 'pokedex');
      setLoading(false);
    };
    initPokedex();

    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const isMobile = windowWidth <= 768; // 768px以下をスマホとして扱う

  const fetchDetailedPokemon = async (id, mode) => {
    try {
      const response = await fetch(`https://pokeapi.co/api/v2/pokemon/${id}`);
      const data = await response.json();

      const speciesResponse = await fetch(data.species.url);
      const speciesData = await speciesResponse.json();
      const japaneseNameObj = speciesData.names.find(n => n.language.name === 'ja');
      const japaneseName = japaneseNameObj ? japaneseNameObj.name : data.name.toUpperCase();

      if (mode === 'quiz') {
        const shinyRoll = Math.floor(Math.random() * 100) === 0;
        setIsShiny(shinyRoll);
      } else {
        setIsShiny(false);
      }

      const typeJa = data.types
        .map(t => {
          const engType = t.type.name.toUpperCase();
          return TYPE_JA[engType] || engType;
        })
        .join(' / ');

      const pokemonData = {
        id: data.id,
        name: japaneseName,
        normalSprite: data.sprites.front_default,
        shinySprite: data.sprites.front_shiny,
        type: typeJa,
        primaryType: data.types[0]?.type.name.toUpperCase(), 
        height: data.height / 10,
        weight: data.weight / 10,
        cry: data.cries?.latest || data.cries?.legacy
      };

      if (mode === 'pokedex') {
        setSelectedPokemon(pokemonData);
      } else {
        setQuizPokemon(pokemonData);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const startNewQuiz = async () => {
    setLoading(true);
    setIsQuizMode(true);
    const randomId = Math.floor(Math.random() * 1025) + 1;
    await fetchDetailedPokemon(randomId, 'quiz');
    setLoading(false);
  };

  const playCry = (url) => {
    if (url) {
      const audio = new Audio(url);
      audio.volume = 0.3;
      audio.play().catch(err => console.log(err));
    }
  };

  const playCorrectSound = () => {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(523.25, ctx.currentTime);
    osc.frequency.setValueAtTime(659.25, ctx.currentTime + 0.1);
    osc.frequency.setValueAtTime(783.99, ctx.currentTime + 0.2);
    osc.frequency.setValueAtTime(1046.50, ctx.currentTime + 0.3);
    gain.gain.setValueAtTime(0.1, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.4);
  };

  const handleReveal = () => {
    if (isQuizMode) {
      setIsQuizMode(false);
      playCorrectSound();
    }
  };

  const handleModeChange = (mode) => {
    setCurrentMode(mode);
    if (mode === 'quiz' && !quizPokemon) {
      startNewQuiz();
    }
  };

  const getQuizCardStyle = () => {
    const defaultStyle = {
      background: '#f5f5f5',
      color: '#333'
    };

    if (isQuizMode || !quizPokemon) {
      return defaultStyle;
    }

    const typeColor = TYPE_COLORS[quizPokemon.primaryType];
    if (typeColor) {
      return {
        background: typeColor.bg,
        color: typeColor.text,
        transition: 'background 0.5s ease, color 0.5s ease'
      };
    }

    return defaultStyle;
  };

  return (
    <div style={{ padding: isMobile ? '10px' : '20px', width: '100%', maxWidth: '1200px', margin: '0 auto', fontFamily: 'sans-serif', boxSizing: 'border-box' }}>
      
      {/* 🧭 タブメニュー */}
      <div style={{ display: 'flex', gap: '15px', width: '100%', maxWidth: '400px', marginBottom: '20px', margin: '0 auto 20px auto' }}>
        <button onClick={() => handleModeChange('pokedex')} style={{ flex: 1, padding: '12px', fontSize: '1rem', fontWeight: 'bold', cursor: 'pointer', borderRadius: '8px', border: 'none', backgroundColor: currentMode === 'pokedex' ? '#2a75d3' : '#fff', color: currentMode === 'pokedex' ? '#fff' : '#333', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
          📖 ポケモン図鑑
        </button>
        <button onClick={() => handleModeChange('quiz')} style={{ flex: 1, padding: '12px', fontSize: '1rem', fontWeight: 'bold', cursor: 'pointer', borderRadius: '8px', border: 'none', backgroundColor: currentMode === 'quiz' ? '#e91e63' : '#fff', color: currentMode === 'quiz' ? '#fff' : '#333', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
          🧠 シルエットクイズ
        </button>
      </div>

      {loading && allPokemon.length === 0 ? (
        <h3 style={{ color: '#333', textAlign: 'center' }}>ぜんこく図鑑 準備中...</h3>
      ) : (
        <div>
          {/* ==================== 📖 図鑑モード ==================== */}
          {currentMode === 'pokedex' && (
            <div style={{ 
              display: 'flex', 
              flexDirection: isMobile ? 'column' : 'row', // 📱スマホなら縦並び、PCなら横並び
              gap: isMobile ? '20px' : '40px', 
              alignItems: isMobile ? 'center' : 'flex-start', 
              justifyContent: 'center' 
            }}>
              
              {/* 👈 左側：図鑑リスト */}
              <div style={{ 
                width: '100%',
                maxWidth: isMobile ? '100%' : '400px', // 📱スマホなら画面いっぱいに広げる
                flexShrink: 0,
                display: 'grid', 
                gridTemplateColumns: isMobile ? 'repeat(4, 1fr)' : 'repeat(4, 1fr)', // 📱スマホでも見やすく4列
                gap: '8px', 
                backgroundColor: '#fff', 
                padding: '12px', 
                borderRadius: '8px', 
                height: isMobile ? '35vh' : '560px', // 📱スマホなら高さを少し抑える
                overflowY: 'scroll', 
                border: '3px solid #2a75d3',
                boxSizing: 'border-box'
              }}>
                {allPokemon.map((p) => (
                  <div 
                    key={p.id} 
                    onClick={() => fetchDetailedPokemon(p.id, 'pokedex')}
                    style={{ 
                      padding: '5px', 
                      cursor: 'pointer', 
                      borderRadius: '6px', 
                      backgroundColor: selectedPokemon?.id === p.id ? '#ffe082' : '#f9f9f9', 
                      border: selectedPokemon?.id === p.id ? '2px solid #ffb300' : '1px solid #eee',
                      textAlign: 'center'
                    }}
                  >
                    <img 
                      src={p.sprite} 
                      alt="" 
                      style={{ width: '100%', maxWidth: '65px', height: 'auto', imageRendering: 'pixelated', display: 'block', margin: '0 auto' }} 
                    />
                    <span style={{ fontSize: '0.7rem', color: '#666', display: 'block', fontWeight: 'bold' }}>No.{p.id}</span>
                  </div>
                ))}
              </div>

              {/* 👉 右側：詳細カード */}
              {selectedPokemon && (
                <div style={{ 
                  width: '100%',
                  maxWidth: isMobile ? '100%' : '420px', // 📱スマホなら横幅いっぱいに
                  backgroundColor: '#f5f5f5', 
                  padding: '25px', 
                  borderRadius: '16px', 
                  color: '#333', 
                  boxSizing: 'border-box',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                  textAlign: 'center'
                }}>
                  <span style={{ fontSize: '0.9rem', color: '#777', fontWeight: 'bold', display: 'block', marginBottom: '10px' }}>No.{selectedPokemon.id}</span>
                  <img src={isShiny ? selectedPokemon.shinySprite : selectedPokemon.normalSprite} alt="" style={{ width: '150px', height: '150px', imageRendering: 'pixelated', display: 'block', margin: '0 auto 15px auto' }} />
                  <h2 style={{ margin: '0 0 15px 0', fontSize: '2rem', fontWeight: 'bold', color: '#2c3e50' }}>{selectedPokemon.name}</h2>
                  <div style={{ borderTop: '1px solid #ddd', paddingTop: '15px', fontSize: '1.05rem', color: '#444', display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px' }}>
                    <div><b>タイプ:</b> {selectedPokemon.type || 'ロード中...'}</div>
                    <div><b>サイズ:</b> {selectedPokemon.height}m / {selectedPokemon.weight}kg</div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <button onClick={() => setIsShiny(!isShiny)} style={{ width: '100%', padding: '10px', fontSize: '0.95rem', fontWeight: 'bold', cursor: 'pointer', borderRadius: '6px', border: '1px solid #ff9800', backgroundColor: '#fff', color: '#e65100' }}>🎨 すがたを切り替える ({isShiny ? 'いろちがい' : 'つうじょう'})</button>
                    <button onClick={() => playCry(selectedPokemon.cry)} style={{ width: '100%', padding: '10px', fontSize: '0.95rem', cursor: 'pointer', borderRadius: '6px', border: '1px solid #ccc', backgroundColor: '#fff', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>📢 なきごえ</button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ==================== 🧠 クイズモード ==================== */}
          {currentMode === 'quiz' && quizPokemon && (
            <div style={{ 
              padding: '25px', 
              borderRadius: '16px', 
              width: '100%',
              maxWidth: '420px', 
              margin: '0 auto', 
              textAlign: 'center',
              boxShadow: '0 4px 15px rgba(0,0,0,0.2)',
              ...getQuizCardStyle(),
              boxSizing: 'border-box'
            }}>
              <span style={{ fontSize: '0.9rem', fontWeight: 'bold', opacity: 0.8 }}>{isQuizMode ? "No. ???" : `No.${quizPokemon.id}`}</span>
              <img src={isShiny ? quizPokemon.shinySprite : quizPokemon.normalSprite} alt="" style={{ width: '150px', height: '150px', imageRendering: 'pixelated', display: 'block', margin: '15px auto', filter: isQuizMode ? 'brightness(0)' : 'none' }} />
              <h2 style={{ margin: '0 0 15px 0', fontSize: '2rem', fontWeight: 'bold' }}>{isQuizMode ? "？？？？？" : quizPokemon.name}</h2>
              
              {isQuizMode ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <button onClick={() => playCry(quizPokemon.cry)} style={{ width: '100%', padding: '10px', backgroundColor: '#fff', border: '1px solid #ccc', borderRadius: '6px', color: '#333', fontWeight: 'bold', cursor: 'pointer' }}>📢 なきごえを聴く（ヒント）</button>
                  <button onClick={handleReveal} style={{ width: '100%', padding: '12px', backgroundColor: '#4caf50', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}>🎯 こたえをみる！</button>
                </div>
              ) : (
                <div>
                  <div style={{ fontSize: '1.05rem', margin: '15px 0', borderTop: '1px solid rgba(255,255,255,0.4)', paddingTop: '15px' }}>
                    <div><b>タイプ:</b> {quizPokemon.type}</div>
                    <div><b>サイズ:</b> {quizPokemon.height}m / {quizPokemon.weight}kg</div>
                  </div>
                  <button onClick={startNewQuiz} style={{ width: '100%', padding: '12px', backgroundColor: '#ffcb05', color: '#2a75d3', border: 'none', borderRadius: '20px', fontWeight: 'bold', cursor: 'pointer', boxShadow: '0 4px rgba(0,0,0,0.1)' }}>次のクイズへ！</button>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default App;