# 🧅 Gleam plugin to bun runtime.

[Gleam](https://gleam.run/) language plugin to [bun](https://bun.com/) runtime.

> This can uses with [bunup](https://bunup.dev/).

##  Config

[Bun init](https://bun.com/docs/quickstart):

```sh
bun init my-app
cd my-app
```

Now, create directory `<roo>/bin` and files:

- `dist.js`: Bundle `src/index.js`into `dist/`.
- `serve.js`: Serve on `:3000` directory `dist/`.

Follow file contents:

- Bun build:

```js
import gleam from "bun-plugin-gleam";

Bun.build({
  entry: ["src/index.js"],
  out: "./dist",
  plugins: [gleam({ force: true })]
});
```

- Bun server:

> required before run `bun run dist.js`

```js
import gleam from "bun-plugin-gleam";

Bun.serve({
  port: 3000,
  plugins: [gleam({ log: "debug", force: true })],
  routes: {
    "/": function() {
      return new Response('Bun plugin gleam!');
    },
  }
});
```

## 🌸 Options

```js
import gleam from "bun-plugin-gleam";

Bun.build({
    gleam({
      // gleam root dir project
      cwd: ".", // process.cwd() is default
      // gleam binary path
      bin: "gleam",
      log: {
        // "info" | "debug" | "trace" | "none"
        level: "info",
        // if put date and time
        time: true,
      },
      build: {
        // force build, default not exec gleam build
        force: true,
        // gleam build arg to break on warnings
        warningsAsErrors: true,
        // gleam build arg to show or not cmd output
        noPrintProgress: false,
      },
    } as GleamPlugin);
});
```

## 🧪 Demo

- [bun-plugin-gleam-demo](https://github.com/gleam-br/bun-plugin-gleam-demo)
- [bunup-plugin-gleam-demo](https://github.com/gleam-br/bunup-plugin-gleam-demo)
- [vite-plugin-gleam-demo](https://github.com/gleam-br/vite-plugin-gleam-demo)
- [vite-lustre-plugin-gleam-demo](https://github.com/gleam-br/vite-lustre-plugin-gleam-demo)

## 🌄 Roadmap

- [ ] Unit tests
- [ ] More docs
- [ ] GH workflow
  - [ ] test
  - [x] build
  - [x] changelog & issue to doc
  - [x] ~~auto publish~~ manual publish
    - [x] `gleam publish`
- [ ] Pure gleam code
