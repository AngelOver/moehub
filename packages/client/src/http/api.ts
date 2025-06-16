import type {
  MoehubApiBase,
  MoehubApiCharacter,
  MoehubApiCharacters,
  MoehubApiCollection,
  MoehubApiCollections,
  MoehubApiLogin,
  MoehubApiSeries,
  MoehubApiSettings,
  MoehubApiTags,
  MoehubDataCharacterSubmit,
  MoehubDataCollectionSubmit,
  MoehubDataSettingsSubmit
} from '@moehub/common'
import http, { httpNoCatcher } from './http'

export async function getCharacter(id: number): Promise<MoehubApiCharacter['data']> {
  return (await http.get(`/character/${id}`)).data
}

export async function getCharacters(sortBy?: 'downloadCount' | 'createdAt' | 'order'): Promise<MoehubApiCharacters['data']> {
  const params = sortBy ? { sortBy } : {};
  return (await http.get('/character', { params })).data
}

export function createCharacter(character: MoehubDataCharacterSubmit, md?: string): Promise<MoehubApiBase<201>> {
  return http.post('/character', { ...character, md })
}

export function updateCharacter(id: number, character: MoehubDataCharacterSubmit): Promise<MoehubApiBase<204>> {
  return http.put(`/character/${id}`, character)
}

export function deleteCharacter(id: number): Promise<MoehubApiBase<204>> {
  return http.delete(`/character/${id}`)
}

export function getTags(): Promise<MoehubApiTags> {
  return http.get('/tag')
}

export function getSeries(): Promise<MoehubApiSeries> {
  return http.get('/series')
}

export async function getCollection(id: number): Promise<MoehubApiCollection['data']> {
  return (await http.get(`/collection/${id}`)).data
}

export async function getCollections(): Promise<MoehubApiCollections['data']> {
  return (await http.get('/collection')).data
}

export function createCollection(collection: MoehubDataCollectionSubmit): Promise<MoehubApiBase<201>> {
  return http.post('/collection', collection)
}

export function updateCollection(id: number, collection: MoehubDataCollectionSubmit): Promise<MoehubApiBase<204>> {
  return http.put(`/collection/${id}`, collection)
}

export function deleteCollection(id: number): Promise<MoehubApiBase<204>> {
  return http.delete(`/collection/${id}`)
}

export async function getSettings(): Promise<MoehubApiSettings['data']> {
  return (await http.get('/settings')).data
}

export function updateSettings(settings: MoehubDataSettingsSubmit): Promise<MoehubApiBase<204>> {
  return http.put('/settings', settings)
}

export async function postLogin(email: string, password: string): Promise<MoehubApiLogin['data']> {
  return (await httpNoCatcher.post('/settings/login', { email, password })).data
}

export async function updateLogin(newPassword: string, oldPassword: string): Promise<MoehubApiBase<204>> {
  return await httpNoCatcher.put('/settings/login', { newPassword, oldPassword })
}

export async function getImgs(): Promise<string[]> {
  return (await http.get('/settings/imgs')).data
}

export async function postEmail() {
  return (await http.post('/settings/email')).data
}

export async function getCharacterMd(id: number): Promise<string> {
  return (await http.get(`/character/${id}/md`)).data
}

export function recordCharacterDownload(id: number): Promise<MoehubApiBase<204>> {
  return http.post(`/character/${id}/download`)
}

// 导出相关API
export async function getExportStats(): Promise<{
  totalCharacters: number
  visibleCharacters: number
  lastGenerated: string | null
  fileExists: boolean
  needsRegeneration: boolean
}> {
  return (await http.get('/export/stats')).data
}

export function downloadCharactersJson(): string {
  return `${http.defaults.baseURL}/export/characters.json`
}

export async function regenerateJson(): Promise<{ message: string }> {
  return (await http.get('/export/regenerate')).data
}
