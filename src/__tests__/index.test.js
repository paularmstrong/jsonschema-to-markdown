import schemaToMarkdown, { buildMarkdown } from '../index.js';

describe('schemaToMarkdown', () => {
  test('outputs a markdown string', async () => {
    const output = await schemaToMarkdown({
      type: 'object',
      title: 'Food',
      properties: { tacos: { type: 'boolean' } },
    });

    expect(output).toMatchInlineSnapshot(`
      "# Food

      The configuration accepts the following properties

      | property | type      | description |
      | :------- | :-------- | :---------- |
      | \`tacos\`  | \`boolean\` |             |
      "
    `);
  });

  test('examples default to JSON', async () => {
    const output = await schemaToMarkdown({
      type: 'object',
      properties: {
        tacos: { type: 'string' },
      },
      title: 'Tacos',
      examples: [
        {
          tacos: 'are delicious',
        },
      ],
    });
    expect(output).toMatchInlineSnapshot(`
      "# Tacos

      The configuration accepts the following properties

      | property | type     | description |
      | :------- | :------- | :---------- |
      | \`tacos\`  | \`string\` |             |

      ## Examples

      \`\`\`json
      {
        \\"tacos\\": \\"are delicious\\"
      }
      \`\`\`
      "
    `);
  });

  test('examples can be YAML', async () => {
    const output = await schemaToMarkdown(
      {
        type: 'object',
        properties: {
          tacos: { type: 'string' },
        },
        title: 'Tacos',
        examples: [
          {
            tacos: 'are delicious',
          },
        ],
      },
      { yaml: true }
    );
    expect(output).toMatchInlineSnapshot(`
      "# Tacos

      The configuration accepts the following properties

      | property | type     | description |
      | :------- | :------- | :---------- |
      | \`tacos\`  | \`string\` |             |

      ## Examples

      \`\`\`yaml
      tacos: are delicious

      \`\`\`
      "
    `);
  });
});

describe('buildMarkdown', () => {
  test('builds and AST of the schema to markdown', async () => {
    const ast = await buildMarkdown({
      type: 'object',
      title: 'Food',
      properties: { tacos: { type: 'boolean' } },
    });
    expect(ast).toMatchInlineSnapshot(`
      Object {
        "children": Array [
          Object {
            "children": Array [
              Object {
                "type": "text",
                "value": "Food",
              },
            ],
            "depth": 1,
            "type": "heading",
          },
          Object {
            "type": "text",
            "value": "The configuration accepts the following properties",
          },
          Object {
            "align": Array [
              "left",
              "left",
              "left",
              "right",
              "right",
            ],
            "children": Array [
              Object {
                "children": Array [
                  Object {
                    "children": Array [
                      Object {
                        "type": "text",
                        "value": "property",
                      },
                    ],
                    "type": "tableCell",
                  },
                  Object {
                    "children": Array [
                      Object {
                        "type": "text",
                        "value": "type",
                      },
                    ],
                    "type": "tableCell",
                  },
                  Object {
                    "children": Array [
                      Object {
                        "type": "text",
                        "value": "description",
                      },
                    ],
                    "type": "tableCell",
                  },
                ],
                "type": "tableRow",
              },
              Object {
                "children": Array [
                  Object {
                    "children": Array [
                      Object {
                        "type": "inlineCode",
                        "value": "tacos",
                      },
                    ],
                    "type": "tableCell",
                  },
                  Object {
                    "children": Array [
                      Object {
                        "type": "inlineCode",
                        "value": "boolean",
                      },
                    ],
                    "type": "tableCell",
                  },
                  Object {
                    "children": Array [
                      Object {
                        "children": Array [],
                        "position": Object {
                          "end": Object {
                            "column": 1,
                            "line": 1,
                            "offset": 0,
                          },
                          "start": Object {
                            "column": 1,
                            "line": 1,
                            "offset": 0,
                          },
                        },
                        "type": "root",
                      },
                    ],
                    "type": "tableCell",
                  },
                ],
                "type": "tableRow",
              },
            ],
            "type": "table",
          },
        ],
        "type": "root",
      }
    `);
  });

  test('does not include objects with no title', async () => {
    const ast = await buildMarkdown({
      type: 'object',
      properties: { tacos: { type: 'boolean' } },
    });
    expect(ast).toEqual({ children: [], type: 'root' });
  });
});
