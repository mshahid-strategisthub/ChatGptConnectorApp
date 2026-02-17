import * as z from 'zod/v4';

/**
 * Convert JSON Schema properties to Zod raw shape for tool input validation.
 */
export function jsonSchemaToZodRawShape(schema) {
  const shape = {};
  const props = schema?.properties && typeof schema.properties === 'object' ? schema.properties : {};
  const required = Array.isArray(schema?.required) ? schema.required : [];

  for (const [key, prop] of Object.entries(props)) {
    const type = prop?.type;
    let field;
    switch (type) {
      case 'string':
        field = z.string();
        break;
      case 'number':
        field = z.number();
        break;
      case 'integer':
        field = z.number().int();
        break;
      case 'boolean':
        field = z.boolean();
        break;
      case 'array':
        field = z.array(z.any());
        break;
      case 'object':
      default:
        field = z.any();
        break;
    }
    if (typeof prop?.description === 'string' && prop.description.trim()) {
      field = field.describe(prop.description);
    }
    if (!required.includes(key)) {
      field = field.optional();
    }
    shape[key] = field;
  }
  return shape;
}
