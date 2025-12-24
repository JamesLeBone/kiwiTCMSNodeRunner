# Kiwi TCMS - TestPlan Django Model

Source: 
- https://kiwitcms.readthedocs.io/en/latest/modules/tcms.testplans.models.html
- https://github.com/kiwitcms/Kiwi/tree/main/tcms/testplans/models.py

## TestPlan Model Fields

From `tcms/testplans/models.py`:

```python
class TestPlan(TreeNode, UrlMixin):
    """A plan within the TCMS"""

    history = KiwiHistoricalRecords()

    name = models.CharField(max_length=255, db_index=True)
    text = models.TextField(blank=True)
    create_date = models.DateTimeField(auto_now_add=True)
    is_active = models.BooleanField(default=True, db_index=True)
    extra_link = models.CharField(max_length=1024, default=None, blank=True, null=True)

    product_version = models.ForeignKey(
        Version, related_name="plans", on_delete=models.CASCADE
    )
    author = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    product = models.ForeignKey(
        "management.Product", related_name="plan", on_delete=models.CASCADE
    )
    type = models.ForeignKey(PlanType, on_delete=models.CASCADE)
    tag = models.ManyToManyField(
        "management.Tag", through="testplans.TestPlanTag", related_name="plan"
    )
```

### Field Details

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `id` | AutoField | Auto | Primary key |
| `name` | CharField(255) | Yes | Indexed, max 255 chars |
| `text` | TextField | No | Can be blank |
| `create_date` | DateTimeField | Auto | Set by database on creation |
| `is_active` | BooleanField | No | Default: `True`, indexed |
| `extra_link` | CharField(1024) | No | Can be null/blank |
| `product` | ForeignKey | Yes | References Product model |
| `product_version` | ForeignKey | Yes | References Version model |
| `author` | ForeignKey | Yes | References User model |
| `type` | ForeignKey | Yes | References PlanType model |
| `parent` | ForeignKey | **No** | **Optional** - References TestPlan (self), `blank=True, null=True` |
| `tag` | ManyToManyField | No | Through TestPlanTag table |

### Parent Field (Tree Structure)

**CRITICAL**: The `parent` field is **OPTIONAL** despite appearing in minimal examples.

From migration `tcms/testplans/migrations/0009_tree.py`:

```python
migrations.AlterField(
    model_name="testplan",
    name="parent",
    field=models.ForeignKey(
        blank=True,           # ← Can be omitted from forms
        null=True,            # ← Can be NULL in database
        on_delete=models.deletion.CASCADE,
        related_name="children",
        to="testplans.testplan",
        verbose_name="parent",
    ),
),
```

**Usage:**
- **Top-level plans**: Omit `parent` or set to `null`/`None`
- **Child plans**: Set `parent` to the ID of another TestPlan
- Creates tree hierarchy with depth-first traversal support

### Related Models

#### PlanType

```python
class PlanType(models.Model, UrlMixin):
    name = models.CharField(max_length=64, unique=True)
    description = models.TextField(blank=True, null=True)
```

#### TestPlanEmailSettings

```python
class TestPlanEmailSettings(models.Model):
    plan = models.OneToOneField(
        TestPlan, related_name="email_settings", on_delete=models.CASCADE
    )
    auto_to_plan_author = models.BooleanField(default=True)
    auto_to_case_owner = models.BooleanField(default=True)
    auto_to_case_default_tester = models.BooleanField(default=True)
    notify_on_plan_update = models.BooleanField(default=True)
    notify_on_case_update = models.BooleanField(default=True)
```

#### TestPlanTag

```python
class TestPlanTag(models.Model):
    tag = models.ForeignKey("management.Tag", on_delete=models.CASCADE)
    plan = models.ForeignKey(TestPlan, on_delete=models.CASCADE)
```

## Model Methods

### clone()

```python
def clone(
    self,
    name=None,
    product=None,
    version=None,
    new_author=None,
    set_parent=False,
    copy_testcases=False,
    **_kwargs,
):
```

Clone this plan with optional settings:
- `set_parent=True`: Sets original plan as parent of cloned plan (creates hierarchy)
- `copy_testcases=True`: Clones test cases instead of just linking them

### tree_as_list()

Returns the entire tree family as a list of TestPlan objects with tree fields.

### tree_view_html()

Returns nested tree structure as Patternfly TreeView HTML. Returns empty string if plan is not part of a tree.

### add_case(case, sortkey=None)

Add a test case to the plan with optional sort order.

### add_tag(tag)

Add a tag to the plan.

### remove_tag(tag)

Remove a tag from the plan.

### delete_case(case)

Remove a test case from the plan.

## Tree Structure

TestPlan uses `tree_queries.models.TreeNode` for efficient tree operations:

- Self-referential via `parent` ForeignKey
- Related name `children` for reverse lookup
- Supports depth-first traversal
- Family tree operations via `tree()` RPC method

**Example:**
```
TestPlan 1 (parent=null)
  ├─ TestPlan 2 (parent=1)
  │   └─ TestPlan 4 (parent=2)
  └─ TestPlan 3 (parent=1)
```

## Form Validation

From `tcms/testplans/forms.py`:

```python
class NewPlanForm(forms.ModelForm):
    class Meta:
        model = TestPlan
        exclude = ("tag",)

    text = forms.CharField(widget=SimpleMDE(), required=False)

    def populate(self, product_id):
        if product_id:
            self.fields["product_version"].queryset = Version.objects.filter(
                product_id=product_id
            )
        else:
            self.fields["product_version"].queryset = Version.objects.all()
```

**Note**: The form's `populate()` method filters product versions based on selected product.
