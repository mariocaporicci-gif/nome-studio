/* Custo de Peça — NOMÊ STUDIO
   Troque a versão sempre que atualizar o app, para forçar o cache novo. */
const VERSAO = "custo-nome-v2";
const ARQUIVOS = [
  "./",
  "./index.html",
  "./manifest.json",
  "./icon-192.png",
  "./icon-512.png",
  "./icon-maskable.png"
];

self.addEventListener("install", ev => {
  ev.waitUntil(
    caches.open(VERSAO)
      .then(c => c.addAll(ARQUIVOS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", ev => {
  ev.waitUntil(
    caches.keys()
      .then(ks => Promise.all(ks.filter(k => k !== VERSAO).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", ev => {
  const req = ev.request;
  if (req.method !== "GET") return;

  // rede primeiro para o HTML, para pegar atualizações assim que houver conexão
  if (req.mode === "navigate"){
    ev.respondWith(
      fetch(req)
        .then(res => {
          const copia = res.clone();
          caches.open(VERSAO).then(c => c.put(req, copia));
          return res;
        })
        .catch(() => caches.match(req).then(r => r || caches.match("./index.html")))
    );
    return;
  }

  // cache primeiro para o resto
  ev.respondWith(
    caches.match(req).then(r => r || fetch(req).then(res => {
      if (res.ok && new URL(req.url).origin === location.origin){
        const copia = res.clone();
        caches.open(VERSAO).then(c => c.put(req, copia));
      }
      return res;
    }).catch(() => r))
  );
});
