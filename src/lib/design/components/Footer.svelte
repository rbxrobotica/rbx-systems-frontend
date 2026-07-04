<script lang="ts">
  import { _ } from 'svelte-i18n';

  const year = new Date().getFullYear();
</script>

<footer class="footer">
  <div class="footer-inner">
    <div class="footer-brand">
      <img src="/brand/rbx-mark.svg" alt="" width="28" height="28" />
      <span class="footer-name">RBX Systems</span>
      <p class="rbx-caption">{$_('footer.description')}</p>
    </div>

    <div class="footer-columns">
      <div>
        <h3 class="rbx-label">{$_('footer.companyTitle')}</h3>
        <ul>
          <li><a href="/">{$_('nav.home')}</a></li>
          <li><a href="/sobre">{$_('nav.about')}</a></li>
          <li><a href="/leandro-damasio">{$_('nav.leandroDamasio')}</a></li>
          <li><a href="/solucoes">{$_('nav.solutions')}</a></li>
          <li><a href="/produtos">{$_('nav.products')}</a></li>
        </ul>
      </div>
      <div>
        <h3 class="rbx-label">{$_('footer.resourcesTitle')}</h3>
        <ul>
          <li><a href="/journal">{$_('nav.journal')}</a></li>
          <li><a href="/changelog">{$_('nav.changelog')}</a></li>
          <li><a href="/cases">{$_('nav.cases')}</a></li>
          <li><a href="/newsroom">{$_('nav.newsroom')}</a></li>
          <li><a href="/atelier">{$_('nav.atelier')}</a></li>
        </ul>
      </div>
      <div>
        <h3 class="rbx-label">{$_('footer.contactTitle')}</h3>
        <ul>
          <li><a href="/contato">{$_('nav.contact')}</a></li>
          <li><a href="mailto:contact@rbxsystems.ch">contact@rbxsystems.ch</a></li>
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
    <p class="rbx-caption">&copy; {year} RBX Systems. {$_('footer.rights')}</p>
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
