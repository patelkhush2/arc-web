export default {
  name: 'project',
  title: 'Project',
  type: 'document',
  fields: [
    {
      name: 'name',
      title: 'Client name',
      type: 'string',
      validation: (r) => r.required(),
    },
    {name: 'service', title: 'Service', type: 'string'},
    {name: 'year', title: 'Year', type: 'string'},
    {name: 'industry', title: 'Industry', type: 'string'},
    {
      name: 'website',
      title: 'Website label (shown on card)',
      type: 'string',
      description: 'e.g. CLIENTWEBSITE.COM',
    },
    {name: 'websiteUrl', title: 'Website URL', type: 'url'},
    {
      name: 'media',
      title: 'Demo reel / photo (fills the dark box)',
      type: 'file',
      options: {accept: 'video/mp4,video/webm,image/*'},
    },
    {
      name: 'order',
      title: 'Display order',
      type: 'number',
      description: 'Lower numbers appear first when cycling projects.',
      initialValue: 1,
    },
  ],
  orderings: [
    {
      title: 'Display order',
      name: 'orderAsc',
      by: [{field: 'order', direction: 'asc'}],
    },
  ],
  preview: {
    select: {title: 'name', subtitle: 'service', order: 'order'},
    prepare({title, subtitle, order}) {
      return {
        title: title || 'Untitled project',
        subtitle: [order != null ? `#${order}` : null, subtitle]
          .filter(Boolean)
          .join(' · '),
      }
    },
  },
}
