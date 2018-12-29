import { task } from '../task'
import { fs } from '../fs'
import { exec } from '../exec'
import * as path from 'path'
import * as assert from 'assert'

const fixturesDir = `${__dirname}/fixtures`
const snapsDir = `${fixturesDir}/snaps`
const UpdateSnap = process.env.UPDATE_SNAP === '1'

function test(cmd: string) {
  let out = ''
  let snap = ''
  return {
    name: cmd,
    fn: () => assert.equal(out.trim(), snap.trim()),
    async init() {
      let p = await exec(`ts-node ./src/cli.ts --config ${fixturesDir}/${cmd}`).catch(er => er)
      out = p.stdout + p.stderr
      let snapFile = snapsDir + '/' + cmd.replace(/[^\w-]/g, '_')
      if (UpdateSnap) {
        fs.outputFile(snapFile, out)
        out = snap = ''
        return null
      }
      snap = await fs.readFile(snapFile, 'utf8')
    }
  }
}

describe('task', function () {
  this.timeout(1000 * 60 * 10)
  let tests = [
    test(`Foyfile1.ts aa -a 1 -b 1 -d`),
    test(`Foyfile1.ts aa -h`),
    test(`Foyfile1.ts -h`),
    test(`Foyfile1.ts aa -a`),
    test(`Foyfile1.ts aa -a bb`),
    test(`Foyfile1.ts bb`),
    test(`Foyfile1.ts cc`),
    test(`Foyfile1.ts dd`),
    test(`Foyfile1.ts ee`),
    test(`Foyfile1.ts ff`),
    test(`Foyfile1.ts force`),
    test(`Foyfile1.ts notForce`),
    test(`Foyfile1.ts sync`),
    test(`Foyfile1.ts async`),
    test(`Foyfile1.ts resolveOptions -c 123`),
    test(`Foyfile1.ts resolveOptions`),
  ]
  before(async () => {
    if (UpdateSnap) {
      await fs.rmrf(snapsDir)
    }
    await Promise.all(tests.map(t => t.init()))
  })
  for (const cb of tests) {
    if (!cb) continue
    it(cb.name, () => {
      cb.fn()
    })
  }
})
