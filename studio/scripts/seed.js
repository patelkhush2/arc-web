/**
 * Seeds Site Settings + a starter project matching content/site.json.
 * Run from studio/: npm run seed
 */
import {getCliClient} from 'sanity/cli'

const client = getCliClient({apiVersion: '2024-01-01'})

const settings = {
  _id: 'siteSettings',
  _type: 'settings',
  available: true,
}

const project = {
  _id: 'project-starter',
  _type: 'project',
  name: 'CLIENT NAME',
  service: 'BRAND IDENTITY',
  year: '2026',
  industry: 'AEROSPACE',
  website: 'CLIENTWEBSITE.COM',
  websiteUrl: 'https://clientwebsite.com',
  order: 1,
}

async function seed() {
  await client.createOrReplace(settings)
  await client.createOrReplace(project)
  console.log('Seeded Site Settings (available: true) and starter project.')
}

seed().catch((err) => {
  console.error(err)
  process.exit(1)
})
