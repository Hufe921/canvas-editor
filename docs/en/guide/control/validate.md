# Control Validation

Validates control content with **required, length, number, date, and checkbox-count** rules. Rules live on `control.validation`; `control.required` marks a control as required.

## Data Structure

```ts
interface IControlValidation {
  minLength?: number // TEXT
  maxLength?: number
  pattern?: string // RegExp
  min?: number // NUMBER
  max?: number
  integer?: boolean
  precision?: number // Decimal places
  minDate?: string // DATE: 'YYYY-MM-DD' or 'today'
  maxDate?: string
  minChecked?: number // CHECKBOX
  maxChecked?: number
  message?: string // Custom error message
}
```

`required` semantics: select/radio need a selection, checkbox needs at least one item, text/number/date need non-empty text.

Example:

```json
{
  "conceptId": "name",
  "type": "text",
  "value": null,
  "required": true,
  "validation": { "minLength": 2, "maxLength": 20 },
  "preText": "Name: "
}
```

Error messages are internationalized by default (the `validate` node of the language pack, with `{min}` / `{max}` / `{count}` / `{date}` / `{precision}` parameter interpolation) and can be overridden via `register.langMap`; a custom `validation.message` takes the highest priority.

::: tip Cascade & validation interplay
**Hidden controls are skipped by validation** — a required control hidden by a cascade is automatically exempted.
:::

## executeValidate

Feature: validate controls (required and type-specific rules). Cascades are flushed synchronously before validation; failed controls are highlighted with errorBackgroundColor

Usage:

```javascript
instance.command.executeValidate(options?: IValidateOption)
```

IValidateOption:

```typescript
interface IValidateOption {
  zone?: EditorZone // Zone to validate (header, main, footer). default: entire document
  errorBackgroundColor?: string // Error background color. default: control option errorBackgroundColor (#FFECE8)
}
```

Return value:

```typescript
interface IControlValidateResult {
  controlId: string
  conceptId?: string
  control: IControl // Full config of the failed control (shallow copy), e.g. preText/placeholder
  errors: string[] // e.g. ['This field is required', 'Maximum length is 100']
}

const results: IControlValidateResult[] = instance.command.executeValidate()
```

## executeClearValidate

Feature: Clear validation error highlights

Usage:

```javascript
instance.command.executeClearValidate()
```
