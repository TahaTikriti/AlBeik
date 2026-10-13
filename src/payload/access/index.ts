import type { Access } from 'payload'

export const anyone: Access = () => true

export const authenticated: Access = ({ req }) => Boolean(req.user)

/**
 * Visitors see published documents only; editors see drafts too. Payload
 * returns never-published drafts unless access control filters them, so the
 * public site relies on this (queries pass `overrideAccess: false`).
 */
export const publishedOrAuthenticated: Access = ({ req }) =>
  req.user ? true : { _status: { equals: 'published' } }
