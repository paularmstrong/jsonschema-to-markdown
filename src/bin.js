import fs from 'fs';
import path from 'path';
import schemaToMarkdown from './index.js';
import yargs from 'yargs';

yargs(process.argv.slice(2))
  .command(
    ['$0 <schema>', 'convert <schema>'],
    'Convert a JSONSchema file to Markdown string',
    (yargs) =>
      yargs
        .positional('schema', {
          type: 'string',
          description: 'The JSONSchema to convert to Markdown',
          normalize: true,
        })
        .option('yaml', {
          alias: 'y',
          type: 'boolean',
          default: false,
          description: 'Print examples as yaml',
        }),
    async (argv) => {
      const { schema: schemaFile, yaml } = argv;
      const schema = JSON.parse(fs.readFileSync(path.join(process.cwd(), schemaFile)).toString());
      const markdown = await schemaToMarkdown(schema, { yaml });
      process.stdout.write(markdown);
    }
  )
  .help()
  .alias('h', 'help')
  .parserConfiguration({
    'camel-case-expansion': false,
    'dot-notation': false,
    'strip-aliased': true,
  })
  .scriptName('jsonschema-to-markdown').argv;
