# Kiwi TCMS API Documentation

Local reference documentation for Kiwi TCMS RPC API and Django models.

## Official Documentation

- **API Reference**: https://kiwitcms.readthedocs.io/en/latest/modules/tcms.rpc.api.html
- **Source Code**: https://github.com/kiwitcms/Kiwi
- **Version**: 15.2+ (as of December 2025)

## Documentation Files

### Management

- **[Product.md](./Product.md)** - Product, Classification, and relationship with Versions
- **[Version.md](./Version.md)** - Product versions for test plan versioning

### Test Planning

- **[TestPlan.md](./TestPlan.md)** - Complete TestPlan RPC API reference
- **[TestPlan-Model.md](./TestPlan-Model.md)** - Django model details, especially tree structure and parent field

### Test Execution

- **[TestCase.md](./TestCase.md)** - Test case management *(to be created)*
- **[TestRun.md](./TestRun.md)** - Test execution *(to be created)*
- **[TestExecution.md](./TestExecution.md)** - Individual test execution results *(to be created)*

### Supporting

- **[Tag.md](./Tag.md)** - Tagging system *(to be created)*
- **[Attachment.md](./Attachment.md)** - File attachments for plans/cases/runs *(to be created)*
- **[User.md](./User.md)** - User and authentication *(to be created)*

## Key Concepts

### RPC Protocol

Kiwi TCMS uses JSON-RPC 2.0 over HTTP:

```json
{
  "jsonrpc": "2.0",
  "method": "TestPlan.create",
  "params": {
    "values": {
      "product": 61,
      "product_version": 93,
      "name": "My Test Plan",
      "text": "Description",
      "type": 1
    }
  },
  "id": "request-id"
}
```

### Django Field Lookups

Many filter methods support Django ORM field lookups:

| Lookup | Description | Example |
|--------|-------------|---------|
| `field` | Exact match | `{'id': 123}` |
| `field__icontains` | Case-insensitive contains | `{'name__icontains': 'test'}` |
| `field__in` | In list | `{'id__in': [1, 2, 3]}` |
| `field__gt` | Greater than | `{'id__gt': 100}` |
| `field__gte` | Greater than or equal | `{'create_date__gte': '2025-01-01'}` |
| `field__lt` | Less than | `{'id__lt': 100}` |
| `field__lte` | Less than or equal | `{'create_date__lte': '2025-12-31'}` |

### Permissions

Most create/update/delete operations require specific Django permissions:

- `testplans.add_testplan` - Create test plans
- `testplans.change_testplan` - Modify test plans
- `testplans.delete_testplan` - Delete test plans
- `testcases.add_testcase` - Create test cases
- `management.add_product` - Create products
- etc.

### Date Handling

- Dates are typically returned as ISO 8601 strings: `"2025-12-24T10:30:00Z"`
- The `create_date` field is auto-set by the database
- Django uses `auto_now_add=True` for creation timestamps

### Optional vs Required Fields

**Common pitfall**: Documentation examples may show fields that are actually optional!

Always check:
1. Django model definitions (`blank=True, null=True`)
2. Form validation rules
3. Migration files for field constraints

Example: TestPlan's `parent` field appears in examples but is `blank=True, null=True`.

## Implementation Notes

### Node.js/TypeScript Integration

Our implementation in `src/server/kiwi/` follows these patterns:

1. **Type Definitions**: Mirror Django models but use camelCase
   ```typescript
   export type TestPlan = {
       id: number
       name: string
       isActive: boolean  // Django: is_active
       createDate: Date   // Django: create_date
   }
   ```

2. **Server Actions**: All RPC calls in `'use server'` files
   ```typescript
   'use server'
   export const create = async (params) => { ... }
   ```

3. **Date Transformation**: Use `DjangoEntity.addZulu()` for date parsing
   ```typescript
   const djangoPlan = (dje: DjangoEntity) : TestPlan => {
       dje.addZulu('createDate')
       return dje.values as TestPlan
   }
   ```

4. **Operation Results**: Return `TypedOperationResult<T>` for user feedback
   ```typescript
   const op = prepareStatus('action') as TypedOperationResult<TestPlan>
   // ... do work ...
   updateOpSuccess(op, 'Success message')
   op.data = result
   return op
   ```

### Error Handling

Python RPC errors are converted to JavaScript exceptions:

```typescript
await http.callDjango('TestPlan.create', {values})
    .then(result => { /* success */ })
    .catch(error => {
        // error.message contains Django validation errors
        console.error('Failed:', error.message)
    })
```

## Reference Data

### Default IDs

Common default values in fresh Kiwi TCMS installations:

- **PlanType**: Usually `type: 1` exists by default
- **TestCase Status**: `is_confirmed: true` for confirmed cases
- **Priority**: Default priority levels exist

### URL Patterns

Object URLs follow consistent patterns:

- TestPlan: `/plan/{id}/`
- TestCase: `/case/{id}/`
- TestRun: `/run/{id}/`

## Testing

When testing with the local Kiwi TCMS instance:

```bash
# Kiwi runs on http://localhost
# RPC endpoint: http://localhost/json-rpc/
# Default admin: kiwi@example.com / kiwi
```

## Changelog

- **2025-12-24**: Initial documentation creation
  - Added TestPlan, Version, Product references
  - Documented parent field optionality
  - Captured Python implementation details
