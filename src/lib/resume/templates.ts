import type { ResumeData } from './types'
import { emptyResumeData } from './types'

export type ResumeTemplate = {
  id: string
  title: string
  description: string
  data: ResumeData
}

const analyticsTemplate: ResumeTemplate = {
  id: 'template-analytics',
  title: 'Analytics / Data Science',
  description: 'Great for data science, analytics, and ML roles with project bullets and skills categories.',
  data: {
    ...emptyResumeData(),
    header: {
      fullName: 'Alex Morgan',
      links: [
        { id: 'a-link-1', label: 'alex.morgan@example.com', url: 'mailto:alex.morgan@example.com' },
        { id: 'a-link-2', label: '(555) 555-0123', url: 'tel:+15555550123' },
        { id: 'a-link-3', label: 'New York, NY', url: 'New York, NY' },
        { id: 'a-link-4', label: 'linkedin.com/in/alexmorgan', url: 'linkedin.com/in/alexmorgan' },
        { id: 'a-link-5', label: 'github.com/alexmorgan', url: 'github.com/alexmorgan' },
      ],
    },
    summary: {
      type: 'doc',
      content: [
        {
          type: 'paragraph',
          content: [
            {
              type: 'text',
              text: 'Data scientist / analyst with 4+ years of experience turning messy data into clear, measurable decisions. Skilled in SQL + Python, experiment design, and stakeholder-ready dashboards that improve retention and revenue.',
            },
          ],
        },
        {
          type: 'paragraph',
          content: [
            {
              type: 'text',
              text: 'Known for shipping end-to-end work: define metrics, build reliable pipelines, validate models, and communicate results with concise narratives and visuals.',
            },
          ],
        },
      ],
    },
    skills: [
      {
        id: 'skills-1',
        category: 'Programming Languages',
        level: 'advanced',
        details: {
          type: 'doc',
          content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Python, SQL, TypeScript' }] }],
        },
      },
      {
        id: 'skills-2',
        category: 'Data / ML',
        level: 'advanced',
        details: {
          type: 'doc',
          content: [{ type: 'paragraph', content: [{ type: 'text', text: 'pandas, scikit-learn, dbt, Airflow' }] }],
        },
      },
      {
        id: 'skills-3',
        category: 'Visualization',
        details: {
          type: 'doc',
          content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Tableau, Power BI, Looker' }] }],
        },
      },
      {
        id: 'skills-4',
        category: 'Data Warehousing',
        details: {
          type: 'doc',
          content: [{ type: 'paragraph', content: [{ type: 'text', text: 'BigQuery, Snowflake, Postgres, dimensional modeling' }] }],
        },
      },
      {
        id: 'skills-5',
        category: 'Product Analytics',
        details: {
          type: 'doc',
          content: [{ type: 'paragraph', content: [{ type: 'text', text: 'A/B testing, cohort analysis, KPI design, funnel + retention analysis' }] }],
        },
      },
    ],
    projects: [
      {
        id: 'proj-1',
        title: 'Customer Churn Modeling',
        subtitle: 'Python • scikit-learn • Feature engineering',
        dates: { start: '2025', end: '2025' },
        description: {
          type: 'doc',
          content: [
            {
              type: 'bulletList',
              content: [
                {
                  type: 'listItem',
                  content: [
                    {
                      type: 'paragraph',
                      content: [
                        {
                          type: 'text',
                          text: 'Built a churn model (logistic regression → gradient boosting) and improved AUC from 0.71 to 0.82 via feature engineering, leakage checks, and calibration.',
                        },
                      ],
                    },
                  ],
                },
                {
                  type: 'listItem',
                  content: [
                    {
                      type: 'paragraph',
                      content: [
                        {
                          type: 'text',
                          text: 'Created an explainability report (SHAP + partial dependence) to translate model drivers into product actions; reduced false-positive outreach by 18%.',
                        },
                      ],
                    },
                  ],
                },
                {
                  type: 'listItem',
                  content: [
                    {
                      type: 'paragraph',
                      content: [
                        {
                          type: 'text',
                          text: 'Productionized scoring with a scheduled pipeline and monitoring (drift + data quality checks) to keep weekly scores stable and auditable.',
                        },
                      ],
                    },
                  ],
                },
              ],
            },
          ],
        },
      },
      {
        id: 'proj-2',
        title: 'Marketing Attribution & Incrementality',
        subtitle: 'SQL • Experiment design • Causal inference',
        dates: { start: '2024', end: '2025' },
        description: {
          type: 'doc',
          content: [
            {
              type: 'bulletList',
              content: [
                {
                  type: 'listItem',
                  content: [
                    {
                      type: 'paragraph',
                      content: [
                        {
                          type: 'text',
                          text: 'Designed holdout tests for paid channels and built a repeatable SQL framework for lift measurement (pre/post, geo splits, and variance-aware reporting).',
                        },
                      ],
                    },
                  ],
                },
                {
                  type: 'listItem',
                  content: [
                    {
                      type: 'paragraph',
                      content: [
                        {
                          type: 'text',
                          text: 'Partnered with growth to rebalance budget toward high-incrementality campaigns; improved CAC by 9% while keeping signups flat-to-up.',
                        },
                      ],
                    },
                  ],
                },
                {
                  type: 'listItem',
                  content: [
                    {
                      type: 'paragraph',
                      content: [
                        {
                          type: 'text',
                          text: 'Built a Looker dashboard that ties spend → funnel → retention; reduced recurring ad-hoc analysis requests by ~40%.',
                        },
                      ],
                    },
                  ],
                },
              ],
            },
          ],
        },
      },
      {
        id: 'proj-3',
        title: 'Analytics Engineering: Metrics Layer',
        subtitle: 'dbt • BigQuery • Data quality',
        dates: { start: '2024', end: '2024' },
        description: {
          type: 'doc',
          content: [
            {
              type: 'bulletList',
              content: [
                {
                  type: 'listItem',
                  content: [
                    {
                      type: 'paragraph',
                      content: [
                        {
                          type: 'text',
                          text: 'Migrated key tables to a dimensional model (facts + dims) and implemented a documented metrics layer used by product, finance, and ops.',
                        },
                      ],
                    },
                  ],
                },
                {
                  type: 'listItem',
                  content: [
                    {
                      type: 'paragraph',
                      content: [
                        {
                          type: 'text',
                          text: 'Added freshness and anomaly tests; caught a critical tracking regression within 30 minutes instead of after weekly reporting.',
                        },
                      ],
                    },
                  ],
                },
              ],
            },
          ],
        },
      },
    ],
    workExperience: [
      {
        id: 'work-1',
        jobTitle: 'Data Analyst',
        employer: 'Northwind Commerce',
        dates: { start: '2024', end: 'Present' },
        location: 'City, ST',
        description: {
          type: 'doc',
          content: [
            {
              type: 'bulletList',
              content: [
                {
                  type: 'listItem',
                  content: [
                    {
                      type: 'paragraph',
                      content: [
                        {
                          type: 'text',
                          text: 'Improved executive KPI reporting accuracy by standardizing metric definitions and adding automated reconciliation checks across 5 source systems.',
                        },
                      ],
                    },
                  ],
                },
                {
                  type: 'listItem',
                  content: [
                    {
                      type: 'paragraph',
                      content: [
                        {
                          type: 'text',
                          text: 'Built a self-serve dashboard for retention cohorts and funnel conversion; reduced time-to-answer for PMs from days to minutes.',
                        },
                      ],
                    },
                  ],
                },
                {
                  type: 'listItem',
                  content: [
                    {
                      type: 'paragraph',
                      content: [
                        {
                          type: 'text',
                          text: 'Led analysis for pricing tests (power, guardrails, segmentation) and shipped a rollout recommendation that increased ARPU by 4%.',
                        },
                      ],
                    },
                  ],
                },
                {
                  type: 'listItem',
                  content: [
                    {
                      type: 'paragraph',
                      content: [
                        {
                          type: 'text',
                          text: 'Maintained dbt models and alerting for data freshness; decreased broken-dashboard incidents by 35% over two quarters.',
                        },
                      ],
                    },
                  ],
                },
              ],
            },
          ],
        },
      },
      {
        id: 'work-2',
        jobTitle: 'Business Intelligence Analyst',
        employer: 'Contoso Media',
        dates: { start: '2022', end: '2024' },
        location: 'Remote',
        description: {
          type: 'doc',
          content: [
            {
              type: 'bulletList',
              content: [
                {
                  type: 'listItem',
                  content: [
                    {
                      type: 'paragraph',
                      content: [
                        {
                          type: 'text',
                          text: 'Created a unified content performance scorecard (engagement, conversion, retention) used by editorial + growth to prioritize releases.',
                        },
                      ],
                    },
                  ],
                },
                {
                  type: 'listItem',
                  content: [
                    {
                      type: 'paragraph',
                      content: [
                        {
                          type: 'text',
                          text: 'Built SQL pipelines to backfill event data and validated tracking plans; improved completeness of attribution fields from ~80% to 97%.',
                        },
                      ],
                    },
                  ],
                },
                {
                  type: 'listItem',
                  content: [
                    {
                      type: 'paragraph',
                      content: [
                        {
                          type: 'text',
                          text: 'Presented weekly insights to non-technical stakeholders, combining narrative + charts to drive decisions without drowning teams in raw metrics.',
                        },
                      ],
                    },
                  ],
                },
              ],
            },
          ],
        },
      },
    ],
    education: [
      {
        id: 'edu-1',
        degree: 'M.S. in Data Science',
        school: 'State University',
        dates: { start: '2023', end: '2025' },
        location: 'City, ST',
        description: {
          type: 'doc',
          content: [
            {
              type: 'paragraph',
              content: [
                {
                  type: 'text',
                  text: 'Relevant coursework: Machine Learning, Statistical Inference, Experiment Design, Distributed Systems, Data Engineering.',
                },
              ],
            },
            {
              type: 'paragraph',
              content: [{ type: 'text', text: 'Capstone: churn prediction + intervention strategy; delivered model + dashboard + rollout playbook.' }],
            },
          ],
        },
      },
    ],
    certificates: [
      {
        id: 'cert-a-1',
        title: 'Google Data Analytics Certificate',
        details: {
          type: 'doc',
          content: [{ type: 'paragraph', content: [{ type: 'text', text: 'SQL, data cleaning, dashboarding, and stakeholder communication.' }] }],
        },
        link: 'https://www.coursera.org',
      },
      {
        id: 'cert-a-2',
        title: 'AWS Certified Cloud Practitioner',
        details: {
          type: 'doc',
          content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Foundational cloud concepts; IAM, storage, compute, and cost basics.' }] }],
        },
        link: 'https://aws.amazon.com/certification/',
      },
    ],
  },
}

