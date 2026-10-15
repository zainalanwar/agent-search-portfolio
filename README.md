# Zainal Agent Search Portfolio

Evidence-first portfolio search powered by Google Cloud Agent Search. The app
turns curated project documentation into semantic search results and grounded
answers with citations.

## Architecture

```text
curated public JSON
        |
        v
Discovery Engine data store -> Agent Search Enterprise app
                                      |
                                      v
React UI <- Netlify Function <- OAuth service account
```

The ingestion path uses inline documents, so the GCP project does not require a
Cloud Storage bucket or BigQuery dataset.

## Cloud resources

- Project: `zainal-agent-search-2026`
- Data store: `zainal-portfolio-kb`
- Search app/engine: `zainal-portfolio-search`
- Location: `global`
- Budget: Rp250,000/month gross spend, alerts at 25/50/90/100%

Only the Agent Search and Cloud Billing Budgets APIs are enabled intentionally.

## Local setup

```bash
npm install
npm run import:documents
npm run dev
```

For the serverless search endpoint, set the values in `.env.example`. Never
commit the service account JSON.

## Cost safety

- The app limits each request to eight results.
- Search summaries use five retrieved sources.
- User queries are capped at 300 characters.
- The backend does not expose Google credentials to the browser.
- The project has no VM, persistent disk, static IP, bucket, or BigQuery data.

Google Cloud budgets alert but do not automatically stop usage. Disable billing
or delete the project when the portfolio search is no longer needed.

## Demo and verification status

The initial answer in the UI is a synthetic example. It is labelled as an example
and does not prove a live cloud request has succeeded. The status label changes
when a search response is received. Budget alerts do not cap spend.

This AI-assisted project demonstrates an integration approach. Confirm the cloud
configuration and inspect source documents before claiming deployment results,
adoption or independent authorship.
