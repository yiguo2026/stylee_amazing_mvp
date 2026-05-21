'use client';

import { useState, useEffect, createContext, useContext, useCallback } from 'react';

type ToastCtx = { show: (msg: string) => void };
const ToastContext = createContext<ToastCtx>({ show: () => {} });
export const useToast = () => useContext(ToastContext);

type AppState = {
  user: any | null;
  activeTab: 'outfit' | 'wardrobe' | 'profile';
  showOnboarding: boolean;
  showLanding: boolean;
  showLogin: boolean;
  weather: { city: string; temperature: number; weatherType: string; icon: string; desc: string; tip: string };
  wardrobeItems: any[];
  outfits: any[];
  loading: boolean;
};

const defaultWeather = { city: '北京', temperature: 22, weatherType: '晴', icon: '☀️', desc: '晴', tip: '体感 20°C · 建议薄外套 + 长裤' };

export default function Home() {
  const [state, setState] = useState<AppState>({
    user: null, activeTab: 'outfit', showOnboarding: false, showLanding: true, showLogin: false, weather: defaultWeather, wardrobeItems: [], outfits: [], loading: true,
  });
  const [toast, setToast] = useState({ visible: false, msg: '' });
  const [subpage, setSubpage] = useState<string | null>(null);
  const [subpageData, setSubpageData] = useState<any>(null);

  const showToast = useCallback((msg: string) => {
    setToast({ visible: true, msg });
    setTimeout(() => setToast({ visible: false, msg: '' }), 2000);
  }, []);

  const [clock, setClock] = useState('');
  useEffect(() => {
    const update = () => { const now = new Date(); setClock(String(now.getHours()).padStart(2, '0') + ':' + String(now.getMinutes()).padStart(2, '0')); };
    update(); const interval = setInterval(update, 60000); return () => clearInterval(interval);
  }, []);

  const loadUserData = useCallback(async () => {
    try {
      const [uRes, wRes, oRes] = await Promise.all([
        fetch('/api/user', { credentials: 'include' }),
        fetch('/api/wardrobe', { credentials: 'include' }),
        fetch('/api/outfit', { credentials: 'include' }),
      ]);
      if (uRes.ok) {
        const uData = await uRes.json();
        if (uData.user) {
          const wData = wRes.ok ? await wRes.json() : { items: [] };
          const oData = oRes.ok ? await oRes.json() : { outfits: [] };
          setState(s => ({ ...s, user: uData.user, showLanding: false, showLogin: false, showOnboarding: !uData.user.onboardingDone, wardrobeItems: wData.items || [], outfits: oData.outfits || [], loading: false }));
          return;
        }
      }
    } catch (e) {
      console.error('loadUserData error:', e);
    }
    setState(s => ({ ...s, loading: false, showLogin: false }));
  }, []);

  useEffect(() => { loadUserData(); }, [loadUserData]);

  const updateWeather = useCallback(async (city: string) => {
    try {
      const r = await fetch(`/api/weather?city=${encodeURIComponent(city)}`);
      const d = await r.json();
      if (d.city) setState(s => ({ ...s, weather: d }));
    } catch {}
  }, []);

  useEffect(() => {
    const city = state.user?.permanentCity || '北京';
    updateWeather(city);
  }, [state.user?.permanentCity, updateWeather]);

  const openSubpage = (id: string, data?: any) => { setSubpage(id); setSubpageData(data || null); };
  const closeSubpage = () => { setSubpage(null); setSubpageData(null); };

  const handleLogout = async () => {
    await fetch('/api/auth/me', { method: 'DELETE', credentials: 'include' });
    setState(s => ({ ...s, user: null, showLanding: true, showLogin: false, showOnboarding: false, wardrobeItems: [], outfits: [] }));
    showToast('已退出登录');
  };

  if (state.loading) {
    return <div className="app-container"><div className="iphone-screen" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}><div style={{ fontSize: 18, color: '#8A8A8A' }}>加载中...</div></div></div>;
  }

  if (state.showLogin) {
    return (<ToastContext.Provider value={{ show: showToast }}><div className="app-container"><div className="iphone-screen"><LoginPage onLogin={loadUserData} onSwitchToRegister={() => setState(s => ({ ...s, showLogin: false }))} /><Toast visible={toast.visible} msg={toast.msg} /></div></div></ToastContext.Provider>);
  }

  if (state.showLanding && !state.showOnboarding) {
    return (<ToastContext.Provider value={{ show: showToast }}><div className="app-container"><div className="iphone-screen"><LandingPage onGetStarted={() => setState(s => ({ ...s, showLogin: true, showLanding: false }))} onLogin={() => setState(s => ({ ...s, showLogin: true }))} /><Toast visible={toast.visible} msg={toast.msg} /></div></div></ToastContext.Provider>);
  }

  if (state.showOnboarding) {
    return (<ToastContext.Provider value={{ show: showToast }}><div className="app-container"><div className="iphone-screen"><div className="dynamic-island"></div><OnboardingPage onComplete={async (data: any) => { await fetch('/api/onboarding', { method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include', body: JSON.stringify(data) }); setState(s => ({ ...s, showOnboarding: false, showLanding: false })); await loadUserData(); showToast('设置完成，欢迎使用 Stylee！'); }} onSkip={async () => { await fetch('/api/onboarding', { method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include', body: JSON.stringify({ nickname: '用户', gender: 'female' }) }); setState(s => ({ ...s, showOnboarding: false, showLanding: false })); showToast('已跳过，可稍后在个人中心完善'); }} /><Toast visible={toast.visible} msg={toast.msg} /></div></div></ToastContext.Provider>);
  }

  return (
    <ToastContext.Provider value={{ show: showToast }}>
      <div className="app-container"><div className="iphone-screen"><div className="dynamic-island"></div><div className="home-indicator"></div>
        <div className="status-bar"><span>{clock}</span><div style={{ display: 'flex', alignItems: 'center', gap: 6 }}><svg width="17" height="12" viewBox="0 0 17 12" fill="none"><rect x="0" y="9" width="3" height="3" rx="0.8" fill="#1a1a1a"/><rect x="4.5" y="6" width="3" height="6" rx="0.8" fill="#1a1a1a"/><rect x="9" y="3" width="3" height="9" rx="0.8" fill="#1a1a1a"/><rect x="13.5" y="0" width="3" height="12" rx="0.8" fill="#1a1a1a"/></svg><span style={{ fontSize: 12, fontWeight: 700, letterSpacing: -0.5 }}>5G</span><svg width="26" height="12" viewBox="0 0 26 12" fill="none"><rect x="1" y="1" width="22" height="10" rx="2.5" stroke="#1a1a1a" strokeWidth="1.5"/><rect x="3" y="3" width="18" height="6" rx="1.5" fill="#1a1a1a"/><rect x="24" y="4" width="2" height="4" rx="1" fill="#1a1a1a"/></svg></div></div>

        <div className={`page ${state.activeTab === 'outfit' ? 'active' : ''}`}><OutfitPage weather={state.weather} wardrobeItems={state.wardrobeItems} outfits={state.outfits} openSubpage={openSubpage} updateWeather={updateWeather} /></div>
        <div className={`page ${state.activeTab === 'wardrobe' ? 'active' : ''}`}><WardrobePage items={state.wardrobeItems} openSubpage={openSubpage} onRefresh={async () => { const r = await fetch('/api/wardrobe', { credentials: 'include' }); const d = await r.json(); setState(s => ({ ...s, wardrobeItems: d.items || [] })); }} /></div>
        <div className={`page ${state.activeTab === 'profile' ? 'active' : ''}`}><ProfilePage user={state.user} wardrobeItems={state.wardrobeItems} outfits={state.outfits} openSubpage={openSubpage} onLogout={handleLogout} /></div>

        {subpage === 'outfitOutput' && <OutfitOutputPage data={subpageData} wardrobeItems={state.wardrobeItems} onClose={closeSubpage} showToast={showToast} />}
        {subpage === 'addItem' && <AddItemPage onClose={closeSubpage} showToast={showToast} onSaved={async () => { const r = await fetch('/api/wardrobe', { credentials: 'include' }); const d = await r.json(); setState(s => ({ ...s, wardrobeItems: d.items || [] })); }} />}
        {subpage === 'itemDetail' && <ItemDetailPage item={subpageData} onClose={closeSubpage} showToast={showToast} />}
        {subpage === 'settings' && <SettingsPage onClose={closeSubpage} showToast={showToast} onLogout={handleLogout} />}
        {subpage === 'stylePref' && <StylePreferencePage onClose={closeSubpage} showToast={showToast} />}
        {subpage === 'outfitLibrary' && <OutfitLibraryPage outfits={state.outfits} onClose={closeSubpage} />}

        <div className="tab-bar">
          {[{ key: 'outfit' as const, icon: '🎯', label: '穿搭' }, { key: 'wardrobe' as const, icon: '👕', label: '衣橱' }, { key: 'profile' as const, icon: '👤', label: '我的' }].map(t => (
            <div key={t.key} className={`tab-item ${state.activeTab === t.key ? 'active' : ''}`} onClick={() => setState(s => ({ ...s, activeTab: t.key }))}><span style={{ fontSize: 24 }}>{t.icon}</span><span style={{ fontSize: 11, fontWeight: 500 }}>{t.label}</span></div>
          ))}
        </div>
        <Toast visible={toast.visible} msg={toast.msg} />
      </div></div>
    </ToastContext.Provider>
  );
}

