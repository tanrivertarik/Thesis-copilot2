# Risks & Mitigation Strategies

| Risk | Category | Description | Mitigation | Owner | Status |
| --- | --- | --- | --- | --- | --- |
| LLM hallucinations introduce unsupported claims. | Technical | AI may invent facts not present in user sources, undermining trust. | Use retrieval-augmented prompts restricted to uploaded text; add citation validation checks; include disclaimer in UI encouraging review. | AI Lead | Open |
| Source ingestion fails on large or scanned PDFs. | Technical | Poor extraction reduces usable corpus and user confidence. | Implement chunking with OCR fallback; flag failures with actionable messaging; allow manual text upload. | Backend Lead | Open |
| Users perceive product as cheating or risky academically. | User Trust | Misunderstanding of "copilot" positioning leads to low adoption. | Clear onboarding messaging; in-app prompts reminding users to edit; partner with writing centers to endorse responsible use. | Product Marketing | Open |
| Export formatting errors delay submission. | Technical | Incorrect margins/citations could cause rejection by advisors. | Build automated formatting tests; manual QA with sample templates; allow quick re-export after fixes. | QA Lead | Open |
| LLM/hosting costs exceed pricing assumptions. | Business | High usage may make Pro tier unprofitable. | Monitor token spend per feature; optimize prompts; consider usage caps or tiered pricing adjustments. | Finance Ops | Open |
| Regulatory or institutional pushback. | Compliance | Universities may restrict AI tools without clear privacy assurances. | Publish privacy policy; allow data deletion requests; ensure FERPA/GDPR alignment; secure legal review before GA. | Legal Advisor | Planned |

## Contingency Plans
- Maintain manual override to disable generation features if accuracy drifts.
- Prepare rollout checklist including security review, legal approval, and disaster recovery rehearsal before public beta.