const softwareTemplate: ResumeTemplate = {
  id: 'template-software',
  title: 'Software Engineer',
  description: 'Classic engineering resume with experience-first sections and impact-focused bullets.',
  data: {
    ...emptyResumeData(),
    header: {
      fullName: 'Jordan Lee',
      links: [
        { id: 'se-link-1', label: 'jordan.lee@example.com', url: 'mailto:jordan.lee@example.com' },
        { id: 'se-link-2', label: '(555) 555-0147', url: 'tel:+15555550147' },
        { id: 'se-link-3', label: 'San Francisco, CA', url: 'San Francisco, CA' },
        { id: 'se-link-4', label: 'github.com/jordanlee', url: 'github.com/jordanlee' },
        { id: 'se-link-5', label: 'jordanlee.dev', url: 'jordanlee.dev' },
      ],
    },
    summary: {
      type: 'doc',
      content: [
        {
          type: 'paragraph',
          content: [
            {
              type: 'text',
              text: 'Software engineer with 5+ years of experience building and operating customer-facing web apps. Strong in TypeScript/React/Next.js, API design, and pragmatic system design with an emphasis on reliability and performance.',
            },
          ],
        },
        {
          type: 'paragraph',
          content: [
            {
              type: 'text',
              text: 'Comfortable owning features end-to-end: product requirements → implementation → instrumentation → on-call + postmortems. Prefer simple, well-tested abstractions over cleverness.',
            },
          ],
        },
      ],
    },
    skills: [
      {
        id: 'skills-se-1',
        category: 'Languages',
        details: { type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'TypeScript, JavaScript, Go, Python' }] }] },
      },
      {
        id: 'skills-se-2',
        category: 'Frameworks',
        details: { type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'React, Next.js, Node.js' }] }] },
      },
      {
        id: 'skills-se-3',
        category: 'Backend / Data',
        details: { type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Postgres, Redis, REST, OpenAPI, background jobs' }] }] },
      },
      {
        id: 'skills-se-4',
        category: 'Infra / Tooling',
        details: { type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Docker, CI/CD, Vercel, AWS, observability (logs/metrics/traces)' }] }] },
      },
    ],
    workExperience: [
      {
        id: 'work-se-1',
        jobTitle: 'Software Engineer',
        employer: 'Acme FinTech',
        dates: { start: '2023', end: 'Present' },
        location: 'City, ST',
        description: {
          type: 'doc',
          content: [
            {
              type: 'bulletList',
              content: [
                {
                  type: 'listItem',
                  content: [
                    {
                      type: 'paragraph',
                      content: [
                        {
                          type: 'text',
                          text: 'Shipped a new onboarding flow (Next.js + API changes) that reduced time-to-first-success by 22% and increased activation by 8%.',
                        },
                      ],
                    },
                  ],
                },
                {
                  type: 'listItem',
                  content: [
                    {
                      type: 'paragraph',
                      content: [
                        {
                          type: 'text',
                          text: 'Improved API reliability by adding idempotency keys, retries, and better error taxonomy; cut support tickets for payment failures by 30%.',
                        },
                      ],
                    },
                  ],
                },
                {
                  type: 'listItem',
                  content: [
                    {
                      type: 'paragraph',
                      content: [
                        {
                          type: 'text',
                          text: 'Added performance budgets and instrumentation (web vitals + traces) to prevent regressions; improved LCP by 400ms on key routes.',
                        },
                      ],
                    },
                  ],
                },
                {
                  type: 'listItem',
                  content: [
                    {
                      type: 'paragraph',
                      content: [
                        {
                          type: 'text',
                          text: 'Mentored 2 new hires and led code reviews focused on readability, tests, and incremental rollouts (feature flags + staged deploys).',
                        },
                      ],
                    },
                  ],
                },
              ],
            },
          ],
        },
      },
      {
        id: 'work-se-2',
        jobTitle: 'Full-Stack Engineer',
        employer: 'Orbit SaaS',
        dates: { start: '2021', end: '2023' },
        location: 'Remote',
        description: {
          type: 'doc',
          content: [
            {
              type: 'bulletList',
              content: [
                {
                  type: 'listItem',
                  content: [
                    {
                      type: 'paragraph',
                      content: [
                        {
                          type: 'text',
                          text: 'Built a role-based access control system and audit logs for enterprise customers; unblocked 6-figure deals and reduced manual approvals.',
                        },
                      ],
                    },
                  ],
                },
                {
                  type: 'listItem',
                  content: [
                    {
                      type: 'paragraph',
                      content: [
                        {
                          type: 'text',
                          text: 'Refactored a legacy reporting pipeline into background jobs with retries; improved job success rate from 93% to 99.7%.',
                        },
                      ],
                    },
                  ],
                },
                {
                  type: 'listItem',
                  content: [
                    {
                      type: 'paragraph',
                      content: [
                        {
                          type: 'text',
                          text: 'Owned incident response rotation and postmortems; introduced runbooks and dashboards that reduced MTTR by 25%.',
                        },
                      ],
                    },
                  ],
                },
              ],
            },
          ],
        },
      },
    ],
    projects: [
      {
        id: 'proj-se-1',
        title: 'Full-stack App',
        subtitle: 'Next.js • Postgres • Auth',
        dates: { start: '2024', end: '2024' },
        description: {
          type: 'doc',
          content: [
            {
              type: 'bulletList',
              content: [
                {
                  type: 'listItem',
                  content: [
                    {
                      type: 'paragraph',
                      content: [
                        {
                          type: 'text',
                          text: 'Implemented auth, CRUD, and a responsive UI with reusable components; added optimistic updates and offline-friendly caching.',
                        },
                      ],
                    },
                  ],
                },
                {
                  type: 'listItem',
                  content: [
                    {
                      type: 'paragraph',
                      content: [
                        {
                          type: 'text',
                          text: 'Designed a Postgres schema with indexes and migrations; improved slow endpoints by 10–30× with query tuning and pagination.',
                        },
                      ],
                    },
                  ],
                },
                {
                  type: 'listItem',
                  content: [
                    {
                      type: 'paragraph',
                      content: [
                        {
                          type: 'text',
                          text: 'Added CI (lint/test/typecheck) and automated deploy previews; reduced regression rate and made reviews faster.',
                        },
                      ],
                    },
                  ],
                },
              ],
            },
          ],
        },
      },
      {
        id: 'proj-se-2',
        title: 'Design System Starter',
        subtitle: 'React • Component library • Accessibility',
        dates: { start: '2023', end: '2023' },
        description: {
          type: 'doc',
          content: [
            {
              type: 'bulletList',
              content: [
                {
                  type: 'listItem',
                  content: [
                    {
                      type: 'paragraph',
                      content: [
                        {
                          type: 'text',
                          text: 'Built a small component library (buttons, inputs, dialogs) with consistent states, keyboard navigation, and a11y-friendly defaults.',
                        },
                      ],
                    },
                  ],
                },
                {
                  type: 'listItem',
                  content: [
                    {
                      type: 'paragraph',
                      content: [
                        {
                          type: 'text',
                          text: 'Documented usage patterns and guardrails; enabled faster feature delivery by reducing repeated UI work across pages.',
                        },
                      ],
                    },
                  ],
                },
              ],
            },
          ],
        },
      },
    ],
    education: [
      {
        id: 'edu-se-1',
        degree: 'B.S. in Computer Science',
        school: 'State University',
        dates: { start: '2019', end: '2023' },
        location: 'City, ST',
        description: {
          type: 'doc',
          content: [
            {
              type: 'paragraph',
              content: [{ type: 'text', text: 'Focus: distributed systems, databases, and human-centered product development.' }],
            },
          ],
        },
      },
    ],
    certificates: [
      {
        id: 'cert-se-1',
        title: 'AWS Certified Developer – Associate',
        details: { type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Serverless patterns, IAM, observability, and cost-aware deployments.' }] }] },
        link: 'https://aws.amazon.com/certification/',
      },
    ],
  },
}

