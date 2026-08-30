import * as localStorageAdapter from './localStorage'

export const repository = {
  /** Promise<Link[]> */
  getLinks: () => localStorageAdapter.getLinks(),
  /** Promise<Link|null> */
  getLink: (id) => localStorageAdapter.getLink(id),
  /** Promise<Link> — Link: {id,url,title,description,image,categoryId,status,createdAt} */
  addLink: (data) => localStorageAdapter.addLink(data),
  /** Promise<Link|null> */
  updateLink: (id, patch) => localStorageAdapter.updateLink(id, patch),
  /** Promise<void> */
  deleteLink: (id) => localStorageAdapter.deleteLink(id),
  /** Promise<Category[]> — Category: {id,name}; seeds defaults on first call */
  getCategories: () => localStorageAdapter.getCategories(),
  /** Promise<Category> */
  addCategory: (name) => localStorageAdapter.addCategory(name),
}
