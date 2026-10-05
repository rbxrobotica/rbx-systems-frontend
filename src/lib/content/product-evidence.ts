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

// Selected main-branch excerpts and local captures verified on 2026-10-05.
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
      width: 1425,
      height: 891,
      repository: 'ldamasio/robson',
      commit: '0cef339b22f5c458fd73511238f75fabc527f899',
      alt: {
        'pt-BR':
          'Dashboard Robson com limites de risco e operações preenchidos com dados sintéticos.',
        en: 'Robson dashboard with risk limits and operations populated with synthetic data.'
      },
      caption: {
        'pt-BR': 'Interface do Robson a partir da main, com dados sintéticos em ambiente local.',
        en: 'Robson interface from main, with synthetic data in a local environment.'
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
      src: '/products/evidence/strategos-main-ca6f6a7.jpg',
      width: 1440,
      height: 900,
      repository: 'rbxrobotica/strategos-ui',
      commit: 'ca6f6a7d157e7138a774bc35ff6c29e549097f59',
      alt: {
        'pt-BR':
          'Cockpit Strategos com decisões pendentes, riscos e observatório de agentes demonstrativos.',
        en: 'Strategos cockpit with demonstration pending decisions, risks and agent observatory.'
      },
      caption: {
        'pt-BR':
          'Interface da main com dados demonstrativos. Captura local, sem dados de produção.',
        en: 'Main-branch interface with demonstration data. Local capture without production data.'
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
    commit: '7e37fa40ba961ab09482525738f3f5ecf9b3df13',
    path: 'src/domain.rs',
    startLine: 199,
    language: 'rust',
    code: '/// The output of one evaluation: score + cause + owner.\n#[derive(Debug, Clone, Serialize, Deserialize)]\npub struct Verdict {\n    pub id: Uuid,\n    pub subject_id: String,\n    pub created_at: DateTime<Utc>,\n    pub overall: f32,\n    pub passed: bool,\n    pub dimensions: Vec<DimensionScore>,\n    pub attribution: Option<Attribution>,\n    pub judge_model: String,\n}',
    capture: {
      src: '/products/evidence/verentir-main-7e37fa4.jpg',
      width: 1009,
      height: 631,
      repository: 'rbxrobotica/verentir',
      commit: '7e37fa40ba961ab09482525738f3f5ecf9b3df13',
      alt: {
        'pt-BR':
          'Scorecard Verentir com métricas ilustrativas e dimensões identificadas como DEMO.',
        en: 'Verentir scorecard with illustrative metrics and dimensions marked DEMO.'
      },
      caption: {
        'pt-BR':
          'Console da main com dados demonstrativos. As métricas são ilustrativas, não resultados de produção.',
        en: 'Main-branch console with demonstration data. Metrics are illustrative, not production results.'
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
      width: 1440,
      height: 900,
      repository: 'rbxrobotica/thalamus-core',
      commit: 'fd19dc4107a479ce9072c41a6f7de4805991d03c',
      alt: {
        'pt-BR':
          'Console Thalamus desconectado, exibindo formulário de política, backend e orçamento.',
        en: 'Disconnected Thalamus console showing the policy, backend and budget form.'
      },
      caption: {
        'pt-BR':
          'Console da main com valores demonstrativos e ajuste local na inicialização da configuração; sem conexão a um servidor.',
        en: 'Main-branch console with demonstration values and a local configuration bootstrap adjustment; no server connection.'
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
      width: 1440,
      height: 900,
      repository: 'rbxrobotica/robson-code',
      commit: 'db646e02f1dcef0eb9dcac3afa743fa59d62017c',
      alt: {
        'pt-BR':
          'Saída real de robson-code query --help, com opções de aprovação por hash e por ação.',
        en: 'Actual output of robson-code query --help, with hash-bound and action-bound approval options.'
      },
      caption: {
        'pt-BR':
          'Saída real de robson-code query --help, apresentada em um visualizador de texto. Não representa uma sessão ativa de IA.',
        en: 'Actual robson-code query --help output displayed in a text viewer. It does not represent an active AI session.'
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
      src: '/products/evidence/satwake-main-c6f6b58.jpg',
      width: 1425,
      height: 891,
      repository: 'rbxrobotica/rbx-landing-briefing-btc',
      commit: 'c6f6b58f8cec25a95b98166cac4d51861d858845',
      alt: {
        'pt-BR':
          'Apresentação Satwake com estrutura de edição identificada como exemplo esquemático.',
        en: 'Satwake presentation with the edition structure labeled as a schematic example.'
      },
      caption: {
        'pt-BR':
          'Apresentação do Satwake na main. A interface identifica a amostra como esquemática.',
        en: 'Satwake presentation from main. The interface labels the sample as schematic.'
      }
    }
  }
];
