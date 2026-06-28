# Solid 2.0 Skills Index

A collection of skills for Solid 2.0 migration and development.

## Skills

| File | Topic |
|------|-------|
| `solid-2-reactivity-batching-effects.md` | Core reactivity, batching, effects |
| `solid-2-signals-derived-ownership.md` | Signals, derived primitives, ownership |
| `solid-2-control-flow.md` | For, Show, Switch, Loading, Errored |
| `solid-2-stores.md` | Store setters, merge, omit, projections |
| `solid-2-async-data.md` | Async computations, isPending, latest |
| `solid-2-actions-optimistic.md` | Actions, optimistic updates |
| `solid-2-dom.md` | Attributes, class, directives |

## Quick Reference

### Migration Checklist

- [ ] `batch` → `flush()`
- [ ] `onMount` → `onSettled`
- [ ] `<Index>` → `<For keyed={false}>`
- [ ] `<Suspense>` → `<Loading>`
- [ ] `<ErrorBoundary>` → `<Errored>`
- [ ] `mergeProps` → `merge`
- [ ] `splitProps` → `omit`
- [ ] `createSelector` → `createProjection`
- [ ] `unwrap` → `snapshot`
- [ ] `createResource` → async computation + `Loading`
- [ ] `Context.Provider` → context as provider
- [ ] `classList` → `class` object/array
- [ ] `use:` → `ref`

### API Mapping

| 1.x | 2.0 |
|-----|-----|
| `batch()` | `flush()` |
| `onMount` | `onSettled` |
| `createComputed` | `createEffect` (split) |
| `createResource` | async computation |
| `mergeProps` | `merge` |
| `splitProps` | `omit` |
| `unwrap` | `snapshot` |
| `Context.Provider` | `<Context value>` |
| `classList` | `class` |
| `use:` | `ref` |

## Usage for AI Assistants

When reviewing Solid code, use these skills to:
1. Identify deprecated patterns
2. Suggest 2.0 replacements
3. Catch common migration mistakes
4. Update import statements