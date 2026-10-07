# Publicação de Home e Soluções

## Escopo e responsabilidade

Responsável: operador RBX `psyctl`. O procedimento altera somente os quatro
objetos de Home e Soluções em `pt-BR` e `en`. Não inclui Journal, produtos,
assets, bancos, DNS, chaves ou credenciais. A imagem SSR é promovida por PR
separado em `rbx-infra`, com reconciliação do ArgoCD.

O conteúdo revisado está em `site-content/`. A versão anterior está em
`site-content-recovery/2026-10-07/`, capturada antes da publicação. São textos
já públicos, preservados em Git sem exigir uma chave de decriptação para
rollback. O arquivo `before-publication.tar.gpg` oferece uma cópia criptografada
adicional. Não contém credenciais nem chaves privadas.

O GitHub é o destino durável fora do provedor do armazenamento principal.
Uma cópia criptografada na jaguar é um cache adicional, em `/tmp`, sujeito à
limpeza do sistema. Ela não é a única cópia e não constitui serviço de backup
permanente. Nenhum daemon, timer, secret ou diretório persistente é criado por
este procedimento.

## Objetivos e retenção

- RPO do lote: versão imediatamente anterior à publicação, sem perda dos quatro
  textos nessa fronteira. Não cobre edições posteriores do CMS.
- RTO alvo do rollback: 30 minutos, condicionado a acesso GitHub, S3 e cluster.
  O teste isolado de recuperação de bytes não mede recuperação total do serviço.
- Retenção: manter cada diretório datado e seu histórico Git por pelo menos
  90 dias. Não há exclusão automática. Este primeiro snapshot fica retido no
  histórico do repositório; a cópia na jaguar não tem retenção garantida.
- Sucesso e idade: cada publicação exige snapshot menor que 24 horas,
  verificação de hashes, recuperação a partir do remoto e recibo durável.
  `check-live` detecta mudança dos quatro objetos desde a captura.
- Repetir o teste isolado antes de cada publicação e trimestralmente por
  procedimento do operador. Não há monitor automático de idade instalado.

## Preparação

Usar o Node do projeto e `pnpm@9.15.9 install --frozen-lockfile`. Credenciais
canônicas: `pass rbx/s3/access-key` e `pass rbx/s3/secret-key`. O script as lê
somente em memória. Não criar `.env` nem registrar seus valores.

O helper está limitado aos hashes do conteúdo revisado no commit
`27623c88fb57277bba57b476d4925568a55169af`. Uma revisão futura exige novo lote,
novos hashes e nova captura revisados em PR. Não adaptar hashes durante uma
falha operacional.

```bash
node scripts/site-content-recovery.mjs capture /tmp/site-before-NEW-DATE
node scripts/site-content-recovery.mjs verify /tmp/site-before-NEW-DATE
node scripts/site-content-recovery.mjs check-live /tmp/site-before-NEW-DATE
```

`capture` exige diretório inexistente e lê exatamente quatro objetos. Recusa
objetos ausentes, maiores que 1 MiB ou com metadata/encoding fora do contrato.
Guardar manifest e textos públicos em novo diretório datado do Git, revisar,
escanear segredos, abrir PR, executar CI e obter revisão independente antes
de prosseguir. Não incluir qualquer exportação privada GPG.

Opcionalmente gerar um tar contendo somente o manifest e os quatro arquivos
e cifrar para a chave pública de recuperação já validada. Transferir somente
o ciphertext. O snapshot público no Git continua disponível se a chave estiver
indisponível. A custódia offline da chave GPG segue como melhoria do cofre de
segredos, fora das alterações desta publicação.

## Recuperação isolada

Em outra máquina, obter o diretório datado pelo SHA exato do remoto. Comparar
SHA-256 e tamanho de cada arquivo com o manifest, sem escrever em S3.
Recuperar bytes do Git comprova a preservação do conteúdo. Decriptar o tar
criptografado exige chave previamente custodiada e desbloqueada; não transferir
chaves privadas para contornar uma falha de desbloqueio.

```bash
node scripts/site-content-recovery.mjs verify site-content-recovery/2026-10-07
```

