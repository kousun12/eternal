// @flow

import type { Node } from 'react';
type TypeMetadata = { required: boolean };
export type TypeMap = { [string]: TypeImpl };
type EnumSchema = { [string]: string };
type AttributeSchema = TypeMap | EnumSchema;
// this is facetious, but we need something like it
type TypeType = 'primitive' | 'enum' | 'complex';

const defaultMetadata: TypeMetadata = { required: false };

export interface AttributeType {
  /**
   * Runtime unique id. Maybe we should just use name.
   */
  id: Symbol;
  /**
   * name of this type. as convention, use all lowercase for primitives and PascalCase for complex
   */
  name: string;

  typeDescription: Node;

  /**
   * We are overloading this type concept for the moment and putting the attribute description in this field.
   * Usually done through {@link TypeImpl.desc} in an attribute type schema.
   */
  description: ?Node;
  /**
   * the attribute schema that describes this type. null for primitives
   */
  schema: ?AttributeSchema;

  /**
   * Bag for random type configuration
   */
  metadata: TypeMetadata;

  /**
   * The type of this type. A questionable abstraction, but convenient to support enums
   */
  type: TypeType;

  defaultValue: any;

  parse: any => any;
  serialize: ?(any) => any;
}

export class TypeImpl implements AttributeType {
  id: Symbol;
  name: string;
  description: ?Node;
  typeDescription: Node;
  schema: ?AttributeSchema;
  metadata: TypeMetadata;
  type: TypeType;
  defaultValue: any;
  parse: any => any;
  serialize: ?(any) => any;

  constructor(data: AttributeType) {
    this.id = data.id;
    this.name = data.name;
    this.schema = data.schema;
    this.metadata = data.metadata;
    this.type = data.type;
    this.defaultValue = data.defaultValue;
    this.description = data.description || data.typeDescription;
    this.parse = data.parse;
    this.typeDescription = data.typeDescription;
    this.serialize = data.serialize;
  }

  /**
   * Describe this type. See note about how desc is being overloaded as attribute.
   * @param d - description of this attribute
   * @returns {TypeImpl} - A new instance of this type, with the description
   */
  desc = (d: Node): TypeImpl => new TypeImpl({ ...this, description: d });
  aliased = (name: string, typeDescription?: Node): TypeImpl =>
    typeDescription
      ? new TypeImpl({ ...this, name, typeDescription })
      : new TypeImpl({ ...this, name });
  meta = (metadata: Object): TypeImpl => new TypeImpl({ ...this, metadata });
  isA = (t: AttributeType) => t.id === this.id;
  isPrimitive = (): boolean => this.type === 'primitive';
  isComplex = (): boolean => this.type === 'complex';

  /**
   * See comment about how type / desc is being overloaded above
   */
  hasHelpInfo = (): boolean => this.description !== this.typeDescription;
}

export class TypeBuilder {
  name: string;
  schema: ?AttributeSchema;
  metadata: TypeMetadata;
  type: TypeType;
  defaultValue: any;
  description: ?Node;
  typeDescription: Node;
  serializer: ?(any) => any;
  parse: any => any = v => v;

  constructor(name: string) {
    this.name = name;
  }

  withMetadata(metadata: TypeMetadata): TypeBuilder {
    if (this.metadata) {
      throw Error(
        "you likely don't mean to replace the metadata you are building; use `withMetadataAttr`."
      );
    }
    this.metadata = metadata;
    return this;
  }

  withMetadataAttr(attr: $Shape<TypeMetadata>): TypeBuilder {
    this.metadata = { ...this.metadata, ...attr };
    return this;
  }

  withParser(parser: any => any): TypeBuilder {
    this.parse = parser;
    return this;
  }

  withSerializer(serializer: any => any): TypeBuilder {
    this.serializer = serializer;
    return this;
  }

  withType(type: TypeType): TypeBuilder {
    this.type = type;
    return this;
  }

  withSchema(schema: AttributeSchema): TypeBuilder {
    this.schema = schema;
    return this;
  }

  havingDefault(val: any): TypeBuilder {
    this.defaultValue = val;
    return this;
  }

  desc(des: Node): TypeBuilder {
    this.typeDescription = des;
    return this;
  }

  validate = () => {
    const { name, schema, type } = this;
    if (!name) throw Error('need a name');
    // we may want to just key on id and allow duplicate names
    if (name in typeRegistry) throw Error('already exists');
    if (!type) throw Error('need a type');
    if (type === 'primitive') {
      if (schema) throw Error('primitives cannot have schemas');
    } else {
      // again, this type is a cop-out but practically useful
      if (name !== 'object' && !schema) throw Error('non primitives need a schema');
      // may want to validate enum / complex schema shape
    }
  };

  build(): TypeImpl {
    this.validate();
    const t = new TypeImpl({
      id: Symbol(),
      name: this.name,
      schema: this.schema,
      metadata: this.metadata || defaultMetadata,
      type: this.type,
      defaultValue: this.defaultValue,
      description: this.description,
      typeDescription: this.typeDescription,
      parse: this.parse,
      serialize: this.serializer,
    });
    registerType(t);
    return t;
  }
}

const typeRegistry: TypeMap = {};
window.Types = typeRegistry;

function registerType(t: TypeImpl) {
  typeRegistry[t.name] = t;
}
