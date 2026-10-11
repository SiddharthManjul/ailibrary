export const home = {
  "heroKits": [
    {
      "name": "Sales",
      "slug": "sales",
      "accentDark": "#FFB224",
      "accentLight": "#B45309",
      "trio": [
        "#F07A2E",
        "#FFB224",
        "#FFE3A1"
      ],
      "workflowFile": "lead-qualifier.n8n.json",
      "workflowMeta": "n8n · Make",
      "workflowStats": "1.8s · $0.004",
      "nodes": [
        [
          "Form",
          "new lead"
        ],
        [
          "Enrich",
          "company"
        ],
        [
          "Score",
          "fit 0-100"
        ],
        [
          "Route",
          "HubSpot"
        ]
      ],
      "agent": "agents/inbound-qualifier",
      "agentSteps": [
        [
          "read",
          "lead #4182",
          "6ms"
        ],
        [
          "enrich",
          "firmographics",
          "840ms"
        ],
        [
          "score",
          "ICP match",
          "1.1s"
        ],
        [
          "route",
          "owner assigned",
          "90ms"
        ]
      ],
      "score": 88,
      "verdict": "qualified",
      "uiFile": "pipeline-board.tsx",
      "kpi": {
        "label": "Qualified",
        "value": 38,
        "suffix": ""
      },
      "kpi2": {
        "label": "Pipeline",
        "value": "$84k"
      },
      "bars": [
        3,
        4,
        4,
        6,
        5,
        7,
        9
      ],
      "rows": [
        [
          "Northwind Labs",
          "Hot"
        ],
        [
          "Acme Freight",
          "Nurture"
        ]
      ]
    },
    {
      "name": "Support",
      "slug": "support",
      "accentDark": "#2DD4BF",
      "accentLight": "#0F766E",
      "trio": [
        "#2A8C9C",
        "#4FD6D8",
        "#BDF4F2"
      ],
      "workflowFile": "ticket-triage.n8n.json",
      "workflowMeta": "n8n · Zapier",
      "workflowStats": "1.4s · $0.003",
      "nodes": [
        [
          "Ticket",
          "Zendesk"
        ],
        [
          "Classify",
          "intent"
        ],
        [
          "Draft",
          "from KB"
        ],
        [
          "Route",
          "tier 1/2"
        ]
      ],
      "agent": "agents/support-triage",
      "agentSteps": [
        [
          "read",
          "ticket #9921",
          "4ms"
        ],
        [
          "kb.search",
          "3 articles",
          "410ms"
        ],
        [
          "draft",
          "grounded reply",
          "1.6s"
        ],
        [
          "check",
          "tone, policy",
          "280ms"
        ]
      ],
      "score": 92,
      "verdict": "approved",
      "uiFile": "support-ops.tsx",
      "kpi": {
        "label": "Auto-resolved",
        "value": 63,
        "suffix": "%"
      },
      "kpi2": {
        "label": "CSAT",
        "value": "4.7"
      },
      "bars": [
        6,
        5,
        6,
        7,
        6,
        8,
        9
      ],
      "rows": [
        [
          "#9921 Refund",
          "Drafted"
        ],
        [
          "#9918 SSO login",
          "Escalated"
        ]
      ]
    },
    {
      "name": "Marketing",
      "slug": "marketing",
      "accentDark": "#FF4FA3",
      "accentLight": "#D61F69",
      "trio": [
        "#C2185B",
        "#FF4FA3",
        "#FFC2DC"
      ],
      "workflowFile": "content-brief.n8n.json",
      "workflowMeta": "n8n · Make",
      "workflowStats": "2.1s · $0.006",
      "nodes": [
        [
          "Brief",
          "form"
        ],
        [
          "Plan",
          "7 days"
        ],
        [
          "Draft",
          "per channel"
        ],
        [
          "Schedule",
          "LinkedIn, X"
        ]
      ],
      "agent": "agents/campaign-writer",
      "agentSteps": [
        [
          "read",
          "q4 webinar brief",
          "5ms"
        ],
        [
          "brand.voice",
          "load rules",
          "120ms"
        ],
        [
          "draft",
          "3 channels",
          "2.2s"
        ],
        [
          "check",
          "length, CTA",
          "310ms"
        ]
      ],
      "score": 87,
      "verdict": "ready",
      "uiFile": "campaign-board.tsx",
      "kpi": {
        "label": "Drafts",
        "value": 24,
        "suffix": ""
      },
      "kpi2": {
        "label": "Open rate",
        "value": "46%"
      },
      "bars": [
        4,
        4,
        5,
        5,
        6,
        6,
        8
      ],
      "rows": [
        [
          "Webinar invite",
          "Queued"
        ],
        [
          "Speaker teaser",
          "Draft"
        ]
      ]
    },
    {
      "name": "Engineering",
      "slug": "engineering",
      "accentDark": "#9B7BFF",
      "accentLight": "#6D28D9",
      "trio": [
        "#5B3FD6",
        "#9B7BFF",
        "#D9CFFF"
      ],
      "workflowFile": "pr-digest.n8n.json",
      "workflowMeta": "n8n",
      "workflowStats": "1.3s · $0.005",
      "nodes": [
        [
          "GitHub",
          "PR opened"
        ],
        [
          "Diff",
          "+412 −88"
        ],
        [
          "Review",
          "risk check"
        ],
        [
          "Slack",
          "digest"
        ]
      ],
      "agent": "agents/code-reviewer",
      "agentSteps": [
        [
          "read",
          "PR #1187",
          "6ms"
        ],
        [
          "git.diff",
          "14 files",
          "340ms"
        ],
        [
          "tests.map",
          "coverage",
          "520ms"
        ],
        [
          "review",
          "1 change",
          "3.1s"
        ]
      ],
      "score": 74,
      "verdict": "1 change",
      "uiFile": "release-board.tsx",
      "kpi": {
        "label": "PRs reviewed",
        "value": 41,
        "suffix": ""
      },
      "kpi2": {
        "label": "First review",
        "value": "14m"
      },
      "bars": [
        5,
        6,
        4,
        6,
        7,
        6,
        8
      ],
      "rows": [
        [
          "#1191 Retry queue",
          "Approved"
        ],
        [
          "#1187 Prorate",
          "Changes"
        ]
      ]
    },
    {
      "name": "Operations",
      "slug": "operations",
      "accentDark": "#7CF46A",
      "accentLight": "#15803D",
      "trio": [
        "#3C8F38",
        "#7CF46A",
        "#CDFAC4"
      ],
      "workflowFile": "invoice-intake.n8n.json",
      "workflowMeta": "n8n · Make",
      "workflowStats": "0.9s · $0.002",
      "nodes": [
        [
          "Inbox",
          "invoice.pdf"
        ],
        [
          "Extract",
          "fields"
        ],
        [
          "Match",
          "PO-7781"
        ],
        [
          "Ledger",
          "Xero"
        ]
      ],
      "agent": "agents/reconciler",
      "agentSteps": [
        [
          "read",
          "INV-20931",
          "4ms"
        ],
        [
          "po.lookup",
          "PO-7781",
          "190ms"
        ],
        [
          "bank.check",
          "unchanged",
          "220ms"
        ],
        [
          "post",
          "ledger entry",
          "0.9s"
        ]
      ],
      "score": 96,
      "verdict": "matched",
      "uiFile": "ops-ledger.tsx",
      "kpi": {
        "label": "Auto-matched",
        "value": 91,
        "suffix": "%"
      },
      "kpi2": {
        "label": "Days to close",
        "value": "2.5"
      },
      "bars": [
        5,
        6,
        6,
        7,
        7,
        8,
        9
      ],
      "rows": [
        [
          "INV-20931",
          "Matched"
        ],
        [
          "INV-20928",
          "Review"
        ]
      ]
    }
  ],
  "kitColors": {
    "sales": [
      "#F07A2E",
      "#FFB224",
      "#FFE3A1"
    ],
    "support": [
      "#2A8C9C",
      "#4FD6D8",
      "#BDF4F2"
    ],
    "marketing": [
      "#C2185B",
      "#FF4FA3",
      "#FFC2DC"
    ],
    "engineering": [
      "#5B3FD6",
      "#9B7BFF",
      "#D9CFFF"
    ],
    "operations": [
      "#3C8F38",
      "#7CF46A",
      "#CDFAC4"
    ],
    "all": [
      "#9B7BFF",
      "#9B7BFF",
      "#9B7BFF"
    ]
  },
  "kitsStory": [
    {
      "slug": "sales",
      "name": "Sales",
      "comps": 14,
      "price": "$149",
      "steps": [
        [
          "WORKFLOW",
          "A lead books a demo",
          "Your form posts to the workflow the moment it is submitted. No polling, no lost leads."
        ],
        [
          "WORKFLOW",
          "The workflow enriches and scores it",
          "Company data, a dedupe against HubSpot and an ICP fit score, with retries on every call."
        ],
        [
          "AGENT",
          "The agent drafts the first email",
          "It researches the account, writes the reply and waits for the rep to approve it."
        ],
        [
          "UI",
          "Your pipeline updates itself",
          "The dashboard block shows the new deal, its owner and its score, live."
        ]
      ],
      "inTitle": "Book a demo",
      "inSrc": "fieldline.example/demo",
      "inFields": [
        [
          "Name",
          "Maya Okafor"
        ],
        [
          "Work email",
          "maya@northwind-logistics.example"
        ],
        [
          "Company",
          "Northwind Logistics"
        ],
        [
          "Fleet size",
          "140 vehicles"
        ]
      ],
      "inBtn": "Book my demo",
      "inFoot": "POST /webhook/lead · 202 accepted · 38ms",
      "flowFile": "workflows/sales/inbound-lead-qualifier.n8n.json",
      "nodes": [
        [
          "Form",
          "webhook",
          "form"
        ],
        [
          "Enrich",
          "company",
          "globe"
        ],
        [
          "Dedupe",
          "HubSpot",
          "merge"
        ],
        [
          "Score",
          "fit 0-100",
          "gauge"
        ],
        [
          "Route",
          "owner",
          "route"
        ]
      ],
      "out": [
        [
          "Company",
          "Northwind Logistics · 140 staff"
        ],
        [
          "Fit score",
          "88 · Hot"
        ],
        [
          "Owner",
          "Priya Nair"
        ]
      ],
      "agName": "inbound-qualifier",
      "calls": [
        [
          "crm.get_lead",
          "#4182",
          "6ms"
        ],
        [
          "web.research",
          "northwind-logistics.example",
          "1.2s"
        ],
        [
          "icp.match",
          "88 of 100",
          "140ms"
        ],
        [
          "email.draft",
          "142 words",
          "1.9s"
        ]
      ],
      "ask": "Send the first email to Maya Okafor?",
      "who": "for Priya Nair",
      "prev": "Hi Maya, thanks for booking a demo. Running 140 vehicles across three depots is exactly where work orders start slipping...",
      "done": "Approved by Priya · sent 09:43",
      "dashFile": "sales-pipeline.tsx",
      "kpis": [
        [
          "Qualified this week",
          "",
          38,
          "",
          0
        ],
        [
          "Pipeline added",
          "$",
          84,
          "k",
          0
        ],
        [
          "Reply rate",
          "",
          41,
          "%",
          0
        ]
      ],
      "cols": [
        "Account",
        "Stage",
        "Fit",
        "Owner"
      ],
      "rows": [
        [
          "Northwind Logistics",
          "Hot",
          "88",
          "Priya"
        ],
        [
          "Lumen Health",
          "Hot",
          "81",
          "Arjun"
        ],
        [
          "Acme Freight",
          "Nurture",
          "64",
          "Jon"
        ]
      ]
    },
    {
      "slug": "support",
      "name": "Support",
      "comps": 12,
      "price": "$149",
      "steps": [
        [
          "WORKFLOW",
          "A customer opens a ticket",
          "Zendesk sends the ticket to the workflow as soon as it is created."
        ],
        [
          "WORKFLOW",
          "The workflow classifies and routes it",
          "Intent, urgency and language, then the right queue. Duplicates never reach a person."
        ],
        [
          "AGENT",
          "The agent drafts a grounded answer",
          "It searches your help center, cites its sources and waits for a teammate to approve the reply."
        ],
        [
          "UI",
          "Your support dashboard updates",
          "Queue health, auto-resolved rate and CSAT, live."
        ]
      ],
      "inTitle": "New ticket #9921",
      "inSrc": "Zendesk · help.fieldline.example",
      "inFields": [
        [
          "From",
          "Daniel Reyes"
        ],
        [
          "Subject",
          "SSO with Okta keeps failing"
        ],
        [
          "Plan",
          "Team · 24 seats"
        ],
        [
          "Message",
          "Users see \"invalid audience\" after login"
        ]
      ],
      "inBtn": "Submit ticket",
      "inFoot": "webhook · ticket.created · 41ms",
      "flowFile": "workflows/support/ticket-triage.n8n.json",
      "nodes": [
        [
          "Ticket",
          "Zendesk",
          "mail"
        ],
        [
          "Classify",
          "intent",
          "spark"
        ],
        [
          "Dedupe",
          "open tickets",
          "merge"
        ],
        [
          "Priority",
          "SLA",
          "clock"
        ],
        [
          "Route",
          "tier 1",
          "route"
        ]
      ],
      "out": [
        [
          "Intent",
          "How-to · SSO"
        ],
        [
          "Priority",
          "Normal · 4h SLA"
        ],
        [
          "Queue",
          "Tier 1 · English"
        ]
      ],
      "agName": "grounded-answer",
      "calls": [
        [
          "kb.search",
          "\"okta invalid audience\"",
          "380ms"
        ],
        [
          "kb.read",
          "SSO setup guide",
          "90ms"
        ],
        [
          "answer.draft",
          "3 citations",
          "1.7s"
        ],
        [
          "policy.check",
          "tone, no promises",
          "210ms"
        ]
      ],
      "ask": "Send this reply to Daniel Reyes?",
      "who": "for Lena Ortiz",
      "prev": "Hi Daniel, \"invalid audience\" means the Audience URI in Okta no longer matches. Set it to app.fieldline.example/sso and...",
      "done": "Approved by Lena · sent 10:12",
      "dashFile": "support-operations.tsx",
      "kpis": [
        [
          "Auto-resolved",
          "",
          63,
          "%",
          0
        ],
        [
          "CSAT",
          "",
          4.7,
          "",
          1
        ],
        [
          "First reply",
          "",
          3,
          "m",
          0
        ]
      ],
      "cols": [
        "Ticket",
        "Intent",
        "Status",
        "SLA left"
      ],
      "rows": [
        [
          "#9921 SSO with Okta",
          "How-to",
          "Drafted",
          "3h 58m"
        ],
        [
          "#9918 Duplicate charge",
          "Billing",
          "Approved",
          "1h 12m"
        ],
        [
          "#9917 API 500s",
          "Bug",
          "Escalated",
          "22m"
        ]
      ]
    },
    {
      "slug": "marketing",
      "name": "Marketing",
      "comps": 11,
      "price": "$149",
      "steps": [
        [
          "WORKFLOW",
          "You publish a post",
          "A new article on your blog triggers the workflow through RSS or a webhook."
        ],
        [
          "WORKFLOW",
          "The workflow repurposes it",
          "It pulls the article and plans posts for LinkedIn, X and your newsletter."
        ],
        [
          "AGENT",
          "The agent edits for your voice",
          "It rewrites every draft against your brand rules and asks before anything is scheduled."
        ],
        [
          "UI",
          "Your attribution dashboard fills in",
          "What each post brings back, by channel, live."
        ]
      ],
      "inTitle": "Published: Downtime starts in the parts room",
      "inSrc": "fieldline.example/blog",
      "inFields": [
        [
          "Author",
          "Ana Kovac"
        ],
        [
          "Length",
          "1,840 words"
        ],
        [
          "Tags",
          "maintenance, inventory"
        ],
        [
          "Channels",
          "LinkedIn, X, Email"
        ]
      ],
      "inBtn": "Publish",
      "inFoot": "rss · new item · picked up in 12s",
      "flowFile": "workflows/marketing/content-repurposer.n8n.json",
      "nodes": [
        [
          "Post",
          "RSS",
          "rss"
        ],
        [
          "Fetch",
          "article",
          "file"
        ],
        [
          "Plan",
          "7 posts",
          "calendar"
        ],
        [
          "Brand",
          "check",
          "shield"
        ],
        [
          "Queue",
          "scheduler",
          "send"
        ]
      ],
      "out": [
        [
          "Planned",
          "7 posts, 3 channels"
        ],
        [
          "Brand check",
          "2 fixes applied"
        ],
        [
          "Schedule",
          "Mon to Fri, 9:30"
        ]
      ],
      "agName": "brand-voice-editor",
      "calls": [
        [
          "brand.rules",
          "24 rules",
          "40ms"
        ],
        [
          "drafts.read",
          "7 posts",
          "10ms"
        ],
        [
          "voice.rewrite",
          "5 edited",
          "2.4s"
        ],
        [
          "lint.length",
          "all within limits",
          "60ms"
        ]
      ],
      "ask": "Schedule 7 posts from Monday?",
      "who": "for Ana Kovac",
      "prev": "Most fleet downtime does not start in the shop. It starts in the parts room, three days earlier...",
      "done": "Approved by Ana · 7 scheduled",
      "dashFile": "marketing-attribution.tsx",
      "kpis": [
        [
          "Posts this week",
          "",
          7,
          "",
          0
        ],
        [
          "Click-through",
          "",
          3.8,
          "%",
          1
        ],
        [
          "Signups",
          "",
          46,
          "",
          0
        ]
      ],
      "cols": [
        "Post",
        "Channel",
        "Status",
        "Clicks"
      ],
      "rows": [
        [
          "Downtime starts in parts",
          "LinkedIn",
          "Scheduled",
          "·"
        ],
        [
          "3 parts-room fixes",
          "X",
          "Scheduled",
          "·"
        ],
        [
          "October field notes",
          "Email",
          "Sent",
          "412"
        ]
      ]
    },
    {
      "slug": "engineering",
      "name": "Engineering",
      "comps": 13,
      "price": "$149",
      "steps": [
        [
          "WORKFLOW",
          "An alert fires",
          "Sentry or your pager sends the alert to the workflow the second it opens."
        ],
        [
          "WORKFLOW",
          "The workflow groups and enriches it",
          "It merges repeats, pulls recent deploys and error samples, then sets a severity."
        ],
        [
          "AGENT",
          "The agent finds the likely cause",
          "It reads logs and diffs, proposes a fix and asks before it rolls anything back."
        ],
        [
          "UI",
          "Your incident board updates",
          "Status, owner and timeline in one place, live."
        ]
      ],
      "inTitle": "Alert: checkout-api error rate",
      "inSrc": "Sentry · production",
      "inFields": [
        [
          "Service",
          "checkout-api"
        ],
        [
          "Error",
          "TypeError in applyCoupon"
        ],
        [
          "Rate",
          "4.2% of requests"
        ],
        [
          "Since",
          "10:02 UTC"
        ]
      ],
      "inBtn": "Alert opened",
      "inFoot": "webhook · issue.alert · 29ms",
      "flowFile": "workflows/engineering/incident-triage.n8n.json",
      "nodes": [
        [
          "Alert",
          "Sentry",
          "alert"
        ],
        [
          "Group",
          "12 events",
          "merge"
        ],
        [
          "Deploys",
          "GitHub",
          "git"
        ],
        [
          "Severity",
          "SEV-2",
          "gauge"
        ],
        [
          "Notify",
          "Slack",
          "chat"
        ]
      ],
      "out": [
        [
          "Grouped",
          "12 alerts into 1"
        ],
        [
          "Suspect",
          "Deploy #1187 · 10:00"
        ],
        [
          "Severity",
          "SEV-2 · on-call paged"
        ]
      ],
      "agName": "incident-triage",
      "calls": [
        [
          "logs.query",
          "applyCoupon 5xx",
          "620ms"
        ],
        [
          "git.diff",
          "#1187 · 14 files",
          "340ms"
        ],
        [
          "trace.compare",
          "null coupon",
          "410ms"
        ],
        [
          "fix.propose",
          "revert #1187",
          "1.8s"
        ]
      ],
      "ask": "Roll back deploy #1187?",
      "who": "for Ravi Shah",
      "prev": "Errors started 2 minutes after #1187. applyCoupon reads coupon.code when coupon is null. No migrations, so a rollback is safe.",
      "done": "Approved by Ravi · rolled back 10:09",
      "dashFile": "incident-board.tsx",
      "kpis": [
        [
          "Open incidents",
          "",
          1,
          "",
          0
        ],
        [
          "Time to triage",
          "",
          4,
          "m",
          0
        ],
        [
          "MTTR this month",
          "",
          38,
          "m",
          0
        ]
      ],
      "cols": [
        "Incident",
        "Severity",
        "Status",
        "Owner"
      ],
      "rows": [
        [
          "checkout-api errors",
          "SEV-2",
          "Mitigated",
          "Ravi"
        ],
        [
          "Slow search p95",
          "SEV-3",
          "Watching",
          "Ana"
        ],
        [
          "Webhook retries",
          "SEV-4",
          "Resolved",
          "Jon"
        ]
      ]
    },
    {
      "slug": "operations",
      "name": "Operations",
      "comps": 12,
      "price": "$149",
      "steps": [
        [
          "WORKFLOW",
          "An invoice lands in the inbox",
          "The workflow watches your finance inbox and picks up every PDF and photo."
        ],
        [
          "WORKFLOW",
          "The workflow extracts and matches it",
          "Fields come out of the PDF, then get matched to the purchase order and checked for duplicates."
        ],
        [
          "AGENT",
          "The agent checks it before posting",
          "It verifies bank details, flags anything odd and asks before it posts to Xero."
        ],
        [
          "UI",
          "Your finance overview updates",
          "Payables, exceptions and days to close, live."
        ]
      ],
      "inTitle": "Invoice INV-20931",
      "inSrc": "ap@fieldline.example",
      "inFields": [
        [
          "From",
          "Brightline Supply"
        ],
        [
          "Amount",
          "$12,480.00"
        ],
        [
          "Due",
          "Nov 15, 2026"
        ],
        [
          "Attachment",
          "INV-20931.pdf"
        ]
      ],
      "inBtn": "Received",
      "inFoot": "gmail · new message · picked up in 2.1s",
      "flowFile": "workflows/operations/invoice-and-receipt-capture.n8n.json",
      "nodes": [
        [
          "Inbox",
          "Gmail",
          "mail"
        ],
        [
          "Extract",
          "OCR",
          "scan"
        ],
        [
          "Match",
          "PO-7781",
          "check"
        ],
        [
          "Dedupe",
          "ledger",
          "merge"
        ],
        [
          "Queue",
          "review",
          "db"
        ]
      ],
      "out": [
        [
          "Vendor",
          "Brightline Supply"
        ],
        [
          "PO match",
          "PO-7781 · exact"
        ],
        [
          "Duplicate",
          "None found"
        ]
      ],
      "agName": "invoice-extractor",
      "calls": [
        [
          "po.lookup",
          "PO-7781",
          "190ms"
        ],
        [
          "vendor.bank",
          "unchanged since March",
          "220ms"
        ],
        [
          "totals.check",
          "lines sum correctly",
          "30ms"
        ],
        [
          "bill.prepare",
          "Xero draft",
          "0.9s"
        ]
      ],
      "ask": "Post $12,480.00 to Xero as a bill?",
      "who": "for Omar Haddad",
      "prev": "Matches PO-7781 exactly. Bank details unchanged since March. Due Nov 15 on net-30 terms.",
      "done": "Approved by Omar · posted 11:20",
      "dashFile": "finance-overview.tsx",
      "kpis": [
        [
          "Auto-matched",
          "",
          91,
          "%",
          0
        ],
        [
          "Days to close",
          "",
          2.5,
          "",
          1
        ],
        [
          "Exceptions",
          "",
          3,
          "",
          0
        ]
      ],
      "cols": [
        "Invoice",
        "Vendor",
        "Status",
        "Amount"
      ],
      "rows": [
        [
          "INV-20931",
          "Brightline Supply",
          "Posted",
          "$12,480"
        ],
        [
          "INV-20928",
          "Copperleaf",
          "Review",
          "$3,210"
        ],
        [
          "INV-20925",
          "Northgate",
          "Paid",
          "$860"
        ]
      ]
    }
  ],
  "worksWith": [
    "n8n",
    "Make",
    "Zapier",
    "Claude",
    "Cursor",
    "Codex",
    "HubSpot",
    "Zendesk",
    "Slack",
    "Stripe",
    "GitHub",
    "Linear",
    "Xero",
    "Sentry",
    "Notion",
    "Gmail"
  ],
  "workflowDemo": {
    "nodes": [
      [
        "wh",
        "Webhook",
        "new lead",
        "bolt"
      ],
      [
        "va",
        "Validate",
        "schema",
        "check"
      ],
      [
        "en",
        "Enrich",
        "HTTP",
        "globe"
      ],
      [
        "ai",
        "AI score",
        "fit 0-100",
        "spark"
      ],
      [
        "if",
        "Fit 70+?",
        "IF",
        "branch"
      ],
      [
        "hs",
        "HubSpot",
        "create deal",
        "db"
      ],
      [
        "nu",
        "Nurture",
        "email list",
        "mail"
      ],
      [
        "dl",
        "Dead letter",
        "on error",
        "alert"
      ]
    ],
    "positions": {
      "h": {
        "wh": [
          8,
          40
        ],
        "va": [
          23,
          40
        ],
        "en": [
          38,
          40
        ],
        "ai": [
          53,
          40
        ],
        "if": [
          68,
          40
        ],
        "hs": [
          88,
          20
        ],
        "nu": [
          88,
          60
        ],
        "dl": [
          38,
          80
        ]
      },
      "v": {
        "wh": [
          50,
          9
        ],
        "va": [
          50,
          23
        ],
        "en": [
          50,
          37
        ],
        "ai": [
          50,
          51
        ],
        "if": [
          50,
          65
        ],
        "hs": [
          29,
          86
        ],
        "nu": [
          71,
          86
        ],
        "dl": [
          86,
          37
        ]
      }
    },
    "edges": [
      [
        "wh",
        "va"
      ],
      [
        "va",
        "en"
      ],
      [
        "en",
        "ai"
      ],
      [
        "ai",
        "if"
      ],
      [
        "if",
        "hs"
      ],
      [
        "if",
        "nu"
      ],
      [
        "en",
        "dl"
      ]
    ],
    "log": [
      [
        250,
        "09:41:07",
        "webhook",
        "lead #4182 received",
        ""
      ],
      [
        900,
        "09:41:07",
        "validate",
        "6 fields ok",
        ""
      ],
      [
        1500,
        "09:41:08",
        "enrich",
        "429 rate limited · retry 1 of 3 in 1s",
        "is-err"
      ],
      [
        3300,
        "09:41:09",
        "enrich",
        "ok · Northwind Logistics, 140 staff",
        ""
      ],
      [
        4400,
        "09:41:10",
        "ai score",
        "fit 88 · $0.0031",
        ""
      ],
      [
        4800,
        "09:41:10",
        "route",
        "fit 70+ → HubSpot",
        ""
      ],
      [
        5500,
        "09:41:11",
        "hubspot",
        "deal created · owner Priya Nair",
        "is-ok"
      ]
    ]
  },
  "agentForms": [
    [
      "Code",
      [
        [
          "import { createAgent }",
          ""
        ],
        [
          "  from \"@ailibrary/refund-decision\"",
          ""
        ],
        [
          "const agent = createAgent({ approval: \"always\" })",
          ""
        ],
        [
          "const run = await agent.run({ ticketId: \"9921\" })",
          ""
        ],
        [
          "// run.status === \"awaiting_approval\"",
          "is-c"
        ]
      ],
      "npm i @ailibrary/refund-decision"
    ],
    [
      "Skill",
      [
        [
          "$ npx ailibrary add refund-decision --as skill",
          "is-p"
        ],
        [
          "✓ .claude/skills/refund-decision/SKILL.md",
          "is-ok"
        ],
        [
          "✓ scripts/  4 tools, same as the code form",
          "is-ok"
        ],
        [
          "",
          ""
        ],
        [
          "# then ask: \"refund the duplicate charge on #9921\"",
          "is-c"
        ]
      ],
      "npx ailibrary add refund-decision --as skill"
    ],
    [
      "MCP",
      [
        [
          "{ \"mcpServers\": {",
          ""
        ],
        [
          "    \"refund-decision\": {",
          ""
        ],
        [
          "      \"command\": \"npx\",",
          ""
        ],
        [
          "      \"args\": [\"@ailibrary/refund-decision\", \"mcp\"]",
          ""
        ],
        [
          "} } }",
          ""
        ]
      ],
      "\"refund-decision\": { \"command\": \"npx\", \"args\": [\"@ailibrary/refund-decision\", \"mcp\"] }"
    ],
    [
      "n8n",
      [
        [
          "$ npx ailibrary add refund-decision --as n8n",
          "is-p"
        ],
        [
          "✓ refund-decision.n8n.json  (AI Agent v3)",
          "is-ok"
        ],
        [
          "✓ write tools gated by human review",
          "is-ok"
        ],
        [
          "",
          ""
        ],
        [
          "# import into n8n 2.x, then set credentials",
          "is-c"
        ]
      ],
      "npx ailibrary add refund-decision --as n8n"
    ]
  ],
  "autonomyLevels": [
    [
      "1",
      "Always ask",
      "Every write waits for a person. The default for every agent."
    ],
    [
      "2",
      "Ask above a limit",
      "Refunds over $100 wait for a person. Smaller ones run and get logged."
    ],
    [
      "3",
      "Run alone",
      "No approvals. Every action is logged so you can review it later."
    ]
  ],
  "agentTable": [
    [
      "Inbound qualifier",
      "sales",
      "Sales",
      34,
      94,
      "0 of 6",
      "$0.011",
      "6.2s"
    ],
    [
      "Grounded answer",
      "support",
      "Support",
      40,
      97,
      "0 of 8",
      "$0.008",
      "4.1s"
    ],
    [
      "Brand voice editor",
      "marketing",
      "Marketing",
      32,
      92,
      "0 of 4",
      "$0.014",
      "7.4s"
    ],
    [
      "Incident triage",
      "engineering",
      "Engineering",
      36,
      91,
      "0 of 7",
      "$0.019",
      "9.8s"
    ],
    [
      "Invoice extractor",
      "operations",
      "Operations",
      38,
      96,
      "0 of 6",
      "$0.006",
      "3.3s"
    ]
  ],
  "approvalInbox": [
    [
      "Refund $49.00 to Daniel Reyes",
      "refund-decision · Support · 2m",
      "dollar"
    ],
    [
      "Send first email to Maya Okafor",
      "inbound-qualifier · Sales · 5m",
      "mail"
    ],
    [
      "Post $12,480.00 bill to Xero",
      "invoice-extractor · Ops · 12m",
      "file"
    ],
    [
      "Roll back deploy #1187",
      "incident-triage · Eng · 18m",
      "git"
    ]
  ],
  "dataGrid": [
    [
      "Northwind Logistics",
      "Hot",
      88,
      84000,
      "Priya"
    ],
    [
      "Lumen Health",
      "Hot",
      81,
      52000,
      "Arjun"
    ],
    [
      "Harborline",
      "Proposal",
      76,
      120000,
      "Priya"
    ],
    [
      "Acme Freight",
      "Nurture",
      64,
      23000,
      "Jon"
    ],
    [
      "Copperleaf",
      "New",
      58,
      18000,
      "Arjun"
    ]
  ],
  "terminalSessions": [
    [
      "claude · mcp",
      [
        [
          "in",
          ">",
          "add the support refund agent and wire it to our Stripe test key"
        ],
        [
          "tool",
          "",
          "● ailibrary.search_items(\"refund agent\")  →  support/refund-decision"
        ],
        [
          "tool",
          "",
          "● ailibrary.get_install(\"support/refund-decision\")"
        ],
        [
          "out",
          "",
          "● Bash(npx ailibrary add support/refund-decision)"
        ],
        [
          "ok",
          "",
          "  ✓ agents/refund-decision/   ✓ evals/ (32 cases)   ✓ .env.example"
        ],
        [
          "out",
          "",
          "● Bash(pnpm eval refund-decision)"
        ],
        [
          "ok",
          "",
          "  ✓ 31 of 32 passed · 0 unsafe actions · $0.006 per run"
        ],
        [
          "h",
          "",
          "Done. Add STRIPE_SECRET_KEY to .env, then run pnpm dev."
        ]
      ]
    ],
    [
      "cli",
      [
        [
          "in",
          "$",
          "npx ailibrary login"
        ],
        [
          "ok",
          "",
          "✓ Signed in as maya@fieldline.example · Team, 5 seats"
        ],
        [
          "in",
          "$",
          "npx ailibrary kit add sales"
        ],
        [
          "ok",
          "",
          "✓ 12 workflows   → workflows/sales/"
        ],
        [
          "ok",
          "",
          "✓ 10 agents      → agents/sales/"
        ],
        [
          "ok",
          "",
          "✓ 14 components  → components/ui/"
        ],
        [
          "ok",
          "",
          "✓ 1 dashboard    → app/(dashboard)/sales-pipeline/"
        ],
        [
          "c",
          "",
          "# next: import workflows/sales/*.n8n.json into n8n"
        ]
      ]
    ],
    [
      "llms.txt",
      [
        [
          "in",
          "$",
          "curl https://ailibrary.example/llms.txt"
        ],
        [
          "h",
          "",
          "# AI Library"
        ],
        [
          "out",
          "",
          "> Workflows, agents and UI components, packaged as kits."
        ],
        [
          "h",
          "",
          "## Docs"
        ],
        [
          "out",
          "",
          "- [Install the CLI](/docs/cli.md)"
        ],
        [
          "out",
          "",
          "- [Connect the MCP server](/docs/mcp.md)"
        ],
        [
          "h",
          "",
          "## Kits"
        ],
        [
          "out",
          "",
          "- [Sales kit](/kits/sales.md): 12 workflows, 10 agents, 1 dashboard"
        ]
      ]
    ]
  ],
  "nightlyTable": [
    [
      "Inbound lead qualifier",
      "WORKFLOW",
      "Sales",
      100,
      "$0.004",
      "1.8s",
      "03:12"
    ],
    [
      "Ticket triage",
      "WORKFLOW",
      "Support",
      100,
      "$0.003",
      "1.4s",
      "03:14"
    ],
    [
      "Content repurposer",
      "WORKFLOW",
      "Marketing",
      100,
      "$0.007",
      "2.6s",
      "03:16"
    ],
    [
      "Inbound qualifier",
      "AGENT",
      "Sales",
      94,
      "$0.011",
      "6.2s",
      "03:21"
    ],
    [
      "Incident triage",
      "AGENT",
      "Engineering",
      91,
      "$0.019",
      "9.8s",
      "03:31"
    ],
    [
      "Invoice extractor",
      "AGENT",
      "Operations",
      96,
      "$0.006",
      "3.3s",
      "03:34"
    ],
    [
      "Data grid",
      "UI",
      "All kits",
      100,
      "·",
      "axe · 0 issues",
      "03:40"
    ],
    [
      "Approval inbox",
      "UI",
      "All kits",
      100,
      "·",
      "axe · 0 issues",
      "03:41"
    ]
  ],
  "freeItems": [
    [
      "WORKFLOW",
      "sales",
      "Sales",
      "Reply classifier",
      "Sorts every reply into interested, not now, unsubscribe or out of office.",
      "npx ailibrary add sales/reply-classifier",
      0,
      "gmail → classify → hubspot",
      "",
      "",
      "",
      "+--------+     +----------+     +---------+\n| gmail  |---->| classify |---->| hubspot |\n+--------+     +----+-----+     +---------+\n                    |\n                    +---> [ unsubscribe ]\n                    +---> [ out of office ]"
    ],
    [
      "WORKFLOW",
      "engineering",
      "Engineering",
      "Daily standup digest",
      "Merged PRs, open incidents and blockers, posted to Slack at 9 every morning.",
      "npx ailibrary add engineering/daily-standup-digest",
      0,
      "github → summarise → slack",
      "",
      "",
      "",
      "[ github ]--+\n            |     +-----------+     +-------+\n[ linear ]--+---->| summarise |---->| slack |\n            |     +-----------+     +-------+\n[ sentry ]--+          every day, 09:00"
    ],
    [
      "AGENT",
      "engineering",
      "Engineering",
      "Release notes writer",
      "Turns merged pull requests into release notes your customers can read.",
      "npx ailibrary add engineering/release-notes-writer",
      1,
      "",
      "read 14 pull requests",
      "group by product area",
      "draft customer notes",
      "> read_prs(since: \"v1.3\")        14 found\n> group(by: \"area\")              4 groups\n> draft_notes(tone: \"customer\")\n  ..................................\n  ## v1.4\n  * Faster parts search\n  * Coupon fix at checkout"
    ],
    [
      "AGENT",
      "operations",
      "Operations",
      "Meeting to tasks",
      "Pulls owners, dates and decisions out of a transcript and files the tasks.",
      "npx ailibrary add operations/meeting-to-tasks",
      1,
      "",
      "read transcript",
      "find 6 tasks, 3 owners",
      "file them in Linear",
      "transcript.txt  =======>  agent\n   |\n   +-- [x] Ship pricing page     @ana   Fri\n   +-- [x] Renew parts contract  @omar  Nov 1\n   +-- [ ] Draft Q4 update       @maya"
    ],
    [
      "UI",
      "all",
      "All kits",
      "Run timeline",
      "Each step of an agent run with status, timing and retries, keyboard friendly.",
      "npx shadcn add @ailibrary/run-timeline",
      1,
      "",
      "search_kb · 380ms",
      "draft_answer · 1.7s",
      "request_approval",
      "(o) read ticket               8ms\n |\n(o) search knowledge base   380ms\n |\n(*) draft answer              ...\n |\n( ) request approval"
    ],
    [
      "UI",
      "all",
      "All kits",
      "KPI stat",
      "A number with its trend and a sparkline, accessible down to the data table.",
      "npx shadcn add @ailibrary/kpi-stat",
      2,
      "",
      "Auto-resolved",
      "63%",
      "",
      "AUTO-RESOLVED             7d | 30d\n\n  63%     +8.2 pts\n                              _.-'\n               ___.--.__.--''\n  ____.---''''"
    ]
  ],
  "pricing": [
    {
      "k": "Kit",
      "t": "One team, end to end",
      "d": "Every workflow, agent and screen one team needs, wired together.",
      "p": [
        "$149",
        "$449"
      ],
      "s": [
        "per kit · 1 seat",
        "per kit · 5 seats"
      ],
      "f": [
        "12 workflows for n8n, Make or Zapier",
        "10 agents in all four forms",
        "The dashboard block and its components",
        "Fixtures, evals and setup guides",
        "12 months of updates"
      ],
      "cta": "Choose a kit",
      "best": false
    },
    {
      "k": "Library",
      "t": "One type, every team",
      "d": "All the workflows, all the agents or all the UI, across all five kits.",
      "p": [
        "$249",
        "$749"
      ],
      "s": [
        "per library · 1 seat",
        "per library · 5 seats"
      ],
      "f": [
        "60 workflows, 50 agents or 100 UI items",
        "Every new item in it for a year",
        "Commercial use in unlimited projects",
        "Fixtures, evals and setup guides",
        "12 months of updates"
      ],
      "cta": "Choose a library",
      "best": false
    },
    {
      "k": "All-Access",
      "t": "Everything we make",
      "d": "Every kit and every library, plus each weekly drop for a year.",
      "p": [
        "$499",
        "$1,499"
      ],
      "s": [
        "everything · 1 seat",
        "everything · 5 seats, add more any time"
      ],
      "f": [
        "All 5 kits and all 3 libraries",
        "Every weekly drop for 12 months",
        "Vote on what we build next",
        "Priority support from the builders",
        "Keep everything when it ends"
      ],
      "cta": "Get All-Access",
      "best": true
    }
  ],
  "faq": [
    [
      "What can I do with what I buy?",
      "Use it in as many projects as you like, for yourself or for clients. Change anything. The one thing you cannot do is resell the items themselves as a library or template pack."
    ],
    [
      "What happens after 12 months?",
      "You keep everything you installed and it keeps working. Renew only if you want the updates and new items that ship after that date."
    ],
    [
      "Can I get a refund?",
      "Yes. If an item does not do what its page says, we refund the order. A refund stops new installs and updates; files you already downloaded stay yours."
    ],
    [
      "Which platforms and versions are supported?",
      "Workflows run on n8n 2.30 and later, plus Make and Zapier where the item says so. UI targets React 19, Tailwind 4 and shadcn. Agents run as TypeScript, an MCP server, an Agent Skill or an n8n AI Agent. Every item page lists the exact versions it was tested on last night."
    ],
    [
      "What data do agents send to AI models?",
      "Only the fields each tool needs, sent straight to the model provider you configure, with your own key. Nothing passes through our servers, and every agent lists what it sends in its README."
    ],
    [
      "Do the workflows still work without AI?",
      "Yes. Every workflow has an AI-off path: switch it on in the config node and rules take over the steps that used a model."
    ],
    [
      "Do I need to write code?",
      "Not for workflows: they import into n8n, Make or Zapier. Agents and UI are code, but the CLI and MCP server install them, and your AI tool can do the wiring for you."
    ]
  ],
  "icons": {
    "arrow": "M5 12h14M13 6l6 6-6 6",
    "check": "M5 12.5l4.5 4.5L19 7.5",
    "x": "M6 6l12 12M18 6L6 18",
    "bolt": "M13 2L4 14h7l-1 8 9-12h-7z",
    "globe": "M12 3a9 9 0 1 1 0 18a9 9 0 1 1 0-18M3.5 9h17M3.5 15h17M12 3c2.8 3 2.8 15 0 18M12 3c-2.8 3-2.8 15 0 18",
    "spark": "M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5L18 18M6 18l2.5-2.5M15.5 8.5L18 6",
    "branch": "M3 12h6l4-6h8M9 12l4 6h8M18 3l3 3-3 3M18 15l3 3-3 3",
    "db": "M4 6c0-1.7 3.6-3 8-3s8 1.3 8 3-3.6 3-8 3-8-1.3-8-3zM4 6v12c0 1.7 3.6 3 8 3s8-1.3 8-3V6M4 12c0 1.7 3.6 3 8 3s8-1.3 8-3",
    "mail": "M3 6h18v12H3zM3 7l9 6 9-6",
    "alert": "M12 3l9.5 17h-19zM12 10v4.5M12 17.5v.01",
    "terminal": "M4 5h16v14H4zM8 10l3 2.5L8 15M13 15h4",
    "plug": "M9 3v5M15 3v5M6 8h12v3a6 6 0 0 1-12 0zM12 17v4",
    "layers": "M12 3l9 5-9 5-9-5zM3 13l9 5 9-5",
    "download": "M12 3v12M7 10l5 5 5-5M4 20h16",
    "copy": "M9 9h11v11H9zM5 15V4h11",
    "shield": "M12 3l8 3v6c0 4.5-3.4 8-8 9-4.6-1-8-4.5-8-9V6z",
    "search": "M11 4a7 7 0 1 1 0 14a7 7 0 1 1 0-14M20 20l-4-4",
    "up": "M12 19V5M6 11l6-6 6 6",
    "moon": "M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z",
    "sun": "M12 8a4 4 0 1 1 0 8a4 4 0 1 1 0-8M12 2v2M12 20v2M2 12h2M20 12h2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4",
    "user": "M12 4a4 4 0 1 1 0 8a4 4 0 1 1 0-8M4 21c0-4 3.6-6.5 8-6.5s8 2.5 8 6.5",
    "users": "M9 4a3.5 3.5 0 1 1 0 7a3.5 3.5 0 1 1 0-7M2.5 20c0-3.5 2.9-6 6.5-6s6.5 2.5 6.5 6M16 4.3a3.5 3.5 0 0 1 0 6.4M18 14.3c2.1.7 3.5 2.8 3.5 5.7",
    "refresh": "M20 11a8 8 0 0 0-14.5-4.5L4 8M4 4v4h4M4 13a8 8 0 0 0 14.5 4.5L20 16M20 20v-4h-4",
    "chevd": "M6 9l6 6 6-6",
    "chevu": "M6 15l6-6 6 6",
    "sort": "M8 9l4-4 4 4M8 15l4 4 4-4",
    "form": "M5 3h14v18H5zM8 8h8M8 12h8M8 16h5",
    "dollar": "M12 3v18M16.5 7.5c-.8-1.3-2.5-2-4.5-2-2.5 0-4.5 1.3-4.5 3.2 0 4.3 9 2.3 9 6.6 0 1.9-2 3.2-4.5 3.2-2.1 0-3.9-.8-4.7-2.2",
    "git": "M6 3v12M6 15a3 3 0 1 0 0 6a3 3 0 1 0 0-6M18 9a3 3 0 1 0 0-6a3 3 0 1 0 0 6M18 9a9 9 0 0 1-9 9",
    "chat": "M4 5h16v11H9l-5 4z",
    "clock": "M12 3a9 9 0 1 1 0 18a9 9 0 1 1 0-18M12 7v5l3 2",
    "file": "M6 3h8l4 4v14H6zM14 3v4h4",
    "rss": "M5 5a14 14 0 0 1 14 14M5 11a8 8 0 0 1 8 8M6 18h.01",
    "send": "M4 12l16-8-6 16-3-7z",
    "calendar": "M4 6h16v15H4zM4 10h16M8 3v4M16 3v4",
    "scan": "M4 8V4h4M16 4h4v4M20 16v4h-4M8 20H4v-4M8 12h8",
    "merge": "M7 4v5a5 5 0 0 0 5 5 5 5 0 0 1 5 5v1M17 4v5a5 5 0 0 1-5 5",
    "gauge": "M4 17a8 8 0 1 1 16 0M12 17l4-5",
    "route": "M5 18h8a3 3 0 0 0 0-6H11a3 3 0 0 1 0-6h8M17 3l3 3-3 3"
  }
} as const;

