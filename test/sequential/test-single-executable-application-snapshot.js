'use strict';

require('../common');

const {
  injectAndCodeSign,
  skipIfSingleExecutableIsNotSupported,
} = require('../common/sea');

skipIfSingleExecutableIsNotSupported();

// This tests the snapshot support in single executable applications.

const tmpdir = require('../common/tmpdir');
const { copyFileSync, writeFileSync, existsSync } = require('fs');
const { spawnSync } = require('child_process');
const assert = require('assert');

const configFile = tmpdir.resolve('sea-config.json');
const seaPrepBlob = tmpdir.resolve('sea-prep.blob');
const outputFile = tmpdir.resolve(process.platform === 'win32' ? 'sea.exe' : 'sea');

{
  tmpdir.refresh();

  writeFileSync(tmpdir.resolve('snapshot.js'), '', 'utf-8');
  writeFileSync(configFile, `
  {
    "main": "snapshot.js",
    "output": "sea-prep.blob",
    "useSnapshot": true
  }
  `);

  const child = spawnSync(
    process.execPath,
    ['--experimental-sea-config', 'sea-config.json'],
    {
      cwd: tmpdir.path
    });

  assert.match(
    child.stderr.toString(),
    /snapshot\.js does not invoke v8\.startupSnapshot\.setDeserializeMainFunction\(\)/);
}

{
  tmpdir.refresh();
  const code = `
  const {
    setDeserializeMainFunction,
  } = require('v8').startupSnapshot;
  
  setDeserializeMainFunction(() => {
    console.log('Hello from snapshot');
  });
  `;

  writeFileSync(tmpdir.resolve('snapshot.js'), code, 'utf-8');
  writeFileSync(configFile, `
  {
    "main": "snapshot.js",
    "output": "sea-prep.blob",
    "useSnapshot": true
  }
  `);

  let child = spawnSync(
    process.execPath,
    ['--experimental-sea-config', 'sea-config.json'],
    {
      cwd: tmpdir.path
    });
  assert.match(
    child.stderr.toString(),
    /Single executable application is an experimental feature/);

  assert(existsSync(seaPrepBlob));

  copyFileSync(process.execPath, outputFile);
  injectAndCodeSign(outputFile, seaPrepBlob);

  child = spawnSync(outputFile);
  assert.strictEqual(child.stdout.toString().trim(), 'Hello from snapshot');
  assert.doesNotMatch(
    child.stderr.toString(),
    /Single executable application is an experimental feature/);
}
