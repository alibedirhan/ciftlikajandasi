(function(){
  const form = document.getElementById('betaForm');
  const statusEl = document.getElementById('betaFormError');
  const toast = document.getElementById('toast');

  const SUPPORT_EMAIL = 'ciftlikajandasi@gmail.com';
  const ENDPOINT = '';

  const q = (id) => document.getElementById(id);
  const v = (id) => ((q(id) && q(id).value) ? q(id).value : '').trim();

  function ok(msg){
    if(!statusEl) return;
    statusEl.className = 'okText';
    statusEl.textContent = msg || '';
  }

  function bad(msg){
    if(!statusEl) return;
    statusEl.className = 'errorText';
    statusEl.textContent = msg || '';
  }

  function showToast(msg){
    if(!toast) return;
    toast.textContent = msg;
    toast.setAttribute('aria-hidden','false');
    clearTimeout(showToast._t);
    showToast._t = setTimeout(()=>toast.setAttribute('aria-hidden','true'), 2200);
  }

  function isEmail(email){
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  function mailtoUrl(body){
    const subject = encodeURIComponent('Kapalı Test Davet Talebi');
    const content = encodeURIComponent(body);
    return `mailto:${SUPPORT_EMAIL}?subject=${subject}&body=${content}`;
  }

  async function postPayload(payload){
    const r = await fetch(ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if(!r.ok) throw new Error('request_failed');
  }

  if(!form) return;

  form.addEventListener('submit', async (e)=>{
    e.preventDefault();
    bad('');

    const email = v('email');
    if(!isEmail(email)){
      bad('Lütfen geçerli bir e‑posta gir.');
      return;
    }

    if(!q('consent') || !q('consent').checked){
      bad('Devam etmek için onay kutusunu işaretle.');
      return;
    }

    const payload = {
      email,
      name: v('name'),
      device: v('device'),
      android: v('android'),
      note: v('note'),
      ua: navigator.userAgent,
      ts: new Date().toISOString(),
    };

    const body = [
      'Kapalı test daveti',
      '',
      `E-posta: ${payload.email}`,
      `Ad: ${payload.name || '-'}`,
      `Cihaz: ${payload.device || '-'}`,
      `Android: ${payload.android || '-'}`,
      '',
      `Not: ${payload.note || '-'}`,
      '',
      `Zaman: ${payload.ts}`,
      `UA: ${payload.ua}`,
    ].join('\\n');

    try{
      if(ENDPOINT){
        await postPayload(payload);
        ok('Talebin alındı. Teşekkürler!');
        showToast('Talebin alındı.');
        form.reset();
      } else {
        window.location.href = mailtoUrl(body);
        ok('Mail uygulaman açılacak. Gönder dediğinde davet talebin iletilir.');
        showToast('Mail uygulaman açılıyor...');
      }
    } catch(_){
      bad('Gönderilemedi. Lütfen tekrar dene ya da Destek sayfasından mail at.');
    }
  });
})();