const generalTemplate: ResumeTemplate = {
  id: 'template-general',
  title: 'General Professional',
  description: 'Clean, flexible template you can adapt to most roles quickly.',
  data: {
    ...emptyResumeData(),
    header: {
      fullName: 'Taylor Rivera',
      links: [
        { id: 'g-link-1', label: 'taylor.rivera@example.com', url: 'mailto:taylor.rivera@example.com' },
        { id: 'g-link-2', label: '(555) 555-0188', url: 'tel:+15555550188' },
        { id: 'g-link-3', label: 'Chicago, IL', url: 'Chicago, IL' },
        { id: 'g-link-4', label: 'linkedin.com/in/taylor-rivera', url: 'linkedin.com/in/taylor-rivera' },
      ],
    },
    summary: {
      type: 'doc',
      content: [
        {
          type: 'paragraph',
          content: [
            {
              type: 'text',
              text: 'Operations-focused professional with experience improving workflows, customer outcomes, and cross-team execution. Strong communicator who brings structure to ambiguous problems and delivers measurable improvements.',
            },
          ],
        },
        {
          type: 'paragraph',
          content: [
            {
              type: 'text',
              text: 'Comfortable collaborating with product, engineering, and leadership to translate goals into repeatable processes, dashboards, and documentation.',
            },
          ],
        },
      ],
    },
    workExperience: [
      {
        id: 'work-g-1',
        jobTitle: 'Operations Specialist',
        employer: 'Brightside Services',
        dates: { start: '2022', end: 'Present' },
        location: 'City, ST',
        description: {
          type: 'doc',
          content: [
            {
              type: 'bulletList',
              content: [
                {
                  type: 'listItem',
                  content: [
                    {
                      type: 'paragraph',
                      content: [
                        {
                          type: 'text',
                          text: 'Improved SLA compliance from 88% to 96% by redesigning intake workflows, clarifying handoffs, and adding lightweight QA checks.',
                        },
                      ],
                    },
                  ],
                },
                {
                  type: 'listItem',
                  content: [
                    {
                      type: 'paragraph',
                      content: [
                        {
                          type: 'text',
                          text: 'Built weekly reporting (KPIs, backlog health, root-cause categories) that helped leadership prioritize fixes and staffing plans.',
                        },
                      ],
                    },
                  ],
                },
                {
                  type: 'listItem',
                  content: [
                    {
                      type: 'paragraph',
                      content: [
                        {
                          type: 'text',
                          text: 'Created onboarding docs and checklists for new team members; reduced ramp time by ~30% and improved consistency across shifts.',
                        },
                      ],
                    },
                  ],
                },
                {
                  type: 'listItem',
                  content: [
                    {
                      type: 'paragraph',
                      content: [
                        {
                          type: 'text',
                          text: 'Partnered with engineering to scope small automation wins (templates, validation, alerts) that saved ~6 hours/week of manual work.',
                        },
                      ],
                    },
                  ],
                },
              ],
            },
          ],
        },
      },
      {
        id: 'work-g-2',
        jobTitle: 'Customer Success Associate',
        employer: 'Lakeside Software',
        dates: { start: '2020', end: '2022' },
        location: 'Remote',
        description: {
          type: 'doc',
          content: [
            {
              type: 'bulletList',
              content: [
                {
                  type: 'listItem',
                  content: [
                    {
                      type: 'paragraph',
                      content: [{ type: 'text', text: 'Managed a portfolio of accounts, running quarterly business reviews and driving adoption through training and playbooks.' }],
                    },
                  ],
                },
                {
                  type: 'listItem',
                  content: [
                    {
                      type: 'paragraph',
                      content: [{ type: 'text', text: 'Identified top churn reasons using ticket tags + cohort analysis; partnered with product to reduce repeat issues and improve retention.' }],
                    },
                  ],
                },
              ],
            },
          ],
        },
      },
    ],
    education: [
      {
        id: 'edu-g-1',
        degree: 'B.A. in Business Administration',
        school: 'City University',
        dates: { start: '2018', end: '2022' },
        location: 'City, ST',
        description: {
          type: 'doc',
          content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Coursework: operations management, analytics, project management, and organizational behavior.' }] }],
        },
      },
    ],
    projects: [
      {
        id: 'proj-g-1',
        title: 'Process Improvement Playbook',
        subtitle: 'Documentation • Metrics • Change management',
        dates: { start: '2023', end: '2023' },
        description: {
          type: 'doc',
          content: [
            {
              type: 'bulletList',
              content: [
                {
                  type: 'listItem',
                  content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Created a repeatable template for problem statements, KPIs, and rollouts; improved cross-team alignment and reduced rework.' }] }],
                },
                {
                  type: 'listItem',
                  content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Defined leading indicators and weekly check-ins to keep initiatives on track and visible to stakeholders.' }] }],
                },
              ],
            },
          ],
        },
      },
    ],
    skills: [
      {
        id: 'skills-g-1',
        category: 'Skills',
        details: {
          type: 'doc',
          content: [
            {
              type: 'paragraph',
              content: [
                {
                  type: 'text',
                  text: 'Process design, stakeholder management, KPI reporting, documentation, project coordination, customer communications, SQL basics, Excel/Sheets, dashboards.',
                },
              ],
            },
          ],
        },
      },
    ],
    certificates: [
      {
        id: 'cert-g-1',
        title: 'Project Management Fundamentals',
        details: { type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Planning, risk management, and clear status reporting for cross-functional projects.' }] }] },
        link: 'https://www.pmi.org',
      },
    ],
  },
}

export const RESUME_TEMPLATES: ResumeTemplate[] = [analyticsTemplate, softwareTemplate, generalTemplate]

export function getResumeTemplateById(id: string): ResumeTemplate | undefined {
  return RESUME_TEMPLATES.find((t) => t.id === id)
}
