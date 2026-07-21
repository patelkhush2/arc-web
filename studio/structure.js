import {CogIcon, DocumentsIcon} from '@sanity/icons'

// Singleton Site Settings + a list of Projects
export const structure = (S) =>
  S.list()
    .title('Content')
    .items([
      S.listItem()
        .title('Site Settings')
        .icon(CogIcon)
        .child(
          S.document()
            .schemaType('settings')
            .documentId('siteSettings')
            .title('Site Settings'),
        ),
      S.divider(),
      S.listItem()
        .title('Projects')
        .icon(DocumentsIcon)
        .child(
          S.documentTypeList('project')
            .title('Projects')
            .defaultOrdering([{field: 'order', direction: 'asc'}]),
        ),
    ])