Registrar SHA remoto, quatro hashes, resultado e duração. Um teste de bytes
não equivale a restauração S3 em produção ou recuperação completa do cluster.

## Publicação

Verificar primeiro a existência da imagem anterior e da candidata no GHCR.
O alvo da aplicação é `sha-27623c8`; o rollback é `sha-bf424b7`. Promover as duas
overlays por PR em `rbx-infra`, após CI e revisão independente. Não executar
`kubectl apply`, `argocd app sync` ou substituir outros recursos.

Confirmar pods prontos, dois endpoints disponíveis por frontend, ExternalSecrets
Ready, HTTPS válido e Applications Healthy/Synced na revisão promovida.
Depois publicar o lote:

```bash
node scripts/site-content-recovery.mjs publish site-content-recovery/2026-10-07 \
  --apply-four-reviewed-objects
```

O helper compara todos os textos e headers com o snapshot antes do primeiro
PUT, envia `If-Match` por objeto, e compara os quatro objetos após os PUTs.
Condicionais seguem o [contrato S3](https://docs.aws.amazon.com/AmazonS3/latest/userguide/conditional-writes.html).
A compatibilidade concreta do provedor não é comprovada apenas por essa
documentação. Não retirar a condição como fallback de uma falha.

Esperar a expiração do cache de conteúdo, de 60 segundos, e verificar os dois
hosts públicos, Home, Soluções, Parceria, CTA e metadados PT/EN. Não enviar
formulários de leads durante o smoke test. Registrar o recibo em Git.

## Rollback e falhas

```bash
node scripts/site-content-recovery.mjs restore site-content-recovery/2026-10-07 \
  --apply-four-reviewed-objects
```

| Falha                          | Comportamento e recuperação                                                                                                                                           |
| ------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| GitHub indisponível            | Não iniciar publicação sem snapshot remoto verificado. Cache local não substitui o remoto.                                                                            |
| Chave GPG bloqueada ou perdida | Recuperar os quatro textos públicos do Git. Não copiar chave privada.                                                                                                 |
| S3 indisponível                | Parar. O frontend usa seu fallback existente. Não declarar publicação concluída.                                                                                      |
| Drift anterior ao PUT          | Parar sem escrever. Recapturar e revisar a nova versão, sem absorver mudanças silenciosamente.                                                                        |
| Escrita concorrente            | `If-Match` protege o corpo de cada objeto conforme suporte do provedor. Não é lock global; metadata com mesmo ETag pode mudar após a leitura.                         |
| Timeout durante PUT            | Estado do objeto é desconhecido. Evento de tentativa identifica a chave; ausência de ACK não prova ausência de escrita. Consultar os quatro objetos antes de decidir. |
| Lote parcial                   | Não há transação entre quatro objetos. Restaurar explicitamente após diagnóstico, sem retry ou rollback automático.                                                   |
| Texto externo após publicação  | Restore recusa hashes diferentes do baseline e do lote revisado. Preservar a edição externa e resolver com o operador.                                                |
| Imagem ou SSR com falha        | Reverter somente as duas tags via novo PR para `sha-bf424b7`, executar CI/revisão e observar ArgoCD e endpoints.                                                      |

O restore aceita mistura de versões anterior/revisada, restaura bytes e os
quatro headers HTTP previstos, e verifica ambos na leitura posterior. PUT
altera LastModified/ETag do backend; esses identificadores não são restaurados.

## Limites e custo de operação

`verify`: zero requisições S3. `capture` e `check-live`: até quatro GETs.
`publish` e `restore`: até 12 chamadas (quatro GETs, quatro PUTs, quatro GETs).
Operações sequenciais, uma tentativa por chamada e timeout de 10 segundos.
Cada corpo remoto é limitado a 1 MiB; a memória de trabalho é proporcional ao
lote fixo de quatro objetos.

Esta solução preserva um lote pequeno de conteúdo público e o rollback da
aplicação. Não instala plataforma de backup, não comprova recuperação do cofre
de segredos e não altera backup de bancos, PVCs ou control plane.

Registro documental R4 com overlay R6, RBX Voice System v0.1.
