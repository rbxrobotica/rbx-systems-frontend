# LinkedIn: Laya tutorial

Published on the official RBX Systems company page on 2026-10-22 after the operator authorized the post and required the uv correction and rerun first. No personal-profile repost.

Post: https://www.linkedin.com/feed/update/urn:li:share:7519172616675430401/?actorCompanyId=103949050

The complete campaign URL was submitted. LinkedIn renders it as https://lnkd.in/dDTnsVJJ; its destination was verified in LinkedIn with all four UTM parameters intact. The automatic canonical-only preview was removed; this is a text-only post. Plausible dashboard attribution has not been inspected.

## PT-BR: published

O modelo classificou um agradecimento como problema técnico, com probabilidade de 88,21%.

Esse foi um dos resultados do nosso experimento com Laya. Nos quatro exemplos didáticos, o modelo acertou dois. As regras por palavras-chave acertaram os quatro.

No novo tutorial do RBX Journal, mostramos como reproduzir o teste com uv e PyTorch, localmente e em CPU:

• preparar um ambiente com versões fixadas em uv.lock;
• classificar mensagens em português;
• conferir as probabilidades e os erros;
• comparar com uma solução simples e discutir onde manter revisão humana.

Quatro exemplos não formam um benchmark. Eles mostram por que executar um modelo e avaliar sua adequação à tarefa são etapas diferentes. Uma probabilidade alta também pode acompanhar uma decisão errada.

Tutorial completo, com código e resultados:
https://rbx.ia.br/blog/2026-10-22-laya-pytorch-classificacao-de-textos?utm_source=linkedin&utm_medium=social_organic&utm_campaign=2026h2_b2b_ai_engineering_009&utm_content=b2b_post_laya_009

#EngenhariaDeIA #PyTorch #Python

## EN: draft only


How can you test a local text classifier before adding a GPU or a training job?

Our Laya and PyTorch tutorial runs on a CPU. It covers installation, a complete
program, and interpreting probabilities. The model got two of four teaching
examples right, including a confident error. We kept the observed results and
the comparison with simple rules to show what a first run establishes and what
still needs evaluation.

Read and run the example:
https://rbxsystems.ch/blog/2026-10-22-text-classification-laya-pytorch