function Toast({ visible, msg }: { visible: boolean; msg: string }) { return <div className={`toast ${visible ? 'show' : ''}`}>{msg}</div>; }

function LoginPage({ onLogin, onSwitchToRegister }: { onLogin: () => void; onSwitchToRegister: () => void }) {
  const [isRegister, setIsRegister] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [nickname, setNickname] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    setError('');
    if (!username || !password) { setError('请填写用户名和密码'); return; }
    const endpoint = isRegister ? '/api/auth/register' : '/api/auth/login';
    const body = isRegister ? { username, password, nickname: nickname || username } : { username, password };
    try {
      const res = await fetch(endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include', body: JSON.stringify(body) });
      const data = await res.json();
      if (!res.ok) { setError(data.error || '操作失败'); return; }
      onLogin();
    } catch (e) { setError(`网络错误: ${e instanceof Error ? e.message : '请重试'}`); }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', padding: '40px 32px', textAlign: 'center', background: '#FAF9F7' }}>
      <div style={{ width: 100, height: 100, background: 'linear-gradient(135deg, #6C5CE7, #A29BFE)', borderRadius: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 52, marginBottom: 24, boxShadow: '0 12px 40px rgba(108,92,231,0.3)' }}>👔</div>
      <div style={{ fontSize: 26, fontWeight: 800, marginBottom: 6, letterSpacing: -0.5 }}>Stylee</div>
      <div style={{ fontSize: 14, color: '#8A8A8A', marginBottom: 32 }}>{isRegister ? '创建你的穿搭账号' : '欢迎回来'}</div>
      {error && <div style={{ width: '100%', padding: '10px 14px', borderRadius: 10, background: '#FF3B3015', color: '#FF3B30', fontSize: 13, marginBottom: 12, textAlign: 'left' }}>{error}</div>}
      <div style={{ width: '100%', marginBottom: 12 }}><input className="form-input" placeholder="用户名" value={username} onChange={e => setUsername(e.target.value)} /></div>
      <div style={{ width: '100%', marginBottom: 12 }}><input className="form-input" type="password" placeholder="密码" value={password} onChange={e => setPassword(e.target.value)} /></div>
      {isRegister && <div style={{ width: '100%', marginBottom: 12 }}><input className="form-input" placeholder="昵称（可选）" value={nickname} onChange={e => setNickname(e.target.value)} /></div>}
      <button className="btn-primary" style={{ marginBottom: 12, boxShadow: '0 8px 24px rgba(0,0,0,0.15)' }} onClick={handleSubmit}>{isRegister ? '✨ 注册' : '🔑 登录'}</button>
      <div style={{ fontSize: 14, color: '#6C5CE7', cursor: 'pointer', fontWeight: 500 }} onClick={() => { setIsRegister(!isRegister); setError(''); }}>{isRegister ? '已有账号？登录' : '没有账号？注册'}</div>
    </div>
  );
}

function LandingPage({ onGetStarted, onLogin }: { onGetStarted: () => void; onLogin: () => void }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', padding: '40px 32px', textAlign: 'center', background: '#FAF9F7' }}>
      <div style={{ width: 140, height: 140, background: 'linear-gradient(135deg, #6C5CE7, #A29BFE)', borderRadius: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 72, marginBottom: 28, boxShadow: '0 12px 40px rgba(108,92,231,0.3)' }}>👔</div>
      <div style={{ fontSize: 32, fontWeight: 800, marginBottom: 10, letterSpacing: -0.5 }}>Stylee</div>
      <div style={{ fontSize: 16, color: '#8A8A8A', lineHeight: 1.6, marginBottom: 48 }}>你的 AI 私人穿搭顾问<br />从衣橱出发，穿出更好的自己</div>
      <button className="btn-primary" style={{ marginBottom: 12, boxShadow: '0 8px 24px rgba(0,0,0,0.15)' }} onClick={onGetStarted}>✨ 开始体验</button>
      <button className="btn-secondary" style={{ marginBottom: 16 }} onClick={onLogin}>已有账号？登录</button>
      <div style={{ fontSize: 13, color: '#B5B3B0' }}>注册即代表同意 <span style={{ color: '#6C5CE7', cursor: 'pointer' }}>用户协议</span> 和 <span style={{ color: '#6C5CE7', cursor: 'pointer' }}>隐私政策</span></div>
    </div>
  );
}

