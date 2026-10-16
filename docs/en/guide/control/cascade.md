# Cascade Expression

Cascade expressions automatically control the **visibility, required state, editability, and deletability** of other controls or titles when control values change. Rules live on the trigger control's `control.cascade`, persist via `getValue`, and are executed by the built-in engine. For control validation see [Control-Validation](./validate.md).

## Data Structure

```ts
interface IControlCascadeRule {
  expression: string // DSL expression, e.g. "getValue(@self) == '1'"
  actions: ICascadeAction[] // Applied when the expression is true
  elseActions?: ICascadeAction[] // Optional; restores target baselines when omitted
}

interface ICascadeAction {
  controlId?: string // Target control id (unique, precise)
  conceptId?: string // Target control/title conceptId (batch)
  // Both fields may be set together; all matches are applied
  targetType?: 'control' | 'title' // Disambiguates conceptId; auto-detected by default: control first, then title
  effects: {
    hide?: boolean // Visibility (control and title)
    required?: boolean // Required (control only)
    disabled?: boolean // Editable (control only)
    deletable?: boolean // Deletable (control only)
  }
}
```

The `required` in cascade effects maps to the control's required state (see [Control-Validation](./validate.md)); `compute?: string` holds a computed expression (see below).

## DSL Syntax

```
getValue(@self) == '1'
getValue('gender') == '2' && getValue('age') >= 15 && getValue('age') <= 49
contains(getValue('allergy'), '1') && count(getValue('allergy')) >= 2
getValue('operationDate') > 'today'
getValue('dischargeDate') < getValue('admissionDate')
round(getValue('weight') / (getValue('height') * getValue('height')), 1)
getValue('endTime') < now()
datediff(getValue('end'), getValue('start')) > 7
round(datediff('today', getValue('birthdate')) / 365)
if(getValue('bmi') < 18.5, 'underweight', if(getValue('bmi') < 28, 'normal', 'obese'))
```

### The getValue Function

Control values are always fetched via `getValue()` (bare identifiers are not allowed):

- `getValue('conceptId or controlId')`: fetches the real-time value by id — exact `controlId` match first, then `conceptId` (first one with a value wins)
- `getValue(@self)`: fetches the value of the control hosting the rule (`@self` is only allowed as a `getValue` argument)

Normalization: SELECT/RADIO → selected item's `code`; CHECKBOX → array of `code`s; TEXT/NUMBER/DATE → real-time plain text (NUMBER auto-converts to number; DATE compares with `'YYYY-MM-DD'`, `'today'`, or `now()`). Use `datediff` for date differences — don't do arithmetic on date values directly (`now() - getValue('birthdate')` fails since date strings can't convert to numbers).

### Operators & Literals

| Category   | Operators                                                       |
| ---------- | --------------------------------------------------------------- |
| Comparison | `==` `!=` `>` `>=` `<` `<=`                                     |
| Logical    | `&&` `\|\|` `!`                                                 |
| Arithmetic | `+` `-` `*` `/` `%` (`+` concatenates when either side is text) |
| Membership | `in` (left value contained in right-side array)                 |

Precedence: `!` > `* / %` > `+ -` > comparison > `&&` > `||`; override with `()`. Literals: strings (single/double quotes), numbers, booleans, `null`, arrays.

### Built-in Functions

| Function                            | Description                                                                                    |
| ----------------------------------- | ---------------------------------------------------------------------------------------------- |
| `empty(x)` / `notEmpty(x)`          | Emptiness check                                                                                |
| `len(x)`                            | Text length in characters                                                                      |
| `count(x)`                          | Number of checked checkbox items                                                               |
| `contains(x, v)`                    | Checkbox codes contain a code; or text contains a substring                                    |
| `round(x, digits?)`                 | Rounding; `digits` defaults to 0                                                               |
| `floor(x)` / `ceil(x)`              | Floor / ceiling                                                                                |
| `abs(x)`                            | Absolute value                                                                                 |
| `min(a, b, ...)` / `max(a, b, ...)` | Minimum / maximum; returns `null` if no numeric args                                           |
| `power(x, n)`                       | Exponentiation `xⁿ`                                                                            |
| `sqrt(x)`                           | Square root; negative returns `null`                                                           |
| `if(cond, a, b)`                    | Conditional: `cond` truthy → `a`, else `b`; only the taken branch is evaluated (short-circuit) |
| `now()`                             | Current time in ms (with time-of-day); comparable to dates                                     |
| `datediff(end, start, unit?)`       | Date difference (`end - start`); `unit`: `d`(default)/`h`/`m`/`s`; returns `null` if invalid   |

Parse/evaluation failures are treated as `false` with a `console.warn` — editing is never interrupted.

## Computed Fields (compute)

With `control.compute` set, the expression is re-evaluated on any value change and the result is written back into this control (Excel formula pattern):

```json
{
  "conceptId": "bmi",
  "type": "number",
  "value": null,
  "disabled": true,
  "compute": "round(getValue('weight') / (getValue('height') * getValue('height')), 1)"
}
```

- Written back only when the result changes; empty operands or invalid arithmetic (e.g. division by zero) clear the value
- Combine with `disabled: true` for read-only fields; computation runs before cascade conditions (e.g. `getValue(@self) > 28` sees the latest BMI)
- Chained computation supported with an iteration cap against cycles; computed writes produce no undo records

## Target Resolution & Title Control

- `controlId` matches one unique control; `conceptId` batch-matches same-concept controls or a title; both can be set together — all matches are applied
- For a title target (matched by the title's `conceptId`), `hide: true` hides the title itself and everything after it until the next title of the same or higher level

## Baselines & elseActions

- The target's original property values are snapshotted before the first effect is applied (e.g. the target may already be `required: true`)
- When the expression turns false without `elseActions`, the snapshot is restored — document defaults are never lost; with `elseActions`, they are applied as declared

## Execution Timing

- Runs fully on init and after `executeSetValue`
- Re-evaluates one macrotask after content changes (typing, paste, undo/redo); not during IME composition — applied on commit
- `executeValidate` flushes cascades synchronously first, so validation sees the latest visibility/required state
- Effects only write properties, never values — no recursion, no undo pollution

## Complete Example

Only selecting "has hypertension" shows and requires "hypertension level":

```json
[
  { "value": "Hypertension" },
  {
    "type": "control",
    "controlId": "1",
    "value": null,
    "control": {
      "conceptId": "hypertension",
      "type": "select",
      "value": null,
      "valueSets": [
        { "value": "Yes", "code": "1" },
        { "value": "No", "code": "0" }
      ],
      "cascade": [
        {
          "expression": "getValue(@self) == '1'",
          "actions": [
            {
              "conceptId": "hypertensionLevel",
              "effects": { "hide": false, "required": true }
            }
          ]
        }
      ]
    }
  },
  { "value": "Hypertension Level" },
  {
    "type": "control",
    "controlId": "2",
    "value": null,
    "control": {
      "conceptId": "hypertensionLevel",
      "type": "select",
      "value": null,
      "hide": true,
      "valueSets": [
        { "value": "Grade I", "code": "1" },
        { "value": "Grade II", "code": "2" },
        { "value": "Grade III", "code": "3" }
      ]
    }
  }
]
```

Control 2 starts hidden (baseline `hide: true`); selecting "Yes" shows it and makes it required; switching back to "No" restores the baseline; `executeValidate()` skips it while hidden.
