# Kiwi TCMS - TestPlan API Reference

Source: https://kiwitcms.readthedocs.io/en/latest/modules/tcms.rpc.api.testplan.html

## TestPlan.create

**RPC Method**: `TestPlan.create(values)`

Create new Test Plan object and store it in the database.

### Parameters

- **values** (dict): Field values for `tcms.testplans.models.TestPlan`
- **kwargs**: Dict providing access to the current request, protocol, entry point name and handler instance from the rpc method

### Returns

- **Return type**: dict
- Serialized TestPlan object

### Raises

- **PermissionDenied**: if missing `testplans.add_testplan` permission
- **ValueError**: if data validation fails

### Minimal Example

```python
values = {
    'product': 61,
    'product_version': 93,
    'name': 'Testplan foobar',
    'type': 1,
    'parent': 150,  # Optional - can be omitted for top-level plans
    'text':'Testing TCMS',
}
TestPlan.create(values)
```

### Python Implementation Notes

From `tcms/rpc/api/testplan.py`:

```python
@permissions_required("testplans.add_testplan")
@rpc_method(name="TestPlan.create")
def create(values, **kwargs):
    request = kwargs.get(REQUEST_KEY)

    if not values.get("author"):
        values["author"] = request.user.pk

    if not values.get("is_active"):
        values["is_active"] = True

    form = NewPlanForm(values)
    form.populate(product_id=values["product"])

    if form.is_valid():
        test_plan = form.save()
        result = model_to_dict(test_plan, exclude=["tag"])

        # b/c value is set in the DB directly and if None
        # model_to_dict() will not return it
        result["create_date"] = test_plan.create_date
        return result

    raise ValueError(list(form.errors.items()))
```

**Key behaviors:**
- `author` defaults to current user if not provided
- `is_active` defaults to `True` if not provided
- `create_date` is set by database but must be explicitly returned
- Form validation uses `NewPlanForm` which populates product versions

---

## TestPlan.filter

**RPC Method**: `TestPlan.filter(query)`

Perform a search and return the resulting list of test plans.

### Parameters

- **query** (dict): Field lookups for `tcms.testplans.models.TestPlan`

### Returns

- **Return type**: list[dict]
- List of serialized TestPlan objects

---

## TestPlan.update

**RPC Method**: `TestPlan.update(plan_id, values)`

Update the fields of the selected test plan.

### Parameters

- **plan_id** (int): PK of TestPlan to modify
- **values** (dict): Field values for `tcms.testplans.models.TestPlan`

### Returns

- **Return type**: dict
- Serialized TestPlan object

### Raises

- **TestPlan.DoesNotExist**: if object specified by PK doesn't exist
- **PermissionDenied**: if missing `testplans.change_testplan` permission
- **ValueError**: if validations fail

---

## TestPlan.add_case

**RPC Method**: `TestPlan.add_case(plan_id, case_id)`

Link test case to the given plan.

### Parameters

- **plan_id** (int): PK of TestPlan to modify
- **case_id** (int): PK of TestCase to be added to plan

### Returns

- **Return type**: dict
- Serialized TestCase object augmented with a 'sortkey' value

### Raises

- **TestPlan.DoesNotExist** or **TestCase.DoesNotExist**: if objects specified by PKs are missing
- **PermissionDenied**: if missing `testcases.add_testcaseplan` permission

---

## TestPlan.remove_case

**RPC Method**: `TestPlan.remove_case(plan_id, case_id)`

Unlink a test case from the given plan.

### Parameters

- **plan_id** (int): PK of TestPlan to modify
- **case_id** (int): PK of TestCase to be removed from plan

### Raises

- **PermissionDenied**: if missing `testcases.delete_testcaseplan` permission

---

## TestPlan.add_tag

**RPC Method**: `TestPlan.add_tag(plan_id, tag_name)`

Add a tag to the specified test plan.

### Parameters

- **plan_id** (int): PK of TestPlan to modify
- **tag_name** (str): Tag name to add

### Raises

- **PermissionDenied**: if missing `testplans.add_testplantag` permission
- **TestPlan.DoesNotExist**: if object specified by PK doesn't exist
- **Tag.DoesNotExist**: if missing `management.add_tag` permission and tag_name doesn't exist

---

## TestPlan.remove_tag

**RPC Method**: `TestPlan.remove_tag(plan_id, tag_name)`

Remove tag from the specified test plan.

### Parameters

- **plan_id** (int): PK of TestPlan to modify
- **tag_name** (str): Tag name to remove

### Raises

- **PermissionDenied**: if missing `testplans.delete_testplantag` permission
- **DoesNotExist**: if objects specified don't exist

---

## TestPlan.add_attachment

**RPC Method**: `TestPlan.add_attachment(plan_id, filename, b64content)`

Add attachment to the given TestPlan.

### Parameters

- **plan_id** (int): PK of TestPlan
- **filename** (str): File name of attachment, e.g. 'logs.txt'
- **b64content** (str): Base64 encoded content

---

## TestPlan.list_attachments

**RPC Method**: `TestPlan.list_attachments(plan_id)`

List attachments for the given TestPlan.

### Parameters

- **plan_id** (int): PK of TestPlan to inspect

### Returns

- **Return type**: list
- A list containing information and download URLs for attachments

### Raises

- **TestPlan.DoesNotExist**: if object specified by PK is missing

---

## TestPlan.tree

**RPC Method**: `TestPlan.tree(plan_id)`

Returns a list of the ancestry tree for the given TestPlan in depth-first order.

### Parameters

- **plan_id** (int): PK of TestPlan to inspect

### Returns

- **Return type**: list
- A DFS ordered list of all test plans in the family tree starting from the root

### Raises

- **TestPlan.DoesNotExist**: if object specified by PK is missing

---

## TestPlan.update_case_order

**RPC Method**: `TestPlan.update_case_order(plan_id, case_id, sortkey)`

Update sortkey which controls display order of the given test case in the given test plan.

### Parameters

- **plan_id** (int): PK of TestPlan holding the selected TestCase
- **case_id** (int): PK of TestCase to be modified
- **sortkey** (int): Ordering value, e.g. 10, 20, 30

### Raises

- **PermissionDenied**: if missing `testcases.delete_testcaseplan` permission
