// @flow
import React from 'react';
import { TypeBuilder } from 'models/AttributeType';
import type { TypeMap } from 'models/AttributeType';

const primitiveSerializer: any => any = v => v;
// Primitives
const number = new TypeBuilder('number')
  .withType('primitive')
  .desc(
    <span>
      A basic <code>number</code> type
    </span>
  )
  .havingDefault(0)
  .withParser(v => (typeof v === 'string' ? parseInt(v) : v))
  .withSerializer(primitiveSerializer)
  .build();

const string = new TypeBuilder('string')
  .withType('primitive')
  .desc(
    <span>
      A basic <code>string</code> type
    </span>
  )
  .havingDefault('')
  .withParser(v => (typeof v === 'object' ? JSON.stringify(v) : String(v)))
  .withSerializer(a => (typeof a === 'object' ? JSON.stringify(a) : String(a)))
  .build();

const boolean = new TypeBuilder('boolean')
  .withType('primitive')
  .desc(
    <span>
      A basic <code>boolean</code> type
    </span>
  )
  .havingDefault(false)
  .withParser(Boolean)
  .withSerializer(primitiveSerializer)
  .build();

const date = new TypeBuilder('date')
  .withType('primitive')
  .desc(
    <span>
      A basic <code>date</code> type
    </span>
  )
  .havingDefault(new Date())
  .withSerializer(v => (v instanceof Date ? v.toISOString() : undefined))
  .withParser(v => (typeof v === 'string' ? Date.parse(v) : v))
  .build();

const any = new TypeBuilder('any')
  .withType('primitive')
  .desc('This can be anything')
  .havingDefault(undefined)
  .build();

const time = new TypeBuilder('time')
  .withType('primitive')
  .desc(
    <>
      <div>Time can be described in a number of ways:</div>
      <ul>
        <li>Numbers, which will be taken literally as the time (in seconds).</li>
        <li>Notation, ("4n", "8t") describes time in BPM and time signature relative values.</li>
        <li>
          TransportTime, ("4:3:2") will also provide tempo and time signature relative times in the
          form BARS:QUARTERS:SIXTEENTHS.
        </li>
        <li>Frequency, ("8hz") is converted to the length of the cycle in seconds.</li>
        <li>
          Now-Relative, ("+1") prefix any of the above with "+" and it will be interpreted as "the
          current time plus whatever expression follows".
        </li>
        <li>
          Expressions, ("3:0 + 2 - (1m / 7)") any of the above can also be combined into a
          mathematical expression which will be evaluated to compute the desired time.
        </li>
        <li>
          No Argument, for methods which accept time, no argument will be interpreted as "now" (i.e.
          the currentTime).
        </li>
      </ul>
    </>
  )
  .withSerializer(primitiveSerializer)
  .havingDefault(0)
  .build();

// kinda bogus, but useful for now
const object = new TypeBuilder('object')
  .withType('complex')
  .desc('An object with arbitrary keys and values')
  .havingDefault(undefined)
  .withParser(v => (typeof v === 'string' ? JSON.parse(v) : v))
  .build();

const Vec2 = new TypeBuilder('Vec2')
  .withSchema(({ x: number, y: number }: TypeMap))
  .withType('complex')
  .desc(
    <span>
      A 2D Vector with keys <code>x</code> and <code>y</code>
    </span>
  )
  .havingDefault({ x: 0, y: 0 })
  .withSerializer(v => {
    if (
      typeof v === 'object' &&
      typeof parseInt(v.x) === 'number' &&
      typeof parseInt(v.y) === 'number'
    ) {
      return JSON.stringify({ x: v.x, y: v.y });
    }
    return undefined;
  })
  .withParser(v => (typeof v === 'string' ? JSON.parse(v) : v))
  .build();

const Vec3 = new TypeBuilder('Vec3')
  .withSchema(({ x: number, y: number, z: number }: TypeMap))
  .withType('complex')
  .desc(
    <span>
      A 3D Vector with keys <code>x</code>, <code>y</code>, and <code>z</code>
    </span>
  )
  .havingDefault({ x: 0, y: 0, z: 0 })
  .withSerializer(v => {
    if (
      typeof v === 'object' &&
      typeof parseInt(v.x) === 'number' &&
      typeof parseInt(v.y) === 'number' &&
      typeof parseInt(v.z) === 'number'
    ) {
      return JSON.stringify({ x: v.x, y: v.y, z: v.z });
    }
    return undefined;
  })
  .withParser(v => (typeof v === 'string' ? JSON.parse(v) : v))
  .build();

/**
 * using {@link TypeBuilder.build} will register types in the global registry automatically
 */
// noinspection JSUnusedGlobalSymbols
export { number, string, boolean, date, any, time, object, Vec2, Vec3 };
