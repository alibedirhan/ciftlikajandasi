(function(){
  const form = document.getElementById('betaForm');
  const statusEl = document.getElementById('betaFormError');
  const toast = document.getElementById('toast');
  const SUPPORT_EMAIL = 'ciftlikajandasi@gmail.com';
  const ENDPOINT = '';
  const q = (id) => document.getElementById(id);
  const v = (id) => ((q(id) && q(id).value) ? q(id).value : '').trim();
  function setStatus(type, msg){
    if(!statusEl) return;
    statusEl.className = type === 'ok' ? 'okText' : 'errorText';
    statusEl.textContent = msg || '';
  }
  function showToast(msg){
    if(!toast) return;
    toast.textContent = msg;
    toast.setAttribute('aria-hidden','false');
    clearTimeout(showToast._t);
    showToast._t = setTimeout(()=>toast.setAttribute('aria-hidden','true'), 2400);
  }
  function isEmail(email){ return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email); }
  function mailtoUrl(body){
    return `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent('Çiftlik Ajandası test programı talebi')}&body=${encodeURIComponent(body)}`;
  }
  async function postPayload(payload){
    const r = await fetch(ENDPOINT, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
    if(!r.ok) throw new Error('request_failed');
  }
  if(!form) return;
  form.addEventListener('submit', async (e)=>{
    e.preventDefault();
    setStatus('bad','');
    const email = v('email');
    if(!isEmail(email)) return setStatus('bad','Lütfen geçerli bir e-posta gir.');
    if(!q('consent') || !q('consent').checked) return setStatus('bad','Devam etmek için onay kutusunu işaretle.');
    const payload = { email, name: v('name'), device: v('device'), android: v('android'), note: v('note'), ua: navigator.userAgent, ts: new Date().toISOString() };
    const body = [
      'Çiftlik Ajandası test programı talebi','',
      `E-posta: ${payload.email}`,
      `Ad: ${payload.name || '-'}`,
      `Telefon modeli: ${payload.device || '-'}`,
      `Android sürümü: ${payload.android || '-'}`,'',
      `Not: ${payload.note || '-'}`,'',
      `Zaman: ${payload.ts}`,
      `Tarayıcı bilgisi: ${payload.ua}`,
    ].join('\n');
    try{
      if(ENDPOINT){
        await postPayload(payload);
        setStatus('ok','Talebin alındı. Teşekkürler.');
        showToast('Talebin alındı.');
        form.reset();
      } else {
        window.location.href = mailtoUrl(body);
        setStatus('ok','Mail uygulaman açılacak. Gönder dediğinde talebin iletilir.');
        showToast('Mail uygulaman açılıyor.');
      }
    } catch(_){
      setStatus('bad','Gönderilemedi. Destek sayfasından doğrudan mail atabilirsin.');
    }
  });
})();
