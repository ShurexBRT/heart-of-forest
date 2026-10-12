# Heart of Forest Pages Deployment

Production Pages must not publish a `main` commit unless the Golden Slice verification suite passes.

## Controlled deployment

The repository contains two related workflows:

- `.github/workflows/verify.yml` — runs `node scripts/verify.mjs` on `main`, `polish/golden-slice`, and pull requests to `main`.
- `.github/workflows/deploy-pages.yml` — on `main`, runs the same verification first and only then uploads/deploys the static site through GitHub Actions.

`node scripts/verify.mjs` performs syntax checks, the static browser boot/import smoke check, and all `tests/*.test.mjs` tests.

## Required repository setting

GitHub Pages must use **Settings → Pages → Build and deployment → Source: GitHub Actions**.

If Pages remains configured to deploy directly from a branch, GitHub's dynamic `pages build and deployment` workflow can publish `main` independently of the verification job. In that state, production is **not** considered gated even though `verify.yml` runs.

## Release rule

A production change is releasable only when:

1. the relevant pull request verification is green;
2. the merged `main` commit passes Golden Slice verification;
3. the Actions-controlled Pages deployment succeeds;
4. any manual Golden Slice acceptance gate required by the release remains satisfied.

Do not infer a pass from a successful Pages deployment if the repository source is still configured for branch-based publishing.
