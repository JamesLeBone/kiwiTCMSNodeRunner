# Kiwi TCMS Node Runner - AI Coding Instructions

> **Project Scope**: These instructions apply **only** to the `kiwiTCMSNodeRunner` workspace. Do not apply these patterns to the `smtp` or `kiwitcms` workspace folders.

## Architecture Overview

This is a Next.js 15 TypeScript application that provides a frontend and automation platform for Kiwi TCMS (Test Case Management System). The architecture enforces strict client/server boundaries using Next.js Server Actions.

### Directory Structure
- `src/app/` - Next.js app router pages and layouts
- `src/server/` - Server actions (must start with `'use server'`, async-only, plain data returns)
- `src/server/kiwi/` - Kiwi TCMS API connectors (Django REST/RPC)
- `src/server/lib/` - Server utilities (no `'use server'` directive needed)
- `src/components/` - React client components
- `src/lib/` - Shared utilities

### Import Aliases
```typescript
import * as TestPlan from '@server/kiwi/TestPlan'  // Server actions
import { FormInputField } from '@/components/FormActions'  // Components
import { prepareStatus } from '@lib/Operation'  // Utilities
```

## Form Pattern (Critical)

**Always use this pattern for forms** - see `Tags.tsx` and `TestPlanSearch.tsx` as reference:

```typescript
import { formDataValue } from '@lib/Functions'

const [state, doAction, isPending] = useActionState(
    async (prevState: any, formData: FormData) => {
        const fieldValue = formDataValue.getString(formData, 'fieldName')
        
        // Validation
        if (!fieldValue || fieldValue.trim().length === 0) {
            return validationError('actionId', 'Error message')
        }
        
        // Server call
        const result = await ServerModule.method(params)
        if (result.status && result.data) {
            setLocalState(result.data)
            return { ...result, message: 'Success' }
        }
        return result
    },
    blankStatus('actionId')
)

return <Form action={doAction}>
    <fieldset style={{display:'grid',gridTemplateColumns:'200px'}}>
        <FormInputField label="Field Label" name="fieldName" type="text" />
    </fieldset>
    <FormActionBar pendingState={isPending} state={state} actions={[{ label: 'Submit' }]} />
</Form>
```

**Key points:**
- Use `Form` from `next/form`, NOT HTML `<form>`
- Extract data using `formDataValue` from `@lib/Functions`:
  - `formDataValue.getString(formData, 'key', 'default')` - strings
  - `formDataValue.getNumber(formData, 'key', 0)` - numbers
  - `formDataValue.getBoolean(formData, 'key', false)` - booleans
  - `formDataValue.getJson(formData, 'key', {})` - JSON objects
- Return `StatusOperation` objects: `{ status: boolean, message: string, statusType: 'error'|'success'|'info', id: string }`
- Use `validationError()` and `blankStatus()` helpers from `@/components/FormActions`

## Styling System

### CSS Variables for Theming
All colors use CSS variables defined in `src/app/globals.scss` with automatic light/dark mode:

```scss
:root {
    --linkColor: #0c4a6e;
    --inputBackground: #ffffff;
    --input-border: #cbd5e0;
    --input-border-focus: #0c4a6e;
    --panelBackground: #bdbbb9a1;  // Supports transparent stacking
    --input-border-radius: 6px;
}

@media screen and (prefers-color-scheme: dark) {
    :root {
        --linkColor: #79a7ff;
        --inputBackground: #1e1e2e;
        // ... dark mode overrides
    }
}
```

**Always use CSS variables for colors/borders, never hardcode values.** Panel backgrounds use transparency (`rgba` or hex with alpha) to support stacking.

### Input Field Standards
- Border radius: `var(--input-border-radius)` (6px)
- Consistent height: 38px for all inputs/buttons
- Focus state: `border-color: var(--input-border-focus)` with shadow
- Hover state: `background-color: var(--inputBackgroundHover)`

### Component Styling Classes
- `.FormField` - Standard form field wrapper with label
- `.FormField-number` - Number inputs with increment/decrement buttons
- `.ArgumentEditor` - Key-value pair grid (1fr 1fr min-content)
- `.Boolean-Wrap` - Toggle switch component

## Server Action Pattern

All server files in `src/server/kiwi/` follow this pattern:

```typescript
'use server'
import { prepareStatus, updateOpSuccess, updateOpError, TypedOperationResult } from '@lib/Operation'

export const get = async (id: number): Promise<TypedOperationResult<EntityType>> => {
    const op = prepareStatus('actionId') as TypedOperationResult<EntityType>
    
    const result = await http.get<EntityType>('Entity', id, transformFn)
        .catch(e => {
            updateOpError(op, e.message ?? 'Failed to fetch')
            return null
        })
    
    if (result == null) return op
    op.data = result
    updateOpSuccess(op, 'Success message')
    return op
}

export const search = async (params: Partial<SearchParams>): Promise<EntityType[]> => {
    const results = await http.search('Entity', params, false)
        .catch(e => {
            console.error('Search failed', e)
            return []
        })
    return results.map(item => transformFn(item))
}
```

**Pattern rules:**
- `get()` returns `TypedOperationResult<T>` with status/message
- `search()` returns `T[]` directly (empty array on error)
- `fetch()` returns `T | null` for simple retrieval
- Use `TypedOperationResult` for operations that need user feedback

## Component Patterns

### Search Components
Use `DynamicTable` for results, single `Form` with multiple fieldsets:
```tsx
<ComponentSection header="Search" className={['fill']}>
    <div>
        <Form action={doSearch}>
            <fieldset style={{display:'grid',gridTemplateColumns:'200px'}}>
                <FormInputField label="ID" name="entityId" type="number" />
            </fieldset>
            <fieldset style={{display:'grid',gridTemplateColumns:'repeat(auto-fit, 200px)'}}>
                <FormInputField label="Name" name="entityName" />
            </fieldset>
            <FormActionBar pendingState={isPending} state={state} actions={[{ label: 'Search' }]} />
        </Form>
    </div>
    <DynamicTable headers={['ID', 'Name']}>
        {items.map(item => <Row key={item.id} item={item} />)}
    </DynamicTable>
</ComponentSection>
```

### Icon Buttons
Use FontAwesome 6 classes: `<IconButton className="fa fa-trash" title="Delete" />`

Common icons: `fa-plus`, `fa-trash`, `fa-edit`, `fa-search`, `fa-save`, `fa-rotate`

## Development Commands

```bash
npm run dev              # Start dev server on port 8084
npm run build           # Production build
npm test                # Run Jest tests
npm run typescriptCheck # Type checking without emit
```

## Kiwi TCMS Integration

- External Kiwi instance expected at `http://localhost` (via Docker)
- User credentials encrypted in local SQLite (`db.sqlite3`)
- RPC calls via `src/server/kiwi/Kiwi.ts` HTTP wrapper
- Django entity transformations: `djangoEntity.addZulu('dateField')` for date parsing

## Data Model Extensions

Custom Kiwi TCMS fields:
- `TestCase.arguments` - JSON-encoded string for test parameters
- `TestCase.script` - Numeric reference to parent test case
- `SecurityGroupId` in arguments for user-level access control

## Testing

Jest configured for React Testing Library. Run with `npm test` or `npm run test:watch`.

## Key Files Reference

- Form pattern: `src/components/kiwi/Tags.tsx`, `src/components/kiwi/TestPlanSearch.tsx`
- Styling: `src/app/globals.scss`
- Server actions: `src/server/kiwi/TestPlan.ts`, `src/server/kiwi/TestCase.ts`
- Components: `src/components/FormActions.tsx`, `src/components/ComponentSection.tsx`
