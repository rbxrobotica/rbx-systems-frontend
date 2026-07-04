# Inventário de DNS, E-mail e SEO — RBX Systems

> Registro read-only do estado atual dos registros DNS, configuração de e-mail e implicações para SEO e entrega.

---

## 1. Domínios sob gestão RBX

| Domínio | Provedor DNS | IP principal | Uso principal |
|---|---|---|---|
| `rbx.ia.br` | Registro.br (a.sec.dns.br, b.sec.dns.br) | `158.220.116.31` | Institucional pt-BR |
| `rbxsystems.ch` | ns1.rbxsystems.ch, ns2.rbxsystems.ch | `158.220.116.31` | Institucional en |
| `merovelis.com` | ns1.rbxsystems.ch, ns2.rbxsystems.ch | `158.220.116.31` | Marca de produto |
| `strategos.gr` | ns1.rbxsystems.ch, ns2.rbxsystems.ch | `158.220.116.31` | Produto Strategos |

---

## 2. Registros por domínio

### rbx.ia.br

| Tipo | Registro | Observação |
|---|---|---|
| A | `158.220.116.31` | Aponta para cluster k3s |
| NS | `a.sec.dns.br`, `b.sec.dns.br` | DNS do Registro.br |
| MX | — | **AUSENTE** |
| TXT | — | **AUSENTE** (sem SPF, DMARC, Search Console) |
| CAA | — | **AUSENTE** |

### rbxsystems.ch

| Tipo | Registro | Observação |
|---|---|---|
| A | `158.220.116.31` | Cluster k3s |
| MX | `10 mail.rbxsystems.ch` | Servidor de e-mail próprio |
| TXT | `v=spf1 include:spf.mtasv.net ~all` | Postmark |
| TXT (_dmarc) | `v=DMARC1; p=none; rua=mailto:dmarc@rbxsystems.ch; fo=1` | Modo monitoração |
| DKIM | Não verificado | Requer checagem no Postmark |
| CAA | — | **AUSENTE** |

### merovelis.com

| Tipo | Registro | Observação |
|---|---|---|
| A | `158.220.116.31` | Cluster k3s |
| NS | `ns1.rbxsystems.ch`, `ns2.rbxsystems.ch` | DNS delegado |
| MX | — | **AUSENTE** (possivelmente herda via wildcard?) |
| TXT | — | **AUSENTE** |
| TXT (_dmarc) | `v=DMARC1; p=none; rua=mailto:dmarc@rbxsystems.ch; fo=1` | Existe |
| DKIM | Não verificado | — |
| CAA | — | **AUSENTE** |

### strategos.gr

| Tipo | Registro | Observação |
|---|---|---|
| A | `158.220.116.31` | Cluster k3s |
| MX | `10 mail.rbxsystems.ch` | Mesmo MX de rbxsystems.ch |
| TXT | `v=spf1 include:spf.mtasv.net ~all` | Postmark |
| TXT (_dmarc) | — | **AUSENTE** |
| DKIM | Não verificado | — |
| CAA | — | **AUSENTE** |

---

## 3. Subdomínios detectados

| Subdomínio | IP | Uso inferido | Recomendação |
|---|---|---|---|
| `www.rbxsystems.ch` | CNAME → rbxsystems.ch | Alias www | Manter + redirect 301 para apex |
| `www.merovelis.com` | CNAME → merovelis.com | Alias www | Manter + redirect 301 para apex |
| `mail.rbxsystems.ch` | `5.182.33.93` | Servidor de e-mail | Manter; proteger |
| `console.rbx.ia.br` | `158.220.116.31` | Console RBX | Bloquear em robots.txt + auth |
| `console.rbxsystems.ch` | `158.220.116.31` | Console RBX | Bloquear em robots.txt + auth |
| `console.merovelis.com` | `158.220.116.31` | Console Merovelis | Bloquear em robots.txt + auth |
| `app.rbxsystems.ch` | `158.220.116.31` | App RBX | Bloquear em robots.txt + auth |
| `app.merovelis.com` | `158.220.116.31` | App Merovelis | Bloquear em robots.txt + auth |
| `cms.rbxsystems.ch` | `158.220.116.31` | CMS RBX | Bloquear em robots.txt + auth |
| `staging.rbx.ia.br` | `158.220.116.31` | Staging | Bloquear em robots.txt + auth + noindex |

