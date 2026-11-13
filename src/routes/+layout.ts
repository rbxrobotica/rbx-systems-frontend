// The router leaves a trailing slash alone. The handle hook drops it, in the
// same redirect as any other correction to the address (see
// `$lib/seo/redirects`); left to the router, a request for an earlier host
// with a trailing slash would take two hops.
export const trailingSlash = 'ignore';
