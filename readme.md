# yamldir

Scaffold directory structures using a yaml file.

## Usage

Create a `.yamldir.yml` file and execute your scaffold command:

```
npx yamldir [options] [command] [...args]`
```

Note: `yamldir` will traverse upwards from the `cwd` until it finds a `.yamldir.yml` file to use.

## Help

```
npx yamldir --help
```

You can also run `npx yamldir yamldir-example` to print an example `.yamldir.yml` and generate one by piping the output to a file.