---

## 4. Configuração de e-mail

### Serviço identificado
- Postmark (`spf.mtasv.net`) em uso para `rbxsystems.ch`, `merovelis.com` e `strategos.gr`.

### Provedores de envio
- `mail.rbxsystems.ch` atua como MX.

### Riscos
1. **rbx.ia.br** não tem infra de e-mail configurada. E-mails `@rbx.ia.br` não funcionam.
2. **DMARC `p=none`** apenas monitora; não impede spoofing.
3. **DKIM** não foi verificado; sem DKIM, entregabilidade fica prejudicada.
4. **CAA ausente**; não restringe autoridades certificadoras.

### Recomendações

#### Para rbx.ia.br
```text
MX    rbx.ia.br        10 mail.rbxsystems.ch
TXT   rbx.ia.br        "v=spf1 include:spf.mtasv.net ~all"
TXT   _dmarc.rbx.ia.br "v=DMARC1; p=none; rua=mailto:dmarc@rbxsystems.ch; fo=1"
TXT   default._domainkey.rbx.ia.br "<chave DKIM do Postmark>"
TXT   rbx.ia.br        "google-site-verification=<token>"
```

#### Para strategos.gr
```text
TXT   _dmarc.strategos.gr "v=DMARC1; p=none; rua=mailto:dmarc@rbxsystems.ch; fo=1"
TXT   default._domainkey.strategos.gr "<chave DKIM>"
```

#### CAA (opcional mas recomendado)
```text
CAA   rbx.ia.br        0 issue "letsencrypt.org"
CAA   rbxsystems.ch    0 issue "letsencrypt.org"
CAA   merovelis.com    0 issue "letsencrypt.org"
CAA   strategos.gr     0 issue "letsencrypt.org"
```

---

## 5. Verificações de Search Console

| Domínio | Método | TXT de verificação | Status |
|---|---|---|---|
| `rbx.ia.br` | DNS TXT | **AUSENTE** | Não verificado |
| `rbxsystems.ch` | DNS TXT | **AUSENTE** | Não verificado |
| `merovelis.com` | DNS TXT | **AUSENTE** | Não verificado |
| `strategos.gr` | DNS TXT | **AUSENTE** | Não verificado |

Recomendação: criar propriedades de domínio no Google Search Console e Bing Webmaster Tools, gerar tokens de verificação e adicionar registros TXT.

---

## 6. Redirects recomendados

### www → apex
```
www.rbx.ia.br        → 301 → rbx.ia.br
www.rbxsystems.ch    → 301 → rbxsystems.ch
www.merovelis.com    → 301 → merovelis.com
www.strategos.gr     → 301 → strategos.gr
```

### http → https
```
http://*  → 301 → https://*
```

### Idioma / conteúdo equivalente
```
rbx.ia.br/servicos/*  ←hreflang→  rbxsystems.ch/services/*
rbx.ia.br/produtos/*  ←hreflang→  rbxsystems.ch/products/*
rbx.ia.br/sobre       ←hreflang→  rbxsystems.ch/about
rbx.ia.br/contato     ←hreflang→  rbxsystems.ch/contact
```

---

## 7. Pendências sensíveis que exigem autorização humana

1. Adicionar/modificar registros MX para `rbx.ia.br`.
2. Adicionar/modificar SPF, DKIM, DMARC para `rbx.ia.br` e `strategos.gr`.
3. Adicionar registros TXT de verificação do Search Console.
4. Adicionar registros CAA.
5. Configurar redirects www→apex e http→https no Traefik/ingress.
6. Evoluir DMARC de `p=none` para `p=quarantine` após validação.

---

## 8. Validação pós-mudança

```bash
# DNS
dig +short A rbx.ia.br
dig +short MX rbx.ia.br
dig +short TXT rbx.ia.br
dig +short TXT _dmarc.rbx.ia.br
dig +short TXT default._domainkey.rbx.ia.br
dig +short CAA rbx.ia.br

# E-mail
# Enviar e-mail de teste para Gmail/Outlook e verificar headers SPF/DKIM/DMARC

# Search Console
# Confirmar propriedade e submeter sitemap
```
