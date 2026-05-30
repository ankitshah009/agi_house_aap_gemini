import { SignalAnalysis } from './types';

export const CURATED_SIGNALS: SignalAnalysis[] = [
  {
    id: "sig-overviews-ads",
    title: "Google Establishes Generative 'AI Overviews' Ads in Search Open Beta",
    summary: "Google is officially rolling out sponsored commercial cards natively embedded within AI Overviews. This shifts traditional text-link CPC budgets toward conversational visual answer modules and automated asset dynamic generation.",
    date: "May 30, 2026",
    category: "Search & Algorithmic Commerce",
    originalText: "Google announced today that Ads in AI Overviews are transitioning to open beta in the US. Advertisers using Performance Max or Search campaigns will see product lists and sponsored shopping responses generated directly within real-time summaries, moving beyond blue links toward direct conversational recommendations based on conversational matching.",
    hypeCheckScore: 84,
    hypeNotes: "While Google PR frames this as 'completely organic query extension,' our analysis reveals this is primarily a tactical defense of search monetizing margins against OpenAI SearchGPT. CPC pricing models will be volatile in Q3 as inventory stabilizes.",
    rachelEicComment: "Strategists must not panic-refactor whole search plans. Treat this as a Performance Max alpha slot: allocate 5% test budgets to establish bidding baselines, but do not sacrifice core high-intent long-tail keywords yet. I've approved this brief for strategist deployment.",
    audioScript: "Hello, this is Rachel. Google is shifting search budgets directly into AI Overviews. While public hype calls this a revolution, it's a defensive play to preserve search margins. Strategists: Performance Max advertisers are opt-in by default, so watch your CPC volatility instantly. Executives: get ready for CPA adjustments as users buy inside the answer modules itself.",
    disclosure: {
      producedBy: "Ada — AI Research Analyst",
      reviewedBy: "Rachel — Editor-in-Chief",
      sources: [
        { title: "Google Ads Liaison Official Announcement", url: "https://support.google.com/google-ads/answer/overview-ads-beta", verifiedBy: "AAP Engine" },
        { title: "AdExchanger Tech Report", url: "https://www.adexchanger.com/search/google-ai-overview-bidding", verifiedBy: "AAP Engine" }
      ],
      provenanceHash: "aap_engine_sha256_8f0a3e9b110a72ff9d7e00318cbcf984aef52319c80d44e"
    },
    cards: [
      {
        lens: "strategist",
        title: "Client POV",
        scoreName: "Campaign Urgency",
        score: 92,
        voiceDescription: "What this means for campaigns, clients, and creative strategy.",
        brief: "Performance Max campaigns are being auto-opted into answer-module placements. This forces our creative briefs to shift from fixed ad copy to open-ended asset libraries that feed Google's real-time synthetic composition engine.",
        bullets: [
          "**QBR Narrative Shift**: Reassure clients that their traditional Search CPC is protected, but prepare them for some volume dilution as queries migrate to conversational answer boxes.",
          "**Asset Library Expansion**: Elevate creative input standards. Provide high-contrast square product packshots and clear product detail titles to prevent distorted synthetic AI generation.",
          "**Bidding Calibration**: Anticipate a short-term rise in CPM as premium real estate is bid on aggressively. Establish strict day-part bidding rules."
        ],
        actionSteps: [
          "Audit all active Performance Max campaigns for asset completeness.",
          "Draft client communication detailing the opt-in beta placement details.",
          "Establish an isolated 'Generative Placements' custom tracking budget of 5%."
        ]
      },
      {
        lens: "executive",
        title: "Investment Decision",
        scoreName: "Strategic Priority",
        score: 78,
        voiceDescription: "Business impact, competitive shifts, and strategic priorities.",
        brief: "This triggers a long-term erosion of standard keyword-intent value. Agencies must shift talent investments toward conversational SEO (LLM Optimization) and algorithmic feed management rather than pure bid curation.",
        bullets: [
          "**Budget Allocation**: Move 10% of search surplus funds into feed optimization technology. The feed is the product.",
          "**Agency Moat**: Build proprietary 'Share of Voice in Answers' auditing scripts to prove to corporate boards that our portfolio brands are being recommended by LLMs.",
          "**Competitor Defense**: Prepare for margins compression inside standard keyword-bidding campaigns due to answer box consolidation."
        ],
        actionSteps: [
          "Reallocate 2027 technical media roadmap budget to algorithmic feed tools.",
          "Commission a study on Brand Mentions inside AI Overview queries.",
          "Update the CEO deck on Search Disruption and conversational ad formats."
        ]
      },
      {
        lens: "gtm",
        title: "Product Opportunity",
        scoreName: "Market Potential",
        score: 85,
        voiceDescription: "Who wins, who loses, and where the market is moving.",
        brief: "Independent feed syndicators and real-time structured data tools win. Generic keyword copywriters and low-tech agencies find their core offerings fully automated by P-Max overlays.",
        bullets: [
          "**Winner**: Feed optimization platforms (e.g., Feedonomics) that curate real-time inventory schemas.",
          "**Loser**: Legacy long-tail search arbitrage websites whose traffic will be absorbed by native inline text expansions.",
          "**Partnership Openings**: Connect standard e-commerce client inventory feeds to Gemini API classifiers to pre-optimize descriptions."
        ],
        actionSteps: [
          "Pitch integrated feed sanitization tools to top-tier retail accounts.",
          "Initiate corporate partnerships with LLM crawler audit vendors.",
          "Target top 3 high-spend retail accounts with a pro-active feed demonstration."
        ]
      },
      {
        lens: "policy",
        title: "Trust Assessment",
        scoreName: "Regulatory Risk",
        score: 65,
        voiceDescription: "Ethical implications, policy updates, and transparency considerations.",
        brief: "Google's dynamic product summaries merge organic search summaries with sponsored catalog recommendations. This risks FTC compliance challenges regarding the blurred boundary of native deceptive advertising.",
        bullets: [
          "**Labeling and Disclosure**: FTC mandates require unmistakable sponsor badges inside answer modules. Purely synthetic reviews must be clearly marked.",
          "**Trademark Protection**: Monitor if competitive products are dynamically generated when queries specifically target a unique proprietary brand name.",
          "**Data Privacy Alignment**: Ensure customer intent profiles sent to Google aren't permanently ingested into model training weights."
        ],
        actionSteps: [
          "Implement monitoring alerts for brand trademark infringement inside Gemini Overviews.",
          "Review updated FTC Native Advertising guidelines with the legal team.",
          "Document clear synthetic-content boundaries in client master service agreements."
        ]
      }
    ]
  },
  {
    id: "sig-eu-watermark",
    title: "EU AI Act Restructuring Triggers Programmatic Synthetic Watermarking Mandates",
    summary: "The European Union has activated Article 52 compliance pathways, requiring programmatic ad networks to verify, embed, and report all generative synthetic video content before deployment. Failure triggers massive global administrative penal fees.",
    date: "May 28, 2026",
    category: "Policy & Automated Media",
    originalText: "European programmatic exchanges are implementing automated validation layers to enforce Article 52 of the EU AI Act. Every deep-synthesized video ad, dynamic voiceover, or generated social media avatar must carry a standardized cryptographic watermark in the dynamic video metadata header, verifiable by programmatic ad networks in real-time.",
    hypeCheckScore: 97,
    hypeNotes: "This is a structural shift, not typical Euro-bureaucracy. Because global ad platforms use centralized media pipelines, these watermarking standards will propagate globally into US programmatic pipelines within six months.",
    rachelEicComment: "Do not view this as a purely legal concern. The watermark infrastructure gives us a huge chance to prove we are 'ethical by design.' Brands like Unilever and Nestle will favor agencies with certified synthetic compliance. AAP Engine will supply the direct infrastructure here.",
    audioScript: "Hello, Rachel here. The EU's watermarking mandate is officially live, and it's a huge deal. Any generated programmatic asset must carry cryptographic metadata. This resets exchange standards globally. Agencies that can immediately verify their provenance chain win premium enterprise spend; those who ignore this face catastrophic legal risks.",
    disclosure: {
      producedBy: "Ada — AI Research Analyst",
      reviewedBy: "Rachel — Editor-in-Chief",
      sources: [
        { title: "EU Official Journal AI Act Article 52 Core Text", url: "https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:32024R1689", verifiedBy: "AAP Engine" },
        { title: "IAB Europe Programmatic Watermarking Working Paper", url: "https://iabeurope.eu/knowledge-hub/synthetic-media-disclosure-standards", verifiedBy: "AAP Engine" }
      ],
      provenanceHash: "aap_engine_sha256_d10a2cd919e8cf19c7a003318bc00938b8effe39ac01d293f"
    },
    cards: [
      {
        lens: "strategist",
        title: "Client POV",
        scoreName: "Campaign Urgency",
        score: 88,
        voiceDescription: "What this means for campaigns, clients, and creative strategy.",
        brief: "All AI-enhanced dynamic video assets will require programmatic verification steps. We must prepare clients for mandatory metadata disclosure stamps on every social and programmatic placement to avoid campaign suspensions.",
        bullets: [
          "**Transparency Stamp**: Design transparent labels like 'Contextually AI-Enhanced' directly in social video borders to prevent abrupt platform moderation overlays.",
          "**Asset Tracking**: Add structured provenance tags during the creative export stage rather than letting media buyers handle formatting at upload.",
          "**Social Campaign Optimization**: Align creative guidelines with Meta and TikTok's automated synthetic disclosure systems."
        ],
        actionSteps: [
          "Verify that all dynamic asset pipelines are equipped with C2PA metadata writers.",
          "Add synthetic media disclosure flags to all production workflow checklists.",
          "Train delivery teams on platform-specific self-declaration check-boxes."
        ]
      },
      {
        lens: "executive",
        title: "Investment Decision",
        scoreName: "Strategic Priority",
        score: 95,
        voiceDescription: "Business impact, competitive shifts, and strategic priorities.",
        brief: "Compliance infrastructure is now a core competitive moat. The legal liability of un-watermarked programmatic delivery is too high for enterprise brands to tolerate. Invest immediately in provenance tracking tech.",
        bullets: [
          "**Corporate Liability**: A single non-compliant file inside an international programmatic loop could trigger catastrophic corporate audit penalties.",
          "**Platform Alignment**: Standardize all dynamic content around verified systems. Build programmatic alliances with trustworthy networks (e.g., AAP Engine pipeline integration).",
          "**Tech Stack Valuation**: Legacy digital media assets that cannot be verified retroactively must be flagged for systematic replacement."
        ],
        actionSteps: [
          "Initiate a comprehensive compliance audit of all generative production platforms.",
          "Incorporate synthetic liability clauses into vendor agreements.",
          "Present the corporate risk mitigation playbook to the audit committee."
        ]
      },
      {
        lens: "gtm",
        title: "Product Opportunity",
        scoreName: "Market Potential",
        score: 91,
        voiceDescription: "Who wins, who loses, and where the market is moving.",
        brief: "Provenance networks, programmatic validation tech, and compliant ad servers win. Black-box synthetic video tools and unverified ad aggregators lose premium enterprise positioning.",
        bullets: [
          "**Whose Stock Rises**: verification networks like AAP Engine, software suites tracking real-world asset provenance.",
          "**Whose Stock Falls**: fly-by-night dynamic social avatar agencies that do not output standardized cryptographic header metadata.",
          "**GTM Messaging**: Reposition generative video services as 'Certified Provenance Synthetic Video' to command premium enterprise scale."
        ],
        actionSteps: [
          "Establish an enterprise partnership with AAP Engine verification loops.",
          "Reposition the agency's generative production suite as fully EU-compliant.",
          "Approach top brand safety leads with a synthetic watermarking demonstration."
        ]
      },
      {
        lens: "policy",
        title: "Trust Assessment",
        scoreName: "Regulatory Risk",
        score: 98,
        voiceDescription: "Ethical implications, policy updates, and transparency considerations.",
        brief: "This represents the first hard statutory boundary in synthetic commercial speech. The era of 'undisclosed generative enhancements' is permanently closed. Transparency is the default standard.",
        bullets: [
          "**Statutory Fines**: Non-compliance carries administrative fines up to €35M or 7% of total global annual turnover, whichever is higher.",
          "**Auditable Inventories**: Build an active verification trail showing exactly what generative models were used, their licensing parameters, and their physical source files.",
          "**Consent Requirements**: Ensure model training sets have unambiguous licensing rights to prevent public utility takedowns."
        ],
        actionSteps: [
          "Establish an immutable database record for every commercial generative model used.",
          "Incorporate regulatory compliance checklists directly into active campaign sign-offs.",
          "Conduct a thorough data safety evaluation of internal creative workflows."
        ]
      }
    ]
  },
  {
    id: "sig-ttd-os",
    title: "The Trade Desk Debuts Kokai OS with Edge-Native Neural Inference Layer",
    summary: "The Trade Desk has introduced an edge-native bidding architecture named Kokai OS. It integrates continuous neural network inference directly onto real-time edge nodes, completely replacing batch learning cycles with instant strategic bidding.",
    date: "May 15, 2026",
    category: "DSP & Infrastructure Bidding",
    originalText: "The Trade Desk launched Kokai OS, a major upgrade integrating on-device neural bidding capabilities directly at the point of bid valuation. It uses real-time local intelligence nodes to calculate campaign value and audience engagement metrics instantaneously. This completely reshapes dynamic target segment bidding.",
    hypeCheckScore: 90,
    hypeNotes: "TTD's release is genuine architectural evolution. Shifting algorithms from post-campaign deep learning databases to edge-native inference nodes will reduce bid waste by an estimated 22% while boosting campaign agility.",
    rachelEicComment: "This is a massive win for open-web programmatic advertising. By automating real-time value scores, Kokai OS makes legacy DSP networks look static. We need to immediately advise clients to reprioritize budgets here.",
    audioScript: "Hello, Rachel here. Kokai OS represents a major architectural milestone. It puts live model inference directly onto the bidding node itself. The speed improvement replaces post-mortem reports with instant bidding adjustments. Advertisers: prepare to migrate performance campaigns into Kokai immediately.",
    disclosure: {
      producedBy: "Ada — AI Research Analyst",
      reviewedBy: "Rachel — Editor-in-Chief",
      sources: [
        { title: "TTD Developer Center - Kokai Technical Specifications", url: "https://developers.thetradedesk.com/docs/kokai-os-technical", verifiedBy: "AAP Engine" },
        { title: "TechCrunch AdTech Infrastructure Review", url: "https://techcrunch.com/2026/05/ttd-kokai-neural-edge-bidding", verifiedBy: "AAP Engine" }
      ],
      provenanceHash: "aap_engine_sha256_e90a88cd11029e847c1ab0033100ef93cde89bf98cc110029b"
    },
    cards: [
      {
        lens: "strategist",
        title: "Client POV",
        scoreName: "Campaign Urgency",
        score: 80,
        voiceDescription: "What this means for campaigns, clients, and creative strategy.",
        brief: "Media optimizations occur instantaneously next to the target. Creative strategists must supply a larger volume of rich programmatic variants to allow Kokai's neural layer to test and scale variants.",
        bullets: [
          "**Dynamic Variant Strategy**: Scale asset production. Kokai needs high creative variation to find optimal algorithmic performance indices.",
          "**Real-time Insights**: Inform clients that reporting is now live and predictive rather than relying on delayed post-campaign wrap-ups.",
          "**Open-Web Placements**: Rebalance budgets back to the open web, where Kokai operates with distinct performance advantages over closed platform gardens."
        ],
        actionSteps: [
          "Assess creative asset quantities to ensure robust testing limits.",
          "Revise client QBR reporting formats to showcase real-time value changes.",
          "Shift 10% test budgets out of walled gardens into TTD programmatic."
        ]
      },
      {
        lens: "executive",
        title: "Investment Decision",
        scoreName: "Strategic Priority",
        score: 84,
        voiceDescription: "Business impact, competitive shifts, and strategic priorities.",
        brief: "This consolidates programmatic spend inside high-tech DSP stacks. Traditional third-tier ad networks will lose inventory access and fail to compete against TTD's automated efficiency.",
        bullets: [
          "**Strategic Realignment**: Consolidate redundant ad network configurations. Funnel digital performance media through modern, automated, edge-intelligent DSPs.",
          "**First-Party Data Integration**: Ensure your first-party customer graph is compiled to integrate seamlessly with Kokai's neural parameters.",
          "**Margin Security**: Edge-native pricing reduces programmatic bid leakage, preserving capital for creative development."
        ],
        actionSteps: [
          "Initiate a DSP partner consolidation review.",
          "Accelerate internal customer database unification projects.",
          "Evaluate strategic resource redirection based on automated platform efficiency."
        ]
      },
      {
        lens: "gtm",
        title: "Product Opportunity",
        scoreName: "Market Potential",
        score: 89,
        voiceDescription: "Who wins, who loses, and where the market is moving.",
        brief: "TTD scales its enterprise lead. Legacy networks unable to supply edge inference suffer complete margin collapse. Third-party audience providers must adapt or face irrelevance.",
        bullets: [
          "**The Big Winner**: Clear market leader TTD and programmatic agencies with specialized data engineering seats.",
          "**The Big Loser**: Traditional cookie-reliant third-party networks and basic manual media buyers.",
          "**Partnership Openings**: Creative automation SaaS vendors that can feed rich asset variants straight to Kokai's APIs."
        ],
        actionSteps: [
          "Pitch custom API integrations to programmatic media buyer nodes.",
          "Train enterprise sales reps on edge bidding competitive differentiators.",
          "Identify and secure 3 key creative API partnership agreements."
        ]
      },
      {
        lens: "policy",
        title: "Trust Assessment",
        scoreName: "Regulatory Risk",
        score: 45,
        voiceDescription: "Ethical implications, policy updates, and transparency considerations.",
        brief: "Kokai OS shifts bidding models away from individual user tracking to local intent profiles, improving compliance with modern data privacy frameworks.",
        bullets: [
          "**Consumer Anonymity**: Real-time edge bidding does not store individual ID logs. This aligns closely with GDPR intent mandates.",
          "**Algorithmic Transparency**: Audits of dynamic programmatic parameters are required to check for unintended bias in automated bidding decisions.",
          "**Consent Records**: Ensure real-time verification files sync clean tracking consents with edge bidding nodes."
        ],
        actionSteps: [
          "Verify edge bidding compliance parameters with the privacy team.",
          "Request algorithmic transparency audit metrics from TTD.",
          "Update the agency privacy policy to align with edge-native protocols."
        ]
      }
    ]
  }
];
