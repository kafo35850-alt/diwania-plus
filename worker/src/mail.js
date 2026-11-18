// Sends the login code by email through Resend (https://resend.com).
// Without RESEND_API_KEY the code is only printed to the `wrangler dev` terminal,
// and only when DEV_MODE is "true". It is never returned to the browser.

export async function sendLoginCode(env, to, code) {
  if (env.RESEND_API_KEY) {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        authorization: 'Bearer ' + env.RESEND_API_KEY,
        'content-type': 'application/json'
      },
      body: JSON.stringify({
        from: env.MAIL_FROM,
        to: [to],
        subject: 'رمز الدخول إلى ديوانية بلس: ' + code,
        text: 'رمز الدخول إلى ديوانية بلس هو: ' + code + '\nالرمز صالح لمدة ٥ دقائق. إذا ما طلبته تجاهل هذه الرسالة.',
        html:
          '<div dir="rtl" style="font-family:Tahoma,Arial,sans-serif;font-size:16px;line-height:1.8;color:#0A0F24">' +
          '<p>رمز الدخول إلى <b>ديوانية بلس</b>:</p>' +
          '<p style="font-size:32px;font-weight:bold;letter-spacing:8px;direction:ltr;text-align:center">' + code + '</p>' +
          '<p>الرمز صالح لمدة ٥ دقائق. إذا ما طلبته تجاهل هذه الرسالة.</p>' +
          '</div>'
      })
    });
    if (!res.ok) {
      const detail = await res.text().catch(() => '');
      throw new Error('Resend error ' + res.status + ': ' + detail.slice(0, 200));
    }
    return;
  }
  if (env.DEV_MODE === 'true') {
    console.log('[DEV MODE] login code for ' + to + ': ' + code);
    return;
  }
  throw new Error('MAIL_NOT_CONFIGURED');
}
