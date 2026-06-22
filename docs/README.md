# docs/

This folder holds documentation assets for the Holmes OSINT Platform.

## sample_report.pdf

Place your generated sample report PDF here.

**How to generate:**
1. Start Holmes locally (`uvicorn main:app --reload`)
2. Run a scan on a domain you own (e.g. your portfolio site or `github.com`)
3. When the scan completes, click **Export PDF** in the results panel
4. Save the output as `docs/sample_report.pdf` and commit it

The PDF will be automatically linked from the README for reviewers.
