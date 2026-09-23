<script lang="ts">
  import { t } from '$lib/i18n/translate';
  import { localizedPath } from '$lib/seo/alternates';
  import type { Locale } from '$types/content';

  interface Props {
    locale: Locale;
  }

  let { locale }: Props = $props();

  const tr = (key: string) => t(locale, key);
  const href = (pathname: string) => localizedPath(locale, pathname);
  const year = new Date().getFullYear();
</script>

<footer class="footer">
  <div class="footer-inner">
    <div class="footer-brand">
      <img src="/brand/rbx-mark.svg" alt="" width="28" height="28" />
      <span class="footer-name">RBX Systems</span>
      <p class="rbx-caption">{tr('footer.description')}</p>
    </div>

    <div class="footer-columns">
      <div>
        <h3 class="rbx-label">{tr('footer.companyTitle')}</h3>
        <ul>
          <li><a href={href('/')}>{tr('nav.home')}</a></li>
          <li><a href={href('/sobre')}>{tr('nav.about')}</a></li>
          <li><a href={href('/historia')}>{tr('nav.history')}</a></li>
          <li><a href={href('/carreiras')}>{tr('nav.careers')}</a></li>
          <li><a href={href('/leandro-damasio')}>{tr('nav.leandroDamasio')}</a></li>
          <li><a href={href('/caue-alencar')}>{tr('nav.caueAlencar')}</a></li>
          <li><a href={href('/flavia-ribeiro')}>{tr('nav.flaviaRibeiro')}</a></li>
          <li><a href={href('/solucoes')}>{tr('nav.solutions')}</a></li>
          <li><a href={href('/produtos')}>{tr('nav.products')}</a></li>
        </ul>
      </div>
      <div>
        <h3 class="rbx-label">{tr('footer.resourcesTitle')}</h3>
        <ul>
          <li><a href={href('/journal')}>{tr('nav.journal')}</a></li>
          <li><a href="/rss.xml" type="application/rss+xml">RSS</a></li>
          <li><a href={href('/changelog')}>{tr('nav.changelog')}</a></li>
          <li><a href={href('/cases')}>{tr('nav.cases')}</a></li>
          <li><a href={href('/newsroom')}>{tr('nav.newsroom')}</a></li>
          <li><a href={href('/atelier')}>{tr('nav.atelier')}</a></li>
          <li><a href={href('/manifesto')}>{tr('nav.manifesto')}</a></li>
        </ul>
      </div>
      <div>
        <h3 class="rbx-label">{tr('footer.contactTitle')}</h3>
        <ul>
          <li><a href={href('/contato')}>{tr('nav.contact')}</a></li>
          <li>
            <a href="https://github.com/rbxrobotica" target="_blank" rel="noopener noreferrer"
              >GitHub</a
            >
          </li>
          <li>
            <a
              href="https://www.linkedin.com/in/ldamasio/"
              target="_blank"
              rel="noopener noreferrer">LinkedIn</a
            >
          </li>
        </ul>
      </div>
    </div>
  </div>

  <div class="footer-bottom">
    <p class="rbx-caption">
      &copy; {year} RBX Systems. {tr('footer.rights')}
      <a href={href('/legal')}>{tr('nav.legal')}</a>
    </p>
  </div>
</footer>

<style>
  .footer {
    margin-top: auto;
    border-top: 1px solid var(--border);
    background: var(--bg-1);
    padding: var(--s-7) 0 var(--s-5);
  }
  .footer-inner {
    max-width: var(--content-w);
    margin: 0 auto;
    padding: 0 var(--gutter);
    display: grid;
    gap: var(--s-6);
    grid-template-columns: 1fr;
  }
  @media (min-width: 768px) {
    .footer-inner {
      grid-template-columns: 1fr 2fr;
    }
  }
  .footer-brand {
    display: flex;
    flex-direction: column;
    gap: var(--s-2);
  }
  .footer-name {
    font-size: var(--text-xl);
    font-weight: 600;
  }
  .footer-columns {
    display: grid;
    gap: var(--s-5);
    grid-template-columns: repeat(auto-fit, minmax(10rem, 1fr));
  }
  .footer-columns h3 {
    margin-bottom: var(--s-3);
  }
  .footer-columns ul {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: var(--s-2);
  }
  .footer-columns a {
    color: var(--fg-1);
    font-size: var(--text-sm);
  }
  .footer-bottom {
    max-width: var(--content-w);
    margin: var(--s-6) auto 0;
    padding: var(--s-4) var(--gutter) 0;
    border-top: 1px solid var(--border);
  }
</style>