export const homeCopy = {
  "kits": {
    "title": "One kit. One job done,",
    "accent": "end to end.",
    "description": "A kit is the workflows, agents and screens one team needs, already wired together and running on the same data."
  },
  "workflows": {
    "title": "Workflows for the platform you",
    "accent": "already pay for.",
    "description": "n8n, Make and Zapier versions built from one spec, with the error handling most templates skip."
  },
  "agents": {
    "title": "Agents that finish the job,",
    "accent": "with the numbers to prove it.",
    "description": "Each agent ships with its tools, an eval suite and approvals built in. You see its pass rate and cost per run before you buy."
  },
  "ui": {
    "title": "The screens agent products need,",
    "accent": "ready to install.",
    "description": "50 components and 50 blocks on shadcn and Tailwind. Everything below is the real thing: click it."
  },
  "install": {
    "title": "Install it yourself, or",
    "accent": "ask your AI tool to.",
    "description": "One CLI, an MCP server and a shadcn registry. Every page also exists as Markdown for agents, listed in llms.txt.",
    "tools": [
      "Claude Code",
      "Cursor",
      "Codex",
      "Windsurf",
      "VS Code",
      "Zed",
      "Gemini CLI"
    ]
  },
  "tested": {
    "title": "Every item runs every night.",
    "accent": "Here are the results.",
    "description": "No testimonials yet, so here is something better: the same test runs we use to decide what ships."
  },
  "free": {
    "title": "Start free.",
    "accent": "Keep it forever.",
    "description": "Real workflows, agents and components from every kit, built and tested exactly like the paid ones."
  },
  "pricing": {
    "title": "Buy the kit you need,",
    "accent": "or all of it.",
    "description": "Pay once. Use it in every project. Twelve months of updates included.",
    "notes": [
      {
        "icon": "refresh",
        "text": "Upgrade any time: what you paid in the last 12 months counts toward it"
      },
      {
        "icon": "shield",
        "text": "Taxes handled at checkout"
      },
      {
        "icon": "check",
        "text": "Free items need no card"
      }
    ]
  },
  "studio": {
    "title": "Want it fitted to your stack?",
    "accent": "We'll build it.",
    "description": "The team that builds the library sets it up for you, or builds what is missing. Fixed scope, fixed price, same tests as the catalog."
  },
  "faq": {
    "title": "Questions,",
    "accent": "answered.",
    "description": "",
    "contactText": {
      "before": "Something not covered?",
      "label": "Ask us directly",
      "after": "A person replies, usually the same day."
    }
  },
  "closing": {
    "title": "Your first kit can",
    "accent": "run today.",
    "description": "Install a free item in a minute, or browse the kits and see what your team gets.",
    "command": "npx ailibrary add sales/reply-classifier"
  },
  "workflowFeatures": [
    {
      "title": "One config node",
      "description": "Keys, IDs and thresholds in one place. Nothing hard-coded."
    },
    {
      "title": "Retries and a dead-letter log",
      "description": "Rate limits retry with backoff; anything that still fails is kept, never lost."
    },
    {
      "title": "An AI-off path",
      "description": "Switch the model off and rules take over, so the workflow still runs."
    },
    {
      "title": "Test data with expected results",
      "description": "Run it on fixtures before it touches a real account."
    },
    {
      "title": "A 15-minute setup guide",
      "description": "Every credential and scope listed, in order."
    },
    {
      "title": "A last-passed date",
      "description": "It runs every night. You see when it last went green."
    }
  ],
  "installCards": [
    {
      "icon": "terminal",
      "title": "CLI",
      "description": "Add one item or a whole kit. Signs in once, remembers your licence.",
      "command": "npx ailibrary kit add sales"
    },
    {
      "icon": "plug",
      "title": "MCP server",
      "description": "Claude, Cursor and Codex search the catalog, read docs and install for you.",
      "command": "npx ailibrary mcp"
    },
    {
      "icon": "layers",
      "title": "shadcn registry",
      "description": "UI items install like any shadcn component, into code you own.",
      "command": "npx shadcn add @ailibrary/data-grid"
    },
    {
      "icon": "download",
      "title": "Download",
      "description": "Every item as a zip with its README, fixtures and import files.",
      "command": "sales-kit-v1.4.zip · 2.1 MB"
    }
  ],
  "qualityGate": [
    {
      "title": "Spec",
      "description": "Inputs, outputs and failure cases written before any code."
    },
    {
      "title": "Fixtures",
      "description": "Green on seed data with no real accounts."
    },
    {
      "title": "QA run",
      "description": "Live sandbox accounts, every platform version we support."
    },
    {
      "title": "Stranger test",
      "description": "Someone new sets it up from the README in 15 minutes."
    },
    {
      "title": "Nightly",
      "description": "Runs again every night. A red run pulls it from sale."
    }
  ],
  "studioOffers": [
    {
      "title": "Kit setup",
      "description": "We install a kit, connect your accounts and hand over a working system."
    },
    {
      "title": "Custom workflow",
      "description": "One workflow for your process, built to our spec and tested nightly."
    },
    {
      "title": "Custom agent",
      "description": "An agent with its own tools, approvals and eval suite, in all four forms."
    },
    {
      "title": "Product UI sprint",
      "description": "Screens for your AI product, from our components, in your design system."
    }
  ],
  "footerColumns": [
    {
      "title": "Product",
      "links": [
        {
          "label": "Kits",
          "href": "/kits"
        },
        {
          "label": "Workflows",
          "href": "/workflows"
        },
        {
          "label": "Agents",
          "href": "/agents"
        },
        {
          "label": "UI",
          "href": "/ui"
        },
        {
          "label": "Pricing",
          "href": "/pricing"
        }
      ]
    },
    {
      "title": "Resources",
      "links": [
        {
          "label": "Docs",
          "href": "/docs"
        },
        {
          "label": "Drops",
          "href": "/drops",
          "badge": "weekly"
        },
        {
          "label": "Changelog",
          "href": "/docs/reference/changelog"
        },
        {
          "label": "llms.txt",
          "href": "/llms.txt"
        },
        {
          "label": "Test results",
          "href": "#tested"
        }
      ]
    },
    {
      "title": "Company",
      "links": [
        {
          "label": "Studio",
          "href": "https://www.thedoomstudio.com/"
        },
        {
          "label": "About",
          "href": "/about"
        },
        {
          "label": "Contact",
          "href": "/contact"
        },
        {
          "label": "X",
          "href": "/contact"
        }
      ]
    },
    {
      "title": "Legal",
      "links": [
        {
          "label": "Terms",
          "href": "/terms"
        },
        {
          "label": "Licence",
          "href": "/docs/reference/licence"
        },
        {
          "label": "Refunds",
          "href": "/docs/reference/refunds"
        },
        {
          "label": "Privacy",
          "href": "/privacy"
        }
      ]
    }
  ],
  "footer": {
    "copyrightOwner": "Doom Studio",
    "description": "Production-ready workflows, agents and UI components, packaged as kits for every team.",
    "status": "Sample nightly results",
    "builtWith": "Built with our own components"
  }
} as const;

