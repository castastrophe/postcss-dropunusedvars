# postcss-dropunusedvars

> Remove or report on unused variable definitions

## Installation

```sh
yarn add -D postcss-dropunusedvars
```

Via the command line:

```sh
postcss -u postcss-dropunusedvars -o dist/index.css src/index.css
```

In the postcss config:

```js
require("postcss-dropunusedvars")({ fix: true })
```

## Options

### `fix`

Type: `boolean`<br>
Default: `false`

Remove unused variables from the output or, if false, report on them to the console.

## Usage

Assuming you have some variables defined and rule(s) that use them:

```css
:root {
  --prefix-component-background-color: blue;
  --prefix-component-width: 10px;
  --prefix-component-height: 10px;
  --prefix-component-size: 10px;
}

.component {
  background-color: var(--prefix-component-background-color);

  width: var(--prefix-component-width);
  height: var(--prefix-component-height);
}
```

The variables that are not used in any rule will be removed from the output:

```css
:root {
  --prefix-component-background-color: blue;
  --prefix-component-width: 10px;
  --prefix-component-height: 10px;
}

.component {
  background-color: var(--prefix-component-background-color);

  width: var(--prefix-component-width);
  height: var(--prefix-component-height);
}
```