function OnboardingPage({ onComplete, onSkip }: { onComplete: (data: any) => void; onSkip: () => void }) {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({ nickname: '', gender: 'female', age: '', profession: '', permanentCity: '' });
  const [likes, setLikes] = useState<string[]>([]);
  const [dislikes, setDislikes] = useState<string[]>([]);
  const [initialItems, setInitialItems] = useState<{ name: string; category: string; color: string }[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [addItem, setAddItem] = useState({ name: '', category: '上装', color: '' });

  const handleAddItem = () => {
    if (!addItem.name || !addItem.color) return;
    setInitialItems(prev => [...prev, addItem]);
    setAddItem({ name: '', category: '上装', color: '' });
    setShowAddForm(false);
  };

  const handleRemoveItem = (idx: number) => {
    setInitialItems(prev => prev.filter((_, i) => i !== idx));
  };

  const categories = ['上装', '下装', '外套', '鞋', '包', '配饰'];

  const styles = [
    { key: '通勤简约', name: '通勤简约', icon: '💼', bg: 'linear-gradient(135deg,#D4C4B0,#B8A99A)' },
    { key: '街头潮流', name: '街头潮流', icon: '🎧', bg: 'linear-gradient(135deg,#2D3748,#1A202C)' },
    { key: '极简冷淡', name: '极简冷淡', icon: '◻️', bg: 'linear-gradient(135deg,#E2E8F0,#CBD5E0)' },
    { key: '文艺复古', name: '文艺复古', icon: '🎨', bg: 'linear-gradient(135deg,#9F7AEA,#805AD5)' },
    { key: '运动休闲', name: '运动休闲', icon: '🏃', bg: 'linear-gradient(135deg,#48BB78,#38A169)' },
    { key: '甜美少女', name: '甜美少女', icon: '✨', bg: 'linear-gradient(135deg,#ED8936,#DD6B20)' },
    { key: '法式慵懒', name: '法式慵懒', icon: '🥐', bg: 'linear-gradient(135deg,#F6E6CB,#D4A574)' },
    { key: '暗黑先锋', name: '暗黑先锋', icon: '🖤', bg: 'linear-gradient(135deg,#1A1A2E,#16213E)' },
    { key: '盐系日系', name: '盐系日系', icon: '🌊', bg: 'linear-gradient(135deg,#B8D4E3,#7FB3D3)' },
    { key: '老钱静奢', name: '老钱静奢', icon: '💎', bg: 'linear-gradient(135deg,#C9B99A,#A68B5B)' },
    { key: '山系户外', name: '山系户外', icon: '🏔️', bg: 'linear-gradient(135deg,#6B8E6B,#4A7C59)' },
    { key: '新中式', name: '新中式', icon: '🪭', bg: 'linear-gradient(135deg,#C0392B,#8E2218)' },
    { key: 'Y2K千禧', name: 'Y2K千禧', icon: '🦋', bg: 'linear-gradient(135deg,#FF6FD8,#CD9FF7)' },
    { key: '废土机能', name: '废土机能', icon: '⚡', bg: 'linear-gradient(135deg,#4A4A4A,#2C3E50)' },
    { key: '芭蕾核心', name: '芭蕾核心', icon: '🩰', bg: 'linear-gradient(135deg,#FFB6C1,#FF69B4)' },
    { key: '哥特浪漫', name: '哥特浪漫', icon: '🦇', bg: 'linear-gradient(135deg,#4A0E3C,#2C003E)' },
    { key: '知识分子', name: '知识分子', icon: '📖', bg: 'linear-gradient(135deg,#8B7355,#6B5744)' },
    { key: '辣妹热浪', name: '辣妹热浪', icon: '🔥', bg: 'linear-gradient(135deg,#FF4500,#FF6347)' },
  ];
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', padding: '0 24px', overflow: 'auto' }}>
      <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginBottom: 24, marginTop: 20 }}>
        {[1,2,3].map(i => <div key={i} style={{ width: step === i ? 24 : 8, height: 8, borderRadius: 4, background: step === i ? '#2C2C2C' : '#E0DEDA', transition: 'all 0.3s' }} />)}
      </div>
      {step === 1 && <><h1 style={{ fontSize: 28, fontWeight: 700, color: '#1a1a1a', marginBottom: 10, letterSpacing: -0.5 }}>让我们认识你</h1><p style={{ fontSize: 15, color: '#8A8A8A', lineHeight: 1.5, marginBottom: 32 }}>这些信息将帮助我们为你推荐更合适的穿搭风格</p>
        <div className="form-group"><label className="form-label">昵称</label><input className="form-input" placeholder="怎么称呼你？" value={form.nickname} onChange={e => setForm(f => ({ ...f, nickname: e.target.value }))} /></div>
        <div className="form-group"><label className="form-label">性别</label><div style={{ display: 'flex', gap: 12 }}><div className={`gender-btn ${form.gender === 'female' ? 'active' : ''}`} onClick={() => setForm(f => ({ ...f, gender: 'female' }))}>👩 女士</div><div className={`gender-btn ${form.gender === 'male' ? 'active' : ''}`} onClick={() => setForm(f => ({ ...f, gender: 'male' }))}>👨 男士</div><div className={`gender-btn ${form.gender === 'other' ? 'active' : ''}`} onClick={() => setForm(f => ({ ...f, gender: 'other' }))}>其他</div></div></div>
        <div className="form-group"><label className="form-label">年龄</label><input className="form-input" type="number" placeholder="例如：25" value={form.age} onChange={e => setForm(f => ({ ...f, age: e.target.value }))} /></div>
        <div className="form-group"><label className="form-label">职业</label><input className="form-input" placeholder="例如：互联网产品经理" value={form.profession} onChange={e => setForm(f => ({ ...f, profession: e.target.value }))} /></div>
        <div className="form-group"><label className="form-label">常驻城市</label><div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>{['北京', '上海', '广州', '深圳', '成都', '杭州', '武汉', '哈尔滨', '三亚', '西安'].map(c => <div key={c} className={`gender-btn ${form.permanentCity === c ? 'active' : ''}`} style={{ flex: 'unset', padding: '6px 14px', fontSize: 13 }} onClick={() => setForm(f => ({ ...f, permanentCity: c }))}>{c}</div>)}</div></div>
      </>}
      {step === 2 && <><h1 style={{ fontSize: 28, fontWeight: 700, color: '#1a1a1a', marginBottom: 10, letterSpacing: -0.5 }}>构建你的衣橱</h1><p style={{ fontSize: 15, color: '#8A8A8A', lineHeight: 1.5, marginBottom: 24 }}>添加你的衣物单品</p>
        {initialItems.length > 0 && <div style={{ marginBottom: 20 }}><div style={{ fontSize: 13, color: '#8A8A8A', marginBottom: 8 }}>已添加 {initialItems.length} 件</div><div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>{initialItems.map((item, idx) => <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', background: '#F0EDFF', borderRadius: 20, fontSize: 13, color: '#6C5CE7' }}><span>{CATEGORY_EMOJI[item.category] || '👕'} {item.name}</span><span style={{ cursor: 'pointer', opacity: 0.6 }} onClick={() => handleRemoveItem(idx)}>✕</span></div>)}</div></div>}
        <div className="upload-slot" style={{ height: 80, flexDirection: 'row', gap: 10 }} onClick={() => setShowAddForm(true)}><div style={{ width: 36, height: 36, borderRadius: '50%', background: '#F0EEEB', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>+</div><span style={{ fontSize: 14, color: '#8A8A8A' }}>添加一件衣物</span></div>
        {showAddForm && <div style={{ marginTop: 16, padding: 16, background: '#fff', borderRadius: 14, boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
          <div className="form-group"><label className="form-label">名称</label><input className="form-input" placeholder="如：白色T恤" value={addItem.name} onChange={e => setAddItem(a => ({ ...a, name: e.target.value }))} /></div>
          <div className="form-group"><label className="form-label">分类</label><div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>{categories.map(c => <div key={c} className={`gender-btn ${addItem.category === c ? 'active' : ''}`} style={{ flex: 'unset', padding: '6px 14px', fontSize: 13 }} onClick={() => setAddItem(a => ({ ...a, category: c }))}>{c}</div>)}</div></div>
          <div className="form-group"><label className="form-label">颜色</label><input className="form-input" placeholder="如：白色、黑色" value={addItem.color} onChange={e => setAddItem(a => ({ ...a, color: e.target.value }))} /></div>
          <div style={{ display: 'flex', gap: 10 }}><button className="btn-primary" style={{ flex: 1 }} onClick={handleAddItem}>添加</button><button style={{ flex: 1, height: 56, background: '#fff', border: '1.5px solid #E8E6E3', borderRadius: 16, fontSize: 17, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }} onClick={() => setShowAddForm(false)}>取消</button></div>
        </div>}
      </>}
      {step === 3 && <><h1 style={{ fontSize: 28, fontWeight: 700, color: '#1a1a1a', marginBottom: 10, letterSpacing: -0.5 }}>你的风格偏好</h1><p style={{ fontSize: 15, color: '#8A8A8A', lineHeight: 1.5, marginBottom: 24 }}>标记最喜欢和最不喜欢的风格</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10, paddingBottom: 20 }}>{styles.map(s => {
          const liked = likes.includes(s.key);
          const disliked = dislikes.includes(s.key);
          return (
          <div key={s.key} style={{ background: '#fff', borderRadius: 14, overflow: 'hidden', border: `2px solid ${liked ? '#34C759' : disliked ? '#FF3B30' : 'transparent'}`, opacity: disliked ? 0.7 : 1, transition: 'all 0.2s' }}>
            <div style={{ height: 72, background: s.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, opacity: 0.85 }}>{s.icon}</div>
            <div style={{ padding: '8px 10px 10px' }}><div style={{ fontSize: 13, fontWeight: 600, marginBottom: 6 }}>{s.name}</div><div style={{ display: 'flex', gap: 6 }}>
              <button style={{ flex: 1, height: 28, borderRadius: 7, border: liked ? 'none' : '1px solid #E8E6E3', background: liked ? '#34C759' : '#fff', color: liked ? '#fff' : '#4A4A4A', fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 3, padding: 0, fontFamily: 'inherit' }} onClick={() => { setLikes(l => l.includes(s.key) ? l.filter(x => x !== s.key) : [...l, s.key]); if (disliked) setDislikes(d => d.filter(x => x !== s.key)); }}>👍</button>
              <button style={{ flex: 1, height: 28, borderRadius: 7, border: disliked ? 'none' : '1px solid #E8E6E3', background: disliked ? '#FF3B30' : '#fff', color: disliked ? '#fff' : '#4A4A4A', fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 3, padding: 0, fontFamily: 'inherit' }} onClick={() => { setDislikes(d => d.includes(s.key) ? d.filter(x => x !== s.key) : [...d, s.key]); if (liked) setLikes(l => l.filter(x => x !== s.key)); }}>👎</button>
            </div></div></div>
        ); })}</div></>}
      <div style={{ padding: '16px 0 40px', flexShrink: 0, marginTop: 'auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>{step > 1 && <button style={{ width: 52, height: 52, borderRadius: '50%', background: '#fff', border: '1.5px solid #E8E6E3', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, cursor: 'pointer', flexShrink: 0, color: '#2C2C2C', fontFamily: 'inherit' }} onClick={() => setStep(s => s - 1)}>←</button>}<button className="btn-primary" onClick={() => { if (step < 3) setStep(s => s + 1); else onComplete({ ...form, styleLikes: likes, styleDislikes: dislikes, initialItems }); }}>{step < 3 ? '下一步' : '完成设置'}</button></div>
        <div style={{ textAlign: 'center', marginTop: 12, fontSize: 14, color: '#8A8A8A', cursor: 'pointer' }} onClick={onSkip}>跳过</div>
      </div>
    </div>
  );
}

const CATEGORY_EMOJI: Record<string, string> = { '上装': '👔', '下装': '👖', '外套': '🧥', '鞋': '👟', '包': '🎒', '配饰': '⌚' };

function OutfitPage({ weather, wardrobeItems, outfits, openSubpage, updateWeather }: { weather: any; wardrobeItems: any[]; outfits: any[]; openSubpage: (id: string, data?: any) => void; updateWeather: (city: string) => void }) {
  const [search, setSearch] = useState('');
  const [selectedTags, setSelectedTags] = useState<Record<string, string[]>>({ occasion: [], style: [], color: [], temp: ['薄款'] });
  const [nlpKeywords, setNlpKeywords] = useState<string[]>([]);
  const [showCityModal, setShowCityModal] = useState(false);
  const nlpMapping: Record<string, { group: string; keyword: string }> = { '约会': { group: 'occasion', keyword: '约会' }, '通勤': { group: 'occasion', keyword: '通勤' }, '运动': { group: 'occasion', keyword: '运动' }, '法式': { group: 'style', keyword: '法式' }, '极简': { group: 'style', keyword: '极简' }, '街头': { group: 'style', keyword: '街头' }, '甜美': { group: 'style', keyword: '甜美' }, '韩系': { group: 'style', keyword: '韩系' }, '复古': { group: 'style', keyword: '复古' }, '暖色': { group: 'color', keyword: '暖色' }, '冷色': { group: 'color', keyword: '冷色' } };
  const handleSearch = (val: string) => { setSearch(val); const matched: string[] = []; const newTags: Record<string, string[]> = { occasion: [], style: [], color: [], temp: selectedTags.temp }; for (const [k, v] of Object.entries(nlpMapping)) { if (val.includes(k)) { matched.push(k); if (!newTags[v.group].includes(v.keyword)) newTags[v.group].push(v.keyword); } } setNlpKeywords(matched); setSelectedTags(newTags); };
  const toggleTag = (group: string, keyword: string) => { setSelectedTags(prev => { const arr = prev[group] || []; return { ...prev, [group]: arr.includes(keyword) ? arr.filter(t => t !== keyword) : [...arr, keyword] }; }); };
  const generate = async () => { try { const res = await fetch('/api/outfit/recommend', { method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include', body: JSON.stringify({ rawQuery: search, city: weather.city, temperature: weather.temperature, weatherType: weather.weatherType, occasionTags: selectedTags.occasion, styleTags: selectedTags.style, colorTags: selectedTags.color }) }); const data = await res.json(); openSubpage('outfitOutput', data); } catch { openSubpage('outfitOutput', { outfits: [{ name: '推荐搭配', items: wardrobeItems.slice(0, 4).map(i => ({ ...i, role: i.category })), aiComment: '从你的衣橱中精选搭配', scene: '日常' }] }); } };
  const cities = ['北京', '上海', '广州', '深圳', '成都', '杭州', '武汉', '哈尔滨', '三亚', '西安'];
  return (
    <div className="content">
      <div className="weather-bar" onClick={() => setShowCityModal(true)}><div><div style={{ display: 'flex', alignItems: 'center', gap: 6 }}><span style={{ fontSize: 18 }}>{weather.icon}</span><span><strong>{weather.city}</strong> · {weather.temperature}°C {weather.desc}</span></div><div style={{ fontSize: 11, opacity: 0.9, marginTop: 2 }}>{weather.tip}</div></div><div style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'rgba(255,255,255,0.2)', padding: '4px 10px', borderRadius: 12, fontSize: 11, border: '1px solid rgba(255,255,255,0.3)', color: 'white' }}>📍 切换</div></div>
      <div style={{ margin: '0 20px 10px', background: '#fff', borderRadius: 14, padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 10, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}><span style={{ fontSize: 18, color: '#B2BEC3' }}>🔍</span><input style={{ flex: 1, fontSize: 14, color: '#2D3436', border: 'none', outline: 'none', background: 'none', fontFamily: 'inherit' }} placeholder="描述你想穿的风格..." value={search} onChange={e => handleSearch(e.target.value)} /><span style={{ fontSize: 14, color: '#6C5CE7', cursor: 'pointer', fontWeight: 600 }} onClick={generate}>搜索</span></div>
      {nlpKeywords.length > 0 && <div style={{ margin: '6px 20px 0', padding: '8px 12px', borderRadius: 10, background: 'linear-gradient(135deg,#E8F5E9,#F1F8E9)', border: '1px dashed #00B894', fontSize: 11, color: '#2E7D32' }}>🧠 AI 识别到: "{nlpKeywords.join(' · ')}" 已自动选中对应筛选标签</div>}
      <div className="filter-section"><div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}><h3 style={{ fontSize: 14, fontWeight: 600 }}>🎯 筛选条件</h3></div>
        <div className="filter-group"><div className="filter-group-label">场合</div><div className="filter-tags">{['💼 职场', '☕ 休闲', '💕 约会', '🏃 运动', '🎩 正式', '🏖️ 度假'].map(t => { const kw = t.replace(/^[^\s]+\s/, ''); return <span key={kw} className={`tag ${selectedTags.occasion.includes(kw) ? 'active' : ''}`} onClick={() => toggleTag('occasion', kw)}>{t}</span>; })}</div></div>
        <div className="filter-group"><div className="filter-group-label">风格</div><div className="filter-tags">{['极简', '法式', '街头', '甜美', '韩系', '复古', '知性'].map(kw => <span key={kw} className={`tag ${selectedTags.style.includes(kw) ? 'active' : ''}`} onClick={() => toggleTag('style', kw)}>{kw}</span>)}</div></div>
        <div className="filter-group"><div className="filter-group-label">色系</div><div className="filter-tags">{['冷色', '暖色', '中性色', '黑白'].map(kw => <span key={kw} className={`tag ${selectedTags.color.includes(kw) ? 'active' : ''}`} onClick={() => toggleTag('color', kw)}>{kw}</span>)}</div></div>
      </div>
      <div style={{ padding: '16px 20px' }}><button className="btn-accent" onClick={generate}>✨ 生成穿搭推荐</button></div>
      <div style={{ padding: '0 20px 20px' }}><div className="card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', padding: '14px 18px' }} onClick={() => openSubpage('outfitLibrary')}><div><div style={{ fontWeight: 700, marginBottom: 3, fontSize: 15 }}>📂 穿搭记录</div><div style={{ fontSize: 12, color: '#8A8A8A' }}>{outfits.length}套搭配</div></div><div style={{ display: 'flex' }}>{['👔','👗','👕'].map((e, i) => <div key={i} style={{ width: 30, height: 30, borderRadius: '50%', background: 'linear-gradient(135deg,#E8D5C4,#C49A6C)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, marginLeft: -6, border: '2px solid #fff' }}>{e}</div>)}</div></div></div>
      {showCityModal && <div className="modal-overlay active" onClick={() => setShowCityModal(false)}><div className="modal-sheet" onClick={e => e.stopPropagation()}><div style={{ fontSize: 18, fontWeight: 700, marginBottom: 16, textAlign: 'center' }}>📍 选择城市</div>{cities.map(c => <div key={c} style={{ padding: '10px 12px', fontSize: 14, color: '#636E72', borderRadius: 8, cursor: 'pointer' }} onClick={() => { setShowCityModal(false); updateWeather(c); }}>{c}</div>)}</div></div>}
      <div style={{ height: 20 }}></div>
    </div>
  );
}

function OutfitOutputPage({ data, onClose, showToast }: { data: any; wardrobeItems: any[]; onClose: () => void; showToast: (msg: string) => void }) {
  const [idx, setIdx] = useState(0);
  const [mode, setMode] = useState<'flatlay' | 'tryon'>('flatlay');
  const outfits = data?.outfits || [];
  const current = outfits[idx] || { name: '推荐搭配', items: [], aiComment: '', scene: '' };
  return (
    <div className="subpage-overlay active"><div className="subpage-header"><button style={{ fontSize: 15, color: '#2C2C2C', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600, fontFamily: 'inherit' }} onClick={onClose}>← 返回</button><h2 style={{ fontSize: 17, fontWeight: 700 }}>推荐方案 {idx + 1}/{outfits.length || 1}</h2><div style={{ width: 40 }}></div></div>
      <div className="subpage-content">
        <div style={{ display: 'flex', margin: '12px 20px 0', background: '#F5F6FA', borderRadius: 10, padding: 3 }}><div style={{ flex: 1, textAlign: 'center', padding: 8, borderRadius: 8, fontSize: 13, fontWeight: 500, cursor: 'pointer', ...(mode === 'flatlay' ? { background: '#fff', color: '#6C5CE7', boxShadow: '0 2px 6px rgba(0,0,0,0.08)' } : { color: '#636E72' }) }} onClick={() => setMode('flatlay')}>👕 服饰平铺</div><div style={{ flex: 1, textAlign: 'center', padding: 8, borderRadius: 8, fontSize: 13, fontWeight: 500, cursor: 'pointer', ...(mode === 'tryon' ? { background: '#fff', color: '#6C5CE7', boxShadow: '0 2px 6px rgba(0,0,0,0.08)' } : { color: '#636E72' }) }} onClick={() => setMode('tryon')}>🧍 虚拟试穿</div></div>
        {mode === 'flatlay' && <div className="flatlay-area">{current.items.map((item: any, i: number) => <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 12 }}><div style={{ padding: '12px 24px', borderRadius: 14, background: 'linear-gradient(135deg,#D4A574,#C49A6C)', color: '#fff', fontSize: 13, fontWeight: 500, display: 'flex', alignItems: 'center', gap: 6 }}>{CATEGORY_EMOJI[item.role] || '👕'} {item.name}</div></div>)}<div style={{ position: 'absolute', bottom: 4, left: '50%', transform: 'translateX(-50%)', fontSize: 10, color: '#B2BEC3', background: 'rgba(255,255,255,0.8)', padding: '2px 8px', borderRadius: 6 }}>← 滑动切换方案 →</div></div>}
        {mode === 'tryon' && <div style={{ margin: '12px 20px', minHeight: 360, borderRadius: 18, background: 'linear-gradient(180deg,#FAFAFA,#F0F0F0)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}><div style={{ fontSize: 100 }}>🧍</div><div style={{ marginTop: 8, fontSize: 10, color: '#B2BEC3' }}>虚拟试穿功能开发中</div></div>}
        <div className="dot-indicator">{outfits.map((_: any, i: number) => <div key={i} className={`dot-ind ${i === idx ? 'active' : ''}`} onClick={() => setIdx(i)} />)}</div>
        <div style={{ padding: '0 20px', marginTop: 12 }}><span style={{ fontSize: 13 }}>搭配单品</span></div>
        <div style={{ display: 'flex', gap: 10, padding: '8px 20px', overflowX: 'auto' }}>{current.items.map((item: any, i: number) => <div key={i} className="item-card"><div style={{ width: 48, height: 48, borderRadius: 10, background: 'linear-gradient(135deg,#D4A574,#C49A6C)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24 }}>{CATEGORY_EMOJI[item.role] || '👕'}</div><div style={{ display: 'flex', flexDirection: 'column' }}><span style={{ fontWeight: 500, fontSize: 12, whiteSpace: 'nowrap' }}>{item.name}</span><span style={{ fontSize: 10, color: '#B2BEC3', marginTop: 1 }}>{item.role}</span></div></div>)}</div>
        {current.aiComment && <div className="ai-comment"><p>{current.aiComment}</p></div>}
        <div className="decision-bar"><button className="decision-btn adjust">稍作调整</button><button className="decision-btn confirm" onClick={async () => { await fetch('/api/outfit', { method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include', body: JSON.stringify({ name: current.name, scene: current.scene, aiComment: current.aiComment, source: 'ai_generated', items: current.items.map((it: any, i: number) => ({ itemId: it.id, role: it.role, displayOrder: i })) }) }); showToast('已保存到我的搭配'); onClose(); }}>✨ 就这么穿</button></div>
      </div>
    </div>
  );
}

function WardrobePage({ items, openSubpage, onRefresh }: { items: any[]; openSubpage: (id: string, data?: any) => void; onRefresh: () => void }) {
  const [category, setCategory] = useState('全部');
  const [showAddSheet, setShowAddSheet] = useState(false);
  const categories = ['全部', '上装', '下装', '外套', '鞋', '包', '配饰'];
  const filtered = category === '全部' ? items : items.filter(i => i.category === category);
  return (
    <div className="content">
      <div style={{ padding: '12px 20px 0', display: 'flex', gap: 10, alignItems: 'center' }}><div style={{ position: 'relative', flex: 1 }}><span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', fontSize: 16, color: '#8A8A8A' }}>🔍</span><input className="form-input" style={{ paddingLeft: 40 }} placeholder="搜索单品..." /></div><div style={{ width: 44, height: 44, background: '#2C2C2C', color: '#fff', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, cursor: 'pointer', flexShrink: 0 }} onClick={() => setShowAddSheet(true)}>+</div></div>
      <div style={{ display: 'flex', gap: 8, overflowX: 'auto', padding: '4px 20px 12px' }}>{categories.map(c => <div key={c} className={`category-pill ${category === c ? 'active' : ''}`} onClick={() => setCategory(c)}>{c}</div>)}</div>
      <div style={{ padding: '4px 20px 10px', fontSize: 12, color: '#B2BEC3' }}>{filtered.length} 件</div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, padding: '0 20px 20px' }}>{filtered.map(item => <div key={item.id} className="garment-card" onClick={() => openSubpage('itemDetail', item)}><div className="garment-img">{CATEGORY_EMOJI[item.category] || '👕'}</div><div className="garment-info"><div className="garment-name">{item.name}</div><div className="garment-meta"><span>{item.category}</span><span>·</span><span>{item.color}</span></div></div></div>)}</div>
      {showAddSheet && <><div className="action-sheet-overlay show" onClick={() => setShowAddSheet(false)}></div><div className="action-sheet show"><div style={{ fontSize: 15, fontWeight: 600, color: '#8A8A8A', textAlign: 'center', marginBottom: 16 }}>添加衣物</div><div style={{ background: '#fff', borderRadius: 14, overflow: 'hidden', marginBottom: 12 }}>{['📷 拍照识别', '🖼️ 从相册选择', '✏️ 手动录入', '🔗 链接导入'].map((opt, i) => <button key={i} className="action-sheet-option" onClick={() => { setShowAddSheet(false); openSubpage('addItem'); }}>{opt}</button>)}</div><button style={{ width: '100%', padding: 16, background: '#fff', border: 'none', borderRadius: 14, fontSize: 17, fontWeight: 600, color: '#007AFF', cursor: 'pointer', fontFamily: 'inherit' }} onClick={() => setShowAddSheet(false)}>取消</button></div></>}
    </div>
  );
}

function ProfilePage({ user, wardrobeItems, outfits, openSubpage, onLogout }: { user: any; wardrobeItems: any[]; outfits: any[]; openSubpage: (id: string, data?: any) => void; onLogout: () => void }) {
  const [calMonth, setCalMonth] = useState(new Date());
  const year = calMonth.getFullYear(), month = calMonth.getMonth(), firstDay = new Date(year, month, 1).getDay(), daysInMonth = new Date(year, month + 1, 0).getDate(), today = new Date();
  const calDays: (number | null)[] = []; for (let i = 0; i < firstDay; i++) calDays.push(null); for (let d = 1; d <= daysInMonth; d++) calDays.push(d);
  return (
    <div className="content">
      <div className="profile-header-gradient"><div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20, position: 'relative', zIndex: 1 }}><div style={{ width: 72, height: 72, borderRadius: '50%', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32, border: '3px solid rgba(255,255,255,0.5)' }}>{user?.gender === 'male' ? '👨' : '👩'}</div><div><h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 6 }}>{user?.nickname || '用户'}</h2><div style={{ display: 'flex', gap: 8, fontSize: 12, opacity: 0.9, flexWrap: 'wrap' }}>{[user?.gender === 'male' ? '男' : '女', user?.age ? `${user.age}岁` : '', user?.permanentCity || '', user?.profession || ''].filter(Boolean).map((t, i) => <span key={i} style={{ background: 'rgba(255,255,255,0.2)', padding: '3px 10px', borderRadius: 12 }}>{t}</span>)}</div></div></div>
        <div style={{ display: 'flex', justifyContent: 'space-around', marginTop: 16, paddingTop: 16, borderTop: '1px solid rgba(255,255,255,0.2)', position: 'relative', zIndex: 1 }}><div style={{ textAlign: 'center' }}><div style={{ fontSize: 22, fontWeight: 700 }}>{wardrobeItems.length}</div><div style={{ fontSize: 12, opacity: 0.85, marginTop: 2 }}>衣服</div></div><div style={{ textAlign: 'center' }}><div style={{ fontSize: 22, fontWeight: 700 }}>{outfits.length}</div><div style={{ fontSize: 12, opacity: 0.85, marginTop: 2 }}>搭配</div></div><div style={{ textAlign: 'center', cursor: 'pointer' }} onClick={() => openSubpage('settings')}><div style={{ fontSize: 18 }}>⚙️</div><div style={{ fontSize: 12, opacity: 0.85, marginTop: 2 }}>设置</div></div></div>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px 8px' }}><span style={{ fontSize: 17, fontWeight: 600 }}>我的衣橱</span></div>
      <div className="card" style={{ margin: '0 20px 12px', padding: 12 }}><div style={{ display: 'flex', gap: 8, overflowX: 'auto' }}>{wardrobeItems.slice(0, 5).map(item => <div key={item.id} style={{ minWidth: 100, height: 120, borderRadius: 12, background: 'linear-gradient(135deg,#e0e0e0,#f0f0f0)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 36, cursor: 'pointer', position: 'relative', flexShrink: 0 }} onClick={() => openSubpage('itemDetail', item)}>{CATEGORY_EMOJI[item.category] || '👕'}<div style={{ position: 'absolute', bottom: 6, left: 6, fontSize: 11, fontWeight: 500 }}>{item.name}</div></div>)}</div></div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px 8px' }}><span style={{ fontSize: 17, fontWeight: 600 }}>穿搭记录</span><span style={{ fontSize: 14, color: '#6C5CE7', fontWeight: 500, cursor: 'pointer' }} onClick={() => openSubpage('outfitLibrary')}>查看全部 &gt;</span></div>
      <div className="card" style={{ margin: '0 20px 12px', padding: 12 }}><div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}><h3 style={{ fontSize: 16, fontWeight: 600 }}>{year}年{month + 1}月</h3><div style={{ display: 'flex', gap: 16, color: '#6C5CE7', fontSize: 18, cursor: 'pointer' }}><span onClick={() => setCalMonth(new Date(year, month - 1))}>‹</span><span onClick={() => setCalMonth(new Date(year, month + 1))}>›</span></div></div><div className="calendar-grid">{['日','一','二','三','四','五','六'].map(d => <div key={d} style={{ fontSize: 12, color: '#8e8e93', padding: 4, fontWeight: 500 }}>{d}</div>)}{calDays.map((d, i) => <div key={i} className={`cal-day ${d && today.getFullYear() === year && today.getMonth() === month && today.getDate() === d ? 'selected' : ''}`}>{d || ''}</div>)}</div></div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px 8px' }}><span style={{ fontSize: 17, fontWeight: 600 }}>风格偏好</span></div>
      <div className="card" style={{ margin: '0 20px 12px' }}>
        <div style={{ marginBottom: 14 }}><div style={{ fontSize: 14, fontWeight: 600, marginBottom: 10 }}>😍 喜欢的风格</div><div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>{['简约', '通勤', '法式', '温柔', '韩系'].map(s => <span key={s} style={{ padding: '6px 14px', borderRadius: 20, fontSize: 13, fontWeight: 500, background: '#34c75915', color: '#34c759' }}>{s}</span>)}</div></div>
        <div style={{ marginBottom: 14 }}><div style={{ fontSize: 14, fontWeight: 600, marginBottom: 10 }}>🙅 不喜欢的风格</div><div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>{['朋克', 'Oversize', '暗黑'].map(s => <span key={s} style={{ padding: '6px 14px', borderRadius: 20, fontSize: 13, fontWeight: 500, background: '#ff3b3015', color: '#ff3b30' }}>{s}</span>)}</div></div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 12, background: '#f2f2f7', borderRadius: 12, fontSize: 14, fontWeight: 500, color: '#6C5CE7', cursor: 'pointer' }} onClick={() => openSubpage('stylePref')}><span>⚙️ 点击切换偏好</span><span style={{ color: '#8e8e93' }}>›</span></div>
      </div>
      <div style={{ height: 20 }}></div>
    </div>
  );
}

function AddItemPage({ onClose, showToast, onSaved }: { onClose: () => void; showToast: (msg: string) => void; onSaved: () => void }) {
  const [form, setForm] = useState({ name: '', category: '上装', color: '', material: '', brand: '', price: '' });
  const categories = [['上装', '下装', '外套'], ['鞋', '包', '配饰']];
  const save = async () => { if (!form.name || !form.color) { showToast('请填写名称和颜色'); return; } await fetch('/api/wardrobe', { method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include', body: JSON.stringify(form) }); showToast('单品已保存'); onSaved(); onClose(); };
  return (
    <div className="subpage-overlay active"><div className="subpage-header"><button style={{ fontSize: 15, color: '#2C2C2C', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600, fontFamily: 'inherit' }} onClick={onClose}>← 返回</button><h2 style={{ fontSize: 17, fontWeight: 700 }}>添加单品</h2><button style={{ fontSize: 15, color: '#6C5CE7', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600, fontFamily: 'inherit' }} onClick={save}>保存</button></div>
      <div className="subpage-content"><div style={{ padding: '16px 20px 0' }}><span style={{ fontSize: 17, fontWeight: 600 }}>照片</span></div><div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, padding: '0 20px 16px' }}>{[1,2,3,4,5,6].map(i => <div key={i} style={{ aspectRatio: 1, background: '#fff', border: '2px dashed #D5D3D0', borderRadius: 14, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }} onClick={() => showToast('选择照片')}><div style={{ width: 28, height: 28, borderRadius: '50%', background: '#F0EEEB', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 4 }}>+</div><span style={{ fontSize: 11, color: '#8A8A8A' }}>添加</span></div>)}</div>
        <div style={{ margin: '0 20px 12px', padding: '10px 14px', borderRadius: 12, background: 'linear-gradient(135deg,#F0EDFF,#E8F5E9)', border: '1px solid #6C5CE7', display: 'flex', alignItems: 'center', gap: 8 }}><span style={{ fontSize: 18 }}>🧠</span><span style={{ fontSize: 12, color: '#6C5CE7' }}>AI 已识别：基础属性已预填</span></div>
        <div style={{ padding: '0 20px 20px' }}>
          <div className="form-group"><label className="form-label">名称</label><input className="form-input" placeholder="单品名称" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} /></div>
          <div className="form-group"><label className="form-label">分类</label>{categories.map((row, ri) => <div key={ri} style={{ display: 'flex', gap: 12, marginTop: ri ? 8 : 0 }}>{row.map(c => <div key={c} className={`gender-btn ${form.category === c ? 'active' : ''}`} onClick={() => setForm(f => ({ ...f, category: c }))}>{c}</div>)}</div>)}</div>
          <div className="form-group"><label className="form-label">颜色</label><input className="form-input" placeholder="如：黑色、米色" value={form.color} onChange={e => setForm(f => ({ ...f, color: e.target.value }))} /></div>
          <div className="form-group"><label className="form-label">材质</label><input className="form-input" placeholder="如：纯棉、丝绸" value={form.material} onChange={e => setForm(f => ({ ...f, material: e.target.value }))} /></div>
          <div className="form-group"><label className="form-label">品牌</label><input className="form-input" placeholder="可选" value={form.brand} onChange={e => setForm(f => ({ ...f, brand: e.target.value }))} /></div>
          <div className="form-group"><label className="form-label">价格</label><input className="form-input" placeholder="可选" value={form.price} onChange={e => setForm(f => ({ ...f, price: e.target.value }))} /></div>
          <button className="btn-primary" onClick={save}>保存单品</button>
        </div>
      </div>
    </div>
  );
}

function ItemDetailPage({ item, onClose, showToast }: { item: any; onClose: () => void; showToast: (msg: string) => void }) {
  if (!item) return null;
  const attrs = [{ label: '颜色', value: item.color || '-' }, { label: '材质', value: item.material || '-' }, { label: '版型', value: item.fitType || '-' }, { label: '季节', value: item.season || '-' }, { label: '品牌', value: item.brand || '-' }, { label: '价格', value: item.price ? `¥${item.price}` : '-' }];
  return (
    <div className="subpage-overlay active"><div style={{ height: 280, background: 'linear-gradient(135deg,#e0e0e0,#f5f5f5)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 100, position: 'relative', flexShrink: 0 }}>{CATEGORY_EMOJI[item.category] || '👕'}<button style={{ position: 'absolute', top: 12, left: 12, width: 36, height: 36, background: 'rgba(0,0,0,0.4)', color: '#fff', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, cursor: 'pointer', border: 'none', fontFamily: 'inherit' }} onClick={onClose}>←</button></div>
      <div className="subpage-content"><div style={{ padding: 20 }}><div style={{ fontSize: 22, fontWeight: 700, marginBottom: 4 }}>{item.name}</div><div style={{ fontSize: 13, color: '#8A8A8A', marginBottom: 20 }}>{item.category} · 穿过{item.wearCount || 0}次</div>
        <div style={{ fontSize: 17, fontWeight: 600, marginBottom: 14 }}>基础属性</div><div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>{attrs.map(a => <div key={a.label} style={{ background: '#fff', borderRadius: 12, padding: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}><div style={{ fontSize: 11, color: '#8A8A8A', marginBottom: 4 }}>{a.label}</div><div style={{ fontSize: 15, fontWeight: 600 }}>{a.value}</div></div>)}</div>
      </div></div>
    </div>
  );
}

function SettingsPage({ onClose, showToast, onLogout }: { onClose: () => void; showToast: (msg: string) => void; onLogout: () => void }) {
  const groups = [
    { title: '通知', rows: [{ icon: '🔔', label: '每日穿搭提醒', toggle: true, on: true }, { icon: '📰', label: '搭配推荐通知', toggle: true, on: true }, { icon: '💬', label: '社交互动通知', toggle: true, on: false }] },
    { title: '数据管理', rows: [{ icon: '🗑️', label: '清除缓存', value: '128 MB' }] },
    { title: '关于', rows: [{ icon: 'ℹ️', label: '当前版本', value: 'v1.1.0' }, { icon: '✏️', label: '意见反馈' }] },
  ];
  return (
    <div className="subpage-overlay active"><div className="subpage-header"><button style={{ fontSize: 15, color: '#2C2C2C', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600, fontFamily: 'inherit' }} onClick={onClose}>← 返回</button><h2 style={{ fontSize: 17, fontWeight: 700 }}>设置</h2><div style={{ width: 60 }}></div></div>
      <div className="subpage-content">{groups.map((g, gi) => <div key={gi}><div style={{ fontSize: 13, color: '#8A8A8A', padding: '8px 20px' }}>{g.title}</div><div style={{ background: '#fff', margin: '0 20px 12px', borderRadius: 16, overflow: 'hidden' }}>{g.rows.map((r, ri) => <div key={ri} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 16px', fontSize: 15, color: '#1c1c1e', cursor: 'pointer', borderBottom: ri < g.rows.length - 1 ? '1px solid #f2f2f7' : 'none' }}><div style={{ display: 'flex', alignItems: 'center', gap: 10 }}><span>{r.icon}</span><span>{r.label}</span></div>{'toggle' in r ? <div className={`toggle-switch ${r.on ? 'active' : ''}`}><div className="toggle-knob"></div></div> : <span style={{ fontSize: 13, color: '#8A8A8A' }}>{'value' in r ? r.value : ''} ›</span>}</div>)}</div></div>)}<div style={{ background: '#fff', margin: '0 20px 20px', borderRadius: 16, overflow: 'hidden' }}><div style={{ padding: 16, color: '#FF3B30', textAlign: 'center', fontSize: 15, fontWeight: 600, cursor: 'pointer' }} onClick={() => { onLogout(); onClose(); }}>🚪 退出登录</div></div></div>
    </div>
  );
}

function StylePreferencePage({ onClose, showToast }: { onClose: () => void; showToast: (msg: string) => void }) {
  const [likes, setLikes] = useState<string[]>(['简约', '通勤', '法式']);
  const [dislikes, setDislikes] = useState<string[]>(['朋克', 'Oversize', '暗黑']);
  const allStyles = ['简约', '通勤', '法式', '温柔', '韩系', '日系', '复古', '街头', '运动', '优雅', '甜美', '酷帅'];
  const dislikeStyles = ['朋克', 'Oversize', '暗黑', '嘻哈', '性感', '前卫', '民族', '波西米亚', '极简', '奢华'];
  return (
    <div className="subpage-overlay active"><div className="subpage-header"><button style={{ fontSize: 15, color: '#2C2C2C', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600, fontFamily: 'inherit' }} onClick={onClose}>← 返回</button><h2 style={{ fontSize: 17, fontWeight: 700 }}>风格偏好</h2><button style={{ fontSize: 15, color: '#6C5CE7', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600, fontFamily: 'inherit' }} onClick={() => { showToast('风格偏好已保存'); onClose(); }}>保存</button></div>
      <div className="subpage-content"><div className="card" style={{ margin: '12px 20px' }}><div style={{ fontSize: 14, fontWeight: 600, marginBottom: 12 }}>😍 点击选择喜欢的风格</div><div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>{allStyles.map(s => <span key={s} className={`style-tag ${likes.includes(s) ? 'like-active' : ''}`} onClick={() => setLikes(l => l.includes(s) ? l.filter(x => x !== s) : [...l, s])}>{s}</span>)}</div></div><div className="card" style={{ margin: '0 20px 12px' }}><div style={{ fontSize: 14, fontWeight: 600, marginBottom: 12 }}>🙅 点击选择不喜欢的风格</div><div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>{dislikeStyles.map(s => <span key={s} className={`style-tag ${dislikes.includes(s) ? 'dislike-active' : ''}`} onClick={() => setDislikes(d => d.includes(s) ? d.filter(x => x !== s) : [...d, s])}>{s}</span>)}</div></div><div style={{ fontSize: 12, color: '#8A8A8A', textAlign: 'center', marginTop: 8 }}>绿色 = 喜欢，红色 = 不喜欢，灰色 = 未选择</div></div>
    </div>
  );
}

function OutfitLibraryPage({ outfits, onClose }: { outfits: any[]; onClose: () => void }) {
  return (
    <div className="subpage-overlay active"><div className="subpage-header"><button style={{ fontSize: 15, color: '#2C2C2C', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600, fontFamily: 'inherit' }} onClick={onClose}>← 返回</button><h2 style={{ fontSize: 17, fontWeight: 700 }}>穿搭记录</h2><div style={{ width: 60 }}></div></div>
      <div className="subpage-content"><div style={{ padding: '0 20px 20px' }}><div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14, marginTop: 12 }}><span style={{ fontSize: 17, fontWeight: 600 }}>我的搭配</span><span style={{ fontSize: 14, color: '#8A8A8A' }}>{outfits.length}套</span></div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>{outfits.map(o => (
          <div key={o.id} className="card" style={{ padding: 0, overflow: 'hidden', cursor: 'pointer' }}><div style={{ height: 130, background: 'linear-gradient(135deg,#E8E0D8,#D4C4B0)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: 10 }}>{(o.items || []).slice(0, 3).map((oi: any, i: number) => <div key={i} style={{ width: 52, height: 52, borderRadius: 10, background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>{CATEGORY_EMOJI[oi.item?.category || oi.role] || '👕'}</div>)}</div><div style={{ padding: '10px 12px' }}><div style={{ fontWeight: 600, fontSize: 13, marginBottom: 3 }}>{o.name || '未命名搭配'}</div>{o.scene && <span className="tag" style={{ fontSize: 10, padding: '2px 8px' }}>{o.scene}</span>}</div></div>
        ))}</div>
      </div></div>
    </div>
  );
}
