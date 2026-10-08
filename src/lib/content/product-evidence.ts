import type { Locale } from '$types/content';

type Localized = Record<Locale, string>;

export interface ProductEvidence {
  id: 'robson' | 'strategos' | 'verentir' | 'thalamus' | 'robson-code' | 'satwake';
  name: string;
  description: Localized;
  repository: string;
  commit: string;
  path: string;
  startLine: number;
  language: string;
  code: string;
  sourceUrl?: string;
  permalinkUrl?: string;
  capture: {
    src: string;
    width: number;
    height: number;
    repository: string;
    commit: string;
    alt: Localized;
    caption: Localized;
  };
}

// Selected main-branch excerpts verified on 2026-10-05; captures re-taken at device scale factor 2 on 2026-10-08.
// See docs/products-portfolio.md for capture provenance and demo limitations.
export const productEvidence: ProductEvidence[] = [
  {
    id: 'robson',
    name: 'Robson',
    description: {
      'pt-BR':
        'O código verifica o limite por operação e o orçamento restante antes de admitir uma entrada.',
      en: 'The code checks the per-trade cap and the remaining budget before admitting an entry.'
    },
    repository: 'ldamasio/robson',
    commit: '0cef339b22f5c458fd73511238f75fabc527f899',
    path: 'robson-domain/src/policy.rs',
    startLine: 225,
    language: 'rust',
    code: '        let cap = self.risk_per_trade_amount(capital_base);\n        if cap <= Decimal::ZERO {\n            return false;\n        }\n        let charge = if planned_risk <= Decimal::ZERO {\n            cap\n        } else {\n            planned_risk\n        };\n        if charge > cap {\n            return false;\n        }\n        self.remaining_budget(capital_base, budget_consumed, latent_risk) >= charge',
    sourceUrl: 'https://github.com/ldamasio/robson/blob/main/robson-domain/src/policy.rs#L225-L237',
    permalinkUrl:
      'https://github.com/ldamasio/robson/blob/0cef339b22f5c458fd73511238f75fabc527f899/robson-domain/src/policy.rs#L225-L237',
    capture: {
      src: '/products/evidence/robson-main-0cef339.jpg',
      width: 1862,
      height: 898,
      repository: 'ldamasio/robson',
      commit: '0cef339b22f5c458fd73511238f75fabc527f899',
      alt: {
        'pt-BR':
          'Dashboard Robson com limites de risco e operações preenchidos com dados sintéticos.',
        en: 'Robson dashboard with risk limits and operations populated with synthetic data.'
      },
      caption: {
        'pt-BR':
          'Console do Robson em produção, capturado pelo operador na própria conta. Saldos e preços são um instantâneo, não evidência de desempenho.',
        en: 'The Robson console in production, captured by the operator on their own account. Balances and prices are a snapshot, not performance evidence.'
      }
    }
  },
  {
    id: 'strategos',
    name: 'Strategos',
    description: {
      'pt-BR':
        'O contrato separa a decisão humana das evidências que a sustentam. Registra quem decidiu, quando e qual foi o resultado.',
      en: 'The contract separates human decisions from their supporting evidence. It records who decided, when and the outcome.'
    },
    repository: 'rbxrobotica/strategos-ui',
    commit: 'ca6f6a7d157e7138a774bc35ff6c29e549097f59',
    path: 'src/types/agent.ts',
    startLine: 78,
    language: 'typescript',
    code: 'export interface HumanDecision {\n  alternativeId?: string;  // Pode diferir da recomendação da IA\n  outcome: "approved" | "rejected" | "deferred";\n  notes?: string;\n  decidedBy: string;       // ID/nome do ator humano\n  decidedAt: Date;\n}\n\nexport interface DecisionEvidence {\n  type: "data" | "report" | "analysis" | "external";\n  title: string;\n  source: string;\n}',
    capture: {
      src: '/products/evidence/strategos-main-fcf14bd.jpg',
      width: 2400,
      height: 1500,
      repository: 'rbxrobotica/strategos-ui',
      commit: 'fcf14bd38eeb665c8f3abdffa06e39ca40274363',
      alt: {
        'pt-BR':
          'Cockpit Strategos com decisões pendentes, riscos e observatório de agentes demonstrativos.',
        en: 'Strategos cockpit with demonstration pending decisions, risks and agent observatory.'
      },
      caption: {
        'pt-BR':
          'Cockpit real do Strategos na revisão implantada em produção, executado localmente em modo mock com identidade sintética. A produção exige login.',
        en: 'The actual Strategos cockpit at the revision deployed in production, run locally in mock mode with a synthetic identity. Production requires sign-in.'
      }
    }
  },
  {
    id: 'verentir',
    name: 'Verentir',
    description: {
      'pt-BR':
        'Cada avaliação reúne resultado, critérios e atribuição da falha. A estrutura permite revisar por que um sistema passou ou falhou.',
      en: 'Each evaluation brings together its result, criteria and failure attribution. The structure supports reviewing why a system passed or failed.'
    },
    repository: 'rbxrobotica/verentir',
    commit: 'a8dc4cb9354530c0f1963500cd2bd1589b74ddc8',
    path: 'src/domain.rs',
    startLine: 199,
    language: 'rust',
    code: '/// The output of one evaluation: score + cause + owner.\n#[derive(Debug, Clone, Serialize, Deserialize)]\npub struct Verdict {\n    pub id: Uuid,\n    pub subject_id: String,\n    pub created_at: DateTime<Utc>,\n    pub overall: f32,\n    pub passed: bool,\n    pub dimensions: Vec<DimensionScore>,\n    pub attribution: Option<Attribution>,\n    pub judge_model: String,\n}',
    capture: {
      src: '/products/evidence/verentir-main-a8dc4cb.jpg',
      width: 2400,
      height: 1280,
      repository: 'rbxrobotica/verentir',
      commit: 'a8dc4cb9354530c0f1963500cd2bd1589b74ddc8',
      alt: {
        'pt-BR':
          'Scorecard Verentir: 12 vereditos de demonstração, taxa de aprovação, média por dimensão e falhas atribuídas por classe e responsável.',
        en: 'Verentir scorecard: 12 demonstration verdicts, pass rate, average by dimension and failures attributed by class and owner.'
      },
      caption: {
        'pt-BR':
          'Console real da main, executado localmente com um juiz simulado. Os vereditos são de demonstração, não resultados de produção.',
        en: 'Actual main-branch console, run locally with a stub judge. Verdicts are demonstration data, not production results.'
      }
    }
  },
  {
    id: 'thalamus',
    name: 'Thalamus',
    description: {
      'pt-BR':
        'Uma política reúne os modelos e ferramentas permitidos, orçamento, regras para ocultar dados sensíveis e exigência de auditoria.',
      en: 'A policy brings together permitted models and tools, budget, rules for redacting sensitive data and audit requirements.'
    },
    repository: 'rbxrobotica/thalamus-core',
    commit: 'fd19dc4107a479ce9072c41a6f7de4805991d03c',
    path: 'crates/thalamus-core/src/policy.rs',
    startLine: 7,
    language: 'rust',
    code: '#[derive(Debug, Clone, Serialize, Deserialize)]\npub struct Policy {\n    pub id: String,\n    pub tenant: String,\n    pub product: String,\n    pub workflow: String,\n    pub permitted_backends: Vec<BackendHandle>,\n    pub budget: Budget,\n    pub context_grants: Vec<ContextGrant>,\n    pub redaction_rules: Vec<RedactionRule>,\n    pub audit_required: bool,\n    pub risk_threshold: RiskLevel,',
    capture: {
      src: '/products/evidence/thalamus-main-fd19dc4.jpg',
      width: 2400,
      height: 1500,
      repository: 'rbxrobotica/thalamus-core',
      commit: 'fd19dc4107a479ce9072c41a6f7de4805991d03c',
      alt: {
        'pt-BR':
          'Console Thalamus desconectado, exibindo formulário de política, backend e orçamento.',
        en: 'Disconnected Thalamus console showing the policy, backend and budget form.'
      },
      caption: {
        'pt-BR':
          'Console real da main, desconectado, com valores de demonstração. Inclui a correção de inicialização da configuração proposta ao thalamus-core; o console não tem exposição pública.',
        en: 'Actual main-branch console, disconnected, with demonstration values. Includes the configuration bootstrap fix proposed to thalamus-core; the console has no public exposure.'
      }
    },
    sourceUrl:
      'https://github.com/rbxrobotica/thalamus-core/blob/main/crates/thalamus-core/src/policy.rs#L7-L18',
    permalinkUrl:
      'https://github.com/rbxrobotica/thalamus-core/blob/fd19dc4107a479ce9072c41a6f7de4805991d03c/crates/thalamus-core/src/policy.rs#L7-L18'
  },
  {
    id: 'robson-code',
    name: 'Robson Code',
    description: {
      'pt-BR':
        'O contrato associa a aprovação ao identificador e ao hash da ação proposta. Uma negativa pode registrar o motivo.',
      en: 'The contract binds approval to the proposed action identifier and hash. A denial can record its reason.'
    },
    repository: 'rbxrobotica/robson-code',
    commit: 'db646e02f1dcef0eb9dcac3afa743fa59d62017c',
    path: 'crates/robson-code-protocol/src/commands.rs',
    startLine: 38,
    language: 'rust',
    code: '    /// Approve a durable intent (mutation OR exec), bound to the exact\n    /// intent and its binding hash (a patch\'s diff hash, or an exec\n    /// definition\'s hash): an approval whose binding does not match the\n    /// pending intent is a denial. Never resolved by the unbound `Approve`.\n    ApproveIntent {\n        intent_id: IntentId,\n        binding_hash: ContentHash,\n    },\n    /// Deny a mutation or exec intent.\n    DenyIntent {\n        intent_id: IntentId,\n        #[serde(skip_serializing_if = "Option::is_none", default)]\n        reason: Option<String>,\n    },',
    capture: {
      src: '/products/evidence/robson-code-main-db646e0.jpg',
      width: 2400,
      height: 1133,
      repository: 'rbxrobotica/robson-code',
      commit: 'db646e02f1dcef0eb9dcac3afa743fa59d62017c',
      alt: {
        'pt-BR':
          'Saída real de robson-code query --help, com opções de aprovação por hash e por ação.',
        en: 'Actual output of robson-code query --help, with hash-bound and action-bound approval options.'
      },
      caption: {
        'pt-BR':
          'Saída real de robson-code query --help, apresentada em uma janela de terminal. Não representa uma sessão ativa de IA.',
        en: 'Actual robson-code query --help output shown in a terminal window. It does not represent an active AI session.'
      }
    }
  },
  {
    id: 'satwake',
    name: 'Satwake',
    description: {
      'pt-BR':
        'Antes de publicar uma edição, o pipeline confere o checksum SHA-256 e o tamanho de cada artefato contra o manifesto.',
      en: 'Before publishing an edition, the pipeline checks each artifact’s SHA-256 checksum and size against the manifest.'
    },
    repository: 'rbxrobotica/rbx-market-briefing',
    commit: 'e05a6a077d8dfcfc8dded9a5a9b2101afb8cf4f1',
    path: 'src/pipeline/publisher.ts',
    startLine: 130,
    language: 'typescript',
    code: '      const order: ArtifactName[] = KNOWN_ARTIFACTS.filter((name) => name in declared);\n      const bodies = new Map<ArtifactName, Buffer>();\n      for (const filename of order) {\n        const body = await readFile(join(outDir, filename));\n        const expected = declared[filename];\n        const digest = `sha256:${createHash("sha256").update(body).digest("hex")}`;\n        if (expected?.checksum !== digest || expected?.size_bytes !== body.length) {\n          throw new Error(`Local artifact integrity mismatch: ${filename}`);\n        }\n        bodies.set(filename, body);\n      }',
    capture: {
      src: '/products/evidence/satwake-main-8a02318.jpg',
      width: 2400,
      height: 1500,
      repository: 'rbxrobotica/rbx-landing-briefing-btc',
      commit: '8a023186aab81204dd7707fbb40ec5f8b4e80466',
      alt: {
        'pt-BR':
          'Página pública do Briefing Diário BTC em produção, com título, proposta e botões de assinatura e amostra.',
        en: 'Public Briefing Diário BTC page in production, with headline, offer and the subscribe and sample buttons.'
      },
      caption: {
        'pt-BR':
          'Captura direta da página pública em produção, na revisão implantada. Sem acesso a pagamento, login ou conteúdo de membros.',
        en: 'Direct capture of the public production page at the deployed revision. No payment, sign-in or member content was accessed.'
      }
    }
  }
];
