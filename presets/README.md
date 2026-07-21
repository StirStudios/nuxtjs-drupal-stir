# Stir vNext presets

The presets make capability selection explicit without breaking existing
consumers.

- `minimal` contains the shared Drupal renderer and theme without the Stir
  authentication layer.
- `full` preserves the existing root-layer behaviour and remains the
  compatibility path while optional capabilities are separated.

The repository root continues to behave as the full preset during the vNext
migration.
