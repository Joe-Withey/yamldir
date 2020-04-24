const path = require('path')
const fs = require('fs')
const yamlReader = require('yaml-reader')

const { root } = path.parse(process.cwd())
const configFile = '.yamldir.yml'

function getPathToConfigFile(cwd) {
  const pathToFile = path.join(cwd, configFile)

  if (fs.existsSync(pathToFile)) {
    return pathToFile
  } else if (cwd === root) {
    console.error(`Couldn\'t find a ${configFile}`)

    console.log(`
      You can generate an example ${configFile} by executing:
      $ yamldir yamldir-example > ${configFile}
    `)

    process.exit(1)
  }

  return getPathToConfigFile(path.dirname(cwd))
}

function type(val) {
  switch(val) {
    case null:
      return 'Null'
    case undefined:
      return 'Undefined'
    default:
      return Object.prototype.toString.call(val).slice(8, -1)
  }
}

function actionOf(type, payload) {
  return { type, payload }
}

function isObject(x) {
  return type(x) === 'Object'
}

function isString(x) {
  return type(x) === 'String'
}

function isDir(string) {
  return string.endsWith('/')
}

function readObject(object) {
  const [key] = Object.keys(object)
  return [key, object[key]]
} 

function printVars(string, ...args) {
  return string.replace(
    /[^\\]\$(\d)/g,
    (match, index) => match.replace(/\$\d/, args[index])
  )
}

function createActions(config, context) {
  return config.reduce((actions, item) => {
    if (isString(item)) {
      const actionType = isDir(item) ? 'new-dir' : 'new-file'

      return [
        ...actions,
        actionOf(actionType, { name: item, context }),
      ]
    }

    if (isObject(item)) {
      const [key, value] = readObject(item)

      if (isString(value)) {
        return [
          ...actions,
          actionOf(
            'new-file',
            { name: key, contents: printVars(value, context.args), context }
          )
        ]
      }

      if (Array.isArray(value)) {
        return [
          ...actions,
          actionOf('new-dir', { name: key, context }),
          ...createActions(value, { ...context, cwd: path.join(context.cwd, key) })
        ]
      }
    }

    return actions
  }, [])
}

function performActions(actions) {
  actions.forEach(({ type, payload }) => {
    const name = printVars(
      path.join(payload.context.cwd, payload.name),
      payload.context.args
    )

    switch (type) {
      case 'new-dir':
        fs.mkdirSync(name)
        break
      case 'new-file':
        fs.writeFileSync(name, payload.contents || '')
        break
    }
  })
}

function make({ key, dir }, args = []) {
  const cwd = path.join(process.cwd(), dir)

  if (!fs.existsSync(cwd)) {
    console.error(`${cwd} does not exist`)
    process.exit(1)
  }

  const file = getPathToConfigFile(cwd)
  const yaml = yamlReader.read(file)
  const command = yaml[key]

  if (!command) {
    console.error(`${key} structure is not defined in ${configFile}`)
    process.exit(1)
  }

  console.log(`
    Scaffolding...

    command: ${key}
    directory: ${cwd}
    args: ${args}

    ...
  `)

  try {
    const actions = createActions(command, { cwd, args })
    performActions(actions)
  } catch(error) {
    console.error(`
      Operation failed:

      ${error}
    `)
    process.exit(1)
  }

  console.log('Success! :)')
  process.exit(0)
}

module.exports = {
  make
}
