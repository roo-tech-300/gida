// Local stand-in for Paystack so the parent pay flow can be clicked through without real money.
// Run: node scripts/dev/fake-paystack.mjs   (needs the local worker on :8787, see docs/local-dev.md)
import { createHmac } from 'node:crypto';
import { createServer } from 'node:http';

const PORT = Number(process.env.FAKE_PAYSTACK_PORT ?? 4010);
const SECRET = process.env.PAYSTACK_SECRET_KEY ?? 'sk_test_local_only';
const WORKER = process.env.WORKER_URL ?? 'http://127.0.0.1:8787';
// Host the browser uses to reach this server (the worker only sees 127.0.0.1).
const PUBLIC_HOST = process.env.FAKE_PUBLIC_HOST ?? '192.168.188.95';
const transactions = new Map();

const readJson = (req) => new Promise((resolve) => {
  let body = '';
  req.on('data', (chunk) => { body += chunk; });
  req.on('end', () => resolve(body ? JSON.parse(body) : {}));
});
const send = (res, status, body, type = 'application/json') => {
  res.writeHead(status, { 'Content-Type': type });
  res.end(typeof body === 'string' ? body : JSON.stringify(body));
};

const checkoutPage = (tx) => `<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Fake Paystack</title><body style="font-family:system-ui;max-width:360px;margin:48px auto;padding:0 16px">
<h2>Fake Paystack checkout</h2><p>Test only. No money moves.</p>
<p><b>₦${(tx.amount / 100).toLocaleString()}</b> for ${tx.email}</p>
<button id="pay" style="padding:12px 20px;font-size:16px">Pay now</button>
<script>document.getElementById('pay').onclick = async () => {
  await fetch('/complete/${tx.reference}', { method: 'POST' });
  location.href = ${JSON.stringify(tx.callback_url)} + '?reference=${tx.reference}';
};</script>`;

createServer(async (req, res) => {
  const url = new URL(req.url, `http://localhost:${PORT}`);
  if (req.method === 'POST' && url.pathname === '/transaction/initialize') {
    const tx = await readJson(req);
    transactions.set(tx.reference, tx);
    return send(res, 200, { status: true, data: { authorization_url: `http://${PUBLIC_HOST}:${PORT}/checkout/${tx.reference}`, reference: tx.reference } });
  }
  const verify = url.pathname.match(/^\/transaction\/verify\/(.+)$/);
  if (req.method === 'GET' && verify) {
    const tx = transactions.get(decodeURIComponent(verify[1]));
    if (!tx) return send(res, 404, { status: false, message: 'Transaction not found' });
    return send(res, 200, { status: true, data: { status: 'success', reference: tx.reference, amount: tx.amount, channel: 'card', metadata: tx.metadata } });
  }
  if (req.method === 'POST' && url.pathname === '/refund') {
    const { transaction } = await readJson(req);
    console.log(`[fake-paystack] refund requested for ${transaction}`);
    return transactions.has(transaction)
      ? send(res, 200, { status: true, message: 'Refund has been queued for processing', data: { status: 'pending', transaction: { reference: transaction } } })
      : send(res, 400, { status: false, message: 'Transaction not found' });
  }
  const checkout = url.pathname.match(/^\/checkout\/(.+)$/);
  if (req.method === 'GET' && checkout && transactions.has(checkout[1])) {
    return send(res, 200, checkoutPage(transactions.get(checkout[1])), "text/html; charset=utf-8");
  }
  const complete = url.pathname.match(/^\/complete\/(.+)$/);
  if (req.method === 'POST' && complete && transactions.has(complete[1])) {
    const tx = transactions.get(complete[1]);
    const body = JSON.stringify({ event: 'charge.success', data: { status: 'success', reference: tx.reference, amount: tx.amount, channel: 'card', metadata: tx.metadata } });
    const signature = createHmac('sha512', SECRET).update(body).digest('hex');
    const hook = await fetch(`${WORKER}/api/paystack/webhook`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'x-paystack-signature': signature }, body });
    return send(res, hook.ok ? 200 : 502, { webhook: hook.status });
  }
  return send(res, 404, { status: false, message: 'Not found' });
}).listen(PORT, () => console.log(`[fake-paystack] listening on :${PORT}, webhook -> ${WORKER}`));
