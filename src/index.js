import fs from 'fs';
import gfm from 'remark-gfm';
import inspect from 'unist-util-inspect';
import jsYaml from 'js-yaml';
import path from 'path';
import RefParser from '@apidevtools/json-schema-ref-parser';
import remarkParser from 'remark-parse';
import stringify from 'remark-stringify';
import traverse from 'json-schema-traverse';
import unified from 'unified';
import {
  brk,
  code,
  heading,
  html,
  inlineCode,
  link,
  list,
  listItem,
  paragraph,
  root,
  table,
  tableCell,
  tableRow,
  text,
} from 'mdast-builder';

const processor = unified().use(gfm).use(stringify, {
  fences: true,
  incrementListMarker: true,
});

const markdownParser = unified().use(remarkParser);

const slugger = (input) => input.replace(/^\W/, '').replace(/\W+/g, '-').toLowerCase();
const UndocumentedTypes = ['integer', 'number', 'string', 'boolean', 'array'];

export async function buildMarkdown(schema, { yaml = false } = {}) {
  const deReferencedSchema = await RefParser.dereference(schema);

  const ast = [];
  traverse(deReferencedSchema, {}, (part, pointer, root, parentPointer, parentKeyword, parent) => {
    if (pointer.startsWith('/definitions/') || UndocumentedTypes.includes(part.type)) {
      return;
    }

    const [, ...pointerBits] = pointer.split('/');

    const headingLevel =
      pointerBits.filter((bit) => !isFinite(bit) && !['properties', 'allOf', 'anyOf', 'items'].includes(bit)).length +
      1;

    pointer && ast.push(html(`<a id="${slugger(pointer)}"></a>`));

    if (!part.title) {
      console.warn(`Missing title for ${pointer}`);
      return;
    }

    part.title && ast.push(heading(headingLevel, text(part.title || pointerBits[headingLevel])));
    part.description && ast.push(...(markdownParser.parse(part.description)?.children || []));

    if (part.properties && Object.keys(part.properties).length) {
      ast.push(text(`The ${parent?.title?.toLowerCase() || 'configuration'} accepts the following properties`));

      const noneRequired = !part.required || part.required.length === 0;
      const noDefaults = !Object.values(part.properties).some((prop) => !!prop.default);

      ast.push(
        table(
          ['left', 'left', 'left', 'right', 'right'],
          [
            tableRow(
              [
                tableCell(text('property')),
                tableCell(text('type')),
                tableCell(text('description')),
                !noDefaults && tableCell(text('default')),
                !noneRequired && tableCell(text('required')),
              ].filter(Boolean)
            ),
            ...Object.keys(part.properties).map((key) => {
              const { default: defaultValue, description, title, type } = part.properties[key];
              return tableRow(
                [
                  tableCell(inlineCode(key)),
                  tableCell(getTypeValue(part.properties[key])),
                  tableCell(
                    type !== 'object'
                      ? title
                        ? text(title)
                        : markdownParser.parse(description || '')
                      : [text('see '), link(`#${slugger(`${pointer}/properties/${key}`)}`, key, text(key))]
                  ),
                  !noDefaults && tableCell(defaultValue ? inlineCode(JSON.stringify(defaultValue)) : text('')),
                  !noneRequired && tableCell(text((part.required || []).includes(key) ? '✅' : '')),
                ].filter(Boolean)
              );
            }),
          ]
        )
      );
    }

    if (part.additionalProperties && part.additionalProperties.type !== 'object') {
      const prop = part.additionalProperties;
      ast.push(
        table(
          ['left', 'left', 'right'],
          [
            tableRow(
              [
                tableCell(text('type')),
                tableCell(text('description')),
                prop.default && tableCell(text('default')),
              ].filter(Boolean)
            ),
            tableRow(
              [
                tableCell(getTypeValue(prop)),
                tableCell(prop.title ? text(prop.title) : markdownParser.parse(prop.description || '')),
                prop.default && tableCell(inlineCode(JSON.stringify(prop.default))),
              ].filter(Boolean)
            ),
          ]
        )
      );
    }

    if (part.examples) {
      ast.push(heading(headingLevel + 1, text('Examples')));
      ast.push(
        ...part.examples.map((example) => {
          return yaml ? code('yaml', jsYaml.dump(example)) : code('json', JSON.stringify(example, null, 2));
        })
      );
    }
  });

  return root(ast);
}

export default async function schemaToMarkdown(schema, options) {
  const ast = await buildMarkdown(schema, options);
  return processor.stringify(root(ast));
}

function getTypeValue(node) {
  const { enum: possibleValues, type, items, anyOf, allOf, oneOf } = node;

  if (type === 'array') {
    return inlineCode(`Array<${items.enum ? items.enum.join('|') : items.type}>`);
  }
  if (type === 'string' && possibleValues) {
    return oneOfValue(possibleValues);
  }
  if (type) {
    return inlineCode(type);
  }

  if (anyOf) {
    return anyOfValue(anyOf);
  }

  if (oneOf) {
    return oneOfValue(oneOf);
  }

  return text('');
}

function anyOfValue(value) {
  return [
    text('any of '),
    ...value.reduce((memo, node, i) => {
      memo.push(typeof node === 'string' ? inlineCode(`'${node}'`) : getTypeValue(node));
      if (i < value.length - 1) {
        memo.push(i === value.length - 2 ? text(', or') : text(','));
      }
      return memo;
    }, []),
  ];
}

function oneOfValue(value) {
  return [
    text('one of '),
    ...value.reduce((memo, node, i) => {
      memo.push(typeof node === 'string' ? inlineCode(`'${node}'`) : getTypeValue(node));
      if (i < value.length - 1) {
        memo.push(i === value.length - 2 ? text(', or') : text(','));
      }
      return memo;
    }, []),
  ];
}
