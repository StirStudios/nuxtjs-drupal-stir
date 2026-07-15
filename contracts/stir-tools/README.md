# Stir Tools contract snapshot

`v1/` is a generated build/test snapshot whose source of truth is Stir Tools `contracts/v1`. It is not a browser runtime dependency.

Refresh it from a local Stir Tools checkout with:

```bash
pnpm contracts:sync /path/to/stir-tools/contracts/v1
```

The sync command validates manifest references and writes checksums to `snapshot.json`. Unit tests verify those checksums and validate every producer fixture against its declared JSON Schema. Runtime adapters and types may be backward-compatible with older payloads, but they must not contradict the producer contract.
