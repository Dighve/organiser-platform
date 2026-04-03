# Automated Daily PR Workflow

## Overview

This workflow automatically creates a Pull Request from `staging` to `main` branch every day at 6 PM UTC.

## Workflow Details

**File:** `.github/workflows/daily-staging-to-main-pr.yml`

**Schedule:** Daily at 6 PM UTC (18:00 UTC)

**Purpose:** Automate the release process by creating daily PRs for merging staging changes into production.

## How It Works

1. **Scheduled Trigger:** Runs automatically at 6 PM UTC every day
2. **Manual Trigger:** Can also be triggered manually via GitHub Actions UI
3. **Duplicate Check:** Checks if a PR already exists to avoid duplicates
4. **PR Creation:** Creates a new PR with:
   - Title: `🚀 Daily Release: Staging → Main (YYYY-MM-DD)`
   - Automated description with review checklist
   - Labels: `automated`, `release`
5. **Smart Handling:** Skips creation if PR already exists or branches are in sync

## Timezone Configuration

The workflow is currently set to **6 PM UTC**.

To adjust for your timezone:
- **UTC+1 (e.g., London BST):** Change cron to `0 17 * * *` (5 PM UTC = 6 PM UTC+1)
- **UTC+5:30 (e.g., India IST):** Change cron to `0 12 30 * * *` (12:30 PM UTC = 6 PM IST)
- **UTC-5 (e.g., EST):** Change cron to `0 23 * * *` (11 PM UTC = 6 PM EST)

### Cron Format
```
0 18 * * *
│ │  │ │ │
│ │  │ │ └─── Day of week (0-6, Sunday=0)
│ │  │ └───── Month (1-12)
│ │  └─────── Day of month (1-31)
│ └────────── Hour (0-23, UTC)
└──────────── Minute (0-59)
```

## Manual Trigger

You can manually trigger the workflow:

1. Go to **Actions** tab in GitHub
2. Select **Daily Staging to Main PR** workflow
3. Click **Run workflow** button
4. Select branch and click **Run workflow**

## PR Template

Each automated PR includes:

```markdown
## Automated Daily Release

This PR merges the latest changes from `staging` branch into `main` branch.

**Created:** YYYY-MM-DD at 6 PM UTC
**Source:** `staging`
**Target:** `main`

### Review Checklist
- [ ] All tests passing in staging
- [ ] No breaking changes
- [ ] Documentation updated
- [ ] Ready for production deployment
```

## Branch Requirements

**Prerequisites:**
- `staging` branch must exist
- `main` branch must exist
- Branches must have diverged (different commits)

**Permissions:**
- Workflow uses `GITHUB_TOKEN` (automatically provided)
- No additional secrets required

## Workflow Behavior

### Scenario 1: Normal Operation
- Staging has new commits → PR created successfully ✅
- Notification sent to repository watchers
- PR ready for review and merge

### Scenario 2: PR Already Exists
- Open PR found → Skips creation ℹ️
- Logs existing PR number
- No duplicate PRs created

### Scenario 3: Branches in Sync
- No differences between branches → Creation fails gracefully ⚠️
- Logs warning message
- Workflow completes successfully

## Monitoring

**View Workflow Runs:**
1. Go to **Actions** tab
2. Select **Daily Staging to Main PR**
3. View run history and logs

**Check PR Status:**
- PRs are labeled with `automated` and `release`
- Filter PRs by these labels to find automated releases

## Best Practices

1. **Review Before Merge:** Always review automated PRs before merging
2. **Test in Staging:** Ensure all tests pass in staging before 6 PM
3. **Monitor Failures:** Check workflow logs if PRs aren't created
4. **Branch Hygiene:** Keep staging up-to-date with main to avoid conflicts

## Customization

### Change Schedule
Edit the cron expression in `.github/workflows/daily-staging-to-main-pr.yml`:
```yaml
on:
  schedule:
    - cron: '0 18 * * *'  # Change this line
```

### Change PR Title/Body
Modify the `gh pr create` command in the workflow file.

### Add Auto-Merge
Add this step after PR creation (requires branch protection rules):
```yaml
- name: Enable Auto-Merge
  if: steps.check-pr.outputs.exists == 'false'
  env:
    GH_TOKEN: ${{ secrets.GITHUB_TOKEN }}
  run: |
    gh pr merge --auto --squash
```

### Add Reviewers
Add reviewers to the PR:
```yaml
gh pr create \
  --reviewer username1,username2 \
  # ... other flags
```

## Troubleshooting

### PR Not Created
**Possible causes:**
- Branches are in sync (no changes to merge)
- PR already exists
- Workflow permissions issue

**Solution:** Check workflow logs in Actions tab

### Wrong Timezone
**Issue:** PR created at wrong time

**Solution:** Adjust cron expression (see Timezone Configuration above)

### Workflow Not Running
**Possible causes:**
- Repository settings disable workflows
- Workflow file syntax error

**Solution:** 
1. Check Actions tab for errors
2. Validate YAML syntax
3. Ensure workflows are enabled in repository settings

## Security

- Uses `GITHUB_TOKEN` (automatically scoped to repository)
- No sensitive data exposed
- Read-only access to repository
- Write access only for PR creation

## Future Enhancements

Consider adding:
- [ ] Slack/Discord notifications when PR created
- [ ] Auto-merge after CI passes
- [ ] Changelog generation in PR body
- [ ] Deployment preview links
- [ ] Automatic version bumping

## Related Documentation

- [GitHub Actions Cron Syntax](https://docs.github.com/en/actions/using-workflows/events-that-trigger-workflows#schedule)
- [GitHub CLI PR Commands](https://cli.github.com/manual/gh_pr_create)
- [Workflow Dispatch Events](https://docs.github.com/en/actions/using-workflows/events-that-trigger-workflows#workflow_dispatch)

---

**Status:** ✅ Active
**Last Updated:** 2026-04-03
**Maintained By:** DevOps Team
