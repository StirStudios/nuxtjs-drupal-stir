# Diagnostics layer

This repository-only layer owns build analysis and report-writing behavior used
by the performance audit. It is selected only when a build runs from this
repository root with `STIR_PERF_ANALYZE=true`.

Installed minimal and full consumers never register this layer, even if they
set the same environment variable. Runtime diagnostics that are part of the
Stir Drupal rendering contract remain with that facade; this layer is only for
maintainer tooling that writes repository artifacts.
