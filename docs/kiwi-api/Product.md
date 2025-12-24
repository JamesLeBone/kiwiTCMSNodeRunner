# Kiwi TCMS - Product API Reference

Source: https://kiwitcms.readthedocs.io/en/latest/modules/tcms.rpc.api.product.html

## Product.filter

**RPC Method**: `Product.filter(query)`

Search and return the resulting list of products.

### Parameters

- **query** (dict): Field lookups for `tcms.management.models.Product`

### Returns

- **Return type**: list[dict]
- List of serialized Product objects

### Example

```python
# Get all products
>>> Product.filter({})

# Filter by classification
>>> Product.filter({'classification': 1})

# Filter by name
>>> Product.filter({'name__icontains': 'test'})
```

---

## Product.create

**RPC Method**: `Product.create(values)`

Create a new product.

### Parameters

- **values** (dict): Field values for `tcms.management.models.Product`

### Returns

- **Return type**: dict
- Serialized Product object

### Raises

- **ValueError**: if input data validation fails
- **PermissionDenied**: if missing `management.add_product` permission

### Example

```python
>>> Product.create({
    'name': 'My Product',
    'description': 'Product description',
    'classification': 1
})
```

---

## Product.update

**RPC Method**: `Product.update(product_id, values)`

Update the fields of the selected product.

### Parameters

- **product_id** (int): PK of Product to modify
- **values** (dict): Field values for `tcms.management.models.Product`

### Returns

- **Return type**: dict
- Serialized Product object

### Raises

- **Product.DoesNotExist**: if object specified by PK doesn't exist
- **PermissionDenied**: if missing `management.change_product` permission
- **ValueError**: if validations fail

---

## Product Model

From `tcms/management/models.py`:

```python
class Product(models.Model):
    id = models.AutoField(primary_key=True)
    name = models.CharField(max_length=255, unique=True)
    description = models.TextField(blank=True)
    classification = models.ForeignKey(
        Classification, on_delete=models.CASCADE
    )
```

### Field Details

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `id` | AutoField | Auto | Primary key |
| `name` | CharField(255) | Yes | Unique, max 255 chars |
| `description` | TextField | No | Can be blank |
| `classification` | ForeignKey | Yes | References Classification model |

### Related Models

#### Classification

```python
class Classification(models.Model):
    id = models.AutoField(primary_key=True)
    name = models.CharField(max_length=64, unique=True)
```

Common classifications:
- "Web Application"
- "Desktop Application"
- "Mobile Application"
- "API"
- "Library"

#### Version

Products have a one-to-many relationship with Version:

```python
class Version(models.Model):
    value = models.CharField(max_length=192)
    product = models.ForeignKey(
        Product, related_name="version", on_delete=models.CASCADE
    )
```

**Relationship**: One Product can have many Versions

---

## Classification API

### Classification.create

**RPC Method**: `Classification.create(values)`

Create a new classification.

### Classification.filter

**RPC Method**: `Classification.filter(query)`

Search and return the resulting list of classifications.

### Example

```python
# Get all classifications
>>> Classification.filter({})
[
    {'id': 1, 'name': 'Web Application'},
    {'id': 2, 'name': 'Desktop Application'}
]

# Create new classification
>>> Classification.create({'name': 'Mobile App'})
{'id': 3, 'name': 'Mobile App'}
```

---

## Integration Notes

### Creating a Complete Product Setup

1. **Get or Create Classification**
   ```python
   classification = Classification.filter({'name': 'Web Application'})[0]
   # or
   classification = Classification.create({'name': 'New Type'})
   ```

2. **Create Product**
   ```python
   product = Product.create({
       'name': 'My Application',
       'description': 'Application description',
       'classification': classification['id']
   })
   ```

3. **Create Versions**
   ```python
   Version.create({'value': '1.0', 'product': product['id']})
   Version.create({'value': '2.0', 'product': product['id']})
   ```

### TypeScript/Node Implementation

```typescript
// Type definitions
export type Product = {
    id: number
    name: string
    description: string
    classification: number
}

export type Classification = {
    id: number
    name: string
}

export type Version = {
    id: number
    value: string
    product: number
}

// Usage pattern
const classifications = await http.search('Classification', {})
const products = await http.search('Product', {classification: 1})
const versions = await http.search('Version', {product: productId})
```

### Common Query Patterns

```python
# Find product by name (case-insensitive contains)
Product.filter({'name__icontains': 'web'})

# Get all products in a classification
Product.filter({'classification': 1})

# Get product with its versions
product = Product.filter({'id': 123})[0]
versions = Version.filter({'product': 123})
```
