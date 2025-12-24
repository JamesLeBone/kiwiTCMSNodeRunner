# Kiwi TCMS - Version API Reference

Source: https://kiwitcms.readthedocs.io/en/latest/modules/tcms.rpc.api.version.html

## Version.filter

**RPC Method**: `Version.filter(query)`

Search and returns the resulting list of versions.

### Parameters

- **query** (dict): Field lookups for `tcms.management.models.Version`

### Returns

- **Return type**: list[dict]
- List of serialized Version objects

### Example

```python
# Get all versions for a specific product
>>> Version.filter({'product': 272})
[
    {'id': 93, 'value': '1.0', 'product': 272},
    {'id': 94, 'value': '2.0', 'product': 272}
]
```

### Common Query Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `product` | int | Filter by product ID |
| `value` | str | Filter by version string |
| `id` | int | Filter by version ID |

---

## Version.create

**RPC Method**: `Version.create(values)`

Add new version.

### Parameters

- **values** (dict): Field values for `tcms.management.models.Version`

### Returns

- **Return type**: dict
- Serialized Version object

### Raises

- **ValueError**: if input data validation fails
- **PermissionDenied**: if missing `management.add_version` permission

### Example

```python
# Add version for specified product
>>> Version.create({'value': 'devel', 'product': 272})
{'id': '1106', 'value': 'devel', 'product': 272}
```

---

## Version Model

From `tcms/management/models.py`:

```python
class Version(models.Model):
    id = models.AutoField(primary_key=True)
    value = models.CharField(max_length=192)
    product = models.ForeignKey(
        Product, related_name="version", on_delete=models.CASCADE
    )
```

### Field Details

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `id` | AutoField | Auto | Primary key |
| `value` | CharField(192) | Yes | Version string (e.g., "1.0", "devel") |
| `product` | ForeignKey | Yes | References Product model |

### Usage in TestPlan

Versions are filtered by product when creating/editing test plans:

```python
# From NewPlanForm.populate()
self.fields["product_version"].queryset = Version.objects.filter(
    product_id=product_id
)
```

**Important**: Always filter versions by product_id to ensure only valid versions for the selected product are available.

### Common Version Values

- Semantic versions: "1.0", "2.0", "3.1.5"
- Development: "devel", "master", "main"
- Release candidates: "1.0-rc1", "2.0-beta"
- Branches: "feature/xyz", "release/1.0"

## Integration Notes

### When Creating TestPlans

1. User selects a Product
2. Fetch available Versions: `Version.filter({product: productId})`
3. User selects a Version from the filtered list
4. Use `product_version` ID in TestPlan.create()

### TypeScript/Node Implementation

```typescript
// Type definition
export type Version = {
    id: number
    value: string
    product: number
}

// Fetch versions for a product
const versions = await http.search('Version', {product: productId})
    .then(djlist => djlist.map(dj => dj.values as Version))
    .catch(e => [])
```
