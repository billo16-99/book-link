import * as localStorageAdapter from './localStorage'
import * as supabaseAdapter from './supabase'

function hasSupabase() {
  return Boolean(import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY)
}

function active() {
  return hasSupabase() ? supabaseAdapter : localStorageAdapter
}

export const repository = {
  /** Promise<Link[]> */
  getLinks: () => active().getLinks(),
  /** Promise<Link|null> */
  getLink: (id) => active().getLink(id),
  /** Promise<Link> — Link: {id,url,title,description,image,categoryId,status,createdAt} */
  addLink: (data) => active().addLink(data),
  /** Promise<Link|null> */
  updateLink: (id, patch) => active().updateLink(id, patch),
  /** Promise<void> */
  deleteLink: (id) => active().deleteLink(id),
  /** Promise<Category[]> — Category: {id,name}; seeds defaults on first call */
  getCategories: () => active().getCategories(),
  /** Promise<Category> */
  addCategory: (name) => active().addCategory(name),
  /** Promise<{name: string}> */
  getProfile: () => active().getProfile(),
  /** Promise<void> */
  saveProfile: (profile) => active().saveProfile(profile),
}