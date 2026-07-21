export default {
  name: 'settings',
  title: 'Site Settings',
  type: 'document',
  // Singleton — only one of these; Studio structure opens it directly
  fields: [
    {
      name: 'available',
      title: 'Available for projects',
      type: 'boolean',
      description:
        'Controls the homepage pill: ON = “AVAILABLE FOR PROJECTS”, OFF = “NOT AVAILABLE FOR PROJECTS”.',
      initialValue: true,
    },
  ],
  preview: {
    prepare() {
      return {title: 'Site Settings'}
    },
  },
}
