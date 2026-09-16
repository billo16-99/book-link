export const favoriteOf = (link) => link?.favorite === true
export const notesOf = (link) => (typeof link?.notes === 'string' ? link.notes : '')