export const demoCopy = {
  workflowCards: [
    { kit: "sales", name: "Sales", platforms: "n8n · Make", title: "Inbound lead qualifier", description: "Enrich, score and route every demo request to the right rep in seconds.", apps: "HubSpot · Slack", cost: "$0.004 / run", setup: "15 min setup" },
    { kit: "support", name: "Support", platforms: "n8n · Make", title: "Ticket triage", description: "Classify intent and urgency, merge duplicates and route to the right queue.", apps: "Zendesk · Slack", cost: "$0.003 / run", setup: "12 min setup" },
    { kit: "operations", name: "Operations", platforms: "n8n · Make", title: "Invoice and receipt capture", description: "Pull the fields from every PDF, match the PO and queue it for your ledger.", apps: "Gmail · Xero", cost: "$0.002 / run", setup: "15 min setup" },
  ],
  workflowCatalogDescription: "Filter by kit, platform or the apps you already use.",
  agent: {
    toolCalls: [
      ["zendesk.get_ticket", "#9921 · Team plan since 2024", "120ms"],
      ["stripe.list_charges", "2 charges of $49.00 on Oct 3", "340ms"],
      ["policy.check", "duplicate charge · refundable", "90ms"],
      ["refund.calculate", "$49.00 to card ending 4242", "12ms"],
    ],
    ticket: {
      subject: "Charged twice for October",
      message: "Hi, we were billed twice on Oct 3 for our Team plan. Can you refund one of the charges?",
    },
    policies: [
      "Policy: every refund waits for a person. Approve to refund and send the reply.",
      "Policy: refunds over $100 wait for a person. This one is $49.00.",
      "Policy: this agent runs alone. Every action is logged for review.",
    ],
    catalogDescription: "Filter by kit, by form or by eval score. Every agent page shows its pass rate, cost per run and last nightly result.",
  },
  ui: {
    defaultQuestion: "Why do Okta logins fail for Harborline since this morning?",
    defaultResponse: {
      answer: "Harborline moved its SSO domain at 08:10, so Okta now sends an Audience URI that no longer matches. Set it to app.fieldline.example/sso and ask users to sign in again.",
      query: "okta audience uri",
      citations: ["SSO setup guide", "Okta error codes"],
    },
    responses: [
      {
        keywords: ["refund", "charg", "bill", "daniel"],
        answer: "Daniel Reyes was charged $49.00 twice for October. The refund-decision agent has prepared a $49.00 refund and is waiting for a person to approve it. Review the request in the approval inbox before it runs.",
        query: "Daniel Reyes duplicate charge",
        citations: ["Refund policy", "October payments"],
      },
      {
        keywords: ["deploy", "release", "incident", "rollback", "roll back"],
        answer: "Deploy #1187 has a rollback waiting in the approval inbox. The incident-triage agent has gathered the context and prepared the action. A person must review and approve the rollback before the agent makes any change.",
        query: "deploy 1187 rollback policy",
        citations: ["Incident runbook", "Deploy #1187"],
      },
    ],
    runSteps: [["Read ticket", "8ms"], ["Search knowledge base", "380ms"], ["Draft answer", "1.7s"], ["Policy check", "210ms"], ["Request approval", "waiting"]],
    metrics: {
      7: { value: "63%", delta: "+8.2 pts", points: [22, 26, 24, 31, 29, 37, 35, 42, 40, 47, 51, 49, 55, 63] },
      30: { value: "58%", delta: "+3.1 pts", points: [41, 44, 43, 47, 46, 45, 49, 48, 52, 51, 54, 53, 56, 58] },
    },
    boardAccounts: {
      northwind: { name: "Northwind Logistics", value: "$84k", owner: "Priya" },
      copperleaf: { name: "Copperleaf", value: "$18k", owner: "Arjun" },
      lumen: { name: "Lumen Health", value: "$52k", owner: "Arjun" },
      harborline: { name: "Harborline", value: "$120k", owner: "Priya" },
    },
    categories: [
      [10, "AI interaction", "ai-interaction"],
      [8, "Agent control", "agent-control"],
      [10, "Data display", "data-display"],
      [8, "Inputs", "inputs"],
      [6, "Workflow", "workflow"],
      [8, "App shell", "app-shell"],
      [50, "Blocks in 6 groups", "blocks"],
    ],
  },
} as const;

